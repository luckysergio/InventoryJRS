<?php

namespace App\Services\Distributor;

use App\Models\Distributor;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DistributorService
{
    /*
    |--------------------------------------------------------------------------
    | Cache Configuration (Versioning Strategy)
    |--------------------------------------------------------------------------
    */
    private const CACHE_LIST_PREFIX = 'distributors:list:v';
    private const CACHE_DETAIL_PREFIX = 'distributors:detail:v';
    private const CACHE_DROPDOWN_KEY = 'distributors:dropdown:v';

    private const CACHE_VERSION_KEY = 'distributors:cache:version';
    private const CACHE_VERSION_LOCK = 'distributors:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_DROPDOWN = 7200;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * @return array{data: array, meta: array}
     */
    public function getList(?string $search = null, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $page) {
            return Distributor::select(['id', 'nama', 'no_hp', 'email', 'created_at', 'updated_at'])
                ->withCount('products')
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('nama', 'like', "%{$search}%")
                            ->orWhere('no_hp', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                })
                ->orderBy('nama', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);
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

    /**
     * @return array<string, mixed>|null
     */
    public function getDetail(int $id): ?array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            $distributor = Distributor::withCount('products')->find($id);
            return $distributor?->toArray();
        });
    }

    /**
     * Lightweight dropdown data.
     *
     * @return array<int, array{value: int, label: string}>
     */
    public function getForDropdown(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return Distributor::select(['id', 'nama'])
                ->orderBy('nama', 'asc')
                ->get()
                ->map(fn($d) => [
                    'value' => $d->id,
                    'label' => $d->nama,
                ])
                ->toArray();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    | ❌ TIDAK ada invalidateCache() di sini - dilakukan di controller
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Distributor
    {
        return DB::transaction(function () use ($data) {
            $distributor = Distributor::create([
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'],
                'email' => $data['email'] ?? null,
            ]);

            Log::info('Distributor created', [
                'id' => $distributor->id,
                'nama' => $distributor->nama,
            ]);

            return $distributor;
        });
    }

    public function update(Distributor $distributor, array $data): Distributor
    {
        return DB::transaction(function () use ($distributor, $data) {
            if (!$distributor->exists) {
                throw new \Exception("Gagal update: Data distributor tidak valid.");
            }

            $distributor->update([
                'nama' => $data['nama'],
                'no_hp' => $data['no_hp'],
                'email' => $data['email'] ?? null,
            ]);

            Log::info('Distributor updated', [
                'id' => $distributor->id,
                'nama' => $distributor->nama,
            ]);

            return $distributor->fresh();
        });
    }

    /**
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(Distributor $distributor): array
    {
        $id = $distributor->id;
        $nama = $distributor->nama;

        if (!$id || !$distributor->exists) {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data distributor tidak valid.',
            ];
        }

        // Load count jika belum ada
        if (!isset($distributor->products_count)) {
            $distributor->loadCount('products');
        }

        if ($distributor->products_count > 0) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Distributor '{$nama}' tidak dapat dihapus karena masih memiliki {$distributor->products_count} produk.",
            ];
        }

        DB::transaction(function () use ($distributor) {
            $distributor->delete();
        });

        Log::info('Distributor deleted', ['id' => $id, 'nama' => $nama]);

        return [
            'success' => true,
            'message' => "Distributor '{$nama}' berhasil dihapus.",
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT (Public - dipanggil dari Controller)
    |--------------------------------------------------------------------------
    */

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    /**
     * ✅ Public method - dipanggil dari controller SETELAH transaction commit
     */
    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('Distributor cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Distributor cache invalidation fallback used', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildListCacheKey(int $version, ?string $search, int $perPage, int $page): string
    {
        $searchKey = $search ? md5($search) : 'all';
        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$perPage}:{$page}";
    }
}