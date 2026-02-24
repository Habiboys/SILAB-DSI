<?php

namespace App\Http\Controllers;

use App\Models\Praktikum;
use App\Models\SertifikatTemplate;
use App\Models\Sertifikat;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PraktikumSertifikatController extends Controller
{
    public function index(Praktikum $praktikum)
    {
        $praktikum->load(['praktikans.user', 'aslab', 'kepengurusanLab']);

        $templates = SertifikatTemplate::whereIn('kategori', ['praktikum', 'aslab'])
            ->where('ref_id', $praktikum->id)
            ->get();

        return Inertia::render('Praktikum/Sertifikat', [
            'praktikum' => $praktikum,
            'templates' => $templates
        ]);
    }

    public function uploadTemplate(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'template' => 'required|file|mimes:docx|max:2048',
            'kategori' => 'required|in:praktikum,aslab'
        ]);

        $path = $request->file('template')->store('templates/' . $request->kategori, 'public');

        SertifikatTemplate::updateOrCreate(
            [
                'kategori' => $request->kategori,
                'ref_id' => $praktikum->id
            ],
            [
                'nama' => 'Template ' . ucfirst($request->kategori) . ' ' . $praktikum->mata_kuliah,
                'file_path' => $path
            ]
        );

        return redirect()->back()->with('message', 'Template berhasil diunggah.');
    }

    public function generate(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'kategori' => 'required|in:praktikum,aslab',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Eager-load lab relation so nama_laboratorium is accessible
        $praktikum->loadMissing(['kepengurusanLab.laboratorium']);

        $template = SertifikatTemplate::where('kategori', $request->kategori)
            ->where('ref_id', $praktikum->id)
            ->first();

        if (!$template) {
            return redirect()->back()->with('error', 'Template belum tersedia.');
        }

        $templatePath = storage_path('app/public/' . $template->file_path);
        $certificateService = new CertificateService();
        $count = 0;

        // Build abbreviation from mata kuliah, e.g. "Pemrograman Teknologi Bergerak" => "PTB"
        $mkCode = strtoupper(implode('', array_map(
            fn($word) => substr($word, 0, 1),
            array_filter(explode(' ', $praktikum->mata_kuliah))
        )));
        $mkCode = substr($mkCode, 0, 6); // max 6 chars

        $katShort = $request->kategori === 'praktikum' ? 'PRA' : 'ASL';
        $labName = $praktikum->kepengurusanLab?->laboratorium?->nama ?? 'Laboratorium';

        // Base sequence: count existing sertifikats for this praktikum+kategori to avoid collisions
        $baseSeq = Sertifikat::where('praktikum_id', $praktikum->id)
            ->where('jenis_sertifikat', $request->kategori === 'praktikum' ? 'praktikan' : 'asisten')
            ->count();

        $targets = $request->kategori === 'praktikum'
            ? $praktikum->praktikans()->whereIn('praktikan.user_id', $request->user_ids)->with('user.profile')->get()
            : $praktikum->aslab()->whereIn('users.id', $request->user_ids)->with('profile')->get();

        foreach ($targets as $i => $target) {
            $user = $request->kategori === 'praktikum' ? $target->user : $target;

            if (!$user) continue;

            // Short readable nomor: SRT-2026-PRA-PTB-001
            $seq = str_pad($baseSeq + $i + 1, 3, '0', STR_PAD_LEFT);
            $nomorSertifikat = "SRT-" . date('Y') . "-{$katShort}-{$mkCode}-{$seq}";

            $data = [
                'nama'     => $user->name,
                'nim'      => $user->profile?->nomor_induk ?? '-',
                'peran'    => ucfirst($request->kategori),
                'praktikum'=> $praktikum->mata_kuliah,
                'tanggal'  => now()->format('d F Y'),
                'nomor'    => $nomorSertifikat,
                'lab'      => $labName,
            ];

            $fileName = 'sertifikat/' . $request->kategori . '/' . $praktikum->id . '_' . $user->id . '.docx';

            $result = $certificateService->generate($templatePath, $data, $fileName, 'docx');

            if ($result) {
                Sertifikat::updateOrCreate(
                    [
                        'user_id'          => $user->id,
                        'praktikum_id'     => $praktikum->id,
                        'jenis_sertifikat' => $request->kategori === 'praktikum' ? 'praktikan' : 'asisten',
                    ],
                    [
                        'nomor_sertifikat'  => $nomorSertifikat,
                        'file_path'         => $result,
                        'tanggal_terbit'    => now(),
                        'kepengurusan_lab_id' => $praktikum->kepengurusan_lab_id,
                    ]
                );
                $count++;
            }
        }

        return redirect()->back()->with('message', "$count sertifikat berhasil digenerate.");
    }
}
