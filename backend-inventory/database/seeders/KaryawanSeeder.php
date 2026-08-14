<?php

namespace Database\Seeders;

use App\Models\Jabatan;
use App\Models\Karyawan;
use Illuminate\Database\Seeder;

class KaryawanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil semua ID jabatan yang tersedia
        $jabatanIds = Jabatan::pluck('id')->toArray();

        // Pastikan data jabatan sudah tersedia
        if (empty($jabatanIds)) {
            $this->command->error(
                'Seeder Karyawan gagal: belum ada data jabatan.'
            );

            return;
        }

        // Buat 100 data karyawan
        for ($i = 1; $i <= 100; $i++) {
            // Ambil jabatan secara bergantian
            $jabatanId = $jabatanIds[($i - 1) % count($jabatanIds)];

            Karyawan::create([
                'nama'       => 'Karyawan ' . $i,
                'no_hp'      => '081234567' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'email'      => 'karyawan' . $i . '@example.com',
                'jabatan_id' => $jabatanId,
            ]);
        }

    }
}