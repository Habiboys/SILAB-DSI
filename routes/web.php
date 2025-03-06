<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TahunKepengurusanController;
use App\Http\Controllers\StrukturController;
use App\Http\Controllers\AnggotaController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    
    // Route::get('/struktur', [StrukturController::class, 'index'])->name('struktur.index');

    Route::resource('struktur', StrukturController::class);
    Route::get('/anggota/{user}/edit', [AnggotaController::class, 'edit'])->name('anggota.edit');
    Route::post('/anggota/store', [AnggotaController::class, 'store'])->name('anggota.store');
    Route::put('/anggota/{user}', [AnggotaController::class, 'update'])->name('anggota.update');
    Route::delete('/anggota/{user}', [AnggotaController::class, 'destroy'])->name('anggota.destroy');

    Route::resource('anggota', AnggotaController::class);
    // Route::get('/struktur/{id}', [StrukturController::class, 'index']);
    
    Route::resource('tahun-kepengurusan', TahunKepengurusanController::class);
});

require __DIR__.'/auth.php';
