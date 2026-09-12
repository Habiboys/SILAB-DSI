import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import {
    DataTable,
    DataTableEmpty,
    DataTableHead,
} from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SP_TEXT = {
    draft: "Draft",
    diajukan: "Diajukan",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
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

function InfoRow({ label, value }) {
    return (
        <div className="grid grid-cols-5 gap-2 border-b border-base-content/10 py-2 last:border-0">
            <dt className="col-span-2 text-sm font-medium text-base-content/70">
                {label}
            </dt>
            <dd className="col-span-3 whitespace-pre-wrap text-sm text-base-content">
                {value || <span className="text-base-content/50">–</span>}
            </dd>
        </div>
    );
}

function LockNotice({ message }) {
    return (
        <div className="alert alert-warning mb-4 text-sm" role="status">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
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

    const [approveModal, setApproveModal] = useState(false);
    const [approveAction, setApproveAction] = useState("approve");
    const [approveCatatan, setApproveCatatan] = useState("");
    const [approving, setApproving] = useState(false);

    const [ajukanModal, setAjukanModal] = useState(false);
    const [deleteParamTarget, setDeleteParamTarget] = useState(null);
    const [removePjTarget, setRemovePjTarget] = useState(null);

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

    const [showPjForm, setShowPjForm] = useState(false);
    const [selectedPjUser, setSelectedPjUser] = useState("");
    const [pjProcessing, setPjProcessing] = useState(false);

    const [capaianInputs, setCapaianInputs] = useState(
        Object.fromEntries(
            (proker.parameter || []).map((p) => [p.id, p.capaian ?? ""]),
        ),
    );

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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal mengajukan program kerja");
                },
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memproses persetujuan");
                },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menyimpan parameter");
            },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus parameter");
            },
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menyimpan capaian");
                },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menyimpan evaluasi");
            },
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menambah PJ");
                },
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menghapus PJ");
                },
            },
        );
    };

    const totalBobot = (proker.parameter || []).reduce(
        (s, p) => s + (Number(p.bobot) || 0),
        0,
    );
    const totalCapaian = proker.persentase_capaian ?? null;
    const spText = SP_TEXT[proker.status_pengajuan] ?? proker.status_pengajuan;
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

            <PageHeader
                title={
                    proker.nama_display ||
                    proker.nama_proker ||
                    "(Tanpa Nama)"
                }
                description="Kelola pelaksanaan, capaian, dan evaluasi program kerja."
                actions={
                    <>
                        <Button
                            variant="ghost"
                            href={route(
                                "proker.index",
                                kepengurusan_lab_id ? { kepengurusan_lab_id } : {},
                            )}
                        >
                            Kembali
                        </Button>
                        {can.ajukan && proker.status_pengajuan === "draft" && (
                            <Button variant="warning" onClick={handleAjukan}>
                                Ajukan Persetujuan
                            </Button>
                        )}
                        {can.approve &&
                            proker.status_pengajuan === "diajukan" && (
                                <>
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            setApproveAction("approve");
                                            setApproveCatatan("");
                                            setApproveModal(true);
                                        }}
                                    >
                                        Setujui
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            setApproveAction("reject");
                                            setApproveCatatan("");
                                            setApproveModal(true);
                                        }}
                                    >
                                        Tolak
                                    </Button>
                                </>
                            )}
                    </>
                }
            />

            <div className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={proker.status_pengajuan} label={spText} />
                <StatusBadge status={proker.status} label={sText} />
                {proker.struktur && (
                    <StatusBadge tone="info" label={proker.struktur.struktur} />
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <PageSection title="Informasi Umum">
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
                    </PageSection>

                    <PageSection
                        title="Parameter Penilaian"
                        actions={
                            can.manage && (
                                <Button
                                    size="sm"
                                    onClick={() => openParamForm()}
                                >
                                    <Plus className="h-4 w-4" /> Tambah Parameter
                                </Button>
                            )
                        }
                    >
                        {!isApproved && (
                            <LockNotice message="Pengisian capaian parameter tersedia setelah proker disetujui." />
                        )}

                        {showParamForm && (
                            <form
                                onSubmit={handleParamSubmit}
                                className="mb-4 space-y-3 rounded-md border border-info/40 bg-info/10 p-4"
                            >
                                <p className="text-sm font-medium text-base-content">
                                    {editingParam
                                        ? "Edit Parameter"
                                        : "Tambah Parameter Baru"}
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <FormField
                                        label="Nama Parameter"
                                        error={paramErrors.nama_parameter}
                                        required
                                        className="sm:col-span-2"
                                    >
                                        <input
                                            type="text"
                                            value={paramData.nama_parameter}
                                            onChange={(e) =>
                                                setParamData(
                                                    "nama_parameter",
                                                    e.target.value,
                                                )
                                            }
                                            className="input input-bordered min-h-11 w-full focus:input-primary"
                                            placeholder="Contoh: Peserta hadir > 80%"
                                            required
                                        />
                                    </FormField>
                                    <FormField
                                        label="Bobot (%)"
                                        error={paramErrors.bobot}
                                        required
                                    >
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
                                            className="input input-bordered min-h-11 w-full focus:input-primary"
                                            placeholder="30"
                                            required
                                        />
                                    </FormField>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        loading={paramProcessing}
                                    >
                                        {editingParam ? "Perbarui" : "Tambah"}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowParamForm(false)}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        )}

                        <DataTable>
                            <DataTableHead>
                                <tr>
                                    <th className="text-left">Indikator</th>
                                    <th className="w-24 text-center">
                                        Bobot (%)
                                    </th>
                                    <th className="w-32 text-center">
                                        Capaian (%)
                                    </th>
                                    <th className="w-24 text-center">
                                        Tertimbang
                                    </th>
                                    {can.manage && (
                                        <th className="w-20 text-right">Aksi</th>
                                    )}
                                </tr>
                            </DataTableHead>
                            <tbody>
                                {proker.parameter?.length ? (
                                    proker.parameter.map((param) => {
                                        const capaian =
                                            capaianInputs[param.id];
                                        const tertimbang =
                                            capaian !== "" &&
                                            capaian !== null &&
                                            capaian !== undefined
                                                ? (
                                                      (Number(capaian) *
                                                          Number(param.bobot)) /
                                                      100
                                                  ).toFixed(1)
                                                : "–";
                                        return (
                                            <tr key={param.id} className="hover">
                                                <td className="text-base-content">
                                                    {param.nama_parameter}
                                                </td>
                                                <td className="text-center font-medium">
                                                    {param.bobot}
                                                </td>
                                                <td className="text-center">
                                                    {can.updateProgress ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            aria-label={`Capaian ${param.nama_parameter}`}
                                                            value={
                                                                capaianInputs[
                                                                    param.id
                                                                ] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                setCapaianInputs(
                                                                    (prev) => ({
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
                                                            className="input input-bordered w-20 text-center focus:input-primary"
                                                            placeholder="–"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-base-content/80">
                                                            {param.capaian !=
                                                            null
                                                                ? param.capaian +
                                                                  "%"
                                                                : "–"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center text-base-content/70">
                                                    {tertimbang}
                                                </td>
                                                {can.manage && (
                                                    <td>
                                                        <RowActions
                                                            onEdit={() =>
                                                                openParamForm(
                                                                    param,
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                setDeleteParamTarget(
                                                                    param,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <DataTableEmpty
                                        colSpan={can.manage ? 5 : 4}
                                        message="Belum ada parameter penilaian. Tambahkan minimal 1 indikator."
                                    />
                                )}
                            </tbody>
                            {!!proker.parameter?.length && (
                                <tfoot>
                                    <tr className="bg-base-200 font-semibold">
                                        <td>Total</td>
                                        <td
                                            className={`text-center ${totalBobot > 100 ? "text-error" : totalBobot === 100 ? "text-success" : "text-warning"}`}
                                        >
                                            {totalBobot}%
                                            {totalBobot !== 100 && (
                                                <span className="ml-1 text-xs font-normal">
                                                    {totalBobot < 100
                                                        ? `(kurang ${100 - totalBobot}%)`
                                                        : `(lebih ${totalBobot - 100}%)`}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center text-base-content/50">
                                            –
                                        </td>
                                        <td className="text-center">
                                            {totalCapaian !== null &&
                                            totalCapaian !== undefined ? (
                                                <span
                                                    className={`font-bold ${totalCapaian >= 80 ? "text-success" : totalCapaian >= 50 ? "text-warning" : "text-error"}`}
                                                >
                                                    {totalCapaian}%
                                                </span>
                                            ) : (
                                                <span className="text-base-content/50">
                                                    –
                                                </span>
                                            )}
                                        </td>
                                        {can.manage && <td />}
                                    </tr>
                                </tfoot>
                            )}
                        </DataTable>
                    </PageSection>

                    <PageSection
                        title="Evaluasi & LPJ"
                        actions={
                            can.updateProgress &&
                            !editingEval && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingEval(true)}
                                >
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>
                            )
                        }
                    >
                        {!isApproved && (
                            <LockNotice message="Pengisian evaluasi tersedia setelah proker disetujui." />
                        )}
                        {editingEval ? (
                            <div className="space-y-4">
                                <FormField label="Status Keterlaksanaan">
                                    <select
                                        value={evalData.status_evaluasi}
                                        onChange={(e) =>
                                            setEvalData(
                                                "status_evaluasi",
                                                e.target.value,
                                            )
                                        }
                                        className="select select-bordered min-h-11 w-full focus:select-primary"
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
                                </FormField>
                                {["kendala", "solusi", "saran"].map((field) => (
                                    <FormField
                                        key={field}
                                        label={
                                            field.charAt(0).toUpperCase() +
                                            field.slice(1)
                                        }
                                    >
                                        <textarea
                                            value={evalData[field]}
                                            onChange={(e) =>
                                                setEvalData(
                                                    field,
                                                    e.target.value,
                                                )
                                            }
                                            className="textarea textarea-bordered w-full focus:textarea-primary"
                                            rows="3"
                                            placeholder={
                                                field === "kendala"
                                                    ? "Hambatan yang dihadapi selama pelaksanaan…"
                                                    : field === "solusi"
                                                      ? "Langkah yang diambil untuk mengatasi kendala…"
                                                      : "Rekomendasi untuk periode selanjutnya…"
                                            }
                                        />
                                    </FormField>
                                ))}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleEvalSave}
                                        loading={evalProcessing}
                                    >
                                        Simpan Evaluasi
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setEditingEval(false)}
                                    >
                                        Batal
                                    </Button>
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
                    </PageSection>

                    <PageSection title="Kegiatan Terkait">
                        {!isApproved && (
                            <LockNotice message="Kegiatan hanya dapat ditambahkan setelah proker disetujui." />
                        )}
                        {(proker.kegiatan || []).length === 0 ? (
                            <p className="py-4 text-center text-sm text-base-content/60">
                                Belum ada kegiatan yang terhubung dengan program
                                kerja ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-base-content/10">
                                {proker.kegiatan.map((k) => (
                                    <li
                                        key={k.id}
                                        className="flex items-start justify-between gap-3 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-base-content">
                                                {k.nama_kegiatan ||
                                                    k.deskripsi ||
                                                    "(Tanpa Nama)"}
                                            </p>
                                            {k.tanggal && (
                                                <p className="mt-0.5 text-xs text-base-content/60">
                                                    {fmtDate(k.tanggal)}
                                                </p>
                                            )}
                                        </div>
                                        {k.status_approval && (
                                            <StatusBadge
                                                status={k.status_approval}
                                                label={
                                                    k.status_approval
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    k.status_approval.slice(1)
                                                }
                                                className="shrink-0"
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PageSection>
                </div>

                <div className="space-y-6">
                    <PageSection
                        title="Penanggung Jawab"
                        actions={
                            can.manage &&
                            !showPjForm && (
                                <Button
                                    size="sm"
                                    onClick={() => setShowPjForm(true)}
                                >
                                    <Plus className="h-4 w-4" /> Tambah
                                </Button>
                            )
                        }
                    >
                        {showPjForm && (
                            <div className="mb-4 space-y-3 rounded-md border border-info/40 bg-info/10 p-3">
                                <FormField label="Pilih Anggota">
                                    <select
                                        value={selectedPjUser}
                                        onChange={(e) =>
                                            setSelectedPjUser(e.target.value)
                                        }
                                        className="select select-bordered min-h-11 w-full focus:select-primary"
                                    >
                                        <option value="">
                                            – Pilih Anggota –
                                        </option>
                                        {availableAnggota.map((a) => (
                                            <option
                                                key={a.user_id ?? a.id}
                                                value={a.user_id ?? a.id}
                                            >
                                                {a.user?.name ?? a.name}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleAddPj}
                                        disabled={!selectedPjUser}
                                        loading={pjProcessing}
                                    >
                                        Tambah
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowPjForm(false);
                                            setSelectedPjUser("");
                                        }}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        )}
                        {(proker.pjs || []).length === 0 ? (
                            <p className="py-2 text-center text-sm text-base-content/60">
                                Belum ada PJ yang ditugaskan
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {proker.pjs.map((pj) => (
                                    <li
                                        key={`${proker.id}-${pj.user_id}`}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                {pj.user?.name?.[0]?.toUpperCase() ??
                                                    "?"}
                                            </div>
                                            <span className="truncate text-sm text-base-content">
                                                {pj.user?.name ?? "–"}
                                            </span>
                                        </div>
                                        {can.manage && (
                                            <IconAction
                                                label="Hapus PJ"
                                                icon={Trash2}
                                                tone="delete"
                                                onClick={() =>
                                                    setRemovePjTarget(pj)
                                                }
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PageSection>

                    <PageSection title="Ringkasan Capaian">
                        <div className="space-y-3">
                            {proker.status_evaluasi && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-base-content/70">
                                        Keterlaksanaan
                                    </span>
                                    <StatusBadge
                                        tone={
                                            proker.status_evaluasi ===
                                            "terlaksana"
                                                ? "success"
                                                : proker.status_evaluasi ===
                                                    "sebagian"
                                                  ? "warning"
                                                  : "error"
                                        }
                                        label={
                                            {
                                                terlaksana: "Terlaksana",
                                                sebagian: "Sebagian",
                                                tidak_terlaksana:
                                                    "Tidak Terlaksana",
                                            }[proker.status_evaluasi]
                                        }
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/70">
                                    Total Bobot
                                </span>
                                <span
                                    className={`font-semibold ${totalBobot === 100 ? "text-success" : "text-warning"}`}
                                >
                                    {totalBobot}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/70">
                                    Indikator
                                </span>
                                <span className="font-semibold text-base-content">
                                    {proker.parameter?.length ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/70">
                                    Capaian Tertimbang
                                </span>
                                {totalCapaian !== null &&
                                totalCapaian !== undefined ? (
                                    <span
                                        className={`text-base font-bold ${totalCapaian >= 80 ? "text-success" : totalCapaian >= 50 ? "text-warning" : "text-error"}`}
                                    >
                                        {totalCapaian}%
                                    </span>
                                ) : (
                                    <span className="text-sm text-base-content/50">
                                        –
                                    </span>
                                )}
                            </div>
                            {totalCapaian !== null &&
                                totalCapaian !== undefined && (
                                    <div className="h-2.5 w-full rounded-full bg-base-300">
                                        <div
                                            className={`h-2.5 rounded-full transition-all ${totalCapaian >= 80 ? "bg-success" : totalCapaian >= 50 ? "bg-warning" : "bg-error"}`}
                                            style={{
                                                width: `${Math.min(totalCapaian, 100)}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/70">
                                    Kegiatan Terkait
                                </span>
                                <span className="font-semibold text-base-content">
                                    {proker.kegiatan?.length ??
                                        proker.kegiatan_count ??
                                        0}
                                </span>
                            </div>
                        </div>
                    </PageSection>
                </div>
            </div>

            <Modal
                show={!!approveModal}
                onClose={() => setApproveModal(false)}
                maxWidth="md"
            >
                <div className="space-y-4 p-6">
                    <div>
                        <h3 className="text-lg font-semibold text-base-content">
                            {approveAction === "approve"
                                ? "Setujui Program Kerja"
                                : "Tolak Program Kerja"}
                        </h3>
                        <p className="mt-1 text-sm text-base-content/70">
                            Program:{" "}
                            <span className="font-medium text-base-content">
                                {proker.nama_display || proker.nama_proker}
                            </span>
                        </p>
                    </div>
                    <FormField
                        label="Catatan"
                        required={approveAction === "reject"}
                    >
                        <textarea
                            value={approveCatatan}
                            onChange={(e) => setApproveCatatan(e.target.value)}
                            className="textarea textarea-bordered w-full focus:textarea-primary"
                            rows="3"
                            placeholder={
                                approveAction === "approve"
                                    ? "Opsional: catatan persetujuan…"
                                    : "Jelaskan alasan penolakan…"
                            }
                        />
                    </FormField>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setApproveModal(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant={
                                approveAction === "approve"
                                    ? "success"
                                    : "danger"
                            }
                            onClick={handleApprove}
                            loading={approving}
                            disabled={
                                approveAction === "reject" &&
                                !approveCatatan.trim()
                            }
                        >
                            {approveAction === "approve" ? "Setujui" : "Tolak"}
                        </Button>
                    </div>
                </div>
            </Modal>

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
