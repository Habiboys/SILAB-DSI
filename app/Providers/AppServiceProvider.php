<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\Laboratorium;
use Inertia\Inertia;
use App\Models\User;
use App\Observers\UserObserver;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Keycloak\Provider as KeycloakProvider;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if(config('app.env') === 'production') {
            $this->app['request']->server->set('HTTPS', true);
       }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Policies
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Praktikum::class, \App\Policies\PraktikumPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Inventaris::class, \App\Policies\InventarisPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\PermohonanAset::class, \App\Policies\PermohonanAsetPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\RiwayatKeuangan::class, \App\Policies\RiwayatKeuanganPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\PemasukanKeuangan::class, \App\Policies\RiwayatKeuanganPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\PengeluaranKeuangan::class, \App\Policies\RiwayatKeuanganPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\JadwalPiket::class, \App\Policies\JadwalPiketPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Proker::class, \App\Policies\ProkerPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\KepengurusanUser::class, \App\Policies\KepengurusanUserPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Absensi::class, \App\Policies\AbsensiPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Surat::class, \App\Policies\SuratPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\ModulPraktikum::class, \App\Policies\ModulPraktikumPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\TugasPraktikum::class, \App\Policies\TugasPraktikumPolicy::class);

        // Define Gates for Non-Model Actions
        \Illuminate\Support\Facades\Gate::define('manage-kepengurusan', function ($user) {
            return $user->hasPositionPermission('kepengurusan.manage-anggota');
        });

        \Illuminate\Support\Facades\Gate::define('approve-ganti-jadwal', function ($user) {
            return $user->hasPositionPermission('piket.approve-ganti-jadwal');
        });

        \Illuminate\Support\Facades\Gate::define('delete-transaksi', function ($user) {
            return $user->hasRole(['superadmin', 'admin']);
        });

        \Illuminate\Support\Facades\Gate::define('manage-roles-permissions', function ($user) {
            return $user->hasRole('superadmin');
        });

        // Implicitly grant "Super Admin" role all permissions
        // This works in the app by using gate-related functions like auth()->user()->can() and @can()
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('superadmin') ? true : null;
        });

        Vite::prefetch(concurrency: 3);
        // Inertia::share('laboratorium', Laboratorium::select('id', 'nama', 'logo')->get());
        User::observe(UserObserver::class);

        // Register Microsoft Socialite provider
        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('microsoft', \SocialiteProviders\Microsoft\Provider::class);
            $event->extendSocialite('unand', KeycloakProvider::class);
        });
    }
}
