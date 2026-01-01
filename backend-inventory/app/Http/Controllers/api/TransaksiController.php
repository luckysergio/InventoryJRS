<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Customer;
use App\Models\Product;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\Place;
use App\Models\ProductMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TransaksiController extends Controller
{
    public function aktif()
    {
        $data = Transaksi::with([
            'customer',
            'details.product',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'daily')
            ->whereHas('details', function ($query) {
                $query->where('status_transaksi_id', '!=', 2);
            })
            ->orderBy('id', 'DESC')
            ->get();

        return response()->json($data);
    }

    public function riwayat()
    {
        $data = Transaksi::with([
            'customer',
            'details.product',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->whereHas('details', function ($query) {
                $query->where('status_transaksi_id', '=', 2);
            })
            ->orderBy('id', 'DESC')
            ->get();

        return response()->json($data);
    }

    public function riwayatAll(Request $request)
    {
        $query = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.statusTransaksi',
            'details.pembayarans',
        ])
            ->whereHas('details', function ($q) {
                $q->where('status_transaksi_id', 5);
            })
            ->orderBy('id', 'DESC');

        if ($request->filled('jenis')) {
            $query->where('jenis_transaksi', $request->jenis);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $data = $query->get();
        return response()->json($data);
    }

    public function riwayatByCustomer($customerId)
    {
        $data = Transaksi::with([
            'customer',
            'details.product',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->where('customer_id', $customerId)
            ->whereHas('details', function ($query) {
                $query->where('status_transaksi_id', '=', 2);
            })
            ->orderBy('id', 'DESC')
            ->get();

        return response()->json($data);
    }

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
            ->where('jenis_transaksi', 'daily')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function show($id)
    {
        $data = Transaksi::with(['customer', 'details.product', 'details.pembayarans'])
            ->where('jenis_transaksi', 'daily')
            ->findOrFail($id);

        return response()->json($data);
    }

    public function destroy($id)
    {
        $transaksi = Transaksi::where('jenis_transaksi', 'daily')->findOrFail($id);

        $transaksi->delete();

        return response()->json(['message' => 'Transaksi harian berhasil dihapus']);
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

        $detail->update([
            'status_transaksi_id' => $request->status_transaksi_id
        ]);

        return response()->json([
            'message' => 'Status detail transaksi berhasil diubah',
            'data' => $detail->load('statusTransaksi')
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_baru.name' => 'nullable|string',
            'customer_baru.phone' => 'nullable|string',
            'customer_baru.email' => 'nullable|email',

            'details' => 'required|array',

            'details.*.product_id' => 'nullable|exists:products,id',

            'details.*.product_baru.nama' => 'nullable|string',
            'details.*.product_baru.kode' => 'nullable|string|unique:products,kode',
            'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
            'details.*.product_baru.type_id' => 'nullable|exists:type_products,id',
            'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
            'details.*.product_baru.status_id' => 'nullable|exists:status_products,id',
            'details.*.product_baru.ukuran' => 'nullable|string',

            'details.*.harga_product_id' => 'nullable|exists:harga_products,id',

            'details.*.harga_baru.harga' => 'nullable|integer|min:0',
            'details.*.harga_baru.keterangan' => 'nullable|string',
            'details.*.harga_baru.tanggal_berlaku' => 'nullable|date',

            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.discount' => 'nullable|integer|min:0',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tokoPlace = Place::where('kode', 'TOKO')->first();
        if (!$tokoPlace) {
            return response()->json(['error' => 'Place TOKO tidak ditemukan'], 500);
        }

        $errors = [];
        foreach ($request->details as $index => $d) {
            if (!empty($d['product_id'])) {
                $inventory = Inventory::where('product_id', $d['product_id'])
                    ->where('place_id', $tokoPlace->id)
                    ->first();

                if (!$inventory) {
                    $errors["details.{$index}.qty"] = [
                        'Inventory produk tidak tersedia di TOKO'
                    ];
                } elseif ($inventory->qty < $d['qty']) {
                    $errors["details.{$index}.qty"] = [
                        "Stok tidak mencukupi. Tersedia: {$inventory->qty}, Diminta: {$d['qty']}"
                    ];
                }
            }
        }

        if (!empty($errors)) {
            return response()->json(['errors' => $errors], 422);
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
                'jenis_transaksi' => 'daily',
                'total' => 0,
            ]);

            $total_transaksi = 0;

            foreach ($request->details as $d) {

                if (!empty($d['product_id'])) {
                    $product = Product::findOrFail($d['product_id']);
                } else {
                    $product = Product::create($d['product_baru']);
                }

                if (!empty($d['harga_baru'])) {
                    $hp = HargaProduct::create([
                        'product_id' => $product->id,
                        'harga' => $d['harga_baru']['harga'],
                        'tanggal_berlaku' => $d['harga_baru']['tanggal_berlaku'] ?? now(),
                        'keterangan' => $d['harga_baru']['keterangan'] ?? null,
                    ]);
                } elseif (!empty($d['harga_product_id'])) {
                    $hp = HargaProduct::where('id', $d['harga_product_id'])
                        ->where('product_id', $product->id)
                        ->firstOrFail();
                } else {
                    $hp = HargaProduct::where('product_id', $product->id)
                        ->orderBy('tanggal_berlaku', 'DESC')
                        ->orderBy('id', 'DESC')
                        ->firstOrFail();
                }

                $harga = $hp->harga;
                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($harga * $qty) - $discount;
                $total_transaksi += $subtotal;

                $inventory = Inventory::where('product_id', $product->id)
                    ->where('place_id', $tokoPlace->id)
                    ->lockForUpdate()
                    ->first();

                if (!$inventory || $inventory->qty < $qty) {
                    throw new \Exception("Stok produk {$product->kode} tidak mencukupi.");
                }

                $inventory->decrement('qty', $qty);

                $customerName = $transaksi->customer
                    ? $transaksi->customer->name
                    : 'Customer Umum';

                ProductMovement::create([
                    'inventory_id' => $inventory->id,
                    'tipe'         => 'out',
                    'qty'          => $qty,
                    'keterangan'   => "Penjualan Transaksi Daily #{$transaksi->id} oleh {$customerName}"
                ]);

                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'product_id' => $product->id,
                    'harga_product_id' => $hp->id,
                    'status_transaksi_id' => $d['status_transaksi_id'],
                    'tanggal' => $d['tanggal'],
                    'qty' => $qty,
                    'harga' => $harga,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                ]);
            }

            $transaksi->update(['total' => $total_transaksi]);

            DB::commit();

            return response()->json([
                'message' => 'Transaksi harian berhasil dibuat',
                'data' => $transaksi->load('customer', 'details.product')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Gagal membuat transaksi: ' . $e->getMessage()
            ], 500);
        }
    }
}
