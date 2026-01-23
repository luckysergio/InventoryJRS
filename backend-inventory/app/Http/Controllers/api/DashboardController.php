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
            return response()->json([
                'status' => true,
                'data' => [
                    'transaksi_harian' => $this->getTransaksiHarian(),
                    'transaksi_pesanan' => $this->getTransaksiPesanan(),
                    'customer_belum_lunas' => $this->getCustomerBelumLunas(),
                    'total_product' => Product::count(),
                    'product_terlaris' => $this->getProductTerlaris(),
                    'production_pesanan' => $this->getProductionPesanan(),
                    'production_antri' => $this->getProductionAntri(),
                    'production_produksi' => $this->getProductionProduksi(),
                    'production_total' => $this->getProductionTotal(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DashboardController@index error: ' . $e->getMessage());
            return response()->json(['status' => false, 'message' => 'Error'], 500);
        }
    }

    public function dashboardStats(Request $request)
    {
        try {
            $months = $request->get('months', 6);

            $transaksiHarian = $this->getTransaksiHarian();
            $transaksiPesanan = $this->getTransaksiPesanan();
            $customerBelumLunas = $this->getCustomerBelumLunas();
            $totalProduct = Product::count();
            $productTerlaris = $this->getProductTerlaris();
            $productionPesanan = $this->getProductionPesanan();
            $productionAntri = $this->getProductionAntri();
            $productionProduksi = $this->getProductionProduksi();
            $productionTotal = $this->getProductionTotal();

            $totalRevenueToday = $this->getRevenueByDate(Carbon::today());
            $totalRevenueMonth = $this->getRevenueByMonth(Carbon::now()->month, Carbon::now()->year);
            $totalRevenueAll = DB::table('transaksi_details')->sum('subtotal') ?? 0;

            $totalOrdersToday = Transaksi::whereDate('tanggal', Carbon::today())->count();
            $totalOrdersMonth = Transaksi::whereMonth('tanggal', Carbon::now()->month)
                ->whereYear('tanggal', Carbon::now()->year)
                ->count();
            $totalOrdersAll = Transaksi::count();

            $totalCustomers = Customer::count();

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

            $revenueChart = $revenueLastMonths->map(function ($item) {
                $date = Carbon::createFromFormat('Y-m', $item->bulan);
                return [
                    'name' => $date->format('M Y'),
                    'revenue' => (int) $item->total_revenue,
                    'orders' => (int) $item->total_orders,
                ];
            });

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

            $topProducts = DB::table('transaksi_details as td')
                ->select('p.id', 'p.kode', 'jp.nama as jenis', 'tp.nama as type', 'bp.nama as bahan', 'p.ukuran')
                ->addSelect(DB::raw('SUM(td.qty) as total_qty'))
                ->join('products as p', 'td.product_id', '=', 'p.id')
                ->leftJoin('jenis_products as jp', 'p.jenis_id', '=', 'jp.id')
                ->leftJoin('type_products as tp', 'p.type_id', '=', 'tp.id')
                ->leftJoin('bahan_products as bp', 'p.bahan_id', '=', 'bp.id')
                ->groupBy('p.id', 'p.kode', 'jp.nama', 'tp.nama', 'bp.nama', 'p.ukuran')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

            $lowStockQuery = DB::table('inventories as i')
                ->select('i.product_id', DB::raw('SUM(i.qty) as total_stok'))
                ->join('places as pl', 'i.place_id', '=', 'pl.id')
                ->whereIn('pl.kode', ['TOKO', 'BENGKEL'])
                ->groupBy('i.product_id')
                ->havingRaw('SUM(i.qty) < 20');

            $lowStockCount = DB::table('products')
                ->whereIn('id', $lowStockQuery->pluck('product_id'))
                ->count();

            $availableCount = DB::table('products as p')
                ->whereIn('p.id', function ($q) {
                    $q->select('i.product_id')
                        ->from('inventories as i')
                        ->join('places as pl', 'i.place_id', '=', 'pl.id')
                        ->whereIn('pl.kode', ['TOKO', 'BENGKEL'])
                        ->groupBy('i.product_id')
                        ->havingRaw('SUM(i.qty) > 0');
                })
                ->count();

            $lastMonthRevenue = $this->getRevenueByMonth(Carbon::now()->subMonth()->month, Carbon::now()->subMonth()->year);
            $percentageIncrease = $lastMonthRevenue > 0
                ? round((($totalRevenueMonth - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                : ($totalRevenueMonth > 0 ? 100 : 0);

            $yesterdayRevenue = $this->getRevenueByDate(Carbon::yesterday());
            $todayPercentageIncrease = $yesterdayRevenue > 0
                ? round((($totalRevenueToday - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
                : ($totalRevenueToday > 0 ? 100 : 0);

            $transactionByType = DB::table('transaksis')
                ->select(
                    'jenis_transaksi',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COALESCE(SUM(total), 0) as total_amount')
                )
                ->groupBy('jenis_transaksi')
                ->get();

            $topCustomers = DB::table('customers as c')
                ->select(
                    'c.id',
                    'c.name',
                    DB::raw('COUNT(t.id) as total_transactions'),
                    DB::raw('COALESCE(SUM(td.subtotal), 0) as total_spent')
                )
                ->leftJoin('transaksis as t', 'c.id', '=', 't.customer_id')
                ->leftJoin('transaksi_details as td', 't.id', '=', 'td.transaksi_id')
                ->groupBy('c.id', 'c.name')
                ->havingRaw('COUNT(t.id) > 0')
                ->orderByDesc('total_transactions')
                ->limit(5)
                ->get();

            return response()->json([
                'status' => true,
                'data' => [
                    'total_revenue' => (int) $totalRevenueAll,
                    'total_revenue_today' => (int) $totalRevenueToday,
                    'total_revenue_month' => (int) $totalRevenueMonth,
                    'yesterday_revenue' => (int) $yesterdayRevenue,

                    'total_orders' => $totalOrdersAll,
                    'total_orders_today' => $totalOrdersToday,
                    'total_orders_month' => $totalOrdersMonth,

                    'total_customers' => $totalCustomers,
                    'top_customers' => $topCustomers,

                    'total_product' => $totalProduct,
                    'available_products' => $availableCount,
                    'low_stock_products' => $lowStockCount,
                    'product_terlaris' => $productTerlaris,

                    'transaksi_harian' => $transaksiHarian,
                    'transaksi_pesanan' => $transaksiPesanan,
                    'customer_belum_lunas' => $customerBelumLunas,
                    'production_pesanan' => $productionPesanan,
                    'production_antri' => $productionAntri,
                    'production_produksi' => $productionProduksi,
                    'production_total' => $productionTotal,

                    'transaction_by_type' => $transactionByType,
                    'revenue_chart' => $revenueChart,
                    'sales_analytics' => $salesAnalytics,
                    'top_products' => $topProducts,

                    'percentage_increase_month' => $percentageIncrease,
                    'percentage_increase_today' => $todayPercentageIncrease,

                    'current_month' => Carbon::now()->format('F Y'),
                    'today_date' => Carbon::now()->format('d F Y'),
                    'data_range_months' => $months,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('DashboardController@dashboardStats error: ' . $e->getMessage());
            return response()->json(['status' => false, 'message' => 'Error'], 500);
        }
    }

    // === HELPER METHODS ===

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
        return DB::table('customers as c')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transaksi_details as td')
                    ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                    ->whereColumn('t.customer_id', 'c.id')
                    ->whereNotIn('td.status_transaksi_id', [5, 6])
                    ->whereRaw('td.subtotal > COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayarans p WHERE p.transaksi_detail_id = td.id), 0)');
            })
            ->count();
    }

    private function getProductTerlaris()
    {
        return DB::table('transaksi_details')
            ->where('status_transaksi_id', 5) // ✅ Hanya hitung yang statusnya "Selesai"
            ->distinct('product_id')
            ->count('product_id');
    }

    private function getProductionPesanan()
    {
        return Production::where('jenis_pembuatan', 'pesanan')
            ->whereIn('status', ['antri', 'draft'])
            ->count();
    }

    private function getProductionAntri()
    {
        return Production::where('jenis_pembuatan', 'pesanan')
            ->where('status', 'antri')
            ->count();
    }

    private function getProductionProduksi()
    {
        return Production::where('jenis_pembuatan', 'pesanan')
            ->where('status', 'produksi')
            ->count();
    }

    private function getProductionTotal()
    {
        return DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereNotIn('td.status_transaksi_id', [5, 6])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('productions as p')
                    ->whereColumn('p.transaksi_detail_id', 'td.id');
            })
            ->count();
    }

    private function getRevenueByDate($date)
    {
        return DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->whereDate('t.tanggal', $date)
            ->sum('td.subtotal') ?? 0;
    }

    private function getRevenueByMonth($month, $year)
    {
        return DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->whereMonth('t.tanggal', $month)
            ->whereYear('t.tanggal', $year)
            ->sum('td.subtotal') ?? 0;
    }
}
