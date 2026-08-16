<?php

namespace App\Services\BahanProduct;

use App\Models\BahanProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BahanProductService
{
    private const CACHE_LIST_PREFIX = 'bahan_products:list:v';
    private const CACHE_DETAIL_PREFIX = 'bahan_products:detail:v';
    private const CACHE_DROPDOWN_KEY = 'bahan_products:dropdown:v';
    private const CACHE_STATISTICS_KEY = 'bahan_products:statistics:v';

    private const CACHE_VERSION_KEY = 'bahan_products:cache:version';
    private const CACHE_VERSION_LOCK = 'bahan_products:cache:version:lock';

    private const CACHE_TTL_LIST = 3600;       // 1 jam
    private const CACHE_TTL_DETAIL = 3600;     // 1 jam
    private const CACHE_TTL_DROPDOWN = 7200;   // 2 jam
    private const CACHE_TTL_STATISTICS = 1800; // 30 menit

    /**
     * Get list bahan products dengan search & pagination support.
     *
     * @return array{data: Collection|array, meta: array}
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
                $query = BahanProduct::select(['id', 'nama', 'created_at', 'updated_at']);

                if ($withCount) {
                    $query->withCount('products');
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
            $query = BahanProduct::select(['id', 'nama', 'created_at', 'updated_at']);

            if ($withCount) {
                $query->withCount('products');
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

    public function getDetail(int $id): ?BahanProduct
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return BahanProduct::select(['id', 'nama', 'created_at', 'updated_at'])
                ->withCount('products')
                ->find($id);
        });
    }

    public function getForDropdown(): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return BahanProduct::select(['id', 'nama'])
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getStatistics(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_STATISTICS_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_STATISTICS, function () {
            $stats = BahanProduct::select(['id', 'nama'])
                ->withCount('products')
                ->orderByDesc('products_count')
                ->get();

            return [
                'total_bahan' => $stats->count(),
                'total_products' => $stats->sum('products_count'),
                'by_bahan' => $stats->map(fn($b) => [
                    'id' => $b->id,
                    'nama' => $b->nama,
                    'products_count' => $b->products_count,
                ])->toArray(),
            ];
        });
    }

    public function create(array $data): BahanProduct
    {
        return DB::transaction(function () use ($data) {
            $bahan = BahanProduct::create([
                'nama' => $data['nama'],
            ]);

            $this->invalidateCache();

            Log::info('BahanProduct created', [
                'id' => $bahan->id,
                'nama' => $bahan->nama,
            ]);

            return $bahan->loadCount('products');
        });
    }

    public function update(BahanProduct $bahan, array $data): BahanProduct
    {
        return DB::transaction(function () use ($bahan, $data) {
            if (!$bahan->exists) {
                throw new \Exception("Gagal update: Data bahan product tidak valid.");
            }

            $bahan->update([
                'nama' => $data['nama'],
            ]);

            $this->invalidateCache();

            Log::info('BahanProduct updated', [
                'id' => $bahan->id,
                'nama' => $bahan->nama,
            ]);

            return $bahan->fresh()->loadCount('products');
        });
    }

    /**
     * Delete bahan product dengan proteksi relasi.
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(BahanProduct $bahan): array
    {
        $id = $bahan->id;
        $nama = $bahan->nama;

        if (!$id || !$nama) {
            Log::error('BahanProduct delete: Invalid model state', [
                'exists' => $bahan->exists,
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data bahan product tidak valid.',
            ];
        }

        if (!isset($bahan->products_count)) {
            $bahan->loadCount('products');
        }

        if ($bahan->products_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Bahan product '{$nama}' tidak dapat dihapus karena masih digunakan oleh {$bahan->products_count} produk.",
            ];
        }

        return DB::transaction(function () use ($bahan, $id, $nama) {
            $bahan->delete();

            $this->invalidateCache();

            Log::info('BahanProduct deleted', [
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => true,
                'message' => "Bahan product '{$nama}' berhasil dihapus.",
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

                Log::info('BahanProduct cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $newVersion,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            $newVersion = $current + 1;
            Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

            Log::warning('BahanProduct cache invalidation fallback used', [
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