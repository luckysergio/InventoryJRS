<?php

namespace App\Services\HargaProduct;

use App\Models\HargaProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HargaProductService
{
    /*
    |--------------------------------------------------------------------------
    | Cache Configuration (Versioning Strategy)
    |--------------------------------------------------------------------------
    */
    private const CACHE_LIST_PREFIX = 'harga_products:list:v';
    private const CACHE_DETAIL_PREFIX = 'harga_products:detail:v';
    private const CACHE_BY_PRODUCT_KEY = 'harga_products:by_product:v';
    private const CACHE_ACTIVE_PRICE_KEY = 'harga_products:active:v';

    private const CACHE_VERSION_KEY = 'harga_products:cache:version';
    private const CACHE_VERSION_LOCK = 'harga_products:cache:version:lock';

    private const CACHE_TTL_LIST = 300;         // 5 menit
    private const CACHE_TTL_DETAIL = 900;       // 15 menit
    private const CACHE_TTL_BY_PRODUCT = 600;   // 10 menit
    private const CACHE_TTL_ACTIVE_PRICE = 300; // 5 menit

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Get list harga products dengan filter & pagination.
     *
     * @return array{data: Collection|array, meta: array}
     */
    public function getList(
        ?string $search = null,
        ?int $productId = null,
        ?int $customerId = null,
        int $perPage = 20,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $productId, $customerId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $productId, $customerId, $perPage, $page) {
            $query = HargaProduct::select([
                'harga_products.id',
                'harga_products.product_id',
                'harga_products.customer_id',
                'harga_products.harga',
                'harga_products.tanggal_berlaku',
                'harga_products.keterangan',
                'harga_products.created_at',
                'harga_products.updated_at',
            ])
                ->with([
                    'product' => fn($q) => $q->select('id', 'kode', 'ukuran', 'jenis_id', 'type_id', 'bahan_id')
                        ->with([
                            'jenis' => fn($j) => $j->select('id', 'nama'),
                            'type' => fn($t) => $t->select('id', 'nama'),
                            'bahan' => fn($b) => $b->select('id', 'nama'),
                        ]),
                    'customer' => fn($q) => $q->select('id', 'name'),
                ]);

            // Search by product kode
            if ($search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('kode', 'like', "%{$search}%");
                });
            }

            if ($productId) {
                $query->where('harga_products.product_id', $productId);
            }

            if ($customerId) {
                $query->where('harga_products.customer_id', $customerId);
            }

            return $query->orderByDesc('harga_products.tanggal_berlaku')
                         ->paginate($perPage, ['*'], 'page', $page);
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

    /**
     * Get detail harga product by ID.
     */
    public function getDetail(int $id): ?HargaProduct
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return HargaProduct::with([
                'product' => fn($q) => $q->select('id', 'kode', 'ukuran', 'jenis_id', 'type_id', 'bahan_id')
                    ->with([
                        'jenis' => fn($j) => $j->select('id', 'nama'),
                        'type' => fn($t) => $t->select('id', 'nama'),
                        'bahan' => fn($b) => $b->select('id', 'nama'),
                    ]),
                'customer' => fn($q) => $q->select('id', 'name'),
            ])->find($id);
        });
    }

    /**
     * Get harga products by product_id (untuk halaman detail product).
     */
    public function getByProduct(int $productId): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_BY_PRODUCT_KEY . $version . ':' . $productId;

        return Cache::remember($cacheKey, self::CACHE_TTL_BY_PRODUCT, function () use ($productId) {
            return HargaProduct::select([
                'id', 'product_id', 'customer_id', 'harga', 'tanggal_berlaku', 'keterangan',
            ])
                ->with(['customer' => fn($q) => $q->select('id', 'name')])
                ->where('product_id', $productId)
                ->orderByDesc('tanggal_berlaku')
                ->get();
        });
    }

    /**
     * Get active price for a product + customer combination.
     * Digunakan saat transaksi untuk mendapatkan harga yang berlaku.
     */
    public function getActivePrice(int $productId, ?int $customerId = null): ?HargaProduct
    {
        $version = $this->getCacheVersion();
        $custKey = $customerId ?? 'general';
        $cacheKey = self::CACHE_ACTIVE_PRICE_KEY . $version . ":{$productId}:{$custKey}";

        return Cache::remember($cacheKey, self::CACHE_TTL_ACTIVE_PRICE, function () use ($productId, $customerId) {
            // Prioritas: harga customer-specific > harga umum
            $query = HargaProduct::where('product_id', $productId)
                ->where('tanggal_berlaku', '<=', now())
                ->orderByRaw('customer_id IS NOT NULL DESC') // Customer-specific first
                ->orderByDesc('tanggal_berlaku');

            if ($customerId) {
                $query->where(function ($q) use ($customerId) {
                    $q->where('customer_id', $customerId)
                      ->orWhereNull('customer_id');
                });
            } else {
                $query->whereNull('customer_id');
            }

            return $query->first();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS (With Transactions)
    |--------------------------------------------------------------------------
    */

    /**
     * Create new harga product.
     */
    public function create(array $data): HargaProduct
    {
        return DB::transaction(function () use ($data) {
            $harga = HargaProduct::create([
                'product_id' => $data['product_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'harga' => $data['harga'],
                'tanggal_berlaku' => $data['tanggal_berlaku'] ?? now(),
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            $this->invalidateCache();

            Log::info('HargaProduct created', [
                'id' => $harga->id,
                'product_id' => $harga->product_id,
                'customer_id' => $harga->customer_id,
                'harga' => $harga->harga,
            ]);

            return $harga->load([
                'product' => fn($q) => $q->select('id', 'kode', 'ukuran'),
                'customer' => fn($q) => $q->select('id', 'name'),
            ]);
        });
    }

    /**
     * Update existing harga product.
     */
    public function update(HargaProduct $harga, array $data): HargaProduct
    {
        return DB::transaction(function () use ($harga, $data) {
            if (!$harga->exists) {
                throw new \Exception("Gagal update: Data harga product tidak valid.");
            }

            $harga->update([
                'product_id' => $data['product_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'harga' => $data['harga'],
                'tanggal_berlaku' => $data['tanggal_berlaku'] ?? $harga->tanggal_berlaku,
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            $this->invalidateCache();

            Log::info('HargaProduct updated', [
                'id' => $harga->id,
                'changes' => ['product_id', 'customer_id', 'harga', 'tanggal_berlaku', 'keterangan'],
            ]);

            return $harga->fresh()->load([
                'product' => fn($q) => $q->select('id', 'kode', 'ukuran'),
                'customer' => fn($q) => $q->select('id', 'name'),
            ]);
        });
    }

    /**
     * Delete harga product.
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(HargaProduct $harga): array
    {
        // Early capture untuk safeguard
        $id = $harga->id;
        $productId = $harga->product_id;

        if (!$id) {
            Log::error('HargaProduct delete: Invalid model state', [
                'exists' => $harga->exists,
                'id' => $id,
            ]);

            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data harga product tidak valid.',
            ];
        }

        return DB::transaction(function () use ($harga, $id, $productId) {
            $harga->delete();

            $this->invalidateCache();

            Log::info('HargaProduct deleted', [
                'id' => $id,
                'product_id' => $productId,
            ]);

            return [
                'success' => true,
                'message' => 'Harga product berhasil dihapus.',
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT (Versioning Strategy)
    |--------------------------------------------------------------------------
    */

    private function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    /**
     * Invalidate semua cache harga product dengan increment version.
     * O(1) operation - hanya 1 file write untuk invalidasi semua cache.
     */
    private function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                $newVersion = $current + 1;

                Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

                Log::info('HargaProduct cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $newVersion,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            $newVersion = $current + 1;
            Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

            Log::warning('HargaProduct cache invalidation fallback used', [
                'error' => $e->getMessage(),
                'old_version' => $current,
                'new_version' => $newVersion,
            ]);
        }
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        ?int $productId,
        ?int $customerId,
        int $perPage,
        int $page
    ): string {
        $searchKey = $search ? md5($search) : 'all';
        $productKey = $productId ?? 'all';
        $customerKey = $customerId ?? 'all';

        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$productKey}:{$customerKey}:{$perPage}:{$page}";
    }
}