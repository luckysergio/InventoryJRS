<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatusTransaksi extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['nama' => 'Proses'],
            ['nama' => 'Di Pesan'],
            ['nama' => 'Di Buat'],
            ['nama' => 'Siap'],
            ['nama' => 'Selesai'],
            ['nama' => 'Dibatalkan'],
        ];

        DB::table('status_transaksis')->insert($statuses);
    }
}
