<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Laboratorium;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $canSelectLab = false;
        
        if ($user) {
            $canSelectLab = $user->hasAnyRole(['superadmin', 'admin', 'kadep']);
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'can_select_lab' => $canSelectLab,
                    'laboratory_id' => $user->laboratory_id
                ] : null,
            ],
            'laboratorium' => Laboratorium::select('id', 'nama')->get()
        ]);
    }
}
