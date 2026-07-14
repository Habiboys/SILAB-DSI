import { Head, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function SetPassword() {
    const { data, setData, post, errors, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.set.store'), {
            onSuccess: () => {},
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <Head title="Atur Kata Sandi Baru" />

            <div className="w-full max-w-md">
                <div className="bg-white shadow-lg rounded-lg px-8 py-10">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Lock className="h-7 w-7 text-yellow-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        Atur Kata Sandi Baru
                    </h2>
                    <p className="text-center text-gray-600 text-sm mb-8">
                        Anda harus mengganti kata sandi sebelum melanjutkan. Masukkan kata sandi sementara dari email, lalu buat kata sandi baru.
                    </p>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel
                                htmlFor="current_password"
                                value="Kata Sandi Saat Ini (dari email)"
                            />
                            <TextInput
                                id="current_password"
                                type="password"
                                value={data.current_password}
                                onChange={(e) =>
                                    setData('current_password', e.target.value)
                                }
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                            />
                            <InputError
                                message={errors.current_password}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="Kata Sandi Baru"
                            />
                            <TextInput
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                            />
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Konfirmasi Kata Sandi Baru"
                            />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value
                                    )
                                }
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <div className="pt-2">
                            <PrimaryButton
                                disabled={processing}
                                className="w-full justify-center"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Kata Sandi Baru'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
