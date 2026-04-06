import { Menu, Transition } from "@headlessui/react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Download,
    Edit,
    GitBranch,
    Trash2,
    Users,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import { usePermission } from "../../Components/PermissionContext";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function PertemuanIndex({
    praktikum,
    pertemuan,
    filters = {},
    classContext = null,
}) {
    const { user } = usePage().props;
    const { can, hasRole } = usePermission();
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");
    const isAssignedAslab = () =>
        user?.praktikumAslab?.some((ap) => ap.id === praktikum.id);
    const canManage =
        can("pertemuan.create") || isAdmin || isKadep || isAssignedAslab();

    // ── Hierarchy computation ──────────────────────────────────────────
    const allKelas = praktikum.kelas || [];

    const parentKelasList = allKelas
        .filter((k) => !k.parent_kelas_id)
        .map((parent) => ({
            ...parent,
            subKelas: allKelas.filter(
                (sub) => sub.parent_kelas_id === parent.id,
            ),
            hasSubKelas: allKelas.some(
                (sub) => sub.parent_kelas_id === parent.id,
            ),
        }));

    // Enrollment kelas = leaf nodes only
    // (subkelas ATAU parent kelas yang tidak punya subkelas)
    const enrollmentKelas = allKelas.filter((k) => {
        if (k.parent_kelas_id) return true;
        return !allKelas.some((sub) => sub.parent_kelas_id === k.id);
    });

    const firstParent = parentKelasList[0];
    const initialSubId = firstParent?.hasSubKelas
        ? firstParent.subKelas[0]?.id || null
        : null;

    const contextKelasId = classContext?.id || filters.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId;
    const initKelas = allKelas.find((k) => k.id === initKelasId);
    const initParentId = initKelas
        ? initKelas.parent_kelas_id || initKelas.id
        : firstParent?.id || null;
    const initSubFromFilter = initKelas?.parent_kelas_id ? initKelas.id : null;

    // ── State ──────────────────────────────────────────────────────────
    const [activeParentId, setActiveParentId] = useState(initParentId);
    const [activeSubId, setActiveSubId] = useState(
        initSubFromFilter ?? initialSubId,
    );
    const [showForm, setShowForm] = useState(false);
    const [editingPertemuan, setEditingPertemuan] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    // ── Derived values ─────────────────────────────────────────────────
    const activeParent = parentKelasList.find((p) => p.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];
    const activeKelasId = activeSubId || activeParentId;

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        judul: "",
        deskripsi: "",
        tanggal: "",
        kelas_id: "",
    });

    // ── Filtered pertemuan by scope:
    // sub-kelas => [sub-kelas + parent], parent => [parent + seluruh turunan]
    const resolveScopeKelasIds = (kelasId) => {
        if (!kelasId || kelasId === "all") return [];
        const selected = allKelas.find((k) => k.id === kelasId);
        if (!selected) return [kelasId];

        if (selected.parent_kelas_id) {
            return [selected.id, selected.parent_kelas_id];
        }

        const scopeIds = [selected.id];
        const queue = [selected.id];
        while (queue.length > 0) {
            const current = queue.shift();
            const children = allKelas
                .filter((k) => k.parent_kelas_id === current)
                .map((k) => k.id)
                .filter((id) => !scopeIds.includes(id));
            scopeIds.push(...children);
            queue.push(...children);
        }
        return scopeIds;
    };

    const kelasScopeIds = resolveScopeKelasIds(activeKelasId);
    const filteredPertemuan =
        activeKelasId === "all"
            ? pertemuan
            : pertemuan.filter((p) => kelasScopeIds.includes(p.kelas_id));

    useEffect(() => {
        if (!contextKelasId) return;
        const contextKelas = allKelas.find((k) => k.id === contextKelasId);
        if (!contextKelas) return;

        if (contextKelas.parent_kelas_id) {
            setActiveParentId(contextKelas.parent_kelas_id);
            setActiveSubId(contextKelas.id);
            return;
        }

        setActiveParentId(contextKelas.id);
        setActiveSubId(null);
    }, [contextKelasId, allKelas]);

    // ── Tab handlers ───────────────────────────────────────────────────
    const handleParentTab = (parent) => {
        setActiveParentId(parent.id);
        if (parent.hasSubKelas) {
            setActiveSubId(parent.subKelas[0]?.id || null);
        } else {
            setActiveSubId(null);
        }
        setShowForm(false);
    };

    // ── Form handlers ──────────────────────────────────────────────────
    const handleEdit = (p) => {
        setEditingPertemuan(p);
        setData({
            judul: p.judul,
            deskripsi: p.deskripsi || "",
            tanggal: p.tanggal ? p.tanggal.split("T")[0] : "",
            kelas_id: p.kelas_id || "",
        });
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingPertemuan(null);
        reset();
        setData({
            judul: "",
            deskripsi: "",
            tanggal: "",
            kelas_id: contextKelasId || activeKelasId || "",
        });
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (contextKelasId && data.kelas_id !== contextKelasId) {
            setData("kelas_id", contextKelasId);
        }
        if (editingPertemuan) {
            put(route("praktikum.pertemuan.update", editingPertemuan.id), {
                onSuccess: () => {
                    toast.success("Pertemuan berhasil diperbarui");
                    setShowForm(false);
                    reset();
                },
                onError: () => toast.error("Gagal memperbarui pertemuan"),
            });
        } else {
            post(route("praktikum.pertemuan.store", praktikum.id), {
                onSuccess: () => {
                    toast.success("Pertemuan berhasil ditambahkan");
                    setShowForm(false);
                    reset();
                },
                onError: () => toast.error("Gagal menambahkan pertemuan"),
            });
        }
    };

    const confirmDelete = (p) => {
        setMeetingToDelete(p);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (meetingToDelete) {
            destroy(route("praktikum.pertemuan.destroy", meetingToDelete.id), {
                onSuccess: () => {
                    toast.success("Pertemuan berhasil dihapus");
                    setShowDeleteModal(false);
                    setMeetingToDelete(null);
                },
                onError: () => toast.error("Gagal menghapus pertemuan"),
            });
        }
    };

    // ── Redistribusi pertemuan dari parent ke sub-kelas ───────────────
    const [distribusiModal, setDistribusiModal] = useState({ open: false });
    const [distribusiTargetKelasId, setDistribusiTargetKelasId] = useState("");
    const [distribusiSelected, setDistribusiSelected] = useState([]);
    const [distribusiProcessing, setDistribusiProcessing] = useState(false);

    // Pertemuan yang masih di parent kelas (orphaned)
    const orphanedPertemuan =
        activeParentId && showSubTabs
            ? pertemuan.filter((p) => p.kelas_id === activeParentId)
            : [];

    const openDistribusiPertemuan = () => {
        setDistribusiTargetKelasId(currentSubKelas[0]?.id || "");
        setDistribusiSelected(orphanedPertemuan.map((p) => p.id));
        setDistribusiModal({ open: true });
    };
    const closeDistribusiModal = () => setDistribusiModal({ open: false });

    const toggleDistribusiItem = (id) => {
        setDistribusiSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleDistribusiPertemuan = (e) => {
        e.preventDefault();
        if (!distribusiTargetKelasId || distribusiSelected.length === 0) return;
        setDistribusiProcessing(true);
        router.post(
            route("kelas.pindah-pertemuan", { kelas: activeParentId }),
            {
                pertemuan_ids: distribusiSelected,
                target_kelas_id: distribusiTargetKelasId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Pertemuan berhasil dipindahkan");
                    setDistribusiModal({ open: false });
                    setDistribusiProcessing(false);
                },
                onError: () => {
                    toast.error("Gagal memindahkan pertemuan");
                    setDistribusiProcessing(false);
                },
            },
        );
    };

    // ── Helpers ────────────────────────────────────────────────────────
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem.parent_kelas_id) return kelasItem.nama_kelas;
        const parent = parentKelasList.find(
            (p) => p.id === kelasItem.parent_kelas_id,
        );
        return parent
            ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}`
            : kelasItem.nama_kelas;
    };

    const activeSubName = showSubTabs
        ? currentSubKelas.find((s) => s.id === activeSubId)?.nama_kelas
        : null;

    const classContextLabel = classContext?.nama_kelas || null;
    const pageTitle = classContextLabel
        ? `Kelola Pertemuan Kelas ${classContextLabel}`
        : "Kelola Pertemuan";

    return (
        <DashboardLayout>
            <Head title={`${pageTitle} - ${praktikum.mata_kuliah}`} />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* ── Header ─────────────────────────────────────────── */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1.5">
                            <Link
                                href={route("praktikum.show", {
                                    praktikum: praktikum.id,
                                })}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {classContext
                                    ? classContext.nama_kelas
                                    : "Praktikum"}
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-gray-600">Pertemuan</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {pageTitle}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Kelola jadwal pertemuan dan absensi per kelas.
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Link
                            href={route("praktikum.show", {
                                praktikum: praktikum.id,
                            })}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Kembali
                        </Link>

                        {/* Export Dropdown */}
                        <Menu
                            as="div"
                            className="relative inline-block text-left"
                        >
                            <Menu.Button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                <span>Export Absensi</span>
                                <ChevronDown className="w-4 h-4" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <a
                                                    href={
                                                        activeKelasId
                                                            ? route(
                                                                  "praktikum.absensi.export-praktikan",
                                                                  {
                                                                      praktikum:
                                                                          praktikum.id,
                                                                      kelasId:
                                                                          activeKelasId,
                                                                  },
                                                              )
                                                            : "#"
                                                    }
                                                    className={`${active ? "bg-blue-600 text-white" : "text-gray-900"} group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2 ${!activeKelasId ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Absensi Praktikan
                                                </a>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <a
                                                    href={
                                                        activeKelasId
                                                            ? route(
                                                                  "praktikum.absensi.export-aslab",
                                                                  {
                                                                      praktikum:
                                                                          praktikum.id,
                                                                      kelasId:
                                                                          activeKelasId,
                                                                  },
                                                              )
                                                            : "#"
                                                    }
                                                    className={`${active ? "bg-blue-600 text-white" : "text-gray-900"} group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2 ${!activeKelasId ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Absensi Aslab
                                                </a>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>

                        {canManage && (
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                            >
                                + Buat Pertemuan
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Level 1: Parent Kelas Tabs ──────────────────────── */}
                {!hasClassContext && (
                    <div className="px-6 border-b border-gray-100 flex overflow-x-auto">
                        {parentKelasList.map((parent) => (
                            <button
                                key={parent.id}
                                onClick={() => handleParentTab(parent)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    activeParentId === parent.id
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                {parent.nama_kelas}
                                {parent.hasSubKelas && (
                                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                                        <GitBranch className="w-2.5 h-2.5" />
                                        {parent.subKelas.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Level 2: Sub-kelas Tabs (conditional) ──────────── */}
                {!hasClassContext && showSubTabs && (
                    <div className="flex items-center gap-1.5 px-6 py-2.5 bg-gray-50 border-b border-gray-100 overflow-x-auto">
                        <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1 mr-1">
                            <GitBranch className="w-3 h-3" />
                            Sub-kelas:
                        </span>
                        {currentSubKelas.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubId(sub.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                    activeSubId === sub.id
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                                }`}
                            >
                                {sub.nama_kelas}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Info banner ketika parent punya subkelas ────────── */}
                {!hasClassContext && showSubTabs && (
                    <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            Kelas <strong>{activeParent?.nama_kelas}</strong>{" "}
                            sudah dipecah menjadi sub-kelas. Pertemuan dikelola
                            per sub-kelas.
                            {activeSubName && (
                                <span className="ml-1">
                                    Sedang melihat:{" "}
                                    <strong>{activeSubName}</strong>.
                                </span>
                            )}
                        </span>
                    </div>
                )}

                {/* ── Orphaned pertemuan panel ───────────────────────── */}
                {!hasClassContext &&
                    showSubTabs &&
                    orphanedPertemuan.length > 0 && (
                        <div className="px-6 py-3 bg-orange-50 border-b border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-orange-800">
                                <svg
                                    className="w-4 h-4 text-orange-500 shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>
                                    <strong>
                                        {orphanedPertemuan.length} pertemuan
                                    </strong>{" "}
                                    masih di kelas induk{" "}
                                    <strong>{activeParent?.nama_kelas}</strong>.
                                    Pindahkan ke sub-kelas agar terstruktur.
                                </span>
                            </div>
                            <button
                                onClick={openDistribusiPertemuan}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
                            >
                                <GitBranch className="w-3.5 h-3.5" />
                                Pindahkan ke Sub-Kelas
                            </button>
                        </div>
                    )}

                {/* ── List Pertemuan ──────────────────────────────────── */}
                <div className="p-6 bg-gray-50/50 min-h-[400px]">
                    {filteredPertemuan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-700">
                                Belum ada pertemuan
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-sm">
                                {showSubTabs
                                    ? `Belum ada pertemuan untuk sub-kelas ${activeSubName || ""}.`
                                    : `Belum ada pertemuan untuk kelas ${activeParent?.nama_kelas || ""}.`}
                            </p>
                            <button
                                onClick={handleCreate}
                                className="mt-4 text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline"
                            >
                                + Buat Pertemuan Baru
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredPertemuan.map((p, index) => (
                                <div
                                    key={p.id}
                                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                                                    Pertemuan {index + 1}
                                                </span>
                                                {p.kelas && (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                        <Users className="w-3 h-3" />
                                                        {p.kelas.nama_kelas}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(
                                                        p.tanggal,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            weekday: "long",
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </span>
                                                {(!p.absensi_praktikan ||
                                                    p.absensi_praktikan
                                                        .length === 0) && (
                                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                                                        <ClipboardList className="w-3 h-3" />
                                                        Absen Praktikan Kosong
                                                    </span>
                                                )}
                                                {(!p.absensi_aslab ||
                                                    p.absensi_aslab.length ===
                                                        0) && (
                                                    <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                                                        <ClipboardList className="w-3 h-3" />
                                                        Absen Aslab Kosong
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                                                {p.judul}
                                            </h4>

                                            {p.deskripsi && (
                                                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed border-l-2 border-gray-200 pl-3 line-clamp-2">
                                                    {p.deskripsi}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                            <Link
                                                href={route(
                                                    "praktikum.absensi.index",
                                                    p.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                Absensi
                                            </Link>
                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(p)
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            confirmDelete(p)
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Hapus
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal: Tambah / Edit Pertemuan ─────────────────────── */}
            <Modal show={showForm} onClose={() => setShowForm(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                        {editingPertemuan
                            ? "Edit Pertemuan"
                            : "Tambah Pertemuan Baru"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Judul Pertemuan{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.judul}
                                onChange={(e) =>
                                    setData("judul", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                placeholder="Contoh: Pertemuan 1 – Pengenalan Dasar"
                            />
                            {errors.judul && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.judul}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) =>
                                        setData("tanggal", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.tanggal && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.tanggal}
                                    </p>
                                )}
                            </div>

                            {!hasClassContext && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Untuk Kelas{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.kelas_id}
                                        onChange={(e) =>
                                            setData("kelas_id", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Kelas --
                                        </option>
                                        {enrollmentKelas.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {getKelasLabel(k)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.kelas_id && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.kelas_id}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi{" "}
                                <span className="text-gray-400 font-normal">
                                    (opsional)
                                </span>
                            </label>
                            <textarea
                                value={data.deskripsi}
                                onChange={(e) =>
                                    setData("deskripsi", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                rows="3"
                                placeholder="Jelaskan agenda atau materi pertemuan ini..."
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2 border-t">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-colors"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Pertemuan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Pertemuan"
                message={`Apakah Anda yakin ingin menghapus pertemuan "${meetingToDelete?.judul}"? Data absensi dan modul terkait mungkin akan terhapus.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />

            {/* ══ Modal Distribusi Pertemuan ke Sub-Kelas ════════════════ */}
            <Modal
                show={distribusiModal.open}
                onClose={closeDistribusiModal}
                maxWidth="2xl"
            >
                <div className="p-0">
                    <div className="flex justify-between items-start px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Pindahkan Pertemuan ke Sub-Kelas
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Pilih pertemuan dari{" "}
                                <strong>{activeParent?.nama_kelas}</strong> dan
                                tentukan sub-kelas tujuan.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeDistribusiModal}
                            className="p-1.5 hover:bg-gray-100 rounded-lg ml-4 flex-shrink-0"
                        >
                            <svg
                                className="w-5 h-5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleDistribusiPertemuan}>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Pindahkan ke Sub-Kelas{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={distribusiTargetKelasId}
                                    onChange={(e) =>
                                        setDistribusiTargetKelasId(
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        -- Pilih Sub-Kelas --
                                    </option>
                                    {currentSubKelas.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.nama_kelas}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Pilih Pertemuan (
                                        {distribusiSelected.length} dipilih)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDistribusiSelected(
                                                    orphanedPertemuan.map(
                                                        (p) => p.id,
                                                    ),
                                                )
                                            }
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Pilih Semua
                                        </button>
                                        <span className="text-gray-300 text-xs">
                                            |
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDistribusiSelected([])
                                            }
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Batal Semua
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {orphanedPertemuan.map((p) => {
                                        const isChecked =
                                            distribusiSelected.includes(p.id);
                                        return (
                                            <label
                                                key={p.id}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isChecked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() =>
                                                        toggleDistribusiItem(
                                                            p.id,
                                                        )
                                                    }
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-800 truncate">
                                                        {p.judul}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(
                                                            p.tanggal,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDistribusiModal}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    distribusiProcessing ||
                                    distribusiSelected.length === 0 ||
                                    !distribusiTargetKelasId
                                }
                                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {distribusiProcessing
                                    ? "Memindahkan..."
                                    : `Pindahkan ${distribusiSelected.length} Pertemuan`}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
