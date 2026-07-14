import ConfirmModal from '@/Components/ConfirmModal';
import Modal from '@/Components/Modal';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X, Edit } from "lucide-react";
import React, { useState } from 'react';
import { toast } from 'sonner';

export default function Index({ admins, laboratories, roles, flash }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);

    
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        laboratory_id: '',
    });

    
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        laboratory_id: '',
    });

    
    const deleteForm = useForm({});

    const openCreateModal = () => {
        createForm.reset();
        setShowCreateModal(true);
    };

    const openEditModal = (admin) => {
        setCurrentAdmin(admin);
        editForm.setData({
            name: admin.name,
            email: admin.email,
            password: '',
            password_confirmation: '',
            role: admin.role,
            laboratory_id: admin.laboratory?.id || '',
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (admin) => {
        setCurrentAdmin(admin);
        setShowDeleteModal(true);
    };

    const submitCreateForm = (e) => {
        e.preventDefault();
        createForm.post(route('admin.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                toast.success("Admin berhasil ditambahkan");
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menambahkan data");
            },
        });
    };

    const submitEditForm = (e) => {
        e.preventDefault();
        editForm.put(route('admin.update', currentAdmin.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                toast.success("Admin berhasil diperbarui");
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal memperbarui data");
            },
        });
    };

    const submitDeleteForm = () => {
        deleteForm.delete(route('admin.destroy', currentAdmin.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                toast.success("Admin berhasil dihapus");
            },
            onError: (errors) => {
                console.error("Delete error:", errors);
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus data");
            },
        });
    };

    
    React.useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Admin Manajemen" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Admin Manajemen</h2>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    >
                        <span className="flex items-center">
                            <Plus className="h-5 w-5 mr-1" />
                            Tambah Admin Baru
                        </span>
                    </button>
                </div>

                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratorium</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">{admin.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{admin.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{admin.laboratory?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                onClick={() => openEditModal(admin)}
                                                
                                                title="Edit"
                                            >
    <Edit className="w-4 h-4" />
</button>
                                            <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                onClick={() => openDeleteModal(admin)}
                                                
                                                title="Hapus"
                                            >
    <Trash2 className="w-4 h-4" />
</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="md">
                <div className="max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900">Tambah Administrator Baru</h3>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form onSubmit={submitCreateForm} className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nama
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData("name", e.target.value)}
                                required
                            />
                            {createForm.errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData("email", e.target.value)}
                                required
                            />
                            {createForm.errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData("password", e.target.value)}
                                required
                            />
                            {createForm.errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.password}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                name="password_confirmation"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={createForm.data.password_confirmation}
                                onChange={(e) => createForm.setData("password_confirmation", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                name="role"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={createForm.data.role}
                                onChange={(e) => createForm.setData("role", e.target.value)}
                                required
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                    </option>
                                ))}
                            </select>
                            {createForm.errors.role && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.role}
                                </p>
                            )}
                        </div>
                        {createForm.data.role === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Laboratorium
                                </label>
                                <select
                                    name="laboratory_id"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={createForm.data.laboratory_id}
                                    onChange={(e) => createForm.setData("laboratory_id", e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Laboratorium</option>
                                    {laboratories.map((lab) => (
                                        <option key={lab.id} value={lab.id}>
                                            {lab.name}
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.laboratory_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.laboratory_id}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                disabled={createForm.processing}
                            >
                                {createForm.processing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal show={showEditModal && !!currentAdmin} onClose={() => setShowEditModal(false)} maxWidth="md">
                <div className="max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900">Edit Administrator</h3>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form onSubmit={submitEditForm} className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nama
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData("name", e.target.value)}
                                required
                            />
                            {editForm.errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData("email", e.target.value)}
                                required
                            />
                            {editForm.errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Password (kosongkan jika tidak ingin mengubah)
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={editForm.data.password}
                                onChange={(e) => editForm.setData("password", e.target.value)}
                            />
                            {editForm.errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.password}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                name="password_confirmation"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={editForm.data.password_confirmation}
                                onChange={(e) => editForm.setData("password_confirmation", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                name="role"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={editForm.data.role}
                                onChange={(e) => editForm.setData("role", e.target.value)}
                                required
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                    </option>
                                ))}
                            </select>
                            {editForm.errors.role && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.role}
                                </p>
                            )}
                        </div>
                        {editForm.data.role === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Laboratorium
                                </label>
                                <select
                                    name="laboratory_id"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={editForm.data.laboratory_id}
                                    onChange={(e) => editForm.setData("laboratory_id", e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Laboratorium</option>
                                    {laboratories.map((lab) => (
                                        <option key={lab.id} value={lab.id}>
                                            {lab.name}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.laboratory_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.laboratory_id}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                disabled={editForm.processing}
                            >
                                {editForm.processing ? "Memperbarui..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <ConfirmModal
                show={showDeleteModal && !!currentAdmin}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={submitDeleteForm}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus administrator "${currentAdmin?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}