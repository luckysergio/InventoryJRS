<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Place;

class PlaceSeeder extends Seeder
{
    public function run(): void
    {
        $places = [
            [
                'nama' => 'Bengkel',
                'kode' => 'BENGKEL',
                'keterangan' => 'Tempat produksi / pembuatan barang',
            ],
            [
                'nama' => 'Toko',
                'kode' => 'TOKO',
                'keterangan' => 'Tempat penyimpanan dan penjualan barang',
            ],
        ];

        foreach ($places as $place) {
            Place::updateOrCreate(
                ['kode' => $place['kode']],
                $place
            );
        }
    }
}
