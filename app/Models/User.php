<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;
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
        'struktur_id',
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

    public function struktur()
    {
        return $this->belongsTo(Struktur::class);
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
    
        // If no direct assignment, check through structure
        if ($this->struktur && $this->struktur->kepengurusanLab) {
            $lab = $this->struktur->kepengurusanLab->laboratorium;
            return [
                'laboratorium' => $lab,
                'jabatan' => $this->struktur->struktur ?? 'Anggota'
            ];
        }
    
        return null;
    }
}
