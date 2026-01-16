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
    private function getTokoPlace()
    {
        return Place::where('kode', 'TOKO')->firstOrFail();
    }

    private function createOrUpdateCustomer($requestData)
    {
        if (!empty($requestData['customer_id'])) {
            return $requestData['customer_id'];
        }

        if (!empty($requestData['customer_baru']['name'])) {
            $customer = Customer::create($requestData['customer_baru']);
            return $customer->id;
        }

        return null;
    }

    private function resolveHargaProduct($productId, $customerId, $hargaInput = null)
    {
        if (!empty($hargaInput['harga_baru'])) {
            return HargaProduct::create([
                'product_id' => $productId,
                'customer_id' => $customerId,
                'harga' => $hargaInput['harga_baru']['harga'],
                'tanggal_berlaku' => $hargaInput['harga_baru']['tanggal_berlaku'] ?? now(),
                'keterangan' => $hargaInput['harga_baru']['keterangan'] ?? null,
            ]);
        }

        if (!empty($hargaInput['harga_product_id'])) {
            return HargaProduct::where('id', $hargaInput['harga_product_id'])
                ->where('product_id', $productId)
                ->firstOrFail();
        }

        $hp = HargaProduct::where('product_id', $productId)
            ->where('customer_id', $customerId)
            ->where('tanggal_berlaku', '<=', now())
            ->orderBy('tanggal_berlaku', 'DESC')
            ->orderBy('id', 'DESC')
            ->first();

        if (!$hp) {
            // Jika tidak ada, gunakan harga umum
            $hp = HargaProduct::where('product_id', $productId)
                ->whereNull('customer_id')
                ->where('tanggal_berlaku', '<=', now())
                ->orderBy('tanggal_berlaku', 'DESC')
                ->orderBy('id', 'DESC')
                ->first();
        }

        if (!$hp) {
            throw new \Exception("Harga untuk produk ID {$productId} tidak ditemukan.");
        }

        return $hp;
    }

    private function validateStockForDetails($details, $tokoPlaceId, $existingDetails = [])
    {
        $errors = [];

        foreach ($details as $index => $d) {
            if (empty($d['product_id'])) continue;

            $inventory = Inventory::where('product_id', $d['product_id'])
                ->where('place_id', $tokoPlaceId)
                ->first();

            if (!$inventory) {
                $errors["details.{$index}.qty"] = ['Inventory tidak tersedia di TOKO'];
                continue;
            }

            $qtyLama = 0;
            if (!empty($d['id'])) {
                $detailLama = collect($existingDetails)->firstWhere('id', $d['id']);
                $qtyLama = $detailLama ? $detailLama->qty : 0;
            }

            $selisih = $d['qty'] - $qtyLama;

            if ($selisih > 0 && $inventory->qty < $selisih) {
                $errors["details.{$index}.qty"] = [
                    "Stok tidak cukup untuk penambahan {$selisih} unit. Tersedia: {$inventory->qty}"
                ];
            }
        }

        return $errors;
    }

    private function updateInventoryAndMovement($productId, $qtyChange, $transaksiId, $keterangan)
    {
        if ($qtyChange == 0) return;

        $toko = $this->getTokoPlace();
        $inventory = Inventory::where('product_id', $productId)
            ->where('place_id', $toko->id)
            ->lockForUpdate()
            ->first();

        if (!$inventory) {
            throw new \Exception("Inventory untuk produk ID {$productId} di TOKO tidak ditemukan.");
        }

        if ($qtyChange > 0) {
            $inventory->increment('qty', $qtyChange);
            $tipe = 'in';
        } else {
            $absQty = abs($qtyChange);
            if ($inventory->qty < $absQty) {
                throw new \Exception("Stok tidak mencukupi untuk produk ID {$productId}.");
            }
            $inventory->decrement('qty', $absQty);
            $tipe = 'out';
        }

        ProductMovement::create([
            'inventory_id' => $inventory->id,
            'tipe' => $tipe,
            'qty' => abs($qtyChange),
            'keterangan' => $keterangan,
        ]);
    }

    public function aktif(Request $request)
    {
        $query = Transaksi::with([
            'customer',
            'details' => function ($q) {
                $q->where('status_transaksi_id', 1);
            },
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'daily')
            ->whereHas(
                'details',
                fn($q) =>
                $q->where('status_transaksi_id', 1)
            );

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->whereHas('customer', function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm);
            });
        }

        $data = $query->orderByDesc('id')->get();

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
            ->where('jenis_transaksi', 'daily')
            ->whereHas('details', fn($q) => $q->where('status_transaksi_id', 2))
            ->orderByDesc('id')
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
            ->whereIn('jenis_transaksi', ['daily', 'pesanan'])
            ->whereHas('details', fn($q) => $q->whereIn('status_transaksi_id', [5, 6]))
            ->orderByDesc('id');

        if ($request->filled('jenis')) {
            $query->where('jenis_transaksi', $request->jenis);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return response()->json($query->get());
    }

    public function riwayatByCustomer($customerId)
    {
        $data = Transaksi::with([
            'customer',
            'details.product',
            'details.statusTransaksi',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'daily')
            ->where('customer_id', $customerId)
            ->whereHas('details', fn($q) => $q->where('status_transaksi_id', 2))
            ->orderByDesc('id')
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

        return response()->json(['status' => true, 'data' => $data]);
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
        $detail->update(['status_transaksi_id' => $request->status_transaksi_id]);

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
            'details' => 'required|array|min:1',
            'details.*.product_id' => 'required|exists:products,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.discount' => 'nullable|numeric|min:0',
            'details.*.catatan' => 'nullable|string',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',
            'details.*.harga_product_id' => 'nullable|exists:harga_products,id',
            'details.*.harga_baru.harga' => 'nullable|integer|min:0',
            'details.*.harga_baru.keterangan' => 'nullable|string',
            'details.*.harga_baru.tanggal_berlaku' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $toko = $this->getTokoPlace();
            $customer_id = $this->createOrUpdateCustomer($request->all());

            // Validasi stok
            $stockErrors = $this->validateStockForDetails($request->details, $toko->id);
            if (!empty($stockErrors)) {
                return response()->json(['errors' => $stockErrors], 422);
            }

            $transaksi = Transaksi::create([
                'customer_id' => $customer_id,
                'jenis_transaksi' => 'daily',
                'total' => 0,
            ]);

            $total_transaksi = 0;

            foreach ($request->details as $d) {
                $product = Product::findOrFail($d['product_id']);
                $hp = $this->resolveHargaProduct($product->id, $customer_id, $d);

                $harga = $hp->harga;
                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($harga * $qty) - $discount;
                $total_transaksi += $subtotal;

                // Kurangi stok
                $this->updateInventoryAndMovement(
                    $product->id,
                    -$qty,
                    $transaksi->id,
                    "Penjualan Transaksi Daily #{$transaksi->id} oleh " . ($transaksi->customer?->name ?? 'Customer Umum')
                );

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
                    'catatan' => $d['catatan'] ?? null,
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
            return response()->json(['error' => 'Gagal membuat transaksi: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $transaksi = Transaksi::with(['details'])->findOrFail($id);

        if ($transaksi->jenis_transaksi !== 'daily') {
            return response()->json(['message' => 'Hanya transaksi harian yang bisa diupdate.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_baru.name' => 'nullable|string',
            'customer_baru.phone' => 'nullable|string',
            'customer_baru.email' => 'nullable|email',
            'details' => 'required|array|min:1',
            'details.*.id' => 'nullable|exists:transaksi_details,id,transaksi_id,' . $transaksi->id,
            'details.*.product_id' => 'required|exists:products,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.discount' => 'nullable|numeric|min:0',
            'details.*.catatan' => 'nullable|string',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',
            'details.*.harga_product_id' => 'nullable|exists:harga_products,id',
            'details.*.harga_baru.harga' => 'nullable|integer|min:0',
            'details.*.harga_baru.keterangan' => 'nullable|string',
            'details.*.harga_baru.tanggal_berlaku' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            $toko = $this->getTokoPlace();
            $customer_id = $this->createOrUpdateCustomer($request->all());
            $transaksi->update(['customer_id' => $customer_id]);

            $existingDetailIds = $transaksi->details->pluck('id')->toArray();
            $incomingDetailIds = collect($request->details)
                ->pluck('id')
                ->filter()
                ->toArray();

            $deletedIds = array_diff($existingDetailIds, $incomingDetailIds);
            foreach ($deletedIds as $detailId) {
                $detail = TransaksiDetail::findOrFail($detailId);
                $this->updateInventoryAndMovement(
                    $detail->product_id,
                    $detail->qty,
                    $transaksi->id,
                    "Update Transaksi #{$transaksi->id}: Hapus detail (qty {$detail->qty} dikembalikan)"
                );
                $detail->update(['status_transaksi_id' => 6]); // Dibatalkan
            }

            $total_transaksi = 0;

            foreach ($request->details as $d) {
                $isUpdate = !empty($d['id']);
                $product = Product::findOrFail($d['product_id']);
                $hp = $this->resolveHargaProduct($product->id, $customer_id, $d);

                $qtyBaru = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($hp->harga * $qtyBaru) - $discount;
                $total_transaksi += $subtotal;

                if ($isUpdate) {
                    $detail = TransaksiDetail::findOrFail($d['id']);
                    $qtyLama = $detail->qty;
                    $selisih = $qtyBaru - $qtyLama;

                    if ($selisih != 0) {
                        $this->updateInventoryAndMovement(
                            $product->id,
                            -$selisih,
                            $transaksi->id,
                            "Update Transaksi #{$transaksi->id}: Ubah qty dari {$qtyLama} ke {$qtyBaru}"
                        );
                    }

                    $detail->update([
                        'product_id' => $product->id,
                        'harga_product_id' => $hp->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'tanggal' => $d['tanggal'],
                        'qty' => $qtyBaru,
                        'harga' => $hp->harga,
                        'subtotal' => $subtotal,
                        'discount' => $discount,
                        'catatan' => $d['catatan'] ?? null,
                    ]);
                } else {
                    $this->updateInventoryAndMovement(
                        $product->id,
                        -$qtyBaru,
                        $transaksi->id,
                        "Update Transaksi #{$transaksi->id}: Detail baru (qty {$qtyBaru})"
                    );

                    TransaksiDetail::create([
                        'transaksi_id' => $transaksi->id,
                        'product_id' => $product->id,
                        'harga_product_id' => $hp->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'tanggal' => $d['tanggal'],
                        'qty' => $qtyBaru,
                        'harga' => $hp->harga,
                        'subtotal' => $subtotal,
                        'discount' => $discount,
                        'catatan' => $d['catatan'] ?? null,
                    ]);
                }
            }

            $transaksi->update(['total' => $total_transaksi]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Transaksi berhasil diperbarui',
                'data' => $transaksi->load('customer', 'details.product')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Gagal mengupdate transaksi: ' . $e->getMessage()], 500);
        }
    }

    public function cancelDetail($detailId)
    {
        $detail = TransaksiDetail::with(['transaksi', 'transaksi.customer', 'product'])
            ->findOrFail($detailId);

        if ($detail->transaksi->jenis_transaksi !== 'daily') {
            return response()->json(['message' => 'Hanya transaksi harian yang bisa dibatalkan per detail.'], 422);
        }

        if ($detail->pembayarans->isNotEmpty()) {
            return response()->json(['message' => 'Tidak dapat membatalkan detail yang sudah memiliki pembayaran.'], 422);
        }

        DB::beginTransaction();

        try {
            $this->updateInventoryAndMovement(
                $detail->product_id,
                $detail->qty,
                $detail->transaksi_id,
                "Pembatalan Detail Transaksi Daily #{$detail->transaksi->id} (Detail ID: {$detail->id}) oleh " . ($detail->transaksi->customer?->name ?? 'Customer Umum')
            );

            $detail->update([
                'status_transaksi_id' => 6,
                'subtotal' => 0,
                'discount' => 0,
            ]);

            $totalBaru = $detail->transaksi->details()
                ->where('status_transaksi_id', '!=', 6)
                ->sum('subtotal');
            $detail->transaksi->update(['total' => $totalBaru]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Detail transaksi berhasil dibatalkan. Stok telah dikembalikan.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Gagal membatalkan detail transaksi: ' . $e->getMessage()], 500);
        }
    }
}
