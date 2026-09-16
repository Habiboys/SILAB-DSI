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
import Button from "../../Components/Button";
import ConfirmModal from "../../Components/ConfirmModal";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import StatusBadge from "../../Components/StatusBadge";
import DashboardLayout from "../../Layouts/DashboardLayout";

const STATUS_BADGE = {
    diajukan: "bg-warning/20 text-warning",
    disetujui: "bg-success/15 text-success",
    ditolak: "bg-error/15 text-error",
};

const TIPE_BADGE = {
    online: "bg-primary/10 text-primary border border-primary/30",
    offline: "bg-success/10 text-success border border-success/30",
    hybrid: "bg-secondary/10 text-secondary border border-secondary/30",
};

function fileIcon(filePath) {
    const ext = (filePath ?? "").split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
        return <Image className="w-4 h-4 text-secondary" />;
    if (["mp4", "mov", "avi"].includes(ext))
        return <Video className="w-4 h-4 text-secondary" />;
    return <FileText className="w-4 h-4 text-primary" />;
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memproses persetujuan");
                },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal mengunggah laporan");
            },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal mengunggah dokumentasi");
            },
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

            <PageHeader
                title={kegiatan.nama_kegiatan}
                description={`Diajukan pada ${formatDate(kegiatan.created_at, true)}`}
                actions={<><StatusBadge status={kegiatan.status_approval} label={kegiatan.status_approval.charAt(0).toUpperCase() + kegiatan.status_approval.slice(1)} />{can.edit && kegiatan.status_approval === "diajukan" && <Button variant="ghost" href={route("kegiatan.edit", kegiatan.id)}><Pencil className="h-4 w-4" /> Edit</Button>}{isApproved && (can.create || can.approve) && <Button href={route("kegiatan.sertifikat", kegiatan.id)}>Kelola Sertifikat</Button>}<Button variant="ghost" href={route("kegiatan.index")}>Kembali</Button></>}
            />
            <div className="space-y-6">
                <PageSection bodyClassName="p-6">
                    <div className="hidden">
                        <div>
                            <h2 className="text-xl font-semibold text-base-content">
                                {kegiatan.nama_kegiatan}
                            </h2>
                            <p className="text-sm text-base-content/60 mt-1">
                                Diajukan pada{" "}
                                {formatDate(kegiatan.created_at, true)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[kegiatan.status_approval] ?? "bg-base-200 text-base-content"}`}
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-base-300 text-base-content rounded-md hover:bg-base-200 text-sm font-medium"
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary text-sm font-medium"
                                >
                                    Kelola Sertifikat
                                </Link>
                            )}
                            <Link
                                href={route("kegiatan.index")}
                                className="px-3 py-1.5 bg-base-200 text-base-content/70 rounded-md hover:bg-base-300 text-sm font-medium"
                            >
                                Kembali
                            </Link>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                    Program Kerja
                                </p>
                                <p className="text-sm text-base-content">
                                    {kegiatan.proker?.deskripsi || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                    Waktu Pelaksanaan
                                </p>
                                <p className="text-sm text-base-content">
                                    {formatDate(kegiatan.tanggal_mulai)} —{" "}
                                    {formatDate(kegiatan.tanggal_selesai)}
                                </p>
                            </div>

                            {kegiatan.tipe_kegiatan && (
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                        Tipe Kegiatan
                                    </p>
                                    <span
                                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${TIPE_BADGE[kegiatan.tipe_kegiatan] ?? "bg-base-200 text-base-content/70"}`}
                                    >
                                        {kegiatan.tipe_kegiatan}
                                    </span>
                                </div>
                            )}

                            {kegiatan.lokasi && (
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                        Lokasi / Tempat
                                    </p>
                                    <p className="text-sm text-base-content flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-base-content/50 flex-shrink-0" />
                                        {kegiatan.lokasi}
                                    </p>
                                </div>
                            )}

                            {kegiatan.link_meeting && (
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                        Link Meeting
                                    </p>
                                    <a
                                        href={kegiatan.link_meeting}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                        {kegiatan.link_meeting}
                                    </a>
                                </div>
                            )}

                            {kegiatan.approved_by && (
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                        Disetujui Oleh
                                    </p>
                                    <p className="text-sm text-base-content">
                                        {kegiatan.approver?.name} ·{" "}
                                        {formatDate(kegiatan.approved_at, true)}
                                    </p>
                                </div>
                            )}

                            {kegiatan.deskripsi_kegiatan && (
                                <div className="col-span-full">
                                    <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                                        Deskripsi
                                    </p>
                                    <p className="text-sm text-base-content whitespace-pre-wrap leading-relaxed">
                                        {kegiatan.deskripsi_kegiatan}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </PageSection>

                {can.approve && kegiatan.status_approval === "diajukan" && (
                    <PageSection bodyClassName="p-6">
                        <h3 className="text-base font-semibold text-base-content mb-1">
                            Tindakan Persetujuan
                        </h3>
                        <p className="text-sm text-base-content/60 mb-4">
                            Setujui atau tolak pengajuan kegiatan ini.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="success" onClick={() => setApprovalTarget("disetujui")} disabled={approving}>Setujui</Button>
                            <Button variant="danger" onClick={() => setApprovalTarget("ditolak")} disabled={approving}>Tolak</Button>
                        </div>
                    </PageSection>
                )}

                
                <PageSection bodyClassName="flex flex-wrap items-center justify-between gap-4 p-6">
                    <div>
                        <h3 className="text-base font-semibold text-base-content">
                            Peserta Kegiatan
                        </h3>
                        <p className="text-sm text-base-content/60 mt-0.5">
                            {kegiatan.peserta?.length ?? 0} peserta terdaftar
                        </p>
                    </div>
                    {isApproved ? (
                        <Link
                            href={route("kegiatan.sertifikat", kegiatan.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm font-medium"
                        >
                            Kelola Peserta &amp; Sertifikat
                        </Link>
                    ) : (
                        <span className="text-xs text-warning bg-warning/10 border border-warning/30 px-2 py-1 rounded-full">
                            Tersedia setelah disetujui
                        </span>
                    )}
                </PageSection>

                <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-none">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-base-content">
                                Dokumentasi Kegiatan
                            </h3>
                            <p className="text-sm text-base-content/60 mt-0.5">
                                {kegiatan.dokumentasi_kegiatan?.length ?? 0}{" "}
                                file
                            </p>
                        </div>
                        {isApproved &&
                            (can.create || can.approve) &&
                            !showDokForm && (
                                <button
                                    onClick={() => setShowDokForm(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm font-medium"
                                >
                                    + Upload Dokumentasi
                                </button>
                            )}
                    </div>
                    <div className="p-6">
                        {showDokForm && (
                            <div className="border border-base-300 rounded-lg p-4 mb-6 bg-base-200">
                                <h4 className="text-sm font-medium text-base-content mb-3">
                                    Upload Dokumentasi Baru
                                </h4>
                                <form
                                    onSubmit={submitDok}
                                    className="space-y-3"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-base-content mb-1">
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
                                            className="w-full text-sm rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary"
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
                                            <p className="text-error text-xs mt-1">
                                                {dokErrors.judul}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-base-content mb-1">
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
                                            className="w-full text-sm text-base-content/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/15"
                                        />
                                        {dokErrors.file && (
                                            <p className="text-error text-xs mt-1">
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
                                            className="px-3 py-2 border rounded-md text-sm text-base-content hover:bg-base-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={dokProcessing}
                                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50 text-sm font-medium"
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
                            <div className="divide-y divide-base-300">
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
                                                <p className="text-sm font-medium text-base-content truncate">
                                                    {dok.judul}
                                                </p>
                                                <p className="text-xs text-base-content/50 mt-0.5">
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
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-base-200 text-base-content text-xs rounded-md hover:bg-base-300 font-medium"
                                            >
                                                <Download className="w-3 h-3" />{" "}
                                                Download
                                            </a>
                                            {(can.create || can.approve) && (
                                                <button
                                                    onClick={() =>
                                                        setDeletingDok(dok)
                                                    }
                                                    className="p-1.5 text-error hover:bg-error/10 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-base-content/60 italic">
                                Belum ada dokumentasi yang diunggah.
                            </p>
                        )}
                    </div>
                </div>

                
                <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-none">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-base-content">
                                Laporan Kegiatan
                            </h3>
                            <p className="text-sm text-base-content/60 mt-0.5">
                                {kegiatan.laporan_kegiatan?.length ?? 0} laporan
                            </p>
                        </div>
                        {isApproved &&
                            (can.create || can.approve) &&
                            !showLpjForm && (
                                <button
                                    onClick={() => setShowLpjForm(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm font-medium"
                                >
                                    + Upload Laporan
                                </button>
                            )}
                    </div>
                    <div className="p-6">
                        {showLpjForm && (
                            <div className="border border-base-300 rounded-lg p-4 mb-6 bg-base-200">
                                <h4 className="text-sm font-medium text-base-content mb-3">
                                    Upload Laporan Baru
                                </h4>
                                <form
                                    onSubmit={submitLpj}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-base-content mb-1">
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
                                                className="w-full text-sm rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary"
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
                                                <p className="text-error text-xs mt-1">
                                                    {lpjErrors.jenis_laporan}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-base-content mb-1">
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
                                                className="w-full text-sm rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-base-content mb-1">
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
                                                className="w-full text-sm rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-base-content mb-1">
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
                                            className="w-full text-sm rounded-md border-base-300 shadow-sm focus:border-primary focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-base-content mb-1">
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
                                            className="w-full text-sm text-base-content/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/15"
                                        />
                                        {lpjErrors.file_lpj && (
                                            <p className="text-error text-xs mt-1">
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
                                            className="px-3 py-2 border rounded-md text-sm text-base-content hover:bg-base-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={lpjProcessing}
                                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50 text-sm font-medium"
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
                            <div className="divide-y divide-base-300">
                                {kegiatan.laporan_kegiatan.map((laporan) => (
                                    <div
                                        key={laporan.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-base-content">
                                                {laporan.jenis_laporan}
                                            </p>
                                            <p className="text-xs text-base-content/60">
                                                Periode: {laporan.periode_bulan}
                                                /{laporan.periode_tahun}
                                                {laporan.deskripsi_capaian &&
                                                    ` · ${laporan.deskripsi_capaian}`}
                                            </p>
                                            <p className="text-xs text-base-content/50 mt-0.5">
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
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-base-200 text-base-content text-xs rounded-md hover:bg-base-300 font-medium"
                                            >
                                                <Download className="w-3 h-3" />{" "}
                                                Download
                                            </a>
                                            {(can.create || can.approve) && (
                                                <button
                                                    onClick={() =>
                                                        setDeletingLpj(laporan)
                                                    }
                                                    className="p-1.5 text-error hover:bg-error/10 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-base-content/60 italic">
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
                            onError: (errors) => {
                                const firstError = Object.values(errors).find(Boolean);
                                toast.error(firstError || "Gagal menghapus laporan");
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
                            onError: (errors) => {
                                const firstError = Object.values(errors).find(Boolean);
                                toast.error(firstError || "Gagal menghapus dokumentasi");
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
