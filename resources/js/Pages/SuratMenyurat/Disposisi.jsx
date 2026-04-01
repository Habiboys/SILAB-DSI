import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Plus,
    Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusLabels = {
    belum_dibaca: { label: "Belum Dibaca", color: "bg-red-100 text-red-700" },
    sudah_dibaca: {
        label: "Sudah Dibaca",
        color: "bg-yellow-100 text-yellow-700",
    },
    selesai: { label: "Selesai", color: "bg-green-100 text-green-700" },
};

const Disposisi = ({
    surat,
    disposisi,
    anggotaLab,
    currentUser,
    flash,
    canCreate,
    canUpdate,
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const form = useForm({
        kepada_user_id: "",
        catatan: "",
    });

    const handleAdd = (e) => {
        e.preventDefault();
        form.post(route("surat-menyurat.disposisi.store", surat.id), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                form.reset();
                toast.success("Disposisi berhasil ditambahkan");
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                toast.error(msg || "Gagal menambahkan disposisi");
            },
        });
    };

    const handleUpdateStatus = (disposisiId, status) => {
        router.patch(
            route("surat-menyurat.disposisi.update-status", disposisiId),
            { status },
            {
                onSuccess: () => toast.success("Status disposisi diperbarui"),
                onError: () => toast.error("Gagal memperbarui status"),
                preserveScroll: true,
            },
        );
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateShort = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <DashboardLayout>
            <Head title={`Disposisi – ${surat.perihal}`} />

            <div className="space-y-6">
                {/* Back button */}
                <div>
                    <button
                        onClick={() => history.back()}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Surat Masuk
                    </button>
                </div>

                {/* Surat Info Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {surat.perihal}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {surat.lab}
                            </p>
                        </div>
                        {surat.file_surat && (
                            <a
                                href={route(
                                    "surat-menyurat.surat-masuk.download",
                                    surat.id,
                                )}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                            >
                                <Download className="w-4 h-4" /> Unduh File
                            </a>
                        )}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">No Agenda</dt>
                            <dd className="font-medium text-gray-900">
                                #{surat.nomor_agenda}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Nomor Surat Asal</dt>
                            <dd className="font-medium text-gray-900">
                                {surat.nomor_surat_asal}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Asal Surat</dt>
                            <dd className="font-medium text-gray-900">
                                {surat.asal_surat}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Tanggal Surat</dt>
                            <dd className="font-medium text-gray-900">
                                {formatDateShort(surat.tanggal_surat)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Tanggal Terima</dt>
                            <dd className="font-medium text-gray-900">
                                {formatDateShort(surat.tanggal_terima)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Diterima Oleh</dt>
                            <dd className="font-medium text-gray-900">
                                {surat.diterima_oleh}
                            </dd>
                        </div>
                        {surat.isi_ringkas && (
                            <div className="col-span-2 sm:col-span-3">
                                <dt className="text-gray-500">Isi Ringkas</dt>
                                <dd className="font-medium text-gray-900 mt-0.5 whitespace-pre-line">
                                    {surat.isi_ringkas}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Disposisi Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-800">
                            Riwayat Disposisi
                            <span className="ml-2 text-xs font-normal text-gray-500">
                                ({disposisi.length})
                            </span>
                        </h3>
                        {canCreate && (
                            <button
                                onClick={() => {
                                    form.reset();
                                    setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                            >
                                <Plus className="w-4 h-4" /> Tambah Disposisi
                            </button>
                        )}
                    </div>

                    {disposisi.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada disposisi untuk surat ini</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {disposisi.map((d) => {
                                const status =
                                    statusLabels[d.status] ??
                                    statusLabels.belum_dibaca;
                                const isOwner =
                                    d.kepada_user_id === currentUser?.id;

                                return (
                                    <div key={d.id} className="px-6 py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {d.dari_user}
                                                    </span>
                                                    <Send className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {d.kepada_user}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {d.catatan && (
                                                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                                                        {d.catatan}
                                                    </p>
                                                )}

                                                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />{" "}
                                                        Dikirim:{" "}
                                                        {formatDate(
                                                            d.created_at,
                                                        )}
                                                    </span>
                                                    {d.dibaca_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />{" "}
                                                            Dibaca:{" "}
                                                            {formatDate(
                                                                d.dibaca_at,
                                                            )}
                                                        </span>
                                                    )}
                                                    {d.diselesaikan_at && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />{" "}
                                                            Selesai:{" "}
                                                            {formatDate(
                                                                d.diselesaikan_at,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status actions – only for recipient */}
                                            {canUpdate &&
                                                isOwner &&
                                                d.status !== "selesai" && (
                                                    <div className="flex-shrink-0 flex gap-1">
                                                        {d.status ===
                                                            "belum_dibaca" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleUpdateStatus(
                                                                        d.id,
                                                                        "sudah_dibaca",
                                                                    )
                                                                }
                                                                className="px-2.5 py-1 text-xs border border-yellow-400 text-yellow-700 rounded hover:bg-yellow-50"
                                                            >
                                                                Tandai Dibaca
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateStatus(
                                                                    d.id,
                                                                    "selesai",
                                                                )
                                                            }
                                                            className="px-2.5 py-1 text-xs border border-green-400 text-green-700 rounded hover:bg-green-50"
                                                        >
                                                            Selesai
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* -------------------------------------------------------- Add Disposisi Modal */}
            <Modal
                show={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Tambah Disposisi
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kepada <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.data.kepada_user_id}
                            onChange={(e) =>
                                form.setData("kepada_user_id", e.target.value)
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
                        {form.errors.kepada_user_id && (
                            <p className="text-red-500 text-xs mt-1">
                                {form.errors.kepada_user_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                        </label>
                        <textarea
                            value={form.data.catatan}
                            onChange={(e) =>
                                form.setData("catatan", e.target.value)
                            }
                            rows={4}
                            placeholder="Instruksi atau catatan untuk penerima..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {form.processing
                                ? "Mengirim..."
                                : "Kirim Disposisi"}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Disposisi;
