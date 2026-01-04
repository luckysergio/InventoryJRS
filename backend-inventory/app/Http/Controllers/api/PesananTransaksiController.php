<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\BahanProduct;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Customer;
use App\Models\Product;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\TypeProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PesananTransaksiController extends Controller
{
    public function index()
    {
        $data = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.statusTransaksi',
            'details.pembayarans',
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function aktif()
    {
        $data = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->whereHas('details', function ($query) {
                $query->whereIn('status_transaksi_id', [2, 3, 4]);
            })
            ->orderBy('id', 'DESC')
            ->get();

        return response()->json($data);
    }

    public function show($id)
    {
        $data = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->findOrFail($id);

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_baru.name' => 'nullable|string',
            'customer_baru.phone' => 'nullable|string',
            'customer_baru.email' => 'nullable|email',

            'details' => 'required|array|min:1',

            'details.*.product_id' => 'nullable|exists:products,id',

            'details.*.product_baru.kode' => 'required_if:details.*.product_id,null|string|max:50|unique:products,kode',

            'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
            'details.*.product_baru.jenis_nama' => 'required_if:details.*.product_baru.jenis_id,null|string',

            'details.*.product_baru.type_id' => 'nullable|exists:type_products,id',
            'details.*.product_baru.type_nama' => 'required_if:details.*.product_baru.type_id,null|string',

            'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
            'details.*.product_baru.bahan_nama' => 'required_if:details.*.product_baru.bahan_id,null|string',

            'details.*.product_baru.status_id' => 'nullable|exists:status_products,id',
            'details.*.product_baru.ukuran' => 'required_if:details.*.product_id,null|string|max:20',
            'details.*.product_baru.keterangan' => 'nullable|string',

            'details.*.harga_product_id' => 'nullable|exists:harga_products,id',
            'details.*.harga_baru.harga' => 'required_if:details.*.harga_product_id,null|integer|min:0',
            'details.*.harga_baru.keterangan' => 'nullable|string',
            'details.*.harga_baru.tanggal_berlaku' => 'nullable|date',

            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.discount' => 'nullable|integer|min:0',
            'details.*.catatan' => 'nullable|string',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            if ($request->customer_id) {
                $customer_id = $request->customer_id;
            } else {
                $customer = Customer::create($request->customer_baru);
                $customer_id = $customer->id;
            }

            $transaksi = Transaksi::create([
                'customer_id' => $customer_id,
                'jenis_transaksi' => 'pesanan',
                'total' => 0,
            ]);

            $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();
            if ($places->count() < 2) {
                throw new \Exception('Place Bengkel atau Toko belum tersedia di database.');
            }

            $total_transaksi = 0;

            foreach ($request->details as $d) {
                if (!empty($d['product_id'])) {
                    $product = Product::findOrFail($d['product_id']);
                } else {
                    $jenis_id = $d['product_baru']['jenis_id'] ?? null;
                    if (!$jenis_id) {
                        $jenis = JenisProduct::firstOrCreate([
                            'nama' => $d['product_baru']['jenis_nama']
                        ]);
                        $jenis_id = $jenis->id;
                    }

                    $type_id = $d['product_baru']['type_id'] ?? null;
                    if (!$type_id && !empty($d['product_baru']['type_nama'])) {
                        $type = TypeProduct::firstOrCreate([
                            'nama' => $d['product_baru']['type_nama'],
                            'jenis_id' => $jenis_id
                        ]);
                        $type_id = $type->id;
                    }

                    $bahan_id = $d['product_baru']['bahan_id'] ?? null;
                    if (!$bahan_id && !empty($d['product_baru']['bahan_nama'])) {
                        $bahan = BahanProduct::firstOrCreate([
                            'nama' => $d['product_baru']['bahan_nama']
                        ]);
                        $bahan_id = $bahan->id;
                    }

                    $product = Product::create([
                        'kode' => $d['product_baru']['kode'],
                        'jenis_id' => $jenis_id,
                        'type_id' => $type_id,
                        'bahan_id' => $bahan_id,
                        'ukuran' => $d['product_baru']['ukuran'],
                        'keterangan' => $d['product_baru']['keterangan'] ?? null,
                    ]);

                    foreach ($places as $place) {
                        Inventory::firstOrCreate([
                            'product_id' => $product->id,
                            'place_id'   => $place->id,
                        ], [
                            'qty' => 0
                        ]);
                    }
                }

                if (!empty($d['harga_baru'])) {
                    $hp = HargaProduct::create([
                        'product_id' => $product->id,
                        'harga' => $d['harga_baru']['harga'],
                        'tanggal_berlaku' => $d['harga_baru']['tanggal_berlaku'] ?? now(),
                        'keterangan' => $d['harga_baru']['keterangan'] ?? 'Harga pesanan',
                    ]);
                } elseif (!empty($d['harga_product_id'])) {
                    $hp = HargaProduct::where('id', $d['harga_product_id'])
                        ->where('product_id', $product->id)
                        ->firstOrFail();
                } else {
                    $hp = HargaProduct::firstOrCreate(
                        ['product_id' => $product->id],
                        [
                            'harga' => 0,
                            'tanggal_berlaku' => now(),
                            'keterangan' => 'Harga default pesanan'
                        ]
                    );
                }

                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($hp->harga * $qty) - $discount;
                $total_transaksi += $subtotal;

                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'product_id' => $product->id,
                    'harga_product_id' => $hp->id,
                    'status_transaksi_id' => $d['status_transaksi_id'],
                    'tanggal' => $d['tanggal'],
                    'qty' => $qty,
                    'harga' => $hp->harga,
                    'discount' => $discount,
                    'subtotal' => $subtotal,
                    'catatan' => $d['catatan'] ?? null,
                ]);
            }

            $transaksi->update(['total' => $total_transaksi]);

            DB::commit();

            return response()->json([
                'message' => 'Pesanan berhasil dibuat',
                'data' => $transaksi->load([
                    'customer',
                    'details.product.jenis',
                    'details.product.type',
                    'details.product.bahan',
                    'details.product.inventories.place'
                ])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Gagal membuat pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $transaksi = Transaksi::where('jenis_transaksi', 'pesanan')->findOrFail($id);
        $transaksi->delete();
        return response()->json(['message' => 'Pesanan berhasil dihapus']);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status_transaksi_id' => 'required|exists:status_transaksis,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $detail = TransaksiDetail::with('transaksi')->findOrFail($id);

        if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
            return response()->json(['error' => 'Hanya untuk transaksi pesanan.'], 403);
        }

        $detail->update(['status_transaksi_id' => $request->status_transaksi_id]);

        return response()->json([
            'message' => 'Status pesanan diperbarui',
            'data' => $detail->load('statusTransaksi')
        ]);
    }

    public function printNota($id)
    {
        $transaksi = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.pembayarans',
            'details.statusTransaksi'
        ])
        ->where('jenis_transaksi', 'pesanan')
        ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.nota-pesanan', compact('transaksi'))
                  ->setPaper('a4', 'portrait');

        return $pdf->stream("Nota_Pesanan_{$transaksi->id}.pdf");
    }
}
