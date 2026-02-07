<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Production;
use App\Models\Inventory;
use App\Models\Place;
use App\Models\ProductMovement;
use App\Models\TransaksiDetail;
use App\Models\StatusTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProductionController extends Controller
{
    public function index()
    {
        $productions = Production::with([
            'product.jenis',
            'product.type',
            'product.bahan',
            'karyawan',
            'transaksiDetail.transaksi.customer'
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data produksi',
            'data' => $productions
        ]);
    }

    public function show($id)
    {
        $production = Production::with([
            'product',
            'karyawan',
            'transaksiDetail'
        ])->find($id);

        if (!$production) {
            return response()->json([
                'status' => false,
                'message' => 'Data produksi tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $production
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'karyawan_id'         => 'required|exists:karyawans,id',
            'jenis_pembuatan'     => 'required|in:pesanan,inventory',

            'transaksi_detail_id' => 'required_if:jenis_pembuatan,pesanan|exists:transaksi_details,id',

            'product_id'          => 'required_if:jenis_pembuatan,inventory|exists:products,id',
            'qty'                 => 'required_if:jenis_pembuatan,inventory|integer|min:1',

            'tanggal_mulai'       => 'required|date',
            'tanggal_selesai'     => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {

            if ($request->jenis_pembuatan === 'pesanan') {

                $detail = TransaksiDetail::with('product')
                    ->findOrFail($request->transaksi_detail_id);

                $statusDibuat = StatusTransaksi::where('nama', 'Di Buat')->firstOrFail();

                $production = Production::create([
                    'product_id'          => $detail->product_id,
                    'karyawan_id'         => $request->karyawan_id,
                    'transaksi_detail_id' => $detail->id,
                    'jenis_pembuatan'     => 'pesanan',
                    'qty'                 => $detail->qty,
                    'tanggal_mulai'       => $request->tanggal_mulai,
                    'tanggal_selesai'     => $request->tanggal_selesai,
                    'status'              => 'antri'
                ]);

                $detail->update([
                    'status_transaksi_id' => $statusDibuat->id
                ]);
            }

            if ($request->jenis_pembuatan === 'inventory') {

                $production = Production::create([
                    'product_id'      => $request->product_id,
                    'karyawan_id'     => $request->karyawan_id,
                    'jenis_pembuatan' => 'inventory',
                    'qty'             => $request->qty,
                    'tanggal_mulai'   => $request->tanggal_mulai,
                    'tanggal_selesai' => $request->tanggal_selesai,
                    'status'          => 'antri'
                ]);
            }

            DB::commit();

            return response()->json([
                'status'  => true,
                'message' => 'Produksi berhasil dibuat',
                'data'    => $production->load(['product', 'karyawan', 'transaksiDetail'])
            ], 201);
        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'status'  => false,
                'message' => 'Gagal membuat produksi',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $production = Production::with('transaksiDetail')->find($id);
        if (!$production) {
            return response()->json(['status' => false, 'message' => 'Data produksi tidak ditemukan'], 404);
        }
        $validator = Validator::make($request->all(), ['status' => 'required|in:antri,produksi,selesai,batal']);
        if ($validator->fails()) {
            return response()->json(['status' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }
         if ($request->status === 'selesai') {
            $product = $production->product;

            if (
                !$product->foto_depan ||
                !$product->foto_samping ||
                !$product->foto_atas
            ) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Produk harus memiliki foto depan, samping, dan atas sebelum produksi diselesaikan'
                ], 422);
            }
        }
        DB::transaction(function () use ($production, $request) {
            $status = $request->status;
            if ($status === 'produksi' && !$production->tanggal_mulai) {
                $production->tanggal_mulai = now();
            }
            if ($status === 'selesai') {
                if (!$production->tanggal_mulai) {
                    $production->tanggal_mulai = now();
                }
                $production->tanggal_selesai = now();
            }
            if ($status === 'batal') {
                $production->tanggal_mulai = null;
                $production->tanggal_selesai = null;
            }
            $production->status = $status;
            $production->save();
            if ($status === 'selesai') {
                if ($production->jenis_pembuatan === 'inventory') {
                    $bengkel = Place::where('kode', 'BENGKEL')->firstOrFail();
                    $inventory = Inventory::firstOrCreate(['product_id' => $production->product_id, 'place_id' => $bengkel->id], ['qty' => 0]);
                    $inventory->increment('qty', $production->qty);
                    ProductMovement::create(['inventory_id' => $inventory->id, 'product_id' => $production->product_id, 'tipe' => 'produksi', 'qty' => $production->qty, 'keterangan' => 'Hasil produksi inventory', 'ref_type' => 'production', 'ref_id' => $production->id]);
                }
                if ($production->jenis_pembuatan === 'pesanan' && $production->transaksiDetail) {
                    $bengkel = Place::where('kode', 'BENGKEL')->firstOrFail();
                    $inventory = Inventory::firstOrCreate(['product_id' => $production->product_id, 'place_id' => $bengkel->id], ['qty' => 0]);
                    $inventory->increment('qty', $production->qty);
                    ProductMovement::create(['inventory_id' => $inventory->id, 'product_id' => $production->product_id, 'tipe' => 'produksi', 'qty' => $production->qty, 'keterangan' => 'Hasil produksi pesanan (masuk ke Bengkel)', 'ref_type' => 'production', 'ref_id' => $production->id]);
                    if ($inventory->fresh()->qty < $production->qty) {
                        throw new \Exception('Stok tidak mencukupi untuk mengirim pesanan');
                    }
                    $inventory->decrement('qty', $production->qty);
                    ProductMovement::create(['inventory_id' => $inventory->id, 'product_id' => $production->product_id, 'tipe' => 'out', 'qty' => $production->qty, 'keterangan' => 'Kirim pesanan ke customer', 'ref_type' => 'transaksi_detail', 'ref_id' => $production->transaksi_detail_id]);
                    $statusSiap = StatusTransaksi::where('nama', 'Siap')->firstOrFail();
                    $production->transaksiDetail->update(['status_transaksi_id' => $statusSiap->id]);
                }
            }
        });
        return response()->json(['status' => true, 'message' => 'Status produksi berhasil diperbarui', 'data' => $production->fresh()]);
    }

    public function destroy($id)
    {
        $production = Production::find($id);

        if (!$production) {
            return response()->json([
                'status' => false,
                'message' => 'Data produksi tidak ditemukan'
            ], 404);
        }

        if ($production->status !== 'antri') {
            return response()->json([
                'status' => false,
                'message' => 'Produksi hanya bisa dihapus saat status antri'
            ], 422);
        }

        $production->delete();

        return response()->json([
            'status' => true,
            'message' => 'Produksi berhasil dihapus'
        ]);
    }

    public function pesananDipesan()
    {
        $data = TransaksiDetail::with([
            'product.jenis',
            'product.type',
            'product.bahan',
            'transaksi.customer',
            'statusTransaksi'
        ])
            ->whereHas('statusTransaksi', function ($q) {
                $q->where('nama', 'Di Pesan');
            })
            ->get();

        return response()->json([
            'status'  => true,
            'message' => 'Pesanan siap produksi',
            'data'    => $data
        ]);
    }
}
