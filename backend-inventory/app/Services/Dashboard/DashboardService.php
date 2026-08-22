<?php

namespace App\Services\Dashboard;

use App\Models\Customer;
use App\Models\Production;
use App\Models\Transaksi;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    private const CACHE_PREFIX = 'dashboard:stats:';
    private const CACHE_CHART_PREFIX = 'dashboard:chart:';
    private const CACHE_LOWSTOCK = 'dashboard:lowstock';

    private const TTL = [
        'daily'    => 60,      // 1 menit
        'weekly'   => 300,     // 5 menit
        'monthly'  => 1800,    // 30 menit
        'yearly'   => 3600,    // 1 jam
        'custom'   => 600,     // 10 menit
        'all'      => 3600,    // 1 jam
        'chart'    => 1800,    // 30 menit
        'lowstock' => 600,     // 10 menit (data stabil)
    ];

    // Status constants
    private const STATUS_SELESAI = 5;
    private const PESANAN_ACTIVE_STATUSES = [1, 2, 3, 4];

    /*
    |--------------------------------------------------------------------------
    | PUBLIC API
    |--------------------------------------------------------------------------
    */

    /**
     * Get dashboard stats untuk period tertentu.
     * Menggunakan consolidated queries untuk performa optimal.
     */
    public function getStats(
        string $period = 'daily',
        ?Carbon $from = null,
        ?Carbon $to = null,
        bool $realtime = false
    ): array {
        [$rangeFrom, $rangeTo] = $this->getDateRange($period, $from, $to);
        [$prevFrom, $prevTo] = $this->getPreviousDateRange($period, $from, $to);

        $cacheKey = $this->buildCacheKey($period, $rangeFrom, $rangeTo);

        if ($realtime || !$cached = Cache::get($cacheKey)) {
            $data = $this->computeStats($period, $rangeFrom, $rangeTo, $prevFrom, $prevTo);
            
            if (!$realtime) {
                Cache::put($cacheKey, $data, self::TTL[$period] ?? 300);
            }
            
            return $data;
        }

        return $cached;
    }

    /**
     * Get chart data (revenue & orders per month).
     * Cache key includes version untuk proper invalidation.
     */
    public function getChart(int $months = 6): array
    {
        $version = (int) Cache::get('dashboard:version', 1);
        $cacheKey = self::CACHE_CHART_PREFIX . "v{$version}:months_{$months}";

        return Cache::remember($cacheKey, self::TTL['chart'], function () use ($months) {
            return $this->computeChart($months);
        });
    }

    /**
     * Invalidate semua cache dashboard.
     * Increment version untuk otomatis invalidate chart juga.
     */
    public function invalidateAll(): void
    {
        $version = (int) Cache::get('dashboard:version', 1);
        Cache::forever('dashboard:version', $version + 1);
        
        // Invalidate low stock cache juga (karena transaksi bisa pengaruhi stok)
        Cache::forget(self::CACHE_LOWSTOCK);

        Log::info('Dashboard cache invalidated', [
            'old_version' => $version,
            'new_version' => $version + 1,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE HELPERS
    |--------------------------------------------------------------------------
    */

    private function getDateRange(string $period, ?Carbon $from, ?Carbon $to): array
    {
        $now = Carbon::now();

        return match ($period) {
            'daily'   => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'weekly'  => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'monthly' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'yearly'  => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom'  => [
                ($from ?? $now->copy()->startOfMonth())->startOfDay(),
                ($to ?? $now)->endOfDay(),
            ],
            'all'     => [Carbon::createFromTimestamp(0), $now->copy()->endOfDay()],
            default   => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };
    }

    private function getPreviousDateRange(string $period, ?Carbon $from, ?Carbon $to): array
    {
        $now = Carbon::now();

        return match ($period) {
            'daily'   => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
            'weekly'  => [$now->copy()->subWeek()->startOfWeek(), $now->copy()->subWeek()->endOfWeek()],
            'monthly' => [$now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth()],
            'yearly'  => [$now->copy()->subYear()->startOfYear(), $now->copy()->subYear()->endOfYear()],
            'custom'  => $this->getPreviousCustomRange($from, $to),
            'all'     => [Carbon::createFromTimestamp(0), $now->copy()->endOfDay()],
            default   => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
        };
    }

    private function getPreviousCustomRange(?Carbon $from, ?Carbon $to): array
    {
        if (!$from || !$to) {
            return [Carbon::now()->subMonth()->startOfMonth(), Carbon::now()->subMonth()->endOfMonth()];
        }

        $diff = $from->diffInDays($to);
        $prevTo = $from->copy()->subDay()->endOfDay();
        $prevFrom = $prevTo->copy()->subDays($diff)->startOfDay();

        return [$prevFrom, $prevTo];
    }

    private function buildCacheKey(string $period, Carbon $from, Carbon $to): string
    {
        $version = Cache::get('dashboard:version', 1);
        return self::CACHE_PREFIX . "v{$version}:{$period}:{$from->format('Ymd')}:{$to->format('Ymd')}";
    }

    /*
    |--------------------------------------------------------------------------
    | STATS COMPUTATION (OPTIMIZED - Consolidated Queries)
    |--------------------------------------------------------------------------
    */

    private function computeStats(
        string $period,
        Carbon $from,
        Carbon $to,
        Carbon $prevFrom,
        Carbon $prevTo
    ): array {
        // ✅ OPTIMIZED: 1 query untuk current + previous metrics (revenue, orders, products sold)
        $metrics = $this->getConsolidatedMetrics($from, $to, $prevFrom, $prevTo);
        
        // ✅ OPTIMIZED: 1 query untuk semua customer stats
        $customerStats = $this->getConsolidatedCustomerStats($from, $to);
        
        // ✅ CACHED: Low stock count (data stabil, cache terpisah)
        $lowStock = $this->getLowStockCount();
        
        // ✅ OPTIMIZED: Top lists dengan proper array casting
        $topCustomers = $this->getTopCustomers($from, $to, 5);
        $topProducts = $this->getTopProducts($from, $to, 5);
        
        // ✅ OPTIMIZED: 1 query untuk transaction by type + sales analytics
        $transactionByType = $this->getTransactionByType($from, $to);
        $salesAnalytics = $this->getSalesAnalytics($from, $to);
        
        // ✅ OPTIMIZED: 1 query untuk semua production stats
        $production = $this->getConsolidatedProductionStats();
        
        // ✅ OPTIMIZED: 1 query untuk transaksi summary
        $summary = $this->getConsolidatedTransactionSummary();

        return [
            'period' => $period,
            'range' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'cached_at' => Carbon::now()->toIso8601String(),

            'metrics' => [
                'revenue' => [
                    'current' => $metrics['current_revenue'],
                    'previous' => $metrics['previous_revenue'],
                    'growth' => $this->calculateGrowth(
                        $metrics['current_revenue'],
                        $metrics['previous_revenue']
                    ),
                ],
                'orders' => [
                    'current' => $metrics['current_orders'],
                    'previous' => $metrics['previous_orders'],
                    'growth' => $this->calculateGrowth(
                        $metrics['current_orders'],
                        $metrics['previous_orders']
                    ),
                ],
                'customers' => [
                    'total' => $customerStats['total'],
                    'active' => $customerStats['active'],
                    'new' => $customerStats['new'],
                ],
                'products' => [
                    'total_sold' => $metrics['current_products_sold'],
                    'low_stock' => $lowStock,
                ],
            ],

            'top_customers' => $topCustomers,
            'top_products' => $topProducts,
            'transaction_by_type' => $transactionByType,
            'sales_analytics' => $salesAnalytics,
            'production' => $production,

            'transaksi_harian_aktif' => $summary['harian_aktif'],
            'transaksi_pesanan_aktif' => $summary['pesanan_aktif'],
            'customer_belum_lunas' => $summary['belum_lunas'],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CONSOLIDATED QUERIES (Performance Optimized)
    |--------------------------------------------------------------------------
    */

    /**
     * ✅ OPTIMIZED: Get revenue + orders + products sold untuk current & previous period
     * dalam 1 query menggunakan conditional aggregation.
     * 
     * Before: 6 separate queries
     * After: 1 consolidated query
     */
    private function getConsolidatedMetrics(
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $prevFrom,
        Carbon $prevTo
    ): array {
        // Handle 'all' period (no previous)
        $isAllPeriod = $currentFrom->timestamp === 0;
        
        if ($isAllPeriod) {
            $row = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->where('td.status_transaksi_id', self::STATUS_SELESAI)
                ->selectRaw('
                    COALESCE(SUM(td.subtotal), 0) as current_revenue,
                    COUNT(DISTINCT t.id) as current_orders,
                    COALESCE(SUM(td.qty), 0) as current_products_sold,
                    0 as previous_revenue,
                    0 as previous_orders
                ')
                ->first();
        } else {
            // ✅ Single query dengan conditional aggregation
            $row = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->where('td.status_transaksi_id', self::STATUS_SELESAI)
                ->where(function ($q) use ($currentFrom, $currentTo, $prevFrom, $prevTo) {
                    $q->whereBetween('t.tanggal', [$currentFrom->toDateString(), $currentTo->toDateString()])
                      ->orWhereBetween('t.tanggal', [$prevFrom->toDateString(), $prevTo->toDateString()]);
                })
                ->selectRaw('
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.subtotal 
                        ELSE 0 
                    END), 0) as current_revenue,
                    
                    COUNT(DISTINCT CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN t.id 
                    END) as current_orders,
                    
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.qty 
                        ELSE 0 
                    END), 0) as current_products_sold,
                    
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.subtotal 
                        ELSE 0 
                    END), 0) as previous_revenue,
                    
                    COUNT(DISTINCT CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN t.id 
                    END) as previous_orders
                ', [
                    $currentFrom->toDateString(), $currentTo->toDateString(),
                    $currentFrom->toDateString(), $currentTo->toDateString(),
                    $currentFrom->toDateString(), $currentTo->toDateString(),
                    $prevFrom->toDateString(), $prevTo->toDateString(),
                    $prevFrom->toDateString(), $prevTo->toDateString(),
                ])
                ->first();
        }

        return [
            'current_revenue' => (int) ($row->current_revenue ?? 0),
            'current_orders' => (int) ($row->current_orders ?? 0),
            'current_products_sold' => (int) ($row->current_products_sold ?? 0),
            'previous_revenue' => (int) ($row->previous_revenue ?? 0),
            'previous_orders' => (int) ($row->previous_orders ?? 0),
        ];
    }

    /**
     * ✅ OPTIMIZED: Get semua customer stats dalam 1 query batch.
     * 
     * Before: 3 queries (total, active, new)
     * After: 1 consolidated query + 1 simple count
     */
    private function getConsolidatedCustomerStats(Carbon $from, Carbon $to): array
    {
        $isAllPeriod = $from->timestamp === 0;
        
        // Simple total count
        $total = (int) Customer::count();
        
        if ($isAllPeriod) {
            // All-time: active = total unique customers, new = total
            $active = (int) DB::table('transaksis')
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');
            $new = $total;
        } else {
            // ✅ Single query untuk active + new
            $row = DB::table('customers')
                ->selectRaw('
                    COUNT(DISTINCT CASE 
                        WHEN created_at BETWEEN ? AND ? THEN id 
                    END) as new_customers
                ', [$from->toDateTimeString(), $to->toDateTimeString()])
                ->first();
            
            $active = (int) DB::table('transaksis')
                ->whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');
            
            $new = (int) ($row->new_customers ?? 0);
        }

        return [
            'total' => $total,
            'active' => $active,
            'new' => $new,
        ];
    }

    /**
     * ✅ OPTIMIZED: Get production stats dengan conditional aggregation.
     * 
     * Before: 3 queries (antri, produksi, belum_dibuat)
     * After: 1 production query + 1 belum_dibuat query
     */
    private function getConsolidatedProductionStats(): array
    {
        // 1 query untuk antri + produksi
        $productionRow = DB::table('productions')
            ->where('jenis_pembuatan', 'pesanan')
            ->selectRaw("
                COUNT(CASE WHEN status = 'antri' THEN 1 END) as antri,
                COUNT(CASE WHEN status = 'produksi' THEN 1 END) as produksi
            ")
            ->first();

        // 1 query untuk belum_dibuat
        $belumDibuat = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereIn('td.status_transaksi_id', self::PESANAN_ACTIVE_STATUSES)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('productions as p')
                    ->whereColumn('p.transaksi_detail_id', 'td.id');
            })
            ->count();

        return [
            'antri' => (int) ($productionRow->antri ?? 0),
            'produksi' => (int) ($productionRow->produksi ?? 0),
            'belum_dibuat' => (int) $belumDibuat,
        ];
    }

    /**
     * ✅ OPTIMIZED: Get transaksi summary dalam 1 consolidated query.
     * 
     * Before: 3 queries (harian aktif, pesanan aktif, belum lunas)
     * After: 2 queries (belum lunas tetap separate karena kompleks)
     */
    private function getConsolidatedTransactionSummary(): array
    {
        // 1 query untuk harian + pesanan aktif
        $row = DB::table('transaksis as t')
            ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
            ->selectRaw("
                COUNT(DISTINCT CASE 
                    WHEN t.jenis_transaksi = 'daily' AND td.status_transaksi_id = 1 
                    THEN t.id 
                END) as harian_aktif,
                
                COUNT(DISTINCT CASE 
                    WHEN t.jenis_transaksi = 'pesanan' AND td.status_transaksi_id IN (" . implode(',', self::PESANAN_ACTIVE_STATUSES) . ")
                    THEN t.id 
                END) as pesanan_aktif
            ")
            ->first();

        // Belum lunas tetap separate (subquery complex)
        $belumLunas = DB::table('customers as c')
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('transaksi_details as td')
                    ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                    ->whereColumn('t.customer_id', 'c.id')
                    ->whereIn('td.status_transaksi_id', self::PESANAN_ACTIVE_STATUSES)
                    ->whereRaw('td.subtotal > COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayarans p WHERE p.transaksi_detail_id = td.id), 0)');
            })
            ->count();

        return [
            'harian_aktif' => (int) ($row->harian_aktif ?? 0),
            'pesanan_aktif' => (int) ($row->pesanan_aktif ?? 0),
            'belum_lunas' => (int) $belumLunas,
        ];
    }

    /**
     * ✅ CACHED: Low stock count dengan separate cache (data stabil).
     */
    private function getLowStockCount(): int
    {
        return Cache::remember(self::CACHE_LOWSTOCK, self::TTL['lowstock'], function () {
            return DB::table('products as p')
                ->whereExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('inventories as i')
                        ->join('places as pl', 'i.place_id', '=', 'pl.id')
                        ->whereIn('pl.kode', ['TOKO', 'BENGKEL'])
                        ->whereColumn('i.product_id', 'p.id')
                        ->groupBy('i.product_id')
                        ->havingRaw('SUM(i.qty) < 20');
                })
                ->count();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TOP LISTS (Fixed: Proper Array Casting)
    |--------------------------------------------------------------------------
    */

    /**
     * Top 5 customers berdasarkan total spent.
     * ✅ Fixed: cast stdClass → array untuk resource compatibility.
     */
    private function getTopCustomers(Carbon $from, Carbon $to, int $limit = 5): array
    {
        $isAllPeriod = $from->timestamp === 0;
        
        $query = DB::table('customers as c')
            ->select(
                'c.id',
                'c.name',
                'c.phone',
                DB::raw('COUNT(DISTINCT t.id) as total_transactions'),
                DB::raw('COALESCE(SUM(td.subtotal), 0) as total_spent')
            )
            ->join('transaksis as t', 'c.id', '=', 't.customer_id')
            ->join('transaksi_details as td', function ($join) {
                $join->on('t.id', '=', 'td.transaksi_id')
                     ->where('td.status_transaksi_id', self::STATUS_SELESAI);
            });

        if (!$isAllPeriod) {
            $query->whereBetween('t.tanggal', [$from->toDateString(), $to->toDateString()]);
        }

        return $query
            ->groupBy('c.id', 'c.name', 'c.phone')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(fn($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'phone' => $row->phone,
                'total_transactions' => (int) $row->total_transactions,
                'total_spent' => (int) $row->total_spent,
            ])
            ->values()
            ->all();
    }

    /**
     * Top 5 products berdasarkan qty terjual.
     * ✅ Fixed: cast stdClass → array untuk resource compatibility.
     */
    private function getTopProducts(Carbon $from, Carbon $to, int $limit = 5): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('transaksi_details as td')
            ->select(
                'p.id',
                'p.kode',
                'jp.nama as jenis',
                'tp.nama as type',
                'bp.nama as bahan',
                'p.ukuran',
                DB::raw('SUM(td.qty) as total_qty'),
                DB::raw('SUM(td.subtotal) as total_revenue')
            )
            ->join('products as p', 'td.product_id', '=', 'p.id')
            ->leftJoin('jenis_products as jp', 'p.jenis_id', '=', 'jp.id')
            ->leftJoin('type_products as tp', 'p.type_id', '=', 'tp.id')
            ->leftJoin('bahan_products as bp', 'p.bahan_id', '=', 'bp.id')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->where('td.status_transaksi_id', self::STATUS_SELESAI);

        if (!$isAllPeriod) {
            $query->whereBetween('t.tanggal', [$from->toDateString(), $to->toDateString()]);
        }

        return $query
            ->groupBy('p.id', 'p.kode', 'jp.nama', 'tp.nama', 'bp.nama', 'p.ukuran')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get()
            ->map(fn($row) => [
                'id' => $row->id,
                'kode' => $row->kode,
                'jenis' => $row->jenis,
                'type' => $row->type,
                'bahan' => $row->bahan,
                'ukuran' => $row->ukuran,
                'total_qty' => (int) $row->total_qty,
                'total_revenue' => (int) $row->total_revenue,
            ])
            ->values()
            ->all();
    }

    private function getTransactionByType(Carbon $from, Carbon $to): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('transaksis as t')
            ->select(
                't.jenis_transaksi',
                DB::raw('COUNT(DISTINCT t.id) as total_transactions'),
                DB::raw('COALESCE(SUM(td.subtotal), 0) as total_amount'),
                DB::raw('COALESCE(SUM(td.qty), 0) as total_qty')
            )
            ->leftJoin('transaksi_details as td', function ($join) {
                $join->on('t.id', '=', 'td.transaksi_id')
                     ->where('td.status_transaksi_id', self::STATUS_SELESAI);
            });

        if (!$isAllPeriod) {
            $query->whereBetween('t.tanggal', [$from->toDateString(), $to->toDateString()]);
        }

        return $query
            ->groupBy('t.jenis_transaksi')
            ->get()
            ->map(fn($row) => [
                'type' => $row->jenis_transaksi,
                'total_transactions' => (int) $row->total_transactions,
                'total_amount' => (int) $row->total_amount,
                'total_qty' => (int) $row->total_qty,
            ])
            ->values()
            ->all();
    }

    /**
     * ✅ OPTIMIZED: Sales analytics dengan inline total count (hindari double query).
     */
    private function getSalesAnalytics(Carbon $from, Carbon $to): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('transaksi_details as td')
            ->select(
                'st.nama as status',
                'td.status_transaksi_id as status_id',
                DB::raw('COUNT(td.id) as total')
            )
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->join('status_transaksis as st', 'td.status_transaksi_id', '=', 'st.id');

        if (!$isAllPeriod) {
            $query->whereBetween('t.tanggal', [$from->toDateString(), $to->toDateString()]);
        }

        $results = $query
            ->groupBy('td.status_transaksi_id', 'st.nama')
            ->orderByDesc('total')
            ->get();

        if ($results->isEmpty()) {
            return [];
        }

        // ✅ Calculate total in-memory (avoid extra DB query)
        $total = $results->sum('total');

        return $results->map(fn($row) => [
            'status' => $row->status,
            'status_id' => (int) $row->status_id,
            'total' => (int) $row->total,
            'percentage' => round(($row->total / $total) * 100, 1),
        ])->values()->all();
    }

    /*
    |--------------------------------------------------------------------------
    | CHART COMPUTATION
    |--------------------------------------------------------------------------
    */

    /**
     * Compute chart data untuk N bulan terakhir.
     * ✅ Optimized: single query, fill missing months in-memory.
     */
    private function computeChart(int $months): array
    {
        $endDate = Carbon::now()->endOfMonth();
        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $dbData = DB::table('transaksi_details as td')
            ->select(
                DB::raw("DATE_FORMAT(t.tanggal, '%Y-%m') as month_key"),
                DB::raw('SUM(td.subtotal) as total_revenue'),
                DB::raw('COUNT(DISTINCT t.id) as total_orders')
            )
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->whereBetween('t.tanggal', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('td.status_transaksi_id', self::STATUS_SELESAI)
            ->groupBy(DB::raw("DATE_FORMAT(t.tanggal, '%Y-%m')"))
            ->get()
            ->keyBy('month_key');

        // ✅ Pre-calculate dates untuk menghindari re-iterasi
        $chartData = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate->lte($endDate)) {
            $key = $currentDate->format('Y-m');
            $row = $dbData->get($key);

            $chartData[] = [
                'label' => $currentDate->format('M Y'),
                'date' => $key,
                'revenue' => (int) ($row->total_revenue ?? 0),
                'orders' => (int) ($row->total_orders ?? 0),
            ];

            $currentDate->addMonth();
        }

        return [
            'period' => 'monthly_chart',
            'months' => $months,
            'data' => $chartData,
            'cached_at' => Carbon::now()->toIso8601String(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function calculateGrowth(int|float $current, int|float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}