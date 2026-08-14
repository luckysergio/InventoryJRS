<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tentukan role untuk 100 user
        $roles = array_merge(
            array_fill(0, 5, 'admin'),
            array_fill(0, 15, 'admin_toko'),
            array_fill(0, 80, 'operator')
        );

        // Acak urutan role
        shuffle($roles);

        // Buat 100 user
        for ($i = 1; $i <= 100; $i++) {
            User::create([
                'name'     => 'User ' . $i,
                'email'    => 'user' . $i . '@example.com',
                'password' => Hash::make('password123'),
                'role'     => $roles[$i - 1],
            ]);
        }

    }
}