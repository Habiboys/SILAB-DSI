import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
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
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
// We will need to adjust PertemuanIndex to be embedded or just use its logic
// Actually better to just import it and maybe pass a prop "isEmbedded" if needed or just use it.
// Wait, PertemuanIndex is a full page component with Layout. We need to strip the layout if we embed it.
// Or we can refactor PertemuanIndex to be a component "PertemuanList" and "PertemuanPage" uses it.
// For now, let's assume we might need to copy logic or refactor.
// Let's check Pertemuan/Index.jsx content again. It uses DashboardLayout.
// We should probably create a new component or refactor.
// Strategy: I will create the dashboard structure first, and for the tabs, I will ideally use proper components.
// I'll create the tabs content inline first or import if available.

// Since I cannot easily verify refactoring without reading again, I will implementing the Tabs structure first.

export default function PraktikumShow({
    praktikum,
    pertemuanList,
    modulList,
    tugasList,
}) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState("overview");

    // ─── Sub-kelas state ───────────────────────────────────────────
    const [addSubKelasModal, setAddSubKelasModal] = useState({
        open: false,
        parentKelas: null,
    });
    const [editSubKelasModal, setEditSubKelasModal] = useState({
        open: false,
        subKelas: null,
    });
    const [deleteSubKelasModal, setDeleteSubKelasModal] = useState({
        open: false,
        subKelas: null,
    });

    // Flat kelas list → computed hierarchy (parent / sub)
    const allKelas = praktikum.kelas || [];
    const parentKelasList = allKelas.filter((k) => !k.parent_kelas_id);
    const getSubKelasList = (parentId) =>
        allKelas.filter((k) => k.parent_kelas_id === parentId);

    // Form tunggal untuk tambah / edit sub-kelas
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
                },
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
                },
            },
        );
    };

    const handleDeleteSubKelas = () => {
        router.delete(
            route("praktikum.kelas.sub-kelas.destroy", {
                subKelas: deleteSubKelasModal.subKelas.id,
            }),
            {
                onSuccess: () =>
                    setDeleteSubKelasModal({ open: false, subKelas: null }),
            },
        );
    };

    const tabs = [
        {
            id: "overview",
            label: "Overview",
            icon: <Building2 className="w-4 h-4" />,
        },
        {
            id: "pertemuan",
            label: "Jadwal & Pertemuan",
            icon: <CalendarDays className="w-4 h-4" />,
        },
        {
            id: "modul",
            label: "Modul Praktikum",
            icon: <BookOpen className="w-4 h-4" />,
        },
        {
            id: "tugas",
            label: "Tugas",
            icon: <ClipboardList className="w-4 h-4" />,
        },
        {
            id: "peserta",
            label: "Peserta",
            icon: <Users className="w-4 h-4" />,
        },
        {
            id: "sertifikat",
            label: "Sertifikat",
            icon: <Award className="w-4 h-4" />,
        },
    ];

    return (
        <DashboardLayout>
            <Head title={`Dashboard - ${praktikum.mata_kuliah}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link
                                    href={
                                        route("praktikum.index", {}, false) +
                                        (praktikum.kepengurusan_lab_id
                                            ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}`
                                            : "")
                                    }
                                    className="text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {praktikum.mata_kuliah}
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-7">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>
                                        {
                                            praktikum.kepengurusan_lab
                                                ?.laboratorium?.nama
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {
                                            praktikum.kepengurusan_lab
                                                ?.tahun_kepengurusan?.tahun
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status/Stats Cards could go here */}
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                {parentKelasList.length || 0} Kelas
                            </div>
                            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                                {pertemuanList?.length || 0} Pertemuan
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex overflow-x-auto border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Daftar Kelas
                                    </h3>
                                    {parentKelasList.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-8">
                                            Belum ada kelas.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {parentKelasList.map((kelas) => {
                                                const subKelas =
                                                    getSubKelasList(kelas.id);
                                                const jadwalParent =
                                                    praktikum.jadwal_praktikum?.filter(
                                                        (j) =>
                                                            j.kelas_id ===
                                                            kelas.id,
                                                    ) || [];
                                                return (
                                                    <div
                                                        key={kelas.id}
                                                        className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                                                    >
                                                        {/* Header kelas asli */}
                                                        <div className="p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="font-bold text-gray-900">
                                                                        {
                                                                            kelas.nama_kelas
                                                                        }
                                                                    </h4>
                                                                    {subKelas.length >
                                                                        0 && (
                                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                                            <GitBranch className="w-3 h-3" />
                                                                            {
                                                                                subKelas.length
                                                                            }{" "}
                                                                            sub-kelas
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                    <span
                                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                                            kelas.status ===
                                                                            "aktif"
                                                                                ? "bg-green-100 text-green-700"
                                                                                : "bg-gray-100 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            kelas.status
                                                                        }
                                                                    </span>
                                                                    <button
                                                                        onClick={() => {
                                                                            subKelasForm.reset();
                                                                            setAddSubKelasModal(
                                                                                {
                                                                                    open: true,
                                                                                    parentKelas:
                                                                                        kelas,
                                                                                },
                                                                            );
                                                                        }}
                                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Tambah Sub-Kelas"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {jadwalParent.length >
                                                                0 && (
                                                                <div className="space-y-1 mt-2">
                                                                    {jadwalParent.map(
                                                                        (
                                                                            jadwal,
                                                                            idx,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center text-sm text-gray-600 gap-2"
                                                                            >
                                                                                <Clock className="w-3.5 h-3.5" />
                                                                                <span>
                                                                                    {
                                                                                        jadwal.hari
                                                                                    }
                                                                                    ,{" "}
                                                                                    {
                                                                                        jadwal.jam_mulai
                                                                                    }{" "}
                                                                                    -{" "}
                                                                                    {
                                                                                        jadwal.jam_selesai
                                                                                    }
                                                                                </span>
                                                                                <span className="text-gray-300">
                                                                                    |
                                                                                </span>
                                                                                <MapPin className="w-3.5 h-3.5" />
                                                                                <span>
                                                                                    {
                                                                                        jadwal.ruangan
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Sub-kelas list */}
                                                        {subKelas.length >
                                                            0 && (
                                                            <div className="border-t bg-gray-50 divide-y divide-gray-100">
                                                                {subKelas.map(
                                                                    (sub) => {
                                                                        const jadwalSub =
                                                                            praktikum.jadwal_praktikum?.filter(
                                                                                (
                                                                                    j,
                                                                                ) =>
                                                                                    j.kelas_id ===
                                                                                    sub.id,
                                                                            ) ||
                                                                            [];
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    sub.id
                                                                                }
                                                                                className="px-4 py-3 flex items-start justify-between gap-2"
                                                                            >
                                                                                <div className="flex items-start gap-2 min-w-0">
                                                                                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                                    <div className="min-w-0">
                                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                                            <span className="font-medium text-gray-800 text-sm">
                                                                                                {
                                                                                                    sub.nama_kelas
                                                                                                }
                                                                                            </span>
                                                                                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                                                                sub-kelas
                                                                                            </span>
                                                                                        </div>
                                                                                        {jadwalSub.length >
                                                                                            0 && (
                                                                                            <div className="mt-1 space-y-0.5">
                                                                                                {jadwalSub.map(
                                                                                                    (
                                                                                                        j,
                                                                                                        idx,
                                                                                                    ) => (
                                                                                                        <div
                                                                                                            key={
                                                                                                                idx
                                                                                                            }
                                                                                                            className="flex items-center text-xs text-gray-500 gap-1.5"
                                                                                                        >
                                                                                                            <Clock className="w-3 h-3" />
                                                                                                            <span>
                                                                                                                {
                                                                                                                    j.hari
                                                                                                                }
                                                                                                                ,{" "}
                                                                                                                {
                                                                                                                    j.jam_mulai
                                                                                                                }{" "}
                                                                                                                -{" "}
                                                                                                                {
                                                                                                                    j.jam_selesai
                                                                                                                }
                                                                                                            </span>
                                                                                                            <span className="text-gray-300">
                                                                                                                |
                                                                                                            </span>
                                                                                                            <MapPin className="w-3 h-3" />
                                                                                                            <span>
                                                                                                                {
                                                                                                                    j.ruangan
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    ),
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex gap-1 flex-shrink-0">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            subKelasForm.reset();
                                                                                            subKelasForm.setData(
                                                                                                "nama_kelas",
                                                                                                sub.nama_kelas,
                                                                                            );
                                                                                            setEditSubKelasModal(
                                                                                                {
                                                                                                    open: true,
                                                                                                    subKelas:
                                                                                                        sub,
                                                                                                },
                                                                                            );
                                                                                        }}
                                                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                                        title="Edit Sub-Kelas"
                                                                                    >
                                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            setDeleteSubKelasModal(
                                                                                                {
                                                                                                    open: true,
                                                                                                    subKelas:
                                                                                                        sub,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                                        title="Hapus Sub-Kelas"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Hint: belum ada sub-kelas */}
                                                        {subKelas.length ===
                                                            0 && (
                                                            <div className="border-t px-4 py-2 bg-gray-50">
                                                                <button
                                                                    onClick={() => {
                                                                        subKelasForm.reset();
                                                                        setAddSubKelasModal(
                                                                            {
                                                                                open: true,
                                                                                parentKelas:
                                                                                    kelas,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" />{" "}
                                                                    Pecah kelas
                                                                    jadi
                                                                    sub-kelas
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "pertemuan" && (
                            <div>
                                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                                    <p className="font-medium">
                                        Manajemen Pertemuan & Absensi
                                    </p>
                                    <p>
                                        Silahkan klik tombol di bawah untuk
                                        mengelola pertemuan secara detail.
                                    </p>
                                </div>
                                <Link
                                    href={route(
                                        "praktikum.pertemuan.index",
                                        praktikum.id,
                                    )}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Kelola Pertemuan & Absensi
                                    {/* Note: Ideally we embed the PertemuanIndex logic here.
                                        Since PertemuanIndex is a full page, for now I link to specific pages or
                                        we need to refactor PertemuanIndex to be a component.

                                        For this MVP step, I will suggest to the user that I've created the dashboard
                                        but full embedding requires refactoring PertemuanIndex.

                                        ACTUALLY, I can iterate and just link them for now OR
                                        Better: I will redirect `activeTab` specific actions to the existing pages temporarily until refactor.
                                    */}
                                </Link>

                                <div className="mt-6">
                                    {/* Simple List View of Meetings */}
                                    <div className="grid gap-4">
                                        {pertemuanList.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className="border rounded-lg p-4 flex justify-between items-center bg-white"
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {p.judul}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {new Date(
                                                            p.tanggal,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                dateStyle:
                                                                    "full",
                                                            },
                                                        )}
                                                        {p.kelas && (
                                                            <span className="ml-2">
                                                                •{" "}
                                                                {
                                                                    p.kelas
                                                                        .nama_kelas
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={route(
                                                        "praktikum.absensi.index",
                                                        p.id,
                                                    )}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-sm font-medium"
                                                >
                                                    Absensi
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "modul" && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Daftar Modul
                                    </h3>
                                    <Link
                                        href={route(
                                            "praktikum.modul.index",
                                            praktikum.id,
                                        )}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Modul
                                    </Link>
                                </div>

                                {/* Module List */}
                                <div className="space-y-4">
                                    {modulList.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">
                                                Belum ada modul yang diupload.
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Silahkan klik "Kelola Modul"
                                                untuk menambahkan.
                                            </p>
                                        </div>
                                    ) : (
                                        modulList.map((modul) => (
                                            <div
                                                key={modul.id}
                                                className="border rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {modul.judul}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <span>
                                                                {
                                                                    modul
                                                                        .pertemuan
                                                                        ?.judul
                                                                }
                                                            </span>
                                                            {modul.pertemuan
                                                                ?.kelas && (
                                                                <>
                                                                    <span>
                                                                        •
                                                                    </span>
                                                                    <span>
                                                                        {
                                                                            modul
                                                                                .pertemuan
                                                                                .kelas
                                                                                .nama_kelas
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/storage/${modul.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 border rounded text-gray-600 hover:bg-gray-100 text-sm font-medium"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "tugas" && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Daftar Tugas
                                    </h3>
                                    <Link
                                        href={route(
                                            "praktikum.tugas.index",
                                            praktikum.id,
                                        )}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Semua Tugas
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    {tugasList && tugasList.length > 0 ? (
                                        tugasList.map((tugas) => (
                                            <div
                                                key={tugas.id}
                                                className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-gray-900">
                                                                {tugas.judul}
                                                            </h4>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs rounded-full ${
                                                                    tugas.jenis ===
                                                                    "individu"
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-purple-100 text-purple-700"
                                                                }`}
                                                            >
                                                                {tugas.jenis}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                            {tugas.deskripsi}
                                                        </p>

                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <CalendarDays className="w-3.5 h-3.5" />
                                                                <span>
                                                                    Deadline:{" "}
                                                                    {new Date(
                                                                        tugas.deadline,
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span>
                                                                    Pertemuan:{" "}
                                                                    {
                                                                        tugas
                                                                            .pertemuan
                                                                            ?.judul
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route(
                                                                "praktikum.tugas.submissions",
                                                                tugas.id,
                                                            )}
                                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-sm font-medium"
                                                        >
                                                            Lihat Pengumpulan
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">
                                            Belum ada tugas yang diberikan.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "peserta" && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Daftar Peserta
                                    </h3>
                                    <Link
                                        href={route(
                                            "praktikum.praktikan.index",
                                            praktikum.id,
                                        )}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Peserta
                                    </Link>
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Silahkan klik tombol "Kelola Peserta" untuk
                                    manajemen data praktikan secara lengkap.
                                </p>
                            </div>
                        )}

                        {activeTab === "sertifikat" && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Manajemen Sertifikat
                                    </h3>
                                    <Link
                                        href={route(
                                            "praktikum.sertifikat.index",
                                            praktikum.id,
                                        )}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Sertifikat
                                    </Link>
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Pengaturan template dan generate sertifikat
                                    untuk asisten dan praktikan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ═══════════════════════════════════════════════════════
                 MODAL: Tambah Sub-Kelas
            ═══════════════════════════════════════════════════════ */}
            {addSubKelasModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Pecah Kelas:{" "}
                                <span className="text-blue-600">
                                    {addSubKelasModal.parentKelas?.nama_kelas}
                                </span>
                            </h2>
                            <button
                                onClick={() =>
                                    setAddSubKelasModal({
                                        open: false,
                                        parentKelas: null,
                                    })
                                }
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Sub-kelas punya jadwal &amp; tugas sendiri, tapi
                            secara akademis tetap di bawah kelas{" "}
                            <strong>
                                {addSubKelasModal.parentKelas?.nama_kelas}
                            </strong>{" "}
                            untuk penilaian akhir.
                        </p>
                        <form
                            onSubmit={handleAddSubKelas}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Sub-Kelas{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subKelasForm.data.nama_kelas}
                                    onChange={(e) =>
                                        subKelasForm.setData(
                                            "nama_kelas",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: A1, A2, B1..."
                                    required
                                />
                                {subKelasForm.errors.nama_kelas && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {subKelasForm.errors.nama_kelas}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari (Opsional)
                                </label>
                                <select
                                    value={subKelasForm.data.hari}
                                    onChange={(e) =>
                                        subKelasForm.setData(
                                            "hari",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Pilih Hari --</option>
                                    {[
                                        "Senin",
                                        "Selasa",
                                        "Rabu",
                                        "Kamis",
                                        "Jumat",
                                        "Sabtu",
                                    ].map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {subKelasForm.data.hari && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Mulai
                                        </label>
                                        <input
                                            type="time"
                                            value={subKelasForm.data.jam_mulai}
                                            onChange={(e) =>
                                                subKelasForm.setData(
                                                    "jam_mulai",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Selesai
                                        </label>
                                        <input
                                            type="time"
                                            value={
                                                subKelasForm.data.jam_selesai
                                            }
                                            onChange={(e) =>
                                                subKelasForm.setData(
                                                    "jam_selesai",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                            {subKelasForm.data.hari && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ruangan
                                    </label>
                                    <input
                                        type="text"
                                        value={subKelasForm.data.ruangan}
                                        onChange={(e) =>
                                            subKelasForm.setData(
                                                "ruangan",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contoh: Lab 1, R.201..."
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setAddSubKelasModal({
                                            open: false,
                                            parentKelas: null,
                                        })
                                    }
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={subKelasForm.processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                                >
                                    {subKelasForm.processing
                                        ? "Menyimpan..."
                                        : "Tambah Sub-Kelas"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                 MODAL: Edit Sub-Kelas
            ═══════════════════════════════════════════════════════ */}
            {editSubKelasModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Edit Sub-Kelas
                            </h2>
                            <button
                                onClick={() =>
                                    setEditSubKelasModal({
                                        open: false,
                                        subKelas: null,
                                    })
                                }
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form
                            onSubmit={handleEditSubKelas}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Sub-Kelas{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subKelasForm.data.nama_kelas}
                                    onChange={(e) =>
                                        subKelasForm.setData(
                                            "nama_kelas",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {subKelasForm.errors.nama_kelas && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {subKelasForm.errors.nama_kelas}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditSubKelasModal({
                                            open: false,
                                            subKelas: null,
                                        })
                                    }
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={subKelasForm.processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                                >
                                    {subKelasForm.processing
                                        ? "Menyimpan..."
                                        : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                 MODAL: Hapus Sub-Kelas
            ═══════════════════════════════════════════════════════ */}
            {deleteSubKelasModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Hapus Sub-Kelas
                            </h2>
                            <button
                                onClick={() =>
                                    setDeleteSubKelasModal({
                                        open: false,
                                        subKelas: null,
                                    })
                                }
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Yakin ingin menghapus sub-kelas{" "}
                            <strong className="text-gray-900">
                                {deleteSubKelasModal.subKelas?.nama_kelas}
                            </strong>
                            ? Semua data terkait (jadwal, pertemuan, tugas,
                            absensi) akan ikut terhapus.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteSubKelasModal({
                                        open: false,
                                        subKelas: null,
                                    })
                                }
                                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSubKelas}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
