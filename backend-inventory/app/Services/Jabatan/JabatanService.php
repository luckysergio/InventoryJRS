<?php

namespace App\Services\Jabatan;

use App\Models\Jabatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class JabatanService
{
    private const CACHE_LIST_KEY = 'jabatans:list:all';
    private const CACHE_DETAIL_PREFIX = 'jabatans:detail:';
    
    // ✅ TTL 1 Jam (Data master jarang berubah)
    private const CACHE_TTL = 3600;

    public function getList(bool $withCount = true): Collection
    {
        return Cache::remember(self::CACHE_LIST_KEY, self::CACHE_TTL, function () use ($withCount) {
            $query = Jabatan::query();

            if ($withCount) {
                $query->withCount('karyawans');
            }

            return $query->orderBy('nama', 'asc')->get();
        });
    }

    public function getDetail(int $id): ?Jabatan
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            return Jabatan::withCount('karyawans')->find($id);
        });
    }

    public function create(array $data): Jabatan
    {
        $jabatan = Jabatan::create($data);

        $this->invalidateCache();

        Log::info('Jabatan created', ['id' => $jabatan->id, 'nama' => $jabatan->nama]);

        return $jabatan;
    }

    /**
     * ✅ FIX: Gunakan refresh() alih-alih fresh() untuk stabilitas
     */
    public function update(Jabatan $jabatan, array $data): Jabatan
    {
        // ✅ Safeguard: Pastikan model terikat dengan database
        if (!$jabatan->exists) {
            throw new \Exception("Gagal update: Data jabatan tidak valid.");
        }

        $jabatan->update($data);

        $this->invalidateCache($jabatan->id);

        Log::info('Jabatan updated', ['id' => $jabatan->id, 'nama' => $jabatan->nama]);

        return $jabatan->refresh();
    }

    public function delete(Jabatan $jabatan): array
    {
        // ✅ Proteksi: Cek apakah jabatan masih digunakan oleh karyawan
        if ($jabatan->karyawans()->exists()) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Jabatan tidak dapat dihapus karena masih digunakan oleh karyawan.',
            ];
        }

        $jabatanId = $jabatan->id;
        $jabatan->delete();

        $this->invalidateCache($jabatanId);

        Log::info('Jabatan deleted', ['id' => $jabatanId]);

        return [
            'success' => true,
            'message' => 'Jabatan berhasil dihapus.',
        ];
    }

    /**
     * ✅ Invalidate Cache:
     * Selalu hapus cache LIST karena perubahan nama/urutan mempengaruhi seluruh list.
     * Hapus cache DETAIL spesifik jika ID disediakan.
     */
    private function invalidateCache(?int $jabatanId = null): void
    {
        Cache::forget(self::CACHE_LIST_KEY);

        if ($jabatanId) {
            Cache::forget(self::CACHE_DETAIL_PREFIX . $jabatanId);
        }
    }
}