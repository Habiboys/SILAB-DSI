<?php

namespace App\Services;

use App\Models\{Absensi, JadwalPiket, PeriodePiket};
use Carbon\CarbonImmutable;

class PiketAttendanceSummary
{
    public static function forUser(PeriodePiket $period, string $userId): array
    {
        $schedules = JadwalPiket::withTrashed()->where('kepengurusan_lab_id', $period->kepengurusan_lab_id)
            ->whereHas('kepengurusanUser', fn ($query) => $query->where('user_id', $userId))->get();
        $weekdays = ['senin' => 1, 'selasa' => 2, 'rabu' => 3, 'kamis' => 4, 'jumat' => 5, 'sabtu' => 6, 'minggu' => 7];
        $start = CarbonImmutable::parse($period->tanggal_mulai)->startOfDay();
        $end = CarbonImmutable::parse($period->tanggal_selesai)->startOfDay()->min(CarbonImmutable::yesterday());
        $expected = [];
        foreach ($schedules as $schedule) {
            $weekday = $weekdays[strtolower($schedule->hari)] ?? null;
            if (!$weekday) continue;
            $from = $schedule->created_at ? $start->max(CarbonImmutable::parse($schedule->created_at)->startOfDay()) : $start;
            $until = $schedule->deleted_at ? $end->min(CarbonImmutable::parse($schedule->deleted_at)->startOfDay()) : $end;
            for ($date = $from; $date->lte($until); $date = $date->addDay()) {
                if ($date->dayOfWeekIso === $weekday) $expected[$date->toDateString()] = true;
            }
        }
        $attended = Absensi::whereIn('jadwal_piket_id', $schedules->pluck('id'))
            ->whereIn('tanggal', array_keys($expected))->whereNotNull('jam_keluar')->where('verification_status', 'approved')
            ->get()->pluck('tanggal')->map(fn ($date) => $date->toDateString())->unique()->count();
        return ['total_jadwal' => count($expected), 'hadir' => $attended, 'tidak_hadir' => count($expected) - $attended];
    }
}
