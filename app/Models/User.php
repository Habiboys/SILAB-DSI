<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
    // use HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'laboratory_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }



    public function jadwalPiket()
    {
        return $this->hasMany(JadwalPiket::class);
    }

    public function absensi()
    {
        return $this->hasManyThrough(
            Absensi::class,
            JadwalPiket::class,
            'user_id',
            'jadwal_piket',
            'id',
            'id'
        );
    }

    public function suratTerkirim()
    {
        return $this->hasMany(Surat::class, 'pengirim');
    }

    public function suratDiterima()
    {
        return $this->hasMany(Surat::class, 'penerima');
    }

    public function laboratory()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratory_id');
    }

    public function kepengurusan()
    {
        return $this->hasMany(KepengurusanUser::class);
    }

    public function kepengurusanAktif()
    {
        return $this->hasMany(KepengurusanUser::class)->active();
    }

    // Relasi ke Praktikan (jika user adalah praktikan)
    public function praktikan()
    {
        return $this->hasOne(Praktikan::class);
    }

    // Check apakah user adalah praktikan
    public function isPraktikan()
    {
        return $this->hasRole('praktikan');
    }

    // Get praktikum yang diikuti user sebagai praktikan
    public function getPraktikumPraktikan()
    {
        if (!$this->praktikan) {
            return collect();
        }
        
        return $this->praktikan->praktikanPraktikums()->with(['praktikum.kepengurusanLab.laboratorium'])->get();
    }

    public function laboratoriumMelaluiKepengurusan()
    {
        return $this->belongsToMany(Laboratorium::class, 'kepengurusan_user', 'user_id', 'kepengurusan_lab_id')
                    ->join('kepengurusan_lab', 'kepengurusan_lab.id', '=', 'kepengurusan_user.kepengurusan_lab_id')
                    ->where('kepengurusan_user.is_active', true);
    }

    // Relasi ke Praktikum yang ditugaskan sebagai Aslab
    public function praktikumAslab()
    {
        return $this->belongsToMany(Praktikum::class, 'aslab_praktikum', 'user_id', 'praktikum_id')
                    ->withPivot('catatan')
                    ->withTimestamps();
    }

    // Check apakah user adalah aslab untuk praktikum tertentu
    public function isAslabForPraktikum($praktikumId)
    {
        return $this->praktikumAslab()->where('praktikum_id', $praktikumId)->exists();
    }

    public function getCurrentLab()
    {
        if ($this->hasRole(['superadmin', 'kadep'])) {
            return [
                'all_access' => true
            ];
        }
    
        // First check direct laboratory assignment
        if ($this->laboratory) {
            return [
                'laboratorium' => $this->laboratory,
                'jabatan' => $this->hasRole('admin') ? 'Admin Lab' : ($this->hasRole('dosen') ? 'Dosen' : 'Asisten')
            ];
        }
    
        // Check through active kepengurusan
        $activeKepengurusan = $this->kepengurusanAktif()->with(['kepengurusanLab.laboratorium', 'struktur'])->first();
        if ($activeKepengurusan) {
            return [
                'laboratorium' => $activeKepengurusan->kepengurusanLab->laboratorium,
                'jabatan' => $activeKepengurusan->struktur->struktur ?? 'Anggota'
            ];
        }
    
        return null;
    }

    public function getCurrentStruktur()
    {
        $activeKepengurusan = $this->kepengurusanAktif()->with('struktur')->first();
        return $activeKepengurusan ? $activeKepengurusan->struktur : null;
    }

    public function getCurrentJabatan()
    {
        $struktur = $this->getCurrentStruktur();
        return $struktur ? $struktur->struktur : null;
    }
}
