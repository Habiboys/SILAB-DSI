<?php

namespace App\Notifications;

use App\Channels\FcmChannel;
use App\Models\Kegiatan;
use Illuminate\Notifications\Notification;

class KegiatanPesertaNotification extends Notification
{
    public function __construct(
        private readonly Kegiatan $kegiatan,
        private readonly string $peran,
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
        $peranLabel = $this->peran === 'panitia' ? 'Panitia' : 'Peserta';
        $tanggal = \Carbon\Carbon::parse($this->kegiatan->tanggal_mulai)
            ->translatedFormat('d M Y');

        return [
            'title' => "Kamu ditambahkan ke Kegiatan",
            'body'  => "Kamu terdaftar sebagai {$peranLabel} di kegiatan \"{$this->kegiatan->nama_kegiatan}\" ({$tanggal}).",
            'type'  => 'kegiatan_peserta',
            'url'   => '/kegiatan/' . $this->kegiatan->id,
            'data'  => ['kegiatan_id' => (string) $this->kegiatan->id],
        ];
    }
}
