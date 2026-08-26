<?php

namespace App\Services\PublicProduct;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PublicProductService
{
    private const CACHE_LIST_PREFIX = 'public_products:list:v';
    private const CACHE_DETAIL_PREFIX = 'public_products:detail:v';
    private const CACHE_AVAILABLE_KEY = 'public_products:available:v';
    private const CACHE_BEST_SELLER_KEY = 'public_products:best_seller:v';
    private const CACHE_VERSION_KEY = 'public_products:cache:version';
    private const CACHE_VERSION_LOCK = 'public_products:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_AVAILABLE = 120;
    private const CACHE_TTL_BEST_SELLER = 600;

    public function getList(
        ?string $search = null,
        ?int $jenisId = null,
        ?int $typeId = null,
        int $perPage = 12,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $jenisId, $typeId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $typeId, $perPage, $page): LengthAwarePaginator {
            $query = Product::select([
                    'products.id',
                    'products.kode',
                    'products.ukuran',
                    'products.keterangan',
                    'products.jenis_id',
                    'products.type_id',
                    'products.bahan_id',
                    'products.foto_depan',
                    'products.created_at',
                    'products.updated_at',
                ])
                ->with([
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    'hargaProducts' => fn($q) => $q
                        ->whereNull('customer_id')
                        ->orderByDesc('tanggal_berlaku')
                        ->select('id', 'product_id', 'harga', 'tanggal_berlaku')
                        ->limit(1),
                    'inventories' => fn($q) => $q
                        ->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
                ->whereNull('products.customer_id')
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('products.kode', 'like', "%{$search}%")
                            ->orWhere('products.ukuran', 'like', "%{$search}%")
                            ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"));
                    });
                })
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
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    'hargaProducts' => fn($q) => $q
                        ->whereNull('customer_id')
                        ->orderByDesc('tanggal_berlaku'),
                    'inventories.place',
                ])
                ->whereNull('customer_id')
                ->find($id);

            if (!$product) return null;

            return $this->transformProduct($product, includeAllHarga: true);
        });
    }

    public function getAvailableProducts(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_AVAILABLE_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_AVAILABLE, function (): array {
            $products = Product::whereHas('inventories', function ($q) {
                    $q->where('qty', '>', 0)
                      ->whereHas('place', fn($p) => $p->where('kode', 'TOKO'));
                })
                ->select([
                    'products.id',
                    'products.kode',
                    'products.ukuran',
                    'products.jenis_id',
                    'products.type_id',
                    'products.bahan_id',
                    'products.foto_depan',
                ])
                ->with([
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    'hargaProducts' => fn($q) => $q
                        ->whereNull('customer_id')
                        ->orderByDesc('tanggal_berlaku')
                        ->limit(1),
                    'inventories' => fn($q) => $q
                        ->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
                ->whereNull('products.customer_id')
                ->orderByRaw('LOWER(products.kode) ASC')
                ->get();

            return $products->map(fn(Product $p) => $this->transformProduct($p))->toArray();
        });
    }

    public function getBestSellerProducts(
        int $limit = 10,
        ?string $dari = null,
        ?string $sampai = null,
        ?string $jenis = null
    ): array {
        $limit = max(1, min(100, $limit));
        $dari = $this->normalizeDate($dari, isStart: true);
        $sampai = $this->normalizeDate($sampai, isStart: false);
        $jenis = $jenis && in_array($jenis, ['daily', 'pesanan'], true) ? $jenis : null;

        $version = $this->getCacheVersion();
        $paramsHash = md5("{$limit}:{$dari}:{$sampai}:{$jenis}");
        $cacheKey = self::CACHE_BEST_SELLER_KEY . $version . ':' . $paramsHash;

        return Cache::remember($cacheKey, self::CACHE_TTL_BEST_SELLER, function () use ($limit, $dari, $sampai, $jenis): array {
            try {
                $statusSelesaiId = DB::table('status_transaksis')->where('nama', 'Selesai')->value('id');
                if (!$statusSelesaiId) {
                    Log::warning('Status Selesai tidak ditemukan di DB');
                    return [];
                }

                $statusDibatalkanId = DB::table('status_transaksis')->where('nama', 'Dibatalkan')->value('id');

                $query = DB::table('transaksi_details as td')
                    ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                    ->join('products as p', 'p.id', '=', 'td.product_id')
                    ->where('td.status_transaksi_id', $statusSelesaiId)
                    ->whereNull('p.customer_id');

                if ($statusDibatalkanId) {
                    $query->where('td.status_transaksi_id', '!=', $statusDibatalkanId);
                }
                if ($dari) $query->whereDate('t.tanggal', '>=', $dari);
                if ($sampai) $query->whereDate('t.tanggal', '<=', $sampai);
                if ($jenis) $query->where('t.jenis_transaksi', $jenis);
                $query->where('td.qty', '>', 0);

                $aggregated = $query->select(
                    'td.product_id',
                    DB::raw('SUM(td.qty) as total_qty'),
                    DB::raw('SUM(td.subtotal) as total_omzet'),
                    DB::raw('COUNT(DISTINCT td.transaksi_id) as total_transaksi'),
                    DB::raw('MAX(t.tanggal) as transaksi_terakhir')
                )
                    ->groupBy('td.product_id')
                    ->orderByDesc('total_qty')
                    ->orderByDesc('transaksi_terakhir')
                    ->limit($limit)
                    ->get();

                if ($aggregated->isEmpty()) return [];

                $productIds = $aggregated->pluck('product_id')->toArray();

                $productsMap = Product::with([
                        'jenis' => fn($q) => $q->select('id', 'nama'),
                        'type' => fn($q) => $q->select('id', 'nama'),
                        'bahan' => fn($q) => $q->select('id', 'nama'),
                    ])
                    ->whereIn('id', $productIds)
                    ->whereNull('customer_id')
                    ->get()
                    ->keyBy('id');

                $result = [];
                $rank = 1;

                foreach ($aggregated as $item) {
                    $foundProduct = $productsMap->get($item->product_id);
                    if (!$foundProduct instanceof Product) continue;

                    $productArr = $foundProduct->toArray();
                    $productArr['total_qty'] = (int) $item->total_qty;
                    $productArr['total_omzet'] = (float) ($item->total_omzet ?? 0);
                    $productArr['total_transaksi'] = (int) ($item->total_transaksi ?? 0);
                    $productArr['transaksi_terakhir'] = $item->transaksi_terakhir;
                    $productArr['rank'] = $rank++;
                    $productArr['foto_depan_url'] = $foundProduct->foto_depan
                        ? asset('storage/' . $foundProduct->foto_depan)
                        : null;

                    $result[] = $productArr;
                }

                return $result;
            } catch (\Throwable $e) {
                Log::error('Best seller query failed', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
                return [];
            }
        });
    }

    private function normalizeDate(?string $date, bool $isStart = true): ?string
    {
        if (empty($date)) return null;

        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Throwable $e) {
            Log::warning('Invalid date format', ['date' => $date, 'isStart' => $isStart]);
            return null;
        }
    }

    private function transformProduct(Product $product, bool $includeAllHarga = false): array
    {
        $arr = $product->toArray();

        if ($includeAllHarga) {
            $arr['harga_umum'] = $product->hargaProducts->first()?->harga ?? null;
            $arr['harga_riwayat'] = $product->hargaProducts->map(fn($h) => [
                'id' => $h->id,
                'harga' => $h->harga,
                'tanggal_berlaku' => $h->tanggal_berlaku,
                'keterangan' => $h->keterangan,
            ])->toArray();
        } else {
            $arr['harga_umum'] = $product->hargaProducts->first()?->harga ?? null;
        }

        $arr['qty_toko'] = 0;
        $arr['qty_bengkel'] = 0;

        foreach ($product->inventories as $inv) {
            $placeKode = $inv->place_kode ?? $inv->place?->kode;
            if ($placeKode === 'TOKO') $arr['qty_toko'] = (int) $inv->qty;
            if ($placeKode === 'BENGKEL') $arr['qty_bengkel'] = (int) $inv->qty;
        }

        $arr['foto_depan_url'] = $product->foto_depan ? asset('storage/' . $product->foto_depan) : null;
        if (isset($product->foto_samping)) {
            $arr['foto_samping_url'] = $product->foto_samping ? asset('storage/' . $product->foto_samping) : null;
        }
        if (isset($product->foto_atas)) {
            $arr['foto_atas_url'] = $product->foto_atas ? asset('storage/' . $product->foto_atas) : null;
        }

        unset($arr['harga_products'], $arr['inventories']);

        return $arr;
    }

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
        ?int $jenisId,
        ?int $typeId,
        int $perPage,
        int $page
    ): string {
        return sprintf(
            '%s%d:%s:%s:%s:%d:%d',
            self::CACHE_LIST_PREFIX,
            $version,
            $search ? md5($search) : 'all',
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
                Log::info('PublicProduct cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);
            Log::warning('PublicProduct cache invalidation fallback', ['error' => $e->getMessage()]);
        }
    }
}