<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Menambahkan dua permission baru untuk fitur Surat Resmi:
 *
 *  surat.create_resmi  → Membuat & mengelola surat atas nama laboratorium
 *  surat.view_all      → Melihat seluruh arsip surat resmi milik lab
 *
 * Assignment role:
 *  - admin, superadmin     → mendapat keduanya
 *  - asisten ber-jabatan Sekretaris → ditambahkan via struktur_permissions (jabatan-based)
 */
class SuratResmiPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('SuratResmiPermissionSeeder skipped: legacy surat permissions removed.');
    }
}
