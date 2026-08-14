<?php

namespace App\Services\HargaProduct;

use App\Models\HargaProduct;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HargaProductService
{
    private const CACHE_LIST_PREFIX = 'harga_products:list:';
    private const CACHE_DETAIL_PREFIX = 'harga_products:detail:';
    private const CACHE_CURRENT_PREFIX = 'harga_products:current:';
    private const CACHE_INDEX_KEY = 'harga_products:cache:index';
    
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_CURRENT = 600;
    private const CACHE_TTL_INDEX = 86400;

    public function getList(
        ?string $search = null,
        ?int $productId = null,
        ?int $customerId = null,
        int $perPage = 20,
        int $page = 1
    ): LengthAwarePaginator {
        $cacheKey = $this->buildListCacheKey($search, $productId, $customerId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $productId, $customerId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return HargaProduct::with(['product:id,nama', 'customer:id,nama'])
                ->search($search)
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->when($customerId, fn($q) => $q->where('customer_id', $customerId))
                ->orderByDesc('tanggal_berlaku')
                ->paginate($perPage, ['*'], 'page', $page);
        });
    }

    public function getDetail(int $id): ?HargaProduct
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return HargaProduct::with(['product', 'customer'])->find($id);
        });
    }

    public function getCurrentPrice(int $productId, ?int $customerId = null): ?HargaProduct
    {
        $customerIdStr = $customerId ?? 'null';
        $cacheKey = self::CACHE_CURRENT_PREFIX . "{$productId}:{$customerIdStr}";

        return Cache::remember($cacheKey, self::CACHE_TTL_CURRENT, function () use ($productId, $customerId, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return HargaProduct::with(['product:id,nama', 'customer:id,nama'])
                ->where('product_id', $productId)
                ->where(function ($q) use ($customerId) {
                    $q->whereNull('customer_id')
                      ->orWhere('customer_id', $customerId);
                })
                ->where('tanggal_berlaku', '<=', now())
                ->orderByDesc('tanggal_berlaku')
                ->first();
        });
    }

    public function create(array $data): HargaProduct
    {
        $harga = HargaProduct::create($data);

        $this->invalidateAllCache();

        Log::info('Harga Product created', [
            'id' => $harga->id,
            'product_id' => $harga->product_id,
            'customer_id' => $harga->customer_id,
        ]);

        return $harga->load(['product:id,nama', 'customer:id,nama']);
    }

    public function update(HargaProduct $harga, array $data): HargaProduct
    {
        if (!$harga->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $harga->update($data);

        $this->invalidateAllCache($harga->id);

        Log::info('Harga Product updated', ['id' => $harga->id]);

        return $harga->fresh()->load(['product:id,nama', 'customer:id,nama']);
    }

    public function delete(HargaProduct $harga): array
    {
        $hargaId = $harga->id;
        $harga->delete();

        $this->invalidateAllCache($hargaId);

        Log::info('Harga Product deleted', ['id' => $hargaId]);

        return [
            'success' => true,
            'message' => 'Harga product berhasil dihapus.',
        ];
    }

    private function buildListCacheKey(?string $search, ?int $productId, ?int $customerId, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        $productHash = $productId ? "prod_{$productId}" : 'all_prod';
        $customerHash = $customerId ? "cust_{$customerId}" : 'all_cust';
        
        return self::CACHE_LIST_PREFIX . "{$searchHash}:{$productHash}:{$customerHash}:{$perPage}:{$page}";
    }

    private function trackCacheKey(string $cacheKey): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (!is_array($keys)) {
            $keys = [];
        }

        if (!in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            Cache::put(self::CACHE_INDEX_KEY, $keys, self::CACHE_TTL_INDEX);
        }
    }

    private function invalidateAllCache(?int $hargaId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (!is_array($keys) || empty($keys)) {
            return;
        }

        $remainingKeys = [];
        $detailCacheKey = $hargaId ? self::CACHE_DETAIL_PREFIX . $hargaId : null;

        foreach ($keys as $key) {
            $isListCache = str_starts_with($key, self::CACHE_LIST_PREFIX);
            $isDetailCache = $detailCacheKey && $key === $detailCacheKey;
            $isCurrentCache = str_starts_with($key, self::CACHE_CURRENT_PREFIX);

            if ($isListCache || $isDetailCache || $isCurrentCache) {
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }

        Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, self::CACHE_TTL_INDEX);
    }
}