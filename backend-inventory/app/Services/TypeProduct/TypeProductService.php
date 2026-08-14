<?php

namespace App\Services\TypeProduct;

use App\Models\TypeProduct;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TypeProductService
{
    private const CACHE_LIST_PREFIX = 'type_products:list:';
    private const CACHE_DETAIL_PREFIX = 'type_products:detail:';
    private const CACHE_INDEX_KEY = 'type_products:cache:index';
    
    private const CACHE_TTL_LIST = 1800;    // 30 Menit
    private const CACHE_TTL_DETAIL = 3600;  // 1 Jam
    private const CACHE_TTL_INDEX = 86400;  // 24 Jam

    public function getList(?string $search = null, ?int $jenisId = null, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = $this->buildListCacheKey($search, $jenisId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return TypeProduct::with('jenis:id,nama')
                ->withProductCount()
                ->search($search)
                ->byJenis($jenisId)
                ->orderBy('nama', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);
        });
    }

    public function getDetail(int $id): ?TypeProduct
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return TypeProduct::with('jenis:id,nama')->withProductCount()->find($id);
        });
    }

    public function create(array $data): TypeProduct
    {
        $type = TypeProduct::create($data);

        $this->invalidateAllCache();

        Log::info('Type Product created', ['id' => $type->id, 'nama' => $type->nama]);

        return $type->load('jenis:id,nama');
    }

    public function update(TypeProduct $type, array $data): TypeProduct
    {
        if (!$type->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $type->update($data);

        // ✅ Invalidate cache list + detail spesifik
        $this->invalidateAllCache($type->id);

        Log::info('Type Product updated', ['id' => $type->id]);

        return $type->refresh()->load('jenis:id,nama');
    }

    public function delete(TypeProduct $type): array
    {
        if ($type->products()->exists()) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Type product tidak dapat dihapus karena masih digunakan oleh data Product.',
            ];
        }

        $typeId = $type->id;
        $type->delete();

        $this->invalidateAllCache($typeId);

        Log::info('Type Product deleted', ['id' => $typeId]);

        return [
            'success' => true,
            'message' => 'Type product berhasil dihapus.',
        ];
    }

    private function buildListCacheKey(?string $search, ?int $jenisId, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        $jenisHash = $jenisId ? "jenis_{$jenisId}" : 'all_jenis';
        
        return self::CACHE_LIST_PREFIX . "{$searchHash}:{$jenisHash}:{$perPage}:{$page}";
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

    private function invalidateAllCache(?int $typeId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (!is_array($keys) || empty($keys)) {
            return;
        }

        $remainingKeys = [];
        $detailCacheKey = $typeId ? self::CACHE_DETAIL_PREFIX . $typeId : null;

        foreach ($keys as $key) {
            $isListCache = str_starts_with($key, self::CACHE_LIST_PREFIX);
            $isTargetDetail = $detailCacheKey && $key === $detailCacheKey;

            if ($isListCache || $isTargetDetail) {
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }

        Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, self::CACHE_TTL_INDEX);
    }
}