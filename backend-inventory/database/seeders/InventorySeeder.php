<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\Place;
use App\Models\Product;
use App\Models\ProductMovement;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventorySeeder extends Seeder
{
    private const CHUNK_SIZE = 1000;

    private const PLACE_CONFIG = [
        'BENGKEL' => [
            'probability' => 0.85,
            'qty_min'     => 2,
            'qty_max'     => 30,
        ],
        'TOKO' => [
            'probability' => 1.0,
            'qty_min'     => 1,
            'qty_max'     => 20,
        ],
    ];

    public function run(): void
    {
        $startTime = microtime(true);
        $this->command?->info('');
        $this->command?->info('📦 Starting Inventory Seeder...');
        $this->command?->newLine();

        // ============================================
        // Verifikasi
        // ============================================
        /** @var Collection<string, Place> $places */
        $places = Place::all()->keyBy('kode');
        
        /** @var Collection<int, Product> $products */
        $products = Product::all();

        if ($places->isEmpty()) {
            $this->command?->error('❌ Place data tidak ditemukan!');
            $this->command?->info('💡 Jalankan: php artisan db:seed --class=PlaceSeeder');
            return;
        }

        if ($products->isEmpty()) {
            $this->command?->error('❌ Product data tidak ditemukan!');
            $this->command?->info('💡 Jalankan: php artisan db:seed --class=ProductSeeder');
            return;
        }

        $this->command?->info('📊 Found:');
        $this->command?->info('   • ' . $products->count() . ' products');
        $this->command?->info('   • ' . $places->count() . ' places (' . $places->keys()->join(', ') . ')');
        $this->command?->newLine();

        // ============================================
        // Konfirmasi truncate
        // ============================================
        $existingCount = Inventory::count();
        if ($existingCount > 0) {
            $confirm = $this->command?->confirm(
                "⚠️  Ditemukan {$existingCount} inventory existing. Truncate?",
                false
            );

            if ($confirm) {
                $this->command?->warn('🗑️  Truncating inventory + product_movements...');
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                ProductMovement::truncate();
                Inventory::truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                $this->command?->info('✅ Tables truncated.');
            }
        }

        // ============================================
        // Generate inventory data
        // ============================================
        $this->command?->info('⚙️  Generating inventory data...');
        $inventoryData = $this->generateInventoryData($products, $places);

        // ============================================
        // Insert inventory
        // ============================================
        $this->command?->newLine();
        $this->command?->info('💾 Inserting inventory records...');

        $bar = $this->command?->getOutput()->createProgressBar(count($inventoryData));
        $bar?->setFormat(' %current%/%max% [%bar%] %percent:3s%% | %message%');
        $bar?->setMessage('Starting...');
        $bar?->start();

        $inserted = 0;
        $chunks = array_chunk($inventoryData, self::CHUNK_SIZE);

        foreach ($chunks as $index => $chunk) {
            $bar?->setMessage("Chunk " . ($index + 1) . "/" . count($chunks));
            Inventory::insert($chunk);
            $inserted += count($chunk);
            $bar?->advance(count($chunk));
        }

        $bar?->setMessage('Done!');
        $bar?->finish();
        $this->command?->newLine(2);

        // ============================================
        // Generate initial movements (audit trail)
        // ============================================
        $this->command?->info('📝 Generating initial stock movements...');
        $movementCount = $this->generateInitialMovements();

        $elapsed = round(microtime(true) - $startTime, 2);

        // ============================================
        // Summary
        // ============================================
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->info('✅ Inventory Seeding Completed!');
        $this->command?->info('═══════════════════════════════════════');

        $stats = [];
        foreach ($places as $kode => $place) {
            $count = Inventory::where('place_id', $place->id)->count();
            $totalQty = Inventory::where('place_id', $place->id)->sum('qty');
            $lowStock = Inventory::where('place_id', $place->id)->where('qty', '<=', 5)->count();
            $stats[] = [$place->nama, $count, $totalQty, $lowStock];
        }

        $this->command?->table(
            ['Place', 'Products', 'Total Qty', 'Low Stock (≤5)'],
            $stats
        );

        $this->command?->newLine();
        $this->command?->table(
            ['Metric', 'Value'],
            [
                ['Total Inventories', "<fg=green>{$inserted}</>"],
                ['Initial Movements', '<fg=blue>' . $movementCount . '</>'],
                ['Elapsed Time', "{$elapsed}s"],
                ['Speed', round($inserted / max($elapsed, 0.01), 0) . ' records/sec'],
            ]
        );
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->newLine();
    }

    /**
     * Generate inventory data
     * 
     * @param Collection<int, Product> $products
     * @param Collection<string, Place> $places
     * @return array
     */
    private function generateInventoryData(Collection $products, Collection $places): array
    {
        $inventories = [];
        $now = Carbon::now();

        foreach ($products as $product) {
            foreach (self::PLACE_CONFIG as $kode => $config) {
                $place = $places[$kode] ?? null;
                if (!$place) continue;

                if ((random_int(1, 100) / 100) > $config['probability']) {
                    continue;
                }

                $qty = random_int($config['qty_min'], $config['qty_max']);

                $inventories[] = [
                    'product_id' => $product->id,
                    'place_id'   => $place->id,
                    'qty'        => $qty,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        return $inventories;
    }

    private function generateInitialMovements(): int
    {
        $inventories = Inventory::all();
        $now = Carbon::now();
        $count = 0;

        $bar = $this->command?->getOutput()->createProgressBar($inventories->count());
        $bar?->setMessage('Generating movements...');
        $bar?->start();

        $movements = [];
        foreach ($inventories as $inventory) {
            $movements[] = [
                'inventory_id' => $inventory->id,
                'tipe'         => 'in',
                'qty'          => $inventory->qty,
                'keterangan'   => 'Stok awal dari seeder',
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
            $count++;
        }

        foreach (array_chunk($movements, self::CHUNK_SIZE) as $chunk) {
            ProductMovement::insert($chunk);
            $bar?->advance(count($chunk));
        }

        $bar?->finish();
        $this->command?->newLine();

        return $count;
    }
}