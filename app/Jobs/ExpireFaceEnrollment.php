<?php

namespace App\Jobs;

use App\Models\FaceEnrollment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ExpireFaceEnrollment implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $enrollmentId)
    {
    }

    public function handle(): void
    {
        $path = DB::transaction(function () {
            $enrollment = FaceEnrollment::whereKey($this->enrollmentId)->lockForUpdate()->first();
            if (!$enrollment || $enrollment->status !== 'pending' || $enrollment->expires_at->isFuture()) return null;

            $path = $enrollment->preview_path;
            $enrollment->update(['status' => 'expired', 'embeddings' => null, 'preview_path' => null]);
            return $path;
        });
        if ($path) Storage::disk('local')->delete($path);
    }
}
