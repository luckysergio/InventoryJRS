<?php

namespace App\Services\Production;

use App\Models\Inventory;
use App\Models\Place;
use App\Models\Product;
use App\Models\ProductMovement;
use App\Models\Production;
use App\Models\StatusTransaksi;
use App\Models\TransaksiDetail;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductionService
{
    private const CACHE_LIST_PREFIX = 'productions:list:v';
    private const CACHE_DETAIL_PREFIX = 'productions:detail:v';
    private const CACHE_PESANAN_KEY = 'productions:pesanan:v';

    private const CACHE_VERSION_KEY = 'productions:cache:version';
    private const CACHE_VERSION_LOCK = 'productions:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_PESANAN = 120;

    // Production status
    public const STATUS_ANTRI = 'antri';
    public const STATUS_PRODUKSI = 'produksi';
    public const STATUS_SELESAI = 'selesai';
    public const STATUS_BATAL = 'batal';

    public const STATUSES = [
        self::STATUS_ANTRI,
        self::STATUS_PRODUKSI,
        self::STATUS_SELESAI,
        self::STATUS_BATAL,
    ];

    // Jenis pembuatan
    public const JENIS_PESANAN = 'pesanan';
    public const JENIS_INVENTORY = 'inventory';

    // Transaksi status names
    private const STATUS_DI_PESAN = 'Di Pesan';
    private const STATUS_DI_BUAT = 'Di Buat';
    private const STATUS_SIAP = 'Siap';

    // Image compression config
    private const IMAGE_MAX_DIMENSION = 1200;
    private const IMAGE_QUALITY = 80;
    private const IMAGE_FORMAT = 'webp';

    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Get all productions with relations (cached).
     *
     * ✅ FIXED: Hapus select specific columns pada relasi `transaksi`
     * untuk hindari error "Column not found" jika kolom tidak ada.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getList(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function (): array {
            /** @var Collection<int, Production> $productions */
            $productions = Production::with([
                // Product: tetap pakai select columns (struktur stabil)
                'product:id,kode,ukuran,jenis_id,type_id,bahan_id,foto_depan,foto_samping,foto_atas',
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                'karyawan:id,nama',
                'transaksiDetail:id,transaksi_id,product_id,qty,status_transaksi_id',
                // ✅ FIXED: transaksi tanpa select columns (ambil semua field yang ada)
                'transaksiDetail.transaksi',
                'transaksiDetail.transaksi.customer:id,name,phone',
                'transaksiDetail.statusTransaksi:id,nama',
            ])
                ->orderByDesc('created_at')
                ->get();

            return $productions->map(fn(Production $p): array => $this->transformProduction($p))->toArray();
        });
    }

    /**
     * Get detail production by ID.
     *
     * @return array<string, mixed>|null
     */
    public function getDetail(int $id): ?array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id): ?array {
            $production = Production::with([
                'product.jenis',
                'product.type',
                'product.bahan',
                'karyawan',
                // ✅ FIXED: transaksi tanpa select columns
                'transaksiDetail.transaksi.customer',
                'transaksiDetail.statusTransaksi',
            ])->find($id);

            if (!$production instanceof Production) {
                return null;
            }

            return $this->transformProduction($production);
        });
    }

    /**
     * Get pesanan siap produksi (status "Di Pesan").
     *
     * ✅ FIXED: Hapus select specific columns pada relasi `transaksi`
     * karena kolom `kode` tidak ada di tabel `transaksis`.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getPesananSiapProduksi(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_PESANAN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_PESANAN, function (): array {
            $statusDiPesan = StatusTransaksi::where('nama', self::STATUS_DI_PESAN)->first();

            if (!$statusDiPesan instanceof StatusTransaksi) {
                return [];
            }

            return TransaksiDetail::with([
                // Product: tetap pakai select columns (struktur stabil)
                'product:id,kode,ukuran,jenis_id,type_id,bahan_id',
                'product.jenis:id,nama',
                'product.type:id,nama',
                'product.bahan:id,nama',
                // ✅ FIXED: transaksi tanpa select columns (ambil semua field)
                // Sebelumnya: 'transaksi:id,kode,tanggal,customer_id' → error kolom 'kode'
                'transaksi',
                'transaksi.customer:id,name,phone',
                'statusTransaksi:id,nama',
            ])
                ->where('status_transaksi_id', $statusDiPesan->id)
                ->orderByDesc('id')
                ->get()
                ->toArray();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Create new production.
     */
    public function create(array $data): Production
    {
        return DB::transaction(function () use ($data): Production {
            if ($data['jenis_pembuatan'] === self::JENIS_PESANAN) {
                return $this->createPesanan($data);
            }

            return $this->createInventory($data);
        });
    }

    private function createPesanan(array $data): Production
    {
        $detail = TransaksiDetail::with('product')->findOrFail($data['transaksi_detail_id']);

        $statusDibuat = StatusTransaksi::where('nama', self::STATUS_DI_BUAT)->firstOrFail();

        $production = Production::create([
            'product_id'          => $detail->product_id,
            'karyawan_id'         => $data['karyawan_id'],
            'transaksi_detail_id' => $detail->id,
            'jenis_pembuatan'     => self::JENIS_PESANAN,
            'qty'                 => $detail->qty,
            'tanggal_mulai'       => $data['tanggal_mulai'],
            'tanggal_selesai'     => $data['tanggal_selesai'],
            'status'              => self::STATUS_ANTRI,
        ]);

        $detail->update(['status_transaksi_id' => $statusDibuat->id]);

        $this->invalidateCache();

        Log::info('Production (pesanan) created', [
            'id' => $production->id,
            'transaksi_detail_id' => $detail->id,
            'product_id' => $detail->product_id,
        ]);

        return $production->load([
            'product.jenis',
            'product.type',
            'product.bahan',
            'karyawan',
            'transaksiDetail.transaksi.customer',
        ]);
    }

    private function createInventory(array $data): Production
    {
        $production = Production::create([
            'product_id'      => $data['product_id'],
            'karyawan_id'     => $data['karyawan_id'],
            'jenis_pembuatan' => self::JENIS_INVENTORY,
            'qty'             => $data['qty'],
            'tanggal_mulai'   => $data['tanggal_mulai'],
            'tanggal_selesai' => $data['tanggal_selesai'],
            'status'          => self::STATUS_ANTRI,
        ]);

        $this->invalidateCache();

        Log::info('Production (inventory) created', [
            'id' => $production->id,
            'product_id' => $data['product_id'],
            'qty' => $data['qty'],
        ]);

        return $production->load([
            'product.jenis',
            'product.type',
            'product.bahan',
            'karyawan',
        ]);
    }

    /**
     * Update production status (with photo upload on selesai).
     */
    public function updateStatus(Production $production, array $data): Production
    {
        return DB::transaction(function () use ($production, $data): Production {
            if (!$production->exists) {
                throw new \Exception("Data produksi tidak valid.");
            }

            $newStatus = $data['status'];
            $oldStatus = $production->status;

            // Handle photo upload only when status = selesai
            if ($newStatus === self::STATUS_SELESAI) {
                $this->handlePhotoUpload($production, $data);
                $this->validateProductPhotos($production->product);
            }

            // Update timestamps based on status
            $this->updateTimestamps($production, $newStatus, $oldStatus);

            $production->status = $newStatus;
            $production->save();

            // Handle stock movements on transition to selesai
            if ($newStatus === self::STATUS_SELESAI && $oldStatus !== self::STATUS_SELESAI) {
                $this->handleSelesaiTransitions($production);
            }

            $this->invalidateCache();

            Log::info('Production status updated', [
                'id' => $production->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);

            return $production->fresh([
                'product.jenis',
                'product.type',
                'product.bahan',
                'karyawan',
                'transaksiDetail.transaksi.customer',
                'transaksiDetail.statusTransaksi',
            ]);
        });
    }

    /**
     * Delete production (only when status = antri).
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(Production $production): array
    {
        if (!$production->exists) {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data produksi tidak valid.',
            ];
        }

        if ($production->status !== self::STATUS_ANTRI) {
            return [
                'success' => false,
                'code' => 422,
                'message' => 'Produksi hanya bisa dihapus saat status antri.',
            ];
        }

        // If pesanan, restore status transaksi detail to "Di Pesan"
        if ($production->jenis_pembuatan === self::JENIS_PESANAN && $production->transaksi_detail_id) {
            $statusDiPesan = StatusTransaksi::where('nama', self::STATUS_DI_PESAN)->first();
            if ($statusDiPesan instanceof StatusTransaksi) {
                TransaksiDetail::where('id', $production->transaksi_detail_id)
                    ->update(['status_transaksi_id' => $statusDiPesan->id]);
            }
        }

        $production->delete();

        $this->invalidateCache();

        Log::info('Production deleted', ['id' => $production->id]);

        return [
            'success' => true,
            'message' => 'Produksi berhasil dihapus.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Handle photo upload with compression (WebP + resize + orient).
     */
    private function handlePhotoUpload(Production $production, array $data): void
    {
        $product = $production->product;

        if (!$product instanceof Product) {
            return;
        }

        $manager = new ImageManager(new Driver());
        $fields = ['foto_depan', 'foto_samping', 'foto_atas'];
        $extension = self::IMAGE_FORMAT;

        foreach ($fields as $field) {
            if (!isset($data[$field]) || !$data[$field] instanceof UploadedFile) {
                continue;
            }

            try {
                // Delete old image if exists
                if ($product->{$field}) {
                    Storage::disk('public')->delete($product->{$field});
                }

                // Read uploaded image
                $image = $manager->read($data[$field]);

                // 1. Auto-orient based on EXIF
                if (method_exists($image, 'orient')) {
                    $image->orient();
                }

                // 2. Resize down if larger than max dimension
                if ($image->width() > self::IMAGE_MAX_DIMENSION || $image->height() > self::IMAGE_MAX_DIMENSION) {
                    $image->scaleDown(
                        width: self::IMAGE_MAX_DIMENSION,
                        height: self::IMAGE_MAX_DIMENSION
                    );
                }

                // 3. Encode to optimized format
                $encoded = self::IMAGE_FORMAT === 'webp'
                    ? $image->toWebp(self::IMAGE_QUALITY)
                    : $image->toJpeg(self::IMAGE_QUALITY);

                // 4. Save with proper extension
                $filename = 'products/' . Str::uuid() . '.' . $extension;
                Storage::disk('public')->put($filename, (string) $encoded);

                $product->{$field} = $filename;

                Log::info('Production photo compressed & saved', [
                    'field' => $field,
                    'filename' => $filename,
                    'original_size' => $data[$field]->getSize(),
                    'compressed_size' => strlen((string) $encoded),
                    'dimension' => $image->width() . 'x' . $image->height(),
                    'format' => $extension,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to process production photo', [
                    'field' => $field,
                    'error' => $e->getMessage(),
                ]);
                throw new \Exception("Gagal memproses foto {$field}: " . $e->getMessage());
            }
        }

        $product->save();
    }

    private function validateProductPhotos(Product $product): void
    {
        if (!$product->foto_depan || !$product->foto_samping || !$product->foto_atas) {
            throw new \Exception('Produk harus memiliki foto depan, samping, dan atas sebelum produksi diselesaikan.');
        }
    }

    private function updateTimestamps(Production $production, string $newStatus, string $oldStatus): void
    {
        if ($newStatus === self::STATUS_PRODUKSI && !$production->tanggal_mulai) {
            $production->tanggal_mulai = now();
        }

        if ($newStatus === self::STATUS_SELESAI && $oldStatus !== self::STATUS_SELESAI) {
            if (!$production->tanggal_mulai) {
                $production->tanggal_mulai = now();
            }
            $production->tanggal_selesai = now();
        }

        if ($newStatus === self::STATUS_BATAL) {
            $production->tanggal_mulai = null;
            $production->tanggal_selesai = null;
        }
    }

    private function handleSelesaiTransitions(Production $production): void
    {
        $bengkel = Place::where('kode', 'BENGKEL')->first();

        if (!$bengkel instanceof Place) {
            Log::warning('Place BENGKEL not found during production completion');
            return;
        }

        $inventory = Inventory::firstOrCreate(
            ['product_id' => $production->product_id, 'place_id' => $bengkel->id],
            ['qty' => 0]
        );

        if ($production->jenis_pembuatan === self::JENIS_INVENTORY) {
            $this->handleInventorySelesai($production, $inventory);
        } elseif ($production->jenis_pembuatan === self::JENIS_PESANAN && $production->transaksiDetail) {
            $this->handlePesananSelesai($production, $inventory);
        }
    }

    private function handleInventorySelesai(Production $production, Inventory $inventory): void
    {
        $qtyBefore = $inventory->qty;
        $inventory->increment('qty', $production->qty);
        $inventory->refresh();

        ProductMovement::create([
            'inventory_id' => $inventory->id,
            'product_id'   => $production->product_id,
            'tipe'         => 'produksi',
            'qty'          => $production->qty,
            'stock_before' => $qtyBefore,
            'stock_after'  => $inventory->qty,
            'keterangan'   => 'Hasil produksi inventory',
            'ref_type'     => 'production',
            'ref_id'       => $production->id,
        ]);
    }

    private function handlePesananSelesai(Production $production, Inventory $inventory): void
    {
        // Step 1: Add stock (hasil produksi masuk bengkel)
        $qtyBeforeIn = $inventory->qty;
        $inventory->increment('qty', $production->qty);
        $inventory->refresh();

        ProductMovement::create([
            'inventory_id' => $inventory->id,
            'product_id'   => $production->product_id,
            'tipe'         => 'produksi',
            'qty'          => $production->qty,
            'stock_before' => $qtyBeforeIn,
            'stock_after'  => $inventory->qty,
            'keterangan'   => 'Hasil produksi pesanan',
            'ref_type'     => 'production',
            'ref_id'       => $production->id,
        ]);

        // Step 2: Remove stock (kirim ke customer)
        $qtyBeforeOut = $inventory->qty;
        $inventory->decrement('qty', $production->qty);
        $inventory->refresh();

        ProductMovement::create([
            'inventory_id' => $inventory->id,
            'product_id'   => $production->product_id,
            'tipe'         => 'out',
            'qty'          => $production->qty,
            'stock_before' => $qtyBeforeOut,
            'stock_after'  => $inventory->qty,
            'keterangan'   => 'Kirim pesanan ke customer',
            'ref_type'     => 'transaksi_detail',
            'ref_id'       => $production->transaksi_detail_id,
        ]);

        // Step 3: Update transaksi detail status to "Siap"
        $statusSiap = StatusTransaksi::where('nama', self::STATUS_SIAP)->first();
        if ($statusSiap instanceof StatusTransaksi) {
            $production->transaksiDetail->update(['status_transaksi_id' => $statusSiap->id]);
        }
    }

    /**
     * Transform production model to array with foto URLs.
     *
     * @param  Production  $p
     * @return array<string, mixed>
     */
    private function transformProduction(Production $p): array
    {
        $arr = $p->toArray();

        // Add foto URLs
        $arr['foto_urls'] = [
            'depan'   => $p->product?->foto_depan ? asset('storage/' . $p->product->foto_depan) : null,
            'samping' => $p->product?->foto_samping ? asset('storage/' . $p->product->foto_samping) : null,
            'atas'    => $p->product?->foto_atas ? asset('storage/' . $p->product->foto_atas) : null,
        ];

        return $arr;
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

                Log::info('Production cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Production cache invalidation fallback used', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}