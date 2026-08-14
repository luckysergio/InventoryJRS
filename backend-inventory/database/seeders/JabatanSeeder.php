<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Jabatan;

class JabatanSeeder extends Seeder
{
    public function run(): void
    {
        $daftarJabatan = [
            'DIREKTUR UTAMA',
            'MANAJER OPERASIONAL',
            'SUPERVISOR PRODUKSI',
            'STAFF ADMINISTRASI',
            'KEPALA GUDANG',
            'TEKNISI MESIN',
            'QUALITY CONTROL',
            'STAFF HRD',
            'SALES EXECUTIVE',
            'DRIVER OPERASIONAL'
        ];

        foreach ($daftarJabatan as $namaJabatan) {
            Jabatan::updateOrCreate(
                ['nama' => $namaJabatan],
                ['nama' => $namaJabatan]
            );
        }
    }
}