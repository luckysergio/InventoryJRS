<?php

namespace App\Services\Place;

use App\Models\Place;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlaceService
{
    private const CACHE_LIST_PREFIX = 'places:list:v';
    private const CACHE_DROPDOWN_KEY = 'places:dropdown:v';
    private const CACHE_VERSION_KEY = 'places:cache:version';
    private const CACHE_VERSION_LOCK = 'places:cache:version:lock';
    private const CACHE_TTL = 7200;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * ✅ FIX: Support search + pagination + return array dengan meta
     */
    public function getList(?string $search = null, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([$search, $perPage, $page]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($search, $perPage, $page) {
            $query = Place::query()
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('nama', 'like', "%{$search}%")
                            ->orWhere('kode', 'like', "%{$search}%");
                    });
                })
                ->orderBy('nama', 'asc');

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

    public function getDetail(int $id): ?array
    {
        $place = Place::find($id);
        return $place ? $place->toArray() : null;
    }

    public function getForDropdown(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return Place::select(['id', 'nama', 'kode'])
                ->orderBy('nama')
                ->get()
                ->map(fn($p) => [
                    'value' => $p->id,
                    'label' => "{$p->nama} ({$p->kode})",
                ])
                ->toArray();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Place
    {
        return DB::transaction(function () use ($data) {
            $place = Place::create([
                'nama'       => $data['nama'],
                'kode'       => $data['kode'],
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            Log::info('Place created', ['id' => $place->id, 'kode' => $place->kode]);

            return $place;
        });
    }

    public function update(Place $place, array $data): Place
    {
        return DB::transaction(function () use ($place, $data) {
            $place->update([
                'nama'       => $data['nama'],
                'kode'       => $data['kode'],
                'keterangan' => $data['keterangan'] ?? null,
            ]);

            Log::info('Place updated', ['id' => $place->id, 'kode' => $place->kode]);

            return $place->fresh();
        });
    }

    public function delete(Place $place): array
    {
        $id = $place->id;
        $nama = $place->nama;

        if (!$id || !$place->exists) {
            return ['success' => false, 'code' => 400, 'message' => 'Data tempat tidak valid.'];
        }

        $hasInventory = DB::table('inventories')
            ->where('place_id', $id)
            ->exists();

        if ($hasInventory) {
            return [
                'success' => false,
                'code'    => 422,
                'message' => "Tempat '{$nama}' tidak dapat dihapus karena masih memiliki data inventory.",
            ];
        }

        DB::transaction(function () use ($place) {
            $place->delete();
        });

        Log::info('Place deleted', ['id' => $id, 'nama' => $nama]);

        return ['success' => true, 'message' => "Tempat '{$nama}' berhasil dihapus."];
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('Place cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Place cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}