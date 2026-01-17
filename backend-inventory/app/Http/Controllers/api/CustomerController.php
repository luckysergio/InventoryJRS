<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $statusDibatalkan = DB::table('status_transaksis')
            ->where('nama', 'Dibatalkan')
            ->value('id');

        $pembayaranSubquery = DB::table('pembayarans')
            ->select('transaksi_detail_id', DB::raw('SUM(jumlah_bayar) as total_bayar'))
            ->groupBy('transaksi_detail_id');

        $tagihanHarian = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoinSub($pembayaranSubquery, 'p', function ($join) {
                $join->on('td.id', '=', 'p.transaksi_detail_id');
            })
            ->where('t.jenis_transaksi', 'daily')
            ->whereRaw('t.customer_id = customers.id')
            ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
            ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
            ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

        $tagihanPesanan = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoinSub($pembayaranSubquery, 'p', function ($join) {
                $join->on('td.id', '=', 'p.transaksi_detail_id');
            })
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereRaw('t.customer_id = customers.id')
            ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
            ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
            ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

        $customersQuery = Customer::with([
            'transaksi_details.transaksi',
            'transaksi_details.product.jenis',
            'transaksi_details.product.type',
            'transaksi_details.pembayarans',
        ])->addSelect([
            'tagihan_harian_belum_lunas' => $tagihanHarian,
            'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
        ]);

        if ($search = $request->query('search')) {
            $customersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $customersQuery->get();

        $customers->each(function ($customer) {
            $customer->tagihan_harian_belum_lunas = (int) max(0, $customer->tagihan_harian_belum_lunas);
            $customer->tagihan_pesanan_belum_lunas = (int) max(0, $customer->tagihan_pesanan_belum_lunas);
        });

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data customer',
            'data' => $customers,
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email'  => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $customer = Customer::create([
            'name'  => $request->name,
            'phone' => $request->phone,
            'email'  => $request->email,
        ]);

        return response()->json([
            'status'   => true,
            'message'  => 'Customer berhasil dibuat',
            'customer' => $customer
        ], 201);
    }

    public function show($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'status'  => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status'   => true,
            'customer' => $customer
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'status'  => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        $data = $request->json()->all();

        $validator = Validator::make($data, [
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email'  => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $customer->update([
            'name'  => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
        ]);

        return response()->json([
            'status'   => true,
            'message'  => 'Customer berhasil diupdate',
            'customer' => $customer
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'status'  => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        $customer->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Customer berhasil dihapus'
        ]);
    }
}
