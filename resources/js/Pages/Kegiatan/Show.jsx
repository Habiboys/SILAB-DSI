import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Download,
    ExternalLink,
    FileText,
    Image,
    MapPin,
    Pencil,
    Trash2,
    Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import DashboardLayout from "../../Layouts/DashboardLayout";

const STATUS_BADGE = {
    diajukan: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    ditolak: "bg-red-100 text-red-800",
};

const TIPE_BADGE = {
    online: "bg-blue-50 text-blue-700 border border-blue-200",
    offline: "bg-green-50 text-green-700 border border-green-200",
    hybrid: "bg-purple-50 text-purple-700 border border-purple-200",
};

function fileIcon(filePath) {
    const ext = (filePath ?? "").split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
        return <Image className="w-4 h-4 text-pink-500" />;
    if (["mp4", "mov", "avi"].includes(ext))
        return <Video className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
}

const JENIS_LAPORAN_OPTIONS = [
    "Laporan Pertanggungjawaban (LPJ)",
    "Laporan Bulanan",
    "Logbook",
    "Notulensi Rapat",
    "Dokumentasi",
    "Lainnya",
];

export default function KegiatanShow({ kegiatan, can }) {
    const [showLpjForm, setShowLpjForm] = useState(false);
    const [deletingLpj, setDeletingLpj] = useState(null);
    const [approving, setApproving] = useState(false);
    const [approvalTarget, setApprovalTarget] = useState(null); 
    const [showDokForm, setShowDokForm] = useState(false);
    const [deletingDok, setDeletingDok] = useState(null);

    const {
        data: lpjData,
        setData: setLpjData,
        post: postLpj,
        processing: lpjProcessing,
        errors: lpjErrors,
        reset: resetLpj,
    } = useForm({
        jenis_laporan: "",
        periode_bulan: new Date().getMonth() + 1,
        periode_tahun: new Date().getFullYear(),
        deskripsi_capaian: "",
        file_lpj: null,
    });

    const {
        data: dokData,
        setData: setDokData,
        post: postDok,
        processing: dokProcessing,
        errors: dokErrors,
        reset: resetDok,
    } = useForm({
        judul: "",
        file: null,
    });

    const submitApproval = (status) => {
        setApproving(true);
        router.post(
            route("kegiatan.approve", kegiatan.id),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Kegiatan berhasil ${status === "disetujui" ? "disetujui" : "ditolak"}`);
                    setApprovalTarget(null);
                },
                onError: () => toast.error("Gagal memproses persetujuan"),
                onFinish: () => setApproving(false),
            },
        );
    };

    const submitLpj = (e) => {
        e.preventDefault();
        postLpj(route("laporan-kegiatan.store", kegiatan.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Laporan berhasil diunggah");
                resetLpj();
                setShowLpjForm(false);
            },
            onError: () => toast.error("Gagal mengunggah laporan"),
        });
    };

    const submitDok = (e) => {
        e.preventDefault();
        postDok(route("dokumentasi-kegiatan.store", kegiatan.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Dokumentasi berhasil diunggah");
                resetDok();
                setShowDokForm(false);
            },
            onError: () => toast.error("Gagal mengunggah dokumentasi"),
        });
    };

    const formatDate = (d, withTime = false) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  ...(withTime && { hour: "2-digit", minute: "2-digit" }),
              })
            : "-";

    const isApproved = kegiatan.status_approval === "disetujui";

    return (
        <DashboardLayout>
            <Head title={`Detail Kegiatan: ${kegiatan.nama_kegiatan}`} />

            <div className="space-y-6">
                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-start gap-4 flex-wrap">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {kegiatan.nama_kegiatan}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Diajukan pada{" "}
                                {formatDate(kegiatan.created_at, true)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[kegiatan.status_approval] ?? "bg-gray-100 text-gray-800"}`}
                            >
                                {kegiatan.status_approval
                                    .charAt(0)
                                    .toUpperCase() +
                                    kegiatan.status_approval.slice(1)}
                            </span>
                            {can.edit &&
                                kegiatan.status_approval === "diajukan" && (
                                    <Link
                                        href={route(
                                            "kegiatan.edit",
                                            kegiatan.id,
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </Link>
                                )}
                            {isApproved && (can.create || can.approve) && (
                                <Link
                                    href={route(
                                        "kegiatan.sertifikat",
                                        kegiatan.id,
                                    )}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                                >
                                    Kelola Sertifikat
                                </Link>
                            )}
                            <Link
                                href={route("kegiatan.index")}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Kembali
                            </Link>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Program Kerja
                                </p>
                                <p className="text-sm text-gray-900">
                                    {kegiatan.proker?.deskripsi || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Waktu Pelaksanaan
                                </p>
                                <p className="text-sm text-gray-900">
                                    {formatDate(kegiatan.tanggal_mulai)} —{" "}
                                    {formatDate(kegiatan.tanggal_selesai)}
                                </p>
                            </div>

                            {kegiatan.tipe_kegiatan && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Tipe Kegiatan
                                    </p>
                                    <span
                                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${TIPE_BADGE[kegiatan.tipe_kegiatan] ?? "bg-gray-100 text-gray-600"}`}
                                    >
                                        {kegiatan.tipe_kegiatan}
                                    </span>
                                </div>
                            )}

                            {kegiatan.lokasi && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Lokasi / Tempat
                                    </p>
                                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        {kegiatan.lokasi}
                                    </p>
                                </div>
                            )}

                            {kegiatan.link_meeting && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Link Meeting
                                    </p>
                                    <a
                                        href={kegiatan.link_meeting}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                        {kegiatan.link_meeting}
                                    </a>
                                </div>
                            )}

                            {kegiatan.approved_by && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Disetujui Oleh
                                    </p>
                                    <p className="text-sm text-gray-900">
                                        {kegiatan.approver?.name} ·{" "}
                                        {formatDate(kegiatan.approved_at, true)}
                                    </p>
                                </div>
                            )}

                            {kegiatan.deskripsi_kegiatan && (
                                <div className="col-span-full">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Deskripsi
                                    </p>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                        {kegiatan.deskripsi_kegiatan}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                
                {can.approve && kegiatan.status_approval === "diajukan" && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-1">
                            Tindakan Persetujuan
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Setujui atau tolak pengajuan kegiatan ini.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setApprovalTarget("disetujui")}
                                disabled={approving}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                            >
                                Setujui
                            </button>
                            <button
                                onClick={() => setApprovalTarget("ditolak")}
                                disabled={approving}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                )}

                
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">
                            Peserta Kegiatan
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {kegiatan.peserta?.length ?? 0} peserta terdaftar
                        </p>
                    </div>
                    {isApproved ? (
                        <Link
                            href={route("kegiatan.sertifikat", kegiatan.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                        >
                            Kelola Peserta &amp; Sertifikat
                        </Link>
                    ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                            Tersedia setelah disetujui
                        </span>
                    )}
                </div>

                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">
                                Dokumentasi Kegiatan
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {kegiatan.dokumentasi_kegiatan?.length ?? 0}{" "}
                                file
                            </p>
                        </div>
                        {isApproved &&
                            (can.create || can.approve) &&
                            !showDokForm && (
                                <button
                                    onClick={() => setShowDokForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    + Upload Dokumentasi
                                </button>
                            )}
                    </div>
                    <div className="p-6">
                        {showDokForm && (
                            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                                <h4 className="text-sm font-medium text-gray-800 mb-3">
                                    Upload Dokumentasi Baru
                                </h4>
                                <form
                                    onSubmit={submitDok}
                                    className="space-y-3"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Judul / Nama Dokumentasi
                                        </label>
                                        <input
                                            type="text"
                                            list="dok-judul-list"
                                            value={dokData.judul}
                                            onChange={(e) =>
                                                setDokData(
                                                    "judul",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Foto Kegiatan, Notulensi Rapat..."
                                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        />
                                        <datalist id="dok-judul-list">
                                            <option value="Foto Kegiatan" />
                                            <option value="Video Dokumentasi" />
                                            <option value="Notulensi Rapat" />
                                            <option value="Presensi" />
                                            <option value="Materi / Slide" />
                                        </datalist>
                                        {dokErrors.judul && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {dokErrors.judul}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            File (PDF, Word, Gambar, ZIP, MP4 —
                                            maks 50 MB)
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setDokData(
                                                    "file",
                                                    e.target.files[0],
                                                )
                                            }
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.mp4"
                                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {dokErrors.file && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {dokErrors.file}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowDokForm(false)
                                            }
                                            className="px-3 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={dokProcessing}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                        >
                                            {dokProcessing
                                                ? "Mengunggah..."
                                                : "Unggah"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {kegiatan.dokumentasi_kegiatan?.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {kegiatan.dokumentasi_kegiatan.map((dok) => (
                                    <div
                                        key={dok.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0">
                                                {fileIcon(dok.file_path)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {dok.judul}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {formatDate(
                                                        dok.created_at,
                                                        true,
                                                    )}
                                                    {dok.uploader?.name &&
                                                        ` · ${dok.uploader.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <a
                                                href={route(
                                                    "dokumentasi-kegiatan.download",
                                                    dok.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 font-medium"
                                            >
                                                <Download className="w-3 h-3" />{" "}
                                                Download
                                            </a>
                                            {(can.create || can.approve) && (
                                                <button
                                                    onClick={() =>
                                                        setDeletingDok(dok)
                                                    }
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">
                                Belum ada dokumentasi yang diunggah.
                            </p>
                        )}
                    </div>
                </div>

                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">
                                Laporan Kegiatan
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {kegiatan.laporan_kegiatan?.length ?? 0} laporan
                            </p>
                        </div>
                        {isApproved &&
                            (can.create || can.approve) &&
                            !showLpjForm && (
                                <button
                                    onClick={() => setShowLpjForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    + Upload Laporan
                                </button>
                            )}
                    </div>
                    <div className="p-6">
                        {showLpjForm && (
                            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                                <h4 className="text-sm font-medium text-gray-800 mb-3">
                                    Upload Laporan Baru
                                </h4>
                                <form
                                    onSubmit={submitLpj}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Jenis Laporan
                                            </label>
                                            <input
                                                type="text"
                                                list="jenis-laporan-list"
                                                value={lpjData.jenis_laporan}
                                                onChange={(e) =>
                                                    setLpjData(
                                                        "jenis_laporan",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ketik atau pilih..."
                                                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                            <datalist id="jenis-laporan-list">
                                                {JENIS_LAPORAN_OPTIONS.map(
                                                    (opt) => (
                                                        <option
                                                            key={opt}
                                                            value={opt}
                                                        />
                                                    ),
                                                )}
                                            </datalist>
                                            {lpjErrors.jenis_laporan && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {lpjErrors.jenis_laporan}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Bulan
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={lpjData.periode_bulan}
                                                onChange={(e) =>
                                                    setLpjData(
                                                        "periode_bulan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Tahun
                                            </label>
                                            <input
                                                type="number"
                                                value={lpjData.periode_tahun}
                                                onChange={(e) =>
                                                    setLpjData(
                                                        "periode_tahun",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Keterangan / Capaian
                                        </label>
                                        <textarea
                                            value={lpjData.deskripsi_capaian}
                                            onChange={(e) =>
                                                setLpjData(
                                                    "deskripsi_capaian",
                                                    e.target.value,
                                                )
                                            }
                                            rows="2"
                                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            File (PDF/DOCX, maks 10 MB)
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                setLpjData(
                                                    "file_lpj",
                                                    e.target.files[0],
                                                )
                                            }
                                            accept=".pdf,.doc,.docx"
                                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {lpjErrors.file_lpj && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {lpjErrors.file_lpj}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowLpjForm(false)
                                            }
                                            className="px-3 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={lpjProcessing}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                        >
                                            {lpjProcessing
                                                ? "Mengunggah..."
                                                : "Unggah"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {kegiatan.laporan_kegiatan?.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {kegiatan.laporan_kegiatan.map((laporan) => (
                                    <div
                                        key={laporan.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {laporan.jenis_laporan}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Periode: {laporan.periode_bulan}
                                                /{laporan.periode_tahun}
                                                {laporan.deskripsi_capaian &&
                                                    ` · ${laporan.deskripsi_capaian}`}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Diunggah:{" "}
                                                {formatDate(
                                                    laporan.created_at,
                                                    true,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <a
                                                href={route(
                                                    "laporan-kegiatan.download",
                                                    laporan.id,
                                                )}
                                                target="_blank"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 font-medium"
                                            >
                                                <Download className="w-3 h-3" />{" "}
                                                Download
                                            </a>
                                            {(can.create || can.approve) && (
                                                <button
                                                    onClick={() =>
                                                        setDeletingLpj(laporan)
                                                    }
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">
                                Belum ada laporan yang diunggah.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                show={!!approvalTarget}
                onClose={() => setApprovalTarget(null)}
                onConfirm={() => submitApproval(approvalTarget)}
                title={approvalTarget === "disetujui" ? "Setujui Kegiatan" : "Tolak Kegiatan"}
                message={
                    approvalTarget === "disetujui"
                        ? `Setujui kegiatan "${kegiatan.nama_kegiatan}"? Pengajuan ini akan berstatus disetujui dan peserta dapat dikelola.`
                        : `Tolak kegiatan "${kegiatan.nama_kegiatan}"? Pengaju perlu mengajukan ulang setelah perbaikan.`
                }
                confirmText={approvalTarget === "disetujui" ? "Setujui" : "Tolak"}
                cancelText="Batal"
                type={approvalTarget === "disetujui" ? "info" : "danger"}
            />

            <ConfirmModal
                show={!!deletingLpj}
                onClose={() => setDeletingLpj(null)}
                onConfirm={() => {
                    router.delete(
                        route("laporan-kegiatan.destroy", deletingLpj?.id),
                        {
                            onSuccess: () => {
                                toast.success("Laporan berhasil dihapus");
                                setDeletingLpj(null);
                            },
                        },
                    );
                }}
                title="Hapus Laporan"
                message={`Hapus laporan "${deletingLpj?.jenis_laporan}"?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <ConfirmModal
                show={!!deletingDok}
                onClose={() => setDeletingDok(null)}
                onConfirm={() => {
                    router.delete(
                        route("dokumentasi-kegiatan.destroy", deletingDok?.id),
                        {
                            onSuccess: () => {
                                toast.success("Dokumentasi berhasil dihapus");
                                setDeletingDok(null);
                            },
                        },
                    );
                }}
                title="Hapus Dokumentasi"
                message={`Hapus dokumentasi "${deletingDok?.judul}"?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}
