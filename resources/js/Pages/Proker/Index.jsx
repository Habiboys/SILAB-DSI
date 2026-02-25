import ActionButtons from "@/Components/ActionButtons";
import ConfirmModal from "@/Components/ConfirmModal";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SP_BADGE = {
    draft: "bg-gray-100 text-gray-700",
    diajukan: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    ditolak: "bg-red-100 text-red-800",
};
const SP_TEXT = {
    draft: "Draft",
    diajukan: "Diajukan",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
};
const S_BADGE = {
    belum_mulai: "bg-gray-100 text-gray-800",
    sedang_berjalan: "bg-blue-100 text-blue-800",
    selesai: "bg-green-100 text-green-800",
    ditunda: "bg-red-100 text-red-800",
};
const S_TEXT = {
    belum_mulai: "Belum Mulai",
    sedang_berjalan: "Sedang Berjalan",
    selesai: "Selesai",
    ditunda: "Ditunda",
};

const Proker = ({
    prokerData,
    kepengurusanlab,
    strukturList,
    tahunKepengurusan,
    selectedTahun: initialSelectedTahun,
    laboratorium,
    filters,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [editingProker, setEditingProker] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProker, setDeletingProker] = useState(null);

    const { selectedLab } = useLab();

    useEffect(() => {
        if (selectedLab) setData("lab_id", selectedLab.id);
    }, [selectedLab]);

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
        lab_id: selectedLab?.id || "",
        kepengurusan_lab_id: kepengurusanlab?.id || "",
        struktur_id: "",
        nama_proker: "",
        deskripsi: "",
        tujuan: "",
        sasaran: "",
        output_kegiatan: "",
        status: "belum_mulai",
        tanggal_mulai: "",
        tanggal_selesai: "",
        keterangan: "",
        file_proker: null,
    });

    const openModal = (prokerItem = null) => {
        if (prokerItem) {
            setEditingProker(prokerItem);
            setData({
                _method: "put",
                lab_id: selectedLab?.id || "",
                kepengurusan_lab_id: prokerItem.kepengurusan_lab_id,
                struktur_id: prokerItem.struktur_id,
                nama_proker:
                    prokerItem.nama_proker || prokerItem.deskripsi || "",
                deskripsi: prokerItem.deskripsi || "",
                tujuan: prokerItem.tujuan || "",
                sasaran: prokerItem.sasaran || "",
                output_kegiatan: prokerItem.output_kegiatan || "",
                status: prokerItem.status,
                tanggal_mulai: prokerItem.tanggal_mulai || "",
                tanggal_selesai: prokerItem.tanggal_selesai || "",
                keterangan: prokerItem.keterangan || "",
                file_proker: null,
            });
        } else {
            setEditingProker(null);
            reset();
            setData("lab_id", selectedLab?.id || "");
            setData("kepengurusan_lab_id", kepengurusanlab?.id || "");
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProker(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProker) {
            post(route("proker.update", editingProker.id), {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success("Program kerja berhasil diperbarui");
                },
                onError: () => toast.error("Gagal memperbarui program kerja"),
            });
        } else {
            post(route("proker.store"), {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success("Program kerja berhasil ditambahkan");
                },
                onError: () => toast.error("Gagal menambahkan program kerja"),
            });
        }
    };

    const openDeleteModal = (prokerItem) => {
        setDeletingProker(prokerItem);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingProker(null);
    };

    const handleDelete = () => {
        destroy(route("proker.destroy", deletingProker.id), {
            onSuccess: () => {
                closeDeleteModal();
                toast.success("Program kerja berhasil dihapus");
            },
            onError: () => {
                toast.error("Gagal menghapus program kerja");
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Program Kerja" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Program Kerja Laboratorium
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Kelola program kerja berdasarkan divisi dan periode
                            kepengurusan
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {kepengurusanlab?.tahun_kepengurusan?.isactive == 1 && (
                            <button
                                onClick={() => openModal()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                                disabled={!kepengurusanlab}
                            >
                                <span className="flex items-center gap-1">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Tambah
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {!selectedLab && (
                    <div className="p-8 text-center text-gray-500">
                        Silakan pilih laboratorium dari navbar terlebih dahulu
                    </div>
                )}
                {selectedLab && !kepengurusanlab && (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada kepengurusan yang dipilih atau aktif
                    </div>
                )}

                {kepengurusanlab && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Program Kerja
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Divisi / PJ
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Parameter
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Capaian
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {prokerData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            Belum ada program kerja untuk
                                            periode ini
                                        </td>
                                    </tr>
                                ) : (
                                    prokerData.map((item, index) => {
                                        const spBadge =
                                            SP_BADGE[item.status_pengajuan] ??
                                            "bg-gray-100 text-gray-700";
                                        const spText =
                                            SP_TEXT[item.status_pengajuan] ??
                                            item.status_pengajuan;
                                        const sBadge =
                                            S_BADGE[item.status] ??
                                            "bg-gray-100 text-gray-800";
                                        const sText =
                                            S_TEXT[item.status] ?? item.status;
                                        const pjNames = (item.pjs || [])
                                            .map((p) => p.user?.name)
                                            .filter(Boolean);
                                        const capaian = item.persentase_capaian;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Link
                                                        href={route(
                                                            "proker.show",
                                                            item.id,
                                                        )}
                                                        className="text-sm font-medium text-blue-700 hover:underline"
                                                    >
                                                        {item.nama_display ||
                                                            item.nama_proker ||
                                                            item.deskripsi}
                                                    </Link>
                                                    {item.tanggal_mulai &&
                                                        item.tanggal_selesai && (
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                {new Date(
                                                                    item.tanggal_mulai,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                                {" – "}
                                                                {new Date(
                                                                    item.tanggal_selesai,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium text-gray-800">
                                                        {
                                                            item.struktur
                                                                ?.struktur
                                                        }
                                                    </div>
                                                    {pjNames.length > 0 && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {pjNames.join(", ")}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${spBadge}`}
                                                    >
                                                        {spText}
                                                    </span>
                                                    <div className="mt-1">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs rounded-full ${sBadge}`}
                                                        >
                                                            {sText}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {item.parameter?.length >
                                                    0 ? (
                                                        <span>
                                                            {
                                                                item.parameter
                                                                    .length
                                                            }{" "}
                                                            indikator (
                                                            {item.total_bobot}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            –
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    {capaian !== null &&
                                                    capaian !== undefined ? (
                                                        <span
                                                            className={`font-semibold ${capaian >= 80 ? "text-green-600" : capaian >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                                        >
                                                            {capaian}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            –
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route(
                                                                "proker.show",
                                                                item.id,
                                                            )}
                                                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                            title="Detail"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </Link>
                                                        <ActionButtons
                                                            item={{
                                                                ...item,
                                                                kepengurusanlab,
                                                            }}
                                                            onEdit={openModal}
                                                            onDelete={
                                                                openDeleteModal
                                                            }
                                                            showEdit
                                                            showDelete
                                                            editLabel="Edit"
                                                            deleteLabel="Hapus"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} maxWidth="2xl" onClose={closeModal}>
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg font-semibold">
                            {editingProker
                                ? "Edit Program Kerja"
                                : "Tambah Program Kerja"}
                        </h3>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Divisi / Struktur{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.struktur_id}
                                onChange={(e) =>
                                    setData("struktur_id", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="">
                                    Pilih Divisi / Struktur
                                </option>
                                {strukturList?.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.struktur}
                                    </option>
                                ))}
                            </select>
                            {errors.struktur_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.struktur_id}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Program Kerja{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nama_proker}
                                onChange={(e) =>
                                    setData("nama_proker", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Contoh: Neo Portofolio x Marketing"
                                required
                            />
                            {errors.nama_proker && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.nama_proker}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi Kegiatan
                            </label>
                            <textarea
                                value={data.deskripsi}
                                onChange={(e) =>
                                    setData("deskripsi", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows="2"
                                placeholder="Penjelasan singkat kegiatan…"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tujuan
                                </label>
                                <textarea
                                    value={data.tujuan}
                                    onChange={(e) =>
                                        setData("tujuan", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="2"
                                    placeholder="Apa yang ingin dicapai…"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sasaran
                                </label>
                                <textarea
                                    value={data.sasaran}
                                    onChange={(e) =>
                                        setData("sasaran", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="2"
                                    placeholder="Target peserta / pihak terdampak…"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Output Kegiatan
                            </label>
                            <textarea
                                value={data.output_kegiatan}
                                onChange={(e) =>
                                    setData("output_kegiatan", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows="2"
                                placeholder="Hasil nyata yang dihasilkan…"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Mulai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) =>
                                        setData("tanggal_mulai", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Selesai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pelaksanaan{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                <option value="belum_mulai">Belum Mulai</option>
                                <option value="sedang_berjalan">
                                    Sedang Berjalan
                                </option>
                                <option value="selesai">Selesai</option>
                                <option value="ditunda">Ditunda</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan
                            </label>
                            <textarea
                                value={data.keterangan}
                                onChange={(e) =>
                                    setData("keterangan", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File Dokumen Proker (Opsional)
                            </label>
                            <input
                                type="file"
                                onChange={(e) =>
                                    setData("file_proker", e.target.files[0])
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                accept=".pdf,.doc,.docx"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC, DOCX — maks 10 MB
                            </p>
                            {errors.file_proker && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.file_proker}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75"
                            >
                                {processing
                                    ? "Menyimpan…"
                                    : editingProker
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
                message="Apakah Anda yakin ingin menghapus program kerja ini? Semua parameter dan dokumentasi terkait juga akan dihapus."
                confirmText={processing ? "Menghapus…" : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default Proker;
