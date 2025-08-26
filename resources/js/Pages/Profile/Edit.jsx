import DashboardLayout from '../../Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Lock, Trash2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <DashboardLayout>
            <Head title="Profil" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="sm:flex sm:items-center">
                            <div className="sm:flex sm:items-center">
                                <div className="flex-shrink-0">
                                    <User className="h-8 w-8 text-gray-400" />
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

                {/* Desktop Cards */}
                <div className="hidden lg:block space-y-6">
                    {/* Profile Information Card */}
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
                            />
                        </div>
                    </div>

                    {/* Update Password Card */}
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

                    {/* Delete Account Card */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-6">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <Trash2 className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Hapus Akun</h3>
                                    <p className="text-sm text-gray-600">Setelah akun Anda dihapus, semua sumber daya dan data akan dihapus secara permanen.</p>
                                </div>
                            </div>
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>

                {/* Mobile Accordion */}
                <div className="lg:hidden space-y-4">
                    {/* Profile Information Mobile */}
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
                            />
                        </div>
                    </div>

                    {/* Update Password Mobile */}
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

                    {/* Delete Account Mobile */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </div>
                                <h3 className="text-base font-medium text-gray-900">Hapus Akun</h3>
                            </div>
                        </div>
                        <div className="px-4 py-4">
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}