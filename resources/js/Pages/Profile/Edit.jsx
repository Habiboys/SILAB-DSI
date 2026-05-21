import DashboardLayout from '../../Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Lock, Trash2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status, profile, isPraktikan, praktikan, needsCompletion }) {
    return (
        <DashboardLayout>
            <Head title="Profil" />

            <div className="space-y-6">
                
                {((isPraktikan && !praktikan?.no_hp) || needsCompletion) && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Profil belum lengkap</p>
                            <p className="text-sm text-yellow-700 mt-0.5">Isi <strong>nomor HP</strong> Anda terlebih dahulu untuk dapat mengakses halaman lain.</p>
                        </div>
                    </div>
                )}

                
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="sm:flex sm:items-center">
                            <div className="sm:flex sm:items-center">
                                <div className="flex-shrink-0">
                                    {profile?.foto_profile ? (
                                        <img
                                            className="h-12 w-12 rounded-full object-cover"
                                            src={profile.foto_profile}
                                            alt="Profile photo"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="mt-4 sm:mt-0 sm:ml-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Profil Pengguna
                                    </h2>
                                    <div className="text-gray-600 text-sm">
                                        <p>Kelola informasi profil dan keamanan akun Anda</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div className="hidden lg:block space-y-6">
                    
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Informasi Profil</h3>
                                    <p className="text-sm text-gray-600">Perbarui informasi profil dan alamat email akun Anda.</p>
                                </div>
                            </div>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                isPraktikan={isPraktikan}
                                praktikan={praktikan}
                            />
                        </div>
                    </div>

                    
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Lock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Perbarui Kata Sandi</h3>
                                    <p className="text-sm text-gray-600">Pastikan akun Anda menggunakan kata sandi yang panjang dan acak untuk tetap aman.</p>
                                </div>
                            </div>
                            <UpdatePasswordForm />
                        </div>
                    </div>

                    
                    
                </div>

                
                <div className="lg:hidden space-y-4">
                    
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Informasi Profil</h3>
                            </div>
                        </div>
                        <div className="px-4 py-4">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                isPraktikan={isPraktikan}
                                praktikan={praktikan}
                            />
                        </div>
                    </div>

                    
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                    <Lock className="h-4 w-4 text-yellow-600" />
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Perbarui Kata Sandi</h3>
                            </div>
                        </div>
                        <div className="px-4 py-4">
                            <UpdatePasswordForm />
                        </div>
                    </div>

                    
                    
                </div>
            </div>
        </DashboardLayout>
    );
}