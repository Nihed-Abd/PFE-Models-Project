<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        $roles = ['admin', 'client'];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role], ['name' => $role]);
        }
        $users = User::factory(10)->create();
        foreach ($users as $user) {
            if ($user->id === 1 || $user->id === 3) {
                $user->roles()->attach(Role::where('name', 'admin')->first());
            } else {
                $user->roles()->attach(Role::where('name', 'client')->first());
            }
        }
    }
}
