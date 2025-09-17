import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const profile = usePage().props.profile;
    const [previewImage, setPreviewImage] = useState(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            // Profile fields
            jenis_kelamin: profile?.jenis_kelamin || '',
            alamat: profile?.alamat || '',
            no_hp: profile?.no_hp || '',
            tempat_lahir: profile?.tempat_lahir || '',
            tanggal_lahir: profile?.tanggal_lahir || '',
            foto_profile: null,
        });

    // Data untuk display saja (tidak dikirim ke server)
    const displayData = {
        nomor_induk: profile?.nomor_induk || '',
        nomor_anggota: profile?.nomor_anggota || '',
    };

    // Update form data when profile data changes
    useEffect(() => {
        if (profile) {
            // Format tanggal untuk input type="date" (YYYY-MM-DD)
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            const newData = {
                name: user.name,
                email: user.email,
                jenis_kelamin: profile.jenis_kelamin || '',
                alamat: profile.alamat || '',
                no_hp: profile.no_hp || '',
                tempat_lahir: profile.tempat_lahir || '',
                tanggal_lahir: formatDate(profile.tanggal_lahir),
                foto_profile: null,
            };

            console.log('Profile data:', profile);
            console.log('User data:', user);
            console.log('Setting form data:', newData);
            
            setData(newData);
        }
    }, [profile, user]);

    // Debug: log data setiap kali berubah
    useEffect(() => {
        console.log('Form data changed:', data);
    }, [data]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('foto_profile', file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();

        // Debug: log data yang akan dikirim
        console.log('Form data:', data);

        // Validasi manual sebelum submit
        if (!data.email || data.email.trim() === '') {
            console.error('Email is required but empty');
            return;
        }

        if (!data.name || data.name.trim() === '') {
            console.error('Name is required but empty');
            return;
        }

        console.log('Validation passed, submitting...');

        patch(route('profile.update'), {
            forceFormData: true,
            onSuccess: (page) => {
                console.log('Profile updated successfully:', page);
            },
            onError: (errors) => {
                console.error('Profile update errors:', errors);
            },
            onFinish: () => {
                console.log('Profile update finished');
            }
        });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
                {/* Profile Photo Section */}
                <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <img
                                className="h-20 w-20 rounded-full object-cover"
                                src={previewImage || profile?.foto_profile || '/images/default-avatar.png'}
                                alt="Profile photo"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <InputLabel htmlFor="foto_profile" value="Foto Profil" />
                        <input
                            id="foto_profile"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <InputError className="mt-2" message={errors.foto_profile} />
                        <p className="mt-1 text-xs text-gray-500">
                            Format: JPG, PNG, GIF. Maksimal 2MB.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Nama" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                            value={data.name}
                            readOnly
                            disabled
                            autoComplete="name"
                        />
                        <p className="mt-1 text-sm text-gray-500">Nama tidak dapat diubah</p>
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>
                </div>

                {/* Profile Information Section */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Profil</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="nomor_induk" value="Nomor Induk" />
                            <TextInput
                                id="nomor_induk"
                                className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                                value={displayData.nomor_induk}
                                readOnly
                                disabled
                                autoComplete="off"
                            />
                            <p className="mt-1 text-sm text-gray-500">Nomor induk tidak dapat diubah</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="nomor_anggota" value="Nomor Anggota" />
                            <TextInput
                                id="nomor_anggota"
                                className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                                value={displayData.nomor_anggota}
                                readOnly
                                disabled
                                autoComplete="off"
                            />
                            <p className="mt-1 text-sm text-gray-500">Nomor anggota tidak dapat diubah</p>
                        </div>

                        <div>
                            <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin" />
                            <select
                                id="jenis_kelamin"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.jenis_kelamin}
                                onChange={(e) => setData('jenis_kelamin', e.target.value)}
                            >
                                <option value="">Pilih Jenis Kelamin</option>
                                <option value="laki-laki">Laki-laki</option>
                                <option value="perempuan">Perempuan</option>
                            </select>
                            <InputError className="mt-2" message={errors.jenis_kelamin} />
                            {/* Debug info */}
                          
                        </div>

                        <div>
                            <InputLabel htmlFor="no_hp" value="No. HP" />
                            <TextInput
                                id="no_hp"
                                className="mt-1 block w-full"
                                value={data.no_hp}
                                onChange={(e) => setData('no_hp', e.target.value)}
                                autoComplete="tel"
                            />
                            <InputError className="mt-2" message={errors.no_hp} />
                        </div>

                        <div>
                            <InputLabel htmlFor="tempat_lahir" value="Tempat Lahir" />
                            <TextInput
                                id="tempat_lahir"
                                className="mt-1 block w-full"
                                value={data.tempat_lahir}
                                onChange={(e) => setData('tempat_lahir', e.target.value)}
                                autoComplete="off"
                            />
                            <InputError className="mt-2" message={errors.tempat_lahir} />
                        </div>

                        <div>
                            <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir" />
                            <TextInput
                                id="tanggal_lahir"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.tanggal_lahir}
                                onChange={(e) => setData('tanggal_lahir', e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.tanggal_lahir} />
                        </div>
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="alamat" value="Alamat" />
                        <textarea
                            id="alamat"
                            rows={3}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            value={data.alamat}
                            onChange={(e) => setData('alamat', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.alamat} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-md bg-yellow-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    Alamat email Anda belum diverifikasi.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="font-medium text-yellow-800 underline hover:text-yellow-900"
                                    >
                                        Klik di sini untuk mengirim ulang email verifikasi.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <p className="mt-2 text-sm font-medium text-green-600">
                                        Link verifikasi baru telah dikirim ke alamat email Anda.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600 font-medium">
                            Tersimpan.
                        </p>
                    </Transition>
                    
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}