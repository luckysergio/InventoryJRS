<?php

namespace App\Services\Karyawan;

use App\Models\Karyawan;
use App\Models\Jabatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KaryawanService
{
    private const CACHE_LIST_PREFIX = 'karyawans:list:v';
    private const CACHE_DETAIL_PREFIX = 'karyawans:detail:v';
    private const CACHE_DROPDOWN_KEY = 'karyawans:dropdown:v';
    private const CACHE_STATISTICS_KEY = 'karyawans:statistics:v';

    private const CACHE_VERSION_KEY = 'karyawans:cache:version';
    private const CACHE_VERSION_LOCK = 'karyawans:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_DROPDOWN = 3600;
    private const CACHE_TTL_STATISTICS = 1800;

    public function getList(
        ?string $search = null,
        ?int $jabatanId = null,
        int $perPage = 10,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $jabatanId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jabatanId, $perPage, $page) {
            $query = Karyawan::select([
                'karyawans.id',
                'karyawans.nama',
                'karyawans.no_hp',
                'karyawans.email',
                'karyawans.jabatan_id',
                'karyawans.created_at',
                'karyawans.updated_at',
            ])
                ->with(['jabatan' => fn($q) => $q->select('id', 'nama')])
                ->search($search)
                ->byJabatan($jabatanId)
                ->orderBy('karyawans.nama', 'asc');

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

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
        });
    }

    public function getDetail(int $id): ?Karyawan
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return Karyawan::with(['jabatan' => fn($q) => $q->select('id', 'nama')])
                ->find($id);
        });
    }

    public function getForDropdown(): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return Karyawan::select(['id', 'nama', 'no_hp'])
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getStatistics(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_STATISTICS_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_STATISTICS, function () {
            $stats = Karyawan::select('jabatan_id')
                ->selectRaw('COUNT(*) as count')
                ->with(['jabatan' => fn($q) => $q->select('id', 'nama')])
                ->groupBy('jabatan_id')
                ->orderByDesc('count')
                ->get();

            return [
                'total_karyawans' => Karyawan::count(),
                'by_jabatan' => $stats->map(fn($s) => [
                    'jabatan_id' => $s->jabatan_id,
                    'jabatan_nama' => $s->jabatan?->nama ?? 'Tanpa Jabatan',
                    'count' => $s->count,
                ])->toArray(),
            ];
        });
    }

    public function create(array $data): Karyawan
    {
        return DB::transaction(function () use ($data) {
            $jabatanId = $this->resolveJabatanId(
                $data['jabatan_id'] ?? null,
                $data['jabatan_nama'] ?? null
            );

            $karyawan = Karyawan::create([
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'],
                'email' => $data['email'],
                'jabatan_id' => $jabatanId,
            ]);

            $this->invalidateCache();

            Log::info('Karyawan created', [
                'id' => $karyawan->id,
                'nama' => $karyawan->nama,
                'jabatan_id' => $jabatanId,
            ]);

            return $karyawan->load(['jabatan' => fn($q) => $q->select('id', 'nama')]);
        });
    }

    public function update(Karyawan $karyawan, array $data): Karyawan
    {
        return DB::transaction(function () use ($karyawan, $data) {
            if (!$karyawan->exists) {
                throw new \Exception("Gagal update: Data karyawan tidak valid.");
            }

            $jabatanId = $this->resolveJabatanId(
                $data['jabatan_id'] ?? null,
                $data['jabatan_nama'] ?? null
            );

            $karyawan->update([
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'],
                'email' => $data['email'],
                'jabatan_id' => $jabatanId,
            ]);

            $this->invalidateCache();

            Log::info('Karyawan updated', [
                'id' => $karyawan->id,
                'changes' => ['nama', 'no_hp', 'email', 'jabatan_id'],
            ]);

            return $karyawan->fresh()->load(['jabatan' => fn($q) => $q->select('id', 'nama')]);
        });
    }

    public function delete(Karyawan $karyawan): array
    {
        $karyawanId = $karyawan->id;
        $karyawanNama = $karyawan->nama;

        if (!$karyawanId || !$karyawanNama) {
            Log::error('Karyawan delete: Invalid model state', [
                'exists' => $karyawan->exists,
                'id' => $karyawanId,
                'nama' => $karyawanNama,
            ]);

            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data karyawan tidak valid.',
            ];
        }

        if ($karyawan->productions()->exists()) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Karyawan '{$karyawanNama}' tidak dapat dihapus karena masih memiliki riwayat produksi.",
            ];
        }

        return DB::transaction(function () use ($karyawan, $karyawanId, $karyawanNama) {
            $karyawan->delete();

            $this->invalidateCache();

            Log::info('Karyawan deleted', [
                'id' => $karyawanId,
                'nama' => $karyawanNama,
            ]);

            return [
                'success' => true,
                'message' => "Karyawan '{$karyawanNama}' berhasil dihapus.",
            ];
        });
    }

    private function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    private function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                $newVersion = $current + 1;

                Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

                Log::info('Karyawan cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $newVersion,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Karyawan cache invalidation fallback used', [
                'error' => $e->getMessage(),
                'old_version' => $current,
                'new_version' => $current + 1,
            ]);
        }
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        ?int $jabatanId,
        int $perPage,
        int $page
    ): string {
        $searchKey = $search ? md5($search) : 'all';
        $jabatanKey = $jabatanId ?? 'all';

        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$jabatanKey}:{$perPage}:{$page}";
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
