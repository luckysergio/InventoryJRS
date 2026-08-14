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
    private const CACHE_INDEX_KEY = 'harga_products:cache:index';
    
    private const CACHE_TTL_LIST = 300;       // 5 Menit
    private const CACHE_TTL_DETAIL = 900;     // 15 Menit
    private const CACHE_TTL_INDEX = 86400;    // 24 Jam

    public function getList(?string $search = null, ?int $productId = null, ?int $customerId = null, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = $this->buildListCacheKey($search, $productId, $customerId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $productId, $customerId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            $query = HargaProduct::with([
                'product' => fn($q) => $q->with(['jenis', 'type', 'bahan']),
                'customer'
            ]);

            if ($search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('kode', 'like', "%{$search}%");
                });
            }

            if ($productId) {
                $query->where('product_id', $productId);
            }

            if ($customerId) {
                $query->where('customer_id', $customerId);
            }

            return $query->orderByDesc('tanggal_berlaku')
                         ->paginate($perPage, ['*'], 'page', $page);
        });
    }

    public function getDetail(int $id): ?HargaProduct
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return HargaProduct::with([
                'product' => fn($q) => $q->with(['jenis', 'type', 'bahan']),
                'customer'
            ])->find($id);
        });
    }

    public function create(array $data): HargaProduct
    {
        $harga = HargaProduct::create($data);

        $this->invalidateAllCache();

        Log::info('Harga Product created', ['id' => $harga->id, 'product_id' => $harga->product_id]);

        return $harga->load(['product', 'customer']);
    }

    public function update(HargaProduct $harga, array $data): HargaProduct
    {
        if (!$harga->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $harga->update($data);

        $this->invalidateAllCache($harga->id);

        Log::info('Harga Product updated', ['id' => $harga->id]);

        return $harga->fresh()->load(['product', 'customer']);
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
        if (!is_array($keys)) $keys = [];
        
        if (!in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            Cache::put(self::CACHE_INDEX_KEY, $keys, self::CACHE_TTL_INDEX);
        }
    }

    private function invalidateAllCache(?int $hargaId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys) || empty($keys)) return;

        $remainingKeys = [];
        $detailKey = $hargaId ? self::CACHE_DETAIL_PREFIX . $hargaId : null;

        foreach ($keys as $key) {
            if (str_starts_with($key, self::CACHE_LIST_PREFIX) || 
                ($detailKey && $key === $detailKey)) {
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }
        Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, self::CACHE_TTL_INDEX);
    }
}