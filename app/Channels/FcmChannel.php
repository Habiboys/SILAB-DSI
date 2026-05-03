<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;

class FcmChannel
{
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toFcm')) {
            return;
        }

        $token = $notifiable->fcm_token;
        if (! $token) {
            return;
        }

        try {
            $messaging = app(Messaging::class);

            // toFcm() mengembalikan array ['title', 'body', 'data']
            $payload = $notification->toFcm($notifiable);

            $message = CloudMessage::new()
                ->withToken($token)
                ->withNotification(FcmNotification::create($payload['title'], $payload['body']))
                ->withData($payload['data'] ?? []);

            $messaging->send($message);
            Log::info('FCM send success', [
                'user_id' => $notifiable->id,
                'token_prefix' => substr($token, 0, 20),
                'title'   => $payload['title'],
            ]);
        } catch (\Throwable $e) {
            Log::error('FCM send failed', [
                'user_id' => $notifiable->id,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
