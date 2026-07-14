<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\Proker;
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

        $detail  = null;
        $summary = null;

        if ($kepengurusanLab) {
            $detail  = $this->buildDetail($kepengurusanLab);
            $summary = $this->buildSummary($kepengurusanLab);
        }

        return Inertia::render('LpjKepengurusan/Index', [
            'kepengurusanLab' => $kepengurusanLab,
            'detail'          => $detail,
            'summary'         => $summary,
            'can'             => [
                'manage' => $this->canManage($user),
            ],
        ]);
    }

    public function previewPage(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $kepengurusanLab = $this->resolveKepengurusanLab($request);
        abort_if(! $kepengurusanLab, 404, 'Konteks kepengurusan tidak ditemukan.');
        abort_unless($this->canAccessKepengurusanLab($user, $kepengurusanLab), 403, 'Unauthorized lab context.');

        return Inertia::render('LpjKepengurusan/PreviewPage', [
            'kepengurusanLab' => $kepengurusanLab,
            'type'            => $request->query('type', 'rangkuman'),
        ]);
    }

    public function preview(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $kepengurusanLab = $this->resolveKepengurusanLab($request);
        abort_if(! $kepengurusanLab, 404, 'Konteks kepengurusan tidak ditemukan.');
        abort_unless($this->canAccessKepengurusanLab($user, $kepengurusanLab), 403, 'Unauthorized lab context.');

        $type       = $request->query('type', 'rangkuman');
        $personalia = $this->buildPersonalia($kepengurusanLab);
        $lpjDto     = $this->makeLpjDto($kepengurusanLab);

        if ($type === 'lengkap') {
            $detail = $this->buildDetailLengkap($kepengurusanLab, skipImages: true);

            return Pdf::loadView('pdf.lpj-kepengurusan-lengkap', [
                'lpj'        => $lpjDto,
                'detail'     => $detail,
                'personalia' => $personalia,
            ])->setPaper('a4', 'portrait')->stream('preview-lengkap.pdf');
        }

        $detail  = $this->buildDetail($kepengurusanLab);
        $withTtd = filter_var($request->query('with_ttd', 'false'), FILTER_VALIDATE_BOOLEAN);

        return Pdf::loadView('pdf.lpj-kepengurusan-rangkuman', [
            'lpj'        => $lpjDto,
            'detail'     => $detail,
            'personalia' => $personalia,
            'with_ttd'   => $withTtd,
            'form'       => [
                'dasar'                 => $request->query('dasar', ''),
                'judul_surat_keputusan' => $request->query('judul_surat_keputusan', ''),
                'tanggal_sk'            => $request->query('tanggal_sk', ''),
                'kesimpulan'            => $request->query('kesimpulan', ''),
                'penutup'               => $request->query('penutup', ''),
                    'jadwal_kegiatan'        => $request->query('jadwal_kegiatan', ''),
                ],
            ])->setPaper('a4', 'portrait')->stream('preview-rangkuman.pdf');
    }

    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(180);

        $user = Auth::user();
        abort_unless($this->canView($user), 403, 'Unauthorized action.');

        $kepengurusanLab = $this->resolveKepengurusanLab($request);
        abort_if(! $kepengurusanLab, 404, 'Konteks kepengurusan tidak ditemukan.');
        abort_unless($this->canAccessKepengurusanLab($user, $kepengurusanLab), 403, 'Unauthorized lab context.');

        $type        = $request->query('type', 'rangkuman');
        $personalia  = $this->buildPersonalia($kepengurusanLab);
        $lpjDto      = $this->makeLpjDto($kepengurusanLab);
        $baseFilename = 'lpj-' . Str::slug($kepengurusanLab->laboratorium?->nama ?? 'lab') . '-' . ($kepengurusanLab->tahunKepengurusan?->tahun ?? '');

        if ($type === 'lengkap') {
            $detail = $this->buildDetailLengkap($kepengurusanLab);

            return Pdf::loadView('pdf.lpj-kepengurusan-lengkap', [
                'lpj'        => $lpjDto,
                'detail'     => $detail,
                'personalia' => $personalia,
            ])->setPaper('a4', 'portrait')->download($baseFilename . '-lengkap.pdf');
        }

        $detail  = $this->buildDetail($kepengurusanLab);
        $withTtd = filter_var($request->query('with_ttd', 'false'), FILTER_VALIDATE_BOOLEAN);

        return Pdf::loadView('pdf.lpj-kepengurusan-rangkuman', [
            'lpj'        => $lpjDto,
            'detail'     => $detail,
            'personalia' => $personalia,
            'with_ttd'   => $withTtd,
            'form'       => [
                'dasar'                 => $request->query('dasar', ''),
                'judul_surat_keputusan' => $request->query('judul_surat_keputusan', ''),
                'tanggal_sk'            => $request->query('tanggal_sk', ''),
                'kesimpulan'            => $request->query('kesimpulan', ''),
                'penutup'               => $request->query('penutup', ''),
                    'jadwal_kegiatan'        => $request->query('jadwal_kegiatan', ''),
                ],
            ])->setPaper('a4', 'portrait')->download($baseFilename . '-rangkuman.pdf');
    }

    // ─────────────────────────────────────────────────────────────

    private function makeLpjDto(KepengurusanLab $kepengurusanLab): object
    {
        $labNama = $kepengurusanLab->laboratorium?->nama ?? '';
        $tahun   = $kepengurusanLab->tahunKepengurusan?->tahun ?? '';

        return (object) [
            'judul'           => "LPJ Final {$labNama} {$tahun}",
            'kepengurusanLab' => $kepengurusanLab,
            'approved_at'     => null,
            'generated_at'    => now(),
        ];
    }

    private function resolveKepengurusanLab(Request $request): ?KepengurusanLab
    {
        /** @var \App\Models\User $user */
        $user       = Auth::user();
        $currentLab = $user->getCurrentLab();

        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (! isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        if ($kepengurusanLabId) {
            return KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])->find($kepengurusanLabId);
        }

        $labId = $request->input('lab_id');
        if (! $labId && isset($currentLab['laboratorium'])) {
            $labId = $currentLab['laboratorium']->id;
        }

        if (! $labId) {
            return null;
        }

        return KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->where('laboratorium_id', $labId)
            ->where('is_active', true)
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

        $totalProker    = $prokers->count();
        $prokerDisetujui = $prokers->where('status_pengajuan', 'disetujui')->count();
        $prokerSelesai  = $prokers->where('status', 'selesai')->count();

        $totalKegiatan             = 0;
        $kegiatanDisetujui         = 0;
        $totalLaporanKegiatan      = 0;
        $totalDokumentasiKegiatan  = 0;

        foreach ($prokers as $proker) {
            $totalKegiatan    += $proker->kegiatan->count();
            $kegiatanDisetujui += $proker->kegiatan->where('status_approval', 'disetujui')->count();
            foreach ($proker->kegiatan as $kegiatan) {
                $totalLaporanKegiatan     += $kegiatan->laporanKegiatan->count();
                $totalDokumentasiKegiatan += $kegiatan->dokumentasiKegiatan->count();
            }
        }

        $avgCapaian = $prokers
            ->map(fn ($p) => $p->persentase_capaian)
            ->filter(fn ($v) => ! is_null($v))
            ->avg();

        return [
            'total_proker'               => $totalProker,
            'proker_disetujui'           => $prokerDisetujui,
            'proker_selesai'             => $prokerSelesai,
            'total_kegiatan'             => $totalKegiatan,
            'kegiatan_disetujui'         => $kegiatanDisetujui,
            'total_laporan_kegiatan'     => $totalLaporanKegiatan,
            'total_dokumentasi_kegiatan' => $totalDokumentasiKegiatan,
            'persentase_capaian_rata2'   => is_null($avgCapaian) ? null : round($avgCapaian, 2),
        ];
    }

    private function buildDetail(KepengurusanLab $kepengurusanLab): array
    {
        $prokers = Proker::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->where('status_pengajuan', 'disetujui')
            ->with([
                'struktur',
                'parameter',
                'pjs.user',
                'kegiatan' => fn ($q) => $q->where('status_approval', 'disetujui')->with('dokumentasiKegiatan'),
            ])
            ->orderBy('created_at')
            ->get()
            ->map(function ($proker) {
                return [
                    'id'                 => $proker->id,
                    'nama_proker'        => $proker->nama_display,
                    'struktur'           => $proker->struktur?->struktur,
                    'status_pengajuan'   => $proker->status_pengajuan,
                    'status'             => $proker->status,
                    'tanggal_mulai'      => optional($proker->tanggal_mulai)->toDateString(),
                    'tanggal_selesai'    => optional($proker->tanggal_selesai)->toDateString(),
                    'deskripsi'          => $proker->deskripsi,
                    'tujuan'             => $proker->tujuan,
                    'sasaran'            => $proker->sasaran,
                    'output_kegiatan'    => $proker->output_kegiatan,
                    'kendala'            => $proker->kendala,
                    'solusi'             => $proker->solusi,
                    'saran'              => $proker->saran,
                    'persentase_capaian' => $proker->persentase_capaian,
                    'pj'                 => $proker->pjs->map(fn ($p) => $p->user?->name)->filter()->values(),
                    'parameter'          => $proker->parameter->map(fn ($p) => [
                        'id'             => $p->id,
                        'nama_parameter' => $p->nama_parameter,
                        'bobot'          => $p->bobot,
                        'capaian'        => $p->capaian,
                    ])->values(),
                    'kegiatan'           => $proker->kegiatan->map(function ($kegiatan) {
                        return [
                            'id'                 => $kegiatan->id,
                            'nama_kegiatan'      => $kegiatan->nama_kegiatan,
                            'deskripsi_kegiatan' => $kegiatan->deskripsi_kegiatan,
                            'tanggal_mulai'      => optional($kegiatan->tanggal_mulai)->toDateString(),
                            'tanggal_selesai'    => optional($kegiatan->tanggal_selesai)->toDateString(),
                            'jumlah_dokumentasi' => $kegiatan->dokumentasiKegiatan->count(),
                        ];
                    })->values(),
                ];
            })
            ->values();

        $grouped = $prokers->groupBy('struktur');

        return [
            'prokers' => $prokers,
            'divisi'  => $grouped->map(fn ($list, $key) => [
                'nama'   => $key ?? 'Umum',
                'proker' => $list->values(),
            ])->values(),
        ];
    }

    private function buildDetailLengkap(KepengurusanLab $kepengurusanLab, bool $skipImages = false): array
    {
        $prokers = Proker::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->where('status_pengajuan', 'disetujui')
            ->with([
                'struktur',
                'parameter',
                'pjs.user',
                'kegiatan.dokumentasiKegiatan',
            ])
            ->orderBy('created_at')
            ->get();

        $bulanId = [
            1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',
            5=>'Mei',6=>'Juni',7=>'Juli',8=>'Agustus',
            9=>'September',10=>'Oktober',11=>'November',12=>'Desember',
        ];

        $fmtTgl = function ($date) use ($bulanId) {
            if (! $date) return '-';
            $d = \Carbon\Carbon::parse($date);
            return $d->day . ' ' . $bulanId[$d->month] . ' ' . $d->year;
        };

        $toBase64 = function ($path) use ($skipImages) {
            if ($skipImages) return null;
            if (! $path) return null;
            $full = storage_path('app/public/' . $path);
            if (! file_exists($full)) return null;
            $mime = mime_content_type($full);
            if (! str_starts_with($mime, 'image/')) return null;
            try {
                $src = match (true) {
                    str_contains($mime, 'png')  => imagecreatefrompng($full),
                    str_contains($mime, 'gif')  => imagecreatefromgif($full),
                    str_contains($mime, 'webp') => imagecreatefromwebp($full),
                    default                      => imagecreatefromjpeg($full),
                };
                if (! $src) return null;
                $ow   = imagesx($src);
                $oh   = imagesy($src);
                $maxW = 500;
                if ($ow > $maxW) {
                    $nw  = $maxW;
                    $nh  = (int) round($oh * $maxW / $ow);
                    $dst = imagecreatetruecolor($nw, $nh);
                    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $ow, $oh);
                    imagedestroy($src);
                    $src = $dst;
                }
                ob_start();
                imagejpeg($src, null, 70);
                $data = ob_get_clean();
                imagedestroy($src);
                return 'data:image/jpeg;base64,' . base64_encode($data);
            } catch (\Throwable $e) {
                return null;
            }
        };

        $grouped = $prokers->groupBy(fn ($p) => $p->struktur?->struktur ?? 'Umum');

        $divisi = [];
        foreach ($grouped as $namaStruktur => $prokerList) {
            $prokersMapped = $prokerList->map(function ($proker) use ($fmtTgl, $toBase64) {
                $params = $proker->parameter->map(fn ($p) => [
                    'nama'    => $p->nama_parameter,
                    'bobot'   => $p->bobot,
                    'capaian' => $p->capaian,
                ])->values()->toArray();

                $kegiatan = $proker->kegiatan
                    ->filter(fn ($kg) => $kg->status_approval === 'disetujui')
                    ->map(function ($kg) use ($fmtTgl, $toBase64) {
                        $dokKg = $kg->dokumentasiKegiatan->take(3)->map(function ($d) use ($toBase64) {
                            return [
                                'judul' => $d->judul,
                                'src'   => $toBase64($d->file_path),
                            ];
                        })->filter(fn ($d) => $d['src'] !== null)->values()->toArray();

                        return [
                            'nama_kegiatan'   => $kg->nama_kegiatan,
                            'deskripsi'       => $kg->deskripsi_kegiatan,
                            'tanggal_mulai'   => $fmtTgl($kg->tanggal_mulai),
                            'tanggal_selesai' => $fmtTgl($kg->tanggal_selesai),
                            'dokumentasi'     => $dokKg,
                        ];
                    })->values()->toArray();

                return [
                    'nama_proker'        => $proker->nama_display,
                    'deskripsi'          => $proker->deskripsi,
                    'tujuan'             => $proker->tujuan,
                    'sasaran'            => $proker->sasaran,
                    'output_kegiatan'    => $proker->output_kegiatan,
                    'tanggal_mulai'      => $fmtTgl($proker->tanggal_mulai),
                    'tanggal_selesai'    => $fmtTgl($proker->tanggal_selesai),
                    'status'             => $proker->status_text,
                    'persentase_capaian' => $proker->persentase_capaian,
                    'kendala'            => $proker->kendala,
                    'solusi'             => $proker->solusi,
                    'saran'              => $proker->saran,
                    'parameter'          => $params,
                    'pj'                 => $proker->pjs->map(fn ($p) => $p->user?->name)->filter()->join(', '),
                    'kegiatan'           => $kegiatan,
                ];
            })->values()->toArray();

            $divisi[] = [
                'nama'   => $namaStruktur,
                'proker' => $prokersMapped,
            ];
        }

        return ['divisi' => $divisi];
    }

    private function buildPersonalia(KepengurusanLab $kepengurusanLab): array
    {
        $kepalaLabStrukturNames = ['kepala lab', 'kalab', 'kepala laboratorium'];

        $anggota = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->where('is_active', true)
            ->with(['user:id,name', 'user.profile', 'struktur.defaultRole:id,name'])
            ->get();

        $kepalaLab           = null;
        $dosenAnggota        = [];
        $asisten             = [];
        $koordinatorAsisten  = null;
        $sekretaris          = null;

        foreach ($anggota as $member) {
            $roleName   = strtolower($member->struktur?->defaultRole?->name ?? '');
            $strukturNm = $member->struktur?->struktur ?? '';
            $strukturNmLower = strtolower($strukturNm);

            $isKepala = in_array($roleName, ['kalab'])
                || in_array($strukturNmLower, $kepalaLabStrukturNames);

            if ($isKepala) {
                $kepalaLab = $member->user;
            } elseif ($roleName === 'dosen') {
                $dosenAnggota[] = $member->user;
            } else {
                $asisten[] = $member->user;

                if ($koordinatorAsisten === null && str_contains($strukturNmLower, 'koordinator asisten')) {
                    $koordinatorAsisten = (object)[
                        'user'    => $member->user,
                        'jabatan' => $strukturNm,
                    ];
                }
                if ($sekretaris === null && $strukturNmLower === 'sekretaris') {
                    $sekretaris = (object)[
                        'user'    => $member->user,
                        'jabatan' => $strukturNm,
                    ];
                }
            }
        }

        $kadep = \App\Models\User::role('kadep')->with('profile')->first();

        return [
            'kepala_lab'          => $kepalaLab,
            'dosen_anggota'       => $dosenAnggota,
            'asisten'             => $asisten,
            'kadep'               => $kadep,
            'koordinator_asisten' => $koordinatorAsisten,
            'sekretaris'          => $sekretaris,
        ];
    }

    private function canAccessKepengurusanLab($user, KepengurusanLab $kepengurusanLab): bool
    {
        if ($user->hasRole(['superadmin', 'kadep'])) {
            return true;
        }

        $currentLab = $user->getCurrentLab();
        $userLabId  = $currentLab['laboratorium']->id ?? null;

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
}
