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
use App\Http\Controllers\SuratController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\JadwalPiketController;
use App\Http\Controllers\PeriodePiketController;
use Inertia\Inertia;

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
    Route::resource('riwayat-keuangan', RiwayatKeuanganController::class);
    Route::post('/riwayat-keuangan', [RiwayatKeuanganController::class, 'store'])->name('riwayat-keuangan.store');
    Route::resource('rekap-keuangan', RekapKeuanganController::class);
    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk']);

    
    // Surat
    Route::get('surat/kirim', [SuratController::class, 'createSurat'])->name('surat.create');
    Route::post('surat/kirim', [SuratController::class, 'storeSurat'])->name('surat.store');
    Route::get('surat/masuk', [SuratController::class, 'suratMasuk'])->name('surat.masuk');
    Route::get('surat/keluar', [SuratController::class, 'suratKeluar'])->name('surat.keluar');


    // Piket
    Route::prefix('piket')->group(function () {
        // Ambil Absen
        Route::get('/ambil-absen', [AbsensiController::class, 'ambilAbsen']);
        Route::post('/ambil-absen/store', [AbsensiController::class, 'storeAbsen'])->name('absen.store');
        
        // Riwayat Absen
        Route::get('/riwayat-absen', [AbsensiController::class, 'riwayatAbsen']);
        
        // Rekap Absen
        Route::get('/rekap-absen', [AbsensiController::class, 'rekapAbsen']);
        Route::get('/rekap-absen/export', [AbsensiController::class, 'exportRekapAbsen']);
        
        // Jadwal Piket
        Route::resource('jadwal-piket', JadwalPiketController::class);
        Route::get('/jadwal-piket', [JadwalPiketController::class, 'jadwalPiket']);
        Route::post('/jadwal-piket/store', [JadwalPiketController::class, 'storeJadwal']);
        Route::put('/jadwal-piket/{jadwal}', [JadwalPiketController::class, 'updateJadwal']);
        Route::delete('/jadwal-piket/{jadwal}', [JadwalPiketController::class, 'destroyJadwal']);
        
        // Periode Piket
        Route::get('/periode-piket', [PeriodePiketController::class, 'periodePiket']);
        Route::post('/periode-piket/store', [PeriodePiketController::class, 'storePeriode']);
        Route::put('/periode-piket/{periode}', [PeriodePiketController::class, 'updatePeriode']);
        Route::delete('/periode-piket/{periode}', [PeriodePiketController::class, 'destroyPeriode']);
    });
    
    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk'])
    ->name('kepengurusan-lab.download-sk');
});

require __DIR__.'/auth.php';
