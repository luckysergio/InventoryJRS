<?php

namespace App\Services\Inventory;

use App\Models\Inventory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    private const CACHE_LIST_PREFIX = 'inventory:list:v';
    private const CACHE_LOW_STOCK_PREFIX = 'inventory:low_stock:v';
    private const CACHE_BY_PLACE_PREFIX = 'inventory:by_place:v';
    private const CACHE_BY_PRODUCT_PREFIX = 'inventory:by_product:v';
    private const CACHE_TOTAL_PREFIX = 'inventory:total:v';
    private const CACHE_VERSION_KEY = 'inventory:cache:version';
    private const CACHE_VERSION_LOCK = 'inventory:cache:version:lock';
    private const CACHE_TTL = 300;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getList(?string $search = null, ?int $placeId = null, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([$search, $placeId, $perPage, $page]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($search, $placeId, $perPage, $page) {
            $query = Inventory::with([
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                'place:id,nama,kode',
            ])
                ->when($placeId, fn($q) => $q->where('place_id', $placeId))
                ->when($search, function ($q) use ($search) {
                    $q->whereHas('product', function ($sub) use ($search) {
                        $sub->where('kode', 'like', "%{$search}%")
                            ->orWhere('ukuran', 'like', "%{$search}%")
                            ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"))
                            ->orWhereHas('type', fn($t) => $t->where('nama', 'like', "%{$search}%"));
                    });
                })
                ->orderBy('place_id')
                ->orderBy('product_id');

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

    public function getByPlace(int $placeId, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_BY_PLACE_PREFIX . "{$version}:{$placeId}:{$perPage}:{$page}";

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($placeId, $perPage, $page) {
            return Inventory::with([
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                'place:id,nama,kode',
            ])
                ->where('place_id', $placeId)
                ->orderBy('product_id')
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

    public function getByProduct(int $productId, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_BY_PRODUCT_PREFIX . "{$version}:{$productId}:{$perPage}:{$page}";

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($productId, $perPage, $page) {
            return Inventory::with(['place:id,nama,kode'])
                ->where('product_id', $productId)
                ->orderBy('place_id')
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

    public function getTotalByProduct(int $productId): int
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_TOTAL_PREFIX . "{$version}:{$productId}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($productId) {
            return (int) Inventory::where('product_id', $productId)->sum('qty');
        });
    }

    public function getLowStock(int $threshold = 10, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LOW_STOCK_PREFIX . "{$version}:{$threshold}:{$perPage}:{$page}";

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($threshold, $perPage, $page) {
            return Inventory::with([
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                'place:id,nama,kode',
            ])
                ->where('qty', '<=', $threshold)
                ->orderBy('qty')
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

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    /**
     * ✅ Invalidate semua cache Inventory.
     * Dipanggil saat stok berubah (transaksi, produksi, stok opname selesai).
     */
    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('Inventory cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Inventory cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}