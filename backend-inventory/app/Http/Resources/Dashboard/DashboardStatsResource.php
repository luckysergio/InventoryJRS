<?php

namespace App\Http\Resources\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardStatsResource extends JsonResource
{
    public function toArray(Request $request): array
{
    $resource = $this->resource;
    
    return [
        'period' => $resource['period'] ?? 'daily',
        'range' => $resource['range'] ?? [],
        'cached_at' => $resource['cached_at'] ?? null,

        'metrics' => [
            'revenue' => [
                'current' => (int) ($resource['metrics']['revenue']['current'] ?? 0),
                'previous' => (int) ($resource['metrics']['revenue']['previous'] ?? 0),
                'growth' => round((float) ($resource['metrics']['revenue']['growth'] ?? 0), 1),
            ],
            'orders' => [
                'current' => (int) ($resource['metrics']['orders']['current'] ?? 0),
                'previous' => (int) ($resource['metrics']['orders']['previous'] ?? 0),
                'growth' => round((float) ($resource['metrics']['orders']['growth'] ?? 0), 1),
            ],
            'customers' => [
                'total' => (int) ($resource['metrics']['customers']['total'] ?? 0),
                'active' => (int) ($resource['metrics']['customers']['active'] ?? 0),
                'new' => (int) ($resource['metrics']['customers']['new'] ?? 0),
            ],
            'products' => [
                'total_sold' => (int) ($resource['metrics']['products']['total_sold'] ?? 0),
                'low_stock' => (int) ($resource['metrics']['products']['low_stock'] ?? 0),
            ],
        ],

        'top_customers' => $this->formatTopCustomers($resource['top_customers'] ?? []),
        'top_products' => $this->formatTopProducts($resource['top_products'] ?? []),
        'transaction_by_type' => $resource['transaction_by_type'] ?? [],
        'sales_analytics' => $resource['sales_analytics'] ?? [],

        'production' => [
            'antri' => (int) ($resource['production']['antri'] ?? 0),
            'produksi' => (int) ($resource['production']['produksi'] ?? 0),
            'belum_dibuat' => (int) ($resource['production']['belum_dibuat'] ?? 0),
        ],

        'transaksi_harian_aktif' => (int) ($resource['transaksi_harian_aktif'] ?? 0),
        'transaksi_pesanan_aktif' => (int) ($resource['transaksi_pesanan_aktif'] ?? 0),
        'customer_belum_lunas' => (int) ($resource['customer_belum_lunas'] ?? 0),

        'chart_months' => (int) ($resource['chart_months'] ?? 6),
        
        // ✅ NEW: Login stats
        'login_stats' => $resource['login_stats'] ?? [
            'today' => [
                'total_attempts' => 0,
                'successful' => 0,
                'failed' => 0,
                'success_rate' => 0,
                'unique_ips' => 0,
                'unique_users' => 0,
            ],
            'last_activity' => null,
            'cached_at' => null,
        ],
    ];
}

    /**
     * ✅ Helper: safely get value dari array ATAU stdClass.
     * Fallback defensive jika service layer belum cast ke array.
     *
     * @param array|object $item Data source (array atau stdClass)
     * @param string $key Key yang ingin diambil
     * @param mixed $default Default value jika key tidak ditemukan
     * @return mixed Value yang ditemukan atau default
     */
    private function safeGet(array|object $item, string $key, mixed $default = null): mixed
    {
        if (is_array($item)) {
            return $item[$key] ?? $default;
        }
        if (is_object($item)) {
            return $item->{$key} ?? $default;
        }
        return $default;
    }

    private function formatTopCustomers(array $customers): array
    {
        if (empty($customers)) {
            return [];
        }

        return collect($customers)->map(function ($c, $index) {
            return [
                'rank' => $index + 1,
                'id' => $this->safeGet($c, 'id'),
                'name' => $this->safeGet($c, 'name', 'Unknown'),
                'phone' => $this->safeGet($c, 'phone'),
                'total_transactions' => (int) $this->safeGet($c, 'total_transactions', 0),
                'total_spent' => (int) $this->safeGet($c, 'total_spent', 0),
            ];
        })->values()->toArray();
    }

    private function formatTopProducts(array $products): array
    {
        if (empty($products)) {
            return [];
        }

        return collect($products)->map(function ($p, $index) {
            $jenis = (string) $this->safeGet($p, 'jenis', '');
            $type = (string) $this->safeGet($p, 'type', '');
            $bahan = (string) $this->safeGet($p, 'bahan', '');
            $ukuran = (string) $this->safeGet($p, 'ukuran', '');

            return [
                'rank' => $index + 1,
                'id' => $this->safeGet($p, 'id'),
                'kode' => $this->safeGet($p, 'kode', '-'),
                'nama' => trim(implode(' ', array_filter([$jenis, $type, $bahan, $ukuran]))),
                'jenis' => $jenis ?: null,
                'type' => $type ?: null,
                'bahan' => $bahan ?: null,
                'ukuran' => $ukuran ?: null,
                'total_qty' => (int) $this->safeGet($p, 'total_qty', 0),
                'total_revenue' => (int) $this->safeGet($p, 'total_revenue', 0),
            ];
        })->values()->toArray();
    }
}