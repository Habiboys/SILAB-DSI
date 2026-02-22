<?php

namespace App\Http\Controllers;

use App\Models\Sertifikat;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SertifikatVerifikasiController extends Controller
{
    /**
     * Public certificate verification page — no auth required.
     */
    public function show(string $nomor)
    {
        $nomor = urldecode($nomor);

        $sertifikat = Sertifikat::with(['user', 'praktikum.kepengurusanLab.laboratorium'])
            ->where('nomor_sertifikat', $nomor)
            ->first();

        if (!$sertifikat) {
            return Inertia::render('Sertifikat/Verifikasi', [
                'valid'   => false,
                'nomor'   => $nomor,
                'data'    => null,
            ]);
        }

        return Inertia::render('Sertifikat/Verifikasi', [
            'valid' => true,
            'nomor' => $nomor,
            'data'  => [
                'nama'          => $sertifikat->user?->name,
                'nim'           => $sertifikat->user?->nim,
                'jenis'         => $sertifikat->jenis_sertifikat,
                'praktikum'     => $sertifikat->praktikum?->mata_kuliah,
                'lab'           => $sertifikat->praktikum?->kepengurusanLab?->laboratorium?->nama,
                'tanggal_terbit'=> optional($sertifikat->tanggal_terbit)->format('d F Y'),
                'nomor'         => $sertifikat->nomor_sertifikat,
            ],
        ]);
    }
}
