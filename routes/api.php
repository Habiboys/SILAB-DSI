<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\LaboratoriumController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Route untuk mendapatkan daftar laboratorium
Route::get('/labs', function () {
    return \App\Models\Laboratorium::select('id', 'nama')->get();
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_middleware', 'verified')
])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    });
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_middleware', 'verified')
])->group(function () {
    Route::resource('laboratorium', LaboratoriumController::class);
});

require __DIR__.'/auth.php'; 