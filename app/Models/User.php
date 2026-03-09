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
        'access_lab_id', // Renamed from laboratory_id
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
        // Renamed from laboratory_id to access_lab_id
        return $this->belongsTo(Laboratorium::class, 'access_lab_id');
    }

    // ... existing kepengurusan relations ...
    
    public function kepengurusanUser()
    {
        return $this->hasMany(KepengurusanUser::class);
    }

    public function kepengurusan()
    {
        return $this->hasMany(KepengurusanUser::class, 'user_id');
    }
    
    public function kepengurusanAktif()
    {
        return $this->hasOne(KepengurusanUser::class)->where('is_active', true);
    }

    public function praktikan()
    {
        return $this->hasOne(Praktikan::class);
    }

    public function praktikumAslab()
    {
        return $this->belongsToMany(Praktikum::class, 'aslab_praktikum', 'user_id', 'praktikum_id')
                    ->withPivot('catatan')
                    ->withTimestamps();
    }

    public function aslabPraktikum()
    {
        return $this->hasMany(AslabPraktikum::class);
    }

    public function isAslabForPraktikum($praktikumId)
    {
        return $this->praktikumAslab()->where('praktikum.id', $praktikumId)->exists();
    }

    /**
     * Boleh mengelola praktikum (kelola tugas, pertemuan, praktikan, modul): hanya admin/kadep atau aslab yang di-assign.
     * Dipakai untuk fitur kelola agar aslab dari lab yang sama tapi tidak di-assign tidak bisa manage.
     */
    public function canManagePraktikum($praktikumId)
    {
        if ($this->hasRole(['admin', 'superadmin', 'kadep'])) {
            return true;
        }
        return $this->isAslabForPraktikum($praktikumId);
    }

    public function getCurrentLab()
    {
        // 1. Global Access for Superadmin/Kadep
        if ($this->hasRole(['superadmin', 'kadep'])) {
            return [
                'all_access' => true
            ];
        }

        // 2. Priority: Active Kepengurusan (For Dosen/Asisten)
        // Check active kepengurusan first
        $activeKepengurusan = $this->kepengurusanAktif()->with(['kepengurusanLab.laboratorium', 'struktur'])->first();
        if ($activeKepengurusan) {
            return [
                'laboratorium' => $activeKepengurusan->kepengurusanLab->laboratorium,
                'jabatan' => $activeKepengurusan->struktur->struktur ?? 'Anggota',
                'kepengurusan_lab_id' => $activeKepengurusan->kepengurusan_lab_id
            ];
        }

        // 3. Fallback/Special Access: Direct Admin Access (For Admin Lab/Laboran)
        // Only if they don't have active kepengurusan (or as an override option)
        // We use access_lab_id as a "Master Key" for that specific lab.
        if ($this->access_lab_id) {
             $lab = $this->laboratory; // Loaded via relation
             if ($lab) {
                 return [
                    'laboratorium' => $lab,
                    'jabatan' => $this->hasRole('admin') ? 'Admin Lab' : ($this->hasRole('dosen') ? 'Dosen' : 'Staff'),
                    'kepengurusan_lab_id' => null // Admin access doesn't strictly need a period ID
                ];
             }
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

    /**
     * Check if user has permission in a specific lab context
     * This ensures asisten/admin in Lab A cannot access Lab B
     */
    public function hasPermissionInLab($permission, $labId)
    {
        // Superadmin and Kadep bypass lab restrictions
        if ($this->hasRole(['superadmin', 'kadep'])) {
            return true;
        }
        
        // First check if user has the base permission
        if (!$this->hasPermissionTo($permission)) {
            return false;
        }
        
        // Check if user is assigned to this lab
        $currentLab = $this->getCurrentLab();
        
        // Match active lab ID with target lab ID
        if ($currentLab && isset($currentLab['laboratorium'])) {
            $userLabId = (string)$currentLab['laboratorium']->id;
            $targetLabId = (string)$labId;
            
            return $userLabId === $targetLabId;
        }
        
        return false;
    }

    /**
     * Check if user has position-based permission
     * Kalab and certain positions get extra permissions beyond their role
     */
    public function hasPositionPermission($permission)
    {
        $position = $this->getCurrentJabatan();
        
        // Kalab and Wakil Kalab get extra permissions
        if (in_array($position, ['Kalab', 'Wakil Kalab'])) {
            $kalabPermissions = [
                'inventaris.approve-permohonan',
                'kepengurusan.manage-anggota',
                'piket.approve-ganti-jadwal',
                'praktikum.assign-aslab',
                'absensi.verify',
            ];
            
            if (in_array($permission, $kalabPermissions)) {
                return true;
            }
        }
        
        // Bendahara gets keuangan permissions
        if ($position === 'Bendahara') {
            $bendaharaPermissions = [
                'keuangan.view',
                'keuangan.create-transaksi',
                'keuangan.update-transaksi',
            ];
            
            if (in_array($permission, $bendaharaPermissions)) {
                return true;
            }
        }
        
        // Fallback to role-based permission
        return $this->hasPermissionTo($permission);
    }

    /**
     * Check if user can access a specific praktikum
     * Takes into account if they are aslab, praktikan, or have general access
     */
    public function canAccessPraktikum($praktikumId)
    {
        $roles = $this->getRoleNames();
        // \Illuminate\Support\Facades\Log::info("User::canAccessPraktikum - User Roles: " . $roles->implode(', '));

        // Superadmin/Kadep can access all
        if ($this->hasRole(['superadmin', 'kadep'])) {
            // \Illuminate\Support\Facades\Log::info("User::canAccessPraktikum: ALLOWED (Superadmin/Kadep)");
            return true;
        }
        
        // Check if user is aslab for this praktikum
        if ($this->isAslabForPraktikum($praktikumId)) {
             // \Illuminate\Support\Facades\Log::info("User::canAccessPraktikum: ALLOWED (Aslab)");
            return true;
        }
        
        // Check if user is praktikan in this praktikum
        if ($this->praktikan) {
            $isPraktikanInPraktikum = $this->praktikan->praktikanPraktikums()
                ->where('praktikum_id', $praktikumId)
                ->exists();
            
            if ($isPraktikanInPraktikum) {
                return true;
            }
        }
        
        // Check if user has permission and is in the same lab
        $praktikum = \App\Models\Praktikum::find($praktikumId);
        if ($praktikum && $this->hasPermissionTo('praktikum.view')) {
            return $this->hasPermissionInLab('praktikum.view', $praktikum->kepengurusanLab->laboratorium_id);
        }
        
        return false;
    }

    /**
     * Get effective role for a specific praktikum context
     * Returns 'praktikan' if user is enrolled as praktikan, 'aslab' if assigned as aslab, or primary role
     */
    public function getEffectiveRoleForPraktikum($praktikumId)
    {
        // Check if user is praktikan in this praktikum
        if ($this->praktikan && $this->praktikan->praktikums()->where('id', $praktikumId)->exists()) {
            return 'praktikan';
        }
        
        // Check if user is aslab for this praktikum
        if ($this->isAslabForPraktikum($praktikumId)) {
            return 'aslab';
        }
        
        // Return primary role
        return $this->roles->first()?->name ?? 'guest';
    }

    /**
     * Check if user is Kalab or Wakil Kalab (position, not role)
     */
    public function isKalab()
    {
        $jabatan = $this->getCurrentJabatan();
        return in_array($jabatan, ['Kalab', 'Wakil Kalab']);
    }

    /**
     * Get user's active struktur (current academic year)
     * Returns the struktur record for the active kepengurusan period
     */
    /**
     * Get user's active struktur (current academic year)
     * Returns the struktur record for the active kepengurusan period
     */
    public function getStrukturAktifAttribute()
    {
        return $this->getCurrentStruktur();
    }

    /**
     * Check if user has specific struktur in active period
     * @param array|string $jabatan
     * @return bool
     */
    public function hasStrukturAktif($jabatan): bool
    {
        $jabatan = is_array($jabatan) ? $jabatan : [$jabatan];
        $struktur = $this->struktur_aktif;
        
        return $struktur && in_array($struktur->struktur, $jabatan);
    }

    /**
     * Check if user is currently enrolled as praktikan
     * @return bool
     */
    public function isPraktikanAktif(): bool
    {
        return $this->praktikan()
            ->whereHas('praktikum', function($q) {
                $q->where('is_active', true);
            })
            ->exists();
    }
}

