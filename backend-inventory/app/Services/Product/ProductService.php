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
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductService
{
    private const CACHE_LIST_PREFIX = 'products:list:';
    private const CACHE_DETAIL_PREFIX = 'products:detail:';
    private const CACHE_AVAILABLE_PREFIX = 'products:available:';
    private const CACHE_INDEX_KEY = 'products:cache:index';
    
    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_AVAILABLE = 120;
    private const CACHE_TTL_INDEX = 86400;

    public function getList(?string $search = null, ?int $jenisId = null, ?int $typeId = null, int $perPage = 15, int $page = 1)
    {
        $cacheKey = $this->buildListCacheKey($search, $jenisId, $typeId, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $jenisId, $typeId, $perPage, $page, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            $query = Product::with([
                'jenis', 'type', 'bahan',
                'hargaProducts' => fn($q) => $q->whereNull('customer_id')->orderBy('tanggal_berlaku', 'desc')->limit(1),
                'inventories.place' => fn($q) => $q->whereIn('kode', ['TOKO', 'BENGKEL'])
            ])->search($search)->byJenis($jenisId)->byType($typeId);

            $products = $query->orderBy('kode', 'asc')->paginate($perPage, ['*'], 'page', $page);

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

    public function getDetail(int $id): ?Product
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;
        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);
            return Product::withRelations()->find($id);
        });
    }

    public function getAvailableProducts()
    {
        $cacheKey = self::CACHE_AVAILABLE_PREFIX . 'toko';
        return Cache::remember($cacheKey, self::CACHE_TTL_AVAILABLE, function () {
            return Product::whereHas('inventories', function ($q) {
                    $q->where('qty', '>', 0)->whereHas('place', fn($p) => $p->where('kode', 'TOKO'));
                })
                ->with(['jenis', 'type', 'bahan', 'inventories.place'])
                ->orderByRaw('LOWER(kode) ASC')
                ->get();
        });
    }

    public function getLowStockProducts()
    {
        return Product::whereIn('id', function ($sub) {
                $sub->select('product_id')
                    ->from('inventories')
                    ->join('places', 'places.id', '=', 'inventories.place_id')
                    ->whereIn('places.kode', ['TOKO', 'BENGKEL'])
                    ->groupBy('product_id')
                    ->havingRaw('SUM(inventories.qty) < 20');
            })
            ->with(['jenis', 'type', 'bahan', 'inventories.place'])
            ->orderByRaw('LOWER(products.kode) ASC')
            ->get();
    }

    public function getBestSellerProducts(int $limit = 10, ?string $dari = null, ?string $sampai = null): array
    {
        $query = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->join('products as p', 'p.id', '=', 'td.product_id')
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

        $products = Product::with(['jenis', 'type', 'bahan'])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($aggregated as $item) {
            if (isset($products[$item->product_id])) {
                $product = $products[$item->product_id];
                $product->total_qty = (int) $item->total_qty;
                $product->transaksi_terakhir = $item->transaksi_terakhir;
                $result[] = $product;
            }
        }

        usort($result, fn($a, $b) => $b->total_qty <=> $a->total_qty);
        return $result;
    }

    public function create(array $data): Product
    {
        DB::beginTransaction();
        try {
            $jenis = !empty($data['jenis_id']) 
                ? JenisProduct::findOrFail($data['jenis_id']) 
                : JenisProduct::firstOrCreate(['nama' => strtoupper(trim($data['jenis_nama'] ?? ''))]);

            $type = !empty($data['type_id']) 
                ? TypeProduct::where('id', $data['type_id'])->where('jenis_id', $jenis->id)->firstOrFail() 
                : TypeProduct::firstOrCreate(['nama' => strtoupper(trim($data['type_nama'] ?? '')), 'jenis_id' => $jenis->id]);

            $bahan = !empty($data['bahan_id']) 
                ? BahanProduct::findOrFail($data['bahan_id']) 
                : BahanProduct::firstOrCreate(['nama' => strtoupper(trim($data['bahan_nama'] ?? ''))]);

            $kode = $this->buildProductKode($jenis->id, $type->id, $bahan->id, $data['ukuran']);
            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas']);

            $product = Product::create([
                'kode' => $kode, 
                'jenis_id' => $jenis->id, 
                'type_id' => $type->id, 
                'bahan_id' => $bahan->id, 
                'ukuran' => $data['ukuran'], 
                'keterangan' => $data['keterangan'] ?? null, 
                ...$foto
            ]);

            HargaProduct::create([
                'product_id' => $product->id, 
                'customer_id' => null, 
                'harga' => $data['harga_umum'], 
                'tanggal_berlaku' => now(), 
                'keterangan' => 'Harga awal'
            ]);

            foreach (Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get() as $place) {
                Inventory::firstOrCreate([
                    'product_id' => $product->id, 
                    'place_id' => $place->id
                ], ['qty' => 0]);
            }

            DB::commit();
            $this->invalidateAllCache();
            return $product->load(['jenis', 'type', 'bahan']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new \Exception("Gagal membuat produk: " . $e->getMessage());
        }
    }

    public function update(Product $product, array $data): Product
    {
        DB::beginTransaction();
        try {
            // ✅ ROBUST: Gunakan getKey() yang lebih reliable, fallback ke id
            $productId = $product->getKey() ?? $product->id;
            
            // ✅ VALIDASI: Pastikan product valid dan exists di database
            if (!$productId || !$product->exists) {
                Log::error('Product update failed - Invalid product', [
                    'product_exists' => $product->exists,
                    'product_key' => $product->getKey(),
                    'product_id' => $product->id,
                    'product_attributes' => $product->getAttributes(),
                ]);
                throw new \Exception("Product tidak valid atau tidak ditemukan di database");
            }
            
            $productId = (int) $productId;

            // ✅ VALIDASI: Pastikan data required ada
            if (empty($data['jenis_id'])) {
                throw new \Exception("Jenis ID wajib diisi");
            }
            if (empty($data['ukuran'])) {
                throw new \Exception("Ukuran wajib diisi");
            }

            // ✅ Resolve final type_id
            $newTypeId = null;
            if (!empty($data['type_nama'])) {
                $type = TypeProduct::firstOrCreate([
                    'nama' => strtoupper(trim($data['type_nama'])), 
                    'jenis_id' => (int) $data['jenis_id']
                ]);
                $newTypeId = (int) $type->id;
            } elseif (!empty($data['type_id'])) {
                $newTypeId = (int) $data['type_id'];
            }

            // ✅ Resolve final bahan_id
            $newBahanId = null;
            if (!empty($data['bahan_nama'])) {
                $bahan = BahanProduct::firstOrCreate([
                    'nama' => strtoupper(trim($data['bahan_nama']))
                ]);
                $newBahanId = (int) $bahan->id;
            } elseif (!empty($data['bahan_id'])) {
                $newBahanId = (int) $data['bahan_id'];
            }

            // ========================================
            // ✅ SMART UPDATE: Cek apakah kombinasi berubah
            // ========================================
            $isKombinationChanged = $this->isCombinationChanged(
                $product, 
                (int) $data['jenis_id'], 
                $newTypeId, 
                $newBahanId, 
                (string) $data['ukuran']
            );

            if ($isKombinationChanged) {
                Log::info('Product combination changed, generating new code', [
                    'product_id' => $productId,
                    'old_kode' => $product->kode
                ]);
                
                $kode = $this->buildProductKode(
                    (int) $data['jenis_id'], 
                    $newTypeId, 
                    $newBahanId, 
                    (string) $data['ukuran'], 
                    $productId
                );
            } else {
                Log::info('Product combination unchanged, using existing code', [
                    'product_id' => $productId,
                    'kode' => $product->kode
                ]);
                
                $kode = $product->kode;
            }
            
            $updateData = [
                'kode' => $kode, 
                'jenis_id' => (int) $data['jenis_id'], 
                'type_id' => $newTypeId, 
                'bahan_id' => $newBahanId, 
                'ukuran' => (string) $data['ukuran'], 
                'keterangan' => $data['keterangan'] ?? null,
            ];

            $foto = $this->handleImageUpload($data, ['foto_depan', 'foto_samping', 'foto_atas'], $product);
            $updateData = array_merge($updateData, $foto);

            $product->update($updateData);

            // Update harga umum
            $product->hargaProducts()->whereNull('customer_id')->delete();
            HargaProduct::create([
                'product_id' => $productId,
                'customer_id' => null, 
                'harga' => $data['harga_umum'] ?? 0, 
                'tanggal_berlaku' => now(), 
                'keterangan' => 'Harga diperbarui'
            ]);

            DB::commit();
            $this->invalidateAllCache($productId);
            return Product::with(['jenis', 'type', 'bahan'])->findOrFail($productId);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Update product failed', [
                'product_id' => $product->getKey() ?? $product->id ?? 'unknown',
                'error' => $e->getMessage(),
                'data_keys' => array_keys($data),
            ]);
            throw new \Exception("Gagal memperbarui produk: " . $e->getMessage());
        }
    }

    /**
     * ✅ Cek apakah kombinasi (jenis, type, bahan, ukuran) berubah
     */
    private function isCombinationChanged(
        Product $product, 
        int $newJenisId, 
        ?int $newTypeId, 
        ?int $newBahanId, 
        string $newUkuran
    ): bool {
        // Cek jenis_id
        $oldJenisId = $product->jenis_id ? (int) $product->jenis_id : 0;
        if ($oldJenisId !== $newJenisId) {
            return true;
        }
        
        // Cek type_id
        $oldTypeId = $product->type_id ? (int) $product->type_id : null;
        if ($oldTypeId !== $newTypeId) {
            return true;
        }
        
        // Cek bahan_id
        $oldBahanId = $product->bahan_id ? (int) $product->bahan_id : null;
        if ($oldBahanId !== $newBahanId) {
            return true;
        }
        
        // Cek ukuran
        $oldUkuran = $product->ukuran ? trim((string) $product->ukuran) : '';
        if ($oldUkuran !== trim($newUkuran)) {
            return true;
        }
        
        return false;
    }

    public function delete(Product $product): array
    {
        DB::beginTransaction();
        try {
            $this->deleteOldImages($product, ['foto_depan', 'foto_samping', 'foto_atas']);
            $productId = $product->getKey() ?? $product->id;
            $product->delete();
            
            DB::commit();
            $this->invalidateAllCache($productId);
            return ['success' => true, 'message' => 'Produk berhasil dihapus.'];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new \Exception("Gagal menghapus produk: " . $e->getMessage());
        }
    }

    private function handleImageUpload(array $data, array $fields, ?Product $product = null): array
    {
        $manager = new ImageManager(new Driver());
        $uploaded = [];

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

    private function jenisKode(string $text): string
    {
        $text = trim($text);
        if (strlen($text) < 2) return strtoupper($text);
        return strtoupper(substr($text, 0, 1) . substr($text, -1));
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

    private function generateProductKode(?string $jenisNama, ?string $typeNama, ?string $bahanNama, string $ukuran): string
    {
        return strtoupper(
            ($jenisNama ? $this->jenisKode($jenisNama) : '') .
            ($typeNama  ? $this->typeKode($typeNama)  : '') .
            ($bahanNama ? $this->bahanKode($bahanNama) : '') .
            $this->ukuranKode($ukuran)
        );
    }

    private function makeUniqueKode(string $baseKode, ?int $ignoreId = null): string
    {
        $existingProduct = Product::where('kode', $baseKode)->first();
        
        if (!$existingProduct) {
            return $baseKode;
        }
        
        if ($ignoreId && (int) $existingProduct->id === $ignoreId) {
            return $baseKode;
        }
        
        throw new \Exception("Kode produk '{$baseKode}' sudah digunakan oleh produk lain (ID: {$existingProduct->id}). Silakan ubah kombinasi jenis, tipe, bahan, atau ukuran.");
    }

    private function buildProductKode(int $jenis_id, ?int $type_id, ?int $bahan_id, string $ukuran, ?int $ignoreProductId = null): string
    {
        $jenisNama = JenisProduct::find($jenis_id)?->nama;
        $typeNama  = $type_id  ? TypeProduct::find($type_id)?->nama : null;
        $bahanNama = $bahan_id ? BahanProduct::find($bahan_id)?->nama : null;

        $baseKode = $this->generateProductKode($jenisNama, $typeNama, $bahanNama, $ukuran);
        
        return $this->makeUniqueKode($baseKode, $ignoreProductId);
    }

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

    private function invalidateAllCache(?int $productId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys) || empty($keys)) return;

        $remainingKeys = [];
        $detailKey = $productId ? self::CACHE_DETAIL_PREFIX . $productId : null;

        foreach ($keys as $key) {
            if (str_starts_with($key, self::CACHE_LIST_PREFIX) || 
                str_starts_with($key, self::CACHE_AVAILABLE_PREFIX) || 
                ($detailKey && $key === $detailKey)) {
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }
        Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, self::CACHE_TTL_INDEX);
    }
}