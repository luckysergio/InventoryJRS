<?php

namespace App\Services\ProductDistributor;

use App\Models\BahanProduct;
use App\Models\Distributor;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\Product;
use App\Models\TypeProduct;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductDistributorService
{
    private const CACHE_LIST_PREFIX = 'product_distributors:list:';
    private const CACHE_INDEX_KEY = 'product_distributors:cache:index';
    
    private const CACHE_TTL_LIST = 300;     // 5 Menit
    private const CACHE_TTL_INDEX = 86400;  // 24 Jam

    public function getList(?string $search = null, ?int $jenisId = null, ?int $typeId = null, int $perPage = 15, int $page = 1)
    {
        $cacheKey = $this->buildListCacheKey($search, $jenisId, $typeId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $typeId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            $query = Product::with([
                'jenis', 'type', 'bahan', 'distributor',
                'hargaProducts' => fn($q) => $q->whereNull('customer_id')->orderBy('tanggal_berlaku', 'desc')->limit(1),
                'inventories.place' => fn($q) => $q->whereIn('kode', ['TOKO', 'BENGKEL'])
            ])
            ->whereNotNull('distributor_id')
            ->when($search, function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('ukuran', 'like', "%{$search}%")
                  ->orWhereHas('jenis', fn($q2) => $q2->where('nama', 'like', "%{$search}%"))
                  ->orWhereHas('type', fn($q2) => $q2->where('nama', 'like', "%{$search}%"))
                  ->orWhereHas('bahan', fn($q2) => $q2->where('nama', 'like', "%{$search}%"));
            })
            ->byJenis($jenisId)
            ->byType($typeId)
            ->orderBy('kode', 'asc');

            $products = $query->paginate($perPage, ['*'], 'page', $page);

            $products->getCollection()->transform(function ($product) {
                $hargaUmum = $product->hargaProducts->first();
                $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;

                $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
                $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');

                $product->qty_toko = $toko ? $toko->qty : 0;
                $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;

                unset($product->hargaProducts);
                unset($product->inventories);
                return $product;
            });

            return $products;
        });
    }

    public function create(array $data): Product
    {
        DB::beginTransaction();
        try {
            $distributor = Distributor::findOrFail($data['distributor_id']);
            
            $jenis = !empty($data['jenis_id']) 
                ? JenisProduct::findOrFail($data['jenis_id']) 
                : JenisProduct::firstOrCreate(['nama' => strtoupper(trim($data['jenis_nama']))]);

            $type = !empty($data['type_id']) 
                ? TypeProduct::where('id', $data['type_id'])->where('jenis_id', $jenis->id)->firstOrFail() 
                : TypeProduct::firstOrCreate(['nama' => strtoupper(trim($data['type_nama'])), 'jenis_id' => $jenis->id]);

            $bahan = !empty($data['bahan_id']) 
                ? BahanProduct::findOrFail($data['bahan_id']) 
                : BahanProduct::firstOrCreate(['nama' => strtoupper(trim($data['bahan_nama']))]);

            $kode = $this->generateKode($jenis, $type, $bahan, $data['ukuran'], $distributor->nama, $distributor->no_hp);
            $foto = $this->uploadImages($data, ['foto_depan', 'foto_samping', 'foto_atas']);

            $product = Product::create(array_merge([
                'kode'           => $kode,
                'jenis_id'       => $jenis->id,
                'type_id'        => $type->id,
                'bahan_id'       => $bahan->id,
                'ukuran'         => $data['ukuran'],
                'keterangan'     => $data['keterangan'] ?? null,
                'distributor_id' => $distributor->id,
                'harga_beli'     => $data['harga_beli'],
            ], $foto));

            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => null,
                'harga' => $data['harga_umum'],
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga awal'
            ]);

            foreach (Place::where('kode', 'TOKO')->get() as $place) {
                Inventory::firstOrCreate(['product_id' => $product->id, 'place_id' => $place->id], ['qty' => 0]);
            }

            DB::commit();
            $this->invalidateAllCache();
            return $product->load(['jenis', 'type', 'bahan', 'distributor']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Create Product Distributor failed', ['error' => $e->getMessage()]);
            throw new \Exception("Gagal membuat product distributor: " . $e->getMessage());
        }
    }

    public function update(Product $product, array $data): Product
    {
        DB::beginTransaction();
        try {
            $distributor = Distributor::findOrFail($data['distributor_id']);
            
            $typeId = !empty($data['type_nama']) 
                ? TypeProduct::firstOrCreate(['nama' => strtoupper(trim($data['type_nama'])), 'jenis_id' => $data['jenis_id']])->id 
                : $data['type_id'];

            $bahanId = !empty($data['bahan_nama']) 
                ? BahanProduct::firstOrCreate(['nama' => strtoupper(trim($data['bahan_nama']))])->id 
                : $data['bahan_id'];

            $jenis = JenisProduct::findOrFail($data['jenis_id']);
            $type = $typeId ? TypeProduct::find($typeId) : null;
            $bahan = $bahanId ? BahanProduct::find($bahanId) : null;

            $kode = $this->generateKode($jenis, $type, $bahan, $data['ukuran'], $distributor->nama, $distributor->no_hp, $product->id);
            $foto = $this->uploadImages($data, ['foto_depan', 'foto_samping', 'foto_atas'], $product);

            $updateData = array_merge([
                'kode'           => $kode,
                'jenis_id'       => $jenis->id,
                'type_id'        => $typeId,
                'bahan_id'       => $bahanId,
                'ukuran'         => $data['ukuran'],
                'keterangan'     => $data['keterangan'] ?? null,
                'distributor_id' => $distributor->id,
                'harga_beli'     => $data['harga_beli'],
            ], $foto);

            $product->update($updateData);

            $product->hargaProducts()->whereNull('customer_id')->delete();
            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => null,
                'harga' => $data['harga_umum'],
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga diperbarui'
            ]);

            DB::commit();
            $this->invalidateAllCache();
            return $product->fresh()->load(['jenis', 'type', 'bahan', 'distributor']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Update Product Distributor failed', ['error' => $e->getMessage()]);
            throw new \Exception("Gagal memperbarui product distributor: " . $e->getMessage());
        }
    }

    public function delete(Product $product): array
    {
        DB::beginTransaction();
        try {
            $this->deleteOldImages($product, ['foto_depan', 'foto_samping', 'foto_atas']);
            $productId = $product->id;
            $product->delete();
            
            DB::commit();
            $this->invalidateAllCache();
            return ['success' => true, 'message' => 'Product distributor berhasil dihapus.'];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new \Exception("Gagal menghapus product distributor: " . $e->getMessage());
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    private function uploadImages(array $data, array $fields, ?Product $product = null): array
    {
        $manager = new ImageManager(new Driver());
        $uploaded = [];
        
        // ✅ PATH DIREKTORI (Pilih salah satu)
        $basePath = public_path('storage/products');
        // $basePath = '/home/jaym3787/public_html/storage/products';

        if (!file_exists($basePath)) {
            mkdir($basePath, 0755, true);
        }

        foreach ($fields as $field) {
            if (isset($data[$field]) && $data[$field] instanceof \Illuminate\Http\UploadedFile) {
                if ($product && $product->{$field}) {
                    $this->deleteSingleImage($product->{$field}, $basePath);
                }

                $image = $manager->read($data[$field]);
                if ($image->width() > 800) {
                    $image->scale(width: 800);
                }

                $filename = 'products/' . Str::uuid() . '.jpg';
                $path = $basePath . '/' . basename($filename);

                file_put_contents($path, (string) $image->toJpeg(75));
                chmod($path, 0644);

                $uploaded[$field] = $filename;
            }
        }
        return $uploaded;
    }

    private function deleteOldImages(Product $product, array $fields): void
    {
        $basePath = public_path('storage/products');
        // $basePath = '/home/jaym3787/public_html/storage/products';

        foreach ($fields as $field) {
            if ($product->{$field}) {
                $this->deleteSingleImage($product->{$field}, $basePath);
            }
        }
    }

    private function deleteSingleImage(string $filename, string $basePath): void
    {
        $path = $basePath . '/' . basename($filename);
        if (file_exists($path)) {
            unlink($path);
        }
    }

    private function generateKode(JenisProduct $jenis, ?TypeProduct $type, ?BahanProduct $bahan, string $ukuran, string $distributorNama, string $distributorHp, ?int $ignoreId = null): string
    {
        $baseKode = strtoupper(
            $this->jenisKode($jenis->nama) .
            ($type ? $this->typeKode($type->nama) : '') .
            ($bahan ? $this->bahanKode($bahan->nama) : '') .
            $this->ukuranKode($ukuran)
        );

        $prefix = $this->distributorPrefix($distributorNama, $distributorHp);
        return $this->makeUniqueKode("{$prefix}-{$baseKode}", $ignoreId);
    }

    private function makeUniqueKode(string $kode, ?int $ignoreId = null): string
    {
        $final = $kode;
        $i = 1;

        while (Product::where('kode', $final)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $final = "{$kode}-{$i}";
            $i++;
        }
        return $final;
    }

    private function distributorPrefix(string $nama, string $noHp): string
    {
        $initial = collect(preg_split('/\s+/', trim($nama)))->map(fn($w) => strtoupper(substr($w, 0, 1)))->implode('');
        $hpAngka = preg_replace('/\D/', '', $noHp);
        return $initial . substr($hpAngka, -4);
    }

    private function jenisKode(string $text): string {
        $text = trim($text);
        return strlen($text) < 2 ? strtoupper($text) : strtoupper(substr($text, 0, 1) . substr($text, -1));
    }

    private function typeKode(string $text): string {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));
        $words = collect(preg_split('/\s+/', trim($clean)))->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));
        $huruf = $words->count() === 1 ? substr($words->first(), 0, 2) : $words->map(fn($w) => substr($w, 0, 1))->implode('');
        preg_match_all('/\d+/', $text, $matches);
        $angka = count($matches[0]) >= 2 ? $matches[0][0] . $matches[0][1] : ($matches[0][0] ?? '');
        return strtoupper($huruf . $angka);
    }

    private function bahanKode(string $text): string {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));
        $words = collect(preg_split('/\s+/', trim($clean)))->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));
        return $words->count() === 1 ? substr($words->first(), 0, 2) : $words->map(fn($w) => substr($w, 0, 1))->implode('');
    }

    private function ukuranKode(string $text): string {
        preg_match_all('/\d+[.,]?\d*/', $text, $matches);
        return collect($matches[0])->map(fn($n) => str_replace([',', '.'], '', $n))->implode('');
    }

    // ==========================================
    // CACHE HELPER METHODS
    // ==========================================
    private function buildListCacheKey(?string $search, ?int $jenisId, ?int $typeId, int $perPage, int $page): string
    {
        return self::CACHE_LIST_PREFIX . md5(json_encode([$search, $jenisId, $typeId, $perPage, $page]));
    }

    private function trackCacheKey(string $cacheKey): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys)) $keys = [];
        if (!in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            Cache::put(self::CACHE_INDEX_KEY, $keys, self::CACHE_TTL_INDEX);
        }
    }

    private function invalidateAllCache(): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys) || empty($keys)) return;

        foreach ($keys as $key) {
            if (str_starts_with($key, self::CACHE_LIST_PREFIX)) {
                Cache::forget($key);
            }
        }
        Cache::forget(self::CACHE_INDEX_KEY);
    }
}