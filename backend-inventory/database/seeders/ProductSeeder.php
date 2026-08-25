<?php

namespace Database\Seeders;

use App\Models\BahanProduct;
use App\Models\HargaProduct;
use App\Models\JenisProduct;
use App\Models\Product;
use App\Models\TypeProduct;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    private const TOTAL_PRODUCTS = 1000;
    private const CHUNK_SIZE = 500;

    // ==========================================
    // UKURAN PER JENIS (spesifik industri karet)
    // ==========================================
    private const UKURAN_BY_JENIS = [
        'MOUNTING' => [
            'Ø25x30', 'Ø30x40', 'Ø35x45', 'Ø40x50', 'Ø45x60',
            'Ø50x60', 'Ø50x75', 'Ø60x75', 'Ø60x80', 'Ø70x90',
            'Ø75x100', 'Ø80x100', 'Ø80x120', 'Ø90x120', 'Ø100x125',
            'Ø100x150', 'Ø120x150', 'Ø125x150', 'Ø150x180', '30x30x20',
            '40x40x25', '50x50x30', '60x60x35', '75x75x40', '100x100x50',
        ],
        'KOPLING' => [
            'Size #2', 'Size #3', 'Size #4', 'Size #5', 'Size #6',
            '100mm', '112mm', '125mm', '140mm', '150mm',
            '160mm', '180mm', '200mm', '224mm', '250mm',
            '280mm', '315mm', '355mm', '400mm', '450mm',
            'T-90', 'T-105', 'T-150', 'T-170', 'T-200',
        ],
        'BANTALAN' => [
            'Ø25', 'Ø30', 'Ø35', 'Ø40', 'Ø45',
            'Ø50', 'Ø55', 'Ø60', 'Ø65', 'Ø70',
            'Ø75', 'Ø80', 'Ø85', 'Ø90', 'Ø95',
            'Ø100', 'Ø110', 'Ø120', 'Ø125', 'Ø140',
            'Ø150', 'Ø160', 'Ø180', 'Ø200', '100x50',
        ],
    ];

    // ==========================================
    // RANGE HARGA PER JENIS (realistis spare part karet)
    // ==========================================
    private const HARGA_RANGE = [
        'MOUNTING' => [25000, 350000],
        'KOPLING'  => [85000, 850000],
        'BANTALAN' => [45000, 450000],
    ];

    // Faktor pengali harga per bahan (FKM/Viton paling mahal)
    private const BAHAN_MULTIPLIER = [
        'ALAM'            => 1.0,
        'NR'              => 1.0,
        'NBR'             => 1.2,
        'SILIKON'         => 1.4,
        'POLYURETHANE'    => 1.5,
        'HDPE (NYLON)'    => 1.1,
        'PTFE (TEFLON)'   => 1.8,
        'FKM (VITON)'     => 2.2,
    ];

    public function run(): void
    {
        $startTime = microtime(true);
        $this->command?->info('');
        $this->command?->info('⚙️  Starting Product Seeder...');
        $this->command?->info('📊 Target: ' . self::TOTAL_PRODUCTS . ' spare parts');
        $this->command?->newLine();

        // ============================================
        // Verifikasi master data
        // ============================================
        $this->command?->info('🔍 Verifying master data...');

        /** @var Collection<int, JenisProduct> $jenisList */
        $jenisList = JenisProduct::all()->keyBy('id');
        
        /** @var Collection<int, BahanProduct> $bahanList */
        $bahanList = BahanProduct::all()->keyBy('id');
        
        /** @var Collection<int, TypeProduct> $typeList */
        $typeList = TypeProduct::with('jenis')->get();

        if ($jenisList->isEmpty() || $bahanList->isEmpty() || $typeList->isEmpty()) {
            $this->command?->error('❌ Data master tidak lengkap!');
            $this->command?->info('💡 Jalankan: JenisSeeder, TypeSeeder, BahanSeeder, PlaceSeeder');
            return;
        }

        $this->command?->info('   ✅ Master data OK (' .
            $jenisList->count() . ' jenis, ' .
            $typeList->count() . ' types, ' .
            $bahanList->count() . ' bahan)');

        $typesByJenis = $typeList->groupBy('jenis.nama');

        // ============================================
        // Konfirmasi truncate
        // ============================================
        $existingCount = Product::count();
        if ($existingCount > 0) {
            $confirm = $this->command?->confirm(
                "⚠️  Ditemukan {$existingCount} produk existing. Truncate (products + harga)?",
                false
            );

            if ($confirm) {
                $this->command?->warn('🗑️  Truncating products + harga_products...');
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                HargaProduct::truncate();
                Product::truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                $this->command?->info('✅ Tables truncated.');
            } else {
                $this->command?->info('ℹ️  Menambahkan ke data existing...');
            }
        }

        // ============================================
        // ✅ FIXED: Generate data dengan 2 array terpisah
        // ============================================
        $this->command?->info('⚙️  Generating product data...');
        [$insertData, $tempData] = $this->generateProductData($jenisList, $typesByJenis, $bahanList);

        // ============================================
        // Insert products (hanya kolom real DB)
        // ============================================
        $this->command?->newLine();
        $this->command?->info('💾 Inserting products...');

        $bar = $this->command?->getOutput()->createProgressBar(self::TOTAL_PRODUCTS);
        $bar?->setFormat(' %current%/%max% [%bar%] %percent:3s%% | %message%');
        $bar?->setMessage('Starting...');
        $bar?->start();

        $inserted = 0;
        $chunks = array_chunk($insertData, self::CHUNK_SIZE);

        foreach ($chunks as $index => $chunk) {
            $bar?->setMessage("Chunk " . ($index + 1) . "/" . count($chunks));
            Product::insert($chunk);
            $inserted += count($chunk);
            $bar?->advance(count($chunk));
        }

        $bar?->setMessage('Done!');
        $bar?->finish();
        $this->command?->newLine(2);

        // ============================================
        // Update product.kode dengan ID real
        // ============================================
        $this->command?->info('🔄 Updating product codes (JRS-{JENIS}-{ID})...');
        $this->updateProductCodes();

        // ============================================
        // Generate & insert harga (pakai tempData untuk referensi)
        // ============================================
        $this->command?->info('💰 Generating harga products...');
        $hargaProducts = $this->generateHargaData($tempData);

        $this->command?->info('💾 Inserting harga products...');
        $hargaChunks = array_chunk($hargaProducts, self::CHUNK_SIZE);
        $hargaBar = $this->command?->getOutput()->createProgressBar(count($hargaChunks));
        $hargaBar?->start();

        foreach ($hargaChunks as $chunk) {
            HargaProduct::insert($chunk);
            $hargaBar?->advance();
        }
        $hargaBar?->finish();
        $this->command?->newLine(2);

        $elapsed = round(microtime(true) - $startTime, 2);

        // ============================================
        // Summary
        // ============================================
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->info('✅ Product Seeding Completed!');
        $this->command?->info('═══════════════════════════════════════');

        $jenisStats = [];
        foreach ($jenisList as $jenis) {
            $count = Product::where('jenis_id', $jenis->id)->count();
            $jenisStats[] = [$jenis->nama, $count];
        }

        $this->command?->table(['Jenis', 'Count'], $jenisStats);
        $this->command?->newLine();

        $this->command?->table(
            ['Metric', 'Value'],
            [
                ['Products Created', "<fg=green>{$inserted}</>"],
                ['Harga Products', '<fg=blue>' . count($hargaProducts) . '</>'],
                ['Elapsed Time', "{$elapsed}s"],
                ['Speed', round($inserted / max($elapsed, 0.01), 0) . ' products/sec'],
            ]
        );
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->newLine();
    }

    /**
     * ✅ FIXED: Return 2 array terpisah
     * - insertData: untuk DB (hanya kolom real)
     * - tempData: untuk generate harga (metadata)
     * 
     * @param Collection<int, JenisProduct> $jenisList
     * @param Collection<string, Collection> $typesByJenis
     * @param Collection<int, BahanProduct> $bahanList
     * @return array{0: array, 1: array}
     */
    private function generateProductData(Collection $jenisList, Collection $typesByJenis, Collection $bahanList): array
    {
        $insertData = [];
        $tempData = [];
        $now = Carbon::now();

        $jenisIds = $jenisList->keys()->toArray();
        $bahanIds = $bahanList->keys()->toArray();

        for ($i = 0; $i < self::TOTAL_PRODUCTS; $i++) {
            $jenisId = $jenisIds[array_rand($jenisIds)];
            $jenis = $jenisList[$jenisId];
            $jenisNama = $jenis->nama;

            $availableTypes = $typesByJenis[$jenisNama] ?? collect();
            if ($availableTypes->isEmpty()) {
                $i--; // retry
                continue;
            }
            $type = $availableTypes->random();

            $bahanId = $bahanIds[array_rand($bahanIds)];
            $bahan = $bahanList[$bahanId];

            $ukuranPool = self::UKURAN_BY_JENIS[$jenisNama] ?? ['STD'];
            $ukuran = $ukuranPool[array_rand($ukuranPool)];

            $kode = 'TMP-' . strtoupper(Str::substr($jenisNama, 0, 3)) . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT);

            $daysAgo = random_int(0, 365);
            $createdAt = $now->copy()->subDays($daysAgo)->subHours(random_int(0, 23));

            // ✅ Data untuk INSERT ke DB (hanya kolom real)
            $insertData[] = [
                'kode'       => $kode,
                'jenis_id'   => $jenisId,
                'type_id'    => $type->id,
                'bahan_id'   => $bahanId,
                'ukuran'     => $ukuran,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            // ✅ Data temporary untuk generate harga (disimpan terpisah)
            $tempData[] = [
                'index'      => $i,
                'jenis_nama' => $jenisNama,
                'bahan_nama' => $bahan->nama ?? '',
            ];
        }

        return [$insertData, $tempData];
    }

    private function updateProductCodes(): void
    {
        $products = Product::with('jenis')->get();

        $bar = $this->command?->getOutput()->createProgressBar($products->count());
        $bar?->setMessage('Updating codes...');
        $bar?->start();

        foreach ($products as $product) {
            $prefix = strtoupper(Str::substr($product->jenis?->nama ?? 'PRD', 0, 3));
            $newCode = "JRS-{$prefix}-" . str_pad($product->id, 4, '0', STR_PAD_LEFT);

            Product::where('id', $product->id)->update(['kode' => $newCode]);
            $bar?->advance();
        }

        $bar?->finish();
        $this->command?->newLine();
    }

    /**
     * Generate harga berdasarkan tempData
     * 
     * @param array $tempData Array metadata untuk generate harga
     * @return array
     */
    private function generateHargaData(array $tempData): array
    {
        $hargaProducts = [];
        $now = Carbon::now();

        // Ambil semua products dengan ID real (urut berdasarkan ID asc)
        $realProducts = Product::orderBy('id', 'asc')->get()->values();

        foreach ($tempData as $index => $temp) {
            $realProduct = $realProducts[$index] ?? null;
            if (!$realProduct) continue;

            $jenisNama = $temp['jenis_nama'];
            $bahanNama = $temp['bahan_nama'];

            // Base harga dari range jenis
            $range = self::HARGA_RANGE[$jenisNama] ?? [50000, 300000];
            $baseHarga = random_int(
                (int) ($range[0] / 5000),
                (int) ($range[1] / 5000)
            ) * 5000;

            // Apply multiplier bahan
            $multiplier = self::BAHAN_MULTIPLIER[$bahanNama] ?? 1.0;
            $finalHarga = (int) round(($baseHarga * $multiplier) / 5000) * 5000;
            $finalHarga = max(10000, $finalHarga);

            $tanggalBerlaku = $now->copy()
                ->subMonths(random_int(0, 6))
                ->format('Y-m-d');

            $hargaProducts[] = [
                'product_id'      => $realProduct->id,
                'customer_id'     => null,
                'harga'           => $finalHarga,
                'tanggal_berlaku' => $tanggalBerlaku,
                'keterangan'      => 'Harga Umum',
                'created_at'      => $now,
                'updated_at'      => $now,
            ];
        }

        return $hargaProducts;
    }
}