<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder{
    /**
     * Run the database seeds.
     */
        public function run(): void
    {
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@asm.com',
            'password' => bcrypt('password'),
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        $user->roles()->attach($adminRole->id);

}
}
