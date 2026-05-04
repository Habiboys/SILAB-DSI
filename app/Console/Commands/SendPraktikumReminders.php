<?php

namespace App\Console\Commands;

use App\Models\PertemuanPraktikum;
use App\Models\Praktikan;
use App\Notifications\PraktikumHariIniNotification;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendPraktikumReminders extends Command
{
    protected $signature = 'praktikum:send-reminders';
    protected $description = 'Kirim reminder FCM & WA ke asisten dan praktikan yang ada pertemuan hari ini';

    public function handle(): int
    {
        $today = now()->toDateString();
        $wa    = new WhatsAppService();
        $tz    = config('app.timezone', 'Asia/Jakarta');

        /** @var \Illuminate\Database\Eloquent\Collection<int, PertemuanPraktikum> $pertemuanList */
        $pertemuanList = PertemuanPraktikum::with([
            'kelas.praktikum',
        ])
            ->whereDate('tanggal', $today)
            ->whereHas('kelas.praktikum.kepengurusanLab', fn($q) => $q->where('is_active', true))
            ->get();

        if ($pertemuanList->isEmpty()) {
            $this->info("Tidak ada pertemuan praktikum hari ini ({$today}).");
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$pertemuanList->count()} pertemuan hari ini.");

        $totalAslab    = 0;
        $totalPraktikan = 0;

        foreach ($pertemuanList as $pertemuan) {
            $kelas     = $pertemuan->kelas;
            $praktikum = $kelas?->praktikum;

            if (! $praktikum) continue;

            $waktu = Carbon::parse($pertemuan->tanggal)->timezone($tz)->format('H:i');
            $judul = $pertemuan->judul ?? '';
            $kelasNama = $kelas->nama_kelas ?? '';

            // ── Aslab ────────────────────────────────────────────────────────
            $aslabAll = $praktikum->aslab()->with('profile')->get();

            // FCM
            $aslabFcm = $aslabAll->filter(fn($u) => $u->fcm_token);
            if ($aslabFcm->isNotEmpty()) {
                Notification::send($aslabFcm, new PraktikumHariIniNotification($pertemuan, 'asisten'));
            }

            // WA
            $aslabContacts = $aslabAll
                ->filter(fn($u) => $u->profile?->no_hp)
                ->map(fn($u) => ['phone' => $u->profile->no_hp, 'name' => $u->name])
                ->values()
                ->toArray();

            if (!empty($aslabContacts)) {
                $msgAslab = $this->buildMessage('asisten', $praktikum->nama, $kelasNama, $judul, $waktu);
                $wa->sendBulk($aslabContacts, $msgAslab);
            }

            $totalAslab += $aslabAll->count();

            // ── Praktikan ────────────────────────────────────────────────────
            $praktikanList = Praktikan::whereNotNull('user_id')
                ->whereHas('praktikums', function ($q) use ($praktikum, $kelas) {
                    $q->where('praktikan_praktikum.praktikum_id', $praktikum->id)
                      ->where('praktikan_praktikum.kelas_id', $kelas->id);
                })
                ->with('user.profile')
                ->get();

            // FCM
            $praktikanFcm = $praktikanList
                ->pluck('user')
                ->filter(fn($u) => $u?->fcm_token);

            if ($praktikanFcm->isNotEmpty()) {
                Notification::send($praktikanFcm, new PraktikumHariIniNotification($pertemuan, 'praktikan'));
            }

            // WA
            $praktikanContacts = $praktikanList
                ->map(fn($p) => [
                    'phone' => $p->no_hp ?: $p->user?->profile?->no_hp,
                    'name'  => $p->nama  ?: $p->user?->name,
                ])
                ->filter(fn($c) => $c['phone'] && $c['name'])
                ->values()
                ->toArray();

            if (!empty($praktikanContacts)) {
                $msgPraktikan = $this->buildMessage('praktikan', $praktikum->nama, $kelasNama, $judul, $waktu);
                $wa->sendBulk($praktikanContacts, $msgPraktikan);
            }

            $totalPraktikan += $praktikanList->count();

            $this->line("  [{$praktikum->nama} - {$kelasNama}] \"{$judul}\" → {$aslabAll->count()} aslab, {$praktikanList->count()} praktikan");
        }

        $this->info("Selesai. Aslab: {$totalAslab}, Praktikan: {$totalPraktikan}");
        return self::SUCCESS;
    }

    private function buildMessage(string $peran, string $namaPraktikum, string $kelas, string $judul, string $waktu): string
    {
        $header   = $peran === 'asisten' ? '🔬 *Kamu Bertugas Hari Ini*' : '🔬 *Praktikum Hari Ini*';
        $penutup  = $peran === 'asisten' ? 'Semangat bertugas! 💪' : 'Semangat belajarnya! 📚';
        $kelasStr = $kelas ? " - {$kelas}" : '';

        return implode("\n", [
            'Halo {{nama}},',
            '',
            $header,
            '',
            "*{$namaPraktikum}*{$kelasStr}",
            "Pertemuan: \"{$judul}\"",
            "Pukul: {$waktu}",
            '',
            $penutup,
            '',
            '_Pesan otomatis dari SILAB._',
        ]);
    }
}
