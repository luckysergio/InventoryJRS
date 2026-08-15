<?php

namespace App\Services\TypeProduct;

use App\Models\TypeProduct;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TypeProductService
{
    private const CACHE_LIST_PREFIX = 'type_products:list:v';
    private const CACHE_DETAIL_PREFIX = 'type_products:detail:v';
    private const CACHE_DROPDOWN_KEY = 'type_products:dropdown:v';
    private const CACHE_BY_JENIS_KEY = 'type_products:by_jenis:v';
    private const CACHE_STATISTICS_KEY = 'type_products:statistics:v';

    private const CACHE_VERSION_KEY = 'type_products:cache:version';
    private const CACHE_VERSION_LOCK = 'type_products:cache:version:lock';

    private const CACHE_TTL_LIST = 1800;       // 30 menit
    private const CACHE_TTL_DETAIL = 3600;     // 1 jam
    private const CACHE_TTL_DROPDOWN = 7200;   // 2 jam
    private const CACHE_TTL_BY_JENIS = 3600;   // 1 jam
    private const CACHE_TTL_STATISTICS = 1800; // 30 menit

    /**
     * Get list type products dengan search, filter by jenis, & pagination.
     *
     * @return array{data: Collection|array, meta: array}
     */
    public function getList(
        ?string $search = null,
        ?int $jenisId = null,
        int $perPage = 20,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $jenisId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $perPage, $page) {
            $query = TypeProduct::select([
                'type_products.id',
                'type_products.nama',
                'type_products.jenis_id',
                'type_products.created_at',
                'type_products.updated_at',
            ])
                ->with(['jenis' => fn($q) => $q->select('id', 'nama')])
                ->withCount('products')
                ->when($search, function ($q) use ($search) {
                    $q->where('type_products.nama', 'like', "%{$search}%");
                })
                ->when($jenisId, function ($q) use ($jenisId) {
                    $q->where('type_products.jenis_id', $jenisId);
                })
                ->orderBy('type_products.nama', 'asc');

            return $query->paginate($perPage, ['*'], 'page', $page);
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
            ],
        ];
    }

    public function getDetail(int $id): ?TypeProduct
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            return TypeProduct::with(['jenis' => fn($q) => $q->select('id', 'nama')])
                ->withCount('products')
                ->find($id);
        });
    }

    public function getForDropdown(?int $jenisId = null): Collection
    {
        $version = $this->getCacheVersion();
        $jenisKey = $jenisId ?? 'all';
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version . ':' . $jenisKey;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () use ($jenisId) {
            $query = TypeProduct::select(['id', 'nama', 'jenis_id'])
                ->orderBy('nama', 'asc');

            if ($jenisId) {
                $query->where('jenis_id', $jenisId);
            }

            return $query->get();
        });
    }

    public function getByJenis(int $jenisId): Collection
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_BY_JENIS_KEY . $version . ':' . $jenisId;

        return Cache::remember($cacheKey, self::CACHE_TTL_BY_JENIS, function () use ($jenisId) {
            return TypeProduct::select(['id', 'nama', 'jenis_id'])
                ->where('jenis_id', $jenisId)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getStatistics(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_STATISTICS_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_STATISTICS, function () {
            $stats = TypeProduct::select(['id', 'nama', 'jenis_id'])
                ->with(['jenis' => fn($q) => $q->select('id', 'nama')])
                ->withCount('products')
                ->orderByDesc('products_count')
                ->limit(10)
                ->get();

            return [
                'total_types' => TypeProduct::count(),
                'total_products' => TypeProduct::sum('products_count'),
                'top_types' => $stats->map(fn($t) => [
                    'id' => $t->id,
                    'nama' => $t->nama,
                    'jenis_nama' => $t->jenis?->nama ?? '-',
                    'products_count' => $t->products_count,
                ])->toArray(),
            ];
        });
    }

    public function create(array $data): TypeProduct
    {
        return DB::transaction(function () use ($data) {
            $type = TypeProduct::create([
                'nama' => $data['nama'],
                'jenis_id' => $data['jenis_id'],
            ]);

            $this->invalidateCache();

            Log::info('TypeProduct created', [
                'id' => $type->id,
                'nama' => $type->nama,
                'jenis_id' => $type->jenis_id,
            ]);

            return $type->load(['jenis' => fn($q) => $q->select('id', 'nama')])
                ->loadCount('products');
        });
    }

    public function update(TypeProduct $type, array $data): TypeProduct
    {
        return DB::transaction(function () use ($type, $data) {
            if (!$type->exists) {
                throw new \Exception("Gagal update: Data type product tidak valid.");
            }

            $type->update([
                'nama' => $data['nama'],
                'jenis_id' => $data['jenis_id'],
            ]);

            $this->invalidateCache();

            Log::info('TypeProduct updated', [
                'id' => $type->id,
                'changes' => ['nama', 'jenis_id'],
            ]);

            return $type->fresh()
                ->load(['jenis' => fn($q) => $q->select('id', 'nama')])
                ->loadCount('products');
        });
    }

    /**
     * Delete type product dengan proteksi relasi.
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(TypeProduct $type): array
    {
        $id = $type->id;
        $nama = $type->nama;

        if (!$id || !$nama) {
            Log::error('TypeProduct delete: Invalid model state', [
                'exists' => $type->exists,
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data type product tidak valid.',
            ];
        }

        if (!isset($type->products_count)) {
            $type->loadCount('products');
        }

        if ($type->products_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Type product '{$nama}' tidak dapat dihapus karena masih digunakan oleh {$type->products_count} produk.",
            ];
        }

        return DB::transaction(function () use ($type, $id, $nama) {
            $type->delete();

            $this->invalidateCache();

            Log::info('TypeProduct deleted', [
                'id' => $id,
                'nama' => $nama,
            ]);

            return [
                'success' => true,
                'message' => "Type product '{$nama}' berhasil dihapus.",
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

                Log::info('TypeProduct cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $newVersion,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            $newVersion = $current + 1;
            Cache::forever(self::CACHE_VERSION_KEY, $newVersion);

            Log::warning('TypeProduct cache invalidation fallback used', [
                'error' => $e->getMessage(),
                'old_version' => $current,
                'new_version' => $newVersion,
            ]);
        }
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        ?int $jenisId,
        int $perPage,
        int $page
    ): string {
        $searchKey = $search ? md5($search) : 'all';
        $jenisKey = $jenisId ?? 'all';

        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$jenisKey}:{$perPage}:{$page}";
    }
}