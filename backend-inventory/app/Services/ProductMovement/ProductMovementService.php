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

    public function getList(int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:{$perPage}:{$page}";

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($perPage, $page) {
            return ProductMovement::with([
                'inventory.product.jenis:id,nama',
                'inventory.product.type:id,nama',
                'inventory.product.bahan:id,nama',
                'inventory.place:id,nama,kode',
            ])
                ->orderByDesc('created_at')
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

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
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

            // Validasi stok untuk out dan transfer
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

                    // Kurangi stok asal
                    $inventoryFrom->decrement('qty', $qty);

                    // Buat atau update inventory tujuan
                    $inventoryTo = Inventory::firstOrCreate(
                        ['product_id' => $inventoryFrom->product_id, 'place_id' => $toPlaceId],
                        ['qty' => 0]
                    );

                    $inventoryTo->increment('qty', $qty);

                    $toPlaceName = $inventoryTo->place?->nama ?? 'Unknown';
                    $fromPlaceName = $inventoryFrom->place?->nama ?? 'Unknown';

                    // Record movement keluar dari asal
                    ProductMovement::create([
                        'inventory_id' => $inventoryFrom->id,
                        'tipe' => 'transfer',
                        'qty' => $qty,
                        'keterangan' => $keterangan ?? ('Transfer ke ' . $toPlaceName),
                    ]);

                    // Record movement masuk ke tujuan
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