<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Production;
use App\Models\Transaksi;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            Log::info('DashboardController accessed');

            // 1. Transaksi Harian dengan status_id = 1 (Menunggu)
            $transaksiHarian = DB::table('transaksis as t')
                ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
                ->where('t.jenis_transaksi', 'daily')
                ->where('td.status_transaksi_id', 1)
                ->distinct('t.id')
                ->count('t.id');

            Log::info('Transaksi harian count: ' . $transaksiHarian);

            // 2. Transaksi Pesanan dengan status selain 5 (Selesai) dan 6 (Dibatalkan)
            $transaksiPesanan = DB::table('transaksis as t')
                ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
                ->where('t.jenis_transaksi', 'pesanan')
                ->whereNotIn('td.status_transaksi_id', [5, 6])
                ->distinct('t.id')
                ->count('t.id');

            Log::info('Transaksi pesanan count: ' . $transaksiPesanan);

            // 3. Customer dengan tagihan belum lunas
            $statusDibatalkan = DB::table('status_transaksis')
                ->where('nama', 'Dibatalkan')
                ->value('id');

            $customerBelumLunas = DB::table('customers as c')
                ->whereExists(function ($query) use ($statusDibatalkan) {
                    $query->select(DB::raw(1))
                        ->from('transaksi_details as td')
                        ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                        ->leftJoin(
                            DB::raw('(SELECT transaksi_detail_id, SUM(jumlah_bayar) as total_bayar 
                                          FROM pembayarans 
                                          GROUP BY transaksi_detail_id) as p'),
                            'td.id',
                            '=',
                            'p.transaksi_detail_id'
                        )
                        ->whereColumn('t.customer_id', 'c.id')
                        ->where(function ($q) use ($statusDibatalkan) {
                            $q->where('t.jenis_transaksi', 'daily')
                                ->orWhere('t.jenis_transaksi', 'pesanan');
                        })
                        ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                        ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal');
                })
                ->count();

            Log::info('Customer belum lunas count: ' . $customerBelumLunas);

            // 4. Semua Product
            $totalProduct = Product::count();
            Log::info('Total product count: ' . $totalProduct);

            // 5. Product Terlaris (produk yang pernah muncul di transaksi)
            $productTerlaris = DB::table('products as p')
                ->join('transaksi_details as td', 'p.id', '=', 'td.product_id')
                ->distinct('p.id')
                ->count('p.id');

            Log::info('Product terlaris count: ' . $productTerlaris);

            // 6. Production Pesanan
            $productionPesanan = DB::table('productions')
                ->where('jenis_pembuatan', 'pesanan')
                ->whereIn('status', ['antri', 'draft'])
                ->count();

            Log::info('Production pesanan count: ' . $productionPesanan);

            return response()->json([
                'status' => true,
                'data' => [
                    'transaksi_harian' => $transaksiHarian,
                    'transaksi_pesanan' => $transaksiPesanan,
                    'customer_belum_lunas' => $customerBelumLunas,
                    'total_product' => $totalProduct,
                    'product_terlaris' => $productTerlaris,
                    'production_pesanan' => $productionPesanan,
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('DashboardController error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'Internal Server Error',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    // Endpoint untuk data dashboard lengkap dengan chart
    public function dashboardStats(Request $request)
    {
        try {
            Log::info('DashboardController - dashboardStats accessed');

            // Ambil parameter periode (default 6 bulan)
            $months = $request->get('months', 6);

            // 1. Total Revenue (hari ini)
            $totalRevenueToday = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->whereDate('t.tanggal', Carbon::today())
                ->sum('td.subtotal');

            // 2. Total Revenue (bulan ini)
            $totalRevenueMonth = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->whereMonth('t.tanggal', Carbon::now()->month)
                ->whereYear('t.tanggal', Carbon::now()->year)
                ->sum('td.subtotal');

            // 3. Total Revenue (keseluruhan)
            $totalRevenueAll = DB::table('transaksi_details')->sum('subtotal');

            // 4. Total Orders hari ini
            $totalOrdersToday = DB::table('transaksis')
                ->whereDate('tanggal', Carbon::today())
                ->count();

            // 5. Total Orders bulan ini
            $totalOrdersMonth = DB::table('transaksis')
                ->whereMonth('tanggal', Carbon::now()->month)
                ->whereYear('tanggal', Carbon::now()->year)
                ->count();

            // 6. Total Orders keseluruhan
            $totalOrdersAll = DB::table('transaksis')->count();

            // 7. Total Customers
            $totalCustomers = Customer::count();

            // 8. Revenue per bulan (X bulan terakhir)
            $revenueLastMonths = DB::table('transaksi_details as td')
                ->select(
                    DB::raw("DATE_FORMAT(t.tanggal, '%Y-%m') as bulan"),
                    DB::raw('SUM(td.subtotal) as total_revenue'),
                    DB::raw('COUNT(DISTINCT t.id) as total_orders')
                )
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->where('t.tanggal', '>=', Carbon::now()->subMonths($months))
                ->groupBy('bulan')
                ->orderBy('bulan')
                ->get();

            // Format bulan untuk chart
            $revenueChart = $revenueLastMonths->map(function ($item) {
                $date = Carbon::createFromFormat('Y-m', $item->bulan);
                return [
                    'name' => $date->format('M Y'),
                    'revenue' => (int) $item->total_revenue,
                    'orders' => (int) $item->total_orders,
                ];
            });

            // 9. Sales Analytics (Status transaksi)
            $salesAnalytics = DB::table('transaksi_details as td')
                ->select(
                    'st.nama as status',
                    DB::raw('COUNT(td.id) as total'),
                    DB::raw('ROUND(COUNT(td.id) * 100.0 / (SELECT COUNT(*) FROM transaksi_details), 1) as percentage')
                )
                ->join('status_transaksis as st', 'td.status_transaksi_id', '=', 'st.id')
                ->groupBy('td.status_transaksi_id', 'st.nama')
                ->orderByDesc('total')
                ->get();

            // 10. Top 5 Products (gunakan method bestSeller yang sudah ada)
            $bestSellerRequest = new Request([
                'limit' => 5,
                'dari' => Carbon::now()->subMonth()->format('Y-m-d'),
                'sampai' => Carbon::now()->format('Y-m-d')
            ]);

            // Buat instance controller Product dan panggil method bestSeller
            $productController = new \App\Http\Controllers\api\ProductController();
            $bestSellerResponse = $productController->bestSeller($bestSellerRequest);
            $topProducts = $bestSellerResponse->getData(true)['data'] ?? [];

            // 11. Products Low Stock (gunakan method lowStock yang sudah ada)
            $lowStockResponse = $productController->lowStock();
            $lowStockProducts = $lowStockResponse->getData(true)['data'] ?? [];
            $lowStockCount = count($lowStockProducts);

            // 12. Products Available (gunakan method available yang sudah ada)
            $availableResponse = $productController->available();
            $availableProducts = $availableResponse->getData(true)['data'] ?? [];
            $availableCount = count($availableProducts);

            // 13. Persentase peningkatan bulan ini vs bulan lalu
            $lastMonthRevenue = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->whereMonth('t.tanggal', Carbon::now()->subMonth()->month)
                ->whereYear('t.tanggal', Carbon::now()->subMonth()->year)
                ->sum('td.subtotal');

            $percentageIncrease = $lastMonthRevenue > 0 
                ? round((($totalRevenueMonth - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                : ($totalRevenueMonth > 0 ? 100 : 0);

            // 14. Persentase peningkatan hari ini vs kemarin
            $yesterdayRevenue = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->whereDate('t.tanggal', Carbon::yesterday())
                ->sum('td.subtotal');

            $todayPercentageIncrease = $yesterdayRevenue > 0 
                ? round((($totalRevenueToday - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
                : ($totalRevenueToday > 0 ? 100 : 0);

            // 15. Data transaksi per jenis
            $transactionByType = DB::table('transaksis')
                ->select(
                    'jenis_transaksi',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(total) as total_amount')
                )
                ->groupBy('jenis_transaksi')
                ->get();

            // 16. Customer dengan transaksi terbanyak
            $topCustomers = DB::table('customers as c')
                ->select(
                    'c.id',
                    'c.name',
                    DB::raw('COUNT(t.id) as total_transactions'),
                    DB::raw('SUM(td.subtotal) as total_spent')
                )
                ->leftJoin('transaksis as t', 'c.id', '=', 't.customer_id')
                ->leftJoin('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
                ->groupBy('c.id', 'c.name')
                ->orderByDesc('total_transactions')
                ->limit(5)
                ->get();

            return response()->json([
                'status' => true,
                'data' => [
                    // Revenue Stats
                    'total_revenue' => (int) $totalRevenueAll,
                    'total_revenue_today' => (int) $totalRevenueToday,
                    'total_revenue_month' => (int) $totalRevenueMonth,
                    'yesterday_revenue' => (int) $yesterdayRevenue,
                    
                    // Orders Stats
                    'total_orders' => $totalOrdersAll,
                    'total_orders_today' => $totalOrdersToday,
                    'total_orders_month' => $totalOrdersMonth,
                    
                    // Customer Stats
                    'total_customers' => $totalCustomers,
                    'top_customers' => $topCustomers,
                    
                    // Product Stats
                    'total_product' => Product::count(),
                    'available_products' => $availableCount,
                    'low_stock_products' => $lowStockCount,
                    'product_terlaris' => $this->getProductTerlaris(),
                    
                    // Transaction Stats
                    'transaksi_harian' => $this->getTransaksiHarian(),
                    'transaksi_pesanan' => $this->getTransaksiPesanan(),
                    'customer_belum_lunas' => $this->getCustomerBelumLunas(),
                    'production_pesanan' => $this->getProductionPesanan(),
                    
                    // Transaction Analytics
                    'transaction_by_type' => $transactionByType,
                    
                    // Chart Data
                    'revenue_chart' => $revenueChart,
                    'sales_analytics' => $salesAnalytics,
                    
                    // Product Data
                    'top_products' => $topProducts,
                    'low_stock_products_list' => array_slice($lowStockProducts, 0, 5), // Ambil 5 saja
                    
                    // Percentage Increases
                    'percentage_increase_month' => $percentageIncrease,
                    'percentage_increase_today' => $todayPercentageIncrease,
                    
                    // Additional Info
                    'current_month' => Carbon::now()->format('F Y'),
                    'today_date' => Carbon::now()->format('d F Y'),
                    'data_range_months' => $months,
                ]
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('DashboardController - dashboardStats error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'Internal Server Error',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    // Helper methods untuk existing stats
    private function getTransaksiHarian()
    {
        return DB::table('transaksis as t')
            ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
            ->where('t.jenis_transaksi', 'daily')
            ->where('td.status_transaksi_id', 1)
            ->distinct('t.id')
            ->count('t.id');
    }

    private function getTransaksiPesanan()
    {
        return DB::table('transaksis as t')
            ->join('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereNotIn('td.status_transaksi_id', [5, 6])
            ->distinct('t.id')
            ->count('t.id');
    }

    private function getCustomerBelumLunas()
    {
        $statusDibatalkan = DB::table('status_transaksis')
            ->where('nama', 'Dibatalkan')
            ->value('id');

        return DB::table('customers as c')
            ->whereExists(function ($query) use ($statusDibatalkan) {
                $query->select(DB::raw(1))
                    ->from('transaksi_details as td')
                    ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                    ->leftJoin(
                        DB::raw('(SELECT transaksi_detail_id, SUM(jumlah_bayar) as total_bayar 
                                      FROM pembayarans 
                                      GROUP BY transaksi_detail_id) as p'),
                        'td.id',
                        '=',
                        'p.transaksi_detail_id'
                    )
                    ->whereColumn('t.customer_id', 'c.id')
                    ->where(function ($q) use ($statusDibatalkan) {
                        $q->where('t.jenis_transaksi', 'daily')
                            ->orWhere('t.jenis_transaksi', 'pesanan');
                    })
                    ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                    ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal');
            })
            ->count();
    }

    private function getProductTerlaris()
    {
        return DB::table('products as p')
            ->join('transaksi_details as td', 'p.id', '=', 'td.product_id')
            ->distinct('p.id')
            ->count('p.id');
    }

    private function getProductionPesanan()
    {
        return DB::table('productions')
            ->where('jenis_pembuatan', 'pesanan')
            ->whereIn('status', ['antri', 'draft'])
            ->count();
    }

    // Endpoint untuk summary cepat (untuk card kecil di dashboard)
    public function summary()
    {
        try {
            return response()->json([
                'status' => true,
                'data' => [
                    'transaksi_harian' => $this->getTransaksiHarian(),
                    'transaksi_pesanan' => $this->getTransaksiPesanan(),
                    'customer_belum_lunas' => $this->getCustomerBelumLunas(),
                    'total_product' => Product::count(),
                    'low_stock_products' => $this->getLowStockCount(),
                    'production_pesanan' => $this->getProductionPesanan(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('DashboardController - summary error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Internal Server Error'
            ], 500);
        }
    }

    private function getLowStockCount()
    {
        return DB::table('products as p')
            ->whereIn('p.id', function ($sub) {
                $sub->select('product_id')
                    ->from('inventories')
                    ->join('places', 'places.id', '=', 'inventories.place_id')
                    ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                    ->groupBy('product_id')
                    ->havingRaw('SUM(inventories.qty) < 20');
            })
            ->count();
    }
}