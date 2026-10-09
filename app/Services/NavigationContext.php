<?php

namespace App\Services;

use App\Models\KepengurusanLab;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class NavigationContext
{
    public static function forModel(?Model $model, int $depth = 0): array
    {
        if (!$model || $depth > 4) {
            return [];
        }

        if ($model instanceof KepengurusanLab) {
            return ['lab_id' => (string) $model->laboratorium_id, 'kepengurusan_lab_id' => (string) $model->id];
        }
        if ($model->getAttribute('kepengurusan_lab_id')) {
            $period = $model->relationLoaded('kepengurusanLab') ? $model->getRelation('kepengurusanLab') : KepengurusanLab::find($model->getAttribute('kepengurusan_lab_id'));
            return self::forModel($period, $depth + 1);
        }
        if ($model->getAttribute('laboratorium_id')) {
            return ['lab_id' => (string) $model->getAttribute('laboratorium_id')];
        }

        $relation = match (class_basename($model)) {
            'Kegiatan' => 'proker',
            'TugasPraktikum', 'PertemuanPraktikum', 'Kelas', 'ModulPraktikum', 'AslabPraktikum', 'PraktikanPraktikum' => 'praktikum',
            'PengumpulanTugas' => 'tugasPraktikum',
            'LaporanKegiatan', 'DokumentasiKegiatan', 'KegiatanPeserta' => 'kegiatan',
            'ProkerParameter', 'ProkerDokumentasi', 'ProkerPj' => 'proker',
            'KomponenRubrik', 'NilaiTambahan' => 'tugasPraktikum',
            'DisposisiSurat' => 'suratMasuk',
            default => null,
        };
        return $relation && method_exists($model, $relation) ? self::forModel($model->{$relation}, $depth + 1) : [];
    }

    public static function forRequest(Request $request): array
    {
        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if ($parameter instanceof Model && ($context = self::forModel($parameter))) {
                return $context;
            }
        }
        $period = $request->input('kepengurusan_lab_id');
        if ($period && is_string($period)) {
            if ($model = KepengurusanLab::find($period)) {
                return self::forModel($model);
            }
        }
        return array_filter($request->only(['lab_id', 'kepengurusan_lab_id']), fn ($value) => is_scalar($value) && $value !== '');
    }
}
