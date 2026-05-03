<?php

namespace App\Notifications;

use App\Channels\FcmChannel;
use App\Models\PertemuanPraktikum;
use Illuminate\Notifications\Notification;

class PraktikumHariIniNotification extends Notification
{
    public function __construct(
        private readonly PertemuanPraktikum $pertemuan,
        private readonly string $peran, // 'asisten' | 'praktikan'
    ) {}

    public function via(mixed $notifiable): array
    {
        return [FcmChannel::class, 'database'];
    }

    public function toFcm(mixed $notifiable): array
    {
        return $this->buildPayload();
    }

    public function toDatabase(mixed $notifiable): array
    {
        return $this->buildPayload();
    }

    private function buildPayload(): array
    {
        $praktikum = $this->pertemuan->kelas?->praktikum;
        $namaPraktikum = $praktikum?->nama ?? 'Praktikum';
        $waktu = \Carbon\Carbon::parse($this->pertemuan->tanggal)
            ->timezone(config('app.timezone', 'Asia/Jakarta'))
            ->format('H:i');
        $kelas = $this->pertemuan->kelas?->nama_kelas ?? '';

        $title = $this->peran === 'asisten'
            ? "Kamu Bertugas Hari Ini"
            : "Praktikum Hari Ini";

        $body = "{$namaPraktikum}" . ($kelas ? " - {$kelas}" : '') . ". Pertemuan: \"{$this->pertemuan->judul}\". Pukul {$waktu}.";

        return [
            'title' => $title,
            'body'  => $body,
            'type'  => 'praktikum_hari_ini',
            'url'   => $praktikum ? "/praktikum/{$praktikum->id}" : '/dashboard',
            'data'  => [
                'pertemuan_id' => (string) $this->pertemuan->id,
                'praktikum_id' => (string) ($praktikum?->id ?? ''),
            ],
        ];
    }
}
