import Button from '@/Components/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (event) => {
        event.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <p className="mb-4 text-sm text-base-content/70">
                Terima kasih telah mendaftar. Sebelum memulai, verifikasi alamat email Anda dengan mengklik tautan yang telah kami kirimkan ke email Anda. Jika tidak menerima email, kami akan dengan senang hati mengirimkan ulang.
            </p>

            {status === 'verification-link-sent' && (
                <div className="alert alert-success mb-4"><span>Tautan verifikasi baru telah dikirim ke alamat email yang Anda daftarkan.</span></div>
            )}

            <form onSubmit={submit}>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={route('logout')} method="post" as="button" className="min-h-11 content-center text-sm text-base-content/70 underline hover:text-base-content">Keluar</Link>
                    <Button type="submit" loading={processing}>Kirim Ulang Email Verifikasi</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
