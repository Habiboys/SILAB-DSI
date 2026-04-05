<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\LpjKepengurusan;
use App\Models\Proker;
use App\Models\TahunKepengurusan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LpjKepengurusanController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $kepengurusanLab = $this->resolveKepengurusanLab($request);

        if ($kepengurusanLab && ! $this->canAccessKepengurusanLab($user, $kepengurusanLab)) {
            abort(403, 'Unauthorized lab context.');
        }

        $items = collect();
        $summary = null;

        if ($kepengurusanLab) {
            $items = LpjKepengurusan::where('kepengurusan_lab_id', $kepengurusanLab->id)
                ->with(['generator:id,name', 'approver:id,name'])
                ->latest('created_at')
                ->get();

            $summary = $this->buildSummary($kepengurusanLab);
        }

        return Inertia::render('LpjKepengurusan/Index', [
            'items' => $items,
            'kepengurusanLab' => $kepengurusanLab,
            'summary' => $summary,
            'can' => [
                'generate' => $this->canManage($user),
                'approve' => $this->canApprove($user),
            ],
        ]);
    }

    public function show(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $lpjKepengurusan->load([
            'kepengurusanLab.tahunKepengurusan',
            'kepengurusanLab.laboratorium',
            'generator:id,name',
            'approver:id,name',
        ]);

        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');

        return Inertia::render('LpjKepengurusan/Show', [
            'lpj' => $lpjKepengurusan,
            'detail' => $this->buildDetail($lpjKepengurusan->kepengurusanLab),
            'can' => [
                'manage' => $this->canManage($user),
                'approve' => $this->canApprove($user),
            ],
        ]);
    }

    public function generate(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->canManage($user), 403, 'Unauthorized action.');

        $request->validate([
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'judul' => 'required|string|max:255',
            'nomor_dokumen' => 'nullable|string|max:100',
            'ringkasan' => 'nullable|string',
        ]);

        $kepengurusanLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->findOrFail($request->kepengurusan_lab_id);

        abort_unless($this->canAccessKepengurusanLab($user, $kepengurusanLab), 403, 'Unauthorized lab context.');

        $summary = $this->buildSummary($kepengurusanLab);

        $lpj = LpjKepengurusan::create([
            'kepengurusan_lab_id' => $kepengurusanLab->id,
            'judul' => $request->judul,
            'nomor_dokumen' => $request->nomor_dokumen,
            'status' => 'draft',
            'ringkasan' => $request->ringkasan,
            'total_proker' => $summary['total_proker'],
            'proker_disetujui' => $summary['proker_disetujui'],
            'proker_selesai' => $summary['proker_selesai'],
            'total_kegiatan' => $summary['total_kegiatan'],
            'kegiatan_disetujui' => $summary['kegiatan_disetujui'],
            'total_laporan_kegiatan' => $summary['total_laporan_kegiatan'],
            'total_dokumentasi_kegiatan' => $summary['total_dokumentasi_kegiatan'],
            'persentase_capaian_rata2' => $summary['persentase_capaian_rata2'],
            'generated_at' => now(),
            'generated_by' => $user->id,
        ]);

        return redirect()->route('lpj-kepengurusan.show', $lpj->id)
            ->with('message', 'LPJ final berhasil digenerate.');
    }

    public function refresh(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canManage($user), 403, 'Unauthorized action.');
        abort_if($lpjKepengurusan->status === 'terkunci', 422, 'LPJ sudah terkunci.');

        $lpjKepengurusan->load('kepengurusanLab');
        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');

        $summary = $this->buildSummary($lpjKepengurusan->kepengurusanLab);

        $lpjKepengurusan->update([
            'total_proker' => $summary['total_proker'],
            'proker_disetujui' => $summary['proker_disetujui'],
            'proker_selesai' => $summary['proker_selesai'],
            'total_kegiatan' => $summary['total_kegiatan'],
            'kegiatan_disetujui' => $summary['kegiatan_disetujui'],
            'total_laporan_kegiatan' => $summary['total_laporan_kegiatan'],
            'total_dokumentasi_kegiatan' => $summary['total_dokumentasi_kegiatan'],
            'persentase_capaian_rata2' => $summary['persentase_capaian_rata2'],
            'generated_at' => now(),
            'generated_by' => $user->id,
        ]);

        return back()->with('message', 'Data LPJ final berhasil diperbarui dari data terbaru.');
    }

    public function submit(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canManage($user), 403, 'Unauthorized action.');

        $lpjKepengurusan->load('kepengurusanLab');
        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');
        abort_if($lpjKepengurusan->status !== 'draft', 422, 'Hanya LPJ draft yang bisa diajukan review.');

        $lpjKepengurusan->update(['status' => 'review']);

        return back()->with('message', 'LPJ final diajukan untuk review.');
    }

    public function approve(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canApprove($user), 403, 'Unauthorized action.');

        $lpjKepengurusan->load('kepengurusanLab');
        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');
        abort_if(! in_array($lpjKepengurusan->status, ['review', 'draft'], true), 422, 'Status LPJ tidak valid untuk approval.');

        $lpjKepengurusan->update([
            'status' => 'disetujui',
            'approved_at' => now(),
            'approved_by' => $user->id,
        ]);

        return back()->with('message', 'LPJ final berhasil disetujui.');
    }

    public function lock(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canApprove($user), 403, 'Unauthorized action.');

        $lpjKepengurusan->load('kepengurusanLab');
        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');
        abort_if($lpjKepengurusan->status !== 'disetujui', 422, 'Hanya LPJ yang disetujui yang bisa dikunci.');

        $lpjKepengurusan->update([
            'status' => 'terkunci',
            'locked_at' => now(),
        ]);

        return back()->with('message', 'LPJ final berhasil dikunci.');
    }

    public function exportPdf(LpjKepengurusan $lpjKepengurusan)
    {
        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $lpjKepengurusan->load([
            'kepengurusanLab.tahunKepengurusan',
            'kepengurusanLab.laboratorium',
            'generator:id,name',
            'approver:id,name',
        ]);

        abort_unless($this->canAccessKepengurusanLab($user, $lpjKepengurusan->kepengurusanLab), 403, 'Unauthorized lab context.');

        $detail = $this->buildDetail($lpjKepengurusan->kepengurusanLab);

        $pdf = Pdf::loadView('pdf.lpj-kepengurusan', [
            'lpj' => $lpjKepengurusan,
            'detail' => $detail,
        ])->setPaper('a4', 'portrait');

        $filename = 'lpj-final-' . Str::slug($lpjKepengurusan->judul) . '.pdf';

        return $pdf->download($filename);
    }

    private function resolveKepengurusanLab(Request $request): ?KepengurusanLab
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        if ($kepengurusanLabId) {
            return KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])->find($kepengurusanLabId);
        }

        $labId = $request->input('lab_id');
        if (!$labId && isset($currentLab['laboratorium'])) {
            $labId = $currentLab['laboratorium']->id;
        }

        if (!$labId) {
            return null;
        }

        $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
        if (! $tahunAktif) {
            return null;
        }

        return KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->where('laboratorium_id', $labId)
            ->where('tahun_kepengurusan_id', $tahunAktif->id)
            ->first();
    }

    private function buildSummary(KepengurusanLab $kepengurusanLab): array
    {
        $prokers = Proker::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->with([
                'parameter',
                'kegiatan.laporanKegiatan',
                'kegiatan.dokumentasiKegiatan',
            ])
            ->get();

        $totalProker = $prokers->count();
        $prokerDisetujui = $prokers->where('status_pengajuan', 'disetujui')->count();
        $prokerSelesai = $prokers->where('status', 'selesai')->count();

        $totalKegiatan = 0;
        $kegiatanDisetujui = 0;
        $totalLaporanKegiatan = 0;
        $totalDokumentasiKegiatan = 0;

        foreach ($prokers as $proker) {
            $totalKegiatan += $proker->kegiatan->count();
            $kegiatanDisetujui += $proker->kegiatan->where('status_approval', 'disetujui')->count();

            foreach ($proker->kegiatan as $kegiatan) {
                $totalLaporanKegiatan += $kegiatan->laporanKegiatan->count();
                $totalDokumentasiKegiatan += $kegiatan->dokumentasiKegiatan->count();
            }
        }

        $avgCapaian = $prokers
            ->map(fn ($p) => $p->persentase_capaian)
            ->filter(fn ($v) => !is_null($v))
            ->avg();

        return [
            'total_proker' => $totalProker,
            'proker_disetujui' => $prokerDisetujui,
            'proker_selesai' => $prokerSelesai,
            'total_kegiatan' => $totalKegiatan,
            'kegiatan_disetujui' => $kegiatanDisetujui,
            'total_laporan_kegiatan' => $totalLaporanKegiatan,
            'total_dokumentasi_kegiatan' => $totalDokumentasiKegiatan,
            'persentase_capaian_rata2' => is_null($avgCapaian) ? null : round($avgCapaian, 2),
        ];
    }

    private function buildDetail(KepengurusanLab $kepengurusanLab): array
    {
        $prokers = Proker::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->with([
                'struktur',
                'parameter',
                'kegiatan.laporanKegiatan',
                'kegiatan.dokumentasiKegiatan',
                'kegiatan.peserta',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($proker) {
                return [
                    'id' => $proker->id,
                    'nama_proker' => $proker->nama_display,
                    'struktur' => $proker->struktur?->struktur,
                    'status_pengajuan' => $proker->status_pengajuan,
                    'status' => $proker->status,
                    'persentase_capaian' => $proker->persentase_capaian,
                    'kegiatan' => $proker->kegiatan->map(function ($kegiatan) {
                        return [
                            'id' => $kegiatan->id,
                            'nama_kegiatan' => $kegiatan->nama_kegiatan,
                            'status_approval' => $kegiatan->status_approval,
                            'tanggal_mulai' => optional($kegiatan->tanggal_mulai)->toDateString(),
                            'tanggal_selesai' => optional($kegiatan->tanggal_selesai)->toDateString(),
                            'jumlah_peserta' => $kegiatan->peserta->count(),
                            'jumlah_laporan' => $kegiatan->laporanKegiatan->count(),
                            'jumlah_dokumentasi' => $kegiatan->dokumentasiKegiatan->count(),
                        ];
                    })->values(),
                ];
            })
            ->values();

        return [
            'prokers' => $prokers,
        ];
    }

    private function canAccessKepengurusanLab($user, KepengurusanLab $kepengurusanLab): bool
    {
        if ($user->hasRole(['superadmin', 'kadep'])) {
            return true;
        }

        $currentLab = $user->getCurrentLab();
        $userLabId = $currentLab['laboratorium']->id ?? null;

        return (string) $userLabId === (string) $kepengurusanLab->laboratorium_id;
    }

    private function canView($user): bool
    {
        return $user->hasRole(['superadmin', 'kadep'])
            || $user->can('proker.view')
            || $user->can('kegiatan.view');
    }

    private function canManage($user): bool
    {
        return $user->hasRole(['superadmin', 'kadep'])
            || $user->can('proker.update-progress')
            || $user->can('proker.update')
            || $user->can('kegiatan.edit');
    }

    private function canApprove($user): bool
    {
        return $user->hasRole(['superadmin', 'kadep'])
            || $user->can('proker.approve')
            || $user->can('kegiatan.approve');
    }
}
