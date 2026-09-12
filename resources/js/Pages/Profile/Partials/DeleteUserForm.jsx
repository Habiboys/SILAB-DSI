import Button from '@/Components/Button';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    const deleteUser = (event) => {
        event.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <section className={className}>
            <div className="alert alert-error items-start">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                    <h3 className="font-semibold">Zona Bahaya</h3>
                    <p className="text-sm">Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun Anda secara permanen beserta semua data yang terkait.</p>
                </div>
            </div>

            <Button variant="danger" className="mt-4" onClick={() => setConfirmingUserDeletion(true)}>Hapus Akun</Button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="flex items-center gap-3 text-lg font-medium text-base-content">
                        <AlertTriangle className="h-6 w-6 text-error" aria-hidden="true" />
                        Hapus Akun
                    </h2>
                    <p className="mt-3 text-sm text-base-content/70">
                        Apakah Anda yakin ingin menghapus akun Anda? Setelah akun dihapus,
                        semua sumber daya dan data akan dihapus secara permanen. Silakan masukkan
                        kata sandi Anda untuk mengkonfirmasi penghapusan akun.
                    </p>

                    <form onSubmit={deleteUser} className="mt-5">
                        <InputLabel htmlFor="password" value="Konfirmasi dengan kata sandi Anda" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            className="mt-1 block w-full"
                            isFocused
                            placeholder="Masukkan kata sandi Anda"
                        />
                        <InputError message={errors.password} className="mt-2" />

                        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
                            <Button variant="ghost" onClick={closeModal}>Batal</Button>
                            <Button type="submit" variant="danger" loading={processing}>{processing ? 'Menghapus...' : 'Hapus Akun'}</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </section>
    );
}
