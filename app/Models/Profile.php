<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Profile extends Model
{
    use HasFactory;

    protected $table = 'profile';

    protected $fillable = [
        'user_id',
        'nomor_induk',
        'nomor_anggota',
        'jenis_kelamin',
        'foto_profile',
        'alamat',
        'no_hp',
        'tempat_lahir',
        'tanggal_lahir',
        'tanggal_lahir' => 'date',
    ];

    public function users()
    {
        return $this->belongsTo(User::class);
    }
 
}