import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Edit, Trash2 } from "lucide-react";

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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memperbarui struktur");
                },
            });
        } else {
            post(route("data-master.struktur.store"), {
                onSuccess: () => {
                    closeModal();
                    toast.success("Struktur berhasil ditambahkan");
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menambahkan struktur");
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus struktur");
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
                                    Role Default
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
                                            <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                onClick={() => openModal(item)}
                                                
                                                title="Edit"
                                            >
    <Edit className="w-4 h-4" />
</button>
                                            <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                onClick={() =>
                                                    openDeleteModal(item)
                                                }
                                                
                                                title="Hapus"
                                            >
    <Trash2 className="w-4 h-4" />
</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            
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
                                    Role Default{" "}
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
