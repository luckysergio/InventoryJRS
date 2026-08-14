<?php

namespace App\Services\JenisProduct;

use App\Models\JenisProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class JenisProductService
{
    private const CACHE_LIST_KEY = 'jenis_products:list:all';
    private const CACHE_DETAIL_PREFIX = 'jenis_products:detail:';
    private const CACHE_TTL = 3600; // 1 Jam (Data master jarang berubah)

    public function getList(bool $withCounts = true): Collection
    {
        return Cache::remember(self::CACHE_LIST_KEY, self::CACHE_TTL, function () use ($withCounts) {
            $query = JenisProduct::query();

            if ($withCounts) {
                $query->withCounts();
            }

            return $query->orderBy('nama', 'asc')->get();
        });
    }

    public function getDetail(int $id): ?JenisProduct
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            return JenisProduct::withCounts()->find($id);
        });
    }

    public function create(array $data): JenisProduct
    {
        $jenis = JenisProduct::create($data);

        $this->invalidateCache();

        Log::info('Jenis Product created', ['id' => $jenis->id, 'nama' => $jenis->nama]);

        return $jenis;
    }

    public function update(JenisProduct $jenis, array $data): JenisProduct
    {
        if (!$jenis->exists) {
            throw new \Exception("Gagal update: Data tidak valid.");
        }

        $jenis->update($data);

        $this->invalidateCache($jenis->id);

        Log::info('Jenis Product updated', ['id' => $jenis->id]);

        return $jenis->refresh();
    }

    public function delete(JenisProduct $jenis): array
    {
        // ✅ PROTEKSI DATA: Cek apakah masih digunakan oleh Product atau Type
        if ($jenis->products()->exists() || $jenis->types()->exists()) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Jenis product tidak dapat dihapus karena masih digunakan oleh data Product atau Type.',
            ];
        }

        $jenisId = $jenis->id;
        $jenis->delete();

        $this->invalidateCache($jenisId);

        Log::info('Jenis Product deleted', ['id' => $jenisId]);

        return [
            'success' => true,
            'message' => 'Jenis product berhasil dihapus.',
        ];
    }

    private function invalidateCache(?int $jenisId = null): void
    {
        Cache::forget(self::CACHE_LIST_KEY);

        if ($jenisId) {
            Cache::forget(self::CACHE_DETAIL_PREFIX . $jenisId);
        }
    }
}