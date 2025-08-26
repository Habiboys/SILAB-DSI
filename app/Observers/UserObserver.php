<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    public function saving(User $user)
    {
        // UserObserver disabled - laboratory_id is now set directly in controller
        // This observer was causing issues with the new structure system
    }
}