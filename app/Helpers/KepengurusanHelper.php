<?php

namespace App\Helpers;

use App\Models\TahunKepengurusan;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;

class KepengurusanHelper
{
    /**
     * Cek apakah ada kepengurusan aktif untuk laboratorium tertentu
     */
    public static function hasActiveKepengurusan($lab_id)
    {
        return KepengurusanLab::where('laboratorium_id', $lab_id)
            ->whereHas('tahunKepengurusan', function($query) {
                $query->where('isactive', 1);
            })
            ->exists();
    }

    /**
     * Dapatkan kepengurusan aktif untuk laboratorium tertentu
     */
    public static function getActiveKepengurusan($lab_id)
    {
        return KepengurusanLab::where('laboratorium_id', $lab_id)
            ->whereHas('tahunKepengurusan', function($query) {
                $query->where('isactive', 1);
            })
            ->first();
    }

    /**
     * Dapatkan tahun kepengurusan aktif
     */
    public static function getActiveTahun()
    {
        return TahunKepengurusan::where('isactive', 1)->first();
    }

    /**
     * Generate pesan warning jika tidak ada kepengurusan aktif
     */
    public static function getWarningMessage($lab_id)
    {
        if (!self::hasActiveKepengurusan($lab_id)) {
            return 'Tidak ada kepengurusan aktif untuk laboratorium ini. Data hanya dapat dilihat, tidak dapat dimanipulasi.';
        }
        return null;
    }

    /**
     * Pastikan lab_id selalu ada di request
     */
    public static function ensureLabId(Request $request)
    {
        $lab_id = $request->input('lab_id') ?? 
                   $request->route('lab_id') ?? 
                   $request->input('laboratory_id') ??
                   auth()->user()->laboratory_id;

        // Jika lab_id tidak ada, coba dapatkan dari kepengurusan_lab_id
        if (!$lab_id && $request->input('kepengurusan_lab_id')) {
            $kepengurusanLab = \App\Models\KepengurusanLab::find($request->input('kepengurusan_lab_id'));
            if ($kepengurusanLab) {
                $lab_id = $kepengurusanLab->laboratorium_id;
            }
        }

        if (!$lab_id) {
            $user = auth()->user();
            if ($user && $user->laboratory_id) {
                $lab_id = $user->laboratory_id;
            }
        }

        return $lab_id;
    }
}
