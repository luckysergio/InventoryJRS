<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index()
    {
        $tagihanHarian = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoin(DB::raw('(
                SELECT transaksi_detail_id, SUM(jumlah_bayar) as total_bayar 
                FROM pembayarans 
                GROUP BY transaksi_detail_id
            ) as p'), 'td.id', '=', 'p.transaksi_detail_id')
            ->whereRaw('td.subtotal > COALESCE(p.total_bayar, 0)')
            ->where('t.jenis_transaksi', 'daily')
            ->whereRaw('t.customer_id = customers.id')
            ->selectRaw('SUM(td.subtotal - COALESCE(p.total_bayar, 0))');

        $tagihanPesanan = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoin(DB::raw('(
                SELECT transaksi_detail_id, SUM(jumlah_bayar) as total_bayar 
                FROM pembayarans 
                GROUP BY transaksi_detail_id
            ) as p'), 'td.id', '=', 'p.transaksi_detail_id')
            ->whereRaw('td.subtotal > COALESCE(p.total_bayar, 0)')
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereRaw('t.customer_id = customers.id')
            ->selectRaw('SUM(td.subtotal - COALESCE(p.total_bayar, 0))');

        $customers = Customer::withCount([
                'transaksi as transaksi_harian_count' => function ($q) {
                    $q->where('jenis_transaksi', 'daily');
                },
                'transaksi as transaksi_pesanan_count' => function ($q) {
                    $q->where('jenis_transaksi', 'pesanan');
                }
            ])
            ->addSelect([
                'tagihan_harian_belum_lunas' => $tagihanHarian,
                'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
            ])
            ->get();

        $customers->each(function ($customer) {
            $customer->tagihan_harian_belum_lunas = (int) ($customer->tagihan_harian_belum_lunas ?? 0);
            $customer->tagihan_pesanan_belum_lunas = (int) ($customer->tagihan_pesanan_belum_lunas ?? 0);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil data customer',
            'data'    => $customers
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