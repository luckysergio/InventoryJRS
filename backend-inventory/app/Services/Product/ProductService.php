<?php

namespace App\Services\Product;

use App\Models\BahanProduct;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\Product;
use App\Models\TypeProduct;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
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
    private const CACHE_DROPDOWN_KEY = 'products:dropdown:v';

    private const CACHE_FULL_KEY = 'products:full:v';
    private const CACHE_VERSION_KEY = 'products:cache:version';
    private const CACHE_VERSION_LOCK = 'products:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_AVAILABLE = 120;
    private const CACHE_TTL_LOW_STOCK = 300;
    private const CACHE_TTL_BEST_SELLER = 600;
    private const CACHE_TTL_DROPDOWN = 600;

    private const CACHE_TTL_FULL = 3600; // 1 jam

    private const STATUS_SELESAI = 'Selesai';
    private const STATUS_DIBATALKAN = 'Dibatalkan';

    private const IMAGE_MAX_DIMENSION = 1200;
    private const IMAGE_QUALITY = 80;
    private const IMAGE_FORMAT = 'webp';

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
                'products.id',
                'products.kode',
                'products.ukuran',
                'products.keterangan',
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

    public function getFull(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_FULL_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_FULL, function () {
            $products = Product::select([
                'products.id',
                'products.kode',
                'products.ukuran',
                'products.jenis_id',
                'products.type_id',
                'products.bahan_id',
            ])
                ->with([
                    'jenis:id,nama',
                    'type:id,nama,jenis_id',
                    'bahan:id,nama',
                    'inventories' => fn($q) => $q->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
                ->orderByRaw('LOWER(products.kode) ASC')
                ->get();

            return $products->map(function (Product $p) {
                $qtyToko = 0;
                $qtyBengkel = 0;

                foreach ($p->inventories as $inv) {
                    if ($inv->place_kode === 'TOKO') $qtyToko = (int) $inv->qty;
                    if ($inv->place_kode === 'BENGKEL') $qtyBengkel = (int) $inv->qty;
                }

                return [
                    'id'           => $p->id,
                    'value'        => $p->id,
                    'kode'         => $p->kode,
                    'ukuran'       => $p->ukuran,
                    'jenis_id'     => $p->jenis_id,
                    'type_id'      => $p->type_id,
                    'bahan_id'     => $p->bahan_id,
                    'jenis'        => $p->jenis ? ['id' => $p->jenis->id, 'nama' => $p->jenis->nama] : null,
                    'type'         => $p->type ? ['id' => $p->type->id, 'nama' => $p->type->nama, 'jenis_id' => $p->type->jenis_id] : null,
                    'bahan'        => $p->bahan ? ['id' => $p->bahan->id, 'nama' => $p->bahan->nama] : null,
                    'qty_toko'     => $qtyToko,
                    'qty_bengkel'  => $qtyBengkel,
                    'stok'         => $qtyToko, // Alias untuk kompatibilitas frontend
                    'label'        => implode(' • ', array_filter([
                        $p->kode,
                        $p->jenis?->nama,
                        $p->type?->nama,
                        $p->bahan?->nama,
                        $p->ukuran ? "Ukuran: {$p->ukuran}" : null,
                    ])),
                ];
            })->toArray();
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

        return Cache::remember($cacheKey, self::CACHE_TTL_BEST_SELLER, function () use ($limit, $dari, $sampai, $jenis) {
            $statusSelesaiId = DB::table('status_transaksis')
                ->where('nama', self::STATUS_SELESAI)
                ->value('id');

            if (!$statusSelesaiId) {
                Log::warning('Status Selesai tidak ditemukan di DB');
                return [];
            }

            $statusDibatalkanId = DB::table('status_transaksis')
                ->where('nama', self::STATUS_DIBATALKAN)
                ->value('id');

            $query = DB::table('transaksi_details as td')
                ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
                ->where('td.status_transaksi_id', $statusSelesaiId);

            if ($statusDibatalkanId) {
                $query->where('td.status_transaksi_id', '!=', $statusDibatalkanId);
            }

            if ($dari) {
                $query->whereDate('t.tanggal', '>=', $dari);
            }
            if ($sampai) {
                $query->whereDate('t.tanggal', '<=', $sampai);
            }

            if ($jenis) {
                $query->where('t.jenis_transaksi', $jenis);
            }

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

            if ($aggregated->isEmpty()) {
                return [];
            }

            $productIds = $aggregated->pluck('product_id')->toArray();

            $productsMap = Product::with([
                'jenis' => fn($q) => $q->select('id', 'nama'),
                'type' => fn($q) => $q->select('id', 'nama'),
                'bahan' => fn($q) => $q->select('id', 'nama'),
            ])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            $result = [];
            $rank = 1;

            foreach ($aggregated as $item) {
                $foundProduct = $productsMap->get($item->product_id);

                if (!$foundProduct instanceof Product) {
                    continue;
                }

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
        });
    }

    private function normalizeDate(?string $date, bool $isStart = true): ?string
    {
        if (empty($date)) {
            return null;
        }

        try {
            $parsed = Carbon::parse($date);
            return $parsed->format('Y-m-d');
        } catch (\Throwable $e) {
            Log::warning('Invalid date format for best seller filter', [
                'date' => $date,
                'isStart' => $isStart,
            ]);
            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

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

            Log::info('Product created', ['id' => $product->id, 'kode' => $product->kode]);

            $product->load(['jenis:id,nama', 'type:id,nama', 'bahan:id,nama']);
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

            Log::info('Product updated', ['id' => $product->id, 'kode_changed' => $isChanged]);

            return $product->fresh()->load(['jenis:id,nama', 'type:id,nama', 'bahan:id,nama']);
        });
    }

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

    public function updatePhotos(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data): Product {
            if (!$product->exists) {
                throw new \Exception("Data product tidak valid.");
            }

            $this->handleProductPhotoUpload($product, $data);

            $this->invalidateCache();

            Log::info('Product photos updated independently', [
                'product_id' => $product->id,
                'kode' => $product->kode,
                'fields_updated' => array_filter([
                    'foto_depan'   => isset($data['foto_depan']) && $data['foto_depan'] instanceof UploadedFile,
                    'foto_samping' => isset($data['foto_samping']) && $data['foto_samping'] instanceof UploadedFile,
                    'foto_atas'    => isset($data['foto_atas']) && $data['foto_atas'] instanceof UploadedFile,
                ]),
            ]);

            return $product->fresh(['jenis:id,nama', 'type:id,nama', 'bahan:id,nama']);
        });
    }

    private function handleImageUpload(array $data, array $fields, ?Product $product = null): array
    {
        $uploaded = [];
        $manager = new ImageManager(new Driver());

        foreach ($fields as $field) {
            if (isset($data[$field]) && $data[$field] instanceof UploadedFile) {
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

    private function handleProductPhotoUpload(Product $product, array $data): void
    {
        $manager = new ImageManager(new Driver());
        $fields = ['foto_depan', 'foto_samping', 'foto_atas'];
        $extension = self::IMAGE_FORMAT; // webp

        foreach ($fields as $field) {
            if (!isset($data[$field]) || !$data[$field] instanceof UploadedFile) {
                continue;
            }

            try {
                if ($product->{$field}) {
                    Storage::disk('public')->delete($product->{$field});
                }

                $image = $manager->read($data[$field]);

                if (method_exists($image, 'orient')) {
                    $image->orient();
                }

                if ($image->width() > self::IMAGE_MAX_DIMENSION || $image->height() > self::IMAGE_MAX_DIMENSION) {
                    $image->scaleDown(
                        width: self::IMAGE_MAX_DIMENSION,
                        height: self::IMAGE_MAX_DIMENSION
                    );
                }

                $encoded = $image->toWebp(self::IMAGE_QUALITY);

                $filename = 'products/' . Str::uuid() . '.' . $extension;
                Storage::disk('public')->put($filename, (string) $encoded);

                $product->{$field} = $filename;

                Log::info('Product photo compressed & saved', [
                    'field' => $field,
                    'product_id' => $product->id,
                    'filename' => $filename,
                    'original_size' => $data[$field]->getSize(),
                    'compressed_size' => strlen((string) $encoded),
                    'dimension' => $image->width() . 'x' . $image->height(),
                    'format' => $extension,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to process product photo', [
                    'field' => $field,
                    'product_id' => $product->id,
                    'error' => $e->getMessage(),
                ]);
                throw new \Exception("Gagal memproses foto {$field}: " . $e->getMessage());
            }
        }

        $product->save();
    }

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
