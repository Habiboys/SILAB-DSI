<?php

namespace App\Console\Commands;

use App\Models\JadwalPiket;
use App\Notifications\PiketReminderNotification;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendPiketReminders extends Command
{
    protected $signature = 'piket:send-reminders
                            {--tomorrow : Kirim reminder untuk jadwal besok}';

    protected $description = 'Kirim FCM reminder piket ke pengguna yang bertugas';

    private const HARI_MAP = [
        'Monday'    => 'Senin',
        'Tuesday'   => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday'  => 'Kamis',
        'Friday'    => 'Jumat',
        'Saturday'  => 'Sabtu',
        'Sunday'    => 'Minggu',
    ];

    public function handle(): int
    {
        $isForTomorrow = $this->option('tomorrow');
        $targetDate = $isForTomorrow ? now()->addDay() : now();
        $hari = self::HARI_MAP[$targetDate->dayName];

        $this->info("Mengirim reminder piket untuk hari: {$hari}");

        $jadwalList = JadwalPiket::with(['user.profile', 'kepengurusanLab.laboratorium'])
            ->where('hari', $hari)
            ->whereNotNull('user_id')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('periode_piket')
                    ->whereColumn('periode_piket.kepengurusan_lab_id', 'jadwal_piket.kepengurusan_lab_id')
                    ->where('periode_piket.isactive', true);
            })
            ->get();

        if ($jadwalList->isEmpty()) {
            $this->info("Tidak ada jadwal piket untuk {$hari}.");
            return self::SUCCESS;
        }

        $wa   = new WhatsAppService();
        $lab  = '';
        $sent = 0;

        foreach ($jadwalList as $jadwal) {
            $user = $jadwal->user;
            if (! $user) continue;

            $labName = $jadwal->kepengurusanLab?->laboratorium?->nama ?? 'Laboratorium';
            $hariKet = $isForTomorrow ? 'besok' : 'hari ini';

            // FCM + database notification
            if ($user->fcm_token) {
                $user->notify(new PiketReminderNotification($jadwal, $isForTomorrow));
            }

            // WA notification
            $phone = $user->profile?->no_hp;
            if ($phone) {
                $msg = implode("\n", [
                    'Halo {{nama}},',
                    '',
                    "📅 *Reminder Piket " . ucfirst($hariKet) . "*",
                    '',
                    "Kamu memiliki jadwal piket *{$hariKet}* ({$hari}) di *{$labName}*.",
                    $isForTomorrow ? 'Jangan lupa ya!' : 'Semangat!',
                    '',
                    '_Pesan otomatis dari SILAB._',
                ]);
                $wa->send($phone, $user->name, $msg);
            }

            $this->line("  Terkirim ke: {$user->name}");
            $sent++;
        }

        $this->info("Selesai. Terkirim: {$sent}");

        return self::SUCCESS;
    }
}
