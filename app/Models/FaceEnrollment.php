<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FaceEnrollment extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'kepengurusan_lab_id', 'status', 'embeddings', 'preview_path',
        'model_version', 'reviewed_by', 'review_note', 'reviewed_at', 'expires_at',
    ];

    protected $hidden = ['embeddings', 'preview_path'];

    protected $casts = [
        'embeddings' => 'encrypted:array',
        'reviewed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }
}
