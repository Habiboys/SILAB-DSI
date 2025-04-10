import React, { useState, Fragment } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { 
    PencilIcon, 
    TrashIcon, 
    PlusCircleIcon,
    XMarkIcon 
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Index({ admins, laboratories, roles, flash }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);

    // Form for creating a new admin
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        laboratory_id: '',
    });

    // Form for editing an admin
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        laboratory_id: '',
    });

    // Form for deleting an admin
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
                console.error("Create errors:", errors);
                if (errors.message) toast.error(errors.message);
                else toast.error("Gagal menambahkan data");
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
                console.error("Update errors:", errors);
                if (errors.message) toast.error(errors.message);
                else toast.error("Gagal memperbarui data");
            },
        });
    };

    const submitDeleteForm = (e) => {
        e.preventDefault();
        deleteForm.delete(route('admin.destroy', currentAdmin.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                toast.success("Admin berhasil dihapus");
            },
            onError: (error) => {
                console.error("Delete error:", error);
                toast.error("Gagal menghapus data");
            },
        });
    };

    // Handle flash messages
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
            <Head title="Manajemen Inventaris" />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Admin Manajemen</h2>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span className="flex items-center">
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Tambah Admin Baru
                        </span>
                    </button>
                </div>

                {/* Admin Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laboratory</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                        <button
                                            onClick={() => openEditModal(admin)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors focus:outline-none"
                                            title="Edit"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(admin)}
                                            className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                                            title="Hapus"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Create New Administrator</h3>
                            <button onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={submitCreateForm}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData("name", e.target.value)}
                                    required
                                />
                                {createForm.errors.name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {createForm.errors.name}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData("email", e.target.value)}
                                    required
                                />
                                {createForm.errors.email && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {createForm.errors.email}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData("password", e.target.value)}
                                    required
                                />
                                {createForm.errors.password && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {createForm.errors.password}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={createForm.data.password_confirmation}
                                    onChange={(e) => createForm.setData("password_confirmation", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    className="w-full px-3 py-2 border rounded-md"
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
                                    <div className="text-red-500 text-sm mt-1">
                                        {createForm.errors.role}
                                    </div>
                                )}
                            </div>
                            {createForm.data.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Laboratory
                                    </label>
                                    <select
                                        name="laboratory_id"
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={createForm.data.laboratory_id}
                                        onChange={(e) => createForm.setData("laboratory_id", e.target.value)}
                                        required
                                    >
                                        <option value="">Select Laboratory</option>
                                        {laboratories.map((lab) => (
                                            <option key={lab.id} value={lab.id}>
                                                {lab.name}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.laboratory_id && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {createForm.errors.laboratory_id}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                    disabled={createForm.processing}
                                >
                                    {createForm.processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && currentAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit Administrator</h3>
                            <button onClick={() => setShowEditModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={submitEditForm}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData("name", e.target.value)}
                                    required
                                />
                                {editForm.errors.name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {editForm.errors.name}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData("email", e.target.value)}
                                    required
                                />
                                {editForm.errors.email && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {editForm.errors.email}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password (leave blank to keep current)
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData("password", e.target.value)}
                                />
                                {editForm.errors.password && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {editForm.errors.password}
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editForm.data.password_confirmation}
                                    onChange={(e) => editForm.setData("password_confirmation", e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    className="w-full px-3 py-2 border rounded-md"
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
                                    <div className="text-red-500 text-sm mt-1">
                                        {editForm.errors.role}
                                    </div>
                                )}
                            </div>
                            {editForm.data.role === 'admin' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Laboratory
                                    </label>
                                    <select
                                        name="laboratory_id"
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={editForm.data.laboratory_id}
                                        onChange={(e) => editForm.setData("laboratory_id", e.target.value)}
                                        required
                                    >
                                        <option value="">Select Laboratory</option>
                                        {laboratories.map((lab) => (
                                            <option key={lab.id} value={lab.id}>
                                                {lab.name}
                                            </option>
                                        ))}
                                    </select>
                                    {editForm.errors.laboratory_id && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {editForm.errors.laboratory_id}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                    disabled={editForm.processing}
                                >
                                    {editForm.processing ? "Memperbarui..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Admin Modal */}
            {showDeleteModal && currentAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
                            <button onClick={() => setShowDeleteModal(false)}>&times;</button>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        Apakah Anda yakin ingin menghapus administrator "{currentAdmin.name}"? Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={submitDeleteForm}>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                    disabled={deleteForm.processing}
                                >
                                    Hapus
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}