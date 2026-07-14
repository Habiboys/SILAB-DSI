<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AkunBaruNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $password,
        private readonly string $email,
    ) {}

    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $appName = config('app.name', 'SILAB');
        $loginUrl = config('app.url') . '/login';

        return (new MailMessage)
            ->subject("Akun {$appName} Anda telah dibuat")
            ->greeting("Halo {$notifiable->name},")
            ->line("Akun {$appName} Anda telah berhasil dibuat.")
            ->line("Berikut adalah kredensial login Anda:")
            ->line("**Email:** {$this->email}")
            ->line("**Password:** {$this->password}")
            ->action('Login Sekarang', $loginUrl)
            ->line("Setelah login, Anda akan diminta untuk mengganti password dengan password baru Anda sendiri.")
            ->line("Jangan bagikan password ini kepada siapa pun.");
    }
}
