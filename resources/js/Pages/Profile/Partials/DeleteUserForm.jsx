import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <button
                onClick={confirmUserDeletion}
                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-800 focus:outline-none focus:border-red-800 focus:ring focus:ring-red-300 disabled:opacity-25 transition"
            >
                Hapus Akun
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Apakah Anda yakin ingin menghapus akun Anda?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Setelah akun Anda dihapus, semua sumber daya dan data 
                        akan dihapus secara permanen. Silakan masukkan kata sandi 
                        Anda untuk mengkonfirmasi bahwa Anda ingin menghapus akun 
                        secara permanen.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Kata Sandi"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Kata Sandi"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-800 focus:outline-none focus:border-red-800 focus:ring focus:ring-red-300 disabled:opacity-25 transition"
                        >
                            Tidak
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="ms-3 inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:border-gray-800 focus:ring focus:ring-gray-300 disabled:opacity-25 transition"
                        >
                            Ya
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}