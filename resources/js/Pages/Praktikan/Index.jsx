import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
import { usePermission } from "../../Components/PermissionContext";
import DashboardLayout from "../../Layouts/DashboardLayout";

const PraktikanIndex = ({
    praktikum,
    praktikan, // all praktikan for backward compatibility
    praktikanByKelas,
    praktikanTanpaKelas,
    availableUsers,
    kelas,
    lab,
    filters = {},
    classContext = null,
}) => {
    const { auth } = usePage().props;
    const { can, hasRole } = usePermission();
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");

    // Permission-based access control
    const canManage = can("praktikan.create") || isAdmin || isKadep;

    // ─── Hierarchy computation ──────────────────────────────────────
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
    // Enrollment kelas = leaf nodes only
    const enrollmentKelas = allKelas.filter((k) => {
        if (k.parent_kelas_id) return true;
        return !allKelas.some((sub) => sub.parent_kelas_id === k.id);
    });
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem.parent_kelas_id) return kelasItem.nama_kelas;
        const parent = parentKelasList.find(
            (p) => p.id === kelasItem.parent_kelas_id,
        );
        return parent
            ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}`
            : kelasItem.nama_kelas;
    };

    // ─── Tab state ──────────────────────────────────────────────────
    const contextKelasId = classContext?.id || filters.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId || "all";
    const initKelas = allKelas.find((k) => k.id === initKelasId);
    const [activeParentId, setActiveParentId] = useState(
        initKelasId === "all"
            ? "all"
            : initKelas?.parent_kelas_id || initKelasId,
    );
    const [activeSubId, setActiveSubId] = useState(
        initKelas?.parent_kelas_id ? initKelas.id : null,
    );
    const activeKelasId =
        activeParentId === "all" ? "all" : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((p) => p.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedPraktikan, setSelectedPraktikan] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Table filtering, sorting & pagination
    const [tableSearch, setTableSearch] = useState("");
    const [sortField, setSortField] = useState("nim");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Create form
    const createForm = useForm({
        nim: "",
        nama: "",
        no_hp: "",
        kelas_id: "",
        is_existing_user: false,
    });

    // Add existing user form
    const addExistingForm = useForm({
        user_id: "",
        kelas_id: "",
    });

    // Import form
    const importForm = useForm({
        file: null,
    });

    // Delete form
    const deleteForm = useForm({});

    // Edit form
    const editForm = useForm({
        nim: "",
        nama: "",
        no_hp: "",
        kelas_id: "",
        password: "",
        _method: "PUT",
    });

    // Filter available users based on search query
    const filteredUsers =
        availableUsers?.filter(
            (user) =>
                user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [];

    // Get praktikan data based on active tab
    const getCurrentPraktikanData = () => {
        if (activeParentId === "all") {
            return praktikan || [];
        }
        const enrollmentData = praktikanByKelas?.[activeKelasId] || [];
        return enrollmentData
            .map((enrollment) => {
                const p = enrollment.praktikan;
                if (p) {
                    p.kelas = enrollment.kelas;
                    p.status = enrollment.status;
                    p.enrollment_id = enrollment.id;
                }
                return p;
            })
            .filter(Boolean);
    };

    // Get filtered & sorted data
    const getFilteredPraktikanData = () => {
        let data = getCurrentPraktikanData();
        if (tableSearch) {
            const q = tableSearch.toLowerCase();
            data = data.filter(
                (p) =>
                    (p.nim || "").toLowerCase().includes(q) ||
                    (p.nama || "").toLowerCase().includes(q) ||
                    (p.user?.email || "").toLowerCase().includes(q) ||
                    (p.no_hp || "").toLowerCase().includes(q) ||
                    (p.kelas?.nama_kelas || "").toLowerCase().includes(q),
            );
        }
        // Apply column sort
        data = [...data].sort((a, b) => {
            let valA = "",
                valB = "";
            if (sortField === "nim") {
                valA = a.nim || "";
                valB = b.nim || "";
            } else if (sortField === "nama") {
                valA = a.nama || "";
                valB = b.nama || "";
            } else if (sortField === "email") {
                valA = a.user?.email || "";
                valB = b.user?.email || "";
            } else if (sortField === "no_hp") {
                valA = a.no_hp || "";
                valB = b.no_hp || "";
            } else if (sortField === "kelas") {
                valA = a.kelas?.nama_kelas || "";
                valB = b.kelas?.nama_kelas || "";
            }
            const cmp = valA.localeCompare(valB, undefined, {
                numeric: sortField === "nim",
            });
            return sortDirection === "asc" ? cmp : -cmp;
        });
        return data;
    };

    const getTotalPages = () =>
        Math.max(1, Math.ceil(getFilteredPraktikanData().length / perPage));

    const getPaginatedData = () => {
        const filtered = getFilteredPraktikanData();
        const start = (currentPage - 1) * perPage;
        return filtered.slice(start, start + perPage);
    };

    // Reset to page 1 when tab, search, or sort changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setCurrentPage(1);
    }, [activeParentId, activeSubId, tableSearch, sortField, sortDirection]);

    // Open modals
    const openCreateModal = () => {
        if (!canManage) return;
        createForm.reset();
        if (contextKelasId) {
            createForm.setData("kelas_id", contextKelasId);
            setIsCreateModalOpen(true);
            return;
        }
        // Pre-fill kelas berdasarkan tab aktif
        if (activeParentId !== "all" && !showSubTabs) {
            createForm.setData("kelas_id", activeParentId);
        } else if (showSubTabs && activeSubId) {
            createForm.setData("kelas_id", activeSubId);
        }
        setIsCreateModalOpen(true);
    };

    const openAddExistingModal = () => {
        if (!canManage) return;
        addExistingForm.reset();
        if (contextKelasId) {
            addExistingForm.setData("kelas_id", contextKelasId);
        }
        setSearchQuery("");
        setIsAddExistingModalOpen(true);
    };

    const openEditModal = (praktikan) => {
        if (!canManage) return;
        setSelectedPraktikan(praktikan);
        editForm.setData({
            nim: praktikan.nim,
            nama: praktikan.nama,
            no_hp: praktikan.no_hp || "",
            kelas_id: contextKelasId || praktikan.kelas?.id || "",
            password: "",
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };

    // Close modals
    const closeCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(false);
    };

    const closeAddExistingModal = () => {
        addExistingForm.reset();
        setSearchQuery("");
        setIsAddExistingModalOpen(false);
    };

    const closeEditModal = () => {
        editForm.reset();
        setIsEditModalOpen(false);
        setSelectedPraktikan(null);
    };

    const closeImportModal = () => {
        importForm.reset();
        setIsImportModalOpen(false);
    };

    // Handle form submissions
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(
            route("praktikum.praktikan.store", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil ditambahkan");
                    closeCreateModal();
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.error("Gagal menambahkan praktikan");
                },
            },
        );
    };

    const handleAddExisting = (e) => {
        e.preventDefault();
        addExistingForm.post(
            route("praktikum.praktikan.add-existing", {
                praktikum: praktikum.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil ditambahkan");
                    closeAddExistingModal();
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.error("Gagal menambahkan praktikan");
                },
            },
        );
    };

    const handleEdit = (e) => {
        e.preventDefault();
        console.log("Edit form data:", editForm.data);
        console.log("Selected praktikan:", selectedPraktikan);
        console.log("Route params:", {
            praktikum: praktikum.id,
            praktikan: selectedPraktikan.id,
        });

        editForm.post(
            route("praktikum.praktikan.update", {
                praktikum: praktikum.id,
                praktikan: selectedPraktikan.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil diperbarui");
                    closeEditModal();
                },
                onError: (errors) => {
                    console.error("Edit errors:", errors);
                    toast.error("Gagal memperbarui praktikan");
                },
            },
        );
    };

    // Handle import
    const handleImport = (e) => {
        e.preventDefault();
        importForm.post(
            route("praktikum.praktikan.import", { praktikum: praktikum.id }),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Data praktikan berhasil diimport");
                    importForm.reset();
                    setIsImportModalOpen(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.file || "Gagal mengimport data praktikan",
                    );
                },
            },
        );
    };

    // Handle delete
    const handleDelete = (praktikan) => {
        setSelectedPraktikan(praktikan);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        deleteForm.delete(
            route("praktikum.praktikan.destroy", {
                praktikan: selectedPraktikan.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil dihapus");
                    setIsDeleteModalOpen(false);
                    setSelectedPraktikan(null);
                },
                onError: () => {
                    toast.error("Gagal menghapus praktikan");
                },
            },
        );
    };

    // Download template
    const downloadTemplate = () => {
        const url = route("praktikan.template.download", {
            praktikum_id: praktikum.id,
        });
        window.open(url, "_blank");
    };

    // Tab count helpers
    const getAllCount = () => praktikan?.length || 0;
    const getParentTabCount = (parent) => {
        if (!parent.hasSubKelas)
            return praktikanByKelas?.[parent.id]?.length || 0;
        return parent.subKelas.reduce(
            (sum, sub) => sum + (praktikanByKelas?.[sub.id]?.length || 0),
            0,
        );
    };
    const getSubCount = (subId) => praktikanByKelas?.[subId]?.length || 0;

    // ─── Redistribusi praktikan dari parent ke sub-kelas ────────────
    const [distribusiModal, setDistribusiModal] = useState({ open: false });
    const [distribusiSearch, setDistribusiSearch] = useState("");

    // Data praktikan di parent kelas (orphaned = masih di parent walau sudah ada subkelas)
    const orphanedEnrollments =
        activeParentId !== "all" && showSubTabs
            ? praktikanByKelas?.[activeParentId] || []
            : [];

    const distribusiForm = useForm({
        praktikan_ids: [],
        target_kelas_id: "",
    });

    const openDistribusiModal = () => {
        distribusiForm.setData("target_kelas_id", currentSubKelas[0]?.id || "");
        distribusiForm.setData(
            "praktikan_ids",
            orphanedEnrollments.map((e) => e.id),
        );
        setDistribusiSearch("");
        setDistribusiModal({ open: true });
    };
    const closeDistribusiModal = () => {
        setDistribusiModal({ open: false });
        setDistribusiSearch("");
    };

    const toggleDistribusiItem = (enrollmentId) => {
        const ids = distribusiForm.data.praktikan_ids;
        const next = ids.includes(enrollmentId)
            ? ids.filter((id) => id !== enrollmentId)
            : [...ids, enrollmentId];
        distribusiForm.setData("praktikan_ids", next);
    };

    const handleDistribusi = (e) => {
        e.preventDefault();
        if (
            !distribusiForm.data.target_kelas_id ||
            distribusiForm.data.praktikan_ids.length === 0
        )
            return;
        distribusiForm.post(
            route("kelas.pindah-praktikan", { kelas: activeParentId }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil dipindahkan");
                    setDistribusiModal({ open: false });
                    setDistribusiSearch("");
                },
                onError: () => {
                    toast.error("Gagal memindahkan praktikan");
                },
            },
        );
    };

    const distribusiFilteredEnrollments = distribusiSearch.trim()
        ? orphanedEnrollments.filter((e) => {
              const p = e.praktikan;
              const q = distribusiSearch.toLowerCase();
              return (
                  p?.nama?.toLowerCase().includes(q) ||
                  p?.nim?.toLowerCase().includes(q) ||
                  p?.user?.email?.toLowerCase().includes(q)
              );
          })
        : orphanedEnrollments;

    // ─── Pindah kelas massal (kapan saja, ke kelas mana saja: lintas parent/subkelas atau tanpa kelas) ───
    const allEnrollmentsForPindah = [
        ...(praktikanTanpaKelas || []),
        ...allKelas.flatMap((k) => praktikanByKelas?.[k.id] || []),
    ];
    const [pindahMassalModal, setPindahMassalModal] = useState(false);
    const [pindahMassalSearch, setPindahMassalSearch] = useState("");
    const pindahMassalForm = useForm({
        praktikan_ids: [],
        target_kelas_id: "",
    });
    const openPindahMassalModal = () => {
        pindahMassalForm.setData("praktikan_ids", []);
        pindahMassalForm.setData("target_kelas_id", "");
        setPindahMassalSearch("");
        setPindahMassalModal(true);
    };
    const closePindahMassalModal = () => {
        setPindahMassalModal(false);
        setPindahMassalSearch("");
    };
    const togglePindahMassalItem = (enrollmentId) => {
        const ids = pindahMassalForm.data.praktikan_ids || [];
        const next = ids.includes(enrollmentId)
            ? ids.filter((id) => id !== enrollmentId)
            : [...ids, enrollmentId];
        pindahMassalForm.setData("praktikan_ids", next);
    };
    const handlePindahMassal = (e) => {
        e.preventDefault();
        const ids = pindahMassalForm.data.praktikan_ids || [];
        if (ids.length === 0) return;
        pindahMassalForm.post(
            route("praktikum.praktikan.pindah-kelas-massal", {
                praktikum: praktikum.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Praktikan berhasil dipindahkan");
                    setPindahMassalModal(false);
                    setPindahMassalSearch("");
                },
                onError: () => toast.error("Gagal memindahkan praktikan"),
            },
        );
    };
    const pindahMassalFiltered = pindahMassalSearch.trim()
        ? allEnrollmentsForPindah.filter((e) => {
              const p = e.praktikan;
              const q = pindahMassalSearch.toLowerCase();
              return (
                  p?.nama?.toLowerCase().includes(q) ||
                  p?.nim?.toLowerCase().includes(q) ||
                  p?.user?.email?.toLowerCase().includes(q) ||
                  (e.kelas?.nama_kelas || "").toLowerCase().includes(q)
              );
          })
        : allEnrollmentsForPindah;
    const kelasOptionsPindahMassal = [
        { id: "", label: "— Tanpa kelas —" },
        ...parentKelasList
            .filter((p) => p.hasSubKelas)
            .map((p) => ({ id: p.id, label: `${p.nama_kelas} (induk)` })),
        ...(enrollmentKelas || []).map((k) => ({
            id: k.id,
            label: getKelasLabel(k),
        })),
    ];

    // Handle column sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    // Sort indicator
    const SortIndicator = ({ field }) => (
        <span
            className={`ml-1 inline-block ${sortField === field ? "text-indigo-500" : "text-gray-300"}`}
        >
            {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}
        </span>
    );

    const classContextLabel = classContext?.nama_kelas || null;
    const pageTitle = classContextLabel
        ? `Kelola Praktikan Kelas ${classContextLabel}`
        : "Kelola Praktikan";

    return (
        <DashboardLayout>
            <Head title={pageTitle} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() =>
                                router.get(
                                    route("praktikum.show", {
                                        praktikum: praktikum.id,
                                    }),
                                )
                            }
                            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {pageTitle}
                            </h2>
                            <h3 className="text-md text-gray-600">
                                Mata Kuliah: {praktikum?.mata_kuliah}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Lab: {lab?.nama_lab}
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                            <button
                                onClick={downloadTemplate}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
                            >
                                Download Template
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
                            >
                                Import Excel
                            </button>
                            <button
                                onClick={openAddExistingModal}
                                className="px-3 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-full sm:w-auto"
                            >
                                Tambah Existing User
                            </button>
                            <button
                                onClick={openCreateModal}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-full sm:w-auto"
                            >
                                Tambah Praktikan
                            </button>
                            <button
                                onClick={openPindahMassalModal}
                                className="px-3 py-2 bg-amber-600 text-white rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm w-full sm:w-auto"
                            >
                                Pindah Kelas Massal
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Level 1: Tab Semua + Parent Kelas ─────────────── */}
                {!hasClassContext && (
                    <div className="border-b border-gray-200">
                        <div className="overflow-x-auto">
                            <nav className="-mb-px flex px-6 min-w-max">
                                {/* Semua Tab */}
                                <button
                                    onClick={() => {
                                        setActiveParentId("all");
                                        setActiveSubId(null);
                                    }}
                                    className={`flex items-center gap-1.5 py-3.5 px-3 mr-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                        activeParentId === "all"
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    Semua
                                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                                        {getAllCount()}
                                    </span>
                                </button>

                                {/* Parent Kelas Tabs */}
                                {parentKelasList.map((parent) => (
                                    <button
                                        key={parent.id}
                                        onClick={() => {
                                            setActiveParentId(parent.id);
                                            if (parent.hasSubKelas) {
                                                setActiveSubId(
                                                    parent.subKelas[0]?.id ||
                                                        null,
                                                );
                                            } else {
                                                setActiveSubId(null);
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 py-3.5 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                            activeParentId === parent.id
                                                ? "border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        {parent.nama_kelas}
                                        {parent.hasSubKelas && (
                                            <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                                                <svg
                                                    className="w-2.5 h-2.5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M6 3v12M18 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM15 12H9" />
                                                </svg>
                                                {parent.subKelas.length}
                                            </span>
                                        )}
                                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                                            {getParentTabCount(parent)}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                {/* ── Level 2: Sub-kelas Tabs ────────────────────────── */}
                {!hasClassContext &&
                    activeParentId !== "all" &&
                    showSubTabs && (
                        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
                            <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1 mr-1">
                                <svg
                                    className="w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M6 3v12M18 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM15 12H9" />
                                </svg>
                                Sub-kelas {activeParent?.nama_kelas}:
                            </span>
                            {currentSubKelas.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => setActiveSubId(sub.id)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                        activeSubId === sub.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                                >
                                    {sub.nama_kelas}
                                    <span className="ml-1 opacity-75">
                                        ({getSubCount(sub.id)})
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                {/* ── Info banner: parent punya subkelas ─────────────── */}
                {!hasClassContext &&
                    activeParentId !== "all" &&
                    showSubTabs && (
                        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                            <svg
                                className="w-3.5 h-3.5 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            Kelas{" "}
                            <strong className="mx-0.5">
                                {activeParent?.nama_kelas}
                            </strong>{" "}
                            sudah dipecah menjadi sub-kelas. Praktikan dikelola
                            per sub-kelas.
                        </div>
                    )}

                {/* ── Orphaned data panel: praktikan masih di parent kelas ── */}
                {!hasClassContext &&
                    activeParentId !== "all" &&
                    showSubTabs &&
                    orphanedEnrollments.length > 0 && (
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
                                    <strong className="font-semibold">
                                        {orphanedEnrollments.length} praktikan
                                    </strong>{" "}
                                    masih terdaftar di{" "}
                                    <strong>{activeParent?.nama_kelas}</strong>{" "}
                                    (kelas induk). Distribusikan ke sub-kelas
                                    agar bisa dikelola dengan benar.
                                </span>
                            </div>
                            {canManage && (
                                <button
                                    onClick={openDistribusiModal}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 3v12M18 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM15 12H9" />
                                    </svg>
                                    Distribusikan ke Sub-Kelas
                                </button>
                            )}
                        </div>
                    )}

                {/* Table Toolbar */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex-1 max-w-sm">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari NIM, nama, email, kelas..."
                                value={tableSearch}
                                onChange={(e) => {
                                    setTableSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-4 w-4 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                        <span>Tampilkan</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[5rem]"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>per halaman</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                    No
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                                    onClick={() => handleSort("nim")}
                                >
                                    NIM <SortIndicator field="nim" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                                    onClick={() => handleSort("nama")}
                                >
                                    Nama <SortIndicator field="nama" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                                    onClick={() => handleSort("email")}
                                >
                                    Email <SortIndicator field="email" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                                    onClick={() => handleSort("no_hp")}
                                >
                                    No HP <SortIndicator field="no_hp" />
                                </th>
                                {!hasClassContext && (
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                                        onClick={() => handleSort("kelas")}
                                    >
                                        Kelas <SortIndicator field="kelas" />
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                                const pagData = getPaginatedData();
                                const startIdx = (currentPage - 1) * perPage;
                                const hasFilters = tableSearch;
                                if (pagData.length === 0) {
                                    return (
                                        <tr>
                                            <td
                                                colSpan={
                                                    hasClassContext ? "5" : "6"
                                                }
                                                className="px-6 py-8 text-sm text-gray-500 text-center"
                                            >
                                                {hasFilters
                                                    ? "Tidak ada data yang cocok dengan filter"
                                                    : "Tidak ada data praktikan"}
                                            </td>
                                        </tr>
                                    );
                                }
                                return pagData.map((p, index) => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {startIdx + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium border-r border-gray-200">
                                            {p.nim}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                                            {p.nama}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {p.user?.email || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                            {p.no_hp || "-"}
                                        </td>
                                        {!hasClassContext && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                                {p.kelas ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {p.kelas.nama_kelas}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        Belum Diassign
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {(() => {
                    const filteredCount = getFilteredPraktikanData().length;
                    const totalCount = getCurrentPraktikanData().length;
                    const totalPages = getTotalPages();
                    const startIdx = (currentPage - 1) * perPage;
                    const endIdx = Math.min(startIdx + perPage, filteredCount);
                    const hasFilters = tableSearch;

                    const getPageNumbers = () => {
                        const maxVisible = 5;
                        let start = Math.max(1, currentPage - 2);
                        let end = Math.min(totalPages, start + maxVisible - 1);
                        if (end - start < maxVisible - 1)
                            start = Math.max(1, end - maxVisible + 1);
                        const pages = [];
                        for (let i = start; i <= end; i++) pages.push(i);
                        return pages;
                    };

                    return (
                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-sm text-gray-600">
                                {filteredCount === 0
                                    ? "Tidak ada data"
                                    : `Menampilkan ${startIdx + 1}\u2013${endIdx} dari ${filteredCount} data`}
                                {hasFilters &&
                                    ` (difilter dari ${totalCount} data pada tab ini)`}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        title="Halaman pertama"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        title="Sebelumnya"
                                    >
                                        ‹
                                    </button>
                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[2rem] h-8 rounded text-sm ${
                                                currentPage === page
                                                    ? "bg-indigo-600 text-white"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        title="Berikutnya"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage(totalPages)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        title="Halaman terakhir"
                                    >
                                        »
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Add Existing User Modal */}
            <Modal
                show={isAddExistingModalOpen}
                onClose={closeAddExistingModal}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Tambah Existing User sebagai Praktikan
                    </h3>

                    {/* Search Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari User:
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari berdasarkan nama, NIM, atau email..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <form onSubmit={handleAddExisting}>
                        {/* User Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pilih User:
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                                        >
                                            <input
                                                type="radio"
                                                name="user_id"
                                                value={user.id}
                                                checked={
                                                    addExistingForm.data
                                                        .user_id === user.id
                                                }
                                                onChange={(e) =>
                                                    addExistingForm.setData(
                                                        "user_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {user.nama}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    NIM: {user.nim || "N/A"} |
                                                    Email: {user.email}
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-3 text-gray-500 text-center">
                                        {searchQuery
                                            ? "Tidak ada user yang sesuai dengan pencarian"
                                            : "Tidak ada user tersedia"}
                                    </div>
                                )}
                            </div>
                            {addExistingForm.errors.user_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {addExistingForm.errors.user_id}
                                </p>
                            )}
                        </div>

                        {!hasClassContext && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assign ke Kelas:
                                </label>
                                <select
                                    value={addExistingForm.data.kelas_id}
                                    onChange={(e) =>
                                        addExistingForm.setData(
                                            "kelas_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Pilih Kelas</option>
                                    {enrollmentKelas.map((kelasItem) => (
                                        <option
                                            key={kelasItem.id}
                                            value={kelasItem.id}
                                        >
                                            {getKelasLabel(kelasItem)}
                                        </option>
                                    ))}
                                </select>
                                {addExistingForm.errors.kelas_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {addExistingForm.errors.kelas_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={closeAddExistingModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    addExistingForm.processing ||
                                    !addExistingForm.data.user_id
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {addExistingForm.processing
                                    ? "Menyimpan..."
                                    : "Tambah"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Create Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Tambah Praktikan Baru
                    </h3>

                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NIM:
                            </label>
                            <input
                                type="text"
                                value={createForm.data.nim}
                                onChange={(e) =>
                                    createForm.setData("nim", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {createForm.errors.nim && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.nim}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama:
                            </label>
                            <input
                                type="text"
                                value={createForm.data.nama}
                                onChange={(e) =>
                                    createForm.setData("nama", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {createForm.errors.nama && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.nama}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                No HP (Opsional):
                            </label>
                            <input
                                type="text"
                                value={createForm.data.no_hp}
                                onChange={(e) =>
                                    createForm.setData("no_hp", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {createForm.errors.no_hp && (
                                <p className="mt-1 text-sm text-red-600">
                                    {createForm.errors.no_hp}
                                </p>
                            )}
                        </div>

                        {!hasClassContext && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Kelas:
                                </label>
                                <select
                                    value={createForm.data.kelas_id}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "kelas_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Kelas</option>
                                    {enrollmentKelas.map((kelasItem) => (
                                        <option
                                            key={kelasItem.id}
                                            value={kelasItem.id}
                                        >
                                            {getKelasLabel(kelasItem)}
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

            {/* Import Modal */}
            <Modal
                show={isImportModalOpen}
                onClose={() => {
                    importForm.reset();
                    setIsImportModalOpen(false);
                }}
                maxWidth="2xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Import Data Praktikan
                    </h3>

                    {/* Informasi Kelas yang Tersedia */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                            Kelas yang Tersedia untuk Import:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {enrollmentKelas.map((kelasItem) => (
                                <div
                                    key={kelasItem.id}
                                    className="text-sm text-blue-700"
                                >
                                    <span className="font-medium">
                                        Nama Kelas:
                                    </span>
                                    <span className="mx-2">-</span>
                                    <span>{getKelasLabel(kelasItem)}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            Isi kolom 'kelas' pada file Excel persis sesuai nama
                            kelas di atas
                        </p>
                    </div>

                    {/* Instruksi Import */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                            Penting: Format Import yang Diperlukan
                        </h4>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <p>
                                • Kolom wajib: <strong>nim</strong>,{" "}
                                <strong>nama</strong>, <strong>kelas</strong>
                            </p>
                            <p>
                                • Kolom opsional: <strong>no_hp</strong>
                            </p>
                            <p>
                                • <strong>kelas</strong> harus sama persis
                                dengan nama kelas yang tersedia di atas
                            </p>
                            <p>• Jika NIM sudah ada, data akan diupdate</p>
                            <p>
                                • Jika NIM baru, akun baru akan dibuat otomatis
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleImport}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Excel (.xlsx atau .xls):
                            </label>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) =>
                                    importForm.setData(
                                        "file",
                                        e.target.files[0],
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {importForm.errors.file && (
                                <p className="mt-1 text-sm text-red-600">
                                    {importForm.errors.file}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={importForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {importForm.processing
                                    ? "Mengimport..."
                                    : "Import"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                show={isEditModalOpen && !!selectedPraktikan}
                onClose={closeEditModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Edit Praktikan
                    </h3>

                    <form onSubmit={handleEdit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NIM:
                            </label>
                            <input
                                type="text"
                                value={editForm.data.nim}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                readOnly
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                NIM tidak dapat diubah
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama:
                            </label>
                            <input
                                type="text"
                                value={editForm.data.nama}
                                onChange={(e) =>
                                    editForm.setData("nama", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            {editForm.errors.nama && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.nama}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                No HP (Opsional):
                            </label>
                            <input
                                type="text"
                                value={editForm.data.no_hp}
                                onChange={(e) =>
                                    editForm.setData("no_hp", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {editForm.errors.no_hp && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.no_hp}
                                </p>
                            )}
                        </div>

                        {!hasClassContext && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Kelas:
                                </label>
                                <select
                                    value={editForm.data.kelas_id}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "kelas_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Pilih Kelas</option>
                                    {enrollmentKelas.map((kelasItem) => (
                                        <option
                                            key={kelasItem.id}
                                            value={kelasItem.id}
                                        >
                                            {getKelasLabel(kelasItem)}
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
                                Password Baru (Opsional):
                            </label>
                            <input
                                type="password"
                                value={editForm.data.password}
                                onChange={(e) =>
                                    editForm.setData("password", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Kosongkan jika tidak ingin mengubah password"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                Kosongkan jika tidak ingin mengubah password
                            </div>
                            {editForm.errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {editForm.errors.password}
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
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                show={isDeleteModalOpen && !!selectedPraktikan}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message={
                    selectedPraktikan
                        ? `Yakin ingin menghapus praktikan ${selectedPraktikan.nama}?`
                        : ""
                }
                confirmText={deleteForm.processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />

            {/* ══ Modal Distribusi Praktikan ke Sub-Kelas ════════════════ */}
            <Modal
                show={distribusiModal.open}
                onClose={closeDistribusiModal}
                maxWidth="2xl"
            >
                <div className="p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Distribusikan Praktikan ke Sub-Kelas
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Pilih praktikan dari{" "}
                                <strong>{activeParent?.nama_kelas}</strong> dan
                                tentukan sub-kelas tujuannya.
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

                    <form onSubmit={handleDistribusi}>
                        <div className="px-6 py-4 space-y-4">
                            {/* Target sub-kelas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Pindahkan ke Sub-Kelas{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={
                                        distribusiForm.data.target_kelas_id ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        distribusiForm.setData(
                                            "target_kelas_id",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">
                                        -- Pilih Sub-Kelas --
                                    </option>
                                    {currentSubKelas.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.nama_kelas} (
                                            {getSubCount(sub.id)} praktikan)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Daftar praktikan orphaned + search */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Pilih Praktikan (
                                        {distribusiForm.data.praktikan_ids
                                            ?.length ?? 0}{" "}
                                        dipilih)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                distribusiForm.setData(
                                                    "praktikan_ids",
                                                    orphanedEnrollments.map(
                                                        (e) => e.id,
                                                    ),
                                                )
                                            }
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            Pilih Semua
                                        </button>
                                        <span className="text-gray-300 text-xs">
                                            |
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                distribusiForm.setData(
                                                    "praktikan_ids",
                                                    [],
                                                )
                                            }
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Batal Semua
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <input
                                        type="text"
                                        placeholder="Cari nama, NIM, atau email..."
                                        value={distribusiSearch}
                                        onChange={(e) =>
                                            setDistribusiSearch(e.target.value)
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {orphanedEnrollments.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                                            Tidak ada praktikan di kelas induk
                                        </div>
                                    ) : distribusiFilteredEnrollments.length ===
                                      0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                                            Tidak ada hasil untuk &quot;
                                            {distribusiSearch}&quot;
                                        </div>
                                    ) : (
                                        distribusiFilteredEnrollments.map(
                                            (enrollment) => {
                                                const p = enrollment.praktikan;
                                                const isChecked = (
                                                    distribusiForm.data
                                                        .praktikan_ids ?? []
                                                ).includes(enrollment.id);
                                                return (
                                                    <label
                                                        key={enrollment.id}
                                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                                            isChecked
                                                                ? "bg-indigo-50"
                                                                : "hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() =>
                                                                toggleDistribusiItem(
                                                                    enrollment.id,
                                                                )
                                                            }
                                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                                    {p?.nama}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    {p?.nim}
                                                                </span>
                                                            </div>
                                                            {p?.user?.email && (
                                                                <p className="text-xs text-gray-400 truncate">
                                                                    {
                                                                        p.user
                                                                            .email
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            },
                                        )
                                    )}
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
                                    distribusiForm.processing ||
                                    (distribusiForm.data.praktikan_ids
                                        ?.length ?? 0) === 0 ||
                                    !distribusiForm.data.target_kelas_id
                                }
                                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {distribusiForm.processing
                                    ? "Memindahkan..."
                                    : `Pindahkan ${distribusiForm.data.praktikan_ids?.length ?? 0} Praktikan`}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Pindah Kelas Massal — kapan saja, ke kelas mana saja (lintas parent/subkelas atau tanpa kelas) */}
            <Modal
                show={pindahMassalModal}
                onClose={closePindahMassalModal}
                maxWidth="2xl"
            >
                <div className="p-0">
                    <div className="flex justify-between items-start px-6 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Pindah Kelas Massal
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Pilih praktikan lalu pilih kelas tujuan. Boleh
                                lintas kelas induk/subkelas atau pindah ke
                                &quot;Tanpa kelas&quot;.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closePindahMassalModal}
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
                    <form onSubmit={handlePindahMassal}>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Kelas Tujuan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={
                                        pindahMassalForm.data.target_kelas_id ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        pindahMassalForm.setData(
                                            "target_kelas_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {kelasOptionsPindahMassal.map((opt) => (
                                        <option
                                            key={opt.id || "none"}
                                            value={opt.id}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Pilih Praktikan (
                                        {
                                            (
                                                pindahMassalForm.data
                                                    .praktikan_ids || []
                                            ).length
                                        }{" "}
                                        dipilih)
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                pindahMassalForm.setData(
                                                    "praktikan_ids",
                                                    allEnrollmentsForPindah.map(
                                                        (e) => e.id,
                                                    ),
                                                )
                                            }
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            Pilih Semua
                                        </button>
                                        <span className="text-gray-300 text-xs">
                                            |
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                pindahMassalForm.setData(
                                                    "praktikan_ids",
                                                    [],
                                                )
                                            }
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Batal Semua
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <input
                                        type="text"
                                        placeholder="Cari nama, NIM, email, atau kelas..."
                                        value={pindahMassalSearch}
                                        onChange={(e) =>
                                            setPindahMassalSearch(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                    {allEnrollmentsForPindah.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                                            Tidak ada praktikan di praktikum ini
                                        </div>
                                    ) : pindahMassalFiltered.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                                            Tidak ada hasil untuk &quot;
                                            {pindahMassalSearch}&quot;
                                        </div>
                                    ) : (
                                        pindahMassalFiltered.map(
                                            (enrollment) => {
                                                const p = enrollment.praktikan;
                                                const isChecked = (
                                                    pindahMassalForm.data
                                                        .praktikan_ids || []
                                                ).includes(enrollment.id);
                                                return (
                                                    <label
                                                        key={enrollment.id}
                                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isChecked ? "bg-amber-50" : "hover:bg-gray-50"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() =>
                                                                togglePindahMassalItem(
                                                                    enrollment.id,
                                                                )
                                                            }
                                                            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                                    {p?.nama}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    {p?.nim}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {p?.user
                                                                    ?.email && (
                                                                    <span className="text-xs text-gray-400 truncate">
                                                                        {
                                                                            p
                                                                                .user
                                                                                .email
                                                                        }
                                                                    </span>
                                                                )}
                                                                {enrollment.kelas && (
                                                                    <span className="text-xs text-gray-500">
                                                                        →{" "}
                                                                        {getKelasLabel(
                                                                            enrollment.kelas,
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {!enrollment.kelas && (
                                                                    <span className="text-xs text-gray-400">
                                                                        (tanpa
                                                                        kelas)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            },
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closePindahMassalModal}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    pindahMassalForm.processing ||
                                    (pindahMassalForm.data.praktikan_ids || [])
                                        .length === 0
                                }
                                className="px-5 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                {pindahMassalForm.processing
                                    ? "Memindahkan..."
                                    : `Pindahkan ${(pindahMassalForm.data.praktikan_ids || []).length} Praktikan`}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default PraktikanIndex;
