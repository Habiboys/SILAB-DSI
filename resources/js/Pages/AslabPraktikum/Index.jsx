import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Plus, Trash2, Users, UserPlus, X, AlertTriangle } from 'lucide-react';

export default function AslabPraktikumIndex({ praktikum, asistenUsers, currentAslab }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAslab, setSelectedAslab] = useState(null);

    const createForm = useForm({
        user_id: '',
        catatan: ''
    });

    const openCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(false);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('praktikum.aslab.store', praktikum.id), {
            onSuccess: () => {
                closeCreateModal();
                toast.success('Aslab berhasil ditugaskan');
            },
            onError: (errors) => {
                if (errors.user_id) {
                    toast.error(errors.user_id);
                } else {
                    toast.error('Gagal menugaskan aslab');
                }
            }
        });
    };

    const openDeleteModal = (aslab) => {
        setSelectedAslab(aslab);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedAslab(null);
        setIsDeleteModalOpen(false);
    };

    const handleDelete = () => {
        router.delete(route('praktikum.aslab.destroy', { praktikum: praktikum.id, aslab: selectedAslab.id }), {
            onSuccess: () => {
                closeDeleteModal();
                toast.success('Aslab berhasil dihapus dari praktikum');
            },
            onError: () => {
                toast.error('Gagal menghapus aslab');
            }
        });
    };

    return (
        <DashboardLayout>
            <Head title="Kelola Aslab Praktikum" />
            <ToastContainer position="top-right" autoClose={3000} />
        

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.visit(route('praktikum.index'))}
                            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">Kelola Aslab Praktikum</h2>
                            <h3 className="text-sm md:text-md text-gray-600 truncate">Mata Kuliah: {praktikum?.mata_kuliah}</h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">Lab: {praktikum?.kepengurusanLab?.laboratorium?.nama}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Aslab</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                    {currentAslab && currentAslab.length > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                            {currentAslab.map((aslab) => (
                                <div key={aslab.id} className="border border-gray-200 rounded-lg p-3 md:p-4">
                                    <div className="flex justify-between items-start space-x-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 md:space-x-3">
                                                <Users className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                                                        {aslab.user.name}
                                                    </h3>
                                                    <p className="text-xs md:text-sm text-gray-500 truncate">
                                                        {aslab.user.profile?.nomor_induk || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            {aslab.catatan && (
                                                <div className="mt-2 md:mt-3">
                                                    <span className="text-xs md:text-sm text-gray-600 break-words">
                                                        Catatan: {aslab.catatan}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                                            <button
                                                onClick={() => openDeleteModal(aslab)}
                                                className="p-1.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 md:py-12">
                            <Users className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada aslab ditugaskan</h3>
                            <p className="mt-1 text-xs md:text-sm text-gray-500">
                                Mulai dengan menugaskan aslab ke praktikum ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Tambah Aslab</h3>
                            <button
                                onClick={closeCreateModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Aslab
                                </label>
                                <select
                                    value={createForm.data.user_id}
                                    onChange={(e) => createForm.setData('user_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Pilih Aslab</option>
                                    {asistenUsers && asistenUsers.length > 0 ? asistenUsers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} - {user.nim || 'N/A'}
                                        </option>
                                    )) : (
                                        <option value="" disabled>Tidak ada aslab tersedia</option>
                                    )}
                                </select>
                                {createForm.errors.user_id && (
                                    <p className="mt-1 text-sm text-red-600">{createForm.errors.user_id}</p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    value={createForm.data.catatan}
                                    onChange={(e) => createForm.setData('catatan', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Catatan tambahan..."
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedAslab && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-4">
                        <div className="flex items-start space-x-3 mb-4">
                            <div className="bg-red-100 p-2 md:p-3 rounded-full flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-gray-900">Hapus Aslab</h2>
                                <p className="text-sm text-gray-600">Konfirmasi penghapusan aslab dari praktikum</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 text-sm md:text-base">
                                Apakah Anda yakin ingin menghapus <strong>{selectedAslab.user?.name}</strong> dari praktikum <strong>{praktikum.mata_kuliah}</strong>?
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 mt-2">
                                Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={closeDeleteModal}
                                className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

    
        </DashboardLayout>
    );
}
