<?php

namespace App\Services\JenisProduct;

use App\Models\JenisProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class JenisProductService
{
    private const CACHE_LIST_PREFIX = 'jenis_products:list:v';
    private const CACHE_DETAIL_PREFIX = 'jenis_products:detail:v';
    private const CACHE_DROPDOWN_KEY = 'jenis_products:dropdown:v';
    private const CACHE_STATISTICS_KEY = 'jenis_products:statistics:v';

    private const CACHE_VERSION_KEY = 'jenis_products:cache:version';
    private const CACHE_VERSION_LOCK = 'jenis_products:cache:version:lock';

    private const CACHE_TTL_LIST = 3600;       // 1 jam
    private const CACHE_TTL_DETAIL = 3600;     // 1 jam
    private const CACHE_TTL_DROPDOWN = 7200;   // 2 jam
    private const CACHE_TTL_STATISTICS = 1800; // 30 menit

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

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
                $query = JenisProduct::select(['id', 'nama', 'created_at', 'updated_at']);

                if ($withCount) {
                    $query->withCount(['products', 'types']);
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
            $query = JenisProduct::select(['id', 'nama', 'created_at', 'updated_at']);

            if ($withCount) {
                $query->withCount(['products', 'types']);
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

    public function getDetail(int $id): ?JenisProduct
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return JenisProduct::select(['id', 'nama', 'created_at', 'updated_at'])
                ->withCount(['products', 'types'])
                ->find($id);
        });
    }

    public function getForDropdown(): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return JenisProduct::select(['id', 'nama'])
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getStatistics(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_STATISTICS_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_STATISTICS, function () {
            $stats = JenisProduct::select(['id', 'nama'])
                ->withCount(['products', 'types'])
                ->orderByDesc('products_count')
                ->get();

            return [
                'total_jenis' => $stats->count(),
                'total_products' => $stats->sum('products_count'),
                'total_types' => $stats->sum('types_count'),
                'by_jenis' => $stats->map(fn($j) => [
                    'id' => $j->id,
                    'nama' => $j->nama,
                    'products_count' => $j->products_count,
                    'types_count' => $j->types_count,
                ])->toArray(),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): JenisProduct
    {
        return DB::transaction(function () use ($data) {
            $jenis = JenisProduct::create([
                'nama' => $data['nama'],
            ]);

            // Internal invalidation untuk cache sendiri
            $this->invalidateCache();

            Log::info('JenisProduct created', [
                'id' => $jenis->id,
                'nama' => $jenis->nama,
            ]);

            return $jenis->loadCount(['products', 'types']);
        });
    }

    public function update(JenisProduct $jenisProduct, array $data): JenisProduct
    {
        return DB::transaction(function () use ($jenisProduct, $data) {
            if (!$jenisProduct->exists) {
                throw new \Exception("Gagal update: Data jenis product tidak valid.");
            }

            $jenisProduct->update([
                'nama' => $data['nama'],
            ]);

            $this->invalidateCache();

            Log::info('JenisProduct updated', [
                'id' => $jenisProduct->id,
                'nama' => $jenisProduct->nama,
            ]);

            return $jenisProduct->fresh()->loadCount(['products', 'types']);
        });
    }

    public function delete(JenisProduct $jenisProduct): array
    {
        $id = $jenisProduct->id;
        $nama = $jenisProduct->nama;

        if (!$id || !$nama) {
            Log::error('JenisProduct delete: Invalid model state', [
                'exists' => $jenisProduct->exists,
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data jenis product tidak valid.',
            ];
        }

        if (!isset($jenisProduct->products_count) || !isset($jenisProduct->types_count)) {
            $jenisProduct->loadCount(['products', 'types']);
        }

        if ($jenisProduct->products_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Jenis produk '{$nama}' tidak dapat dihapus karena masih digunakan oleh {$jenisProduct->products_count} produk.",
            ];
        }

        if ($jenisProduct->types_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Jenis produk '{$nama}' tidak dapat dihapus karena masih memiliki {$jenisProduct->types_count} tipe produk.",
            ];
        }

        return DB::transaction(function () use ($jenisProduct, $id, $nama) {
            $jenisProduct->delete();

            $this->invalidateCache();

            Log::info('JenisProduct deleted', [
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => true,
                'message' => "Jenis produk '{$nama}' berhasil dihapus.",
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT (PUBLIC - untuk dipanggil dari controller/service lain)
    |--------------------------------------------------------------------------
    */

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    /**
     * ✅ PUBLIC: Invalidate semua cache JenisProduct.
     * Bisa dipanggil dari controller atau service lain (TypeProduct, Product).
     */
    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                $newVersion = $current + 1;

                Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

                Log::info('JenisProduct cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $newVersion,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            $newVersion = $current + 1;
            Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

            Log::warning('JenisProduct cache invalidation fallback used', [
                'error' => $e->getMessage(),
                'old_version' => $current,
                'new_version' => $newVersion,
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