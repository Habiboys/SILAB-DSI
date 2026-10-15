<?php

namespace App\Services;

use App\Models\NominalKas;
use Illuminate\Support\Facades\DB;

class NominalKasSettings
{
    public function save(string $kepengurusanId, array $attributes): NominalKas
    {
        return DB::transaction(function () use ($kepengurusanId, $attributes) {
            $this->consolidate($kepengurusanId);

            return NominalKas::updateOrCreate(['kepengurusan_lab_id' => $kepengurusanId], $attributes);
        });
    }

    public function consolidate(string $kepengurusanId): void
    {
        DB::transaction(function () use ($kepengurusanId) {
            // Serialize concurrent settings changes even when no nominal record exists yet.
            DB::table('kepengurusan_lab')->where('id', $kepengurusanId)->lockForUpdate()->first();
            $records = DB::table('nominal_kas')->where('kepengurusan_lab_id', $kepengurusanId)
                ->orderByDesc('is_active')->orderByDesc('updated_at')->orderByDesc('created_at')
                ->orderBy('id')->lockForUpdate()->get();
            if ($records->count() < 2) return;

            $keepId = $records->first()->id;
            $ids = $records->pluck('id');
            DB::table('pemasukan_keuangan')->whereIn('nominal_kas_id', $ids)
                ->where('kepengurusan_lab_id', $kepengurusanId)->update(['nominal_kas_id' => $keepId]);

            // Preserve bills and payment references before removing duplicate settings.
            $bills = DB::table('tagihan_kas')->whereIn('nominal_kas_id', $ids)
                ->orderByRaw('CASE WHEN nominal_kas_id = ? THEN 0 ELSE 1 END', [$keepId])
                ->orderBy('id')->lockForUpdate()->get()->groupBy('user_id');
            foreach ($bills as $userBills) {
                $bill = $userBills->first();
                $billIds = $userBills->pluck('id');
                DB::table('pemasukan_keuangan')->whereIn('tagihan_kas_id', $billIds)
                    ->update(['tagihan_kas_id' => $bill->id]);
                $total = $userBills->sum('total_tagihan');
                $paid = DB::table('pemasukan_keuangan')->where('tagihan_kas_id', $bill->id)->sum('nominal');
                DB::table('tagihan_kas')->whereIn('id', $billIds)->where('id', '!=', $bill->id)->delete();
                DB::table('tagihan_kas')->where('id', $bill->id)->update([
                    'nominal_kas_id' => $keepId, 'total_tagihan' => $total,
                    'sudah_dibayar' => $paid, 'status' => $paid >= $total ? 'lunas' : 'belum_lunas',
                ]);
            }
            DB::table('nominal_kas')->whereIn('id', $ids)->where('id', '!=', $keepId)->delete();
        });
    }
}
