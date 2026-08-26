<?php

namespace App\Services\PublicProduct;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PublicProductCustomerService
{
    private const CACHE_LIST_PREFIX = 'public_product_customers:list:v';
    private const CACHE_DETAIL_PREFIX = 'public_product_customers:detail:v';
    private const CACHE_VERSION_KEY = 'public_product_customers:cache:version';
    private const CACHE_VERSION_LOCK = 'public_product_customers:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getList(
        ?string $search = null,
        ?int $customerId = null,
        ?int $jenisId = null,
        ?int $typeId = null,
        int $perPage = 15,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $customerId, $jenisId, $typeId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $customerId, $jenisId, $typeId, $perPage, $page): LengthAwarePaginator {
            $query = Product::select([
                    'products.id',
                    'products.kode',
                    'products.ukuran',
                    'products.keterangan',
                    'products.customer_id',
                    'products.jenis_id',
                    'products.type_id',
                    'products.bahan_id',
                    'products.foto_depan',
                    'products.foto_samping',
                    'products.foto_atas',
                    'products.created_at',
                    'products.updated_at',
                ])
                ->with([
                    'customer' => fn($q) => $q->select('id', 'name', 'phone'),
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    // ✅ FIX: TANPA whereColumn & limit — urutkan saja, filter di PHP
                    'hargaProducts' => fn($q) => $q
                        ->orderByDesc('tanggal_berlaku')
                        ->select('id', 'product_id', 'customer_id', 'harga', 'tanggal_berlaku', 'keterangan'),
                    'inventories' => fn($q) => $q
                        ->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
                ->whereNotNull('products.customer_id')
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('products.kode', 'like', "%{$search}%")
                            ->orWhere('products.ukuran', 'like', "%{$search}%")
                            ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"))
                            ->orWhereHas('type', fn($t) => $t->where('nama', 'like', "%{$search}%"))
                            ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
                    });
                })
                ->when($customerId, fn($q) => $q->where('products.customer_id', $customerId))
                ->when($jenisId, fn($q) => $q->where('products.jenis_id', $jenisId))
                ->when($typeId, fn($q) => $q->where('products.type_id', $typeId))
                ->orderBy('products.kode', 'asc');

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        $items = collect($paginator->items())->map(function (Product $product): array {
            return $this->transformProduct($product);
        });

        return [
            'data' => $items,
            'meta' => $this->buildMeta($paginator),
        ];
    }

    public function getDetail(int $id): ?array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id): ?array {
            $product = Product::with([
                    'customer' => fn($q) => $q->select('id', 'name', 'phone'),
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    // ✅ FIX: TANPA whereColumn — filter di PHP
                    'hargaProducts' => fn($q) => $q
                        ->orderByDesc('tanggal_berlaku')
                        ->select('id', 'product_id', 'customer_id', 'harga', 'tanggal_berlaku', 'keterangan'),
                    'inventories.place',
                ])
                ->whereNotNull('customer_id')
                ->find($id);

            if (!$product) return null;

            return $this->transformProduct($product, includeAllHarga: true);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSFORM
    |--------------------------------------------------------------------------
    */

    private function transformProduct(Product $product, bool $includeAllHarga = false): array
    {
        $arr = $product->toArray();

        // ✅ FILTER HARGA DI PHP (aman, tanpa whereColumn di SQL)
        // hargaProducts sudah terurut tanggal_berlaku DESC, jadi first() = terbaru
        $hargaCustomer = $product->hargaProducts
            ->filter(fn($h) => (int) $h->customer_id === (int) $product->customer_id)
            ->values();

        $hargaUmum = $product->hargaProducts
            ->filter(fn($h) => $h->customer_id === null)
            ->values();

        // Harga khusus customer, fallback ke harga umum
        $arr['harga'] = $hargaCustomer->first()?->harga ?? $hargaUmum->first()?->harga ?? null;
        $arr['harga_umum'] = $hargaUmum->first()?->harga ?? null;

        if ($includeAllHarga) {
            $arr['harga_riwayat'] = $hargaCustomer->map(fn($h) => [
                'id' => $h->id,
                'harga' => $h->harga,
                'tanggal_berlaku' => $h->tanggal_berlaku,
                'keterangan' => $h->keterangan,
            ])->toArray();
        }

        $arr['qty_toko'] = 0;
        $arr['qty_bengkel'] = 0;

        foreach ($product->inventories as $inv) {
            $placeKode = $inv->place_kode ?? $inv->place?->kode;
            if ($placeKode === 'TOKO') $arr['qty_toko'] = (int) $inv->qty;
            if ($placeKode === 'BENGKEL') $arr['qty_bengkel'] = (int) $inv->qty;
        }

        $arr['foto_depan_url'] = $product->foto_depan ? asset('storage/' . $product->foto_depan) : null;
        $arr['foto_samping_url'] = $product->foto_samping ? asset('storage/' . $product->foto_samping) : null;
        $arr['foto_atas_url'] = $product->foto_atas ? asset('storage/' . $product->foto_atas) : null;

        unset($arr['harga_products'], $arr['inventories']);

        return $arr;
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function buildMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'from' => $paginator->firstItem(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ];
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        ?int $customerId,
        ?int $jenisId,
        ?int $typeId,
        int $perPage,
        int $page
    ): string {
        return sprintf(
            '%s%d:%s:%s:%s:%s:%d:%d',
            self::CACHE_LIST_PREFIX,
            $version,
            $search ? md5($search) : 'all',
            $customerId ?? 'all',
            $jenisId ?? 'all',
            $typeId ?? 'all',
            $perPage,
            $page
        );
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
                Log::info('PublicProductCustomer cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);
            Log::warning('PublicProductCustomer cache invalidation fallback', ['error' => $e->getMessage()]);
        }
    }
}