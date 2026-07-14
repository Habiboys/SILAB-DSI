import DashboardLayout from '../../Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Lock, Trash2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status, profile, isPraktikan, praktikan, needsCompletion, microsoftConnected = false, microsoftEmail = null }) {
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
                                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-cyan-600" viewBox="0 0 23 23">
                                            <path fill="#f35325" d="M1 1h10v10H1z"/>
                                            <path fill="#81bc06" d="M12 1h10v10H12z"/>
                                            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                                            <path fill="#ffba08" d="M12 12h10v10H12z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Akun Microsoft</h3>
                                    <p className="text-sm text-gray-600">Hubungkan akun Microsoft untuk login cepat.</p>
                                </div>
                            </div>

                            {microsoftConnected ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Akun terhubung</p>
                                            <p className="text-xs text-green-600">{microsoftEmail}</p>
                                        </div>
                                    </div>
                                    <form
                                        action={route("profile.unlink-microsoft")}
                                        method="POST"
                                        onSubmit={(e) => {
                                            if (!confirm("Putuskan koneksi dengan akun Microsoft? Anda tetap bisa login dengan password.")) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")} />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                                        >
                                            Putuskan Koneksi
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Dengan menghubungkan akun Microsoft, Anda bisa login tanpa perlu memasukkan password.
                                    </p>
                                    <a
                                        href={route("profile.link-microsoft")}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 23 23">
                                            <path fill="#fff" d="M1 1h10v10H1z"/>
                                            <path fill="#fff" d="M12 1h10v10H12z"/>
                                            <path fill="#fff" d="M1 12h10v10H1z"/>
                                            <path fill="#fff" d="M12 12h10v10H12z"/>
                                        </svg>
                                        Hubungkan Akun Microsoft
                                    </a>
                                </div>
                            )}
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
                                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 23 23">
                                        <path fill="#f35325" d="M1 1h10v10H1z"/>
                                        <path fill="#81bc06" d="M12 1h10v10H12z"/>
                                        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                                        <path fill="#ffba08" d="M12 12h10v10H12z"/>
                                    </svg>
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Akun Microsoft</h3>
                            </div>
                        </div>
                        <div className="px-4 py-4">
                            {microsoftConnected ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Akun terhubung</p>
                                            <p className="text-xs text-green-600">{microsoftEmail}</p>
                                        </div>
                                    </div>
                                    <form
                                        action={route("profile.unlink-microsoft")}
                                        method="POST"
                                        onSubmit={(e) => {
                                            if (!confirm("Putuskan koneksi dengan akun Microsoft? Anda tetap bisa login dengan password.")) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")} />
                                        <button
                                            type="submit"
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                                        >
                                            Putuskan Koneksi
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Dengan menghubungkan akun Microsoft, Anda bisa login tanpa perlu memasukkan password.
                                    </p>
                                    <a
                                        href={route("profile.link-microsoft")}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 23 23">
                                            <path fill="#fff" d="M1 1h10v10H1z"/>
                                            <path fill="#fff" d="M12 1h10v10H12z"/>
                                            <path fill="#fff" d="M1 12h10v10H1z"/>
                                            <path fill="#fff" d="M12 12h10v10H12z"/>
                                        </svg>
                                        Hubungkan Akun Microsoft
                                    </a>
                                </div>
                            )}
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