<?php

namespace App\Console\Commands;

use App\Models\Praktikan;
use App\Models\TugasPraktikum;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDeadlineReminders extends Command
{
    protected $signature = 'tugas:send-deadline-reminders';
    protected $description = 'Kirim WA reminder deadline tugas ke praktikan (H-3, H-1, H-0)';

    public function handle(): int
    {
        $wa   = new WhatsAppService();
        $tz   = config('app.timezone', 'Asia/Jakarta');
        $today = now()->timezone($tz);

        foreach ([3, 1, 0] as $daysLeft) {
            $targetDate = $today->copy()->addDays($daysLeft)->toDateString();

            $tugasList = TugasPraktikum::with(['kelas.praktikum'])
                ->where('status', 'aktif')
                ->whereDate('deadline', $targetDate)
                ->get();

            if ($tugasList->isEmpty()) {
                $this->line("H-{$daysLeft}: tidak ada tugas deadline {$targetDate}.");
                continue;
            }

            $this->info("H-{$daysLeft}: {$tugasList->count()} tugas (deadline {$targetDate}).");

            foreach ($tugasList as $tugas) {
                $praktikum = $tugas->kelas?->praktikum;
                if (!$praktikum) continue;

                $praktikanList = Praktikan::whereNotNull('user_id')
                    ->whereHas('praktikums', function ($q) use ($praktikum, $tugas) {
                        $q->where('praktikan_praktikum.praktikum_id', $praktikum->id);
                        if ($tugas->kelas_id) {
                            $q->where('praktikan_praktikum.kelas_id', $tugas->kelas_id);
                        }
                    })
                    ->with('user.profile')
                    ->get();

                $deadline = Carbon::parse($tugas->deadline)
                    ->timezone($tz)
                    ->translatedFormat('d M Y, H:i');

                $message = $this->buildMessage($daysLeft, $tugas->judul_tugas, $praktikum->nama, $deadline);

                $contacts = $praktikanList
                    ->map(fn($p) => [
                        'phone' => $p->no_hp ?: $p->user?->profile?->no_hp,
                        'name'  => $p->nama  ?: $p->user?->name,
                    ])
                    ->filter(fn($c) => $c['phone'] && $c['name'])
                    ->values()
                    ->toArray();

                if (empty($contacts)) {
                    $this->line("  [{$tugas->judul_tugas}] Tidak ada nomor WA terdaftar.");
                    continue;
                }

                $wa->sendBulk($contacts, $message);
                $count = count($contacts);
                $this->line("  [{$tugas->judul_tugas}] WA terkirim ke {$count} praktikan.");
            }
        }

        $this->info('Selesai.');
        return self::SUCCESS;
    }

    private function buildMessage(int $daysLeft, string $judul, string $praktikum, string $deadline): string
    {
        return match ($daysLeft) {
            3 => implode("\n", [
                'Halo {{nama}},',
                '',
                '⏰ *Reminder Deadline - 3 Hari Lagi*',
                '',
                "*{$judul}*",
                "Praktikum: {$praktikum}",
                "Deadline: {$deadline}",
                '',
                'Jangan lupa kerjakan dan kumpulkan tepat waktu!',
                '',
                '_Pesan otomatis dari SILAB._',
            ]),
            1 => implode("\n", [
                'Halo {{nama}},',
                '',
                '⚠️ *Deadline Besok!*',
                '',
                "*{$judul}*",
                "Praktikum: {$praktikum}",
                "Deadline: {$deadline}",
                '',
                'Segera kumpulkan tugasmu sebelum terlambat!',
                '',
                '_Pesan otomatis dari SILAB._',
            ]),
            default => implode("\n", [
                'Halo {{nama}},',
                '',
                '🚨 *Deadline HARI INI!*',
                '',
                "*{$judul}*",
                "Praktikum: {$praktikum}",
                "Deadline: {$deadline}",
                '',
                'Ini hari terakhir pengumpulan, jangan sampai terlambat!',
                '',
                '_Pesan otomatis dari SILAB._',
            ]),
        };
    }
}
