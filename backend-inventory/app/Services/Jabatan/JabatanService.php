<?php

namespace App\Services\Jabatan;

use App\Models\Jabatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class JabatanService
{
    private const CACHE_LIST_PREFIX = 'jabatans:list:v';
    private const CACHE_DETAIL_PREFIX = 'jabatans:detail:v';
    private const CACHE_DROPDOWN_KEY = 'jabatans:dropdown';
    private const CACHE_STATISTICS_KEY = 'jabatans:statistics';

    private const CACHE_VERSION_KEY = 'jabatans:cache:version';
    private const CACHE_VERSION_LOCK = 'jabatans:cache:version:lock';

    private const CACHE_TTL_LIST = 3600;       // 1 jam
    private const CACHE_TTL_DETAIL = 3600;     // 1 jam
    private const CACHE_TTL_DROPDOWN = 7200;   // 2 jam
    private const CACHE_TTL_STATISTICS = 1800; // 30 menit

    public function getList(
        ?string $search = null,
        bool $withCount = true,
        ?int $perPage = null,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();

        if ($perPage === null) {
            $cacheKey = $this->buildListCacheKey($version, $search, $withCount, 'all', 1);

            $data = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $withCount) {
                $query = Jabatan::select(['id', 'nama', 'created_at', 'updated_at']);

                if ($withCount) {
                    $query->withCount('karyawans');
                }

                if ($search) {
                    $query->where('nama', 'like', "%{$search}%");
                }

                return $query->orderBy('nama', 'asc')->get();
            });

            return [
                'data' => $data,
                'meta' => [
                    'total' => $data->count(),
                    'with_count' => $withCount,
                    'paginated' => false,
                ],
            ];
        }

        $cacheKey = $this->buildListCacheKey($version, $search, $withCount, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $withCount, $perPage, $page) {
            $query = Jabatan::select(['id', 'nama', 'created_at', 'updated_at']);

            if ($withCount) {
                $query->withCount('karyawans');
            }

            if ($search) {
                $query->where('nama', 'like', "%{$search}%");
            }

            return $query->orderBy('nama', 'asc')->paginate($perPage, ['*'], 'page', $page);
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
                'with_count' => $withCount,
                'paginated' => true,
            ],
        ];
    }

    public function getDetail(int $id): ?Jabatan
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return Jabatan::select(['id', 'nama', 'created_at', 'updated_at'])
                ->withCount('karyawans')
                ->find($id);
        });
    }

    public function getForDropdown(): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . ':v' . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return Jabatan::select(['id', 'nama'])
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getStatistics(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_STATISTICS_KEY . ':v' . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_STATISTICS, function () {
            $stats = Jabatan::select(['id', 'nama'])
                ->withCount('karyawans')
                ->orderByDesc('karyawans_count')
                ->get();

            return [
                'total_jabatans' => $stats->count(),
                'total_karyawans' => $stats->sum('karyawans_count'),
                'by_jabatan' => $stats->map(fn($j) => [
                    'id' => $j->id,
                    'nama' => $j->nama,
                    'count' => $j->karyawans_count,
                ])->toArray(),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Jabatan
    {
        return DB::transaction(function () use ($data) {
            $jabatan = Jabatan::create([
                'nama' => $data['nama'],
            ]);

            $this->invalidateCache();

            Log::info('Jabatan created', [
                'id' => $jabatan->id,
                'nama' => $jabatan->nama,
            ]);

            return $jabatan->loadCount('karyawans');
        });
    }

    public function update(Jabatan $jabatan, array $data): Jabatan
    {
        return DB::transaction(function () use ($jabatan, $data) {
            if (!$jabatan->exists) {
                throw new \Exception("Gagal update: Data jabatan tidak valid.");
            }

            $jabatan->update([
                'nama' => $data['nama'],
            ]);

            $this->invalidateCache();

            Log::info('Jabatan updated', [
                'id' => $jabatan->id,
                'nama' => $jabatan->nama,
            ]);

            return $jabatan->fresh()->loadCount('karyawans');
        });
    }

    public function delete(Jabatan $jabatan): array
    {
        if (!isset($jabatan->karyawans_count)) {
            $jabatan->loadCount('karyawans');
        }

        if ($jabatan->karyawans_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Jabatan '{$jabatan->nama}' tidak dapat dihapus karena masih digunakan oleh {$jabatan->karyawans_count} karyawan.",
            ];
        }

        return DB::transaction(function () use ($jabatan) {
            $jabatanId = $jabatan->id;
            $jabatanNama = $jabatan->nama;

            $jabatan->delete();

            $this->invalidateCache();

            Log::info('Jabatan deleted', [
                'id' => $jabatanId,
                'nama' => $jabatanNama,
            ]);

            return [
                'success' => true,
                'message' => "Jabatan '{$jabatanNama}' berhasil dihapus.",
            ];
        });
    }

    private function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    private function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 5);

        try {
            $lock->block(3, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);
            });
        } catch (\Throwable $e) {
            // Fallback tanpa lock
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Jabatan cache invalidation lock failed, used fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        bool $withCount,
        int|string $perPage,
        int $page
    ): string {
        $searchKey = $search ? md5($search) : 'all';
        $countKey = $withCount ? 'with_count' : 'no_count';
        $perPageKey = $perPage === null ? 'all' : $perPage;

        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$countKey}:{$perPageKey}:{$page}";
    }
}