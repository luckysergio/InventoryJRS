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
    private const CACHE_VERSION_KEY = 'stok_opname:cache:version';
    private const CACHE_VERSION_LOCK = 'stok_opname:cache:version:lock';
    private const CACHE_TTL = 300; // 5 menit

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
        return StokOpname::with([
            'user:id,name,role',
            'details.inventory.product.jenis:id,nama',
            'details.inventory.product.type:id,nama',
            'details.inventory.product.bahan:id,nama',
            'details.inventory.place:id,nama,kode',
        ])->find($id);
    }

    public function create(array $data): StokOpname
    {
        return DB::transaction(function () use ($data) {
            $stokOpname = StokOpname::create([
                'user_id'    => Auth::id(),
                'tgl_opname' => $data['tgl_opname'],
                'keterangan' => $data['keterangan'] ?? null,
                'status'     => 'draft',
            ]);

            $inventories = Inventory::whereIn('id', $data['inventory_ids'])
                ->lockForUpdate()
                ->get();

            $details = [];
            foreach ($inventories as $inv) {
                $details[] = [
                    'stok_opname_id' => $stokOpname->id,
                    'inventory_id'   => $inv->id,
                    'stok_sistem'    => $inv->qty,
                    'stok_real'      => null,
                    'selisih'        => null,
                    'keterangan'     => null,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            if (!empty($details)) {
                DetailStokOpname::insert($details);
            }

            Log::info('StokOpname created', [
                'id' => $stokOpname->id,
                'user_id' => Auth::id(),
                'items_count' => count($details),
            ]);

            return $stokOpname->load('details');
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
                'inventory_id' => $data['inventory_id'],
                'stok_real' => $data['stok_real'],
                'selisih' => $selisih,
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

                ProductMovement::create([
                    'inventory_id' => $inventory->id,
                    'tipe'         => $tipe,
                    'qty'          => $qty,
                    'keterangan'   => "Penyesuaian stok opname #{$stokOpname->id}",
                ]);

                if ($tipe === 'in') {
                    $inventory->increment('qty', $qty);
                } else {
                    $inventory->decrement('qty', $qty);
                }
            }

            $stokOpname->update(['status' => 'selesai']);

            Log::info('StokOpname completed', [
                'id' => $stokOpname->id,
                'total_items' => $stokOpname->details->count(),
                'adjusted_items' => $stokOpname->details->where('selisih', '!=', 0)->count(),
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
                'id' => $stokOpname->id,
                'user_id' => Auth::id(),
            ]);
        });
    }

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