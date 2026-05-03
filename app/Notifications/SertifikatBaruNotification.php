<?php

namespace App\Notifications;

use App\Channels\FcmChannel;
use App\Models\Sertifikat;
use Illuminate\Notifications\Notification;

class SertifikatBaruNotification extends Notification
{
    public function __construct(private readonly Sertifikat $sertifikat) {}

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
        $konteks = match ($this->sertifikat->jenis_sertifikat) {
            'praktikan'    => 'Praktikan - ' . ($this->sertifikat->praktikum?->nama ?? ''),
            'asisten'      => 'Asisten - ' . ($this->sertifikat->praktikum?->nama ?? ''),
            'kepengurusan' => 'Kepengurusan',
            default        => ucfirst($this->sertifikat->jenis_sertifikat),
        };

        return [
            'title' => 'Sertifikat Kamu Sudah Tersedia',
            'body'  => "Sertifikat {$konteks} (No. {$this->sertifikat->nomor_sertifikat}) sudah bisa diunduh.",
            'type'  => 'sertifikat_baru',
            'url'   => '/sertifikat',
            'data'  => ['sertifikat_id' => (string) $this->sertifikat->id],
        ];
    }
}
