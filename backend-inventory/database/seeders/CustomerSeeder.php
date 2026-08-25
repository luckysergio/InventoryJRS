<?php

namespace Database\Seeders;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerSeeder extends Seeder
{
    /**
     * Konfigurasi seeder
     */
    private const TOTAL_CUSTOMERS = 1000;
    private const CHUNK_SIZE = 500; // Insert per batch untuk performa

    /**
     * Data pool untuk generate nama realistis Indonesia
     */
    private const FIRST_NAMES = [
        // Pria
        'Ahmad', 'Budi', 'Cahyo', 'Dedi', 'Eko', 'Fajar', 'Galih', 'Hadi', 'Irwan', 'Joko',
        'Kurniawan', 'Lukman', 'Muhammad', 'Nugroho', 'Okta', 'Putra', 'Rahmat', 'Sari', 'Taufik', 'Umar',
        'Vino', 'Wahyu', 'Yusuf', 'Zainal', 'Agus', 'Bayu', 'Candra', 'Dimas', 'Erik', 'Firman',
        'Gunawan', 'Hendri', 'Irfan', 'Joni', 'Kurniadi', 'Lutfi', 'Mahendra', 'Naufal', 'Oscar', 'Panji',
        'Rizki', 'Slamet', 'Teguh', 'Udin', 'Vicky', 'Wawan', 'Yudha', 'Zaki', 'Asep', 'Bagas',
        // Wanita
        'Ani', 'Bunga', 'Citra', 'Dewi', 'Endang', 'Fitri', 'Gita', 'Hesti', 'Indah', 'Juwita',
        'Kartika', 'Lestari', 'Maya', 'Nur', 'Olivia', 'Putri', 'Rina', 'Siti', 'Tuti', 'Umi',
        'Vina', 'Wulan', 'Yanti', 'Zahra', 'Ayu', 'Bella', 'Cindy', 'Diana', 'Evi', 'Fani',
        'Gusti', 'Hani', 'Intan', 'Jesi', 'Kiki', 'Lina', 'Mega', 'Nita', 'Ocha', 'Pipit',
        'Ratna', 'Sri', 'Tari', 'Ulfah', 'Vera', 'Wati', 'Yuni', 'Zulfa', 'Ambar', 'Bulan',
    ];

    private const LAST_NAMES = [
        'Pratama', 'Wijaya', 'Santoso', 'Hidayat', 'Saputra', 'Wibowo', 'Kurniawan', 'Susanto', 'Setiawan', 'Permana',
        'Nugroho', 'Handoko', 'Gunawan', 'Suryadi', 'Hermawan', 'Mahendra', 'Prasetyo', 'Utomo', 'Firmansyah', 'Ramadhan',
        'Anggraini', 'Lestari', 'Sari', 'Wulandari', 'Kusuma', 'Ningsih', 'Puspita', 'Rahayu', 'Safitri', 'Utami',
        'Wijayanti', 'Yulianti', 'Zahra', 'Amalia', 'Bestari', 'Chairunnisa', 'Damayanti', 'Elvina', 'Fitriani', 'Gracia',
        'Hapsari', 'Ismawati', 'Januarti', 'Kirana', 'Laila', 'Maharani', 'Nurhaliza', 'Oktaviani', 'Paramita', 'Qonita',
    ];

    private const DOMAINS = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
        'protonmail.com', 'mail.com', 'yandex.com', 'fastmail.com', 'tutanota.com',
    ];

    private const PHONE_PREFIXES = [
        '0811', '0812', '0813', // Telkomsel
        '0814', '0815', '0816', // Indosat
        '0817', '0818', '0819', // XL
        '0821', '0822', '0823', // Telkomsel
        '0838',                  // XL
        '0852', '0853', '0855', // Indosat
        '0856', '0857', '0858', // Indosat
        '0877', '0878',         // XL
        '0881', '0882', '0883', // Smartfren
        '0895', '0896', '0897', '0898', '0899', // Three
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $startTime = microtime(true);
        $this->command?->info('');
        $this->command?->info('🚀 Starting Customer Seeder...');
        $this->command?->info('📊 Target: ' . self::TOTAL_CUSTOMERS . ' customers');
        $this->command?->info('');

        // Konfirmasi truncate jika ada data
        $existingCount = Customer::count();
        if ($existingCount > 0) {
            $confirm = $this->command?->confirm(
                "⚠️  Ditemukan {$existingCount} customer existing. Truncate dulu?",
                false
            );

            if ($confirm) {
                $this->command?->warn('🗑️  Truncating customers table...');
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                Customer::truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                $this->command?->info('✅ Table truncated.');
            } else {
                $this->command?->info('ℹ️  Menambahkan ke data existing...');
            }
        }

        // Generate semua data terlebih dahulu (untuk ensure uniqueness)
        $customers = $this->generateCustomerData(self::TOTAL_CUSTOMERS);

        // Insert dengan chunking untuk performa
        $this->command?->newLine();
        $this->command?->info('💾 Inserting data...');

        $bar = $this->command?->getOutput()->createProgressBar(self::TOTAL_CUSTOMERS);
        $bar?->setFormat(' %current%/%max% [%bar%] %percent:3s%% | ETA: %estimated% | %message%');
        $bar?->setMessage('Starting...');
        $bar?->start();

        $chunks = array_chunk($customers, self::CHUNK_SIZE);
        $inserted = 0;

        foreach ($chunks as $index => $chunk) {
            $chunkNumber = $index + 1;
            $totalChunks = count($chunks);
            $bar?->setMessage("Chunk {$chunkNumber}/{$totalChunks}");

            Customer::insert($chunk);

            $inserted += count($chunk);
            $bar?->advance(count($chunk));
        }

        $bar?->setMessage('Done!');
        $bar?->finish();
        $this->command?->newLine(2);

        $elapsed = round(microtime(true) - $startTime, 2);

        // Summary
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->info('✅ Seeding Completed!');
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->table(
            ['Metric', 'Value'],
            [
                ['Total Inserted', "<fg=green>{$inserted} customers</>"],
                ['Total in DB', '<fg=blue>' . Customer::count() . ' customers</>'],
                ['Chunk Size', self::CHUNK_SIZE . ' per batch'],
                ['Total Chunks', count($chunks)],
                ['Elapsed Time', "{$elapsed} seconds"],
                ['Speed', round($inserted / $elapsed, 0) . ' records/sec'],
            ]
        );
        $this->command?->info('═══════════════════════════════════════');
        $this->command?->newLine();
    }

    /**
     * Generate data customer unik.
     */
    private function generateCustomerData(int $count): array
    {
        $customers = [];
        $usedEmails = [];
        $usedPhones = [];

        // Ambil data existing untuk hindari duplikasi
        $existingEmails = Customer::pluck('email')->filter()->toArray();
        $existingPhones = Customer::pluck('phone')->filter()->toArray();
        $usedEmails = array_flip($existingEmails);
        $usedPhones = array_flip($existingPhones);

        $now = Carbon::now();

        for ($i = 0; $i < $count; $i++) {
            $maxAttempts = 10;
            $attempt = 0;

            do {
                $attempt++;
                $firstName = self::FIRST_NAMES[array_rand(self::FIRST_NAMES)];
                $lastName = self::LAST_NAMES[array_rand(self::LAST_NAMES)];
                $name = "{$firstName} {$lastName}";

                // Generate email
                $emailBase = Str::slug($firstName . '.' . $lastName, '.');
                $suffix = $attempt > 1 ? $attempt . Str::random(2) : random_int(1, 999);
                $email = strtolower($emailBase . $suffix . '@' . self::DOMAINS[array_rand(self::DOMAINS)]);

                // Generate phone (format: 08xx-xxxx-xxxx)
                $prefix = self::PHONE_PREFIXES[array_rand(self::PHONE_PREFIXES)];
                $middle = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
                $last = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
                $phone = "{$prefix}-{$middle}-{$last}";

                // Check uniqueness
                $isUnique = !isset($usedEmails[$email]) && !isset($usedPhones[$phone]);
            } while (!$isUnique && $attempt < $maxAttempts);

            // Fallback jika masih duplikat setelah max attempts
            if (!$isUnique) {
                $email = strtolower(Str::slug($name) . '.' . Str::random(6) . '@' . self::DOMAINS[0]);
                $phone = $prefix . '-' . Str::random(4) . '-' . Str::random(4);
            }

            // Tandai sebagai used
            $usedEmails[$email] = true;
            $usedPhones[$phone] = true;

            // Random created_at dalam 2 tahun terakhir (biar natural)
            $daysAgo = random_int(0, 730);
            $createdAt = $now->copy()->subDays($daysAgo)->subHours(random_int(0, 23));

            $customers[] = [
                'name'       => $name,
                'phone'      => $phone,
                'email'      => $email,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        return $customers;
    }
}