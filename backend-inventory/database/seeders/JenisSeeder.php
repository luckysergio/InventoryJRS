<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JenisSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('jenis_products')->insert([
            ['nama' => 'MOUNTING'],
            ['nama' => 'KOPLING'],
            ['nama' => 'BANTALAN'],
        ]);
    }
}
