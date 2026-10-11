<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Struktur;
use App\Models\Permission\Permission;

class StrukturPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mappings = [
            'Kalab' => [
                'kepengurusan.manage',
                'anggota.manage',
                'piket.manage_schedules',
                'piket.manage_periods',
                'struktur.manage',
                'keuangan.view',
                'inventaris.view',
                'absensi.view_rekap',
                'absensi.view_riwayat',
            ],
            'Kepala Laboratorium' => [ // Alias for Kalab
                'kepengurusan.manage',
                'anggota.manage',
                'piket.manage_schedules',
                'piket.manage_periods',
                'struktur.manage',
                'keuangan.view',
                'inventaris.view',
                'absensi.view_rekap',
                'absensi.view_riwayat',
            ],
            'Bendahara' => [
                'keuangan.create-transaksi',
                'keuangan.update-transaksi',
                'keuangan.delete-transaksi',
                'keuangan.view',
            ],
            'Wakil Bendahara' => [
                'keuangan.create-transaksi',
                'keuangan.update-transaksi',
                'keuangan.view',
            ],
            'Sekretaris' => [
            ],
            'Koordinator Inventaris' => [
                'inventaris.create',
                'inventaris.update',
                'inventaris.delete',
                'inventaris.manage_categories',
            ],
            'Koordinator Piket' => [
                'piket.manage_schedules',
                'piket.manage_periods',
                'absensi.view_rekap',
                'absensi.view_riwayat',
            ],
        ];

        foreach ($mappings as $jabatan => $permissions) {
            $struktur = Struktur::where('struktur', $jabatan)->first();
            if (!$struktur) continue;
            foreach ($permissions as $permission) {
                $permissionModel = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
                DB::table('struktur_permissions')->insertOrIgnore([
                    'struktur_id' => $struktur->id,
                    'permission_id' => $permissionModel->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
