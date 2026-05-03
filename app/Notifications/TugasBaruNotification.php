<?php

namespace App\Notifications;

use App\Channels\FcmChannel;
use App\Models\Praktikum;
use App\Models\TugasPraktikum;
use Illuminate\Notifications\Notification;

class TugasBaruNotification extends Notification
{
    public function __construct(
        private readonly TugasPraktikum $tugas,
        private readonly Praktikum $praktikum,
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
        $deadline = \Carbon\Carbon::parse($this->tugas->deadline)
            ->timezone(config('app.timezone', 'Asia/Jakarta'))
            ->translatedFormat('d M Y, H:i');

        $namaPraktikum = $this->praktikum->nama ?: ($this->praktikum->mata_kuliah ?? 'Praktikum');
        return [
            'title' => 'Tugas Baru: ' . $this->tugas->judul_tugas,
            'body'  => "Praktikum {$namaPraktikum} memiliki tugas baru. Deadline: {$deadline}.",
            'type'  => 'tugas_baru',
            'url'   => "/praktikan/tugas/{$this->tugas->id}",
            'data'  => [
                'tugas_id'     => (string) $this->tugas->id,
                'praktikum_id' => (string) $this->praktikum->id,
            ],
        ];
    }
}
