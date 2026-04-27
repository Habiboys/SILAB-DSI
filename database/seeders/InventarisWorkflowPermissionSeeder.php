<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

class InventarisWorkflowPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $newPermissions = [
            'inventaris.review-permohonan', // Kalab: review & approve/reject di level Kalab
            'inventaris.approve-final',     // Kadep: ACC final permohonan
            'inventaris.convert-to-aset',   // Admin/Kalab: konversi item wishlist ke aset
        ];

        foreach ($newPermissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Superadmin dapat semua
        $superadmin = Role::findByName('superadmin');
        $superadmin->givePermissionTo($newPermissions);

        // Admin dapat review dan convert
        $admin = Role::findByName('admin');
        $admin->givePermissionTo([
            'inventaris.review-permohonan',
            'inventaris.convert-to-aset',
        ]);

        // Kadep dapat approve-final
        $kadep = Role::findByName('kadep');
        $kadep->givePermissionTo('inventaris.approve-final');

        // Kalab dapat review (via position permission, tapi tetap assign sebagai fallback)
        $kalab = Role::findByName('kalab');
        $kalab->givePermissionTo([
            'inventaris.review-permohonan',
            'inventaris.convert-to-aset',
        ]);

        $this->command->info('Inventaris workflow permissions seeded.');
    }
}
