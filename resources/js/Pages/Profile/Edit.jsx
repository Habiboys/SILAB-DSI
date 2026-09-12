import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { User } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const MicrosoftMark = ({ className = 'h-4 w-4' }) => (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
);

export default function Edit({ mustVerifyEmail, status, profile, isPraktikan, praktikan, needsCompletion, microsoftConnected = false, microsoftEmail = null }) {
    const needsPhone = (isPraktikan && !praktikan?.no_hp) || needsCompletion;

    return (
        <DashboardLayout>
            <Head title="Profil" />
            <div className="space-y-6">
                <PageHeader title="Profil Pengguna" description="Kelola informasi profil dan keamanan akun Anda." />

                {needsPhone && (
                    <div className="alert alert-warning items-start">
                        <div>
                            <p className="font-semibold">Profil belum lengkap</p>
                            <p className="text-sm">Isi nomor HP Anda terlebih dahulu untuk dapat mengakses halaman lain.</p>
                        </div>
                    </div>
                )}

                <PageSection title="Informasi Profil" description="Perbarui informasi profil dan alamat email akun Anda.">
                    <div className="mb-4 flex items-center gap-3">
                        {profile?.foto_profile
                            ? <img className="h-12 w-12 rounded-full object-cover ring-1 ring-base-content/10" src={profile.foto_profile} alt="Foto profil" />
                            : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 text-base-content/60"><User className="h-6 w-6" aria-hidden="true" /></span>}
                    </div>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        isPraktikan={isPraktikan}
                        praktikan={praktikan}
                    />
                </PageSection>

                <PageSection title="Akun Microsoft" description="Hubungkan akun Microsoft untuk login cepat.">
                    {microsoftConnected ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
                                <StatusBadge status="active" label="Terhubung" />
                                <p className="min-w-0 truncate text-sm text-base-content/70">{microsoftEmail}</p>
                            </div>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    if (window.confirm('Putuskan koneksi dengan akun Microsoft? Anda tetap bisa login dengan password.')) {
                                        router.post(route('profile.unlink-microsoft'));
                                    }
                                }}
                            >
                                Putuskan Koneksi
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-base-content/70">Dengan menghubungkan akun Microsoft, Anda bisa login tanpa perlu memasukkan password.</p>
                            <Button href={route('profile.link-microsoft')} className="mt-3 gap-2"><MicrosoftMark /> Hubungkan Akun Microsoft</Button>
                        </div>
                    )}
                </PageSection>

                <PageSection title="Perbarui Kata Sandi" description="Pastikan akun Anda menggunakan kata sandi yang panjang dan acak untuk tetap aman.">
                    <UpdatePasswordForm />
                </PageSection>

                <PageSection title="Hapus Akun">
                    <DeleteUserForm />
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
