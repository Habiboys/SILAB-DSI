import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Atur Ulang Password" />

            <form onSubmit={submit} className="space-y-4">
                <FormField label="Email" error={errors.email} required>
                    <TextInput id="email" type="email" name="email" value={data.email} autoComplete="username" onChange={(event) => setData('email', event.target.value)} />
                </FormField>

                <FormField label="Password Baru" error={errors.password} required>
                    <TextInput id="password" type="password" name="password" value={data.password} autoComplete="new-password" isFocused onChange={(event) => setData('password', event.target.value)} />
                </FormField>

                <FormField label="Konfirmasi Password Baru" error={errors.password_confirmation} required>
                    <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password" onChange={(event) => setData('password_confirmation', event.target.value)} />
                </FormField>

                <Button type="submit" loading={processing} className="w-full justify-center">Atur Ulang Password</Button>
            </form>
        </GuestLayout>
    );
}
