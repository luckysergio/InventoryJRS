<?php

namespace App\Services\ProductCustomer;

use App\Models\BahanProduct;
use App\Models\Customer;
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

class ProductCustomerService
{
    private const CACHE_LIST_PREFIX = 'product_customers:list:v';
    private const CACHE_DETAIL_PREFIX = 'product_customers:detail:v';
    private const CACHE_VERSION_KEY = 'product_customers:cache:version';
    private const CACHE_VERSION_LOCK = 'product_customers:cache:version:lock';
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getList(?string $search = null, ?int $customerId = null, int $perPage = 15, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $customerId, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $customerId, $perPage, $page) {
            $query = Product::select([
                'products.id', 'products.kode', 'products.ukuran', 'products.keterangan',
                'products.customer_id', 'products.jenis_id', 'products.type_id', 'products.bahan_id',
                'products.foto_depan', 'products.foto_samping', 'products.foto_atas',
                'products.created_at', 'products.updated_at',
            ])
                ->with([
                    'customer:id,name,phone',
                    'jenis:id,nama',
                    'type:id,nama',
                    'bahan:id,nama',
                    'hargaProducts' => fn($q) => $q->orderByDesc('tanggal_berlaku')->limit(1),
                    'inventories' => fn($q) => $q->join('places', 'places.id', '=', 'inventories.place_id')
                        ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                        ->select('inventories.product_id', 'inventories.qty', 'places.kode as place_kode'),
                ])
                ->whereNotNull('customer_id')
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('products.kode', 'like', "%{$search}%")
                            ->orWhere('products.ukuran', 'like', "%{$search}%")
                            ->orWhereHas('jenis', fn($j) => $j->where('nama', 'like', "%{$search}%"))
                            ->orWhereHas('type', fn($t) => $t->where('nama', 'like', "%{$search}%"))
                            ->orWhereHas('bahan', fn($b) => $b->where('nama', 'like', "%{$search}%"));
                    });
                })
                ->when($customerId, fn($q) => $q->where('products.customer_id', $customerId))
                ->orderBy('products.kode', 'asc');

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        $items = collect($paginator->items())->map(function ($product) {
            $arr = $product->toArray();
            $arr['harga'] = $product->hargaProducts->first()?->harga ?? null;
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
                'customer:id,name,phone',
                'jenis:id,nama',
                'type:id,nama',
                'bahan:id,nama',
                'hargaProducts' => fn($q) => $q->orderByDesc('tanggal_berlaku')->limit(1),
                'inventories.place',
            ])->whereNotNull('customer_id')->find($id);

            if (!$product) return null;

            $arr = $product->toArray();
            $arr['harga'] = $product->hargaProducts->first()?->harga ?? null;
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

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $customer = Customer::findOrFail($data['customer_id']);

            $jenis = !empty($data['jenis_id'])
                ? JenisProduct::findOrFail($data['jenis_id'])
                : JenisProduct::firstOrCreate(['nama' => strtoupper(trim($data['jenis_nama']))]);

            $type = !empty($data['type_id'])
                ? TypeProduct::where('id', $data['type_id'])->where('jenis_id', $jenis->id)->firstOrFail()
                : TypeProduct::firstOrCreate(['nama' => strtoupper(trim($data['type_nama'])), 'jenis_id' => $jenis->id]);

            $bahanId = null;
            if (!empty($data['bahan_id'])) {
                $bahanId = (int) $data['bahan_id'];
            } elseif (!empty($data['bahan_nama'])) {
                $bahan = BahanProduct::firstOrCreate(['nama' => strtoupper(trim($data['bahan_nama']))]);
                $bahanId = $bahan->id;
            }

            $kode = $this->generatePesananProductKode(
                $customer->name,
                $customer->phone ?? '',
                $jenis->nama,
                $type->nama ?? null,
                $bahanId ? BahanProduct::find($bahanId)?->nama : null,
                $data['ukuran']
            );

            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas']);

            $product = Product::create(array_merge([
                'kode' => $kode,
                'customer_id' => $customer->id,
                'jenis_id' => $jenis->id,
                'type_id' => $type->id,
                'bahan_id' => $bahanId,
                'ukuran' => $data['ukuran'],
                'keterangan' => $data['keterangan'] ?? null,
            ], $foto));

            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => $customer->id,
                'harga' => (int) $data['harga'],
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga awal customer',
            ]);

            foreach (Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get() as $place) {
                Inventory::firstOrCreate(
                    ['product_id' => $product->id, 'place_id' => $place->id],
                    ['qty' => 0]
                );
            }

            Log::info('ProductCustomer created', ['id' => $product->id, 'kode' => $product->kode]);

            return $product->load(['customer:id,name,phone', 'jenis:id,nama', 'type:id,nama', 'bahan:id,nama']);
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            if (!$product->exists) {
                throw new \Exception("Gagal update: Data product customer tidak valid.");
            }

            // Resolve master data
            $jenisBaru = $data['jenis_id'] ?? $product->jenis_id;
            $typeBaru = $data['type_id'] ?? $product->type_id;
            $bahanBaru = $data['bahan_id'] ?? $product->bahan_id;
            $ukuranBaru = $data['ukuran'];

            // Cek perubahan untuk regenerate kode
            $isChanged = $ukuranBaru !== $product->ukuran
                || $jenisBaru != $product->jenis_id
                || $typeBaru != $product->type_id
                || $bahanBaru != $product->bahan_id;

            $kodeBaru = $product->kode;
            if ($isChanged) {
                $jenisNama = JenisProduct::find($jenisBaru)?->nama;
                $typeNama = TypeProduct::find($typeBaru)?->nama;
                $bahanNama = BahanProduct::find($bahanBaru)?->nama;

                $kodeBaru = $this->generatePesananProductKode(
                    $product->customer->name,
                    $product->customer->phone ?? '',
                    $jenisNama,
                    $typeNama,
                    $bahanNama,
                    $ukuranBaru
                );
            }

            // Handle image upload
            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas'], $product);

            $product->update(array_merge([
                'jenis_id' => $jenisBaru,
                'type_id' => $typeBaru,
                'bahan_id' => $bahanBaru,
                'ukuran' => $ukuranBaru,
                'keterangan' => $data['keterangan'] ?? null,
                'kode' => $kodeBaru,
            ], $foto));

            // Update harga hanya jika berubah
            if (isset($data['harga'])) {
                $lastHarga = HargaProduct::where('product_id', $product->id)
                    ->where('customer_id', $product->customer_id)
                    ->orderByDesc('tanggal_berlaku')
                    ->first();

                $hargaBaru = (int) $data['harga'];
                if ($hargaBaru !== ($lastHarga?->harga)) {
                    HargaProduct::create([
                        'product_id' => $product->id,
                        'customer_id' => $product->customer_id,
                        'harga' => $hargaBaru,
                        'tanggal_berlaku' => now(),
                        'keterangan' => 'Update harga',
                    ]);
                }
            }

            Log::info('ProductCustomer updated', ['id' => $product->id, 'kode_changed' => $isChanged]);

            return $product->fresh()->load(['customer:id,name,phone', 'jenis:id,nama', 'type:id,nama', 'bahan:id,nama']);
        });
    }

    public function delete(Product $product): array
    {
        $id = $product->id;
        $kode = $product->kode;

        if (!$id || !$product->exists) {
            return ['success' => false, 'code' => 400, 'message' => 'Data product customer tidak valid.'];
        }

        // Proteksi: cek relasi transaksi
        $hasTransaksi = DB::table('transaksi_details')->where('product_id', $id)->exists();
        if ($hasTransaksi) {
            return ['success' => false, 'code' => 422, 'message' => "Product '{$kode}' tidak dapat dihapus karena masih memiliki riwayat transaksi."];
        }

        // Proteksi: cek relasi produksi
        $hasProduksi = DB::table('productions')->where('product_id', $id)->exists();
        if ($hasProduksi) {
            return ['success' => false, 'code' => 422, 'message' => "Product '{$kode}' tidak dapat dihapus karena masih memiliki riwayat produksi."];
        }

        DB::transaction(function () use ($product) {
            $this->deleteOldImages($product, ['foto_depan', 'foto_samping', 'foto_atas']);
            $product->hargaProducts()->delete();
            $product->inventories()->delete();
            $product->delete();
        });

        Log::info('ProductCustomer deleted', ['id' => $id, 'kode' => $kode]);

        return ['success' => true, 'message' => "Product '{$kode}' berhasil dihapus."];
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE HANDLING
    |--------------------------------------------------------------------------
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
                Storage::disk('public')->put($filename, (string) $image->toJpeg(85));

                $uploaded[$field] = $filename;
            }
        }

        return $uploaded;
    }

    private function deleteOldImages(Product $product, array $fields): void
    {
        foreach ($fields as $field) {
            if ($product->{$field}) {
                Storage::disk('public')->delete($product->{$field});
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | KODE GENERATION
    |--------------------------------------------------------------------------
    */

    private function generateCustomerPrefix(string $customerName, string $customerPhone): string
    {
        $initial = collect(preg_split('/\s+/', trim($customerName)))
            ->map(fn($w) => strtoupper(substr($w, 0, 1)))
            ->filter(fn($c) => ctype_alpha($c))
            ->take(4)
            ->implode('');

        $hp = preg_replace('/\D/', '', $customerPhone);
        return $initial . substr($hp, -4);
    }

    private function jenisKode(string $text): string
    {
        $text = strtoupper(trim($text));
        return strlen($text) < 2 ? $text : substr($text, 0, 1) . substr($text, -1);
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

    private function extractNumbers(?string $text): string
    {
        if (!$text) return '';
        preg_match_all('/\d+/', $text, $matches);
        return implode('', $matches[0]);
    }

    private function makeUniqueKode(string $baseKode): string
    {
        $kode = $baseKode;
        $i = 1;
        while (Product::where('kode', $kode)->exists()) {
            $kode = "{$baseKode}-{$i}";
            $i++;
        }
        return $kode;
    }

    private function generatePesananProductKode(string $customerName, string $customerPhone, string $jenisNama, ?string $typeNama, ?string $bahanNama, string $ukuran): string
    {
        $prefix = $this->generateCustomerPrefix($customerName, $customerPhone);
        $baseKode = strtoupper(
            $this->jenisKode($jenisNama) .
            ($typeNama ? $this->typeKode($typeNama) : '') .
            ($bahanNama ? $this->bahanKode($bahanNama) : '') .
            $this->extractNumbers($ukuran)
        );
        return $this->makeUniqueKode("{$prefix}-{$baseKode}");
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
                Log::info('ProductCustomer cache invalidated', ['old_version' => $current, 'new_version' => $current + 1]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);
            Log::warning('ProductCustomer cache invalidation fallback', ['error' => $e->getMessage()]);
        }
    }

    private function buildListCacheKey(int $version, ?string $search, ?int $customerId, int $perPage, int $page): string
    {
        $searchKey = $search ? md5($search) : 'all';
        $customerKey = $customerId ?? 'all';
        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$customerKey}:{$perPage}:{$page}";
    }
}