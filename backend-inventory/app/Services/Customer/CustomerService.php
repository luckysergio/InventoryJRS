<?php

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function getList(?string $search = null)
    {
        $statusDibatalkan = DB::table('status_transaksis')->where('nama', 'Dibatalkan')->value('id');

        $pembayaranSubquery = DB::table('pembayarans')
            ->select('transaksi_detail_id', DB::raw('SUM(jumlah_bayar) as total_bayar'))
            ->groupBy('transaksi_detail_id');

        $tagihanHarian = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
            ->where('t.jenis_transaksi', 'daily')
            ->whereRaw('t.customer_id = customers.id')
            ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
            ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
            ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

        $tagihanPesanan = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereRaw('t.customer_id = customers.id')
            ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
            ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
            ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

        $query = Customer::with([
                'transaksi_details.transaksi',
                'transaksi_details.product.jenis',
                'transaksi_details.product.type',
                'transaksi_details.pembayarans',
            ])
            ->addSelect([
                'tagihan_harian_belum_lunas' => $tagihanHarian,
                'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
            ])
            ->search($search);

        $customers = $query->get();

        $customers->each(function ($customer) {
            $customer->tagihan_harian_belum_lunas = (float) max(0, $customer->tagihan_harian_belum_lunas);
            $customer->tagihan_pesanan_belum_lunas = (float) max(0, $customer->tagihan_pesanan_belum_lunas);
        });

        return $customers;
    }

    public function create(array $data): Customer
    {
        return Customer::create([
            'name'  => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
        ]);
    }

    public function update(Customer $customer, array $data): Customer
    {
        $customer->update([
            'name'  => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
        ]);

        return $customer->fresh();
    }

    public function delete(Customer $customer): array
    {
        $hasProduct = Product::where('customer_id', $customer->id)->exists();

        if ($hasProduct) {
            throw new \Exception('Customer tidak dapat dihapus karena masih memiliki product.');
        }

        $customer->delete();

        return ['success' => true, 'message' => 'Customer berhasil dihapus.'];
    }
}