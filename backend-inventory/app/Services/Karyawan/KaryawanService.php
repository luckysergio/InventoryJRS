<?php

namespace App\Services\Karyawan;

use App\Models\Karyawan;
use App\Models\Jabatan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class KaryawanService
{
    private const CACHE_LIST_PREFIX = 'karyawans:list:';
    private const CACHE_DETAIL_PREFIX = 'karyawans:detail:';
    private const CACHE_INDEX_KEY = 'karyawans:cache:index';
    
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_INDEX = 86400;

    public function getList(?string $search = null, ?int $jabatanId = null, int $perPage = 10, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = $this->buildListCacheKey($search, $jabatanId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jabatanId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return Karyawan::with('jabatan:id,nama')
                ->search($search)
                ->byJabatan($jabatanId)
                ->orderBy('nama', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);
        });
    }

    public function getDetail(int $id): ?Karyawan
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return Karyawan::with('jabatan:id,nama')->find($id);
        });
    }

    public function create(array $data): Karyawan
    {
        $jabatanId = $this->resolveJabatanId($data['jabatan_id'] ?? null, $data['jabatan_nama'] ?? null);

        $karyawan = Karyawan::create([
            'nama'       => $data['nama'],
            'no_hp'      => $data['no_hp'],
            'email'      => $data['email'],
            'jabatan_id' => $jabatanId,
        ]);

        $this->invalidateAllCache();

        Log::info('Karyawan created', ['id' => $karyawan->id, 'nama' => $karyawan->nama]);

        return $karyawan->load('jabatan:id,nama');
    }

    public function update(Karyawan $karyawan, array $data): Karyawan
    {
        $jabatanId = $this->resolveJabatanId($data['jabatan_id'] ?? null, $data['jabatan_nama'] ?? null);

        $karyawan->update([
            'nama'       => $data['nama'],
            'no_hp'      => $data['no_hp'],
            'email'      => $data['email'],
            'jabatan_id' => $jabatanId,
        ]);

        $this->invalidateAllCache($karyawan->id);

        Log::info('Karyawan updated', ['id' => $karyawan->id]);

        return $karyawan->refresh()->load('jabatan:id,nama');
    }

    public function delete(Karyawan $karyawan): array
    {
        $karyawanId = $karyawan->id;
        $karyawan->delete();

        $this->invalidateAllCache($karyawanId);

        Log::info('Karyawan deleted', ['id' => $karyawanId]);

        return [
            'success' => true,
            'message' => 'Karyawan berhasil dihapus.',
        ];
    }

    private function buildListCacheKey(?string $search, ?int $jabatanId, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        $jabatanHash = $jabatanId ? "jabatan_{$jabatanId}" : 'all_jabatans';
        
        return self::CACHE_LIST_PREFIX . "{$searchHash}:{$jabatanHash}:{$perPage}:{$page}";
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

    private function invalidateAllCache(?int $karyawanId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (!is_array($keys) || empty($keys)) {
            return;
        }

        $remainingKeys = [];
        $detailCacheKey = $karyawanId ? self::CACHE_DETAIL_PREFIX . $karyawanId : null;

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

    private function resolveJabatanId(?int $jabatanId, ?string $jabatanNama): ?int
    {
        if ($jabatanId) {
            return $jabatanId;
        }

        if ($jabatanNama) {
            $jabatan = Jabatan::firstOrCreate(
                ['nama' => strtoupper(trim($jabatanNama))]
            );
            return $jabatan->id;
        }

        return null;
    }
}