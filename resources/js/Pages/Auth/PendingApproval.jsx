import Button from '@/Components/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import StatusBadge from '@/Components/StatusBadge';
import { Head, router } from '@inertiajs/react';

export default function PendingApproval() {
    const handleLogout = () => router.post(route('logout'));

    return (
        <GuestLayout>
            <Head title="Menunggu Persetujuan" />

            <header className="mb-5 text-center">
                <StatusBadge status="pending" label="Menunggu persetujuan" />
                <h1 className="mt-3 text-xl font-bold tracking-tight">Akun Belum Aktif</h1>
                <p className="mt-2 text-sm text-base-content/70">
                    Akun Anda telah berhasil dibuat melalui Microsoft SSO, namun belum memiliki role atau akses di sistem ini. Silakan hubungi administrator laboratorium untuk mengaktifkan akun Anda.
                </p>
            </header>

            <section className="rounded-box bg-base-200 p-4 text-sm text-base-content/70">
                <p className="font-medium text-base-content">Langkah selanjutnya:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Hubungi administrator atau kepala laboratorium</li>
                    <li>Sampaikan email akun yang digunakan untuk mendaftar</li>
                    <li>Admin akan memberikan role yang sesuai (anggota, asisten, praktikan, dll.)</li>
                    <li>Setelah role diberikan, Anda bisa login kembali dan mengakses sistem</li>
                </ol>
            </section>

            <Button variant="ghost" className="mt-5 w-full justify-center" onClick={handleLogout}>Keluar</Button>
        </GuestLayout>
    );
}
