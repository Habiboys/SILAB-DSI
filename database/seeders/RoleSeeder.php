<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $admin = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $asisten = Role::create(['name' => 'asisten', 'guard_name' => 'web']);
        $kadep = Role::create(['name' => 'kadep', 'guard_name' => 'web']);
        $praktikan = Role::create(['name' => 'praktikan', 'guard_name' => 'web']);
        
        // Create permissions
        // ... existing code ...
    }
}