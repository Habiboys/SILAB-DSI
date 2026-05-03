<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private ?string $apiKey;
    private string  $deviceId;
    private string  $baseUrl;

    public function __construct()
    {
        $this->apiKey   = config('services.waway.key');
        $this->deviceId = (string) config('services.waway.device_id', '1');
        $this->baseUrl  = rtrim(config('services.waway.base_url', 'https://apiwaway.neotelemetri.id'), '/');
    }

    /**
     * Kirim pesan ke satu nomor WA.
     */
    public function send(string $phone, string $name, string $message): bool
    {
        if (!$this->apiKey) {
            Log::info('[WhatsApp] send skipped: WAWAY_API_KEY not set.');
            return false;
        }

        $phone = $this->normalizePhone($phone);
        if (!$phone) return false;

        $message = str_replace('{{nama}}', $name, $message);

        try {
            $res = Http::withHeader('x-api-key', $this->apiKey)
                ->post("{$this->baseUrl}/api/devices/{$this->deviceId}/send", [
                    'phone'   => $phone,
                    'message' => $message,
                ]);

            if (!$res->successful()) {
                Log::warning('[WhatsApp] Gagal send ke ' . $phone, ['body' => $res->body()]);
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            Log::error('[WhatsApp] Exception send: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim pesan ke banyak nomor sekaligus.
     * $contacts = [['phone' => '628...', 'name' => 'Budi'], ...]
     * Gunakan {{nama}} dalam $message untuk personalisasi.
     */
    public function sendBulk(array $contacts, string $message): bool
    {
        if (!$this->apiKey) {
            Log::info('[WhatsApp] sendBulk skipped: WAWAY_API_KEY not set.');
            return false;
        }
        if (empty($contacts)) {
            Log::info('[WhatsApp] sendBulk skipped: no contacts with phone number.');
            return false;
        }

        $anySuccess = false;
        foreach ($contacts as $c) {
            $phone = $this->normalizePhone($c['phone'] ?? '');
            $name  = $c['name'] ?? '';
            if (!$phone) continue;

            $personalizedMessage = str_replace('{{nama}}', $name, $message);

            try {
                $res = Http::withHeader('x-api-key', $this->apiKey)
                    ->post("{$this->baseUrl}/api/devices/{$this->deviceId}/send", [
                        'phone'   => $phone,
                        'message' => $personalizedMessage,
                    ]);

                if ($res->successful()) {
                    Log::info('[WhatsApp] Terkirim ke ' . $phone . ' (' . $name . ')');
                    $anySuccess = true;
                } else {
                    Log::warning('[WhatsApp] Gagal send ke ' . $phone, ['body' => $res->body()]);
                }
            } catch (\Throwable $e) {
                Log::error('[WhatsApp] Exception send ke ' . $phone . ': ' . $e->getMessage());
            }
        }

        return $anySuccess;
    }

    /**
     * Normalisasi nomor: 0812 → 62812, +6281 → 6281
     */
    public function normalizePhone(string $phone): ?string
    {
        $phone = preg_replace('/\D/', '', $phone);
        if (empty($phone) || strlen($phone) < 9) return null;

        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }
}
