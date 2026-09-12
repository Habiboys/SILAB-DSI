import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Daftar" />

            <form onSubmit={submit} className="space-y-4">
                <FormField label="Nama" error={errors.name} required>
                    <TextInput id="name" name="name" value={data.name} autoComplete="name" isFocused onChange={(event) => setData('name', event.target.value)} required />
                </FormField>

                <FormField label="Email" error={errors.email} required>
                    <TextInput id="email" type="email" name="email" value={data.email} autoComplete="username" onChange={(event) => setData('email', event.target.value)} required />
                </FormField>

                <FormField label="Password" error={errors.password} required>
                    <TextInput id="password" type="password" name="password" value={data.password} autoComplete="new-password" onChange={(event) => setData('password', event.target.value)} required />
                </FormField>

                <FormField label="Konfirmasi Password" error={errors.password_confirmation} required>
                    <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" onChange={(event) => setData('password_confirmation', event.target.value)} required />
                </FormField>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={route('login')} className="min-h-11 content-center text-sm text-base-content/70 underline hover:text-base-content">Sudah punya akun?</Link>
                    <Button type="submit" loading={processing}>Daftar</Button>
                </div>
            </form>
        </GuestLayout>
    );
}
