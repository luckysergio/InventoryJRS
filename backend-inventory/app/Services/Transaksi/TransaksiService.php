<?php

namespace App\Services\Transaksi;

use App\Models\Customer;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\Place;
use App\Models\Product;
use App\Models\ProductMovement;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TransaksiService
{
    private const CACHE_LIST_PREFIX = 'transaksi:list:v';
    private const CACHE_VERSION_KEY = 'transaksi:cache:version';
    private const CACHE_VERSION_LOCK = 'transaksi:cache:version:lock';
    private const CACHE_TTL = 300;

    private const STATUS_AKTIF = 1;
    private const STATUS_SELESAI = 5;
    private const STATUS_DIBATALKAN = 6;

    public function getList(array $filters = [], int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([
            'f'  => $filters,
            'pp' => $perPage,
            'p'  => $page,
        ]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($filters, $perPage, $page) {
            $query = Transaksi::with([
                'customer:id,name,phone',
                'details.product.jenis:id,nama',
                'details.product.type:id,nama',
                'details.product.bahan:id,nama',
                'details.statusTransaksi:id,nama',
                'details.pembayarans:id,transaksi_detail_id,jumlah_bayar,tanggal_bayar',
            ]);

            $jenis = $filters['jenis'] ?? null;
            $mode = $filters['mode'] ?? 'all';
            $search = $filters['search'] ?? null;
            $customerId = $filters['customer_id'] ?? null;
            $dari = $filters['dari'] ?? null;
            $sampai = $filters['sampai'] ?? null;

            if ($jenis && $jenis !== 'all') {
                $query->where('jenis_transaksi', $jenis);
            }

            switch ($mode) {
                case 'aktif':
                    if (!$jenis || $jenis === 'all') {
                        $query->where('jenis_transaksi', 'daily');
                    }
                    $query->whereHas('details', fn($q) => $q->where('status_transaksi_id', self::STATUS_AKTIF));
                    break;

                case 'riwayat':
                    if (!$jenis || $jenis === 'all') {
                        $query->where('jenis_transaksi', 'daily');
                    }
                    $query->whereHas('details', fn($q) => $q->where('status_transaksi_id', self::STATUS_SELESAI));
                    break;

                case 'riwayat_all':
                    $query->whereHas(
                        'details',
                        fn($q) =>
                        $q->whereIn('status_transaksi_id', [self::STATUS_SELESAI, self::STATUS_DIBATALKAN])
                    );
                    break;
            }

            $query->when($search, function ($q) use ($search) {
                $q->whereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });

            $query->when($customerId, fn($q) => $q->where('customer_id', $customerId))
                ->when($dari, fn($q) => $q->whereDate('tanggal', '>=', $dari))
                ->when($sampai, fn($q) => $q->whereDate('tanggal', '<=', $sampai))
                ->latest('id');

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function getDetail(int $id): ?Transaksi
    {
        return Transaksi::with([
            'customer:id,name,phone,email',
            'details.product.jenis:id,nama',
            'details.product.type:id,nama',
            'details.product.bahan:id,nama',
            'details.statusTransaksi:id,nama',
            'details.pembayarans',
        ])->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Transaksi
    {
        return DB::transaction(function () use ($data) {
            $toko = $this->getTokoPlace();
            $customerId = $this->resolveCustomer($data);

            // Lock inventories untuk prevent race condition
            $productIds = collect($data['details'])->pluck('product_id')->unique()->toArray();
            /** @var Collection<int, Inventory> $inventories */
            $inventories = Inventory::whereIn('product_id', $productIds)
                ->where('place_id', $toko->id)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            // Validasi stok
            $this->validateStock($data['details'], $inventories);

            $transaksi = Transaksi::create([
                'customer_id'     => $customerId,
                'jenis_transaksi' => 'daily',
                'tanggal'         => $data['tanggal'],
                'total'           => 0,
            ]);

            $totalTransaksi = 0;

            foreach ($data['details'] as $d) {
                $product = Product::findOrFail($d['product_id']);
                $hp = $this->resolveHargaProduct($product->id, $customerId, $d);

                $harga = $hp->harga;
                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($harga * $qty) - $discount;
                $totalTransaksi += $subtotal;

                // Reduce stok
                $this->adjustInventory($inventories[$product->id], -$qty, "Penjualan Transaksi Daily #{$transaksi->id}");

                TransaksiDetail::create([
                    'transaksi_id'        => $transaksi->id,
                    'product_id'          => $product->id,
                    'harga_product_id'    => $hp->id,
                    'status_transaksi_id' => $d['status_transaksi_id'],
                    'qty'                 => $qty,
                    'harga'               => $harga,
                    'subtotal'            => $subtotal,
                    'discount'            => $discount,
                    'catatan'             => $d['catatan'] ?? null,
                ]);
            }

            $transaksi->update(['total' => $totalTransaksi]);

            Log::info('Transaksi created', [
                'id' => $transaksi->id,
                'customer_id' => $customerId,
                'total' => $totalTransaksi,
                'items_count' => count($data['details']),
                'user_id' => Auth::id(),
            ]);

            return $transaksi->load([
                'customer',
                'details.product',
                'details.statusTransaksi',
                'details.pembayarans',
            ]);
        });
    }

    public function update(Transaksi $transaksi, array $data): Transaksi
    {
        if ($transaksi->jenis_transaksi !== 'daily') {
            throw new \Exception('Hanya transaksi harian yang bisa diupdate.');
        }

        return DB::transaction(function () use ($transaksi, $data) {
            $transaksi->load('details');

            $toko = $this->getTokoPlace();
            $customerId = $this->resolveCustomer($data);

            $transaksi->update([
                'customer_id' => $customerId,
                'tanggal'     => $data['tanggal'],
            ]);

            // Diff detail IDs
            $existingDetailIds = $transaksi->details->pluck('id')->toArray();
            $incomingDetailIds = collect($data['details'])->pluck('id')->filter()->toArray();
            $deletedIds = array_diff($existingDetailIds, $incomingDetailIds);

            // Lock inventories
            $allProductIds = collect($data['details'])->pluck('product_id')
                ->merge($transaksi->details->whereIn('id', $deletedIds)->pluck('product_id'))
                ->unique()
                ->toArray();

            /** @var Collection<int, Inventory> $inventories */
            $inventories = Inventory::whereIn('product_id', $allProductIds)
                ->where('place_id', $toko->id)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            // Validasi stok untuk item baru / qty bertambah
            $this->validateStockForUpdate($data['details'], $transaksi->details, $inventories);

            // Hapus detail yang tidak ada di request (return stok)
            foreach ($deletedIds as $detailId) {
                $detail = $transaksi->details->firstWhere('id', $detailId);
                if (!$detail) continue;

                $this->adjustInventory(
                    $inventories[$detail->product_id],
                    $detail->qty,
                    "Update Transaksi #{$transaksi->id}: Hapus detail (qty {$detail->qty} dikembalikan)"
                );
                $detail->update(['status_transaksi_id' => self::STATUS_DIBATALKAN]);
            }

            $totalTransaksi = 0;

            foreach ($data['details'] as $d) {
                $isUpdate = !empty($d['id']);
                $product = Product::findOrFail($d['product_id']);
                $hp = $this->resolveHargaProduct($product->id, $customerId, $d);

                $qtyBaru = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = ($hp->harga * $qtyBaru) - $discount;
                $totalTransaksi += $subtotal;

                if ($isUpdate) {
                    $detail = $transaksi->details->firstWhere('id', $d['id']);
                    $qtyLama = $detail->qty;
                    $selisih = $qtyBaru - $qtyLama;

                    if ($selisih != 0) {
                        $this->adjustInventory(
                            $inventories[$product->id],
                            -$selisih,
                            "Update Transaksi #{$transaksi->id}: Ubah qty dari {$qtyLama} ke {$qtyBaru}"
                        );
                    }

                    $detail->update([
                        'product_id'          => $product->id,
                        'harga_product_id'    => $hp->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'qty'                 => $qtyBaru,
                        'harga'               => $hp->harga,
                        'subtotal'            => $subtotal,
                        'discount'            => $discount,
                        'catatan'             => $d['catatan'] ?? null,
                    ]);
                } else {
                    $this->adjustInventory(
                        $inventories[$product->id],
                        -$qtyBaru,
                        "Update Transaksi #{$transaksi->id}: Detail baru (qty {$qtyBaru})"
                    );

                    TransaksiDetail::create([
                        'transaksi_id'        => $transaksi->id,
                        'product_id'          => $product->id,
                        'harga_product_id'    => $hp->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'qty'                 => $qtyBaru,
                        'harga'               => $hp->harga,
                        'subtotal'            => $subtotal,
                        'discount'            => $discount,
                        'catatan'             => $d['catatan'] ?? null,
                    ]);
                }
            }

            $transaksi->update(['total' => $totalTransaksi]);

            Log::info('Transaksi updated', [
                'id' => $transaksi->id,
                'total' => $totalTransaksi,
                'user_id' => Auth::id(),
            ]);

            return $transaksi->fresh()->load([
                'customer',
                'details.product',
                'details.statusTransaksi',
                'details.pembayarans',
            ]);
        });
    }

    public function updateDetailStatus(TransaksiDetail $detail, int $statusId): TransaksiDetail
    {
        return DB::transaction(function () use ($detail, $statusId) {
            $detail = TransaksiDetail::lockForUpdate()->findOrFail($detail->id);
            $oldStatus = $detail->status_transaksi_id;

            $detail->update(['status_transaksi_id' => $statusId]);

            Log::info('TransaksiDetail status updated', [
                'detail_id' => $detail->id,
                'transaksi_id' => $detail->transaksi_id,
                'old_status' => $oldStatus,
                'new_status' => $statusId,
                'user_id' => Auth::id(),
            ]);

            return $detail->fresh()->load('statusTransaksi');
        });
    }

    public function cancelDetail(TransaksiDetail $detail): void
    {
        if ($detail->transaksi->jenis_transaksi !== 'daily') {
            throw new \Exception('Hanya transaksi harian yang bisa dibatalkan per detail.');
        }

        if ($detail->pembayarans && $detail->pembayarans->isNotEmpty()) {
            throw new \Exception('Tidak dapat membatalkan detail yang sudah memiliki pembayaran.');
        }

        DB::transaction(function () use ($detail) {
            $detail = TransaksiDetail::with(['transaksi', 'product'])->lockForUpdate()->findOrFail($detail->id);

            $toko = $this->getTokoPlace();
            $inventory = Inventory::where('product_id', $detail->product_id)
                ->where('place_id', $toko->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->adjustInventory(
                $inventory,
                $detail->qty,
                "Pembatalan Detail Transaksi #{$detail->transaksi->id} (Detail ID: {$detail->id})"
            );

            $detail->update([
                'status_transaksi_id' => self::STATUS_DIBATALKAN,
                'subtotal'            => 0,
                'discount'            => 0,
            ]);

            // Recalculate total transaksi
            $totalBaru = $detail->transaksi->details()
                ->where('id', '!=', $detail->id)
                ->where('status_transaksi_id', '!=', self::STATUS_DIBATALKAN)
                ->sum('subtotal');

            $detail->transaksi->update(['total' => $totalBaru]);

            Log::info('TransaksiDetail cancelled', [
                'detail_id' => $detail->id,
                'transaksi_id' => $detail->transaksi->id,
                'qty_returned' => $detail->qty,
                'user_id' => Auth::id(),
            ]);
        });
    }

    public function delete(Transaksi $transaksi): void
    {
        if ($transaksi->jenis_transaksi !== 'daily') {
            throw new \Exception('Hanya transaksi harian yang dapat dihapus.');
        }

        DB::transaction(function () use ($transaksi) {
            $transaksi = Transaksi::with('details')->lockForUpdate()->findOrFail($transaksi->id);
            $toko = $this->getTokoPlace();

            // Return semua stok
            foreach ($transaksi->details as $detail) {
                $inventory = Inventory::where('product_id', $detail->product_id)
                    ->where('place_id', $toko->id)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $this->adjustInventory(
                        $inventory,
                        $detail->qty,
                        "Hapus Transaksi #{$transaksi->id} (return stok)"
                    );
                }
            }

            $transaksiId = $transaksi->id;
            $transaksi->details()->delete();
            $transaksi->delete();

            Log::info('Transaksi deleted', [
                'id' => $transaksiId,
                'user_id' => Auth::id(),
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    private function getTokoPlace(): Place
    {
        return Place::where('kode', 'TOKO')->firstOrFail();
    }

    private function resolveCustomer(array $data): ?int
    {
        if (!empty($data['customer_id'])) {
            return (int) $data['customer_id'];
        }

        if (!empty($data['customer_baru']['name'])) {
            $customer = Customer::create([
                'name'  => $data['customer_baru']['name'],
                'phone' => $data['customer_baru']['phone'] ?? null,
                'email' => $data['customer_baru']['email'] ?? null,
            ]);
            return $customer->id;
        }

        return null;
    }

    private function resolveHargaProduct(int $productId, ?int $customerId, array $data): HargaProduct
    {
        // 1. Harga baru (create new record)
        if (!empty($data['harga_baru']['harga'])) {
            return HargaProduct::create([
                'product_id'      => $productId,
                'customer_id'     => $customerId,
                'harga'           => $data['harga_baru']['harga'],
                'tanggal_berlaku' => $data['harga_baru']['tanggal_berlaku'] ?? now(),
                'keterangan'      => $data['harga_baru']['keterangan'] ?? null,
            ]);
        }

        // 2. Explicit harga_product_id
        if (!empty($data['harga_product_id'])) {
            return HargaProduct::where('id', $data['harga_product_id'])
                ->where('product_id', $productId)
                ->firstOrFail();
        }

        // 3. Harga customer-specific (latest active)
        if ($customerId) {
            $hp = HargaProduct::where('product_id', $productId)
                ->where('customer_id', $customerId)
                ->where('tanggal_berlaku', '<=', now())
                ->orderByDesc('tanggal_berlaku')
                ->orderByDesc('id')
                ->first();

            if ($hp) return $hp;
        }

        // 4. Harga umum (fallback)
        $hp = HargaProduct::where('product_id', $productId)
            ->whereNull('customer_id')
            ->where('tanggal_berlaku', '<=', now())
            ->orderByDesc('tanggal_berlaku')
            ->orderByDesc('id')
            ->first();

        if (!$hp) {
            throw new \Exception("Harga untuk produk ID {$productId} tidak ditemukan.");
        }

        return $hp;
    }

    /**
     * Validasi stok untuk create transaksi
     *
     * @param array $details
     * @param Collection<int, Inventory> $inventories
     * @return void
     * @throws ValidationException
     */
    private function validateStock(array $details, Collection $inventories): void
    {
        $errors = [];

        foreach ($details as $index => $d) {
            if (empty($d['product_id'])) continue;

            $inventory = $inventories->get($d['product_id']);

            if (!$inventory) {
                $errors["details.{$index}.qty"] = "Inventory tidak tersedia di TOKO";
                continue;
            }

            if ($inventory->qty < $d['qty']) {
                $errors["details.{$index}.qty"] = "Stok tidak cukup. Tersedia: {$inventory->qty}, diminta: {$d['qty']}";
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Validasi stok untuk update transaksi (memperhitungkan qty lama)
     *
     * @param array $newDetails
     * @param Collection<int, TransaksiDetail> $existingDetails
     * @param Collection<int, Inventory> $inventories
     * @return void
     * @throws ValidationException
     */
    private function validateStockForUpdate(array $newDetails, Collection $existingDetails, Collection $inventories): void
    {
        $errors = [];
        $existingMap = $existingDetails->keyBy('id');

        foreach ($newDetails as $index => $d) {
            if (empty($d['product_id'])) continue;

            $inventory = $inventories->get($d['product_id']);
            if (!$inventory) {
                $errors["details.{$index}.qty"] = "Inventory tidak tersedia di TOKO";
                continue;
            }

            $qtyLama = 0;
            if (!empty($d['id']) && $existingMap->has($d['id'])) {
                $qtyLama = $existingMap->get($d['id'])->qty;
            }

            $selisih = $d['qty'] - $qtyLama;

            if ($selisih > 0 && $inventory->qty < $selisih) {
                $errors["details.{$index}.qty"] = "Stok tidak cukup untuk penambahan {$selisih} unit. Tersedia: {$inventory->qty}";
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function adjustInventory(Inventory $inventory, int $qtyChange, string $keterangan): void
    {
        if ($qtyChange == 0) return;

        $absQty = abs($qtyChange);

        if ($qtyChange > 0) {
            $inventory->increment('qty', $absQty);
            $tipe = 'in';
        } else {
            if ($inventory->qty < $absQty) {
                throw new \Exception("Stok tidak mencukupi untuk product ID {$inventory->product_id}. Tersedia: {$inventory->qty}, dibutuhkan: {$absQty}");
            }
            $inventory->decrement('qty', $absQty);
            $tipe = 'out';
        }

        ProductMovement::create([
            'inventory_id' => $inventory->id,
            'tipe'         => $tipe,
            'qty'          => $absQty,
            'keterangan'   => $keterangan,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('Transaksi cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Transaksi cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
