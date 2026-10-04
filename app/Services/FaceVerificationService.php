<?php

namespace App\Services;

use App\Models\FaceChallenge;
use App\Models\FaceEnrollment;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class FaceVerificationService
{
    public function issueChallenge(User $user, string $purpose): FaceChallenge
    {
        if (!in_array($purpose, ['enroll', 'checkin', 'checkout'], true)) {
            throw ValidationException::withMessages(['face' => 'Tujuan verifikasi tidak valid.']);
        }

        return FaceChallenge::create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'actions' => ['blink', random_int(0, 1) ? 'left' : 'right'],
            'expires_at' => now()->addSeconds(90),
        ]);
    }

    public function analyze(User $user, string $purpose, string $challengeId, array $frames, ?string $kepengurusanLabId = null): array
    {
        if (count($frames) < 12 || count($frames) > 48) {
            throw ValidationException::withMessages(['face' => 'Jumlah frame wajah tidak valid.']);
        }
        foreach ($frames as $frame) {
            if (!is_string($frame) || strlen($frame) > 550000 || !str_starts_with($frame, 'data:image/jpeg;base64,')) {
                throw ValidationException::withMessages(['face' => 'Format rekaman wajah tidak valid.']);
            }
        }
        $consumed = FaceChallenge::whereKey($challengeId)
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->update(['consumed_at' => now()]);

        if ($consumed !== 1) {
            throw ValidationException::withMessages(['face' => 'Tantangan wajah kedaluwarsa atau sudah dipakai. Ulangi perekaman.']);
        }

        $challenge = FaceChallenge::findOrFail($challengeId);
        $enrollment = null;
        $path = '/v1/enroll';
        $payload = ['actions' => $challenge->actions, 'frames' => $frames];

        if ($purpose !== 'enroll') {
            $enrollment = FaceEnrollment::where('user_id', $user->id)
                ->where('status', 'approved')
                ->where('kepengurusan_lab_id', $kepengurusanLabId)
                ->latest('reviewed_at')
                ->first();
            if (!$enrollment || !$enrollment->embeddings) {
                throw ValidationException::withMessages(['face' => 'Wajah belum terdaftar dan disetujui admin.']);
            }
            $path = '/v1/verify';
            $payload['embeddings'] = $enrollment->embeddings;
        }

        $token = config('services.face.token');
        if (!$token) {
            throw ValidationException::withMessages(['face' => 'Layanan wajah belum dikonfigurasi. Hubungi admin untuk input manual.']);
        }

        try {
            $response = Http::withToken($token)
                ->connectTimeout(3)
                ->timeout(45)
                ->post(rtrim(config('services.face.url'), '/') . $path, $payload);
        } catch (ConnectionException $e) {
            throw ValidationException::withMessages(['face' => 'Layanan wajah tidak tersedia. Hubungi admin untuk input manual.']);
        }

        $data = $response->json();
        if (!$response->successful() || !is_array($data) || ($data['success'] ?? false) !== true) {
            $reason = $data['reason'] ?? 'service_error';
            $message = match ($reason) {
                'liveness_failed' => 'Gerakan wajah tidak sesuai. Ulangi perekaman.',
                'face_mismatch' => 'Wajah tidak cocok dengan data yang disetujui.',
                'face_count' => 'Pastikan hanya satu wajah terlihat di kamera.',
                'not_enrolled' => 'Wajah belum terdaftar.',
                default => 'Verifikasi wajah gagal. Ulangi perekaman atau hubungi admin.',
            };
            throw ValidationException::withMessages(['face' => $message]);
        }

        $index = $data['evidence_index'] ?? null;
        if (!is_int($index) || !isset($frames[$index])) {
            throw ValidationException::withMessages(['face' => 'Foto hasil verifikasi tidak valid.']);
        }
        $parts = explode(',', $frames[$index], 2);
        $image = count($parts) === 2 ? base64_decode($parts[1], true) : false;
        if ($image === false || strlen($image) > 400000 || !str_starts_with($parts[0], 'data:image/jpeg;base64')) {
            throw ValidationException::withMessages(['face' => 'Foto hasil verifikasi tidak valid.']);
        }

        if ($purpose === 'enroll') {
            $vectors = $data['embeddings'] ?? null;
            if (!is_array($vectors) || count($vectors) < 5 || count($vectors) > 10) {
                throw ValidationException::withMessages(['face' => 'Vektor wajah tidak valid.']);
            }
            foreach ($vectors as $vector) {
                if (!is_array($vector) || count($vector) !== 512) {
                    throw ValidationException::withMessages(['face' => 'Vektor wajah tidak valid.']);
                }
            }
        } elseif (!is_numeric($data['similarity'] ?? null)
            || $data['similarity'] < (float) config('services.face.threshold') || $data['similarity'] > 1) {
            throw ValidationException::withMessages(['face' => 'Hasil kecocokan wajah tidak valid.']);
        }

        return [
            'enrollment' => $enrollment,
            'embeddings' => $data['embeddings'] ?? null,
            'score' => $data['similarity'] ?? null,
            'image' => $image,
        ];
    }
}
