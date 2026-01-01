<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatusTransaksi extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            ['nama' => 'Proses'],
            ['nama' => 'Di pesan'],
            ['nama' => 'Di buat'],
            ['nama' => 'Siap'],
            ['nama' => 'Selesai'],
        ];

        DB::table('status_transaksis')->insert($statuses);
    }
}
