<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TahunKepengurusanController;
use App\Http\Controllers\KepengurusanLabController;
use App\Http\Controllers\StrukturController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\RiwayatKeuanganController;
use App\Http\Controllers\RekapKeuanganController;
use App\Http\Controllers\CatatanKasController;
use App\Http\Controllers\PraktikumController;
use App\Http\Controllers\ModulPraktikumController;
use App\Http\Controllers\SuratController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\JadwalPiketController;
use App\Http\Controllers\PeriodePiketController;
use App\Http\Controllers\InventarisController;
use App\Http\Controllers\DetailInventarisController;
use App\Http\Controllers\DashboardController;

use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

// use Spatie\Permission\Middlewares\PermissionMiddleware;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProkerController;
use Spatie\Permission\Middlewares\RoleMiddleware;

// Public routes (no auth required)
Route::get('modul/{hash}', [ModulPraktikumController::class, 'viewPublic'])
    ->name('modul.public.view');

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->hasRole('praktikan')) {
            return redirect()->route('praktikan.daftar-tugas');
        } else {
            return redirect()->route('dashboard');
        }
    }
    return redirect()->route('login');
})->name('home');

Route::middleware([
    'auth:sanctum',
    // config('jetstream.auth_middleware', 'verified'), // Commented out to disable email verification
])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    //modul kepengurusan
    Route::resource('anggota', AnggotaController::class);
    Route::post('/anggota/transfer-from-previous', [AnggotaController::class, 'transferFromPrevious'])->name('anggota.transfer-from-previous');
    Route::get('/anggota/active-members-from-previous', [AnggotaController::class, 'getActiveMembersFromPrevious'])->name('anggota.active-members-from-previous');
    Route::resource('tahun-kepengurusan', TahunKepengurusanController::class);
    Route::resource('kepengurusan-lab', KepengurusanLabController::class);

    // Proker - view bisa akses semua, manipulation hanya kepengurusan aktif
    Route::get('/proker', [ProkerController::class, 'index'])->name('proker.index');
    Route::get('/proker/{proker}', [ProkerController::class, 'show'])->name('proker.show');
    
    // Manipulation proker - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:proker'])->group(function () {
        Route::post('/proker', [ProkerController::class, 'store'])->name('proker.store');
        Route::put('/proker/{proker}', [ProkerController::class, 'update'])->name('proker.update');
        Route::delete('/proker/{proker}', [ProkerController::class, 'destroy'])->name('proker.destroy');
    });
    //modul keuangan - view bisa akses semua, manipulation hanya kepengurusan aktif
    Route::get('/riwayat-keuangan', [RiwayatKeuanganController::class, 'index'])->name('riwayat-keuangan.index');
    Route::get('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'show'])->name('riwayat-keuangan.show');
    Route::get('/riwayat-keuangan/export', [RiwayatKeuanganController::class, 'export'])->name('riwayat-keuangan.export');
    Route::get('/riwayat-keuangan/check-data', [RiwayatKeuanganController::class, 'checkData'])->name('riwayat-keuangan.check-data');
    Route::get('/catatan-kas', [RiwayatKeuanganController::class, 'catatanKas'])->name('catatan-kas');
    Route::get('/rekap-keuangan', [RekapKeuanganController::class, 'index'])->name('rekap-keuangan.index');
    
    // Manipulation keuangan - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:keuangan'])->group(function () {
        Route::post('/riwayat-keuangan', [RiwayatKeuanganController::class, 'store'])->name('riwayat-keuangan.store');
        Route::put('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'update'])->name('riwayat-keuangan.update');
        Route::delete('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'destroy'])->name('riwayat-keuangan.destroy');
    });
    
    //modul praktikum - view bisa akses semua, manipulation hanya kepengurusan aktif
    Route::get('/praktikum', [PraktikumController::class, 'index'])->name('praktikum.index');
    Route::get('/praktikum/{praktikum}', [PraktikumController::class, 'show'])->name('praktikum.show');
    Route::get('praktikum/{praktikum}/modul', [ModulPraktikumController::class, 'index'])->name('praktikum.modul.index');
    Route::get('praktikum/{praktikum}/modul/{modul}/view/{filename?}', [ModulPraktikumController::class, 'view'])
        ->name('praktikum.modul.view')
        ->where('filename', '.*');

    Route::post('praktikum/{praktikum}/modul/{modul}/toggle-share', [ModulPraktikumController::class, 'toggleShareLink'])
        ->name('praktikum.modul.toggle-share');
    
    // Manipulation praktikum - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:praktikum'])->group(function () {
        Route::post('/praktikum', [PraktikumController::class, 'store'])->name('praktikum.store');
        Route::put('/praktikum/{praktikum}', [PraktikumController::class, 'update'])->name('praktikum.update');
        Route::delete('/praktikum/{praktikum}', [PraktikumController::class, 'destroy'])->name('praktikum.destroy');
        //Pertemuan dan file modul praktikum
        Route::resource('praktikum.modul', ModulPraktikumController::class)->only(['store', 'update', 'destroy']);
        
        // Praktikan Management
        Route::get('praktikum/{praktikum}/praktikan', [App\Http\Controllers\PraktikanController::class, 'index'])->name('praktikum.praktikan.index');
        Route::post('praktikum/{praktikum}/praktikan', [App\Http\Controllers\PraktikanController::class, 'store'])->name('praktikum.praktikan.store');
        Route::post('praktikum/{praktikum}/praktikan/add-existing', [App\Http\Controllers\PraktikanController::class, 'addExistingUser'])->name('praktikum.praktikan.add-existing');
        Route::post('praktikum/{praktikum}/praktikan/import', [App\Http\Controllers\PraktikanController::class, 'import'])->name('praktikum.praktikan.import');
        Route::put('praktikum/{praktikum}/praktikan/{praktikan}/assign-kelas', [App\Http\Controllers\PraktikanController::class, 'assignToKelas'])->name('praktikum.praktikan.assign-kelas');
        Route::put('praktikum/{praktikum}/praktikan/{praktikan}/remove-kelas', [App\Http\Controllers\PraktikanController::class, 'removeFromKelas'])->name('praktikum.praktikan.remove-kelas');
        Route::put('praktikum/praktikan/{praktikan}/status', [App\Http\Controllers\PraktikanController::class, 'updateStatus'])->name('praktikum.praktikan.update-status');
        Route::delete('praktikum/praktikan/{praktikan}', [App\Http\Controllers\PraktikanController::class, 'destroy'])->name('praktikum.praktikan.destroy');
        
        // Tugas Praktikum Management
        Route::get('praktikum/{praktikum}/tugas', [App\Http\Controllers\TugasPraktikumController::class, 'index'])->name('praktikum.tugas.index');
        Route::post('praktikum/{praktikum}/tugas', [App\Http\Controllers\TugasPraktikumController::class, 'store'])->name('praktikum.tugas.store');
        Route::put('praktikum/tugas/{tugas}', [App\Http\Controllers\TugasPraktikumController::class, 'update'])->name('praktikum.tugas.update');
        Route::delete('praktikum/tugas/{tugas}', [App\Http\Controllers\TugasPraktikumController::class, 'destroy'])->name('praktikum.tugas.destroy');
        Route::get('praktikum/tugas/{tugas}/download', [App\Http\Controllers\TugasPraktikumController::class, 'downloadFile'])->name('praktikum.tugas.download');
        
        // Pengumpulan Tugas Management (untuk admin)
        Route::get('praktikum/tugas/{tugas}/pengumpulan', [App\Http\Controllers\PengumpulanTugasController::class, 'index'])->name('praktikum.tugas.pengumpulan.index');
        Route::put('praktikum/pengumpulan/{pengumpulan}', [App\Http\Controllers\PengumpulanTugasController::class, 'update'])->name('praktikum.pengumpulan.update');
        Route::delete('praktikum/pengumpulan/{pengumpulan}', [App\Http\Controllers\PengumpulanTugasController::class, 'destroy'])->name('praktikum.pengumpulan.destroy');
        Route::get('praktikum/pengumpulan/{pengumpulan}/download', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFile'])->name('praktikum.pengumpulan.download');
        
        // Admin melihat tugas yang dikumpulkan
        Route::get('praktikum/tugas/{tugas}/submissions', [App\Http\Controllers\PengumpulanTugasController::class, 'adminSubmissions'])->name('praktikum.tugas.submissions');
        Route::put('praktikum/submission/{pengumpulan}/grade', [App\Http\Controllers\PengumpulanTugasController::class, 'gradeSubmission'])->name('praktikum.submission.grade');
        Route::post('praktikum/submission/rubrik-grade', [App\Http\Controllers\PengumpulanTugasController::class, 'storeNilaiRubrik'])->name('praktikum.submission.rubrik-grade');
        Route::put('praktikum/submission/{pengumpulan}/reject', [App\Http\Controllers\PengumpulanTugasController::class, 'rejectSubmission'])->name('praktikum.submission.reject');
        Route::get('praktikum/pengumpulan/download/{filename}', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFileByFilename'])->name('praktikum.pengumpulan.download.filename');
        
        // Komponen Rubrik Management (Simplified)
        Route::get('praktikum/tugas/{tugas}/komponen', [App\Http\Controllers\KomponenRubrikController::class, 'index'])->name('praktikum.tugas.komponen.index');
        Route::post('praktikum/tugas/{tugas}/komponen', [App\Http\Controllers\KomponenRubrikController::class, 'store'])->name('praktikum.tugas.komponen.store');
        Route::put('praktikum/tugas/{tugas}/komponen/{komponen}', [App\Http\Controllers\KomponenRubrikController::class, 'update'])->name('praktikum.tugas.komponen.update');
        Route::delete('praktikum/tugas/{tugas}/komponen/{komponen}', [App\Http\Controllers\KomponenRubrikController::class, 'destroy'])->name('praktikum.tugas.komponen.destroy');
        Route::put('praktikum/tugas/{tugas}/komponen-urutan', [App\Http\Controllers\KomponenRubrikController::class, 'updateUrutan'])->name('praktikum.tugas.komponen.update-urutan');
        
        // Nilai Tambahan
        Route::post('praktikum/tugas/{tugas}/nilai-tambahan', [App\Http\Controllers\KomponenRubrikController::class, 'storeNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.store');
        Route::get('praktikum/tugas/{tugas}/praktikan/{praktikan}/nilai-tambahan', [App\Http\Controllers\KomponenRubrikController::class, 'getNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.get');
        Route::put('praktikum/tugas/{tugas}/nilai-tambahan/{nilai}', [App\Http\Controllers\KomponenRubrikController::class, 'updateNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.update');
        Route::delete('praktikum/tugas/{tugas}/nilai-tambahan/{nilai}', [App\Http\Controllers\KomponenRubrikController::class, 'deleteNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.delete');
    });
    
    // Praktikan Routes (untuk praktikan yang sudah login)
    Route::middleware(['auth', 'role:praktikan'])->group(function () {
        Route::get('/praktikan/daftar-tugas', [App\Http\Controllers\PraktikanController::class, 'daftarTugas'])->name('praktikan.daftar-tugas');
        Route::get('/praktikan/praktikum/{praktikum}/tugas', [App\Http\Controllers\PraktikanController::class, 'praktikumTugas'])->name('praktikan.praktikum.tugas');
        Route::get('/praktikan/riwayat-tugas', [App\Http\Controllers\PraktikanController::class, 'riwayatTugas'])->name('praktikan.riwayat');
        
        // Pengumpulan tugas
        Route::post('/praktikum/tugas/{tugas}/pengumpulan', [App\Http\Controllers\PengumpulanTugasController::class, 'store'])->name('praktikum.tugas.pengumpulan.store');
        Route::delete('/praktikum/pengumpulan/{pengumpulan}/cancel', [App\Http\Controllers\PengumpulanTugasController::class, 'cancelSubmission'])->name('praktikum.pengumpulan.cancel');
    });
    
    // Route untuk download file (bisa diakses semua user yang sudah login)
    Route::middleware(['auth'])->group(function () {
        Route::get('/praktikum/pengumpulan/download/{filename}', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFileByFilename'])->name('praktikum.pengumpulan.download.filename');
    });
    
    // Template download route (public)
    Route::get('/praktikan/template-download', [App\Http\Controllers\PraktikanController::class, 'downloadTemplate'])->name('praktikan.template.download');
    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk'])
    ->name('kepengurusan-lab.download-sk');
    
    // API untuk cek status kepengurusan
    Route::get('/api/check-kepengurusan-status', function (Request $request) {
        $lab_id = $request->input('lab_id');
        $modul = $request->input('modul');
        
        if (!$lab_id) {
            return response()->json(['error' => 'Lab ID tidak ditemukan'], 400);
        }
        
        $hasActiveKepengurusan = \App\Helpers\KepengurusanHelper::hasActiveKepengurusan($lab_id);
        $canAccessModul = $hasActiveKepengurusan ? \App\Helpers\KepengurusanHelper::canAccessModul($lab_id, $modul) : false;
        
        return response()->json([
            'has_active_kepengurusan' => $hasActiveKepengurusan,
            'can_access_modul' => $canAccessModul,
            'message' => \App\Helpers\KepengurusanHelper::getModulAccessMessage($lab_id, $modul)
        ]);
    })->name('api.check-kepengurusan-status');
    
    //Inventaris
    Route::resource('inventaris', InventarisController::class);
    Route::get('/inventaris/{id}/detail', [DetailInventarisController::class, 'index'])->name('inventaris.detail');
    Route::post('/detail-inventaris', [DetailInventarisController::class, 'store'])->name('detail-inventaris.store');
    Route::put('/detail-inventaris/{detailAset}', [DetailInventarisController::class, 'update'])->name('detail-inventaris.update');
    Route::delete('/detail-inventaris/{detailAset}', [DetailInventarisController::class, 'destroy'])->name('detail-inventaris.destroy');
    // Surat Menyurat
    Route::prefix('surat')->name('surat.')->group(function () {
        Route::get('/kirim', [SuratController::class, 'createSurat'])->name('create');
        Route::post('/kirim', [SuratController::class, 'storeSurat'])->name('store');
        Route::get('/masuk', [SuratController::class, 'suratMasuk'])->name('masuk');
        Route::get('/keluar', [SuratController::class, 'suratKeluar'])->name('keluar');
        Route::get('/view/{id}', [SuratController::class, 'viewSurat'])->name('view');
        Route::get('/download/{id}', [SuratController::class, 'downloadSurat'])->name('download');
        Route::post('/mark-as-read/{id}', [SuratController::class, 'markAsRead'])->name('mark-as-read');
        Route::get('/count-unread', [SuratController::class, 'getUnreadCount'])->name('count-unread');
        Route::get('/surat/preview/{id}', [SuratController::class, 'previewSurat'])->name('surat.preview');
    });
    // Piket - view bisa akses semua, manipulation hanya kepengurusan aktif
    Route::prefix('piket')->name('piket.')->group(function () {
        // View routes - bisa akses semua
        Route::get('/jadwal', [JadwalPiketController::class, 'index'])->name('jadwal.index');
        Route::get('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'show'])->name('jadwal.show');
        Route::get('/periode-piket', [PeriodePiketController::class, 'index'])->name('periode-piket.index');
        Route::get('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'show'])->name('periode-piket.show');
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
        Route::get('/absensi/riwayat', [AbsensiController::class, 'show'])->name('absensi.show');
        Route::get('/rekap-absen', [AbsensiController::class, 'rekapAbsen'])->name('rekap-absen');
        
        // Manipulation routes - hanya kepengurusan aktif
        Route::middleware(['active.kepengurusan:piket'])->group(function () {
            Route::post('/jadwal', [JadwalPiketController::class, 'store'])->name('jadwal.store');
            Route::put('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'update'])->name('jadwal.update');
            Route::delete('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'destroy'])->name('jadwal.destroy');
            Route::post('/periode-piket', [PeriodePiketController::class, 'store'])->name('periode-piket.store');
            Route::put('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'update'])->name('periode-piket.update');
            Route::delete('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'destroy'])->name('periode-piket.destroy');
            Route::post('/absensi/simpan', [AbsensiController::class, 'store'])->name('absensi.store');
        });
    });
});

// Add these routes to your web.php file
// Add these imports at the top of the file


// Then update your routes to use the correct middleware syntax
Route::middleware(['auth', 'role:superadmin|kadep'])->group(function () {
    Route::get('/admin-management', [AdminController::class, 'index'])->name('admin.index');
    Route::post('/admin-management', [AdminController::class, 'store'])->name('admin.store');
    Route::put('/admin-management/{admin}', [AdminController::class, 'update'])->name('admin.update');
    Route::delete('/admin-management/{admin}', [AdminController::class, 'destroy'])->name('admin.destroy');
    
    // Data Master Routes
    Route::prefix('data-master')->name('data-master.')->group(function () {
        Route::resource('struktur', StrukturController::class);
    });
    
    // Laboratorium Routes (read and edit only)
    Route::get('/laboratorium', [App\Http\Controllers\LaboratoriumController::class, 'index'])->name('laboratorium.index');
    Route::post('/laboratorium/{laboratorium}', [App\Http\Controllers\LaboratoriumController::class, 'update'])->name('laboratorium.update');
});
require __DIR__.'/auth.php';