import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowLeft,
    Award,
    BookOpen,
    Building2,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Clock,
    GitBranch,
    MapPin,
    Pencil,
    Plus,
    Scissors,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function PraktikumShow({
    praktikum,
    pertemuanList,
    modulList,
    tugasList,
    praktikanCountByKelas = {},
    pertemuanCountByKelas = {},
    tugasCountByKelas     = {},
}) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState("overview");

    // ── Hierarchy ────────────────────────────────────────────────────
    const allKelas        = praktikum.kelas || [];
    const parentKelasList = allKelas.filter((k) => !k.parent_kelas_id);
    const getSubKelasList = (parentId) =>
        allKelas.filter((k) => k.parent_kelas_id === parentId);

    // ── Counts per kelas ─────────────────────────────────────────────
    const getPraktikanCount  = (id) => praktikanCountByKelas[id]  || 0;
    const getPertemuanCount  = (id) => pertemuanCountByKelas[id]  || 0;
    const getTugasCount      = (id) => tugasCountByKelas[id]      || 0;

    // Cek apakah parent kelas masih punya data "orphaned" (data di parent padahal sudah ada subkelas)
    const parentHasOrphanedData = (parentId) => {
        const subs = getSubKelasList(parentId);
        if (subs.length === 0) return false;
        return (
            getPraktikanCount(parentId) > 0 ||
            getPertemuanCount(parentId) > 0 ||
            getTugasCount(parentId)     > 0
        );
    };

    // Total stats
    const totalPeserta    = Object.values(praktikanCountByKelas).reduce((a, b) => a + b, 0);
    const totalPertemuan  = pertemuanList?.length || 0;
    const totalModul      = modulList?.length || 0;
    const totalTugas      = tugasList?.length || 0;

    // ── Modal states ─────────────────────────────────────────────────
    const [addSubKelasModal, setAddSubKelasModal] = useState({ open: false, parentKelas: null });
    const [editSubKelasModal, setEditSubKelasModal] = useState({ open: false, subKelas: null });
    const [deleteSubKelasModal, setDeleteSubKelasModal] = useState({ open: false, subKelas: null });

    // ── Forms ────────────────────────────────────────────────────────
    const subKelasForm = useForm({
        nama_kelas: "",
        hari: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
    });

    const handleAddSubKelas = (e) => {
        e.preventDefault();
        subKelasForm.post(
            route("praktikum.kelas.sub-kelas.store", {
                praktikum: praktikum.id,
                kelas: addSubKelasModal.parentKelas.id,
            }),
            {
                onSuccess: () => {
                    setAddSubKelasModal({ open: false, parentKelas: null });
                    subKelasForm.reset();
                    toast.success("Sub-kelas berhasil ditambahkan");
                },
                onError: () => toast.error("Gagal menambahkan sub-kelas"),
            },
        );
    };

    const handleEditSubKelas = (e) => {
        e.preventDefault();
        subKelasForm.put(
            route("praktikum.kelas.sub-kelas.update", {
                subKelas: editSubKelasModal.subKelas.id,
            }),
            {
                onSuccess: () => {
                    setEditSubKelasModal({ open: false, subKelas: null });
                    subKelasForm.reset();
                    toast.success("Sub-kelas berhasil diperbarui");
                },
                onError: () => toast.error("Gagal memperbarui sub-kelas"),
            },
        );
    };

    const handleDeleteSubKelas = () => {
        router.delete(
            route("praktikum.kelas.sub-kelas.destroy", {
                subKelas: deleteSubKelasModal.subKelas.id,
            }),
            {
                onSuccess: () => {
                    setDeleteSubKelasModal({ open: false, subKelas: null });
                    toast.success("Sub-kelas berhasil dihapus");
                },
                onError: () => toast.error("Gagal menghapus sub-kelas"),
            },
        );
    };

    const tabs = [
        { id: "overview",  label: "Overview",         icon: <Building2 className="w-4 h-4" /> },
        { id: "pertemuan", label: "Pertemuan",         icon: <CalendarDays className="w-4 h-4" /> },
        { id: "modul",     label: "Modul",             icon: <BookOpen className="w-4 h-4" /> },
        { id: "tugas",     label: "Tugas",             icon: <ClipboardList className="w-4 h-4" /> },
        { id: "peserta",   label: "Peserta",           icon: <Users className="w-4 h-4" /> },
        { id: "sertifikat",label: "Sertifikat",        icon: <Award className="w-4 h-4" /> },
    ];

    return (
        <DashboardLayout>
            <Head title={`${praktikum.mata_kuliah}`} />

            <div className="space-y-4">

                {/* ── Header ──────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link
                                href={
                                    route("praktikum.index", {}, false) +
                                    (praktikum.kepengurusan_lab_id
                                        ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}`
                                        : "")
                                }
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                    {praktikum.mata_kuliah}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {praktikum.kepengurusan_lab?.laboratorium?.nama}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {praktikum.kepengurusan_lab?.tahun_kepengurusan?.tahun}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: "Kelas",     val: parentKelasList.length, color: "blue" },
                                { label: "Peserta",   val: totalPeserta,           color: "emerald" },
                                { label: "Pertemuan", val: totalPertemuan,         color: "indigo" },
                                { label: "Tugas",     val: totalTugas,             color: "amber" },
                            ].map(({ label, val, color }) => (
                                <div
                                    key={label}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-${color}-50 text-${color}-700`}
                                >
                                    <span className="font-bold">{val}</span>
                                    <span className="ml-1 opacity-75 text-xs">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex overflow-x-auto border-b border-gray-100">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                        : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">

                        {/* ══ Overview Tab ════════════════════════════ */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Struktur Kelas
                                    </h3>
                                </div>

                                {parentKelasList.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">Belum ada kelas terdaftar.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {parentKelasList.map((kelas) => {
                                            const subKelas   = getSubKelasList(kelas.id);
                                            const hasSubKelas = subKelas.length > 0;
                                            const hasOrphaned = parentHasOrphanedData(kelas.id);
                                            const jadwalParent = praktikum.jadwal_praktikum?.filter(
                                                (j) => j.kelas_id === kelas.id,
                                            ) || [];

                                            return (
                                                <div
                                                    key={kelas.id}
                                                    className={`rounded-xl border overflow-hidden ${
                                                        hasOrphaned
                                                            ? "border-amber-300"
                                                            : "border-gray-200"
                                                    }`}
                                                >
                                                    {/* ── Kelas Header ── */}
                                                    <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${hasOrphaned ? "bg-amber-50" : "bg-white"}`}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="font-bold text-gray-900">
                                                                    {kelas.nama_kelas}
                                                                </span>
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                        kelas.status === "aktif"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-gray-100 text-gray-600"
                                                                    }`}
                                                                >
                                                                    {kelas.status}
                                                                </span>
                                                                {hasSubKelas && (
                                                                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                                                                        <GitBranch className="w-3 h-3" />
                                                                        {subKelas.length} sub-kelas
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Stats per parent kelas */}
                                                            <div className="flex flex-wrap gap-3 mt-2">
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <Users className="w-3 h-3" />
                                                                    {hasSubKelas
                                                                        ? subKelas.reduce((s, sub) => s + getPraktikanCount(sub.id), 0)
                                                                        : getPraktikanCount(kelas.id)
                                                                    } peserta
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <CalendarDays className="w-3 h-3" />
                                                                    {hasSubKelas
                                                                        ? subKelas.reduce((s, sub) => s + getPertemuanCount(sub.id), 0)
                                                                        : getPertemuanCount(kelas.id)
                                                                    } pertemuan
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <ClipboardList className="w-3 h-3" />
                                                                    {hasSubKelas
                                                                        ? subKelas.reduce((s, sub) => s + getTugasCount(sub.id), 0)
                                                                        : getTugasCount(kelas.id)
                                                                    } tugas
                                                                </span>
                                                            </div>

                                                            {/* Jadwal parent */}
                                                            {jadwalParent.length > 0 && !hasSubKelas && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {jadwalParent.map((j, idx) => (
                                                                        <span key={idx} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                                                                            <Clock className="w-3 h-3" />
                                                                            {j.hari}, {j.jam_mulai}–{j.jam_selesai}
                                                                            <span className="text-gray-300 mx-1">|</span>
                                                                            <MapPin className="w-3 h-3" />
                                                                            {j.ruangan}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() => {
                                                                    subKelasForm.reset();
                                                                    setAddSubKelasModal({ open: true, parentKelas: kelas });
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                                title="Tambah sub-kelas"
                                                            >
                                                                <Scissors className="w-3.5 h-3.5" />
                                                                Pecah Kelas
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* ── Orphaned data warning ── */}
                                                    {hasOrphaned && (
                                                        <div className="px-5 py-2.5 bg-amber-100 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 text-xs text-amber-800">
                                                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                                                <span>
                                                                    Ada data yang masih di kelas induk:{" "}
                                                                    {getPraktikanCount(kelas.id) > 0 && (
                                                                        <strong>{getPraktikanCount(kelas.id)} praktikan</strong>
                                                                    )}
                                                                    {getPraktikanCount(kelas.id) > 0 && getPertemuanCount(kelas.id) > 0 && ", "}
                                                                    {getPertemuanCount(kelas.id) > 0 && (
                                                                        <strong>{getPertemuanCount(kelas.id)} pertemuan</strong>
                                                                    )}
                                                                    {(getPraktikanCount(kelas.id) > 0 || getPertemuanCount(kelas.id) > 0) && getTugasCount(kelas.id) > 0 && ", "}
                                                                    {getTugasCount(kelas.id) > 0 && (
                                                                        <strong>{getTugasCount(kelas.id)} tugas</strong>
                                                                    )}
                                                                    {" "}— perlu didistribusikan ke sub-kelas.
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {getPraktikanCount(kelas.id) > 0 && (
                                                                    <Link
                                                                        href={route("praktikum.praktikan.index", praktikum.id)}
                                                                        className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
                                                                    >
                                                                        Distribusi Praktikan
                                                                    </Link>
                                                                )}
                                                                {getPertemuanCount(kelas.id) > 0 && (
                                                                    <Link
                                                                        href={route("praktikum.pertemuan.index", praktikum.id)}
                                                                        className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
                                                                    >
                                                                        Distribusi Pertemuan
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Sub-kelas list ── */}
                                                    {hasSubKelas && (
                                                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                                                            {subKelas.map((sub) => {
                                                                const jadwalSub = praktikum.jadwal_praktikum?.filter(
                                                                    (j) => j.kelas_id === sub.id,
                                                                ) || [];
                                                                return (
                                                                    <div
                                                                        key={sub.id}
                                                                        className="px-5 py-3 flex items-start justify-between gap-3 bg-gray-50 hover:bg-gray-100/50 transition-colors"
                                                                    >
                                                                        <div className="flex items-start gap-2 min-w-0">
                                                                            <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                            <div className="min-w-0">
                                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                                    <span className="font-medium text-gray-800 text-sm">
                                                                                        {sub.nama_kelas}
                                                                                    </span>
                                                                                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                                                        sub-kelas
                                                                                    </span>
                                                                                </div>
                                                                                {/* Sub-kelas stats */}
                                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                                        <Users className="w-2.5 h-2.5" />
                                                                                        {getPraktikanCount(sub.id)}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                                        <CalendarDays className="w-2.5 h-2.5" />
                                                                                        {getPertemuanCount(sub.id)}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                                        <ClipboardList className="w-2.5 h-2.5" />
                                                                                        {getTugasCount(sub.id)}
                                                                                    </span>
                                                                                </div>
                                                                                {/* Jadwal sub-kelas */}
                                                                                {jadwalSub.length > 0 && (
                                                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                                        {jadwalSub.map((j, idx) => (
                                                                                            <span key={idx} className="flex items-center gap-1 text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                                                                                                <Clock className="w-2.5 h-2.5" />
                                                                                                {j.hari}, {j.jam_mulai}–{j.jam_selesai}
                                                                                                <span className="text-gray-300 mx-0.5">|</span>
                                                                                                <MapPin className="w-2.5 h-2.5" />
                                                                                                {j.ruangan}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1 flex-shrink-0">
                                                                            <button
                                                                                onClick={() => {
                                                                                    subKelasForm.reset();
                                                                                    subKelasForm.setData("nama_kelas", sub.nama_kelas);
                                                                                    setEditSubKelasModal({ open: true, subKelas: sub });
                                                                                }}
                                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                                title="Edit Sub-Kelas"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    setDeleteSubKelasModal({ open: true, subKelas: sub })
                                                                                }
                                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                                title="Hapus Sub-Kelas"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* ── Add sub-kelas hint (jika belum ada) ── */}
                                                    {!hasSubKelas && (
                                                        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
                                                            <button
                                                                onClick={() => {
                                                                    subKelasForm.reset();
                                                                    setAddSubKelasModal({ open: true, parentKelas: kelas });
                                                                }}
                                                                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                Pecah kelas ini menjadi sub-kelas
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ Pertemuan Tab ════════════════════════════ */}
                        {activeTab === "pertemuan" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-800">Jadwal & Pertemuan</h3>
                                    <Link
                                        href={route("praktikum.pertemuan.index", praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Kelola Pertemuan
                                    </Link>
                                </div>
                                {pertemuanList.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                        <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Belum ada pertemuan.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {pertemuanList.map((p, index) => (
                                            <div
                                                key={p.id}
                                                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                            #{index + 1}
                                                        </span>
                                                        <span className="font-medium text-gray-800 text-sm">{p.judul}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-3 h-3" />
                                                            {new Date(p.tanggal).toLocaleDateString("id-ID", {
                                                                day: "numeric", month: "short", year: "numeric",
                                                            })}
                                                        </span>
                                                        {p.kelas && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {p.kelas.nama_kelas}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={route("praktikum.absensi.index", p.id)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors"
                                                >
                                                    Absensi
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ Modul Tab ════════════════════════════════ */}
                        {activeTab === "modul" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-800">Modul Praktikum</h3>
                                    <Link
                                        href={route("praktikum.modul.index", praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Kelola Modul
                                    </Link>
                                </div>
                                {modulList.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Belum ada modul diupload.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {modulList.map((modul) => (
                                            <div
                                                key={modul.id}
                                                className="border border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                                            >
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 text-sm truncate">{modul.judul}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                        <span>{modul.pertemuan?.judul}</span>
                                                        {modul.pertemuan?.kelas && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{modul.pertemuan.kelas.nama_kelas}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/storage/${modul.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors flex-shrink-0"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ Tugas Tab ════════════════════════════════ */}
                        {activeTab === "tugas" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-800">Tugas Praktikum</h3>
                                    <Link
                                        href={route("praktikum.tugas.index", praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Kelola Tugas
                                    </Link>
                                </div>
                                {!tugasList || tugasList.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                                        <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Belum ada tugas diberikan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {tugasList.map((tugas) => (
                                            <div
                                                key={tugas.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="font-medium text-gray-800 text-sm">{tugas.judul_tugas || tugas.judul}</span>
                                                            {tugas.kelas && (
                                                                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                                                                    {tugas.kelas.nama_kelas}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="w-3 h-3" />
                                                                Deadline: {new Date(tugas.deadline).toLocaleString("id-ID")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href={route("praktikum.tugas.submissions", tugas.id)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors flex-shrink-0"
                                                    >
                                                        Pengumpulan
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ Peserta Tab ══════════════════════════════ */}
                        {activeTab === "peserta" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-800">Daftar Peserta</h3>
                                    <Link
                                        href={route("praktikum.praktikan.index", praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Kelola Peserta
                                    </Link>
                                </div>

                                {/* Ringkasan per kelas */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {parentKelasList.map((kelas) => {
                                        const subKelas   = getSubKelasList(kelas.id);
                                        const hasSubKelas = subKelas.length > 0;
                                        const totalInParent = getPraktikanCount(kelas.id);
                                        const totalInSubs   = subKelas.reduce((s, sub) => s + getPraktikanCount(sub.id), 0);
                                        return (
                                            <div key={kelas.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-gray-800">{kelas.nama_kelas}</span>
                                                        {hasSubKelas && (
                                                            <span className="flex items-center gap-0.5 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                                                <GitBranch className="w-2.5 h-2.5" />
                                                                {subKelas.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {hasSubKelas ? totalInSubs : totalInParent} peserta
                                                    </span>
                                                </div>
                                                {hasSubKelas ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {subKelas.map((sub) => (
                                                            <div key={sub.id} className="px-4 py-2 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                                                    {sub.nama_kelas}
                                                                </div>
                                                                <span className="text-xs text-gray-500 font-medium">
                                                                    {getPraktikanCount(sub.id)} peserta
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {totalInParent > 0 && (
                                                            <div className="px-4 py-2 bg-amber-50 flex items-center justify-between">
                                                                <span className="text-xs text-amber-700 flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    Belum terdistribusi
                                                                </span>
                                                                <span className="text-xs font-bold text-amber-700">{totalInParent}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-2 text-xs text-gray-400 italic">Kelas langsung</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ══ Sertifikat Tab ═══════════════════════════ */}
                        {activeTab === "sertifikat" && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-semibold text-gray-800">Manajemen Sertifikat</h3>
                                    <Link
                                        href={route("praktikum.sertifikat.index", praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                    >
                                        Kelola Sertifikat
                                    </Link>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Pengaturan template dan generate sertifikat untuk asisten dan praktikan.
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                 MODAL: Tambah Sub-Kelas (Pecah Kelas)
            ════════════════════════════════════════════════════════ */}
            <Modal
                show={addSubKelasModal.open}
                onClose={() => setAddSubKelasModal({ open: false, parentKelas: null })}
                maxWidth="md"
            >
                <div className="p-0">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Scissors className="w-4 h-4 text-blue-600" />
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Pecah Kelas: <span className="text-blue-600">{addSubKelasModal.parentKelas?.nama_kelas}</span>
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Sub-kelas punya jadwal & pengelolaan mandiri, tapi tetap di bawah{" "}
                                    <strong>{addSubKelasModal.parentKelas?.nama_kelas}</strong> untuk penilaian akhir.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleAddSubKelas} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Sub-Kelas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subKelasForm.data.nama_kelas}
                                    onChange={(e) => subKelasForm.setData("nama_kelas", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: A1, Kelompok 1, Shift Pagi..."
                                    required
                                />
                                {subKelasForm.errors.nama_kelas && (
                                    <p className="text-red-500 text-xs mt-1">{subKelasForm.errors.nama_kelas}</p>
                                )}
                            </div>

                            {/* Jadwal (opsional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari Praktikum <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <select
                                    value={subKelasForm.data.hari}
                                    onChange={(e) => subKelasForm.setData("hari", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Belum ditentukan --</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            {subKelasForm.data.hari && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                                            <input
                                                type="time"
                                                value={subKelasForm.data.jam_mulai}
                                                onChange={(e) => subKelasForm.setData("jam_mulai", e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                                            <input
                                                type="time"
                                                value={subKelasForm.data.jam_selesai}
                                                onChange={(e) => subKelasForm.setData("jam_selesai", e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                                        <input
                                            type="text"
                                            value={subKelasForm.data.ruangan}
                                            onChange={(e) => subKelasForm.setData("ruangan", e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Contoh: Lab 1, R.201..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setAddSubKelasModal({ open: false, parentKelas: null })}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={subKelasForm.processing}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {subKelasForm.processing ? "Menyimpan..." : "Buat Sub-Kelas"}
                                </button>
                            </div>
                        </form>
                </div>
            </Modal>

            {/* MODAL: Edit Sub-Kelas */}
            <Modal
                show={editSubKelasModal.open}
                onClose={() => setEditSubKelasModal({ open: false, subKelas: null })}
                maxWidth="sm"
            >
                <div className="p-0">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold text-gray-900">Edit Sub-Kelas</h2>
                        </div>
                        <form onSubmit={handleEditSubKelas} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Sub-Kelas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subKelasForm.data.nama_kelas}
                                    onChange={(e) => subKelasForm.setData("nama_kelas", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {subKelasForm.errors.nama_kelas && (
                                    <p className="text-red-500 text-xs mt-1">{subKelasForm.errors.nama_kelas}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditSubKelasModal({ open: false, subKelas: null })}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={subKelasForm.processing}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {subKelasForm.processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                </div>
            </Modal>

            {/* MODAL: Hapus Sub-Kelas */}
            <ConfirmModal
                show={deleteSubKelasModal.open}
                onClose={() => setDeleteSubKelasModal({ open: false, subKelas: null })}
                onConfirm={handleDeleteSubKelas}
                title="Hapus Sub-Kelas"
                message={
                    deleteSubKelasModal.subKelas
                        ? `Yakin ingin menghapus sub-kelas ${deleteSubKelasModal.subKelas.nama_kelas}? Semua data terkait (jadwal, pertemuan, tugas, absensi) akan ikut terhapus.`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}
