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
        // Ambil ID status "Dibatalkan"
        $statusDibatalkan = DB::table('status_transaksis')
            ->where('nama', 'Dibatalkan')
            ->pluck('id')
            ->first();

        // Subquery pembayaran
        $pembayaranSubquery = DB::raw('(
        SELECT transaksi_detail_id, SUM(jumlah_bayar) as total_bayar 
        FROM pembayarans 
        GROUP BY transaksi_detail_id
    ) as p');

        // Query tagihan harian
        $tagihanHarian = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoin($pembayaranSubquery, 'td.id', '=', 'p.transaksi_detail_id')
            ->where('t.jenis_transaksi', 'daily')
            ->whereRaw('t.customer_id = customers.id')
            ->whereRaw('td.subtotal > COALESCE(p.total_bayar, 0)')
            ->when($statusDibatalkan, function ($query) use ($statusDibatalkan) {
                return $query->where('td.status_transaksi_id', '!=', $statusDibatalkan);
            })
            ->selectRaw('SUM(td.subtotal - COALESCE(p.total_bayar, 0))');

        // Query tagihan pesanan
        $tagihanPesanan = DB::table('transaksi_details as td')
            ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
            ->leftJoin($pembayaranSubquery, 'td.id', '=', 'p.transaksi_detail_id')
            ->where('t.jenis_transaksi', 'pesanan')
            ->whereRaw('t.customer_id = customers.id')
            ->whereRaw('td.subtotal > COALESCE(p.total_bayar, 0)')
            ->when($statusDibatalkan, function ($query) use ($statusDibatalkan) {
                return $query->where('td.status_transaksi_id', '!=', $statusDibatalkan);
            })
            ->selectRaw('SUM(td.subtotal - COALESCE(p.total_bayar, 0))');

        $customers = Customer::withCount([
            'transaksi as transaksi_harian_count' => function ($q) use ($statusDibatalkan) {
                $q->where('jenis_transaksi', 'daily');
                if ($statusDibatalkan) {
                    $q->whereHas('details', function ($detailQuery) use ($statusDibatalkan) {
                        $detailQuery->where('status_transaksi_id', '!=', $statusDibatalkan);
                    });
                }
            },
            'transaksi as transaksi_pesanan_count' => function ($q) use ($statusDibatalkan) {
                $q->where('jenis_transaksi', 'pesanan');
                if ($statusDibatalkan) {
                    $q->whereHas('details', function ($detailQuery) use ($statusDibatalkan) {
                        $detailQuery->where('status_transaksi_id', '!=', $statusDibatalkan);
                    });
                }
            }
        ])
            ->addSelect([
                'tagihan_harian_belum_lunas' => $tagihanHarian,
                'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
            ])
            ->get();

        $customers->each(function ($customer) {
            $customer->tagihan_harian_belum_lunas = max(0, (int) ($customer->tagihan_harian_belum_lunas ?? 0));
            $customer->tagihan_pesanan_belum_lunas = max(0, (int) ($customer->tagihan_pesanan_belum_lunas ?? 0));
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
