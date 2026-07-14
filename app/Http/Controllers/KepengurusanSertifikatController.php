<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\Sertifikat;
use App\Models\SertifikatTemplate;
use App\Notifications\SertifikatBaruNotification;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KepengurusanSertifikatController extends Controller
{
    public function index(KepengurusanLab $kepengurusanLab)
    {
        $kepengurusanLab->load([
            'laboratorium',
            'tahunKepengurusan',
            'anggota.user.profile',
            'anggota.struktur',
        ]);

        $template = SertifikatTemplate::where('kategori', 'kepengurusan')
            ->where('ref_id', $kepengurusanLab->id)
            ->first();

        $existing = Sertifikat::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->where('jenis_sertifikat', 'kepengurusan')
            ->get(['id', 'user_id', 'nomor_sertifikat', 'file_path', 'tanggal_terbit']);

        $existingByUser = $existing->keyBy('user_id');

        $anggota = $kepengurusanLab->anggota->map(function ($item) use ($existingByUser) {
            $sertifikat = $existingByUser->get($item->user_id);

            return [
                'id' => $item->id,
                'user_id' => $item->user_id,
                'nama' => $item->user?->name,
                'nim' => $item->user?->profile?->nomor_induk ?? $item->user?->praktikan?->nim,
                'peran' => $item->struktur?->nama ?? 'Anggota',
                'is_active' => (bool) $item->is_active,
                'sertifikat' => $sertifikat ? [
                    'id' => $sertifikat->id,
                    'nomor_sertifikat' => $sertifikat->nomor_sertifikat,
                    'tanggal_terbit' => optional($sertifikat->tanggal_terbit)->format('Y-m-d'),
                ] : null,
            ];
        });

        return Inertia::render('KepengurusanLab/Sertifikat', [
            'kepengurusanLab' => $kepengurusanLab,
            'template' => $template,
            'anggota' => $anggota,
        ]);
    }

    public function uploadTemplate(Request $request, KepengurusanLab $kepengurusanLab)
    {
        $request->validate([
            'template' => 'required|file|mimes:docx|max:2048',
        ]);

        $path = $request->file('template')->store('templates/kepengurusan', 'public');

        SertifikatTemplate::updateOrCreate(
            [
                'kategori' => 'kepengurusan',
                'ref_id' => $kepengurusanLab->id,
            ],
            [
                'nama' => 'Template Kepengurusan ' . ($kepengurusanLab->laboratorium?->nama ?? ''),
                'file_path' => $path,
            ]
        );

        return redirect()->back()->with('message', 'Template berhasil diunggah.');
    }

    public function generate(Request $request, KepengurusanLab $kepengurusanLab)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $kepengurusanLab->loadMissing(['laboratorium', 'tahunKepengurusan']);

        $template = SertifikatTemplate::where('kategori', 'kepengurusan')
            ->where('ref_id', $kepengurusanLab->id)
            ->first();

        if (!$template) {
            return redirect()->back()->with('error', 'Template sertifikat belum diunggah.');
        }

        $templatePath = storage_path('app/public/' . $template->file_path);
        $certificateService = new CertificateService();
        $count = 0;

        $labName = $kepengurusanLab->laboratorium?->nama ?? 'Laboratorium';
        $labCode = strtoupper(implode('', array_map(
            fn($word) => substr($word, 0, 1),
            array_filter(explode(' ', $labName))
        )));
        $labCode = $labCode ? substr($labCode, 0, 6) : 'LAB';
        // safety: fallback ke LAB kalo masih panjang (misal data corrupt)
        if (strlen($labCode) > 6) $labCode = 'LAB';

        $yearRaw = (string) ($kepengurusanLab->tahunKepengurusan?->tahun ?? date('Y'));
        $yearDigits = preg_replace('/\D/', '', $yearRaw) ?: date('Y');
        $yearDigits = substr($yearDigits, 0, 4);

        $baseSeq = Sertifikat::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->where('jenis_sertifikat', 'kepengurusan')
            ->count();

        $targets = KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->whereIn('user_id', $request->user_ids)
            ->with(['user.profile', 'user.praktikan', 'struktur'])
            ->get();

        foreach ($targets as $i => $target) {
            $user = $target->user;
            if (!$user) {
                continue;
            }

            $nim = $user->profile?->nomor_induk ?? $user->praktikan?->nim ?? '-';
            $peran = $target->struktur?->nama ?? 'Anggota';

            $seq = str_pad($baseSeq + $i + 1, 3, '0', STR_PAD_LEFT);
            $nomorSertifikat = "SERT-{$labCode}-{$yearDigits}-{$seq}";

            $data = [
                'nama' => $user->name,
                'nim' => $nim,
                'peran' => $peran,
                'lab' => $labName,
                'tahun' => $yearRaw,
                'tanggal' => now()->format('d F Y'),
                'nomor' => $nomorSertifikat,
            ];

            $fileName = 'sertifikat/kepengurusan/' . $kepengurusanLab->id . '_' . $user->id . '.docx';

            $result = $certificateService->generate($templatePath, $data, $fileName, 'docx');

            if ($result) {
                $sertifikat = Sertifikat::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'kepengurusan_lab_id' => $kepengurusanLab->id,
                        'jenis_sertifikat' => 'kepengurusan',
                    ],
                    [
                        'nomor_sertifikat' => $nomorSertifikat,
                        'file_path' => $result,
                        'tanggal_terbit' => now(),
                    ]
                );

                if ($user->fcm_token) {
                    $user->notify(new SertifikatBaruNotification($sertifikat));
                }

                $count++;
            }
        }

        return redirect()->back()->with('message', "$count sertifikat berhasil digenerate.");
    }
}
