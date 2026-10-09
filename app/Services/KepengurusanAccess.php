<?php

namespace App\Services;

use App\Models\KepengurusanLab;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class KepengurusanAccess
{
    public const READ_ONLY_MESSAGE = 'Kepengurusan arsip hanya dapat dilihat. Perubahan data tidak diizinkan.';

    public const CONTROLLERS = [
        'AnggotaController', 'KepengurusanLabController', 'KepengurusanSertifikatController',
        'ProkerController', 'ProkerParameterController', 'ProkerDokumentasiController', 'KegiatanController',
        'LaporanKegiatanController', 'DokumentasiKegiatanController', 'LpjKepengurusanController',
        'RiwayatKeuanganController', 'RekapKeuanganController',
        'TagihanKasController', 'DendaPiketController', 'PraktikumController',
        'PraktikumReportController', 'ModulPraktikumController', 'PraktikanController',
        'KelasController', 'PertemuanPraktikumController', 'PraktikumAbsensiController', 'AslabPraktikumController',
        'TugasPraktikumController', 'PengumpulanTugasController', 'KomponenRubrikController',
        'SertifikatController', 'PraktikumSertifikatController',
        'JadwalPiketController', 'PeriodePiketController', 'GantiJadwalPiketController',
        'AbsensiController', 'PengaturanPiketController', 'FaceEnrollmentController',
        'SuratMasukController', 'SuratKeluarController', 'DisposisiSuratController',
        'KonfigurasiSuratController',
    ];

    private const PARENTS = [
        'Kegiatan' => 'proker', 'ProkerParameter' => 'proker', 'ProkerDokumentasi' => 'proker', 'ProkerPj' => 'proker',
        'LaporanKegiatan' => 'kegiatan', 'DokumentasiKegiatan' => 'kegiatan', 'KegiatanPeserta' => 'kegiatan',
        'Kelas' => 'praktikum', 'TugasPraktikum' => 'praktikum',
        'AslabPraktikum' => 'praktikum', 'PraktikanPraktikum' => 'praktikum',
        'PertemuanPraktikum' => 'kelas', 'ModulPraktikum' => 'pertemuan',
        'PengumpulanTugas' => 'tugasPraktikum', 'KomponenRubrik' => 'tugasPraktikum',
        'NilaiTambahan' => 'pengumpulanTugas', 'NilaiRubrik' => 'pengumpulanTugas',
        'AbsensiPraktikan' => 'pertemuan', 'AbsensiAslab' => 'pertemuan',
        'Absensi' => 'jadwalPiket', 'GantiJadwalPiket' => 'periodePiket',
        'DisposisiSurat' => 'suratMasuk', 'Sertifikat' => 'praktikum',
    ];

    private const RESOURCES = [
        'kepengurusanLab' => 'KepengurusanLab', 'kepengurusan_lab' => 'KepengurusanLab',
        'proker' => 'Proker', 'proker_id' => 'Proker', 'parameter' => 'ProkerParameter',
        'kegiatan' => 'Kegiatan', 'kegiatan_id' => 'Kegiatan', 'laporan' => 'LaporanKegiatan',
        'dokumentasi' => 'DokumentasiKegiatan', 'nominalKas' => 'NominalKas', 'nominal_kas_id' => 'NominalKas',
        'tagihan_kas_id' => 'TagihanKas', 'denda_piket_id' => 'DendaPiket',
        'praktikum' => 'Praktikum', 'praktikum_id' => 'Praktikum',
        'kelas' => 'Kelas', 'kelas_id' => 'Kelas', 'subKelas' => 'Kelas', 'target_kelas_id' => 'Kelas', 'parent_kelas_id' => 'Kelas',
        'pertemuan' => 'PertemuanPraktikum', 'pertemuan_id' => 'PertemuanPraktikum',
        'modul' => 'ModulPraktikum', 'tugas' => 'TugasPraktikum', 'tugas_praktikum_id' => 'TugasPraktikum',
        'tugas_id' => 'TugasPraktikum', 'praktikan_praktikum_id' => 'PraktikanPraktikum',
        'komponen_rubrik_id' => 'KomponenRubrik',
        'pengumpulan' => 'PengumpulanTugas', 'pengumpulan_tugas_id' => 'PengumpulanTugas',
        'submission_id' => 'PengumpulanTugas', 'komponen' => 'KomponenRubrik', 'komponen_ids' => 'KomponenRubrik',
        'nilai' => 'NilaiTambahan', 'aslab' => 'AslabPraktikum', 'aslab_praktikum_id' => 'AslabPraktikum',
        'jadwalPiket' => 'JadwalPiket', 'jadwal_piket_id' => 'JadwalPiket',
        'periodePiket' => 'PeriodePiket', 'periode_piket_id' => 'PeriodePiket', 'periode_id' => 'PeriodePiket',
        'absensi' => 'Absensi', 'absensi_id' => 'Absensi', 'enrollment' => 'FaceEnrollment',
        'suratMasukId' => 'SuratMasuk', 'surat_masuk_id' => 'SuratMasuk',
        'kepengurusan_user_id' => 'KepengurusanUser', 'sertifikat' => 'Sertifikat',
    ];

    public static function applies(Request $request): bool
    {
        if (class_basename($request->route()?->getControllerClass() ?? '') === 'KepengurusanLabController'
            && $request->route()?->getActionMethod() === 'index') return false;
        return in_array(class_basename($request->route()?->getControllerClass() ?? ''), self::CONTROLLERS, true);
    }

    public static function forModel(?Model $model, int $depth = 0): ?KepengurusanLab
    {
        if (!$model || $depth > 8) return null;
        if ($model instanceof KepengurusanLab) return $model;
        if ($id = $model->getAttribute('kepengurusan_lab_id')) return KepengurusanLab::find($id);
        if ($model instanceof \App\Models\TugasPraktikum) {
            return self::forModel($model->kelas ?? $model->pertemuan, $depth + 1);
        }
        $parent = self::PARENTS[class_basename($model)] ?? null;
        return $parent ? self::forModel($model->{$parent}, $depth + 1) : null;
    }

    public static function assertWritable(?KepengurusanLab $period): void
    {
        abort_unless($period && $period->is_active, 403, self::READ_ONLY_MESSAGE);
    }

    public static function assertUserHistoryPreserved(\App\Models\User $user): void
    {
        $references = [
            ['KepengurusanUser', 'user_id'], ['AslabPraktikum', 'user_id'],
            ['KegiatanPeserta', 'user_id'], ['ProkerPj', 'user_id'],
            ['GantiJadwalPiket', 'user_id'],
            ['FaceEnrollment', 'user_id'], ['Sertifikat', 'user_id'],
            ['TagihanKas', 'user_id'], ['DendaPiket', 'user_id'],
            ['PemasukanKeuangan', 'user_id'], ['PengeluaranKeuangan', 'user_id'],
            ['SuratKeluar', 'dibuat_oleh'], ['DisposisiSurat', 'dari_user_id'], ['DisposisiSurat', 'kepada_user_id'],
            ['NilaiRubrik', 'dinilai_oleh'], ['NilaiTambahan', 'diberikan_oleh'],
        ];
        foreach ($references as [$name, $field]) {
            $class = 'App\\Models\\'.$name;
            foreach ($class::where($field, $user->id)->cursor() as $resource) {
                $period = self::lockedOwner($resource);
                abort_if($period && !$period->is_active, 403, 'Akun terhubung dengan riwayat kepengurusan arsip dan tidak dapat dihapus.');
            }
        }
        foreach (\App\Models\AbsensiAslab::whereHas('aslabPraktikum', fn ($query) => $query->where('user_id', $user->id))->cursor() as $resource) {
            $period = self::lockedOwner($resource);
            abort_if($period && !$period->is_active, 403, 'Akun terhubung dengan riwayat absensi arsip dan tidak dapat dihapus.');
        }
        $praktikan = \App\Models\Praktikan::where('user_id', $user->id)->first();
        if (!$praktikan) return;
        foreach (['PraktikanPraktikum', 'PengumpulanTugas', 'AbsensiPraktikan'] as $name) {
            $class = 'App\\Models\\'.$name;
            $query = $name === 'PraktikanPraktikum'
                ? $class::where('praktikan_id', $praktikan->id)
                : $class::whereHas('praktikanPraktikum', fn ($query) => $query->where('praktikan_id', $praktikan->id));
            foreach ($query->cursor() as $resource) {
                $period = self::lockedOwner($resource);
                abort_if($period && !$period->is_active, 403, 'Akun terhubung dengan riwayat praktikum arsip dan tidak dapat dihapus.');
            }
        }
    }

    private static function lockedOwner(Model $resource): ?KepengurusanLab
    {
        $period = self::forModel($resource);
        return $period ? KepengurusanLab::whereKey($period->id)->lockForUpdate()->first() : null;
    }

    public static function assertResourceScope(Request $request, array $resources): void
    {
        $parents = [];
        foreach (self::resources($request, false) as $resource) {
            $parents[class_basename($resource)] = $resource->getKey();
        }
        foreach (['praktikum_id' => 'Praktikum', 'tugas_id' => 'TugasPraktikum', 'tugas_praktikum_id' => 'TugasPraktikum'] as $key => $name) {
            if ($request->filled($key)) {
                abort_if(isset($parents[$name]) && (string) $parents[$name] !== (string) $request->input($key), 403, 'Induk data tidak sesuai dengan URL.');
                $parents[$name] = $request->input($key);
            }
        }
        foreach ($resources as $resource) {
            $current = $resource;
            for ($depth = 0; $current && $depth < 8; $depth++) {
                $parent = self::PARENTS[class_basename($current)] ?? null;
                if ($current instanceof \App\Models\TugasPraktikum) $parent = $current->kelas_id ? 'kelas' : 'pertemuan';
                if (!$parent) break;
                $current = $current->{$parent};
                if ($current && isset($parents[$name = class_basename($current)])) {
                    abort_unless((string) $current->getKey() === (string) $parents[$name], 403, 'Data tidak termasuk dalam induk yang dipilih.');
                }
            }
        }
    }

    public static function selected(Request $request): ?KepengurusanLab
    {
        if (!self::applies($request)) return null;
        foreach (self::resources($request, false) as $resource) {
            if ($period = self::forModel($resource)) return $period;
        }
        $id = $request->input('kepengurusan_lab_id');
        if ($id) return is_string($id) ? KepengurusanLab::find($id) : null;
        $lab = $request->input('lab_id') ?? $request->user()?->getCurrentLab()['laboratorium']->id ?? $request->user()?->access_lab_id;
        if ($lab && $year = $request->input('tahun_id')) {
            return KepengurusanLab::where('laboratorium_id', $lab)->where('tahun_kepengurusan_id', $year)->first();
        }
        $sessionId = $request->hasSession() ? $request->session()->get('active_kepengurusan_lab_id') : null;
        if ($sessionId) {
            $period = KepengurusanLab::find($sessionId);
            if ($period && (!$lab || (string) $period->laboratorium_id === (string) $lab)) return $period;
        }
        return $lab ? KepengurusanLab::getActiveByLab($lab) : null;
    }

    public static function resources(Request $request, bool $includeBody = true): array
    {
        $resources = [];
        $controller = class_basename($request->route()?->getControllerClass() ?? '');
        $idModel = match ($controller) {
            'SuratMasukController' => 'SuratMasuk', 'SuratKeluarController' => 'SuratKeluar',
            'DisposisiSuratController' => 'DisposisiSurat', 'GantiJadwalPiketController' => 'GantiJadwalPiket',
            'AbsensiController' => 'Absensi', 'KepengurusanLabController' => 'KepengurusanLab',
            default => null,
        };
        foreach ($request->route()?->parameters() ?? [] as $key => $value) {
            if ($value instanceof Model) {
                $resources[] = $value;
                continue;
            }
            $name = self::RESOURCES[$key] ?? ($key === 'id' ? $idModel : null);
            if ($key === 'riwayatKeuangan') {
                $resources[] = \App\Models\PemasukanKeuangan::find($value) ?? \App\Models\PengeluaranKeuangan::findOrFail($value);
            } elseif ($name && is_scalar($value)) {
                $class = 'App\\Models\\'.$name;
                $resources[] = $class::findOrFail($value);
            }
        }
        if ($includeBody) {
            self::collectBodyResources($request->all(), $resources);
        }
        return $resources;
    }

    private static function collectBodyResources(array $input, array &$resources): void
    {
        foreach ($input as $key => $value) {
            $name = self::RESOURCES[$key] ?? null;
            if ($name && (str_ends_with((string) $key, '_id') || str_ends_with((string) $key, '_ids'))) {
                foreach ((array) $value as $id) {
                    if (!is_string($id) || $id === '') continue;
                    $class = 'App\\Models\\'.$name;
                    $resources[] = $class::findOrFail($id);
                }
            } elseif (is_array($value)) {
                self::collectBodyResources($value, $resources);
            }
        }
    }
}
