<?php

namespace App\Services\BahanProduct;

use App\Models\BahanProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BahanProductService
{
    private const CACHE_LIST_KEY = 'bahan_products:list:all';
    private const CACHE_DETAIL_PREFIX = 'bahan_products:detail:';
    private const CACHE_TTL = 3600;

    public function getList(bool $withCount = true): Collection
    {
        return Cache::remember(self::CACHE_LIST_KEY, self::CACHE_TTL, function () use ($withCount) {
            $query = BahanProduct::query();

            if ($withCount) {
                $query->withProductCount();
            }

            return $query->orderBy('nama', 'asc')->get();
        });
    }

    public function getDetail(int $id): ?BahanProduct
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            return BahanProduct::withProductCount()->find($id);
        });
    }

    public function create(array $data): BahanProduct
    {
        $bahan = BahanProduct::create($data);

        $this->invalidateCache();

        Log::info('Bahan Product created', ['id' => $bahan->id, 'nama' => $bahan->nama]);

        return $bahan;
    }

    public function update(BahanProduct $bahan, array $data): BahanProduct
    {
        if (!$bahan->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $bahan->update($data);

        $this->invalidateCache($bahan->id);

        Log::info('Bahan Product updated', ['id' => $bahan->id]);

        return $bahan->refresh();
    }

    public function delete(BahanProduct $bahan): array
    {
        if ($bahan->products()->exists()) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Bahan product tidak dapat dihapus karena masih digunakan oleh data Product.',
            ];
        }

        $bahanId = $bahan->id;
        $bahan->delete();

        $this->invalidateCache($bahanId);

        Log::info('Bahan Product deleted', ['id' => $bahanId]);

        return [
            'success' => true,
            'message' => 'Bahan product berhasil dihapus.',
        ];
    }

    private function invalidateCache(?int $bahanId = null): void
    {
        Cache::forget(self::CACHE_LIST_KEY);

        if ($bahanId) {
            Cache::forget(self::CACHE_DETAIL_PREFIX . $bahanId);
        }
    }
}