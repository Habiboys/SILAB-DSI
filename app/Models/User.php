<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{

    use HasFactory, Notifiable, HasRoles, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';


    protected $fillable = [
        'name',
        'email',
        'password',
        'access_lab_id',
        'fcm_token',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];


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
        return $this->hasManyThrough(
            JadwalPiket::class,
            KepengurusanUser::class,
            'user_id',
            'kepengurusan_user_id',
            'id',
            'id'
        );
    }

    public function absensi()
    {
        return Absensi::whereHas('jadwalPiket.kepengurusanUser', function ($query) {
            $query->where('user_id', $this->id);
        });
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

        return $this->belongsTo(Laboratorium::class, 'access_lab_id');
    }

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


    public function canManagePraktikum($praktikumId)
    {
        if ($this->hasRole(['admin', 'superadmin', 'kadep'])) {
            return true;
        }
        return $this->isAslabForPraktikum($praktikumId);
    }

    public function getCurrentLab()
    {

        if ($this->hasRole(['superadmin', 'kadep'])) {
            return [
                'all_access' => true
            ];
        }

        $activeKepengurusan = $this->kepengurusanAktif()->with(['kepengurusanLab.laboratorium', 'struktur'])->first();
        if ($activeKepengurusan) {
            return [
                'laboratorium' => $activeKepengurusan->kepengurusanLab->laboratorium,
                'jabatan' => $activeKepengurusan->struktur->struktur ?? 'Anggota',
                'kepengurusan_lab_id' => $activeKepengurusan->kepengurusan_lab_id
            ];
        }

        if ($this->access_lab_id) {
             $lab = $this->laboratory;
             if ($lab) {
                 return [
                    'laboratorium' => $lab,
                    'jabatan' => $this->hasRole('admin') ? 'Admin Lab' : ($this->hasRole('dosen') ? 'Dosen' : 'Staff'),
                    'kepengurusan_lab_id' => null
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


    public function hasPermissionInLab($permission, $labId)
    {

        if ($this->hasRole(['superadmin', 'kadep'])) {
            return true;
        }

        if (!$this->hasPermissionTo($permission)) {
            return false;
        }

        $currentLab = $this->getCurrentLab();

        if ($currentLab && isset($currentLab['laboratorium'])) {
            $userLabId = (string)$currentLab['laboratorium']->id;
            $targetLabId = (string)$labId;

            return $userLabId === $targetLabId;
        }

        return false;
    }


    public function hasPositionPermission($permission)
    {

        return \App\Services\PermissionService::userCan($this, $permission);
    }


    public function canAccessPraktikum($praktikumId)
    {
        $roles = $this->getRoleNames();

        if ($this->hasRole(['superadmin', 'kadep'])) {

            return true;
        }

        if ($this->isAslabForPraktikum($praktikumId)) {

            return true;
        }

        if ($this->praktikan) {
            $isPraktikanInPraktikum = $this->praktikan->praktikanPraktikums()
                ->where('praktikum_id', $praktikumId)
                ->exists();

            if ($isPraktikanInPraktikum) {
                return true;
            }
        }

        $praktikum = \App\Models\Praktikum::find($praktikumId);
        if ($praktikum && $this->hasPermissionTo('praktikum.view')) {
            return $this->hasPermissionInLab('praktikum.view', $praktikum->kepengurusanLab->laboratorium_id);
        }

        return false;
    }


    public function getEffectiveRoleForPraktikum($praktikumId)
    {

        if ($this->praktikan && $this->praktikan->praktikums()->where('id', $praktikumId)->exists()) {
            return 'praktikan';
        }

        if ($this->isAslabForPraktikum($praktikumId)) {
            return 'aslab';
        }

        return $this->roles->first()?->name ?? 'guest';
    }


    public function isKalab()
    {
        $jabatan = $this->getCurrentJabatan();
        return in_array($jabatan, ['Kalab', 'Wakil Kalab', 'Kepala Lab']);
    }



    public function getStrukturAktifAttribute()
    {
        return $this->getCurrentStruktur();
    }


    public function hasStrukturAktif($jabatan): bool
    {
        $jabatan = is_array($jabatan) ? $jabatan : [$jabatan];
        $struktur = $this->struktur_aktif;

        return $struktur && in_array($struktur->struktur, $jabatan);
    }


    public function isPraktikanAktif(): bool
    {
        return $this->praktikan()
            ->whereHas('praktikum', function($q) {
                $q->where('is_active', true);
            })
            ->exists();
    }
}

