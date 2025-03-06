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
        'nim', 'nip', 'jenis_kelamin', 'foto_profile', 'alamat', 'no_hp', 'tempat_lahir', 'tanggal_lahir', 'nomor_anggota'
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


    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function suratPengirim()
    {
        return $this->hasMany(Surat::class, 'pengirim');
    }

    public function suratPenerima()
    {
        return $this->hasMany(Surat::class, 'penerima');
    }

    public function jadwalPiket()
    {
        return $this->hasMany(JadwalPiket::class);
    }

    public function riwayatKeuangan()
    {
        return $this->hasMany(RiwayatKeuangan::class);
    }
    public function kepengurusan()
    {
        return $this->hasOne(Kepengurusan::class, 'koor', 'id');
    }

    // Define the detailKepengurusan relationship
    public function detailKepengurusan()
    {
        return $this->hasMany(DetailKepengurusan::class, 'anggota', 'id');
    }
}
