<?php

namespace App\Http\Controllers;

use App\Models\Praktikum;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use setasign\Fpdi\Fpdi;

require_once app_path('Support/fpdf_compat.php');
require_once base_path('vendor/setasign/fpdf/fpdf.php');

class PraktikumReportController extends Controller
{
    public function warnings(Praktikum $praktikum)
    {
        $praktikum->load(['aslabPraktikum.user.profile']);
        $meetings = $praktikum->pertemuan()->with(['absensiAslab'])->get();
        $warnings = [];
        if (!$praktikum->mataKuliah) $warnings[] = 'Data mata kuliah belum lengkap.';
        if ($praktikum->kelas->isEmpty()) $warnings[] = 'Belum ada data kelas.';
        if ($meetings->isEmpty()) $warnings[] = 'Belum ada data pertemuan.';
        if ($praktikum->aslabPraktikum->isEmpty()) $warnings[] = 'Belum ada asisten yang ditugaskan.';
        foreach ($praktikum->aslabPraktikum as $assignment) {
            if (!$assignment->user?->profile?->tanda_tangan) $warnings[] = "Tanda tangan {$assignment->user?->name} belum tersedia.";
        }
        foreach ($meetings as $meeting) {
            if ($meeting->absensiAslab->count() < $praktikum->aslabPraktikum->count()) $warnings[] = "Absensi asisten {$meeting->judul} belum lengkap.";
        }
        return response()->json(['warnings' => array_values(array_unique($warnings))]);
    }

    public function preview(Praktikum $praktikum)
    {
        return $this->makePdfResponse($praktikum, 'inline', request()->validate(['dosen_nama' => 'nullable|string|max:255', 'dosen_nip' => 'nullable|string|max:100', 'semester' => 'nullable|string|max:50', 'tahun_akademik' => 'nullable|string|max:20']));
    }

    public function download(Praktikum $praktikum)
    {
        return $this->makePdfResponse($praktikum, 'attachment');
    }

    private function makePdfResponse(Praktikum $praktikum, string $disposition, array $lecturer = [])
    {
        $praktikum->load([
            'mataKuliah',
            'kepengurusanLab',
            'mataKuliah.dosen',
            'kelas.parent',
            'kelas',
            'pertemuan',
            'pertemuan.modul',
            'pertemuan.absensiAslab.aslabPraktikum.user.profile',
            'aslabPraktikum.user.profile',
        ]);

        $meetings = $praktikum->pertemuan()->with([
            'kelas',
            'modul',
            'absensiAslab.aslabPraktikum.user.profile',
        ])->get()
            ->sortBy(fn ($meeting) => [$meeting->tanggal?->timestamp ?? PHP_INT_MAX, $meeting->judul])
            ->values();
        $modules = $meetings->flatMap->modul->values();
        $assignments = $praktikum->aslabPraktikum->keyBy('id');
        $warnings = [];

        if (!$praktikum->mataKuliah) $warnings[] = 'Data mata kuliah belum lengkap.';
        if ($praktikum->kelas->isEmpty()) $warnings[] = 'Belum ada data kelas.';
        if ($meetings->isEmpty()) $warnings[] = 'Belum ada data pertemuan.';
        if ($assignments->isEmpty()) $warnings[] = 'Belum ada asisten yang ditugaskan.';
        foreach ($assignments as $assignment) {
            if (!$assignment->user?->profile?->tanda_tangan) {
                $warnings[] = "Tanda tangan {$assignment->user?->name} belum tersedia.";
            }
        }
        foreach ($meetings as $meeting) {
            if (!$meeting->tanggal) $warnings[] = "Tanggal {$meeting->judul} belum diisi.";
            if ($meeting->absensiAslab->whereIn('aslab_praktikum_id', $assignments->keys())->count() < $assignments->count()) {
                $warnings[] = "Absensi asisten {$meeting->judul} belum lengkap.";
            }
        }
        foreach ($modules as $module) {
            if (!$module->modul || !Storage::disk('public')->exists($module->modul)) {
                $warnings[] = "File modul ".($module->judul ?: 'tanpa judul')." belum tersedia.";
            }
        }

        $logoPath = public_path('images/logo_unand.png');
        $signatureDataUris = [];
        foreach ($assignments as $assignment) {
            $signature = $assignment->user?->profile?->tanda_tangan;
            if ($signature && Storage::disk('public')->exists($signature)) {
                $signatureDataUris[$assignment->id] = 'data:image/png;base64,'.base64_encode(Storage::disk('public')->get($signature));
            }
        }
        $logoDataUri = is_file($logoPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
            : null;

        $pdf = Pdf::loadView('pdf.praktikum-laporan', compact('praktikum', 'meetings', 'modules', 'assignments', 'warnings', 'logoDataUri', 'lecturer', 'signatureDataUris'))
            ->setPaper('a4', 'portrait');

        $filename = 'laporan-praktikum-'.Str::slug($praktikum->mataKuliah?->nama ?: $praktikum->id).'.pdf';

        $mainOutput = $pdf->output();
        $temporaryFiles = [];
        $mainPath = tempnam(sys_get_temp_dir(), 'praktikum-report-').'.pdf';
        file_put_contents($mainPath, $mainOutput);
        $temporaryFiles[] = $mainPath;

        $merger = new Fpdi();
        $this->appendPdf($merger, $mainPath);
        foreach ($modules as $module) {
            if (!$module->modul || !Storage::disk('public')->exists($module->modul)) {
                continue;
            }
            $modulePath = Storage::disk('public')->path($module->modul);
            $this->appendPdf($merger, $modulePath);
        }
        $output = $merger->Output('S');

        foreach ($temporaryFiles as $temporaryFile) {
            @unlink($temporaryFile);
        }

        session()->flash('praktikum_report_warnings', array_values(array_unique($warnings)));

        return response($output, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
            'Content-Length' => strlen($output),
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    private function appendPdf(Fpdi $merger, string $path): void
    {
        $pageCount = $merger->setSourceFile($path);
        for ($page = 1; $page <= $pageCount; $page++) {
            $template = $merger->importPage($page);
            $size = $merger->getTemplateSize($template);
            $merger->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $merger->useTemplate($template);
        }
    }
}
