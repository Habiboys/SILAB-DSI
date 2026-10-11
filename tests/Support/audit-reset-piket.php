<?php

require __DIR__.'/AuditEnvironment.php';

$fixture = json_decode(file_get_contents(dirname(__DIR__, 2).'/.audit/fixture.json'), true, flags: JSON_THROW_ON_ERROR);
$user = App\Models\User::where('email', 'asisten@audit.test')->sole();
$schedules = App\Models\JadwalPiket::where('kepengurusan_lab_id', $fixture['period_id'])
    ->whereHas('kepengurusanUser', fn ($query) => $query->where('user_id', $user->id))->get();
Illuminate\Support\Facades\DB::transaction(function () use ($schedules) {
    foreach ($schedules as $schedule) {
        $schedule->absensi()->delete();
        $schedule->delete();
    }
});
echo 'Reset only isolated audit assistant schedules: '.$schedules->count().PHP_EOL;
