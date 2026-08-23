<?php

namespace App\Services\Dashboard;

use App\Models\Customer;
use App\Models\LoginLog;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    private const CACHE_PREFIX        = 'dashboard:stats:';
    private const CACHE_CHART_PREFIX  = 'dashboard:chart:';
    private const CACHE_LOWSTOCK      = 'dashboard:lowstock';
    private const CACHE_LOGIN_STATS   = 'dashboard:login_stats';
    private const CACHE_LOGIN_LOGS    = 'dashboard:login_logs:';

    private const TTL = [
        'daily'       => 60,
        'weekly'      => 300,
        'monthly'     => 1800,
        'yearly'      => 3600,
        'custom'      => 600,
        'all'         => 3600,
        'chart'       => 1800,
        'lowstock'    => 600,
        'login_stats' => 60,
        'login_logs'  => 30,
    ];

    private const STATUS_SELESAI          = 5;
    private const PESANAN_ACTIVE_STATUSES = [1, 2, 3, 4];

    /*
    |--------------------------------------------------------------------------
    | PUBLIC API — STATS & CHART
    |--------------------------------------------------------------------------
    */

    public function getStats(
        string $period = 'daily',
        ?Carbon $from = null,
        ?Carbon $to = null,
        bool $realtime = false
    ): array {
        [$rangeFrom, $rangeTo]   = $this->getDateRange($period, $from, $to);
        [$prevFrom, $prevTo]     = $this->getPreviousDateRange($period, $from, $to);

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

    public function getChart(int $months = 6): array
    {
        $version  = (int) Cache::get('dashboard:version', 1);
        $cacheKey = self::CACHE_CHART_PREFIX . "v{$version}:months_{$months}";

        return Cache::remember($cacheKey, self::TTL['chart'], function () use ($months) {
            return $this->computeChart($months);
        });
    }

    /**
     * ✅ UPDATED: Invalidate semua cache dashboard termasuk login stats/logs per period.
     */
    public function invalidateAll(): void
    {
        $version = (int) Cache::get('dashboard:version', 1);
        Cache::forever('dashboard:version', $version + 1);

        $this->forgetCachePattern(self::CACHE_LOWSTOCK);
        $this->forgetCachePattern(self::CACHE_LOGIN_STATS);
        $this->forgetCachePattern(self::CACHE_LOGIN_LOGS);

        Log::info('Dashboard cache invalidated', [
            'old_version' => $version,
            'new_version' => $version + 1,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC API — LOGIN LOGS (ENHANCED)
    |--------------------------------------------------------------------------
    */

    public function getLoginLogs(array $filters = [], int $perPage = 15, int $page = 1): array
    {
        $period  = $filters['period'] ?? 'daily';
        $from    = $filters['from'] ?? null;
        $to      = $filters['to'] ?? null;
        $search  = $filters['search'] ?? null;
        $success = $filters['success'] ?? null;
        $ip      = $filters['ip'] ?? null;

        $cacheKey = self::CACHE_LOGIN_LOGS . md5(json_encode([
            'period'   => $period,
            'from'     => $from,
            'to'       => $to,
            'search'   => $search,
            'success'  => $success,
            'ip'       => $ip,
            'per_page' => $perPage,
            'page'     => $page,
        ]));

        return Cache::remember($cacheKey, self::TTL['login_logs'], function () use (
            $period, $from, $to, $search, $success, $ip, $perPage, $page
        ) {
            try {
                $query = LoginLog::with(['user:id,name,email,role'])
                    ->period($period, $from, $to)
                    ->when($search, fn($q) => $q->byEmail($search))
                    ->when($success !== null, fn($q) => $q->bySuccess($success))
                    ->when($ip, fn($q) => $q->byIp($ip))
                    ->orderByDesc('created_at');

                $paginator = $query->paginate($perPage, ['*'], 'page', $page);

                return [
                    'data' => $paginator->items(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'from'         => $paginator->firstItem(),
                        'last_page'    => $paginator->lastPage(),
                        'per_page'     => $paginator->perPage(),
                        'to'           => $paginator->lastItem(),
                        'total'        => $paginator->total(),
                    ],
                ];
            } catch (\Throwable $e) {
                Log::error('Failed to fetch login logs', ['error' => $e->getMessage()]);
                return ['data' => [], 'meta' => $this->emptyMeta($perPage, $page)];
            }
        });
    }

    public function getLoginLogDetail(int $id): ?LoginLog
    {
        return LoginLog::with(['user:id,name,email,role'])->findOrFail($id);
    }

    /**
     * ✅ UPDATED: Login stats sekarang menerima period/from/to.
     * Shape response baru: 'summary' (tetap backward-compatible: frontend fallback ke 'today' jika 'summary' tidak ada).
     */
    public function getLoginStats(
        string $period = 'daily',
        ?Carbon $from = null,
        ?Carbon $to = null
    ): array {
        [$start, $end] = $this->getDateRange($period, $from, $to);

        $cacheKey = self::CACHE_LOGIN_STATS
            . ":{$period}:{$start->format('Ymd')}:{$end->format('Ymd')}";

        return Cache::remember($cacheKey, self::TTL['login_stats'], function () use ($period, $start, $end) {
            try {
                $total      = LoginLog::whereBetween('created_at', [$start, $end])->count();
                $successful = LoginLog::whereBetween('created_at', [$start, $end])->successful()->count();
                $failed     = $total - $successful;

                $uniqueIps = LoginLog::whereBetween('created_at', [$start, $end])
                    ->successful()
                    ->distinct('ip_address')
                    ->count('ip_address');

                $uniqueUsers = LoginLog::whereBetween('created_at', [$start, $end])
                    ->successful()
                    ->whereNotNull('user_id')
                    ->distinct('user_id')
                    ->count('user_id');

                $topFailedIps = LoginLog::whereBetween('created_at', [$start, $end])
                    ->failed()
                    ->select('ip_address')
                    ->selectRaw('COUNT(*) as attempts')
                    ->groupBy('ip_address')
                    ->orderByDesc('attempts')
                    ->limit(5)
                    ->get()
                    ->map(fn($row) => [
                        'ip'       => $row->ip_address,
                        'attempts' => (int) $row->attempts,
                    ])
                    ->all();

                return [
                    'period' => $period,
                    'range'  => [
                        'from' => $start->toIso8601String(),
                        'to'   => $end->toIso8601String(),
                    ],
                    'summary' => [
                        'total_attempts' => $total,
                        'successful'     => $successful,
                        'failed'         => $failed,
                        'success_rate'   => $total > 0
                            ? round(($successful / $total) * 100, 1)
                            : 0,
                        'unique_ips'   => $uniqueIps,
                        'unique_users' => $uniqueUsers,
                    ],
                    // Backward compat: tambahkan key 'today' dengan isi sama agar frontend lama tetap jalan
                    'today' => [
                        'total_attempts' => $total,
                        'successful'     => $successful,
                        'failed'         => $failed,
                        'success_rate'   => $total > 0
                            ? round(($successful / $total) * 100, 1)
                            : 0,
                        'unique_ips'   => $uniqueIps,
                        'unique_users' => $uniqueUsers,
                    ],
                    'top_failed_ips' => $topFailedIps,
                    'last_activity'  => LoginLog::latest('created_at')
                        ->value('created_at')?->toIso8601String(),
                    'cached_at' => now()->toIso8601String(),
                ];
            } catch (\Throwable $e) {
                Log::error('Failed to fetch login stats', ['error' => $e->getMessage()]);
                return $this->emptyLoginStats($period);
            }
        });
    }

    /**
     * ✅ UPDATED: Invalidate login stats & logs dengan pattern (karena cache key sekarang per-period).
     */
    public function invalidateLoginStats(): void
    {
        $this->forgetCachePattern(self::CACHE_LOGIN_STATS);
        $this->forgetCachePattern(self::CACHE_LOGIN_LOGS);

        Log::info('Login caches invalidated');
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

        $diff     = $from->diffInDays($to);
        $prevTo   = $from->copy()->subDay()->endOfDay();
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
    | STATS COMPUTATION
    |--------------------------------------------------------------------------
    */

    private function computeStats(
        string $period,
        Carbon $from,
        Carbon $to,
        Carbon $prevFrom,
        Carbon $prevTo
    ): array {
        $metrics        = $this->getConsolidatedMetrics($from, $to, $prevFrom, $prevTo);
        $customerStats  = $this->getConsolidatedCustomerStats($from, $to);
        $lowStock       = $this->getLowStockCount();
        $topCustomers   = $this->getTopCustomers($from, $to, 5);
        $topProducts    = $this->getTopProducts($from, $to, 5);
        $txByType       = $this->getTransactionByType($from, $to);
        $salesAnalytics = $this->getSalesAnalytics($from, $to);
        $production     = $this->getConsolidatedProductionStats();
        $summary        = $this->getConsolidatedTransactionSummary();

        // ✅ UPDATED: Login stats sekarang ikut period (sama seperti metrics utama)
        $loginStats     = $this->getLoginStats($period, $from, $to);

        return [
            'period'    => $period,
            'range'     => [
                'from' => $from->toIso8601String(),
                'to'   => $to->toIso8601String(),
            ],
            'cached_at' => Carbon::now()->toIso8601String(),

            'metrics' => [
                'revenue' => [
                    'current'  => $metrics['current_revenue'],
                    'previous' => $metrics['previous_revenue'],
                    'growth'   => $this->calculateGrowth(
                        $metrics['current_revenue'],
                        $metrics['previous_revenue']
                    ),
                ],
                'orders' => [
                    'current'  => $metrics['current_orders'],
                    'previous' => $metrics['previous_orders'],
                    'growth'   => $this->calculateGrowth(
                        $metrics['current_orders'],
                        $metrics['previous_orders']
                    ),
                ],
                'customers' => [
                    'total'  => $customerStats['total'],
                    'active' => $customerStats['active'],
                    'new'    => $customerStats['new'],
                ],
                'products' => [
                    'total_sold' => $metrics['current_products_sold'],
                    'low_stock'  => $lowStock,
                ],
            ],

            'top_customers'        => $topCustomers,
            'top_products'         => $topProducts,
            'transaction_by_type'  => $txByType,
            'sales_analytics'      => $salesAnalytics,
            'production'           => $production,

            'transaksi_harian_aktif'  => $summary['harian_aktif'],
            'transaksi_pesanan_aktif' => $summary['pesanan_aktif'],
            'customer_belum_lunas'    => $summary['belum_lunas'],

            'login_stats' => $loginStats,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CONSOLIDATED QUERIES
    |--------------------------------------------------------------------------
    */

    private function getConsolidatedMetrics(
        Carbon $currentFrom,
        Carbon $currentTo,
        Carbon $prevFrom,
        Carbon $prevTo
    ): array {
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
            $row = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->where('td.status_transaksi_id', self::STATUS_SELESAI)
                ->where(function ($q) use ($currentFrom, $currentTo, $prevFrom, $prevTo) {
                    $q->whereBetween('t.tanggal', [$currentFrom->toDateString(), $currentTo->toDateString()])
                      ->orWhereBetween('t.tanggal', [$prevFrom->toDateString(), $prevTo->toDateString()]);
                })
                ->selectRaw('
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.subtotal ELSE 0 END), 0) as current_revenue,
                    COUNT(DISTINCT CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN t.id END) as current_orders,
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.qty ELSE 0 END), 0) as current_products_sold,
                    COALESCE(SUM(CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN td.subtotal ELSE 0 END), 0) as previous_revenue,
                    COUNT(DISTINCT CASE 
                        WHEN t.tanggal BETWEEN ? AND ? THEN t.id END) as previous_orders
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
            'current_revenue'       => (int) ($row->current_revenue ?? 0),
            'current_orders'        => (int) ($row->current_orders ?? 0),
            'current_products_sold' => (int) ($row->current_products_sold ?? 0),
            'previous_revenue'      => (int) ($row->previous_revenue ?? 0),
            'previous_orders'       => (int) ($row->previous_orders ?? 0),
        ];
    }

    private function getConsolidatedCustomerStats(Carbon $from, Carbon $to): array
    {
        $isAllPeriod = $from->timestamp === 0;
        $total       = (int) Customer::count();

        if ($isAllPeriod) {
            $active = (int) DB::table('transaksis')
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');
            $new = $total;
        } else {
            $row = DB::table('customers')
                ->selectRaw('
                    COUNT(DISTINCT CASE 
                        WHEN created_at BETWEEN ? AND ? THEN id END) as new_customers
                ', [$from->toDateTimeString(), $to->toDateTimeString()])
                ->first();

            $active = (int) DB::table('transaksis')
                ->whereBetween('tanggal', [$from->toDateString(), $to->toDateString()])
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');

            $new = (int) ($row->new_customers ?? 0);
        }

        return ['total' => $total, 'active' => $active, 'new' => $new];
    }

    private function getConsolidatedProductionStats(): array
    {
        $productionRow = DB::table('productions')
            ->where('jenis_pembuatan', 'pesanan')
            ->selectRaw("
                COUNT(CASE WHEN status = 'antri' THEN 1 END) as antri,
                COUNT(CASE WHEN status = 'produksi' THEN 1 END) as produksi
            ")
            ->first();

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
            'antri'        => (int) ($productionRow->antri ?? 0),
            'produksi'     => (int) ($productionRow->produksi ?? 0),
            'belum_dibuat' => (int) $belumDibuat,
        ];
    }

    private function getConsolidatedTransactionSummary(): array
    {
        $row = DB::table('transaksis as t')
            ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
            ->selectRaw("
                COUNT(DISTINCT CASE 
                    WHEN t.jenis_transaksi = 'daily' AND td.status_transaksi_id = 1 
                    THEN t.id END) as harian_aktif,
                COUNT(DISTINCT CASE 
                    WHEN t.jenis_transaksi = 'pesanan' 
                    AND td.status_transaksi_id IN (" . implode(',', self::PESANAN_ACTIVE_STATUSES) . ")
                    THEN t.id END) as pesanan_aktif
            ")
            ->first();

        $belumLunas = DB::table('customers as c')
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('transaksi_details as td')
                    ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                    ->whereColumn('t.customer_id', 'c.id')
                    ->whereIn('td.status_transaksi_id', self::PESANAN_ACTIVE_STATUSES)
                    ->whereRaw('td.subtotal > COALESCE(
                        (SELECT SUM(p.jumlah_bayar) FROM pembayarans p WHERE p.transaksi_detail_id = td.id), 0
                    )');
            })
            ->count();

        return [
            'harian_aktif'  => (int) ($row->harian_aktif ?? 0),
            'pesanan_aktif' => (int) ($row->pesanan_aktif ?? 0),
            'belum_lunas'   => (int) $belumLunas,
        ];
    }

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

    private function getTopCustomers(Carbon $from, Carbon $to, int $limit = 5): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('customers as c')
            ->select(
                'c.id', 'c.name', 'c.phone',
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

        return $query->groupBy('c.id', 'c.name', 'c.phone')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(fn($row) => [
                'id'                 => $row->id,
                'name'               => $row->name,
                'phone'              => $row->phone,
                'total_transactions' => (int) $row->total_transactions,
                'total_spent'        => (int) $row->total_spent,
            ])
            ->values()
            ->all();
    }

    private function getTopProducts(Carbon $from, Carbon $to, int $limit = 5): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('transaksi_details as td')
            ->select(
                'p.id', 'p.kode',
                'jp.nama as jenis', 'tp.nama as type', 'bp.nama as bahan', 'p.ukuran',
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

        return $query->groupBy('p.id', 'p.kode', 'jp.nama', 'tp.nama', 'bp.nama', 'p.ukuran')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get()
            ->map(fn($row) => [
                'id'            => $row->id,
                'kode'          => $row->kode,
                'jenis'         => $row->jenis,
                'type'          => $row->type,
                'bahan'         => $row->bahan,
                'ukuran'        => $row->ukuran,
                'total_qty'     => (int) $row->total_qty,
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

        return $query->groupBy('t.jenis_transaksi')
            ->get()
            ->map(fn($row) => [
                'type'               => $row->jenis_transaksi,
                'total_transactions' => (int) $row->total_transactions,
                'total_amount'       => (int) $row->total_amount,
                'total_qty'          => (int) $row->total_qty,
            ])
            ->values()
            ->all();
    }

    private function getSalesAnalytics(Carbon $from, Carbon $to): array
    {
        $isAllPeriod = $from->timestamp === 0;

        $query = DB::table('transaksi_details as td')
            ->select('st.nama as status', 'td.status_transaksi_id as status_id', DB::raw('COUNT(td.id) as total'))
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->join('status_transaksis as st', 'td.status_transaksi_id', '=', 'st.id');

        if (!$isAllPeriod) {
            $query->whereBetween('t.tanggal', [$from->toDateString(), $to->toDateString()]);
        }

        $results = $query->groupBy('td.status_transaksi_id', 'st.nama')
            ->orderByDesc('total')
            ->get();

        if ($results->isEmpty()) return [];

        $total = $results->sum('total');

        return $results->map(fn($row) => [
            'status'     => $row->status,
            'status_id'  => (int) $row->status_id,
            'total'      => (int) $row->total,
            'percentage' => round(($row->total / $total) * 100, 1),
        ])->values()->all();
    }

    private function computeChart(int $months): array
    {
        $endDate   = Carbon::now()->endOfMonth();
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

        $chartData   = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $key = $currentDate->format('Y-m');
            $row = $dbData->get($key);

            $chartData[] = [
                'label'   => $currentDate->format('M Y'),
                'date'    => $key,
                'revenue' => (int) ($row->total_revenue ?? 0),
                'orders'  => (int) ($row->total_orders ?? 0),
            ];

            $currentDate->addMonth();
        }

        return [
            'period'    => 'monthly_chart',
            'months'    => $months,
            'data'      => $chartData,
            'cached_at' => Carbon::now()->toIso8601String(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    private function calculateGrowth(int|float $current, int|float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function emptyMeta(int $perPage, int $page): array
    {
        return [
            'current_page' => $page,
            'from'         => null,
            'last_page'    => 1,
            'per_page'     => $perPage,
            'to'           => null,
            'total'        => 0,
        ];
    }

    /**
     * ✅ UPDATED: Empty login stats dengan shape baru (summary) + backward compat (today).
     */
    private function emptyLoginStats(string $period = 'daily'): array
    {
        $empty = [
            'total_attempts' => 0,
            'successful'     => 0,
            'failed'         => 0,
            'success_rate'   => 0,
            'unique_ips'     => 0,
            'unique_users'   => 0,
        ];

        return [
            'period'          => $period,
            'range'           => null,
            'summary'         => $empty,
            'today'           => $empty,  // backward compat
            'top_failed_ips'  => [],
            'last_activity'   => null,
            'cached_at'       => now()->toIso8601String(),
        ];
    }

    /**
     * ✅ NEW: Hapus semua cache file yang key-nya diawali prefix.
     * Cocok untuk cache driver file dimana cache key punya suffix period.
     */
    private function forgetCachePattern(string $prefix): void
    {
        $cachePath = storage_path('framework/cache/data');

        if (!is_dir($cachePath)) {
            return;
        }

        $files = glob("{$cachePath}/{$prefix}*") ?: [];

        foreach ($files as $file) {
            if (is_file($file)) {
                Cache::forget(basename($file));
                @unlink($file);
            }
        }

        // Hapus juga key prefix itu sendiri (jika ada sebagai key langsung)
        Cache::forget($prefix);
    }
}