import ActionButtons from "@/Components/ActionButtons";
import ConfirmModal from "@/Components/ConfirmModal";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLab } from "../Components/LabContext";
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const Struktur = ({ struktur, kepengurusanlab, filters, flash }) => {
    const { selectedLab } = useLab();
    const { can } = usePermission();

    // Permission-based access control
    const canAccess = can("struktur.manage");

    // Search & per-page state
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form untuk create
    const createForm = useForm({
        struktur: "",
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        proker: null,
        tipe_jabatan: "asisten",
        jabatan_tunggal: true,
        jabatan_terkait: "",
    });

    // Form untuk edit
    const editForm = useForm({
        struktur: "",
        proker: null,
        tipe_jabatan: "",
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        jabatan_tunggal: true,
        jabatan_terkait: "",
    });

    // Form untuk delete
    const deleteForm = useForm({});

    // Debounced search handler
    const handleSearch = debounce((query) => {
        router.get(
            route(route().current()),
            { ...filters, search: query, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);

    const onSearchChange = (e) => {
        setSearch(e.target.value);
        handleSearch(e.target.value);
    };

    const handlePerPageChange = (e) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        router.get(
            route(route().current()),
            { ...filters, perPage: newPerPage, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    // Handler untuk membuka modal
    const openCreateModal = () => {
        if (!kepengurusanlab) {
            toast.error(
                "Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu",
            );
            return;
        }
        createForm.reset();
        createForm.setData("kepengurusan_lab_id", kepengurusanlab.id);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            struktur: item.struktur,
            proker: null,
            tipe_jabatan: item.tipe_jabatan, // Add this line
            kepengurusan_lab_id: kepengurusanlab.id,
            jabatan_tunggal: item.jabatan_tunggal ?? true, // set dari data
            jabatan_terkait: item.jabatan_terkait || "", // baru
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    // Handler untuk submit form
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("struktur.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                toast.success("Struktur berhasil ditambahkan");
            },
            onError: (errors) => {
                console.error("Create errors:", errors);
                if (errors.message) toast.error(errors.message);
                else toast.error("Gagal menambahkan data");
            },
            forceFormData: true,
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        // Debug info
        console.log("Form data being sent:", editForm.data);

        editForm.post(route("struktur.update", selectedItem.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success("Struktur berhasil diperbarui");
            },
            onError: (errors) => {
                console.error("Update errors:", errors);
                if (errors.struktur) toast.error(errors.struktur);
                else toast.error("Gagal memperbarui data");
            },
            forceFormData: true,
        });
    };

    const handleDelete = () => {
        deleteForm.delete(route("struktur.destroy", selectedItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
                toast.success("Struktur berhasil dihapus");
            },
            onError: (error) => {
                console.error("Delete error:", error);
                toast.error("Gagal menghapus data");
            },
        });
    };

    // Update data when lab changes - Navbar handles year/kepengurusan
    useEffect(() => {
        if (selectedLab) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLabId = urlParams.get("lab_id");
            if (urlLabId !== String(selectedLab.id)) {
                router.visit("/struktur", {
                    data: { lab_id: selectedLab.id },
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }
    }, [selectedLab]);

    useEffect(() => {
        if (flash && flash.message) toast.success(flash.message);
        if (flash && flash.error) toast.error(flash.error);
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Struktur Organisasi" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Daftar Struktur / Jabatan Laboratorium
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Cari jabatan..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                        />
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="10">10 / hal</option>
                            <option value="25">25 / hal</option>
                            <option value="50">50 / hal</option>
                            <option value="100">100 / hal</option>
                        </select>
                        {canAccess && (
                            <button
                                onClick={openCreateModal}
                                disabled={!kepengurusanlab}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 text-sm"
                            >
                                + Tambah Struktur
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabel */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jabatan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Program Kerja
                                </th>
                                {/* Only show Action column for admin users */}
                                {canAccess && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {struktur?.data?.length > 0 ? (
                                struktur.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(struktur.from || 0) + index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                            {item.struktur}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.proker_path ? (
                                                <a
                                                    href={item.proker_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    Lihat Program Kerja
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Tidak ada program kerja
                                                </span>
                                            )}
                                        </td>
                                        {canAccess && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <ActionButtons
                                                    item={{
                                                        ...item,
                                                        kepengurusanlab,
                                                    }}
                                                    onEdit={openEditModal}
                                                    onDelete={openDeleteModal}
                                                    editLabel="Edit"
                                                    deleteLabel="Hapus"
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={canAccess ? "4" : "3"}
                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                    >
                                        <div className="flex flex-col items-center">
                                            <p>Tidak ada data struktur</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {struktur?.links && (
                        <div className="p-4 border-t">
                            <Pagination links={struktur.links} />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Create */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Struktur
                        </h3>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Jabatan
                            </label>
                            <input
                                type="text"
                                name="struktur"
                                className="w-full px-3 py-2 border rounded-md"
                                value={createForm.data.struktur}
                                onChange={(e) =>
                                    createForm.setData(
                                        "struktur",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {createForm.errors.struktur && (
                                <div className="text-red-500 text-sm mt-1">
                                    {createForm.errors.struktur}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Jabatan
                            </label>
                            <select
                                name="tipe_jabatan"
                                className="w-full px-3 py-2 border rounded-md"
                                value={createForm.data.tipe_jabatan}
                                onChange={(e) => {
                                    createForm.setData(
                                        "tipe_jabatan",
                                        e.target.value,
                                    );
                                    if (e.target.value !== "dosen")
                                        createForm.setData(
                                            "jabatan_terkait",
                                            "",
                                        );
                                }}
                                required
                            >
                                <option value="">Pilih Tipe Jabatan</option>
                                <option value="dosen">Dosen</option>
                                <option value="asisten">Asisten</option>
                            </select>
                            {createForm.errors.tipe_jabatan && (
                                <div className="text-red-500 text-sm mt-1">
                                    {createForm.errors.tipe_jabatan}
                                </div>
                            )}
                        </div>
                        {createForm.data.tipe_jabatan === "dosen" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jabatan Terkait
                                </label>
                                <select
                                    name="jabatan_terkait"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={createForm.data.jabatan_terkait}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "jabatan_terkait",
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Pilih Jabatan</option>
                                    <option value="kalab">
                                        Kepala Laboratorium
                                    </option>
                                    <option value="dosen">Anggota</option>
                                </select>
                                {createForm.errors.jabatan_terkait && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {createForm.errors.jabatan_terkait}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Program Kerja (PDF)
                            </label>
                            <input
                                type="file"
                                name="proker"
                                accept=".pdf"
                                onChange={(e) =>
                                    createForm.setData(
                                        "proker",
                                        e.target.files[0],
                                    )
                                }
                            />
                            {createForm.errors.proker && (
                                <div className="text-red-500 text-sm mt-1">
                                    {createForm.errors.proker}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jabatan Tunggal?
                            </label>
                            <select
                                name="jabatan_tunggal"
                                className="w-full px-3 py-2 border rounded-md"
                                value={
                                    createForm.data.jabatan_tunggal
                                        ? "true"
                                        : "false"
                                }
                                onChange={(e) =>
                                    createForm.setData(
                                        "jabatan_tunggal",
                                        e.target.value === "true",
                                    )
                                }
                                required
                            >
                                <option value="true">Hanya satu orang</option>
                                <option value="false">
                                    Bisa diisi banyak orang
                                </option>
                            </select>
                            {createForm.errors.jabatan_tunggal && (
                                <div className="text-red-500 text-sm mt-1">
                                    {createForm.errors.jabatan_tunggal}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Edit */}
            <Modal
                show={isEditModalOpen && !!selectedItem}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Edit Struktur</h3>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handleEdit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Jabatan
                            </label>
                            <input
                                type="text"
                                name="struktur"
                                className="w-full px-3 py-2 border rounded-md"
                                value={editForm.data.struktur}
                                onChange={(e) =>
                                    editForm.setData("struktur", e.target.value)
                                }
                                required
                            />
                            {editForm.errors.struktur && (
                                <div className="text-red-500 text-sm mt-1">
                                    {editForm.errors.struktur}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Jabatan
                            </label>
                            <select
                                name="tipe_jabatan"
                                className="w-full px-3 py-2 border rounded-md"
                                value={editForm.data.tipe_jabatan}
                                onChange={(e) => {
                                    editForm.setData(
                                        "tipe_jabatan",
                                        e.target.value,
                                    );
                                    if (e.target.value !== "dosen")
                                        editForm.setData("jabatan_terkait", "");
                                }}
                                required
                            >
                                <option value="">Pilih Tipe Jabatan</option>
                                <option value="dosen">Dosen</option>
                                <option value="asisten">Asisten</option>
                            </select>
                            {editForm.errors.tipe_jabatan && (
                                <div className="text-red-500 text-sm mt-1">
                                    {editForm.errors.tipe_jabatan}
                                </div>
                            )}
                        </div>
                        {editForm.data.tipe_jabatan === "dosen" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jabatan Terkait
                                </label>
                                <select
                                    name="jabatan_terkait"
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editForm.data.jabatan_terkait}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "jabatan_terkait",
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Pilih Jabatan</option>
                                    <option value="kalab">
                                        Kepala Laboratorium
                                    </option>
                                    <option value="dosen">Dosen</option>
                                </select>
                                {editForm.errors.jabatan_terkait && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {editForm.errors.jabatan_terkait}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Program Kerja Baru (PDF)
                            </label>
                            <input
                                type="file"
                                name="proker"
                                accept=".pdf"
                                onChange={(e) =>
                                    editForm.setData(
                                        "proker",
                                        e.target.files[0],
                                    )
                                }
                            />
                            {editForm.errors.proker && (
                                <div className="text-red-500 text-sm mt-1">
                                    {editForm.errors.proker}
                                </div>
                            )}
                            {selectedItem.proker_path && (
                                <div className="mt-2 text-sm">
                                    <span>Program kerja saat ini: </span>
                                    <a
                                        href={selectedItem.proker_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Lihat file
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jabatan Tunggal?
                            </label>
                            <select
                                name="jabatan_tunggal"
                                className="w-full px-3 py-2 border rounded-md"
                                value={
                                    editForm.data.jabatan_tunggal
                                        ? "true"
                                        : "false"
                                }
                                onChange={(e) =>
                                    editForm.setData(
                                        "jabatan_tunggal",
                                        e.target.value === "true",
                                    )
                                }
                                required
                            >
                                <option value="true">Hanya satu orang</option>
                                <option value="false">
                                    Bisa diisi banyak orang
                                </option>
                            </select>
                            {editForm.errors.jabatan_tunggal && (
                                <div className="text-red-500 text-sm mt-1">
                                    {editForm.errors.jabatan_tunggal}
                                </div>
                            )}
                        </div>
                        <input
                            type="hidden"
                            name="kepengurusan_lab_id"
                            value={editForm.data.kepengurusan_lab_id}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
                                    ? "Memperbarui..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Delete */}
            <ConfirmModal
                show={isDeleteModalOpen && !!selectedItem}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Struktur"
                message={`Apakah Anda yakin ingin menghapus struktur "${selectedItem?.struktur}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default Struktur;
