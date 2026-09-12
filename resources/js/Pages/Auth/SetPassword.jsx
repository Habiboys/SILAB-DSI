import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function SetPassword() {
    const { data, setData, post, errors, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.set.store'));
    };

    return (
        <GuestLayout>
            <Head title="Atur Kata Sandi Baru" />

            <header className="mb-6 text-center">
                <h1 className="text-xl font-bold tracking-tight">Atur Kata Sandi Baru</h1>
                <p className="mt-1 text-sm text-base-content/70">
                    Anda harus mengganti kata sandi sebelum melanjutkan. Masukkan kata sandi sementara dari email, lalu buat kata sandi baru.
                </p>
            </header>

            <form onSubmit={submit} className="space-y-4">
                <FormField label="Kata Sandi Saat Ini (dari email)" error={errors.current_password} required>
                    <TextInput id="current_password" type="password" value={data.current_password} autoComplete="current-password" isFocused onChange={(event) => setData('current_password', event.target.value)} />
                </FormField>

                <FormField label="Kata Sandi Baru" error={errors.password} required>
                    <TextInput id="password" type="password" value={data.password} autoComplete="new-password" onChange={(event) => setData('password', event.target.value)} />
                </FormField>

                <FormField label="Konfirmasi Kata Sandi Baru" error={errors.password_confirmation} required>
                    <TextInput id="password_confirmation" type="password" value={data.password_confirmation} autoComplete="new-password" onChange={(event) => setData('password_confirmation', event.target.value)} />
                </FormField>

                <Button type="submit" loading={processing} className="w-full justify-center">
                    {processing ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </Button>
            </form>
        </GuestLayout>
    );
}
