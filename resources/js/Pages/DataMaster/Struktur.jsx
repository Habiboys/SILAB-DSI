import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import DashboardLayout from "../../Layouts/DashboardLayout";

const DataMasterStruktur = ({ struktur, roles, parentOptions = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingStruktur, setEditingStruktur] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingStruktur, setDeletingStruktur] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        struktur: "",
        jabatan_tunggal: true,
        default_role_id: "",
        parent_id: "",
    });

    const openModal = (strukturData = null) => {
        if (strukturData) {
            setEditingStruktur(strukturData);
            setData({
                struktur: strukturData.struktur,
                jabatan_tunggal: strukturData.jabatan_tunggal,
                default_role_id: strukturData.default_role_id || "",
                parent_id: strukturData.parent_id || "",
            });
        } else {
            setEditingStruktur(null);
            reset();
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStruktur(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingStruktur) {
            put(route("data-master.struktur.update", editingStruktur.id), {
                onSuccess: () => {
                    closeModal();
                    toast.success("Struktur berhasil diperbarui");
                },
                onError: () => {
                    toast.error("Gagal memperbarui struktur");
                },
            });
        } else {
            post(route("data-master.struktur.store"), {
                onSuccess: () => {
                    closeModal();
                    toast.success("Struktur berhasil ditambahkan");
                },
                onError: () => {
                    toast.error("Gagal menambahkan struktur");
                },
            });
        }
    };

    const openDeleteModal = (strukturData) => {
        setDeletingStruktur(strukturData);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingStruktur(null);
    };

    const handleDelete = () => {
        destroy(route("data-master.struktur.destroy", deletingStruktur.id), {
            onSuccess: () => {
                closeDeleteModal();
                toast.success("Struktur berhasil dihapus");
            },
            onError: () => {
                toast.error("Gagal menghapus struktur");
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Data Master - Struktur Jabatan" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Data Master - Struktur Jabatan
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Kelola data master struktur jabatan dan set role
                            default untuk user
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
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
                        Tambah Struktur
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
                                    Nama Struktur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Induk (Parent)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jabatan Tunggal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Default Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {struktur.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        Belum ada data struktur jabatan
                                    </td>
                                </tr>
                            ) : (
                                struktur.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.struktur}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.parent ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3 w-3"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    {item.parent.struktur}
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Koordinator
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.jabatan_tunggal ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                            >
                                                {item.jabatan_tunggal
                                                    ? "Ya"
                                                    : "Tidak"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                                                {item.default_role?.name || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openModal(item)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Edit"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(item)
                                                }
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Hapus"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                show={showModal}
                onClose={closeModal}
                maxWidth="md"
            >
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {editingStruktur
                                    ? "Edit Struktur"
                                    : "Tambah Struktur"}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Struktur{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.struktur}
                                    onChange={(e) =>
                                        setData("struktur", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.struktur && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.struktur}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Default Role{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.default_role_id}
                                    onChange={(e) =>
                                        setData(
                                            "default_role_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                                    required
                                >
                                    <option value="">Pilih Role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.default_role_id && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.default_role_id}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    User yang masuk ke struktur ini akan
                                    otomatis mendapatkan role yang dipilih.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Induk (Parent) Struktur
                                </label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) =>
                                        setData("parent_id", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">
                                        — Tidak ada (ini adalah
                                        koordinator/parent) —
                                    </option>
                                    {parentOptions
                                        .filter(
                                            (p) =>
                                                !editingStruktur ||
                                                p.id !== editingStruktur.id,
                                        )
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.struktur}
                                            </option>
                                        ))}
                                </select>
                                {errors.parent_id && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.parent_id}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Pilih jika ini adalah jabatan
                                    anggota/bawahan dari suatu divisi. Kosongkan
                                    jika ini adalah koordinator/kepala divisi.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.jabatan_tunggal}
                                        onChange={(e) =>
                                            setData(
                                                "jabatan_tunggal",
                                                e.target.checked,
                                            )
                                        }
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Jabatan Tunggal
                                    </span>
                                </label>
                                {errors.jabatan_tunggal && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.jabatan_tunggal}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {processing
                                        ? "Menyimpan..."
                                        : editingStruktur
                                          ? "Perbarui"
                                          : "Simpan"}
                                </button>
                            </div>
                        </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                show={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={
                    deletingStruktur
                        ? `Apakah Anda yakin ingin menghapus struktur "${deletingStruktur.struktur}"? Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText={processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default DataMasterStruktur;
