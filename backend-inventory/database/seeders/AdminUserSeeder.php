<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'adminwebsitejrs@gmail.com',
            ],
            [
                'name'     => 'admin website',
                'role'     => 'admin',
                'password' => Hash::make('adminwebsitejrs1234!_@'),
            ]
        );
    }
}
