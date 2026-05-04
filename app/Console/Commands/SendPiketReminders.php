<?php

namespace App\Console\Commands;

use App\Models\JadwalPiket;
use App\Notifications\PiketReminderNotification;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        Log::info("[PiketReminder] Mulai — hari: {$hari}, mode: " . ($isForTomorrow ? 'besok' : 'hari ini'));

        $jadwalList = JadwalPiket::with(['user.profile', 'kepengurusanLab.laboratorium'])
            ->where('hari', $hari)
            ->whereNotNull('user_id')
            ->whereHas('kepengurusanLab', fn($q) => $q->where('is_active', true))
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('periode_piket')
                    ->whereColumn('periode_piket.kepengurusan_lab_id', 'jadwal_piket.kepengurusan_lab_id')
                    ->where('periode_piket.isactive', true);
            })
            ->get();

        Log::info("[PiketReminder] Jadwal ditemukan: {$jadwalList->count()}");

        if ($jadwalList->isEmpty()) {
            $this->info("Tidak ada jadwal piket untuk {$hari}.");
            Log::info("[PiketReminder] Tidak ada jadwal, selesai.");
            return self::SUCCESS;
        }

        $wa   = new WhatsAppService();
        $sent = 0;

        foreach ($jadwalList as $jadwal) {
            $user = $jadwal->user;
            if (! $user) {
                Log::info("[PiketReminder] Jadwal ID {$jadwal->id} tidak punya user, dilewati.");
                continue;
            }

            $labName = $jadwal->kepengurusanLab?->laboratorium?->nama ?? 'Laboratorium';
            $hariKet = $isForTomorrow ? 'besok' : 'hari ini';

            // FCM + database notification
            if ($user->fcm_token) {
                $user->notify(new PiketReminderNotification($jadwal, $isForTomorrow));
                Log::info("[PiketReminder] FCM terkirim ke {$user->name}");
            } else {
                Log::info("[PiketReminder] {$user->name} tidak punya FCM token, FCM dilewati.");
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
            } else {
                Log::info("[PiketReminder] {$user->name} tidak punya no_hp, WA dilewati.");
            }

            $this->line("  Terkirim ke: {$user->name}");
            $sent++;
        }

        $this->info("Selesai. Terkirim: {$sent}");
        Log::info("[PiketReminder] Selesai. Total terkirim: {$sent}");

        return self::SUCCESS;
    }
}
