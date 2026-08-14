<?php

namespace App\Services\Distributor;

use App\Models\Distributor;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DistributorService
{
    private const CACHE_LIST_PREFIX = 'distributors:list:';
    private const CACHE_DETAIL_PREFIX = 'distributors:detail:';
    private const CACHE_INDEX_KEY = 'distributors:cache:index';
    
    private const CACHE_TTL_LIST = 300;      // 5 Menit
    private const CACHE_TTL_DETAIL = 900;    // 15 Menit
    private const CACHE_TTL_INDEX = 86400;   // 24 Jam

    public function getList(?string $search = null, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = $this->buildListCacheKey($search, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return Distributor::withProductCount()
                ->search($search)
                ->orderBy('nama', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);
        });
    }

    public function getDetail(int $id): ?Distributor
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return Distributor::withProductCount()->find($id);
        });
    }

    public function create(array $data): Distributor
    {
        $distributor = Distributor::create($data);

        $this->invalidateAllCache();

        Log::info('Distributor created', ['id' => $distributor->id, 'nama' => $distributor->nama]);

        return $distributor;
    }

    public function update(Distributor $distributor, array $data): Distributor
    {
        if (!$distributor->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $distributor->update($data);

        $this->invalidateAllCache($distributor->id);

        Log::info('Distributor updated', ['id' => $distributor->id]);

        return $distributor->refresh();
    }

    public function delete(Distributor $distributor): array
    {
        if ($distributor->products()->exists()) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Distributor tidak dapat dihapus karena masih memiliki product.',
            ];
        }

        $distributorId = $distributor->id;
        $distributor->delete();

        $this->invalidateAllCache($distributorId);

        Log::info('Distributor deleted', ['id' => $distributorId]);

        return [
            'success' => true,
            'message' => 'Distributor berhasil dihapus.',
        ];
    }

    private function buildListCacheKey(?string $search, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        return self::CACHE_LIST_PREFIX . "{$searchHash}:{$perPage}:{$page}";
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

    private function invalidateAllCache(?int $distributorId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys) || empty($keys)) return;

        $remainingKeys = [];
        $detailCacheKey = $distributorId ? self::CACHE_DETAIL_PREFIX . $distributorId : null;

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