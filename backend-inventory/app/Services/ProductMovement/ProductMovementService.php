<?php

namespace App\Services\ProductMovement;

use App\Models\Inventory;
use App\Models\ProductMovement;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductMovementService
{
    private const CACHE_LIST_PREFIX = 'product_movements:list:v';
    private const CACHE_VERSION_KEY = 'product_movements:cache:version';
    private const CACHE_VERSION_LOCK = 'product_movements:cache:version:lock';
    private const CACHE_TTL_LIST = 300;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * ✅ FIXED: Tambah parameter filter (search, tipe, dari, sampai)
     * Setiap kombinasi filter menghasilkan cache key yang unik via MD5
     */
    public function getList(
        ?string $search = null,
        ?string $tipe = null,
        ?string $dari = null,
        ?string $sampai = null,
        int $perPage = 20,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();

        // ✅ Cache key unik per kombinasi filter
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([
            's' => $search,
            't' => $tipe,
            'd' => $dari,
            'u' => $sampai,
            'pp' => $perPage,
            'p' => $page,
        ]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $tipe, $dari, $sampai, $perPage, $page) {
            $query = ProductMovement::with([
                'inventory.product.jenis:id,nama',
                'inventory.product.type:id,nama',
                'inventory.product.bahan:id,nama',
                'inventory.place:id,nama,kode',
            ])
                // ✅ Filter by tipe (in, out, transfer, produksi)
                ->when($tipe, fn($q) => $q->where('tipe', $tipe))
                // ✅ Filter by date range (inclusive full day)
                ->when($dari, fn($q) => $q->whereDate('created_at', '>=', $dari))
                ->when($sampai, fn($q) => $q->whereDate('created_at', '<=', $sampai))
                // ✅ Filter by search (kode, ukuran, nama jenis/type, keterangan)
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('keterangan', 'like', "%{$search}%")
                            ->orWhereHas('inventory.product', function ($p) use ($search) {
                                $p->where('kode', 'like', "%{$search}%")
                                    ->orWhere('ukuran', 'like', "%{$search}%")
                                    ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"))
                                    ->orWhereHas('type', fn($t) => $t->where('nama', 'like', "%{$search}%"))
                                    ->orWhereHas('bahan', fn($b) => $b->where('nama', 'like', "%{$search}%"));
                            });
                    });
                })
                ->orderByDesc('created_at');

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

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS (tetap sama)
    |--------------------------------------------------------------------------
    */

    public function create(array $data): void
    {
        DB::transaction(function () use ($data) {
            $inventoryFrom = Inventory::lockForUpdate()->find($data['inventory_id']);

            if (!$inventoryFrom) {
                throw new \Exception('Inventory tidak ditemukan.');
            }

            $tipe = $data['tipe'];
            $qty = (int) $data['qty'];
            $keterangan = $data['keterangan'] ?? null;

            if (in_array($tipe, ['out', 'transfer']) && $inventoryFrom->qty < $qty) {
                throw new \Exception('Stok tidak mencukupi. Stok tersedia: ' . $inventoryFrom->qty);
            }

            switch ($tipe) {
                case 'in':
                case 'produksi':
                    $inventoryFrom->increment('qty', $qty);

                    ProductMovement::create([
                        'inventory_id' => $inventoryFrom->id,
                        'tipe' => $tipe,
                        'qty' => $qty,
                        'keterangan' => $keterangan,
                    ]);
                    break;

                case 'out':
                    $inventoryFrom->decrement('qty', $qty);

                    ProductMovement::create([
                        'inventory_id' => $inventoryFrom->id,
                        'tipe' => 'out',
                        'qty' => $qty,
                        'keterangan' => $keterangan,
                    ]);
                    break;

                case 'transfer':
                    $toPlaceId = (int) $data['to_place_id'];

                    $inventoryFrom->decrement('qty', $qty);

                    $inventoryTo = Inventory::firstOrCreate(
                        ['product_id' => $inventoryFrom->product_id, 'place_id' => $toPlaceId],
                        ['qty' => 0]
                    );

                    $inventoryTo->increment('qty', $qty);

                    $toPlaceName = $inventoryTo->place?->nama ?? 'Unknown';
                    $fromPlaceName = $inventoryFrom->place?->nama ?? 'Unknown';

                    ProductMovement::create([
                        'inventory_id' => $inventoryFrom->id,
                        'tipe' => 'transfer',
                        'qty' => $qty,
                        'keterangan' => $keterangan ?? ('Transfer ke ' . $toPlaceName),
                    ]);

                    ProductMovement::create([
                        'inventory_id' => $inventoryTo->id,
                        'tipe' => 'in',
                        'qty' => $qty,
                        'keterangan' => 'Transfer dari ' . $fromPlaceName,
                    ]);
                    break;
            }

            Log::info('Product movement created', [
                'tipe' => $tipe,
                'qty' => $qty,
                'inventory_id' => $inventoryFrom->id,
                'product_id' => $inventoryFrom->product_id,
            ]);
        });
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

                Log::info('ProductMovement cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('ProductMovement cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}