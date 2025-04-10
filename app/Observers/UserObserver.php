<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    public function saving(User $user)
    {
        // If user has struktur_id, set laboratory_id based on the structure's lab
        if ($user->struktur_id && !$user->laboratory_id) {
            $struktur = \App\Models\Struktur::with('kepengurusanLab.laboratorium')
                ->find($user->struktur_id);
                
            if ($struktur && $struktur->kepengurusanLab) {
                $user->laboratory_id = $struktur->kepengurusanLab->laboratorium_id;
            }
        }
    }
}