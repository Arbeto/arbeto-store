<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {

        User::create([
            'phone' => '055',
            'email' => 'admin@arbeto.net',
            'password' => Hash::make('10203040'),
        ]);
    }
}
