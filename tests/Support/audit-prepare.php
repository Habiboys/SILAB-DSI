<?php

require __DIR__.'/AuditEnvironment.php';
use Illuminate\Support\Facades\Artisan;
use App\Models\{Laboratorium, TahunKepengurusan, KepengurusanLab, KepengurusanUser, Struktur, User, Praktikan, MataKuliah, KategoriAset, DetailAset, PeriodePiket};

Artisan::call('migrate', ['--force' => true]);
echo Artisan::output();
foreach (['RolesAndPermissionsSeeder', 'CompletePermissionFixSeeder', 'RolePermissionSeeder', 'MissingPermissionsSeeder',
    'PraktikumFeaturePermissionSeeder', 'MataKuliahPermissionSeeder', 'ManualAbsensiPermissionSeeder',
    'InventarisWorkflowPermissionSeeder', 'InventarisPeminjamanPermissionSeeder', 'SuratMenyuratPermissionSeeder',
    'SuratResmiPermissionSeeder', 'SurveyPermissionSeeder', 'ProkerPermissionSeeder', 'KegiatanPermissionSeeder',
    'UserManagementPermissionSeeder', 'FixPiketViewPermissionSeeder'] as $seeder) {
    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\'.$seeder, '--force' => true]);
    echo $seeder." complete\n";
}
$lab = Laboratorium::firstOrCreate(['nama' => 'Laboratorium Audit A'], ['is_active' => true]);
$otherLab = Laboratorium::firstOrCreate(['nama' => 'Laboratorium Audit B'], ['is_active' => true]);
$year = TahunKepengurusan::firstOrCreate(['tahun' => '2026/2027'], ['isactive' => true, 'mulai' => '2026-01-01', 'selesai' => '2027-12-31']);
$period = KepengurusanLab::firstOrCreate(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id], ['is_active' => true]);
KepengurusanLab::firstOrCreate(['laboratorium_id' => $otherLab->id, 'tahun_kepengurusan_id' => $year->id], ['is_active' => true]);
$struktur = Struktur::firstOrCreate(['struktur' => 'Ketua'], ['jabatan_tunggal' => false]);
$kalabStruktur = Struktur::firstOrCreate(['struktur' => 'Kalab'], ['jabatan_tunggal' => true]);
$asistenStruktur = Struktur::updateOrCreate(['struktur' => 'Asisten Audit'], ['jabatan_tunggal' => false, 'default_role_id' => App\Models\Permission\Role::findByName('asisten', 'web')->id]);
foreach (['admin', 'asisten', 'praktikan', 'kalab', 'kadep', 'superadmin', 'dosen'] as $role) {
    $user = User::firstOrCreate(['email' => $role.'@audit.test'], [
        'name' => 'Audit '.ucfirst($role), 'password' => 'Audit-test-2026!',
        'access_lab_id' => in_array($role, ['superadmin', 'kadep', 'praktikan']) ? null : $lab->id,
        'must_change_password' => false,
    ]);
    $user->forceFill(['email_verified_at' => now()])->save();
    $user->assignRole($role);
    $user->profile()->firstOrCreate([], ['nomor_induk' => 'AUDIT-'.$role, 'jenis_kelamin' => 'laki-laki', 'no_hp' => '081234567890']);
    if (in_array($role, ['admin', 'asisten', 'kalab'])) {
        KepengurusanUser::updateOrCreate(['user_id' => $user->id, 'kepengurusan_lab_id' => $period->id], [
            'struktur_id' => $role === 'kalab' ? $kalabStruktur->id : ($role === 'asisten' ? $asistenStruktur->id : $struktur->id), 'is_active' => true, 'tanggal_bergabung' => '2026-01-01',
        ]);
    }
    if ($role === 'praktikan') Praktikan::firstOrCreate(['user_id' => $user->id], ['nim' => '12345678', 'nama' => $user->name, 'no_hp' => '081234567890']);
}
MataKuliah::firstOrCreate(['kode_mata_kuliah' => 'AUDIT-001'], ['nama' => 'Praktikum Audit', 'sks' => 1, 'semester' => 1, 'status' => 'aktif']);
$category = KategoriAset::firstOrCreate(['nama' => 'Komputer Audit'], ['deskripsi' => 'Aset untuk pengujian terisolasi']);
foreach (['A', 'B', 'C'] as $suffix) DetailAset::firstOrCreate(['kode_barang' => 'AUDIT-'.$suffix], [
    'nama' => 'Komputer Audit '.$suffix, 'laboratorium_id' => $lab->id, 'kategori_aset_id' => $category->id,
    'keadaan' => 'baik', 'status' => 'tersedia', 'foto' => 'audit-placeholder.png',
]);
PeriodePiket::firstOrCreate(['kepengurusan_lab_id' => $period->id, 'nama' => 'Periode Audit'], [
    'tanggal_mulai' => '2026-01-01', 'tanggal_selesai' => '2027-12-31', 'isactive' => true, 'lama_piket' => 1,
    'geolocation_enabled' => false, 'face_recognition_enabled' => false,
]);
echo "Isolated audit data prepared.\n";
file_put_contents(dirname(__DIR__, 2).'/.audit/fixture.json', json_encode(['lab_id' => $lab->id, 'period_id' => $period->id], JSON_PRETTY_PRINT));
