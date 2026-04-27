import ConfirmModal from "@/Components/ConfirmModal";
import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SP_BADGE = {
    draft: "bg-gray-100 text-gray-700",
    diajukan: "bg-yellow-100 text-yellow-700",
    disetujui: "bg-green-100 text-green-700",
    ditolak: "bg-red-100 text-red-700",
};
const SP_TEXT = {
    draft: "Draft",
    diajukan: "Diajukan",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
};
const S_BADGE = {
    belum_mulai: "bg-slate-100 text-slate-700",
    sedang_berjalan: "bg-blue-100 text-blue-700",
    selesai: "bg-green-100 text-green-700",
    ditunda: "bg-orange-100 text-orange-700",
};
const S_TEXT = {
    belum_mulai: "Belum Mulai",
    sedang_berjalan: "Sedang Berjalan",
    selesai: "Selesai",
    ditunda: "Ditunda",
};

function fmtDate(d) {
    if (!d) return "–";
    return new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function SectionCard({ title, children, action }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="grid grid-cols-5 gap-2 py-2 border-b border-gray-50 last:border-0">
            <dt className="col-span-2 text-sm text-gray-500 font-medium">
                {label}
            </dt>
            <dd className="col-span-3 text-sm text-gray-800 whitespace-pre-wrap">
                {value || <span className="text-gray-400">–</span>}
            </dd>
        </div>
    );
}

function LockNotice({ message }) {
    return (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <Lock className="h-4 w-4 shrink-0" />
            {message}
        </div>
    );
}

export default function ProkerShow({
    proker,
    anggota = [],
    can = {},
    kepengurusan_lab_id,
}) {
    const isApproved = proker.status_pengajuan === "disetujui";

    // Approval modal
    const [approveModal, setApproveModal] = useState(false);
    const [approveAction, setApproveAction] = useState("approve");
    const [approveCatatan, setApproveCatatan] = useState("");
    const [approving, setApproving] = useState(false);

    // Confirm modals
    const [ajukanModal, setAjukanModal] = useState(false);
    const [deleteParamTarget, setDeleteParamTarget] = useState(null);
    const [removePjTarget, setRemovePjTarget] = useState(null);

    // Parameter form
    const [showParamForm, setShowParamForm] = useState(false);
    const [editingParam, setEditingParam] = useState(null);
    const {
        data: paramData,
        setData: setParamData,
        post: postParam,
        put: putParam,
        processing: paramProcessing,
        errors: paramErrors,
        reset: resetParam,
    } = useForm({ nama_parameter: "", bobot: "", urutan: "" });

    // Evaluasi form
    const [editingEval, setEditingEval] = useState(false);
    const {
        data: evalData,
        setData: setEvalData,
        patch: patchEval,
        processing: evalProcessing,
    } = useForm({
        kendala: proker.kendala ?? "",
        solusi: proker.solusi ?? "",
        saran: proker.saran ?? "",
        status_evaluasi: proker.status_evaluasi ?? "",
    });

    // PJ form
    const [showPjForm, setShowPjForm] = useState(false);
    const [selectedPjUser, setSelectedPjUser] = useState("");
    const [pjProcessing, setPjProcessing] = useState(false);

    // Capaian inline edit
    const [capaianInputs, setCapaianInputs] = useState(
        Object.fromEntries(
            (proker.parameter || []).map((p) => [p.id, p.capaian ?? ""]),
        ),
    );

    // ── Handlers ──

    const handleAjukan = () => setAjukanModal(true);

    const confirmAjukan = () => {
        router.post(
            route("proker.ajukan", proker.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Program kerja berhasil diajukan");
                    setAjukanModal(false);
                },
                onError: () => toast.error("Gagal mengajukan program kerja"),
            },
        );
    };

    const handleApprove = () => {
        setApproving(true);
        router.post(
            route("proker.approve", proker.id),
            { action: approveAction, catatan: approveCatatan },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        approveAction === "approve"
                            ? "Proker disetujui"
                            : "Proker ditolak",
                    );
                    setApproveModal(false);
                },
                onError: () => toast.error("Gagal memproses persetujuan"),
                onFinish: () => setApproving(false),
            },
        );
    };

    const openParamForm = (param = null) => {
        setEditingParam(param);
        if (param) {
            setParamData({
                nama_parameter: param.nama_parameter,
                bobot: param.bobot,
                urutan: param.urutan,
            });
        } else {
            resetParam();
        }
        setShowParamForm(true);
    };

    const handleParamSubmit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    editingParam
                        ? "Parameter diperbarui"
                        : "Parameter ditambahkan",
                );
                setShowParamForm(false);
                if (!editingParam) resetParam();
            },
            onError: () => toast.error("Gagal menyimpan parameter"),
        };
        if (editingParam) {
            putParam(route("proker-parameter.update", editingParam.id), opts);
        } else {
            postParam(route("proker-parameter.store", proker.id), opts);
        }
    };

    const confirmDeleteParam = () => {
        if (!deleteParamTarget) return;
        router.delete(route("proker-parameter.destroy", deleteParamTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Parameter dihapus");
                setDeleteParamTarget(null);
            },
            onError: () => toast.error("Gagal menghapus parameter"),
        });
    };

    const handleCapaianBlur = (param) => {
        const val = capaianInputs[param.id];
        if (String(val) === String(param.capaian ?? "")) return;
        router.patch(
            route("proker-parameter.capaian", param.id),
            { capaian: val === "" ? null : Number(val) },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Capaian disimpan"),
                onError: () => toast.error("Gagal menyimpan capaian"),
            },
        );
    };

    const handleEvalSave = () => {
        patchEval(route("proker.evaluasi", proker.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Evaluasi disimpan");
                setEditingEval(false);
            },
            onError: () => toast.error("Gagal menyimpan evaluasi"),
        });
    };

    const handleAddPj = () => {
        if (!selectedPjUser) return;
        setPjProcessing(true);
        router.post(
            route("proker-pj.store", proker.id),
            { user_id: selectedPjUser },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("PJ ditambahkan");
                    setSelectedPjUser("");
                    setShowPjForm(false);
                },
                onError: () => toast.error("Gagal menambah PJ"),
                onFinish: () => setPjProcessing(false),
            },
        );
    };

    const confirmRemovePj = () => {
        if (!removePjTarget) return;
        router.delete(
            route("proker-pj.destroy", [proker.id, removePjTarget.user_id]),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("PJ dihapus");
                    setRemovePjTarget(null);
                },
                onError: () => toast.error("Gagal menghapus PJ"),
            },
        );
    };

    // Derived
    const totalBobot = (proker.parameter || []).reduce(
        (s, p) => s + (Number(p.bobot) || 0),
        0,
    );
    const totalCapaian = proker.persentase_capaian ?? null;
    const spBadge =
        SP_BADGE[proker.status_pengajuan] ?? "bg-gray-100 text-gray-700";
    const spText = SP_TEXT[proker.status_pengajuan] ?? proker.status_pengajuan;
    const sBadge = S_BADGE[proker.status] ?? "bg-gray-100 text-gray-800";
    const sText = S_TEXT[proker.status] ?? proker.status;
    const existingPjIds = (proker.pjs || []).map((p) => p.user_id);
    const availableAnggota = anggota.filter(
        (a) => !existingPjIds.includes(a.user_id ?? a.id),
    );

    return (
        <DashboardLayout>
            <Head
                title={
                    proker.nama_display || proker.nama_proker || "Detail Proker"
                }
            />

            {/* Page header */}
            <div className="mb-6">
                <Link
                    href={route(
                        "proker.index",
                        kepengurusan_lab_id ? { kepengurusan_lab_id } : {},
                    )}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm font-medium inline-flex items-center gap-1.5 mb-3"
                >
                    &larr; Kembali
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {proker.nama_display ||
                                proker.nama_proker ||
                                "(Tanpa Nama)"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${spBadge}`}
                            >
                                {spText}
                            </span>
                            <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sBadge}`}
                            >
                                {sText}
                            </span>
                            {proker.struktur && (
                                <span className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full font-medium">
                                    {proker.struktur.struktur}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {can.ajukan && proker.status_pengajuan === "draft" && (
                            <button
                                onClick={handleAjukan}
                                className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
                            >
                                Ajukan Persetujuan
                            </button>
                        )}
                        {can.approve &&
                            proker.status_pengajuan === "diajukan" && (
                                <>
                                    <button
                                        onClick={() => {
                                            setApproveAction("approve");
                                            setApproveCatatan("");
                                            setApproveModal(true);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Setujui
                                    </button>
                                    <button
                                        onClick={() => {
                                            setApproveAction("reject");
                                            setApproveCatatan("");
                                            setApproveModal(true);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                    >
                                        Tolak
                                    </button>
                                </>
                            )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informasi Umum */}
                    <SectionCard title="Informasi Umum">
                        <dl>
                            <InfoRow
                                label="Nama Program Kerja"
                                value={
                                    proker.nama_proker || proker.nama_display
                                }
                            />
                            <InfoRow
                                label="Divisi / Struktur"
                                value={proker.struktur?.struktur}
                            />
                            <InfoRow
                                label="Deskripsi"
                                value={proker.deskripsi}
                            />
                            <InfoRow label="Tujuan" value={proker.tujuan} />
                            <InfoRow label="Sasaran" value={proker.sasaran} />
                            <InfoRow
                                label="Output Kegiatan"
                                value={proker.output_kegiatan}
                            />
                            <InfoRow
                                label="Tanggal Mulai"
                                value={fmtDate(proker.tanggal_mulai)}
                            />
                            <InfoRow
                                label="Tanggal Selesai"
                                value={fmtDate(proker.tanggal_selesai)}
                            />
                            <InfoRow
                                label="Keterangan"
                                value={proker.keterangan}
                            />
                        </dl>
                    </SectionCard>

                    {/* Parameter Penilaian */}
                    <SectionCard
                        title="Parameter Penilaian"
                        action={
                            can.manage && (
                                <button
                                    onClick={() => openParamForm()}
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" /> Tambah
                                    Parameter
                                </button>
                            )
                        }
                    >
                        {!isApproved && (
                            <LockNotice message="Pengisian capaian parameter tersedia setelah proker disetujui." />
                        )}

                        {showParamForm && (
                            <form
                                onSubmit={handleParamSubmit}
                                className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200"
                            >
                                <p className="text-sm font-medium text-blue-800 mb-3">
                                    {editingParam
                                        ? "Edit Parameter"
                                        : "Tambah Parameter Baru"}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Nama Parameter{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paramData.nama_parameter}
                                            onChange={(e) =>
                                                setParamData(
                                                    "nama_parameter",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                                            placeholder="Contoh: Peserta hadir > 80%"
                                            required
                                        />
                                        {paramErrors.nama_parameter && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {paramErrors.nama_parameter}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Bobot (%){" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={paramData.bobot}
                                            onChange={(e) =>
                                                setParamData(
                                                    "bobot",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                                            placeholder="30"
                                            required
                                        />
                                        {paramErrors.bobot && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {paramErrors.bobot}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="submit"
                                        disabled={paramProcessing}
                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                                    >
                                        {paramProcessing
                                            ? "Menyimpan…"
                                            : editingParam
                                              ? "Perbarui"
                                              : "Tambah"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowParamForm(false)}
                                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        )}

                        {proker.parameter?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <th className="px-3 py-2 text-left">
                                                Indikator
                                            </th>
                                            <th className="px-3 py-2 text-center w-24">
                                                Bobot (%)
                                            </th>
                                            <th className="px-3 py-2 text-center w-32">
                                                Capaian (%)
                                            </th>
                                            <th className="px-3 py-2 text-center w-24">
                                                Tertimbang
                                            </th>
                                            {can.manage && (
                                                <th className="px-3 py-2 w-20"></th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {proker.parameter.map((param) => {
                                            const capaian =
                                                capaianInputs[param.id];
                                            const tertimbang =
                                                capaian !== "" &&
                                                capaian !== null &&
                                                capaian !== undefined
                                                    ? (
                                                          (Number(capaian) *
                                                              Number(
                                                                  param.bobot,
                                                              )) /
                                                          100
                                                      ).toFixed(1)
                                                    : "–";
                                            return (
                                                <tr
                                                    key={param.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-3 py-2.5 text-gray-800">
                                                        {param.nama_parameter}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center font-medium">
                                                        {param.bobot}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        {can.updateProgress ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={
                                                                    capaianInputs[
                                                                        param.id
                                                                    ] ?? ""
                                                                }
                                                                onChange={(e) =>
                                                                    setCapaianInputs(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [param.id]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    handleCapaianBlur(
                                                                        param,
                                                                    )
                                                                }
                                                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                                                                placeholder="–"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600 text-sm">
                                                                {param.capaian !=
                                                                null
                                                                    ? param.capaian +
                                                                      "%"
                                                                    : "–"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-gray-600">
                                                        {tertimbang}
                                                    </td>
                                                    {can.manage && (
                                                        <td className="px-3 py-2.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        openParamForm(
                                                                            param,
                                                                        )
                                                                    }
                                                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteParamTarget(
                                                                            param,
                                                                        )
                                                                    }
                                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 font-semibold text-sm">
                                            <td className="px-3 py-2.5">
                                                Total
                                            </td>
                                            <td
                                                className={`px-3 py-2.5 text-center ${totalBobot > 100 ? "text-red-600" : totalBobot === 100 ? "text-green-600" : "text-yellow-600"}`}
                                            >
                                                {totalBobot}%
                                                {totalBobot !== 100 && (
                                                    <span className="ml-1 font-normal text-xs">
                                                        {totalBobot < 100
                                                            ? `(kurang ${100 - totalBobot}%)`
                                                            : `(lebih ${totalBobot - 100}%)`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center text-gray-500">
                                                –
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                {totalCapaian !== null &&
                                                totalCapaian !== undefined ? (
                                                    <span
                                                        className={`font-bold ${totalCapaian >= 80 ? "text-green-600" : totalCapaian >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                                    >
                                                        {totalCapaian}%
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        –
                                                    </span>
                                                )}
                                            </td>
                                            {can.manage && <td />}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">
                                Belum ada parameter penilaian. Tambahkan minimal
                                1 indikator.
                            </p>
                        )}
                    </SectionCard>

                    {/* Evaluasi */}
                    <SectionCard
                        title="Evaluasi & LPJ"
                        action={
                            can.updateProgress &&
                            !editingEval && (
                                <button
                                    onClick={() => setEditingEval(true)}
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    <Pencil className="h-3 w-3" /> Edit
                                </button>
                            )
                        }
                    >
                        {!isApproved && (
                            <LockNotice message="Pengisian evaluasi tersedia setelah proker disetujui." />
                        )}
                        {editingEval ? (
                            <div className="space-y-4">
                                {/* Status evaluasi terlaksana */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status Keterlaksanaan
                                    </label>
                                    <select
                                        value={evalData.status_evaluasi}
                                        onChange={(e) =>
                                            setEvalData(
                                                "status_evaluasi",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            – Belum dievaluasi –
                                        </option>
                                        <option value="terlaksana">
                                            Terlaksana
                                        </option>
                                        <option value="sebagian">
                                            Sebagian Terlaksana
                                        </option>
                                        <option value="tidak_terlaksana">
                                            Tidak Terlaksana
                                        </option>
                                    </select>
                                </div>
                                {["kendala", "solusi", "saran"].map((field) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {field}
                                        </label>
                                        <textarea
                                            value={evalData[field]}
                                            onChange={(e) =>
                                                setEvalData(
                                                    field,
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                                            rows="3"
                                            placeholder={
                                                field === "kendala"
                                                    ? "Hambatan yang dihadapi selama pelaksanaan…"
                                                    : field === "solusi"
                                                      ? "Langkah yang diambil untuk mengatasi kendala…"
                                                      : "Rekomendasi untuk periode selanjutnya…"
                                            }
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEvalSave}
                                        disabled={evalProcessing}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                                    >
                                        {evalProcessing
                                            ? "Menyimpan…"
                                            : "Simpan Evaluasi"}
                                    </button>
                                    <button
                                        onClick={() => setEditingEval(false)}
                                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <dl>
                                <InfoRow
                                    label="Keterlaksanaan"
                                    value={
                                        proker.status_evaluasi
                                            ? {
                                                  terlaksana: "Terlaksana",
                                                  sebagian:
                                                      "Sebagian Terlaksana",
                                                  tidak_terlaksana:
                                                      "Tidak Terlaksana",
                                              }[proker.status_evaluasi]
                                            : null
                                    }
                                />
                                <InfoRow
                                    label="Kendala"
                                    value={proker.kendala}
                                />
                                <InfoRow label="Solusi" value={proker.solusi} />
                                <InfoRow label="Saran" value={proker.saran} />
                            </dl>
                        )}
                    </SectionCard>

                    {/* Kegiatan Terkait */}
                    <SectionCard title="Kegiatan Terkait">
                        {!isApproved && (
                            <LockNotice message="Kegiatan hanya dapat ditambahkan setelah proker disetujui." />
                        )}
                        {(proker.kegiatan || []).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                                Belum ada kegiatan yang terhubung dengan program
                                kerja ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {proker.kegiatan.map((k) => (
                                    <li
                                        key={k.id}
                                        className="py-3 flex items-start justify-between gap-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {k.nama_kegiatan ||
                                                    k.deskripsi ||
                                                    "(Tanpa Nama)"}
                                            </p>
                                            {k.tanggal && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {fmtDate(k.tanggal)}
                                                </p>
                                            )}
                                        </div>
                                        {k.status_approval && (
                                            <span
                                                className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                                                    k.status_approval ===
                                                    "disetujui"
                                                        ? "bg-green-100 text-green-700"
                                                        : k.status_approval ===
                                                            "ditolak"
                                                          ? "bg-red-100 text-red-700"
                                                          : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {k.status_approval
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    k.status_approval.slice(1)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* PJ */}
                    <SectionCard
                        title="Penanggung Jawab"
                        action={
                            can.manage &&
                            !showPjForm && (
                                <button
                                    onClick={() => setShowPjForm(true)}
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" /> Tambah
                                </button>
                            )
                        }
                    >
                        {showPjForm && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Pilih Anggota
                                </label>
                                <select
                                    value={selectedPjUser}
                                    onChange={(e) =>
                                        setSelectedPjUser(e.target.value)
                                    }
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                                >
                                    <option value="">– Pilih Anggota –</option>
                                    {availableAnggota.map((a) => (
                                        <option
                                            key={a.user_id ?? a.id}
                                            value={a.user_id ?? a.id}
                                        >
                                            {a.user?.name ?? a.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleAddPj}
                                        disabled={
                                            !selectedPjUser || pjProcessing
                                        }
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {pjProcessing ? "Menambah…" : "Tambah"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPjForm(false);
                                            setSelectedPjUser("");
                                        }}
                                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}
                        {(proker.pjs || []).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-2">
                                Belum ada PJ yang ditugaskan
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {proker.pjs.map((pj) => (
                                    <li
                                        key={`${proker.id}-${pj.user_id}`}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                                                {pj.user?.name?.[0]?.toUpperCase() ??
                                                    "?"}
                                            </div>
                                            <span className="text-sm text-gray-800">
                                                {pj.user?.name ?? "–"}
                                            </span>
                                        </div>
                                        {can.manage && (
                                            <button
                                                onClick={() =>
                                                    setRemovePjTarget(pj)
                                                }
                                                className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                                title="Hapus PJ"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>

                    {/* Ringkasan Capaian */}
                    <SectionCard title="Ringkasan Capaian">
                        <div className="space-y-3">
                            {proker.status_evaluasi && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Keterlaksanaan
                                    </span>
                                    <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            proker.status_evaluasi ===
                                            "terlaksana"
                                                ? "bg-green-100 text-green-700"
                                                : proker.status_evaluasi ===
                                                    "sebagian"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {
                                            {
                                                terlaksana: "Terlaksana",
                                                sebagian: "Sebagian",
                                                tidak_terlaksana:
                                                    "Tidak Terlaksana",
                                            }[proker.status_evaluasi]
                                        }
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    Total Bobot
                                </span>
                                <span
                                    className={`font-semibold ${totalBobot === 100 ? "text-green-600" : "text-yellow-600"}`}
                                >
                                    {totalBobot}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Indikator</span>
                                <span className="font-semibold text-gray-800">
                                    {proker.parameter?.length ?? 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    Capaian Tertimbang
                                </span>
                                {totalCapaian !== null &&
                                totalCapaian !== undefined ? (
                                    <span
                                        className={`font-bold text-base ${totalCapaian >= 80 ? "text-green-600" : totalCapaian >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                    >
                                        {totalCapaian}%
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-sm">
                                        –
                                    </span>
                                )}
                            </div>
                            {totalCapaian !== null &&
                                totalCapaian !== undefined && (
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all ${totalCapaian >= 80 ? "bg-green-500" : totalCapaian >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                            style={{
                                                width: `${Math.min(totalCapaian, 100)}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    Kegiatan Terkait
                                </span>
                                <span className="font-semibold text-gray-800">
                                    {proker.kegiatan?.length ??
                                        proker.kegiatan_count ??
                                        0}
                                </span>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Approve/Reject Modal */}
            <Modal
                show={!!approveModal}
                onClose={() => setApproveModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {approveAction === "approve"
                            ? "Setujui Program Kerja"
                            : "Tolak Program Kerja"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Program:{" "}
                        <span className="font-medium text-gray-700">
                            {proker.nama_display || proker.nama_proker}
                        </span>
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan{" "}
                            {approveAction === "reject" && (
                                <span className="text-red-500">*</span>
                            )}
                        </label>
                        <textarea
                            value={approveCatatan}
                            onChange={(e) => setApproveCatatan(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
                            rows="3"
                            placeholder={
                                approveAction === "approve"
                                    ? "Opsional: catatan persetujuan…"
                                    : "Jelaskan alasan penolakan…"
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setApproveModal(false)}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={
                                approving ||
                                (approveAction === "reject" &&
                                    !approveCatatan.trim())
                            }
                            className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-70 ${approveAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            {approving
                                ? "Memproses…"
                                : approveAction === "approve"
                                  ? "Setujui"
                                  : "Tolak"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Confirm Modals */}
            <ConfirmModal
                show={ajukanModal}
                onClose={() => setAjukanModal(false)}
                onConfirm={confirmAjukan}
                title="Ajukan Program Kerja"
                message="Ajukan program kerja ini untuk persetujuan? Status akan berubah menjadi 'Diajukan' dan menunggu keputusan koordinator/kepala lab."
                confirmText="Ajukan"
                cancelText="Batal"
                type="info"
            />
            <ConfirmModal
                show={!!deleteParamTarget}
                onClose={() => setDeleteParamTarget(null)}
                onConfirm={confirmDeleteParam}
                title="Hapus Parameter"
                message={`Hapus parameter "${deleteParamTarget?.nama_parameter}"? Data capaian pada parameter ini juga akan dihapus.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
            <ConfirmModal
                show={!!removePjTarget}
                onClose={() => setRemovePjTarget(null)}
                onConfirm={confirmRemovePj}
                title="Hapus Penanggung Jawab"
                message={`Hapus ${removePjTarget?.user?.name} dari daftar penanggung jawab program kerja ini?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="warning"
            />
        </DashboardLayout>
    );
}
