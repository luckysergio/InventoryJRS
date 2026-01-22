<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeSeeder extends Seeder
{
    public function run(): void
    {
        $mounting = DB::table('jenis_products')->where('nama', 'MOUNTING')->value('id');
        $kopling  = DB::table('jenis_products')->where('nama', 'KOPLING')->value('id');
        $bantalan = DB::table('jenis_products')->where('nama', 'BANTALAN')->value('id');

        DB::table('type_products')->insert([
            ['jenis_id' => $mounting, 'nama' => 'ATAS BAUT BAWAH MUR'],
            ['jenis_id' => $mounting, 'nama' => 'ATAS BAWAH BAUT'],
            ['jenis_id' => $mounting, 'nama' => 'ATAS BAUT BAWAH RATA'],
            ['jenis_id' => $mounting, 'nama' => 'ATAS MUR BAWAH RATA'],
            ['jenis_id' => $mounting, 'nama' => 'ATAS BAWAH MUR'],

            ['jenis_id' => $kopling, 'nama' => 'BINTANG T 150'],
            ['jenis_id' => $kopling, 'nama' => 'BINTANG T 105'],
            ['jenis_id' => $kopling, 'nama' => 'BINTANG T 90'],
            ['jenis_id' => $kopling, 'nama' => 'BINTANG T 170'],
            ['jenis_id' => $kopling, 'nama' => 'FCL 100-112 (#2)'],
            ['jenis_id' => $kopling, 'nama' => 'FCL 125-180 (#3)'],
            ['jenis_id' => $kopling, 'nama' => 'FCL 200-224 (#4)'],
            ['jenis_id' => $kopling, 'nama' => 'FCL 250 (#5)'],
            ['jenis_id' => $kopling, 'nama' => 'FCL 280-315 (#6)'],

            ['jenis_id' => $bantalan, 'nama' => 'KOPEL'],
            ['jenis_id' => $bantalan, 'nama' => 'KOPEL BUTA'],
            ['jenis_id' => $bantalan, 'nama' => 'KABIN'],
        ]);
    }
}
