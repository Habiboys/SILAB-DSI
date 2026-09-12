import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.confirm'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi Password" />

            <p className="mb-4 text-sm text-base-content/70">
                Ini adalah area aman aplikasi. Harap konfirmasi password Anda sebelum melanjutkan.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <FormField label="Password" error={errors.password} required>
                    <TextInput id="password" type="password" name="password" value={data.password} isFocused onChange={(event) => setData('password', event.target.value)} />
                </FormField>

                <Button type="submit" loading={processing} className="w-full justify-center">Konfirmasi</Button>
            </form>
        </GuestLayout>
    );
}
