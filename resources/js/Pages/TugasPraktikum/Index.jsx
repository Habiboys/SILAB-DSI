import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { GitBranch, Eye, Edit, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import { usePermission } from "../../Components/PermissionContext";
import DashboardLayout from "../../Layouts/DashboardLayout";

const Pagination = ({ links }) => {
    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                {links.prev && (
                    <Link
                        href={links.prev}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Previous
                    </Link>
                )}
                {links.next && (
                    <Link
                        href={links.next}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Next
                    </Link>
                )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    
                </div>
                <div>
                    <nav
                        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                    >
                        {links.map((link, i) => {
                            let className =
                                "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0";
                            if (link.active) {
                                className =
                                    "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
                            }
                            if (!link.url) {
                                className =
                                    "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 focus:outline-offset-0";
                            }

                            return (
                                <Link
                                    key={i}
                                    href={link.url || "#"}
                                    className={className}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    preserveState
                                    preserveScroll
                                />
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
};

const TugasPraktikumIndex = ({
    praktikum,
    tugas, 
    pertemuanList, 
    kelas,
    lab,
    filters, 
    classContext = null,
}) => {
    const { auth } = usePage().props;
    const { can, user, hasRole } = usePermission();

    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");

    
    const isAssignedAslab = () => {
        return user?.praktikumAslab?.some((ap) => ap.id === praktikum.id);
    };

    
    const canCreate =
        can("tugas.create") || isAdmin || isKadep || isAssignedAslab();
    const canUpdate =
        can("tugas.update") || isAdmin || isKadep || isAssignedAslab();
    const canDelete =
        can("tugas.delete") || isAdmin || isKadep || isAssignedAslab();
    const canExport =
        can("tugas.grade") || isAdmin || isKadep || isAssignedAslab();
    const canViewSubmissions =
        can("tugas.grade") ||
        can("tugas.view") ||
        isAdmin ||
        isKadep ||
        isAssignedAslab();

    const canManage = canCreate;

    
    const allKelas = kelas || [];
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
    const enrollmentKelas = allKelas.filter((k) => {
        if (k.parent_kelas_id) return true;
        return !allKelas.some((sub) => sub.parent_kelas_id === k.id);
    });
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem?.parent_kelas_id) return kelasItem?.nama_kelas || "";
        const parent = parentKelasList.find(
            (p) => p.id === kelasItem.parent_kelas_id,
        );
        return parent
            ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}`
            : kelasItem?.nama_kelas || "";
    };

    
    const kelasOptionsForTugas = [
        { id: "", label: "Tugas Umum" },
        ...parentKelasList
            .filter((p) => p.hasSubKelas)
            .map((p) => ({
                id: p.id,
                label: `${p.nama_kelas} (semua subkelas)`,
            })),
        ...(enrollmentKelas || []).map((k) => ({
            id: k.id,
            label: getKelasLabel(k),
        })),
    ];

    
    const contextKelasId =
        classContext?.id || filters?.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId || "all";
    const initKelas = allKelas.find((k) => k.id === initKelasId);
    const initParentId =
        initKelasId === "all" || initKelasId === "umum"
            ? initKelasId
            : initKelas?.parent_kelas_id
              ? initKelas.parent_kelas_id
              : initKelasId;
    const initSubId = initKelas?.parent_kelas_id ? initKelasId : null;

    
    const [search, setSearch] = useState(filters.search || "");
    const [selectedPertemuan, setSelectedPertemuan] = useState(
        filters.pertemuan_id || "",
    );
    const [activeParentId, setActiveParentId] = useState(initParentId);
    const [activeSubId, setActiveSubId] = useState(initSubId);
    const activeKelasId =
        activeParentId === "all" || activeParentId === "umum"
            ? activeParentId
            : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((p) => p.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];

    const resolveScopeKelasIds = (kelasId) => {
        if (!kelasId || kelasId === "all" || kelasId === "umum") return [];
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

    
    const debouncedSearch = useCallback(
        debounce((query) => {
            router.get(
                route(route().current(), [praktikum.id]),
                {
                    search: query,
                    pertemuan_id: selectedPertemuan,
                    kelas_id: activeKelasId,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 500),
        [selectedPertemuan, activeKelasId, praktikum.id],
    );

    useEffect(() => {
        
        
    }, []);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handlePertemuanChange = (e) => {
        const val = e.target.value;
        setSelectedPertemuan(val);
        router.get(
            route(route().current(), [praktikum.id]),
            {
                search,
                pertemuan_id: val,
                kelas_id: activeKelasId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleParentTab = (tabId) => {
        setActiveParentId(tabId);
        if (tabId === "all" || tabId === "umum") {
            setActiveSubId(null);
        } else {
            const parent = parentKelasList.find((p) => p.id === tabId);
            setActiveSubId(
                parent?.hasSubKelas ? parent.subKelas[0]?.id || null : null,
            );
        }
        setSelectedPertemuan("");
        router.get(
            route(route().current(), [praktikum.id]),
            {
                search,
                pertemuan_id: "",
                kelas_id:
                    tabId === "all" || tabId === "umum"
                        ? tabId
                        : parentKelasList.find((p) => p.id === tabId)
                                ?.hasSubKelas
                          ? parentKelasList.find((p) => p.id === tabId)
                                .subKelas[0]?.id
                          : tabId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSubTab = (subId) => {
        setActiveSubId(subId);
        setSelectedPertemuan("");
        router.get(
            route(route().current(), [praktikum.id]),
            { search, pertemuan_id: "", kelas_id: subId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);
    const [selectedTugasForExport, setSelectedTugasForExport] = useState([]);
    const [exportGroupBy, setExportGroupBy] = useState("kelas"); 

    
    const createForm = useForm({
        judul_tugas: "",
        deskripsi: "",
        file_tugas: null,
        deadline: "",
        kelas_id: "",
        pertemuan_id: "", 
    });

    
    const editForm = useForm({
        judul_tugas: "",
        deskripsi: "",
        file_tugas: null,
        deadline: "",
        kelas_id: "",
        pertemuan_id: "", 
        status: "aktif",
        _method: "PUT",
    });

    
    const deleteForm = useForm({});

    
    const formatForDatetimeLocal = (value) => {
        try {
            const d = new Date(value);
            const pad = (n) => String(n).padStart(2, "0");
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hh = pad(d.getHours());
            const mi = pad(d.getMinutes());
            return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
        } catch (e) {
            return "";
        }
    };

    const openCreateModal = () => {
        if (!canManage) return;
        createForm.reset();
        if (contextKelasId) {
            createForm.setData("kelas_id", contextKelasId);
        } else if (
            activeKelasId &&
            activeKelasId !== "all" &&
            activeKelasId !== "umum"
        ) {
            createForm.setData("kelas_id", activeKelasId);
        }
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(false);
    };

    const openEditModal = (tugas) => {
        if (!canManage) return;
        setSelectedTugas(tugas);
        editForm.setData({
            judul_tugas: tugas.judul_tugas,
            deskripsi: tugas.deskripsi || "",
            file_tugas: null,
            deadline: formatForDatetimeLocal(tugas.deadline),
            kelas_id: contextKelasId || tugas.kelas_id || "",
            pertemuan_id: tugas.pertemuan_id || "", 
            status: tugas.status,
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        editForm.reset();
        setSelectedTugas(null);
        setIsEditModalOpen(false);
    };

    
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(
            route("praktikum.tugas.store", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Tugas praktikum berhasil ditambahkan");
                    closeCreateModal();
                },
                onError: (errors) => {
                    console.error(errors);
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menambahkan tugas praktikum");
                },
            },
        );
    };

    
    const handleEdit = (e) => {
        e.preventDefault();
        editForm.post(
            route("praktikum.tugas.update", { tugas: selectedTugas.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Tugas praktikum berhasil diperbarui");
                    closeEditModal();
                },
                onError: (errors) => {
                    console.error(errors);
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memperbarui tugas praktikum");
                },
            },
        );
    };

    
    const handleDelete = (tugas) => {
        setSelectedTugas(tugas);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        deleteForm.delete(
            route("praktikum.tugas.destroy", { tugas: selectedTugas.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Tugas praktikum berhasil dihapus");
                    setIsDeleteModalOpen(false);
                    setSelectedTugas(null);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menghapus tugas praktikum");
                },
            },
        );
    };

    
    const downloadFile = (tugas) => {
        window.open(
            route("praktikum.tugas.download", { tugas: tugas.id }),
            "_blank",
        );
    };

    
    const getClassQueryParams = () => {
        const params = {};
        if (activeKelasId && activeKelasId !== "all") {
            params.kelas_id = activeKelasId;
        }
        if (contextKelasId) {
            params.context_kelas_id = contextKelasId;
        } else if (activeKelasId && activeKelasId !== "all") {
            params.context_kelas_id = activeKelasId;
        }
        return params;
    };

    const viewSubmissions = (tugas) => {
        router.get(route("praktikum.tugas.submissions", { tugas: tugas.id, ...getClassQueryParams() }));
    };

    
    const openExportModal = () => {
        setSelectedTugasForExport([]);
        setIsExportModalOpen(true);
    };

    
    const closeExportModal = () => {
        setIsExportModalOpen(false);
        setSelectedTugasForExport([]);
    };

    
    const handleTugasSelection = (tugasId) => {
        setSelectedTugasForExport((prev) => {
            if (prev.includes(tugasId)) {
                return prev.filter((id) => id !== tugasId);
            } else {
                return [...prev, tugasId];
            }
        });
    };

    
    const handleExport = () => {
        if (selectedTugasForExport.length === 0) {
            alert("Pilih minimal satu tugas untuk diexport");
            return;
        }

        const tugasIds = selectedTugasForExport.join(",");
        const url = route("praktikum.export-grades", {
            praktikum: praktikum.id,
            tugas: tugasIds,
            group_by: exportGroupBy,
        });
        window.open(url, "_blank");
        closeExportModal();
    };

    
    const formatDate = (dateString) => {
        try {
            const dtf = new Intl.DateTimeFormat("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
            });
            return dtf.format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    const classContextLabel = classContext?.nama_kelas || null;
    const getActiveKelasLabel = () => {
        const selected = allKelas.find((k) => k.id === activeKelasId) || classContext;
        if (!selected || activeKelasId === "all") return "Semua kelas";
        if (activeKelasId === "umum") return "Tugas umum";

        if (selected.parent_kelas_id) {
            const parent = parentKelasList.find((p) => p.id === selected.parent_kelas_id);
            return parent ? `${parent.nama_kelas} → ${selected.nama_kelas}` : selected.nama_kelas;
        }

        const hasChildren = allKelas.some((k) => k.parent_kelas_id === selected.id);
        return hasChildren ? `${selected.nama_kelas} (semua subkelas)` : selected.nama_kelas;
    };
    const activeKelasLabel = getActiveKelasLabel();
    const pageTitle = classContextLabel
        ? `Kelola Tugas Praktikum Kelas ${classContextLabel}`
        : "Kelola Tugas Praktikum";

    return (
        <DashboardLayout>
            <Head title={pageTitle} />

            
            <nav className="flex mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1">
                    <li>
                        <Link href={route("praktikum.index")} className="hover:text-indigo-600">Praktikum</Link>
                    </li>
                    <li>
                        <span className="mx-1">/</span>
                    </li>
                    <li>
                        <Link
                            href={route("praktikum.show", { praktikum: praktikum.id })}
                            className="hover:text-indigo-600"
                        >
                            {praktikum?.mata_kuliah || praktikum?.nama || "Detail"}
                        </Link>
                    </li>
                    <li className="text-indigo-600 font-medium">
                        <span className="mx-1">/</span>
                        <span>Tugas</span>
                    </li>
                </ol>
            </nav>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                <div className="p-6 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {pageTitle}
                            </h2>
                            <h3 className="text-md text-gray-600">
                                Mata Kuliah: {praktikum?.mata_kuliah}
                            </h3>
                            <p className="mt-1 text-sm text-indigo-700 font-medium">
                                Kelas aktif: {activeKelasLabel}
                            </p>
                        </div>
                    </div>

                    {(canManage || canExport) && (
                        <div className="flex space-x-3">
                            <button
                                onClick={openExportModal}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center space-x-2"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Export Nilai</span>
                            </button>
                            {canManage && (
                                <button
                                    onClick={openCreateModal}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Tambah Tugas
                                </button>
                            )}
                        </div>
                    )}
                </div>

                
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari tugas..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedPertemuan}
                            onChange={handlePertemuanChange}
                        >
                            <option value="">Semua Pertemuan</option>
                            {pertemuanList.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.judul}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                
                {!hasClassContext && (
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex px-6 overflow-x-auto min-w-max">
                            <button
                                onClick={() => handleParentTab("all")}
                                className={`flex items-center gap-1.5 py-3.5 px-3 mr-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeParentId === "all"
                                        ? "border-indigo-500 text-indigo-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Semua Tugas
                            </button>
                            <button
                                onClick={() => handleParentTab("umum")}
                                className={`flex items-center gap-1.5 py-3.5 px-3 mr-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeParentId === "umum"
                                        ? "border-indigo-500 text-indigo-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Tugas Umum
                            </button>
                            {parentKelasList.map((parent) => (
                                <button
                                    key={parent.id}
                                    onClick={() => handleParentTab(parent.id)}
                                    className={`flex items-center gap-1.5 py-3.5 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                        activeParentId === parent.id
                                            ? "border-indigo-500 text-indigo-600"
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
                        </nav>
                    </div>
                )}

                
                {!hasClassContext &&
                    activeParentId !== "all" &&
                    activeParentId !== "umum" &&
                    showSubTabs && (
                        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
                            <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1 mr-1">
                                <GitBranch className="w-3 h-3" />
                                Sub-kelas {activeParent?.nama_kelas}:
                            </span>
                            {currentSubKelas.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => handleSubTab(sub.id)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                        activeSubId === sub.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                                >
                                    {sub.nama_kelas}
                                </button>
                            ))}
                        </div>
                    )}

                
                {!hasClassContext &&
                    activeParentId !== "all" &&
                    activeParentId !== "umum" &&
                    showSubTabs && (
                        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 shrink-0" />
                            Kelas <strong>
                                {activeParent?.nama_kelas}
                            </strong>{" "}
                            sudah dipecah menjadi sub-kelas. Tugas dikelola per
                            sub-kelas.
                        </div>
                    )}

                
                <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Judul Tugas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Deskripsi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Kelas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Pertemuan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        Status
                                    </th>
                                    {(canManage ||
                                        canExport ||
                                        canViewSubmissions) && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tugas.data.map((tugasItem, index) => (
                                    <tr
                                        key={tugasItem.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {tugas.from + index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium border-r border-gray-200">
                                            {tugasItem.judul_tugas}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200 max-w-xs">
                                            <div className="truncate">
                                                {tugasItem.deskripsi || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {tugasItem.kelas ? (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {getKelasLabel(tugasItem.kelas)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Semua Kelas
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {tugasItem.pertemuan ? (
                                                <span className="text-gray-900 font-medium">
                                                    {tugasItem.pertemuan.judul}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {formatDate(tugasItem.deadline)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {tugasItem.file_tugas ? (
                                                <button className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="Detail"
                                                    onClick={() =>
                                                        downloadFile(tugasItem)
                                                    }
                                                    
                                                >
    <Eye className="w-4 h-4" />
</button>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    tugasItem.status === "aktif"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {tugasItem.status === "aktif"
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                        {(canManage ||
                                            canExport ||
                                            canViewSubmissions) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() =>
                                                            viewSubmissions(
                                                                tugasItem,
                                                            )
                                                        }
                                                        className="text-green-600 hover:text-green-900 transition-colors focus:outline-none"
                                                        title="Lihat Pengumpulan"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    {canManage && (
                                                        <>
                                                            <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        tugasItem,
                                                                    )
                                                                }
                                                                
                                                                title="Edit"
                                                            >
    <Edit className="w-4 h-4" />
</button>
                                                            <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        tugasItem,
                                                                    )
                                                                }
                                                                
                                                                title="Hapus"
                                                            >
    <Trash2 className="w-4 h-4" />
</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {tugas.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                hasClassContext ? "8" : "9"
                                            }
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                        >
                                            Tidak ada data tugas praktikum
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={tugas.links} />
                </div>

                
                <div className="lg:hidden space-y-4 p-4">
                    {tugas.data.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm">
                            Tidak ada data tugas praktikum
                        </div>
                    ) : (
                        tugas.data.map((tugasItem, index) => (
                            <div
                                key={tugasItem.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                                            {tugasItem.judul_tugas}
                                        </h3>
                                        <div className="text-sm text-gray-500">
                                            #{tugas.from + index}
                                        </div>
                                    </div>
                                    {canManage && (
                                        <div className="flex space-x-2 ml-4">
                                            <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                onClick={() =>
                                                    openEditModal(tugasItem)
                                                }
                                                
                                                title="Edit"
                                            >
    <Edit className="w-4 h-4" />
</button>
                                            <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                onClick={() =>
                                                    openDeleteModal(tugasItem)
                                                }
                                                
                                                title="Hapus"
                                            >
    <Trash2 className="w-4 h-4" />
</button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 font-medium">
                                            Deskripsi:
                                        </span>
                                        <p className="text-gray-800 mt-1">
                                            {tugasItem.deskripsi || "-"}
                                        </p>
                                    </div>

                                    {!hasClassContext && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-medium">
                                                Kelas:
                                            </span>
                                            {tugasItem.kelas ? (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {getKelasLabel(
                                                        tugasItem.kelas,
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Semua Kelas
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">
                                            Pertemuan:
                                        </span>
                                        {tugasItem.pertemuan ? (
                                            <span className="text-gray-800">
                                                {tugasItem.pertemuan.judul}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                -
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-gray-600 font-medium">
                                            Deadline:
                                        </span>
                                        <p className="text-gray-800 mt-1">
                                            {formatDate(tugasItem.deadline)}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">
                                            File:
                                        </span>
                                        {tugasItem.file_tugas ? (
                                            <button
                                                onClick={() =>
                                                    downloadFile(tugasItem)
                                                }
                                                className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                                            >
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                Download
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">
                                                Tidak ada file
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">
                                            Status:
                                        </span>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                tugasItem.status === "aktif"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {tugasItem.status}
                                        </span>
                                    </div>

                                    {(canManage || canViewSubmissions) && (
                                        <div className="pt-3 border-t border-gray-200 space-y-2">
                                            <button
                                                onClick={() =>
                                                    viewSubmissions(tugasItem)
                                                }
                                                className="w-full bg-blue-600 text-white text-sm py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                Lihat Pengumpulan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <Pagination links={tugas.links} />
                </div>
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Tambah Tugas Praktikum
                    </h3>

                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Judul Tugas:
                            </label>
                            <input
                                type="text"
                                value={createForm.data.judul_tugas}
                                onChange={(e) =>
                                    createForm.setData(
                                        "judul_tugas",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {createForm.errors.judul_tugas && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.judul_tugas}
                                </p>
                            )}
                        </div>

                        {!hasClassContext && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Kelas:
                                </label>
                                <select
                                    value={createForm.data.kelas_id}
                                    onChange={(e) => {
                                        createForm.setData(
                                            "kelas_id",
                                            e.target.value,
                                        );
                                        createForm.setData("pertemuan_id", "");
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {kelasOptionsForTugas.map((opt) => (
                                        <option
                                            key={opt.id || "umum"}
                                            value={opt.id}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.kelas_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.kelas_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pertemuan (Opsional)
                            </label>
                            {(() => {
                                const cid = classContext
                                    ? contextKelasId
                                    : createForm.data.kelas_id;
                                const kelasIdsForPertemuan = cid
                                    ? resolveScopeKelasIds(cid)
                                    : [];
                                const filtered = kelasIdsForPertemuan.length
                                    ? pertemuanList.filter((p) =>
                                          kelasIdsForPertemuan.includes(
                                              p.kelas_id,
                                          ),
                                      )
                                    : pertemuanList;
                                return (
                                    <>
                                        <select
                                            value={createForm.data.pertemuan_id}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "pertemuan_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            disabled={
                                                createForm.data.kelas_id &&
                                                filtered.length === 0
                                            }
                                        >
                                            <option value="">
                                                Pilih Pertemuan
                                            </option>
                                            {filtered.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.judul}
                                                    {!createForm.data
                                                        .kelas_id && p.kelas
                                                        ? ` (Kelas ${p.kelas.nama_kelas})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.data.kelas_id &&
                                            filtered.length === 0 && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    Belum ada pertemuan untuk
                                                    kelas ini.
                                                </p>
                                            )}
                                        {createForm.data.kelas_id &&
                                            filtered.length > 0 && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Menampilkan{" "}
                                                    {filtered.length} pertemuan
                                                    untuk kelas terpilih.
                                                </p>
                                            )}
                                    </>
                                );
                            })()}
                            {createForm.errors.pertemuan_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.pertemuan_id}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi (Opsional):
                            </label>
                            <textarea
                                value={createForm.data.deskripsi}
                                onChange={(e) =>
                                    createForm.setData(
                                        "deskripsi",
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {createForm.errors.deskripsi && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.deskripsi}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Tugas (Opsional):
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                    createForm.setData(
                                        "file_tugas",
                                        e.target.files[0],
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {createForm.errors.file_tugas && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.file_tugas}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deadline:
                            </label>
                            <input
                                type="datetime-local"
                                value={createForm.data.deadline}
                                onChange={(e) =>
                                    createForm.setData(
                                        "deadline",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {createForm.errors.deadline && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.deadline}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Tambah"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isEditModalOpen && !!selectedTugas}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Edit Tugas Praktikum
                    </h3>

                    <form onSubmit={handleEdit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Judul Tugas:
                            </label>
                            <input
                                type="text"
                                value={editForm.data.judul_tugas ?? ""}
                                onChange={(e) =>
                                    editForm.setData(
                                        "judul_tugas",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {editForm.errors.judul_tugas && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.judul_tugas}
                                </p>
                            )}
                        </div>

                        {!hasClassContext && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Kelas:
                                </label>
                                <select
                                    value={editForm.data.kelas_id ?? ""}
                                    onChange={(e) => {
                                        editForm.setData(
                                            "kelas_id",
                                            e.target.value,
                                        );
                                        editForm.setData("pertemuan_id", "");
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {kelasOptionsForTugas.map((opt) => (
                                        <option
                                            key={opt.id || "umum"}
                                            value={opt.id}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.kelas_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.kelas_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pertemuan (Opsional)
                            </label>
                            {(() => {
                                const cid = classContext
                                    ? contextKelasId
                                    : editForm.data.kelas_id;
                                const kelasIdsForPertemuan = cid
                                    ? resolveScopeKelasIds(cid)
                                    : [];
                                const filtered = kelasIdsForPertemuan.length
                                    ? pertemuanList.filter((p) =>
                                          kelasIdsForPertemuan.includes(
                                              p.kelas_id,
                                          ),
                                      )
                                    : pertemuanList;
                                return (
                                    <>
                                        <select
                                            value={
                                                editForm.data.pertemuan_id ?? ""
                                            }
                                            onChange={(e) =>
                                                editForm.setData(
                                                    "pertemuan_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            disabled={
                                                editForm.data.kelas_id &&
                                                filtered.length === 0
                                            }
                                        >
                                            <option value="">
                                                Pilih Pertemuan
                                            </option>
                                            {filtered.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.judul}
                                                    {!editForm.data.kelas_id &&
                                                    p.kelas
                                                        ? ` (Kelas ${p.kelas.nama_kelas})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {editForm.data.kelas_id &&
                                            filtered.length === 0 && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    Belum ada pertemuan untuk
                                                    kelas ini.
                                                </p>
                                            )}
                                        {editForm.data.kelas_id &&
                                            filtered.length > 0 && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Menampilkan{" "}
                                                    {filtered.length} pertemuan
                                                    untuk kelas terpilih.
                                                </p>
                                            )}
                                    </>
                                );
                            })()}
                            {editForm.errors.pertemuan_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.pertemuan_id}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi (Opsional):
                            </label>
                            <textarea
                                value={editForm.data.deskripsi ?? ""}
                                onChange={(e) =>
                                    editForm.setData(
                                        "deskripsi",
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {editForm.errors.deskripsi && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.deskripsi}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Tugas (Opsional):
                            </label>
                            {selectedTugas?.file_tugas && (
                                <p className="text-sm text-gray-600 mb-2">
                                    File saat ini:{" "}
                                    <span className="font-medium">
                                        Ada file
                                    </span>
                                </p>
                            )}
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                    editForm.setData(
                                        "file_tugas",
                                        e.target.files[0],
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {editForm.errors.file_tugas && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.file_tugas}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deadline:
                            </label>
                            <input
                                type="datetime-local"
                                value={editForm.data.deadline ?? ""}
                                onChange={(e) =>
                                    editForm.setData("deadline", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {editForm.errors.deadline && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.deadline}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status:
                            </label>
                            <select
                                value={editForm.data.status ?? ""}
                                onChange={(e) =>
                                    editForm.setData("status", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                            {editForm.errors.status && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.status}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Perbarui"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <ConfirmModal
                show={isDeleteModalOpen && !!selectedTugas}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message={
                    selectedTugas
                        ? `Yakin ingin menghapus tugas ${selectedTugas.judul_tugas}?`
                        : ""
                }
                confirmText={deleteForm.processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />

            
            <Modal
                show={isExportModalOpen}
                onClose={closeExportModal}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Pilih Tugas untuk Export Nilai
                    </h3>

                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                            Pilih tugas yang ingin diexport. Setiap tugas akan
                            menjadi sheet terpisah dalam file Excel.
                        </p>

                        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Export nilai per
                            </label>
                            <div className="flex flex-wrap gap-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="export_group_by"
                                        value="kelas"
                                        checked={exportGroupBy === "kelas"}
                                        onChange={() =>
                                            setExportGroupBy("kelas")
                                        }
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Kelas (gabung induk + subkelas dalam
                                        satu sheet)
                                    </span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="export_group_by"
                                        value="subkelas"
                                        checked={exportGroupBy === "subkelas"}
                                        onChange={() =>
                                            setExportGroupBy("subkelas")
                                        }
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Per subkelas (satu sheet per subkelas)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                            {tugas.data.map((tugasItem) => (
                                <div
                                    key={tugasItem.id}
                                    className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        id={`tugas-${tugasItem.id}`}
                                        checked={selectedTugasForExport.includes(
                                            tugasItem.id,
                                        )}
                                        onChange={() =>
                                            handleTugasSelection(tugasItem.id)
                                        }
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`tugas-${tugasItem.id}`}
                                        className="ml-3 flex-1 cursor-pointer"
                                    >
                                        <div className="font-medium text-gray-900">
                                            {tugasItem.judul_tugas}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {tugasItem.kelas
                                                ? `Kelas: ${getKelasLabel(tugasItem.kelas)}`
                                                : "Semua Kelas"}{" "}
                                            • Deadline:{" "}
                                            {formatDate(tugasItem.deadline)}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        {tugas.data.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada tugas untuk diexport
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeExportModal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={selectedTugasForExport.length === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Export ({selectedTugasForExport.length} tugas)
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default TugasPraktikumIndex;
