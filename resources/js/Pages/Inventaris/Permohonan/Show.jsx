import Modal from "@/Components/Modal";
import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_LABEL = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-700" },
    diajukan: {
        label: "Diajukan (Menunggu Review Kalab)",
        cls: "bg-yellow-100 text-yellow-800",
    },
    disetujui_kalab: {
        label: "Disetujui Kalab",
        cls: "bg-blue-100 text-blue-800",
    },
    ditolak_kalab: { label: "Ditolak Kalab", cls: "bg-red-100 text-red-800" },
    disetujui_kadep: {
        label: "Disetujui Kadep (Final)",
        cls: "bg-green-100 text-green-800",
    },
    ditolak_kadep: { label: "Ditolak Kadep", cls: "bg-red-200 text-red-900" },
};

const ITEM_STATUS_LABEL = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-700" },
    diajukan: { label: "Diajukan", cls: "bg-yellow-100 text-yellow-800" },
    disetujui_kalab: {
        label: "Disetujui Kalab",
        cls: "bg-blue-100 text-blue-800",
    },
    ditolak_kalab: { label: "Ditolak Kalab", cls: "bg-red-100 text-red-800" },
    disetujui_kadep: {
        label: "Disetujui Kadep",
        cls: "bg-green-100 text-green-800",
    },
    ditolak_kadep: { label: "Ditolak Kadep", cls: "bg-red-200 text-red-900" },
    dipesan: { label: "Dipesan", cls: "bg-indigo-100 text-indigo-800" },
    diterima: {
        label: "Diterima / Jadi Aset",
        cls: "bg-emerald-100 text-emerald-800",
    },
};

function StatusBadge({ status, map }) {
    const cfg = map[status] ?? {
        label: status,
        cls: "bg-gray-100 text-gray-600",
    };
    return (
        <span
            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${cfg.cls}`}
        >
            {cfg.label}
        </span>
    );
}

export default function PermohonanAsetShow({ permohonan, kategoriAset }) {
    const { can, isKalab, hasRole } = usePermission();

    const canSubmit = can("inventaris.manage-permohonan");
    const canReview =
        can("inventaris.review-permohonan") ||
        isKalab() ||
        hasRole("superadmin");
    const canApprove =
        can("inventaris.approve-final") ||
        hasRole("kadep") ||
        hasRole("superadmin");
    const canConvert =
        can("inventaris.convert-to-aset") || hasRole("superadmin");

    const status = permohonan.status_permohonan;
    const isDraft = status === "draft";
    const isAjukan = status === "diajukan";
    const isSetujuiKalab = status === "disetujui_kalab";
    const isFinal = [
        "disetujui_kadep",
        "ditolak_kadep",
        "ditolak_kalab",
    ].includes(status);

    // ── Submit draft ──────────────────────────────────────────────────────────
    const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
    const handleSubmit = () => {
        router.post(
            route("inventaris.permohonan.submit", permohonan.id),
            {},
            {
                onSuccess: () => {
                    setIsSubmitConfirmOpen(false);
                    toast.success("Permohonan berhasil diajukan ke Kalab");
                },
                onError: () => toast.error("Gagal mengajukan permohonan"),
            },
        );
    };

    // ── Kalab review ─────────────────────────────────────────────────────────
    const buildInitialDecisions = () => {
        const obj = {};
        (permohonan.wishlist_aset || []).forEach((item) => {
            obj[item.id] = {
                status:
                    item.status_item === "diajukan"
                        ? "disetujui_kalab"
                        : item.status_item,
                jumlah_disetujui: item.jumlah_disetujui ?? item.jumlah_diminta,
                catatan: item.catatan_item ?? "",
            };
        });
        return obj;
    };
    const [itemDecisions, setItemDecisions] = useState(buildInitialDecisions);
    const [catatanReview, setCatatanReview] = useState(
        permohonan.catatan_review ?? "",
    );
    const [isReviewConfirm, setIsReviewConfirm] = useState(false);

    const reviewForm = useForm({
        keputusan: "disetujui_kalab",
        catatan_review: "",
        items: {},
    });

    const updateItemDecision = (id, field, value) =>
        setItemDecisions((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value },
        }));

    const computeKalabDecision = () => {
        const statuses = Object.values(itemDecisions).map((d) => d.status);
        return statuses.every((s) => s === "ditolak_kalab")
            ? "ditolak_kalab"
            : "disetujui_kalab";
    };

    const handleSaveReview = () => {
        const overall = computeKalabDecision();
        reviewForm.transform(() => ({
            keputusan: overall,
            catatan_review: catatanReview,
            items: itemDecisions,
        }));
        reviewForm.post(
            route("inventaris.permohonan.review-kalab", permohonan.id),
            {
                onSuccess: () => {
                    setIsReviewConfirm(false);
                    toast.success("Review Kalab berhasil disimpan");
                },
                onError: () => toast.error("Gagal menyimpan review"),
            },
        );
    };

    // ── Kadep approval ───────────────────────────────────────────────────────
    const [kadepDecision, setKadepDecision] = useState("disetujui_kadep");
    const [catatanKadep, setCatatanKadep] = useState(
        permohonan.catatan_approval ?? "",
    );
    const [isKadepConfirm, setIsKadepConfirm] = useState(false);
    const kadepForm = useForm({
        keputusan: "disetujui_kadep",
        catatan_approval: "",
    });

    const handleKadepApprove = () => {
        kadepForm.transform(() => ({
            keputusan: kadepDecision,
            catatan_approval: catatanKadep,
        }));
        kadepForm.post(
            route("inventaris.permohonan.approve-kadep", permohonan.id),
            {
                onSuccess: () => {
                    setIsKadepConfirm(false);
                    toast.success("Keputusan Kadep berhasil disimpan");
                },
                onError: () => toast.error("Gagal menyimpan keputusan Kadep"),
            },
        );
    };

    // ── Convert to aset ──────────────────────────────────────────────────────
    const [convertItem, setConvertItem] = useState(null);
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const convertForm = useForm({
        kategori_aset_id: "",
        laboratorium_id: permohonan.laboratorium_id ?? "",
        kode_barang: "",
        kode_barang_list_text: "",
        nama: "",
        keadaan: "baik",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "pengadaan",
        keterangan: "",
    });

    const openConvert = (item) => {
        setConvertItem(item);
        convertForm.setData("nama", item.nama_barang);
        convertForm.setData("harga_perolehan", item.perkiraan_harga ?? "");
        convertForm.setData("kode_barang", "");
        convertForm.setData("kode_barang_list_text", "");
        setIsConvertOpen(true);
    };

    const handleConvert = (e) => {
        e.preventDefault();
        convertForm.transform((data) => {
            const { kode_barang_list_text, ...rest } = data;
            const list = (kode_barang_list_text || "")
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
            return {
                ...rest,
                kode_barang_list: list,
            };
        });
        convertForm.post(
            route("inventaris.wishlist.convert-to-aset", convertItem.id),
            {
                onSuccess: () => {
                    setIsConvertOpen(false);
                    toast.success("Aset berhasil ditambahkan");
                },
                onError: () =>
                    toast.error(
                        "Gagal menambahkan aset, periksa kembali inputan",
                    ),
            },
        );
    };

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              })
            : "-";
    const fmtMoney = (n) =>
        n
            ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
              }).format(n)
            : "-";

    return (
        <DashboardLayout>
            <Head title={`Detail Permohonan ${permohonan.nomor_permohonan}`} />

            <div className="space-y-6">
                {/* ── Header Card ─────────────────────────────────────────── */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Detail Permohonan Aset
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {permohonan.nomor_permohonan}
                            </p>
                        </div>
                        <Link
                            href={route("inventaris.permohonan.index")}
                            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Kembali
                        </Link>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Informasi Permohonan
                            </h3>
                            <div>
                                <p className="text-xs text-gray-400">Tanggal</p>
                                <p className="text-sm font-medium">
                                    {fmtDate(permohonan.tanggal_permohonan)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Status</p>
                                <div className="mt-1">
                                    <StatusBadge
                                        status={status}
                                        map={STATUS_LABEL}
                                    />
                                </div>
                            </div>

                            {/* Timeline singkat */}
                            <div className="pt-2 border-t space-y-2">
                                {permohonan.reviewer && (
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium text-blue-700">
                                            Review Kalab
                                        </span>{" "}
                                        oleh {permohonan.reviewer.name} ·{" "}
                                        {fmtDate(permohonan.reviewed_at)}
                                        {permohonan.catatan_review && (
                                            <p className="mt-0.5 italic text-gray-400">
                                                {permohonan.catatan_review}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {permohonan.approver && (
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium text-green-700">
                                            ACC Kadep
                                        </span>{" "}
                                        oleh {permohonan.approver.name} ·{" "}
                                        {fmtDate(permohonan.approved_at)}
                                        {permohonan.catatan_approval && (
                                            <p className="mt-0.5 italic text-gray-400">
                                                {permohonan.catatan_approval}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Pemohon
                            </h3>
                            <div>
                                <p className="text-xs text-gray-400">Nama</p>
                                <p className="text-sm font-medium">
                                    {permohonan.user_pemohon?.name ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">
                                    Laboratorium
                                </p>
                                <p className="text-sm">
                                    {permohonan.laboratorium?.nama ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">
                                    Alasan Pengadaan
                                </p>
                                <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                                    {permohonan.alasan_umum_pengadaan}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action bar untuk asisten (draft) */}
                    {isDraft && canSubmit && (
                        <div className="px-6 pb-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-800">
                                        Permohonan masih dalam tahap Draft
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Klik "Ajukan ke Kalab" untuk mengirim ke
                                        proses review.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsSubmitConfirmOpen(true)}
                                    className="ml-4 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700"
                                >
                                    Ajukan ke Kalab
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tabel Item ──────────────────────────────────────────── */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                            Daftar Barang yang Diminta
                        </h3>
                        {canReview && isAjukan && (
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />{" "}
                                    Setujui Kalab
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{" "}
                                    Tolak
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Nama Barang
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Spesifikasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Est. Harga
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Urgensi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status Item
                                    </th>
                                    {canReview && isAjukan && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Keputusan Kalab
                                        </th>
                                    )}
                                    {canConvert &&
                                        status === "disetujui_kadep" && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(permohonan.wishlist_aset || []).map(
                                    (item, idx) => {
                                        const dec = itemDecisions[item.id] ?? {
                                            status: "disetujui_kalab",
                                            jumlah_disetujui:
                                                item.jumlah_diminta,
                                            catatan: "",
                                        };
                                        const isApproving =
                                            canReview &&
                                            isAjukan &&
                                            dec.status === "disetujui_kalab";
                                        const alreadyConverted =
                                            (item.detail_asets?.length ?? 0) >
                                            0;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${canReview && isAjukan ? (isApproving ? "border-l-4 border-l-blue-400" : "border-l-4 border-l-red-400") : ""}`}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {item.nama_barang}
                                                    {item.referensi_url && (
                                                        <a
                                                            href={
                                                                item.referensi_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-2 text-blue-500 text-xs"
                                                        >
                                                            (Ref)
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-[180px]">
                                                    <div
                                                        className="truncate"
                                                        title={
                                                            item.spesifikasi_teknis
                                                        }
                                                    >
                                                        {item.spesifikasi_teknis ||
                                                            "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.jumlah_diminta}{" "}
                                                    {item.satuan || "unit"}
                                                    {item.jumlah_disetujui !=
                                                        null &&
                                                        ![
                                                            "draft",
                                                            "diajukan",
                                                        ].includes(
                                                            item.status_item,
                                                        ) && (
                                                            <div className="text-xs mt-0.5 font-medium text-green-600">
                                                                ✓ Disetujui:{" "}
                                                                {
                                                                    item.jumlah_disetujui
                                                                }
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {fmtMoney(
                                                        item.perkiraan_harga,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            item.urgensi ===
                                                            "sangat_tinggi"
                                                                ? "bg-red-100 text-red-800"
                                                                : item.urgensi ===
                                                                    "tinggi"
                                                                  ? "bg-orange-100 text-orange-800"
                                                                  : item.urgensi ===
                                                                      "sedang"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-green-100 text-green-800"
                                                        }`}
                                                    >
                                                        {item.urgensi?.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge
                                                        status={
                                                            item.status_item
                                                        }
                                                        map={ITEM_STATUS_LABEL}
                                                    />
                                                    {item.catatan_item && (
                                                        <p className="text-xs text-gray-400 mt-0.5 italic">
                                                            {item.catatan_item}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Kalab per-item decision */}
                                                {canReview && isAjukan && (
                                                    <td className="px-6 py-4 text-sm min-w-[240px]">
                                                        <div className="space-y-2">
                                                            <div className="flex w-full bg-gray-100 p-1 rounded-lg border border-gray-200">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateItemDecision(
                                                                            item.id,
                                                                            "status",
                                                                            "disetujui_kalab",
                                                                        )
                                                                    }
                                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-md transition-all duration-200 ${dec.status === "disetujui_kalab" ? "bg-white text-blue-700 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
                                                                >
                                                                    <Check
                                                                        className="w-3.5 h-3.5"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    />
                                                                    Setuju
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateItemDecision(
                                                                            item.id,
                                                                            "status",
                                                                            "ditolak_kalab",
                                                                        )
                                                                    }
                                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-md transition-all duration-200 ${dec.status === "ditolak_kalab" ? "bg-white text-red-700 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
                                                                >
                                                                    <X
                                                                        className="w-3.5 h-3.5"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    />
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                            {dec.status ===
                                                                "disetujui_kalab" && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <label className="text-xs text-gray-500 whitespace-nowrap">
                                                                        Jml:
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            item.jumlah_diminta
                                                                        }
                                                                        value={
                                                                            dec.jumlah_disetujui
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemDecision(
                                                                                item.id,
                                                                                "jumlah_disetujui",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-14 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                                                    />
                                                                    <span className="text-xs text-gray-400">
                                                                        /{" "}
                                                                        {
                                                                            item.jumlah_diminta
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="text"
                                                                value={
                                                                    dec.catatan
                                                                }
                                                                onChange={(e) =>
                                                                    updateItemDecision(
                                                                        item.id,
                                                                        "catatan",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Catatan (opsional)"
                                                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                                            />
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Convert to aset button */}
                                                {canConvert &&
                                                    status ===
                                                        "disetujui_kadep" && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            {item.status_item ===
                                                                "disetujui_kadep" &&
                                                            !alreadyConverted ? (
                                                                <button
                                                                    onClick={() =>
                                                                        openConvert(
                                                                            item,
                                                                        )
                                                                    }
                                                                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700"
                                                                >
                                                                    + Jadikan
                                                                    Aset
                                                                </button>
                                                            ) : item.status_item ===
                                                                  "diterima" ||
                                                              alreadyConverted ? (
                                                                <span className="text-xs text-emerald-600 font-medium">
                                                                    ✓ Sudah jadi
                                                                    aset
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Panel Review Kalab ──────────────────────────────────── */}
                {canReview && isAjukan && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-800">
                                Keputusan Review Kalab
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Keputusan akhir:{" "}
                                <span
                                    className={
                                        computeKalabDecision() ===
                                        "disetujui_kalab"
                                            ? "text-blue-700 font-semibold"
                                            : "text-red-700 font-semibold"
                                    }
                                >
                                    {computeKalabDecision() ===
                                    "disetujui_kalab"
                                        ? "Disetujui (lanjut ke Kadep)"
                                        : "Ditolak"}
                                </span>
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Catatan Review (opsional)
                                </label>
                                <textarea
                                    value={catatanReview}
                                    onChange={(e) =>
                                        setCatatanReview(e.target.value)
                                    }
                                    rows="3"
                                    placeholder="Catatan keseluruhan untuk pemohon..."
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsReviewConfirm(true)}
                                    disabled={reviewForm.processing}
                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Simpan Keputusan Kalab
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Panel ACC Kadep ─────────────────────────────────────── */}
                {canApprove && isSetujuiKalab && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border-t-4 border-t-green-500">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-800">
                                ACC Kepala Departemen
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Permohonan telah direview oleh Kalab dan
                                menunggu persetujuan final Kadep.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Keputusan
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            setKadepDecision("disetujui_kadep")
                                        }
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border transition-colors ${kadepDecision === "disetujui_kadep" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-green-50"}`}
                                    >
                                        ✓ ACC (Setujui)
                                    </button>
                                    <button
                                        onClick={() =>
                                            setKadepDecision("ditolak_kadep")
                                        }
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border transition-colors ${kadepDecision === "ditolak_kadep" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-300 hover:bg-red-50"}`}
                                    >
                                        ✗ Tolak
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Catatan Kadep (opsional)
                                </label>
                                <textarea
                                    value={catatanKadep}
                                    onChange={(e) =>
                                        setCatatanKadep(e.target.value)
                                    }
                                    rows="3"
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsKadepConfirm(true)}
                                    disabled={kadepForm.processing}
                                    className={`px-6 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 ${kadepDecision === "disetujui_kadep" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                                >
                                    Konfirmasi Keputusan Kadep
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal: Confirm Submit Draft ─────────────────────────────── */}
            <Modal
                show={isSubmitConfirmOpen}
                onClose={() => setIsSubmitConfirmOpen(false)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ajukan Permohonan?
                    </h3>
                    <p className="text-sm text-gray-500">
                        Permohonan akan dikirim ke Kalab untuk direview.
                        Pastikan semua item sudah benar.
                    </p>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setIsSubmitConfirmOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
                        >
                            Ya, Ajukan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Confirm Kalab Review ──────────────────────────────── */}
            <Modal
                show={isReviewConfirm}
                onClose={() => setIsReviewConfirm(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Konfirmasi Review Kalab
                    </h3>
                    <div className="space-y-1 mb-4 max-h-48 overflow-y-auto border rounded-lg p-2">
                        {(permohonan.wishlist_aset || []).map((item) => {
                            const d = itemDecisions[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                                >
                                    <span className="text-gray-700 truncate max-w-[200px]">
                                        {item.nama_barang}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ml-2 ${d?.status === "disetujui_kalab" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}
                                    >
                                        {d?.status === "disetujui_kalab"
                                            ? `✓ ${d.jumlah_disetujui} ${item.satuan || "unit"}`
                                            : "✗ Ditolak"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsReviewConfirm(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleSaveReview}
                            disabled={reviewForm.processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {reviewForm.processing
                                ? "Menyimpan..."
                                : "Simpan Review"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Confirm Kadep ─────────────────────────────────────── */}
            <Modal
                show={isKadepConfirm}
                onClose={() => setIsKadepConfirm(false)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Konfirmasi Keputusan Kadep
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Anda akan{" "}
                        <strong
                            className={
                                kadepDecision === "disetujui_kadep"
                                    ? "text-green-700"
                                    : "text-red-700"
                            }
                        >
                            {kadepDecision === "disetujui_kadep"
                                ? "menyetujui"
                                : "menolak"}
                        </strong>{" "}
                        permohonan ini secara final. Tindakan ini tidak dapat
                        dibatalkan.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsKadepConfirm(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleKadepApprove}
                            disabled={kadepForm.processing}
                            className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 ${kadepDecision === "disetujui_kadep" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            {kadepForm.processing
                                ? "Memproses..."
                                : "Ya, Konfirmasi"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Convert to Aset ──────────────────────────────────── */}
            <Modal
                show={isConvertOpen}
                onClose={() => setIsConvertOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleConvert}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Tambahkan sebagai Aset
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Item: <strong>{convertItem?.nama_barang}</strong>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Jumlah disetujui:{" "}
                            <span className="font-medium">
                                {convertItem?.jumlah_disetujui ??
                                    convertItem?.jumlah_diminta ??
                                    1}
                            </span>
                        </p>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Kategori Aset *
                            </label>
                            <select
                                value={convertForm.data.kategori_aset_id}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "kategori_aset_id",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                required
                            >
                                <option value="">Pilih kategori...</option>
                                {(kategoriAset || []).map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                            {convertForm.errors.kategori_aset_id && (
                                <p className="text-xs text-red-500 mt-1">
                                    {convertForm.errors.kategori_aset_id}
                                </p>
                            )}
                        </div>
                        <div>
                            {(convertItem?.jumlah_disetujui ??
                                convertItem?.jumlah_diminta ??
                                1) <= 1 ? (
                                <>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kode Barang *
                                    </label>
                                    <input
                                        type="text"
                                        value={convertForm.data.kode_barang}
                                        onChange={(e) =>
                                            convertForm.setData(
                                                "kode_barang",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                        required
                                    />
                                    {convertForm.errors.kode_barang && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {convertForm.errors.kode_barang}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kode Barang per Unit *
                                    </label>
                                    <textarea
                                        value={
                                            convertForm.data
                                                .kode_barang_list_text
                                        }
                                        onChange={(e) =>
                                            convertForm.setData(
                                                "kode_barang_list_text",
                                                e.target.value,
                                            )
                                        }
                                        rows="4"
                                        placeholder="Masukkan 1 kode per baris"
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Wajib{" "}
                                        {convertItem?.jumlah_disetujui ??
                                            convertItem?.jumlah_diminta ??
                                            1}{" "}
                                        kode, satu baris per kode.
                                    </p>
                                    {(convertForm.errors.kode_barang_list ||
                                        convertForm.errors[
                                            "kode_barang_list.0"
                                        ]) && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {convertForm.errors
                                                .kode_barang_list ||
                                                convertForm.errors[
                                                    "kode_barang_list.0"
                                                ]}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nama Spesifik
                            </label>
                            <input
                                type="text"
                                value={convertForm.data.nama}
                                onChange={(e) =>
                                    convertForm.setData("nama", e.target.value)
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Keadaan *
                            </label>
                            <select
                                value={convertForm.data.keadaan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "keadaan",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                required
                            >
                                <option value="baik">Baik</option>
                                <option value="rusak">Rusak</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Perolehan
                            </label>
                            <input
                                type="date"
                                value={convertForm.data.tanggal_perolehan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "tanggal_perolehan",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Harga Perolehan
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={convertForm.data.harga_perolehan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "harga_perolehan",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Asal Barang
                            </label>
                            <select
                                value={convertForm.data.asal_barang}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "asal_barang",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            >
                                <option value="pengadaan">Pengadaan</option>
                                <option value="hibah">Hibah</option>
                                <option value="pembelian_mandiri">
                                    Pembelian Mandiri
                                </option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Keterangan
                            </label>
                            <textarea
                                value={convertForm.data.keterangan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "keterangan",
                                        e.target.value,
                                    )
                                }
                                rows="2"
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsConvertOpen(false)}
                            className="px-4 py-2 bg-white border text-gray-700 rounded-md text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={convertForm.processing}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {convertForm.processing
                                ? "Menyimpan..."
                                : "Simpan sebagai Aset"}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
