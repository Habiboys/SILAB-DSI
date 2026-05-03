<?php

namespace App\Notifications;

use App\Channels\FcmChannel;
use App\Models\JadwalPiket;
use Illuminate\Notifications\Notification;

class PiketReminderNotification extends Notification
{
    public function __construct(
        private readonly JadwalPiket $jadwal,
        private readonly bool $isForTomorrow = false,
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
        $hari = $this->jadwal->hari;
        $lab  = $this->jadwal->kepengurusanLab?->laboratorium?->nama ?? 'Laboratorium';

        if ($this->isForTomorrow) {
            $title = "Reminder: Piket Besok ({$hari})";
            $body  = "Kamu memiliki jadwal piket besok ({$hari}) di {$lab}. Jangan lupa!";
        } else {
            $title = "Reminder: Piket Hari Ini ({$hari})";
            $body  = "Kamu memiliki jadwal piket hari ini ({$hari}) di {$lab}. Semangat!";
        }

        return [
            'title' => $title,
            'body'  => $body,
            'type'  => 'piket_reminder',
            'url'   => '/piket/absensi',
            'data'  => ['hari' => $hari, 'lab' => $lab],
        ];
    }
}
