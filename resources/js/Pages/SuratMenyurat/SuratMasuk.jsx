import ConfirmModal from "@/Components/ConfirmModal";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import {
    Download,
    Edit,
    FileText,
    MessageSquare,
    Plus,
    Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SuratMasuk = ({
    suratMasuk,
    kepengurusanLab,
    laboratorium,
    tahunKepengurusan,
    selectedLabId,
    selectedTahunId,
    anggotaLab,
    filters,
    flash,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canDisposisi,
}) => {
    const { selectedLab } = useLab();
    const { can } = usePermission();
    const { selected_kepengurusan } = usePage().props;

    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDisposisiModalOpen, setIsDisposisiModalOpen] = useState(false);
    const [selectedSurat, setSelectedSurat] = useState(null);

    // ---------------------------------------------------------------- Forms
    const createForm = useForm({
        kepengurusan_lab_id: kepengurusanLab?.id || "",
        nomor_surat_asal: "",
        asal_surat: "",
        perihal: "",
        tanggal_surat: "",
        tanggal_terima: new Date().toISOString().split("T")[0],
        isi_ringkas: "",
        file_surat: null,
    });

    const editForm = useForm({
        nomor_surat_asal: "",
        asal_surat: "",
        perihal: "",
        tanggal_surat: "",
        tanggal_terima: "",
        isi_ringkas: "",
        file_surat: null,
    });

    const disposisiForm = useForm({
        kepada_user_id: "",
        catatan: "",
    });

    // ---------------------------------------------------------------- Navigation
    const buildParams = useCallback(
        (extra = {}) => {
            const params = {};
            if (selected_kepengurusan?.id)
                params.kepengurusan_lab_id = selected_kepengurusan.id;
            else if (kepengurusanLab?.id)
                params.kepengurusan_lab_id = kepengurusanLab.id;
            params.search = search;
            params.perPage = perPage;
            return { ...params, ...extra };
        },
        [selected_kepengurusan, kepengurusanLab, search, perPage],
    );

    const navigate = (extra = {}) => {
        router.get(
            route("surat-menyurat.surat-masuk.index"),
            buildParams(extra),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((val) => navigate({ search: val, perPage }), 400),
        [kepengurusanLab, perPage, selected_kepengurusan],
    );

    const onSearchChange = (e) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handlePerPageChange = (e) => {
        const val = Number(e.target.value);
        setPerPage(val);
        navigate({ perPage: val });
    };

    // ---------------------------------------------------------------- CRUD
    const openCreateModal = () => {
        if (!kepengurusanLab) {
            toast.error("Silakan pilih laboratorium terlebih dahulu");
            return;
        }
        createForm.reset();
        createForm.setData({
            kepengurusan_lab_id: kepengurusanLab.id,
            nomor_surat_asal: "",
            asal_surat: "",
            perihal: "",
            tanggal_surat: "",
            tanggal_terima: new Date().toISOString().split("T")[0],
            isi_ringkas: "",
            file_surat: null,
        });
        setIsCreateModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("surat-menyurat.surat-masuk.store"), {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success("Surat masuk berhasil ditambahkan");
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                toast.error(msg || "Gagal menambahkan surat masuk");
            },
        });
    };

    const openEditModal = (surat) => {
        setSelectedSurat(surat);
        editForm.setData({
            nomor_surat_asal: surat.nomor_surat_asal,
            asal_surat: surat.asal_surat,
            perihal: surat.perihal,
            tanggal_surat: surat.tanggal_surat,
            tanggal_terima: surat.tanggal_terima,
            isi_ringkas: surat.isi_ringkas || "",
            file_surat: null,
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.post(
            route("surat-menyurat.surat-masuk.update", selectedSurat.id),
            {
                forceFormData: true,
                _method: "PUT",
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    editForm.reset();
                    setSelectedSurat(null);
                    toast.success("Surat masuk berhasil diperbarui");
                },
                onError: (errors) => {
                    const msg = Object.values(errors)[0];
                    toast.error(msg || "Gagal memperbarui surat masuk");
                },
            },
        );
    };

    const openDeleteModal = (surat) => {
        setSelectedSurat(surat);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        router.delete(
            route("surat-menyurat.surat-masuk.destroy", selectedSurat.id),
            {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setSelectedSurat(null);
                    toast.success("Surat masuk berhasil dihapus");
                },
                onError: () => toast.error("Gagal menghapus surat masuk"),
            },
        );
    };

    const openDisposisiModal = (surat) => {
        setSelectedSurat(surat);
        disposisiForm.reset();
        setIsDisposisiModalOpen(true);
    };

    const handleDisposisi = (e) => {
        e.preventDefault();
        disposisiForm.post(
            route("surat-menyurat.disposisi.store", selectedSurat.id),
            {
                onSuccess: () => {
                    setIsDisposisiModalOpen(false);
                    disposisiForm.reset();
                    setSelectedSurat(null);
                    toast.success("Disposisi berhasil ditambahkan");
                },
                onError: (errors) => {
                    const msg = Object.values(errors)[0];
                    toast.error(msg || "Gagal menambahkan disposisi");
                },
            },
        );
    };

    const handleExport = () => {
        if (!kepengurusanLab) return;
        window.location.href = route("surat-menyurat.surat-masuk.export", {
            kepengurusan_lab_id: kepengurusanLab.id,
        });
    };

    // ---------------------------------------------------------------- Flash
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // ---------------------------------------------------------------- Helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const statusBadge = (jumlah) => {
        if (jumlah === 0)
            return <span className="text-xs text-gray-400">-</span>;
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {jumlah} disposisi
            </span>
        );
    };

    // ---------------------------------------------------------------- Render
    return (
        <DashboardLayout>
            <Head title="Surat Masuk" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Surat Masuk
                        </h2>
                        {kepengurusanLab && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                {kepengurusanLab.laboratorium?.nama} &mdash;{" "}
                                {kepengurusanLab.tahunKepengurusan?.tahun}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Cari surat..."
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
                        </select>

                        {canExport && kepengurusanLab && (
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                                <Download className="w-4 h-4" /> Export Excel
                            </button>
                        )}
                        {canCreate && (
                            <button
                                onClick={openCreateModal}
                                disabled={!kepengurusanLab}
                                className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm
                                    ${!kepengurusanLab ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                            >
                                <Plus className="w-4 h-4" /> Tambah Surat
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {!kepengurusanLab ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                            Pilih laboratorium terlebih dahulu
                        </p>
                    </div>
                ) : suratMasuk?.data?.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                            Belum ada surat masuk
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        No Agenda
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Nomor Surat
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Asal
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Perihal
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tgl Surat
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tgl Terima
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Disposisi
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        File
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {suratMasuk.data.map((surat) => (
                                    <tr
                                        key={surat.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                            {surat.nomor_agenda}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                                            title={surat.nomor_surat_asal}
                                        >
                                            {surat.nomor_surat_asal}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                                            title={surat.asal_surat}
                                        >
                                            {surat.asal_surat}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                                            title={surat.perihal}
                                        >
                                            {surat.perihal}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDate(surat.tanggal_surat)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDate(surat.tanggal_terima)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {statusBadge(
                                                surat.jumlah_disposisi,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {surat.file_surat ? (
                                                <a
                                                    href={route(
                                                        "surat-menyurat.surat-masuk.download",
                                                        surat.id,
                                                    )}
                                                    className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                                                >
                                                    <Download className="w-3 h-3" />{" "}
                                                    Unduh
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <a
                                                    href={route(
                                                        "surat-menyurat.surat-masuk.disposisi",
                                                        surat.id,
                                                    )}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Lihat Disposisi"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </a>
                                                {canDisposisi && (
                                                    <button
                                                        onClick={() =>
                                                            openDisposisiModal(
                                                                surat,
                                                            )
                                                        }
                                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Tambah Disposisi"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(surat)
                                                        }
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                surat,
                                                            )
                                                        }
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {suratMasuk?.links && suratMasuk.links.length > 3 && (
                    <div className="px-6 py-4 border-t">
                        <Pagination links={suratMasuk.links} />
                    </div>
                )}
            </div>

            {/* -------------------------------------------------------- Create Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Tambah Surat Masuk
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Surat Asal{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={createForm.data.nomor_surat_asal}
                                onChange={(e) =>
                                    createForm.setData(
                                        "nomor_surat_asal",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                            {createForm.errors.nomor_surat_asal && (
                                <p className="text-red-500 text-xs mt-1">
                                    {createForm.errors.nomor_surat_asal}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Asal Surat{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={createForm.data.asal_surat}
                                onChange={(e) =>
                                    createForm.setData(
                                        "asal_surat",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Perihal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={createForm.data.perihal}
                            onChange={(e) =>
                                createForm.setData("perihal", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Surat{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={createForm.data.tanggal_surat}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_surat",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Terima{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={createForm.data.tanggal_terima}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_terima",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Isi Ringkas
                        </label>
                        <textarea
                            value={createForm.data.isi_ringkas}
                            onChange={(e) =>
                                createForm.setData(
                                    "isi_ringkas",
                                    e.target.value,
                                )
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            File Surat (PDF/DOC, maks 5 MB)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                                createForm.setData(
                                    "file_surat",
                                    e.target.files[0],
                                )
                            }
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {createForm.processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* -------------------------------------------------------- Edit Modal */}
            <Modal
                show={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedSurat(null);
                }}
                maxWidth="lg"
            >
                <form onSubmit={handleEdit} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Edit Surat Masuk
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Surat Asal{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editForm.data.nomor_surat_asal}
                                onChange={(e) =>
                                    editForm.setData(
                                        "nomor_surat_asal",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Asal Surat{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editForm.data.asal_surat}
                                onChange={(e) =>
                                    editForm.setData(
                                        "asal_surat",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Perihal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={editForm.data.perihal}
                            onChange={(e) =>
                                editForm.setData("perihal", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Surat{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={editForm.data.tanggal_surat}
                                onChange={(e) =>
                                    editForm.setData(
                                        "tanggal_surat",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Terima{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={editForm.data.tanggal_terima}
                                onChange={(e) =>
                                    editForm.setData(
                                        "tanggal_terima",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Isi Ringkas
                        </label>
                        <textarea
                            value={editForm.data.isi_ringkas}
                            onChange={(e) =>
                                editForm.setData("isi_ringkas", e.target.value)
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ganti File{" "}
                            {selectedSurat?.file_surat && (
                                <span className="text-gray-400 text-xs">
                                    (sudah ada file)
                                </span>
                            )}
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                                editForm.setData(
                                    "file_surat",
                                    e.target.files[0],
                                )
                            }
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setSelectedSurat(null);
                            }}
                            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {editForm.processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* -------------------------------------------------------- Disposisi Modal */}
            <Modal
                show={isDisposisiModalOpen}
                onClose={() => {
                    setIsDisposisiModalOpen(false);
                    setSelectedSurat(null);
                }}
                maxWidth="md"
            >
                <form onSubmit={handleDisposisi} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Tambah Disposisi
                    </h3>
                    {selectedSurat && (
                        <div className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-600">
                            <p>
                                <span className="font-medium">Perihal:</span>{" "}
                                {selectedSurat.perihal}
                            </p>
                            <p>
                                <span className="font-medium">Nomor:</span>{" "}
                                {selectedSurat.nomor_surat_asal}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kepada <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={disposisiForm.data.kepada_user_id}
                            onChange={(e) =>
                                disposisiForm.setData(
                                    "kepada_user_id",
                                    e.target.value,
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        >
                            <option value="">-- Pilih anggota --</option>
                            {anggotaLab?.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        {disposisiForm.errors.kepada_user_id && (
                            <p className="text-red-500 text-xs mt-1">
                                {disposisiForm.errors.kepada_user_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                        </label>
                        <textarea
                            value={disposisiForm.data.catatan}
                            onChange={(e) =>
                                disposisiForm.setData("catatan", e.target.value)
                            }
                            rows={3}
                            placeholder="Instruksi atau catatan tambahan..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsDisposisiModalOpen(false);
                                setSelectedSurat(null);
                            }}
                            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={disposisiForm.processing}
                            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {disposisiForm.processing
                                ? "Mengirim..."
                                : "Kirim Disposisi"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* -------------------------------------------------------- Delete Confirm */}
            <ConfirmModal
                show={isDeleteModalOpen}
                title="Hapus Surat Masuk"
                message={`Yakin ingin menghapus surat agenda #${selectedSurat?.nomor_agenda}? Semua disposisi terkait akan ikut terhapus.`}
                confirmText="Hapus"
                confirmClassName="bg-red-600 text-white hover:bg-red-700"
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedSurat(null);
                }}
            />
        </DashboardLayout>
    );
};

export default SuratMasuk;
