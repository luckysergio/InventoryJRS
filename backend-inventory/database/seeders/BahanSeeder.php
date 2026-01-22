<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BahanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('bahan_products')->insert([
            ['nama' => 'ALAM'],
            ['nama' => 'NR'],
            ['nama' => 'NBR'],
            ['nama' => 'FKM (VITON)'],
            ['nama' => 'SILIKON'],
            ['nama' => 'POLYURETHANE'],
            ['nama' => 'PTFE (TEFLON)'],
            ['nama' => 'HDPE (NYLON)'],
        ]);
    }
}
