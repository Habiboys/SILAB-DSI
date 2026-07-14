import { Head, router, useForm } from "@inertiajs/react";
import React, { useState } from "react";
import { toast } from "sonner";
import Modal from "../../Components/Modal";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Edit } from "lucide-react";

const Laboratorium = ({ laboratorium, flash }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    
    const createForm = useForm({
        nama: "",
        logo: null,
    });

    
    const editForm = useForm({
        nama: "",
        logo: null,
    });

    const openCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        createForm.reset();
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            nama: item.nama,
            logo: null,
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedItem(null);
        editForm.reset();
    };

    const handleCreate = (e) => {
        e.preventDefault();

        createForm.post(route("laboratorium.store"), {
            onSuccess: () => {
                closeCreateModal();
                toast.success("Data Laboratorium berhasil ditambahkan");
            },
            onError: (errors) => {
                if (errors.logo) {
                    toast.error(errors.logo);
                } else {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menambahkan data");
                }
            },
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        
        console.log("Form data:", editForm.data);
        console.log("Selected item:", selectedItem);

        
        editForm.post(route("laboratorium.update", selectedItem.id), {
            onSuccess: (page) => {
                console.log("Success response:", page);
                closeEditModal();
                toast.success("Data Laboratorium berhasil diperbarui");
            },
            onError: (errors) => {
                console.log("Validation errors:", errors);
                if (errors.logo) {
                    toast.error(errors.logo);
                } else {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memperbarui data");
                }
            },
        });
    };

    const handleToggle = (item) => {
        router.post(
            route("laboratorium.toggle", item.id),
            {},
            {
                onSuccess: () => {
                    toast.success(
                        item.is_active
                            ? "Laboratorium berhasil dinonaktifkan"
                            : "Laboratorium berhasil diaktifkan",
                    );
                },
                onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal memperbarui status");
            },
            },
        );
    };

    
    React.useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Data Laboratorium" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Data Laboratorium
                        </h2>
                        <p className="text-sm text-gray-600">
                            Kelola data laboratorium
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring ring-blue-300 transition ease-in-out duration-150"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-4 h-4 mr-2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah Laboratorium
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Laboratorium
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Logo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {laboratorium.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {item.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.logo ? (
                                            <img
                                                src={`/storage/${item.logo}`}
                                                alt="Logo"
                                                className="h-8 w-8 object-contain"
                                            />
                                        ) : (
                                            <span className="text-gray-400">
                                                Tidak ada logo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                                                item.is_active
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {item.is_active
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-3">
                                            <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                onClick={() =>
                                                    openEditModal(item)
                                                }
                                                
                                                title="Edit Laboratorium"
                                            >
    <Edit className="w-4 h-4" />
</button>
                                            <button
                                                onClick={() =>
                                                    handleToggle(item)
                                                }
                                                className={`text-xs font-medium px-2.5 py-1 rounded ${
                                                    item.is_active
                                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                }`}
                                                title={
                                                    item.is_active
                                                        ? "Nonaktifkan"
                                                        : "Aktifkan"
                                                }
                                            >
                                                {item.is_active
                                                    ? "Nonaktifkan"
                                                    : "Aktifkan"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {laboratorium.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                    >
                                        Tidak ada data laboratorium
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Laboratorium
                        </h3>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label
                                htmlFor="create-nama"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nama Laboratorium
                            </label>
                            <input
                                type="text"
                                id="create-nama"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.nama
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.nama}
                                onChange={(e) =>
                                    createForm.setData("nama", e.target.value)
                                }
                                required
                            />
                            {createForm.errors.nama && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.nama}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="create-logo"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Logo (Opsional)
                            </label>
                            <input
                                type="file"
                                id="create-logo"
                                accept="image/*"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.logo
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                onChange={(e) =>
                                    createForm.setData(
                                        "logo",
                                        e.target.files[0],
                                    )
                                }
                            />
                            {createForm.errors.logo && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.logo}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isEditModalOpen && !!selectedItem}
                onClose={closeEditModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Edit Laboratorium
                        </h3>
                    </div>

                    <form onSubmit={handleEdit}>
                        <div className="mb-4">
                            <label
                                htmlFor="edit-nama"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nama Laboratorium
                            </label>
                            <input
                                type="text"
                                id="edit-nama"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.nama
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={editForm.data.nama}
                                onChange={(e) =>
                                    editForm.setData("nama", e.target.value)
                                }
                                required
                            />
                            {editForm.errors.nama && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.nama}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="edit-logo"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Logo (Opsional)
                            </label>
                            <input
                                type="file"
                                id="edit-logo"
                                accept="image/*"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.logo
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                onChange={(e) =>
                                    editForm.setData("logo", e.target.files[0])
                                }
                            />
                            {editForm.errors.logo && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.logo}
                                </p>
                            )}
                            {selectedItem && selectedItem.logo && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-1">
                                        Logo saat ini:
                                    </p>
                                    <img
                                        src={`/storage/${selectedItem.logo}`}
                                        alt="Current Logo"
                                        className="h-12 w-12 object-contain border rounded"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Laboratorium;
