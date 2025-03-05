<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TahunKepengurusanController;
use App\Http\Controllers\StrukturController;
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

    Route::get('/anggota', function () {
        return Inertia::render('Anggota');
    });
    // Route::get('/struktur', [StrukturController::class, 'index'])->name('struktur.index');

    Route::resource('struktur', StrukturController::class);
    // Route::get('/struktur/{id}', [StrukturController::class, 'index']);
    
    Route::resource('tahun-kepengurusan', TahunKepengurusanController::class);
});

require __DIR__.'/auth.php';
