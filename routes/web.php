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
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });
Route::get('/', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::resource('struktur', StrukturController::class);
    Route::resource('anggota', AnggotaController::class);
    Route::resource('tahun-kepengurusan', TahunKepengurusanController::class);
    Route::resource('kepengurusan-lab', KepengurusanLabController::class);
    //modul keuangan
    Route::post('/riwayat-keuangan', [RiwayatKeuanganController::class, 'store'])->name('riwayat-keuangan.store');
    Route::get('/riwayat-keuangan/export', [RiwayatKeuanganController::class, 'export'])->name('riwayat-keuangan.export');
    Route::get('/riwayat-keuangan/check-data', [RiwayatKeuanganController::class, 'checkData'])->name('riwayat-keuangan.check-data');
    Route::resource('riwayat-keuangan', RiwayatKeuanganController::class);
    Route::get('/catatan-kas', [RiwayatKeuanganController::class, 'catatanKas'])->name('catatan-kas');
    Route::resource('rekap-keuangan', RekapKeuanganController::class);
    //modul praktikum 
    Route::resource('praktikum', PraktikumController::class); 
    //Pertemuan dan file modul praktikum
    Route::resource('praktikum.modul', ModulPraktikumController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('praktikum/{praktikum}/modul/{modul}/view/{filename?}', [ModulPraktikumController::class, 'view'])
    ->name('praktikum.modul.view')
    ->where('filename', '.*');
    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk']);

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
    });

    // Piket
    Route::prefix('piket')->name('piket.')->group(function () {
        Route::resource('jadwal', JadwalPiketController::class);   
        Route::resource('periode-piket', PeriodePiketController::class);
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
        Route::post('/absensi/simpan', [AbsensiController::class, 'store'])->name('absensi.store');
        Route::get('/absensi/riwayat', [AbsensiController::class, 'show'])->name('absensi.show');
        Route::get('/rekap-absen', [AbsensiController::class, 'rekapAbsen'])->name('rekap-absen');
    });
    

    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk'])
    ->name('kepengurusan-lab.download-sk');
});

require __DIR__.'/auth.php';
