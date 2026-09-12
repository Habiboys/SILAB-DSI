import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Password" />

            <p className="mb-4 text-sm text-base-content/70">
                Lupa password? Tidak masalah. Beritahu kami alamat email Anda dan kami akan mengirimkan tautan reset password.
            </p>

            {status && <div className="alert alert-success mb-4"><span>{status}</span></div>}

            <form onSubmit={submit} className="space-y-4">
                <FormField label="Email" error={errors.email} required>
                    <TextInput id="email" type="email" name="email" value={data.email} isFocused onChange={(event) => setData('email', event.target.value)} required />
                </FormField>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={route('login')} className="min-h-11 content-center text-sm text-base-content/70 underline hover:text-base-content">Kembali ke halaman masuk</Link>
                    <Button type="submit" loading={processing}>Kirim Tautan Reset</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
