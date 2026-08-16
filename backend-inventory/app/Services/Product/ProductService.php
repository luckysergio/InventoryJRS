<?php

namespace App\Services\Product;

use App\Models\BahanProduct;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\Product;
use App\Models\TypeProduct;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductService
{
    private const CACHE_LIST_PREFIX = 'products:list:v';
    private const CACHE_DETAIL_PREFIX = 'products:detail:v';
    private const CACHE_AVAILABLE_KEY = 'products:available:v';
    private const CACHE_LOW_STOCK_KEY = 'products:low_stock:v';
    private const CACHE_BEST_SELLER_KEY = 'products:best_seller:v';

    private const CACHE_VERSION_KEY = 'products:cache:version';
    private const CACHE_VERSION_LOCK = 'products:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_AVAILABLE = 120;
    private const CACHE_TTL_LOW_STOCK = 300;
    private const CACHE_TTL_BEST_SELLER = 600;

    /**
     * @return array{data: array, meta: array}
     */
    public function getList(
        ?string $search = null,
        ?int $jenisId = null,
        ?int $typeId = null,
        int $perPage = 15,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $jenisId, $typeId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $typeId, $perPage, $page) {
            $query = Product::select([
                'products.id', 'products.kode', 'products.ukuran', 'products.keterangan',
                'products.jenis_id', 'products.type_id', 'products.bahan_id',
                'products.foto_depan', 'products.created_at', 'products.updated_at',
            ])
                ->with([
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                    'hargaProducts' => fn($q) => $q->whereNull('customer_id')
                        ->orderByDesc('tanggal_berlaku')
                        ->select('id', 'product_id', 'harga', 'tanggal_berlaku')
                        ->limit(1),
                    'inventories' => fn($q) => $q->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
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

        $items = collect($paginator->items())->map(function (Product $product) {
            $arr = $product->toArray();
            $arr['harga_umum'] = $product->hargaProducts->first()?->harga ?? null;
            $arr['qty_toko'] = 0;
            $arr['qty_bengkel'] = 0;

            foreach ($product->inventories as $inv) {
                if ($inv->place_kode === 'TOKO') $arr['qty_toko'] = $inv->qty;
                if ($inv->place_kode === 'BENGKEL') $arr['qty_bengkel'] = $inv->qty;
            }

            unset($arr['harga_products'], $arr['inventories']);
            return $arr;
        });

        return [
            'data' => $items,
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
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            /** @var Product|null $product */
            $product = Product::with([
                'jenis' => fn($q) => $q->select('id', 'nama'),
                'type' => fn($q) => $q->select('id', 'nama'),
                'bahan' => fn($q) => $q->select('id', 'nama'),
                'hargaProducts' => fn($q) => $q->whereNull('customer_id')->orderByDesc('tanggal_berlaku'),
                'inventories.place',
            ])->find($id);

            if (!$product) return null;

            $arr = $product->toArray();
            $arr['harga_umum'] = $product->hargaProducts->first()?->harga ?? null;
            $arr['qty_toko'] = 0;
            $arr['qty_bengkel'] = 0;

            foreach ($product->inventories as $inv) {
                if ($inv->place?->kode === 'TOKO') $arr['qty_toko'] = $inv->qty;
                if ($inv->place?->kode === 'BENGKEL') $arr['qty_bengkel'] = $inv->qty;
            }

            unset($arr['inventories']);
            return $arr;
        });
    }

    public function getAvailableProducts(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_AVAILABLE_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_AVAILABLE, function () {
            return Product::whereHas('inventories', function ($q) {
                $q->where('qty', '>', 0)
                  ->whereHas('place', fn($p) => $p->where('kode', 'TOKO'));
            })
                ->with([
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                ])
                ->orderByRaw('LOWER(kode) ASC')
                ->get()
                ->toArray();
        });
    }

    public function getLowStockProducts(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LOW_STOCK_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_LOW_STOCK, function () {
            return Product::whereIn('id', function ($sub) {
                $sub->select('product_id')
                    ->from('inventories')
                    ->join('places', 'places.id', '=', 'inventories.place_id')
                    ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                    ->groupBy('product_id')
                    ->havingRaw('SUM(inventories.qty) < 20');
            })
                ->with([
                    'jenis' => fn($q) => $q->select('id', 'nama'),
                    'type' => fn($q) => $q->select('id', 'nama'),
                    'bahan' => fn($q) => $q->select('id', 'nama'),
                ])
                ->orderByRaw('LOWER(products.kode) ASC')
                ->get()
                ->toArray();
        });
    }

    public function getBestSellerProducts(int $limit = 10, ?string $dari = null, ?string $sampai = null): array
    {
        $version = $this->getCacheVersion();
        $paramsHash = md5("{$limit}:{$dari}:{$sampai}");
        $cacheKey = self::CACHE_BEST_SELLER_KEY . $version . ':' . $paramsHash;

        return Cache::remember($cacheKey, self::CACHE_TTL_BEST_SELLER, function () use ($limit, $dari, $sampai) {
            $query = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->join('status_transaksis as st', 'st.id', '=', 'td.status_transaksi_id')
                ->where('st.nama', 'Selesai');

            if ($dari) $query->whereDate('t.tanggal', '>=', $dari);
            if ($sampai) $query->whereDate('t.tanggal', '<=', $sampai);

            $aggregated = $query->select(
                'td.product_id',
                DB::raw('SUM(td.qty) as total_qty'),
                DB::raw('MAX(t.tanggal) as transaksi_terakhir')
            )
                ->groupBy('td.product_id')
                ->orderByDesc('total_qty')
                ->limit($limit)
                ->get();

            $productIds = $aggregated->pluck('product_id')->toArray();
            if (empty($productIds)) return [];

            /** @var \Illuminate\Support\Collection<int, Product> $productsMap */
            $productsMap = Product::with([
                'jenis' => fn($q) => $q->select('id', 'nama'),
                'type' => fn($q) => $q->select('id', 'nama'),
                'bahan' => fn($q) => $q->select('id', 'nama'),
            ])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            $result = [];
            foreach ($aggregated as $item) {
                $foundProduct = $productsMap->get($item->product_id);

                if ($foundProduct instanceof Product) {
                    $productArr = $foundProduct->toArray();
                    $productArr['total_qty'] = (int) $item->total_qty;
                    $productArr['transaksi_terakhir'] = $item->transaksi_terakhir;
                    $result[] = $productArr;
                }
            }

            usort($result, fn($a, $b) => $b['total_qty'] <=> $a['total_qty']);
            return $result;
        });
    }

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $jenis = !empty($data['jenis_id'])
                ? JenisProduct::findOrFail($data['jenis_id'])
                : JenisProduct::firstOrCreate(['nama' => strtoupper(trim($data['jenis_nama']))]);

            $type = !empty($data['type_id'])
                ? TypeProduct::where('id', $data['type_id'])->where('jenis_id', $jenis->id)->firstOrFail()
                : TypeProduct::firstOrCreate([
                    'nama' => strtoupper(trim($data['type_nama'])),
                    'jenis_id' => $jenis->id,
                ]);

            $bahanId = null;
            if (!empty($data['bahan_id'])) {
                $bahanId = (int) $data['bahan_id'];
            } elseif (!empty($data['bahan_nama'])) {
                $bahan = BahanProduct::firstOrCreate(['nama' => strtoupper(trim($data['bahan_nama']))]);
                $bahanId = $bahan->id;
            }

            $kode = $this->buildProductKode($jenis->id, $type->id, $bahanId, $data['ukuran']);

            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas']);

            $product = Product::create(array_merge([
                'kode' => $kode,
                'jenis_id' => $jenis->id,
                'type_id' => $type->id,
                'bahan_id' => $bahanId,
                'ukuran' => $data['ukuran'],
                'keterangan' => $data['keterangan'] ?? null,
            ], $foto));

            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => null,
                'harga' => (int) $data['harga_umum'],
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga awal',
            ]);

            $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();
            foreach ($places as $place) {
                Inventory::firstOrCreate(
                    ['product_id' => $product->id, 'place_id' => $place->id],
                    ['qty' => 0]
                );
            }

            Log::info('Product created', [
                'id' => $product->id,
                'kode' => $product->kode,
            ]);

            $product->load([
                'jenis:id,nama',
                'type:id,nama',
                'bahan:id,nama',
            ]);

            return $product;
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            if (!$product->exists) {
                throw new \Exception("Gagal update: Data product tidak valid.");
            }

            $newTypeId = null;
            if (!empty($data['type_nama'])) {
                $type = TypeProduct::firstOrCreate([
                    'nama' => strtoupper(trim($data['type_nama'])),
                    'jenis_id' => (int) $data['jenis_id'],
                ]);
                $newTypeId = $type->id;
            } elseif (!empty($data['type_id'])) {
                $newTypeId = (int) $data['type_id'];
            }

            $newBahanId = null;
            if (!empty($data['bahan_nama'])) {
                $bahan = BahanProduct::firstOrCreate([
                    'nama' => strtoupper(trim($data['bahan_nama'])),
                ]);
                $newBahanId = $bahan->id;
            } elseif (!empty($data['bahan_id'])) {
                $newBahanId = (int) $data['bahan_id'];
            }

            $isChanged = $this->isCombinationChanged(
                $product,
                (int) $data['jenis_id'],
                $newTypeId,
                $newBahanId,
                (string) $data['ukuran']
            );

            $kode = $isChanged
                ? $this->buildProductKode((int) $data['jenis_id'], $newTypeId, $newBahanId, (string) $data['ukuran'], $product->id)
                : $product->kode;

            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas'], $product);

            $product->update(array_merge([
                'kode' => $kode,
                'jenis_id' => (int) $data['jenis_id'],
                'type_id' => $newTypeId,
                'bahan_id' => $newBahanId,
                'ukuran' => (string) $data['ukuran'],
                'keterangan' => $data['keterangan'] ?? null,
            ], $foto));

            $product->hargaProducts()->whereNull('customer_id')->delete();
            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => null,
                'harga' => (int) ($data['harga_umum'] ?? 0),
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga diperbarui',
            ]);

            Log::info('Product updated', [
                'id' => $product->id,
                'kode_changed' => $isChanged,
            ]);

            return $product->fresh()->load([
                'jenis:id,nama',
                'type:id,nama',
                'bahan:id,nama',
            ]);
        });
    }

    /**
     * Delete product with relation protection.
     * ❌ TIDAK memanggil invalidateCache() - dilakukan di controller
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(Product $product): array
    {
        $id = $product->id;
        $kode = $product->kode;

        if (!$id || !$product->exists) {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data product tidak valid.',
            ];
        }

        if ($product->details()->exists()) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Product '{$kode}' tidak dapat dihapus karena masih memiliki riwayat transaksi.",
            ];
        }

        if ($product->productions()->exists()) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Product '{$kode}' tidak dapat dihapus karena masih memiliki riwayat produksi.",
            ];
        }

        DB::transaction(function () use ($product) {
            $this->deleteOldImages($product, ['foto_depan', 'foto_samping', 'foto_atas']);
            $product->hargaProducts()->delete();
            $product->inventories()->delete();
            $product->delete();
        });

        Log::info('Product deleted', ['id' => $id, 'kode' => $kode]);

        return [
            'success' => true,
            'message' => "Product '{$kode}' berhasil dihapus.",
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, string>    $fields
     * @return array<string, string>
     */
    private function handleImageUpload(array $data, array $fields, ?Product $product = null): array
    {
        $uploaded = [];
        $manager = new ImageManager(new Driver());

        foreach ($fields as $field) {
            if (isset($data[$field]) && $data[$field] instanceof \Illuminate\Http\UploadedFile) {
                if ($product && $product->{$field}) {
                    Storage::disk('public')->delete($product->{$field});
                }

                $image = $manager->read($data[$field]);
                if ($image->width() > 800) {
                    $image->scale(width: 800);
                }

                $filename = 'products/' . Str::uuid() . '.jpg';
                Storage::disk('public')->put($filename, (string) $image->toJpeg(75));

                $uploaded[$field] = $filename;
            }
        }

        return $uploaded;
    }

    /**
     * @param  array<int, string>  $fields
     */
    private function deleteOldImages(Product $product, array $fields): void
    {
        foreach ($fields as $field) {
            if ($product->{$field}) {
                Storage::disk('public')->delete($product->{$field});
            }
        }
    }

    private function isCombinationChanged(Product $product, int $newJenisId, ?int $newTypeId, ?int $newBahanId, string $newUkuran): bool
    {
        return (int) $product->jenis_id !== $newJenisId
            || ($product->type_id ? (int) $product->type_id : null) !== $newTypeId
            || ($product->bahan_id ? (int) $product->bahan_id : null) !== $newBahanId
            || trim((string) $product->ukuran) !== trim($newUkuran);
    }

    private function buildProductKode(int $jenisId, ?int $typeId, ?int $bahanId, string $ukuran, ?int $ignoreProductId = null): string
    {
        $jenisNama = JenisProduct::find($jenisId)?->nama;
        $typeNama = $typeId ? TypeProduct::find($typeId)?->nama : null;
        $bahanNama = $bahanId ? BahanProduct::find($bahanId)?->nama : null;

        $baseKode = strtoupper(
            $this->jenisKode($jenisNama ?? '') .
            $this->typeKode($typeNama ?? '') .
            $this->bahanKode($bahanNama ?? '') .
            $this->ukuranKode($ukuran)
        );

        $existing = Product::where('kode', $baseKode)
            ->when($ignoreProductId, fn($q) => $q->where('id', '!=', $ignoreProductId))
            ->first();

        if ($existing) {
            throw new \Exception("Kode produk '{$baseKode}' sudah digunakan oleh produk lain (ID: {$existing->id}).");
        }

        return $baseKode;
    }

    private function jenisKode(string $text): string
    {
        $text = trim($text);
        return strlen($text) < 2 ? strtoupper($text) : strtoupper(substr($text, 0, 1) . substr($text, -1));
    }

    private function typeKode(string $text): string
    {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));
        $words = collect(preg_split('/\s+/', trim($clean)))->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));
        $huruf = $words->count() === 1 ? substr($words->first(), 0, 2) : $words->map(fn($w) => substr($w, 0, 1))->implode('');
        preg_match_all('/\d+/', $text, $matches);
        $angka = count($matches[0]) >= 2 ? $matches[0][0] . $matches[0][1] : ($matches[0][0] ?? '');
        return strtoupper($huruf . $angka);
    }

    private function bahanKode(string $text): string
    {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));
        $words = collect(preg_split('/\s+/', trim($clean)))->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));
        return $words->count() === 1 ? substr($words->first(), 0, 2) : $words->map(fn($w) => substr($w, 0, 1))->implode('');
    }

    private function ukuranKode(string $text): string
    {
        preg_match_all('/\d+[.,]?\d*/', $text, $matches);
        $numbers = array_map(fn($n) => str_replace([',', '.'], '', $n), $matches[0]);
        return implode('', $numbers);
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

                Log::info('Product cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Product cache invalidation fallback used', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildListCacheKey(int $version, ?string $search, ?int $jenisId, ?int $typeId, int $perPage, int $page): string
    {
        $searchKey = $search ? md5($search) : 'all';
        $jenisKey = $jenisId ?? 'all';
        $typeKey = $typeId ?? 'all';

        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$jenisKey}:{$typeKey}:{$perPage}:{$page}";
    }
}