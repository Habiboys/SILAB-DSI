<?php

namespace App\Http\Controllers;

use App\Models\FaceEnrollment;
use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\User;
use App\Jobs\ExpireFaceEnrollment;
use App\Services\FaceVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class FaceEnrollmentController extends Controller
{
    private function activeLabId(User $user): string
    {
        $id = session('active_kepengurusan_lab_id');
        if ($id && KepengurusanUser::where('user_id', $user->id)->where('kepengurusan_lab_id', $id)->where('is_active', true)->exists()) {
            \App\Services\KepengurusanAccess::assertWritable(KepengurusanLab::find($id));
            return (string) $id;
        }
        $ids = KepengurusanUser::where('user_id', $user->id)->where('is_active', true)
            ->whereHas('kepengurusanLab', fn ($query) => $query->where('is_active', true))
            ->pluck('kepengurusan_lab_id')->unique();
        if ($ids->count() === 1) return (string) $ids->first();
        throw ValidationException::withMessages(['face' => 'Pilih kepengurusan aktif sebelum mendaftarkan wajah.']);
    }

    private function mayReview(User $reviewer, FaceEnrollment $enrollment): bool
    {
        if ($reviewer->hasRole('superadmin')) return true;
        if (!$reviewer->hasRole('admin')) return false;
        $labId = KepengurusanLab::whereKey($enrollment->kepengurusan_lab_id)->value('laboratorium_id');
        return $labId && $reviewer->hasPermissionInLab('absensi.verify', $labId);
    }

    private function expirePending(): void
    {
        FaceEnrollment::where('status', 'pending')->where('expires_at', '<=', now())
            ->pluck('id')->each(fn ($id) => (new ExpireFaceEnrollment($id))->handle());
    }

    public function index(Request $request)
    {
        $this->expirePending();
        $period = \App\Services\KepengurusanAccess::selected($request);
        if ($period && !$period->is_active) {
            $labId = $period->id;
        } else {
            try {
                $labId = $this->activeLabId($request->user());
            } catch (ValidationException $e) {
                $labId = null;
            }
        }
        $latest = $labId ? FaceEnrollment::where('user_id', $request->user()->id)
            ->where('kepengurusan_lab_id', $labId)->latest()->first() : null;
        $approved = $labId && FaceEnrollment::where('user_id', $request->user()->id)
            ->where('kepengurusan_lab_id', $labId)->where('status', 'approved')->exists();
        $reviewLabId = $request->user()->getCurrentLab()['laboratorium']->id ?? null;
        return Inertia::render('Piket/Wajah', [
            'enrollment' => $latest?->only(['id', 'status', 'created_at', 'review_note']),
            'approved' => $approved,
            'hasActiveLab' => (bool) $labId && (!$period || $period->is_active),
            'canReviewFaces' => $request->user()->hasRole('superadmin') || ($request->user()->hasRole('admin')
                && $reviewLabId && $request->user()->hasPermissionInLab('absensi.verify', $reviewLabId)),
        ]);
    }

    public function challenge(Request $request, FaceVerificationService $face)
    {
        $validated = $request->validate(['purpose' => 'required|in:enroll,checkin,checkout']);
        if ($validated['purpose'] === 'enroll') {
            $this->activeLabId($request->user());
        } elseif (!FaceEnrollment::where('user_id', $request->user()->id)
            ->where('kepengurusan_lab_id', $this->activeLabId($request->user()))
            ->where('status', 'approved')->exists()) {
            throw ValidationException::withMessages(['face' => 'Wajah belum terdaftar dan disetujui admin.']);
        }
        $challenge = $face->issueChallenge($request->user(), $validated['purpose']);
        return response()->json(['id' => $challenge->id, 'actions' => $challenge->actions, 'expires_at' => $challenge->expires_at]);
    }

    public function enroll(Request $request, FaceVerificationService $face)
    {
        $validated = $request->validate([
            'challenge_id' => 'required|uuid',
            'frames' => 'required|array|min:12|max:48',
            'frames.*' => 'required|string|max:550000',
        ]);
        $this->expirePending();
        $user = $request->user();
        $labId = $this->activeLabId($user);
        if (FaceEnrollment::where('user_id', $user->id)->where('kepengurusan_lab_id', $labId)->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['face' => 'Pendaftaran sebelumnya masih menunggu persetujuan admin.']);
        }
        $result = $face->analyze($user, 'enroll', $validated['challenge_id'], $validated['frames']);
        $path = 'face-enrollments/' . $user->id . '/' . $validated['challenge_id'] . '.jpg';
        if (!Storage::disk('local')->put($path, $result['image'])) {
            throw ValidationException::withMessages(['face' => 'Foto pendaftaran gagal disimpan.']);
        }
        try {
            $enrollment = DB::transaction(function () use ($user, $labId, $path, $result) {
                User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                if (FaceEnrollment::where('user_id', $user->id)->where('status', 'pending')->exists()) {
                    throw ValidationException::withMessages(['face' => 'Pendaftaran sebelumnya masih menunggu persetujuan admin.']);
                }
                return FaceEnrollment::create([
                    'user_id' => $user->id,
                    'kepengurusan_lab_id' => $labId,
                    'status' => 'pending',
                    'embeddings' => $result['embeddings'],
                    'preview_path' => $path,
                    'expires_at' => now()->addDays(7),
                ]);
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
        ExpireFaceEnrollment::dispatch($enrollment->id)->delay($enrollment->expires_at);
        return response()->json(['success' => true]);
    }

    public function review(Request $request)
    {
        abort_unless($request->user()->hasRole(['admin', 'superadmin']), 403);
        $this->expirePending();
        $query = FaceEnrollment::with(['user:id,name,email', 'kepengurusanLab'])->where('status', 'pending');
        if (!$request->user()->hasRole('superadmin')) {
            $labId = $request->user()->getCurrentLab()['laboratorium']->id ?? null;
            abort_unless($labId && $request->user()->hasPermissionInLab('absensi.verify', $labId), 403);
            $query->whereIn('kepengurusan_lab_id', KepengurusanLab::where('laboratorium_id', $labId)->select('id'));
        }
        return Inertia::render('Piket/WajahReview', [
            'enrollments' => $query->latest()->get()->map(fn ($item) => [
                'id' => $item->id,
                'can_mutate' => (bool) $item->kepengurusanLab?->is_active,
                'name' => $item->user?->name,
                'email' => $item->user?->email,
                'created_at' => $item->created_at,
                'preview_url' => route('piket.wajah.preview', $item),
            ]),
        ]);
    }

    public function preview(Request $request, FaceEnrollment $enrollment)
    {
        abort_unless($request->user()->id === $enrollment->user_id || $this->mayReview($request->user(), $enrollment), 403);
        abort_unless($enrollment->status === 'pending' && $enrollment->preview_path && Storage::disk('local')->exists($enrollment->preview_path), 404);
        return Storage::disk('local')->response($enrollment->preview_path, null, ['Cache-Control' => 'no-store']);
    }

    public function decide(Request $request, FaceEnrollment $enrollment)
    {
        abort_unless($this->mayReview($request->user(), $enrollment), 403);
        $validated = $request->validate(['decision' => 'required|in:approve,reject', 'note' => 'nullable|string|max:500']);
        $previewPath = DB::transaction(function () use ($request, $enrollment, $validated) {
            User::whereKey($enrollment->user_id)->lockForUpdate()->firstOrFail();
            $enrollment = FaceEnrollment::whereKey($enrollment->id)->lockForUpdate()->firstOrFail();
            if ($enrollment->status !== 'pending' || $enrollment->expires_at->isPast()) {
                throw ValidationException::withMessages(['face' => 'Pendaftaran ini sudah diproses atau kedaluwarsa.']);
            }
            $previewPath = $enrollment->preview_path;
            if ($validated['decision'] === 'approve') {
                FaceEnrollment::where('user_id', $enrollment->user_id)->where('status', 'approved')
                    ->where('kepengurusan_lab_id', $enrollment->kepengurusan_lab_id)
                    ->update(['status' => 'replaced', 'embeddings' => null]);
            }
            $enrollment->update([
                'status' => $validated['decision'] === 'approve' ? 'approved' : 'rejected',
                'embeddings' => $validated['decision'] === 'approve' ? $enrollment->embeddings : null,
                'preview_path' => null,
                'reviewed_by' => $request->user()->id,
                'review_note' => $validated['note'] ?? null,
                'reviewed_at' => now(),
            ]);
            return $previewPath;
        });
        if ($previewPath) Storage::disk('local')->delete($previewPath);
        return redirect()->back()->with('success', 'Pendaftaran wajah diproses.');
    }

    public function revoke(Request $request)
    {
        $paths = DB::transaction(function () use ($request) {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            return FaceEnrollment::where('user_id', $request->user()->id)->whereIn('status', ['approved', 'pending'])
                ->where('kepengurusan_lab_id', $request->attributes->get('writable_kepengurusan')?->id ?? $this->activeLabId($request->user()))
                ->lockForUpdate()->get()->map(function ($enrollment) {
                    $path = $enrollment->preview_path;
                    $enrollment->update(['status' => 'revoked', 'embeddings' => null, 'preview_path' => null]);
                    return $path;
                })->filter()->values();
        });
        $paths->each(fn ($path) => Storage::disk('local')->delete($path));
        return redirect()->back()->with('success', 'Data wajah aktif telah dicabut.');
    }
}
