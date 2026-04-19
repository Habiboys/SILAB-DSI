import { Head, useForm, usePage } from "@inertiajs/react";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLab } from "../Components/LabContext";
import Modal from "../Components/Modal";
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const formatTanggal = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });
};

const KepengurusanLab = ({ kepengurusanLab, tahunKepengurusan, flash }) => {
    const { selectedLab } = useLab();
    const { auth } = usePage().props;
    const { can, hasRole } = usePermission();

    // Permission-based access control
    const canManage =
        can("kepengurusan.manage-struktur") ||
        can("kepengurusan.manage-anggota") ||
        hasRole(["admin", "superadmin", "kadep"]);
    const canManageKepengurusan = () => canManage;

    // State untuk modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form untuk create
    const createForm = useForm({
        tahun_kepengurusan_id: "",
        laboratorium_id: selectedLab ? selectedLab.id : null,
        sk: null,
    });

    // Form untuk edit - perbaikan di sini
    const editForm = useForm({
        sk: null,
        _method: "PUT", // Menambahkan method spoofing
    });

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData(
            "laboratorium_id",
            selectedLab ? selectedLab.id : null,
        );
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        createForm.reset();
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.reset();
        editForm.setData({
            sk: null,
            _method: "PUT",
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
        createForm.post(route("kepengurusan-lab.store"), {
            // preserveState: false,
            onSuccess: () => {
                closeCreateModal();
                toast.success("Kepengurusan Lab berhasil ditambahkan");

                // router.reload();
            },
            onError: (errors) => {
                if (errors.duplicate) {
                    toast.error(errors.duplicate);
                } else if (errors.laboratorium_id) {
                    toast.error(errors.laboratorium_id);
                } else if (errors.tahun_kepengurusan_id) {
                    toast.error(errors.tahun_kepengurusan_id);
                } else if (errors.sk) {
                    toast.error(errors.sk);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error("Gagal menambahkan data");
                }
            },
            forceFormData: true,
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        // Perbaikan logic upload file
        if (!editForm.data.sk) {
            toast.warning("Tidak ada file yang dipilih");
            return;
        }

        // Menggunakan post dengan method spoofing sebagai ganti put
        editForm.post(route("kepengurusan-lab.update", selectedItem.id), {
            onSuccess: () => {
                closeEditModal();
                toast.success("SK Kepengurusan Lab berhasil diperbarui");
            },
            onError: (errors) => {
                if (errors.sk) {
                    toast.error(errors.sk);
                } else {
                    toast.error("Gagal memperbarui data");
                }
            },
            forceFormData: true, // Memastikan dikirim sebagai multipart/form-data
        });
    };

    // Flash message handler
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Kepengurusan Lab" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Periode Kepengurusan Lab {selectedLab?.nama}
                    </h2>

                    <div className="flex items-center space-x-4">
                        {canManageKepengurusan() && (
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Tambah Baru
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tahun Kepengurusan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mulai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Selesai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SK
                                </th>
                                {canManageKepengurusan() && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {kepengurusanLab && kepengurusanLab.length > 0 ? (
                                kepengurusanLab.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.tahun_kepengurusan?.tahun ||
                                                "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatTanggal(
                                                item.tahun_kepengurusan?.mulai,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatTanggal(
                                                item.tahun_kepengurusan
                                                    ?.selesai,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.tahun_kepengurusan
                                                        ?.isactive == 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {item.tahun_kepengurusan
                                                    ?.isactive == 1
                                                    ? "Aktif"
                                                    : "Tidak Aktif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.sk ? (
                                                <a
                                                    href={route(
                                                        "kepengurusan-lab.download-sk",
                                                        item.id,
                                                    )}
                                                    className="text-blue-600 hover:text-blue-900 underline"
                                                >
                                                    Unduh SK
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">
                                                    Tidak ada file
                                                </span>
                                            )}
                                        </td>
                                        {canManageKepengurusan() && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(item)
                                                    }
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors focus:outline-none p-1"
                                                    title="Edit SK"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                    >
                                        Tidak ada data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                show={isCreateModalOpen}
                maxWidth="md"
                onClose={closeCreateModal}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Kepengurusan Lab
                        </h3>
                        <button
                            onClick={closeCreateModal}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleCreate} encType="multipart/form-data">
                        <div className="mb-4">
                            <label
                                htmlFor="create-tahun"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Tahun Kepengurusan
                            </label>
                            <select
                                id="create-tahun"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.tahun_kepengurusan_id
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.tahun_kepengurusan_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tahun_kepengurusan_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">
                                    Pilih Tahun Kepengurusan
                                </option>
                                {tahunKepengurusan
                                    .filter(
                                        (tahun) =>
                                            !kepengurusanLab.some(
                                                (kep) =>
                                                    kep.tahun_kepengurusan_id ===
                                                    tahun.id,
                                            ),
                                    )
                                    .map((tahun) => (
                                        <option key={tahun.id} value={tahun.id}>
                                            {tahun.tahun}{" "}
                                            {tahun.mulai &&
                                                `(${formatTanggal(tahun.mulai)} - ${tahun.selesai ? formatTanggal(tahun.selesai) : "Sekarang"})`}
                                        </option>
                                    ))}
                            </select>
                            {createForm.errors.tahun_kepengurusan_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.tahun_kepengurusan_id}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="create-sk"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                File SK (PDF, maks. 5MB)
                            </label>
                            <input
                                type="file"
                                id="create-sk"
                                name="sk"
                                accept=".pdf"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.sk
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                onChange={(e) =>
                                    createForm.setData("sk", e.target.files[0])
                                }
                            />
                            {createForm.errors.sk && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.sk}
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

            {/* Edit Modal - fixed */}
            <Modal
                show={isEditModalOpen && !!selectedItem}
                maxWidth="md"
                onClose={closeEditModal}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Update SK Kepengurusan Lab
                        </h3>
                        <button
                            onClick={closeEditModal}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleEdit} encType="multipart/form-data">
                        {/* Hidden field for method spoofing */}
                        <input type="hidden" name="_method" value="PUT" />

                        <div className="mb-4">
                            <label
                                htmlFor="edit-sk"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                File SK Baru (PDF, maks. 5MB)
                            </label>
                            <input
                                type="file"
                                id="edit-sk"
                                name="sk"
                                accept=".pdf"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.sk
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    editForm.setData("sk", file);
                                }}
                            />
                            {editForm.errors.sk && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.sk}
                                </p>
                            )}

                            {selectedItem?.sk && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>
                                        SK saat ini:
                                        <a
                                            href={route(
                                                "kepengurusan-lab.download-sk",
                                                selectedItem?.id,
                                            )}
                                            className="text-blue-600 hover:text-blue-900 ml-1"
                                        >
                                            Unduh SK
                                        </a>
                                    </p>
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

export default KepengurusanLab;
