<?php

namespace App\Services\StokOpname;

use App\Models\DetailStokOpname;
use App\Models\Inventory;
use App\Models\ProductMovement;
use App\Models\StokOpname;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StokOpnameService
{
    private const CACHE_LIST_PREFIX = 'stok_opname:list:v';
    private const CACHE_DETAIL_PREFIX = 'stok_opname:detail:v';
    private const CACHE_AVAILABLE_KEY = 'stok_opname:available:v';
    private const CACHE_VERSION_KEY = 'stok_opname:cache:version';
    private const CACHE_VERSION_LOCK = 'stok_opname:cache:version:lock';
    
    private const CACHE_TTL = 300;
    private const CACHE_TTL_AVAILABLE = 120;
    
    private const MAX_ITEMS_PER_SO = 2000;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getList(
        ?string $status = null,
        ?string $dari = null,
        ?string $sampai = null,
        bool $excludeDraft = false,
        int $perPage = 20,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();

        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([
            's'  => $status,
            'd'  => $dari,
            'u'  => $sampai,
            'x'  => $excludeDraft,
            'pp' => $perPage,
            'p'  => $page,
        ]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($status, $dari, $sampai, $excludeDraft, $perPage, $page) {
            $query = StokOpname::with([
                'user:id,name,role',
                'details.inventory.product.jenis:id,nama',
                'details.inventory.product.type:id,nama',
                'details.inventory.product.bahan:id,nama',
                'details.inventory.place:id,nama,kode',
            ])
                ->when($status, fn($q) => $q->where('status', $status))
                ->when($excludeDraft && !$status, fn($q) => $q->where('status', '!=', 'draft'))
                ->when($dari, fn($q) => $q->whereDate('tgl_opname', '>=', $dari))
                ->when($sampai, fn($q) => $q->whereDate('tgl_opname', '<=', $sampai))
                ->latest('created_at');

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

    public function getDetail(int $id): ?StokOpname
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . "{$version}:{$id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            return StokOpname::with([
                'user:id,name,role',
                'details.inventory.product.jenis:id,nama',
                'details.inventory.product.type:id,nama',
                'details.inventory.product.bahan:id,nama',
                'details.inventory.place:id,nama,kode',
            ])->find($id);
        });
    }

    public function getAvailableInventories(?array $placeKodes = null, ?string $search = null): array
    {
        $placeKodes = $placeKodes ?: ['TOKO', 'BENGKEL'];
        
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_AVAILABLE_KEY . "{$version}:" . md5(json_encode([
            'places' => $placeKodes,
            'search' => $search,
        ]));

        $data = Cache::remember($cacheKey, self::CACHE_TTL_AVAILABLE, function () use ($placeKodes, $search) {
            $query = Inventory::with([
                'product:id,kode,ukuran,jenis_id,type_id,bahan_id',
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                'place:id,nama,kode',
            ])
                ->whereHas('product')
                ->whereHas('place', fn($p) => $p->whereIn('kode', $placeKodes))
                ->when($search, function ($q) use ($search) {
                    $q->whereHas('product', function ($p) use ($search) {
                        $p->where('kode', 'like', "%{$search}%")
                          ->orWhere('ukuran', 'like', "%{$search}%")
                          ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"));
                    });
                })
                ->join('products', 'products.id', '=', 'inventories.product_id')
                ->select('inventories.*')
                ->orderBy('products.kode', 'asc');

            $inventories = $query->get();
            $grouped = $inventories->groupBy(fn($inv) => $inv->place?->kode ?? 'UNKNOWN');

            return [
                'items' => $inventories->map(fn($inv) => [
                    'id'           => $inv->id,
                    'product_id'   => $inv->product_id,
                    'place_id'     => $inv->place_id,
                    'qty_sistem'   => (int) $inv->qty,
                    'kode'         => $inv->product?->kode,
                    'ukuran'       => $inv->product?->ukuran,
                    'jenis'        => $inv->product?->jenis?->nama,
                    'type'         => $inv->product?->type?->nama,
                    'bahan'        => $inv->product?->bahan?->nama,
                    'place_kode'   => $inv->place?->kode,
                    'place_nama'   => $inv->place?->nama,
                ])->toArray(),
                'summary' => [
                    'total_items' => $inventories->count(),
                    'by_place' => $grouped->map(fn($items, $kode) => [
                        'kode'  => $kode,
                        'count' => $items->count(),
                    ])->values()->toArray(),
                ],
            ];
        });

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): StokOpname
    {
        return DB::transaction(function () use ($data) {
            $inventoryIds = array_unique($data['inventory_ids'] ?? []);
            
            if (empty($inventoryIds)) {
                throw new \Exception('Pilih minimal 1 inventory untuk di-opname.');
            }
            
            if (count($inventoryIds) > self::MAX_ITEMS_PER_SO) {
                throw new \Exception("Maksimal " . self::MAX_ITEMS_PER_SO . " inventory per stok opname.");
            }

            $stokOpname = StokOpname::create([
                'user_id'    => Auth::id(),
                'tgl_opname' => $data['tgl_opname'],
                'keterangan' => $data['keterangan'] ?? null,
                'status'     => 'draft',
            ]);

            $inventories = Inventory::whereIn('id', $inventoryIds)
                ->lockForUpdate()
                ->get();

            if ($inventories->count() !== count($inventoryIds)) {
                throw new \Exception('Beberapa inventory tidak ditemukan.');
            }

            $details = $inventories->map(fn($inv) => [
                'stok_opname_id' => $stokOpname->id,
                'inventory_id'   => $inv->id,
                'stok_sistem'    => (int) $inv->qty,
                'stok_real'      => null,
                'selisih'        => null,
                'keterangan'     => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ])->toArray();

            foreach (array_chunk($details, 500) as $chunk) {
                DetailStokOpname::insert($chunk);
            }

            Log::info('StokOpname created', [
                'id'          => $stokOpname->id,
                'user_id'     => Auth::id(),
                'items_count' => count($details),
            ]);

            return $stokOpname->load([
                'details.inventory.product.jenis',
                'details.inventory.product.type',
                'details.inventory.product.bahan',
                'details.inventory.place',
            ]);
        });
    }

    public function createForPlaces(array $data): StokOpname
    {
        return DB::transaction(function () use ($data) {
            $placeKodes = $data['place_kodes'] ?? ['TOKO', 'BENGKEL'];

            $inventories = Inventory::whereHas('place', fn($p) => $p->whereIn('kode', $placeKodes))
                ->whereHas('product')
                ->lockForUpdate()
                ->get();

            if ($inventories->isEmpty()) {
                throw new \Exception('Tidak ada inventory yang tersedia untuk di-opname di place: ' . implode(', ', $placeKodes));
            }

            if ($inventories->count() > self::MAX_ITEMS_PER_SO) {
                throw new \Exception("Terlalu banyak inventory ({$inventories->count()}). Maksimal " . self::MAX_ITEMS_PER_SO . " per SO.");
            }

            $stokOpname = StokOpname::create([
                'user_id'    => Auth::id(),
                'tgl_opname' => $data['tgl_opname'],
                'keterangan' => $data['keterangan'] ?? 'SO otomatis: ' . implode(', ', $placeKodes),
                'status'     => 'draft',
            ]);

            $details = $inventories->map(fn($inv) => [
                'stok_opname_id' => $stokOpname->id,
                'inventory_id'   => $inv->id,
                'stok_sistem'    => (int) $inv->qty,
                'stok_real'      => null,
                'selisih'        => null,
                'keterangan'     => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ])->toArray();

            foreach (array_chunk($details, 500) as $chunk) {
                DetailStokOpname::insert($chunk);
            }

            Log::info('StokOpname created for places', [
                'id'          => $stokOpname->id,
                'user_id'     => Auth::id(),
                'places'      => $placeKodes,
                'items_count' => count($details),
            ]);

            return $stokOpname->load([
                'details.inventory.product.jenis',
                'details.inventory.product.type',
                'details.inventory.product.bahan',
                'details.inventory.place',
            ]);
        });
    }

    public function updateDetail(StokOpname $stokOpname, array $data): DetailStokOpname
    {
        if ($stokOpname->status !== 'draft') {
            throw new \Exception('Stok opname sudah dikunci dan tidak dapat diubah.');
        }

        return DB::transaction(function () use ($stokOpname, $data) {
            $detail = DetailStokOpname::where('stok_opname_id', $stokOpname->id)
                ->where('inventory_id', $data['inventory_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $selisih = null;
            if ($data['stok_real'] !== null) {
                $selisih = (int) $data['stok_real'] - (int) $detail->stok_sistem;
            }

            $detail->update([
                'stok_real'  => $data['stok_real'],
                'selisih'    => $selisih,
                'keterangan' => $data['keterangan'] ?? $detail->keterangan,
            ]);

            Log::info('StokOpname detail updated', [
                'stok_opname_id' => $stokOpname->id,
                'inventory_id'   => $data['inventory_id'],
                'stok_real'      => $data['stok_real'],
                'selisih'        => $selisih,
            ]);

            return $detail->fresh();
        });
    }

    public function selesai(StokOpname $stokOpname): void
    {
        if ($stokOpname->status !== 'draft') {
            throw new \Exception('Stok opname sudah diproses sebelumnya.');
        }

        $stokOpname->load('details');

        $hasUnfilled = $stokOpname->details->contains(fn($d) => $d->stok_real === null);
        if ($hasUnfilled) {
            throw new \Exception('Masih ada item yang belum diisi stok real-nya.');
        }

        DB::transaction(function () use ($stokOpname) {
            foreach ($stokOpname->details as $detail) {
                if ((int) $detail->selisih === 0) continue;

                $tipe = (int) $detail->selisih > 0 ? 'in' : 'out';
                $qty = abs((int) $detail->selisih);

                $inventory = Inventory::lockForUpdate()->findOrFail($detail->inventory_id);

                if ($tipe === 'out' && $inventory->qty < $qty) {
                    throw new \Exception("Stok tidak mencukupi untuk inventory ID {$inventory->id}. Tersedia: {$inventory->qty}, dibutuhkan: {$qty}");
                }

                $stockBefore = $inventory->qty;
                $stockAfter = $tipe === 'in' ? $stockBefore + $qty : $stockBefore - $qty;

                ProductMovement::create([
                    'inventory_id' => $inventory->id,
                    'product_id'   => $inventory->product_id,
                    'tipe'         => $tipe,
                    'qty'          => $qty,
                    'stock_before' => $stockBefore,
                    'stock_after'  => $stockAfter,
                    'keterangan'   => "Penyesuaian stok opname #{$stokOpname->id}",
                    'ref_type'     => 'stok_opname',
                    'ref_id'       => $stokOpname->id,
                ]);

                if ($tipe === 'in') {
                    $inventory->increment('qty', $qty);
                } else {
                    $inventory->decrement('qty', $qty);
                }
            }

            $stokOpname->update(['status' => 'selesai']);

            Log::info('StokOpname completed', [
                'id'              => $stokOpname->id,
                'total_items'     => $stokOpname->details->count(),
                'adjusted_items'  => $stokOpname->details->where('selisih', '!=', 0)->count(),
            ]);
        });
    }

    public function batalkan(StokOpname $stokOpname): void
    {
        if ($stokOpname->status !== 'draft') {
            throw new \Exception('Hanya stok opname draft yang dapat dibatalkan.');
        }

        DB::transaction(function () use ($stokOpname) {
            $stokOpname->update(['status' => 'dibatalkan']);

            Log::info('StokOpname cancelled', [
                'id'      => $stokOpname->id,
                'user_id' => Auth::id(),
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

    /**
     * ✅ Invalidate semua cache StokOpname (list + detail + available).
     * Dipanggil saat ada perubahan pada SO atau inventory.
     */
    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('StokOpname cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('StokOpname cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}