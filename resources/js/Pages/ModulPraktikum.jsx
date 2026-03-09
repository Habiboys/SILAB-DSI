import { Head, router, useForm, usePage } from "@inertiajs/react";
import { GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../Components/ConfirmModal";
import Modal from "../Components/Modal";
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const ModulPraktikum = ({
    praktikum,
    modulPraktikum,
    pertemuanList,
    kelas,
    filters,
    flash,
}) => {
    const { auth } = usePage().props;
    const { can, user, hasRole } = usePermission();

    // Role helpers
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");

    // Helper to check if aslab assigned to THIS praktikum
    const isAssignedAslab = () => {
        return user?.praktikumAslab?.some((ap) => ap.id === praktikum.id);
    };

    // Permission checks — with role & assigned aslab fallbacks
    // Correct permission names: modul.create/update/delete/publish
    const canCreate =
        can("modul.create") || isAdmin || isKadep || isAssignedAslab();
    const canUpdate =
        can("modul.update") || isAdmin || isKadep || isAssignedAslab();
    const canDelete = can("modul.delete") || isAdmin || isKadep;

    // Can manage module public links
    const canManageModuleLinks =
        can("modul.publish") || isAdmin || isKadep || isAssignedAslab();

    // ─── Hierarchy (sesuai Pertemuan/Praktikan) ─────────────────────────
    const allKelas = kelas || [];
    const parentKelasList = allKelas
        .filter((k) => !k.parent_kelas_id)
        .map((parent) => ({
            ...parent,
            subKelas: allKelas.filter((sub) => sub.parent_kelas_id === parent.id),
            hasSubKelas: allKelas.some((sub) => sub.parent_kelas_id === parent.id),
        }));
    const enrollmentKelas = allKelas.filter((k) => {
        if (k.parent_kelas_id) return true;
        return !allKelas.some((sub) => sub.parent_kelas_id === k.id);
    });
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem?.parent_kelas_id) return kelasItem?.nama_kelas || "";
        const parent = parentKelasList.find((p) => p.id === kelasItem.parent_kelas_id);
        return parent ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}` : kelasItem?.nama_kelas || "";
    };

    const initKelasId = filters.kelas_id || "all";
    const initKelas = allKelas.find((k) => k.id === initKelasId);
    const initParentId =
        initKelasId === "all"
            ? "all"
            : initKelas?.parent_kelas_id
                ? initKelas.parent_kelas_id
                : initKelasId;
    const initSubId = initKelas?.parent_kelas_id ? initKelasId : null;

    // State for filters
    const [search, setSearch] = useState(filters.search || "");
    const [selectedPertemuan, setSelectedPertemuan] = useState(
        filters.pertemuan_id || "",
    );
    const [activeParentId, setActiveParentId] = useState(initParentId);
    const [activeSubId, setActiveSubId] = useState(initSubId);
    const activeKelasId =
        activeParentId === "all" ? "all" : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((p) => p.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || "")) {
                router.get(
                    route(route().current(), [praktikum.id]),
                    {
                        search,
                        pertemuan_id: selectedPertemuan,
                        kelas_id: activeKelasId,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
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
        if (tabId === "all") {
            setActiveSubId(null);
        } else {
            const parent = parentKelasList.find((p) => p.id === tabId);
            setActiveSubId(parent?.hasSubKelas ? parent.subKelas[0]?.id || null : null);
        }
        setSelectedPertemuan("");
        const newKelasId =
            tabId === "all"
                ? "all"
                : parentKelasList.find((p) => p.id === tabId)?.hasSubKelas
                    ? parentKelasList.find((p) => p.id === tabId).subKelas[0]?.id
                    : tabId;
        router.get(
            route(route().current(), [praktikum.id]),
            { search, pertemuan_id: "", kelas_id: newKelasId },
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
    const [selectedItem, setSelectedItem] = useState(null);
    // Local kelas filter state for modals (not sent to server)
    const [createSelectedKelas, setCreateSelectedKelas] = useState("");
    const [editSelectedKelas, setEditSelectedKelas] = useState("");

    // Create form
    const createForm = useForm({
        praktikum_id: praktikum?.id,
        pertemuan_id: "",
        judul: "",
        modul: null,
        is_public: false,
    });

    // Edit form
    const editForm = useForm({
        pertemuan_id: "",
        judul: "",
        modul: null,
        is_public: false,
        _method: "PUT",
    });

    const deleteForm = useForm({});

    // Open create modal
    const openCreateModal = () => {
        if (!canCreate) return;
        createForm.reset();
        setCreateSelectedKelas("");
        setIsCreateModalOpen(true);
    };

    // Close create modal
    const closeCreateModal = () => {
        createForm.reset();
        setCreateSelectedKelas("");
        setIsCreateModalOpen(false);
    };

    // Handle create form submission
    const handleCreate = (e) => {
        e.preventDefault();

        createForm.post(
            route("praktikum.modul.store", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeCreateModal();
                    toast.success("Modul praktikum berhasil ditambahkan");
                },
                onError: () => {
                    toast.error("Gagal menambahkan modul praktikum");
                },
            },
        );
    };

    // Open edit modal
    const openEditModal = (modul) => {
        if (!canUpdate) return;
        setSelectedItem(modul);
        editForm.setData({
            praktikum_id: modul.praktikum_id,
            pertemuan_id: modul.pertemuan_id || "",
            judul: modul.judul,
            modul: null,
            is_public: modul.is_public || false,
            _method: "PUT",
        });
        setEditSelectedKelas(modul.pertemuan?.kelas_id || "");
        setIsEditModalOpen(true);
    };

    // Close edit modal
    const closeEditModal = () => {
        setSelectedItem(null);
        editForm.reset();
        setEditSelectedKelas("");
        setIsEditModalOpen(false);
    };

    // Handle edit form submission
    const handleUpdate = (e) => {
        e.preventDefault();

        editForm.post(
            route("praktikum.modul.update", {
                praktikum: selectedItem.praktikum_id,
                modul: selectedItem.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeEditModal();
                    toast.success("Modul praktikum berhasil diperbarui");
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    toast.error("Gagal memperbarui modul praktikum");
                },
            },
        );
    };

    // ... (delete and view logic remains same)
    // Open delete modal
    const openDeleteModal = (item) => {
        if (!canDelete) return;
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    // Handle delete
    const handleDelete = () => {
        deleteForm.delete(
            route("praktikum.modul.destroy", {
                praktikum: praktikum.id,
                modul: selectedItem.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    toast.success("Modul praktikum berhasil dihapus");
                },
                onError: (error) => {
                    console.error("Delete error:", error);
                    toast.error("Gagal menghapus modul praktikum");
                },
            },
        );
    };

    //Handle view modul
    const viewModul = (modulId, modulFilename) => {
        if (!modulFilename) {
            console.error("Module filename is undefined");
            window.open(
                route("praktikum.modul.view", {
                    praktikum: praktikum.id,
                    modul: modulId,
                }),
                "_blank",
            );
            return;
        }
        const filename = modulFilename.split("/").pop();
        window.open(
            route("praktikum.modul.view", {
                praktikum: praktikum.id,
                modul: modulId,
                filename: filename,
            }),
            "_blank",
        );
    };

    // Toggle share link
    const toggleShareLink = (modul) => {
        router.post(
            route("praktikum.modul.toggle-share", {
                praktikum: praktikum.id,
                modul: modul.id,
            }),
            {},
            {
                onSuccess: () => {
                    router.reload();
                    const message = !modul.is_public
                        ? "Link berhasil dibuka"
                        : "Link berhasil ditutup";
                    toast.success(message);
                },
                onError: () => {
                    toast.error("Gagal mengubah status share link");
                },
            },
        );
    };

    // Copy share link
    const copyShareLink = async (modul) => {
        if (!modul.hash) {
            toast.error("Hash tidak tersedia, silakan refresh halaman");
            return;
        }
        const shareUrl = route("modul.public.view", {
            hash: modul.hash,
        });
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link berhasil disalin ke clipboard!");
        } catch (error) {
            // ... fallback
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            toast.success("Link berhasil disalin ke clipboard!");
        }
    };

    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Modul Praktikum" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() =>
                                router.get(
                                    route("praktikum.index"),
                                    praktikum?.kepengurusan_lab_id
                                        ? {
                                              kepengurusan_lab_id:
                                                  praktikum.kepengurusan_lab_id,
                                          }
                                        : {},
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
                                Modul Praktikum
                            </h2>
                            <h3 className="text-md text-gray-600">
                                Mata Kuliah: {praktikum?.mata_kuliah}
                            </h3>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        {canCreate && (
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tambah
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari modul..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={selectedPertemuan}
                            onChange={handlePertemuanChange}
                        >
                            <option value="">Semua Pertemuan</option>
                            {pertemuanList
                                .filter((p) => {
                                    if (activeKelasId === "all") return true;
                                    const activeKelas = allKelas.find(
                                        (k) => k.id === activeKelasId
                                    );
                                    const parentKelasId = activeKelas?.parent_kelas_id;
                                    return (
                                        p.kelas_id === activeKelasId ||
                                        p.kelas_id === parentKelasId
                                    );
                                })
                                .map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.judul}{" "}
                                        {p.kelas
                                            ? `(${getKelasLabel(p.kelas)})`
                                            : ""}{" "}
                                        - {p.formatted_tanggal}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Level 1: Tabs Semua + Parent Kelas */}
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
                            Semua Modul
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

                {/* Level 2: Sub-kelas Tabs */}
                {activeParentId !== "all" && showSubTabs && (
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

                {/* Info banner ketika parent punya subkelas */}
                {activeParentId !== "all" && showSubTabs && (
                    <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 shrink-0" />
                        Kelas <strong>{activeParent?.nama_kelas}</strong> sudah dipecah menjadi sub-kelas.
                        Modul dikelola per sub-kelas.
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pertemuan/Kelas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Judul
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    File Modul
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Share Link
                                </th>
                                {(canUpdate || canDelete) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {modulPraktikum && modulPraktikum.length > 0 ? (
                                modulPraktikum.map((modul) => (
                                    <tr
                                        key={modul.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">
                                                {modul.pertemuan
                                                    ? modul.pertemuan.judul
                                                    : `Pertemuan (ID: ${modul.pertemuan_id})`}
                                            </div>
                                            {modul.pertemuan?.kelas &&
                                                activeKelasId === "all" && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                                        {getKelasLabel(modul.pertemuan.kelas)}
                                                    </span>
                                                )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                            {modul.judul}
                                        </td>
                                        {/* ... (rest of rows same) */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <button
                                                onClick={() =>
                                                    viewModul(
                                                        modul.id,
                                                        modul.modul,
                                                    )
                                                }
                                                className="text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                Lihat Modul
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {/* Share link buttons same as before */}
                                            <div className="flex items-center space-x-2">
                                                {canManageModuleLinks ? (
                                                    modul.is_public ? (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    toggleShareLink(
                                                                        modul,
                                                                    )
                                                                }
                                                                className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                                                            >
                                                                Tutup Link
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    copyShareLink(
                                                                        modul,
                                                                    )
                                                                }
                                                                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                                                            >
                                                                Copy Link
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                toggleShareLink(
                                                                    modul,
                                                                )
                                                            }
                                                            className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                                                        >
                                                            Buka Link
                                                        </button>
                                                    )
                                                ) : modul.is_public ? (
                                                    <button
                                                        onClick={() =>
                                                            copyShareLink(modul)
                                                        }
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                                                    >
                                                        Copy Link
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        Link tidak tersedia
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-3">
                                                    {canUpdate && (
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    modul,
                                                                )
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-900 transition-colors focus:outline-none"
                                                            title="Edit"
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
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    modul,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                                                            title="Hapus"
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
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={
                                            canUpdate || canDelete ? "5" : "4"
                                        }
                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                    >
                                        Belum ada data modul praktikum
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <div>
                                Total Modul: {modulPraktikum?.length || 0}
                            </div>
                            <div className="text-gray-500">
                                {praktikum?.mata_kuliah} - Semester{" "}
                                {praktikum?.semester}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Modul */}
            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="lg"
            >
                <div className="flex flex-col max-h-[90vh] p-0">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Tambah Modul Praktikum
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {praktikum?.mata_kuliah}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4">
                            <form
                                id="create-modul-form"
                                onSubmit={handleCreate}
                                encType="multipart/form-data"
                            >
                                {/* Step 1: Pilih Kelas */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="create_kelas"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        1. Pilih Kelas
                                    </label>
                                    <select
                                        id="create_kelas"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={createSelectedKelas}
                                        onChange={(e) => {
                                            setCreateSelectedKelas(
                                                e.target.value,
                                            );
                                            createForm.setData(
                                                "pertemuan_id",
                                                "",
                                            );
                                        }}
                                    >
                                        <option value="">
                                            — Semua Kelas —
                                        </option>
                                        {enrollmentKelas?.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {getKelasLabel(k)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Step 2: Pilih Pertemuan (filtered) */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="pertemuan_id"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        2. Pilih Pertemuan
                                    </label>
                                    <select
                                        id="pertemuan_id"
                                        className={`w-full px-3 py-2 border rounded-md bg-white ${
                                            createForm.errors.pertemuan_id
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        value={createForm.data.pertemuan_id}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "pertemuan_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            — Pilih Pertemuan —
                                        </option>
                                        {(() => {
                                            const filtered = createSelectedKelas
                                                ? pertemuanList.filter(
                                                      (p) =>
                                                          p.kelas_id ===
                                                          createSelectedKelas,
                                                  )
                                                : pertemuanList;
                                            if (!filtered.length)
                                                return (
                                                    <option disabled>
                                                        Tidak ada pertemuan
                                                        tersedia
                                                    </option>
                                                );
                                            return filtered.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.judul}
                                                    {!createSelectedKelas &&
                                                    p.kelas
                                                        ? ` (${getKelasLabel(p.kelas)})`
                                                        : ""}{" "}
                                                    —{" "}
                                                    {p.formatted_tanggal ||
                                                        p.tanggal}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                    {createForm.errors.pertemuan_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {createForm.errors.pertemuan_id}
                                        </p>
                                    )}
                                </div>

                                {/* Judul */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="judul"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Judul Modul
                                    </label>
                                    <input
                                        type="text"
                                        id="judul"
                                        placeholder="Contoh: Modul 1 - Pengenalan..."
                                        className={`w-full px-3 py-2 border rounded-md ${
                                            createForm.errors.judul
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        value={createForm.data.judul}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "judul",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {createForm.errors.judul && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {createForm.errors.judul}
                                        </p>
                                    )}
                                </div>

                                {/* File Upload */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="modul"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        File Modul{" "}
                                        <span className="text-gray-400 font-normal">
                                            (PDF, maks. 10MB)
                                        </span>
                                    </label>
                                    <input
                                        type="file"
                                        id="modul"
                                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                                            createForm.errors.modul
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "modul",
                                                e.target.files[0],
                                            )
                                        }
                                        accept=".pdf"
                                        required
                                    />
                                    {createForm.errors.modul && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {createForm.errors.modul}
                                        </p>
                                    )}
                                </div>

                                {/* Public link */}
                                <div className="mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={createForm.data.is_public}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "is_public",
                                                    e.target.checked,
                                                )
                                            }
                                            className="rounded border-gray-300 text-blue-600 shadow-sm"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Buat link publik (dapat diakses
                                            tanpa login)
                                        </span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                form="create-modul-form"
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75"
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan Modul"}
                            </button>
                        </div>
                </div>
            </Modal>

            {/* Modal Edit Modul */}
            <Modal
                show={isEditModalOpen && !!selectedItem}
                onClose={closeEditModal}
                maxWidth="lg"
            >
                <div className="flex flex-col max-h-[90vh] p-0">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Edit Modul Praktikum
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">
                                    {selectedItem?.judul}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4">
                            <form
                                id="edit-modul-form"
                                onSubmit={handleUpdate}
                                encType="multipart/form-data"
                            >
                                {/* Step 1: Pilih Kelas */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="edit_kelas"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        1. Pilih Kelas
                                    </label>
                                    <select
                                        id="edit_kelas"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={editSelectedKelas}
                                        onChange={(e) => {
                                            setEditSelectedKelas(
                                                e.target.value,
                                            );
                                            editForm.setData(
                                                "pertemuan_id",
                                                "",
                                            );
                                        }}
                                    >
                                        <option value="">
                                            — Semua Kelas —
                                        </option>
                                        {enrollmentKelas?.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {getKelasLabel(k)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Step 2: Pilih Pertemuan (filtered) */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="edit-pertemuan_id"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        2. Pilih Pertemuan
                                        {editSelectedKelas && kelas && (
                                            <span className="ml-2 text-xs text-blue-600 font-normal">
                                                (Kelas{" "}
                                                {
                                                    kelas.find(
                                                        (k) =>
                                                            k.id ===
                                                            editSelectedKelas,
                                                    )?.nama_kelas
                                                }
                                                )
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        id="edit-pertemuan_id"
                                        className={`w-full px-3 py-2 border rounded-md bg-white ${
                                            editForm.errors.pertemuan_id
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        value={editForm.data.pertemuan_id}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "pertemuan_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            — Pilih Pertemuan —
                                        </option>
                                        {(() => {
                                            const filtered = editSelectedKelas
                                                ? pertemuanList.filter(
                                                      (p) =>
                                                          p.kelas_id ===
                                                          editSelectedKelas,
                                                  )
                                                : pertemuanList;
                                            if (!filtered.length)
                                                return (
                                                    <option disabled>
                                                        Tidak ada pertemuan
                                                        tersedia
                                                    </option>
                                                );
                                            return filtered.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.judul}
                                                    {!editSelectedKelas &&
                                                    p.kelas
                                                        ? ` (${getKelasLabel(p.kelas)})`
                                                        : ""}{" "}
                                                    —{" "}
                                                    {p.formatted_tanggal ||
                                                        p.tanggal}
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                    {editForm.errors.pertemuan_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {editForm.errors.pertemuan_id}
                                        </p>
                                    )}
                                </div>

                                {/* Judul */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="edit-judul"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Judul Modul
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-judul"
                                        className={`w-full px-3 py-2 border rounded-md ${
                                            editForm.errors.judul
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        value={editForm.data.judul}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "judul",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editForm.errors.judul && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {editForm.errors.judul}
                                        </p>
                                    )}
                                </div>

                                {/* File Upload (optional on edit) */}
                                <div className="mb-4">
                                    <label
                                        htmlFor="edit-modul"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Ganti File Modul{" "}
                                        <span className="text-gray-400 font-normal">
                                            (PDF, opsional — kosongkan jika
                                            tidak diubah)
                                        </span>
                                    </label>
                                    <input
                                        type="file"
                                        id="edit-modul"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        onChange={(e) =>
                                            editForm.setData(
                                                "modul",
                                                e.target.files[0],
                                            )
                                        }
                                        accept=".pdf"
                                    />
                                </div>

                                {/* Public link */}
                                <div className="mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.data.is_public}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    "is_public",
                                                    e.target.checked,
                                                )
                                            }
                                            className="rounded border-gray-300 text-blue-600 shadow-sm"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Buat link publik (dapat diakses
                                            tanpa login)
                                        </span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                form="edit-modul-form"
                                type="submit"
                                disabled={editForm.processing}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75"
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Perbarui Modul"}
                            </button>
                        </div>
                </div>
            </Modal>

            <ConfirmModal
                show={isDeleteModalOpen && !!selectedItem}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={
                    selectedItem
                        ? `Apakah Anda yakin ingin menghapus modul "${selectedItem.judul}"? Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default ModulPraktikum;
