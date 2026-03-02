import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
                    {/* Showing results text can be added here if passed from backend meta */}
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
    tugas, // Paginated object
    pertemuanList, // New prop
    kelas,
    lab,
    filters, // New prop
}) => {
    const { auth } = usePage().props;
    const { can, user, hasRole } = usePermission();

    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");

    // Permission checks — permission names: tugas.create/update/delete/grade
    const canCreate = can("tugas.create") || isAdmin || isKadep;
    const canUpdate = can("tugas.update") || isAdmin || isKadep;
    const canDelete = can("tugas.delete") || isAdmin || isKadep;
    const canExport = can("tugas.grade") || isAdmin || isKadep;
    const canViewSubmissions =
        can("tugas.grade") || can("tugas.view") || isAdmin || isKadep;

    // Helper function to check if user is assigned aslab for this praktikum
    const isAssignedAslab = () => {
        return user?.praktikumAslab?.some((ap) => ap.id === praktikum.id);
    };

    const canManage = canCreate || isAssignedAslab();

    // State for filters
    const [search, setSearch] = useState(filters.search || "");
    const [selectedPertemuan, setSelectedPertemuan] = useState(
        filters.pertemuan_id || "",
    );
    const [activeTab, setActiveTab] = useState(filters.kelas_id || "all");

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((query) => {
            router.get(
                route(route().current(), [praktikum.id]),
                {
                    search: query,
                    pertemuan_id: selectedPertemuan,
                    kelas_id: activeTab,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 500),
        [selectedPertemuan, activeTab, praktikum.id],
    );

    useEffect(() => {
        // Skip first render to avoid double fetch if needed,
        // but here we just want to react to search input changes after initial load
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
                kelas_id: activeTab,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedPertemuan(""); // Reset pertemuan filter when tab changes
        router.get(
            route(route().current(), [praktikum.id]),
            {
                search,
                pertemuan_id: "", // Reset in query
                kelas_id: tab,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);
    const [selectedTugasForExport, setSelectedTugasForExport] = useState([]);

    // Create form
    const createForm = useForm({
        judul_tugas: "",
        deskripsi: "",
        file_tugas: null,
        deadline: "",
        kelas_id: "",
        pertemuan_id: "", // Added
    });

    // Edit form
    const editForm = useForm({
        judul_tugas: "",
        deskripsi: "",
        file_tugas: null,
        deadline: "",
        kelas_id: "",
        pertemuan_id: "", // Added
        status: "aktif",
        _method: "PUT",
    });

    // Delete form
    const deleteForm = useForm({});

    // Helper functions
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
            kelas_id: tugas.kelas_id || "",
            pertemuan_id: tugas.pertemuan_id || "", // Added
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

    // Handle create form submission
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
                    toast.error("Gagal menambahkan tugas praktikum");
                },
            },
        );
    };

    // Handle edit form submission
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
                    toast.error("Gagal memperbarui tugas praktikum");
                },
            },
        );
    };

    // Handle delete
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
                onError: () => {
                    toast.error("Gagal menghapus tugas praktikum");
                },
            },
        );
    };

    // Download file
    const downloadFile = (tugas) => {
        window.open(
            route("praktikum.tugas.download", { tugas: tugas.id }),
            "_blank",
        );
    };

    // View submissions
    const viewSubmissions = (tugas) => {
        router.get(route("praktikum.tugas.submissions", { tugas: tugas.id }));
    };

    // Open export modal
    const openExportModal = () => {
        setSelectedTugasForExport([]);
        setIsExportModalOpen(true);
    };

    // Close export modal
    const closeExportModal = () => {
        setIsExportModalOpen(false);
        setSelectedTugasForExport([]);
    };

    // Handle tugas selection for export
    const handleTugasSelection = (tugasId) => {
        setSelectedTugasForExport((prev) => {
            if (prev.includes(tugasId)) {
                return prev.filter((id) => id !== tugasId);
            } else {
                return [...prev, tugasId];
            }
        });
    };

    // Handle export
    const handleExport = () => {
        if (selectedTugasForExport.length === 0) {
            alert("Pilih minimal satu tugas untuk diexport");
            return;
        }

        // Create URL with selected tugas IDs
        const tugasIds = selectedTugasForExport.join(",");
        window.open(
            route("praktikum.export-grades", {
                praktikum: praktikum.id,
                tugas: tugasIds,
            }),
            "_blank",
        );
        closeExportModal();
    };

    // Format date
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

    return (
        <DashboardLayout>
            <Head title="Kelola Tugas Praktikum" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-4">
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
                                Kelola Tugas Praktikum
                            </h2>
                            <h3 className="text-md text-gray-600">
                                Mata Kuliah: {praktikum?.mata_kuliah}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Lab: {lab?.nama_lab}
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

                {/* Filters */}
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

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto pb-2">
                        {/* All Tab - Tab Pertama */}
                        <button
                            onClick={() => handleTabChange("all")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === "all"
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Semua Tugas
                        </button>

                        {/* Tugas Umum Tab */}
                        <button
                            onClick={() => handleTabChange("umum")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === "umum"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Tugas Umum
                        </button>

                        {/* Kelas Tabs */}
                        {kelas?.map((kelasItem) => (
                            <button
                                key={kelasItem.id}
                                onClick={() => handleTabChange(kelasItem.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    activeTab === kelasItem.id
                                        ? "border-indigo-500 text-indigo-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Kelas {kelasItem.nama_kelas}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Desktop Table */}
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
                                                    {tugasItem.kelas.nama_kelas}
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
                                                <button
                                                    onClick={() =>
                                                        downloadFile(tugasItem)
                                                    }
                                                    className="text-blue-600 hover:text-blue-900 underline"
                                                >
                                                    Lihat Instruksi
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
                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        tugasItem,
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none"
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
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        tugasItem,
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
                                            colSpan="9"
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

                {/* Mobile View */}
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
                                            <button
                                                onClick={() =>
                                                    openEditModal(tugasItem)
                                                }
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                                title="Edit"
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
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(tugasItem)
                                                }
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                title="Hapus"
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
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
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

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">
                                            Kelas:
                                        </span>
                                        {tugasItem.kelas ? (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {tugasItem.kelas.nama_kelas}
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Semua Kelas
                                            </span>
                                        )}
                                    </div>

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

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
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
                                            createForm.setData(
                                                "pertemuan_id",
                                                "",
                                            );
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {kelas?.map((kelasItem) => (
                                            <option
                                                key={kelasItem.id}
                                                value={kelasItem.id}
                                            >
                                                Kelas {kelasItem.nama_kelas}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.kelas_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {createForm.errors.kelas_id}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pertemuan (Opsional)
                                    </label>
                                    {(() => {
                                        const filtered = createForm.data
                                            .kelas_id
                                            ? pertemuanList.filter(
                                                  (p) =>
                                                      p.kelas_id ===
                                                      createForm.data.kelas_id,
                                              )
                                            : pertemuanList;
                                        return (
                                            <>
                                                <select
                                                    value={
                                                        createForm.data
                                                            .pertemuan_id
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            "pertemuan_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    disabled={
                                                        createForm.data
                                                            .kelas_id &&
                                                        filtered.length === 0
                                                    }
                                                >
                                                    <option value="">
                                                        Pilih Pertemuan
                                                    </option>
                                                    {filtered.map((p) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                        >
                                                            {p.judul}
                                                            {!createForm.data
                                                                .kelas_id &&
                                                            p.kelas
                                                                ? ` (Kelas ${p.kelas.nama_kelas})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {createForm.data.kelas_id &&
                                                    filtered.length === 0 && (
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            Belum ada pertemuan
                                                            untuk kelas ini.
                                                        </p>
                                                    )}
                                                {createForm.data.kelas_id &&
                                                    filtered.length > 0 && (
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Menampilkan{" "}
                                                            {filtered.length}{" "}
                                                            pertemuan untuk
                                                            kelas terpilih.
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
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedTugas && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
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
                                        value={editForm.data.judul_tugas}
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

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Kelas:
                                    </label>
                                    <select
                                        value={editForm.data.kelas_id}
                                        onChange={(e) => {
                                            editForm.setData(
                                                "kelas_id",
                                                e.target.value,
                                            );
                                            editForm.setData(
                                                "pertemuan_id",
                                                "",
                                            );
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {kelas?.map((kelasItem) => (
                                            <option
                                                key={kelasItem.id}
                                                value={kelasItem.id}
                                            >
                                                Kelas {kelasItem.nama_kelas}
                                            </option>
                                        ))}
                                    </select>
                                    {editForm.errors.kelas_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {editForm.errors.kelas_id}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pertemuan (Opsional)
                                    </label>
                                    {(() => {
                                        const filtered = editForm.data.kelas_id
                                            ? pertemuanList.filter(
                                                  (p) =>
                                                      p.kelas_id ===
                                                      editForm.data.kelas_id,
                                              )
                                            : pertemuanList;
                                        return (
                                            <>
                                                <select
                                                    value={
                                                        editForm.data
                                                            .pertemuan_id
                                                    }
                                                    onChange={(e) =>
                                                        editForm.setData(
                                                            "pertemuan_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    disabled={
                                                        editForm.data
                                                            .kelas_id &&
                                                        filtered.length === 0
                                                    }
                                                >
                                                    <option value="">
                                                        Pilih Pertemuan
                                                    </option>
                                                    {filtered.map((p) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                        >
                                                            {p.judul}
                                                            {!editForm.data
                                                                .kelas_id &&
                                                            p.kelas
                                                                ? ` (Kelas ${p.kelas.nama_kelas})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {editForm.data.kelas_id &&
                                                    filtered.length === 0 && (
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            Belum ada pertemuan
                                                            untuk kelas ini.
                                                        </p>
                                                    )}
                                                {editForm.data.kelas_id &&
                                                    filtered.length > 0 && (
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            Menampilkan{" "}
                                                            {filtered.length}{" "}
                                                            pertemuan untuk
                                                            kelas terpilih.
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
                                        value={editForm.data.deskripsi}
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
                                    {selectedTugas.file_tugas && (
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
                                        value={editForm.data.deadline}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "deadline",
                                                e.target.value,
                                            )
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
                                        value={editForm.data.status}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">
                                            Nonaktif
                                        </option>
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
                                            : "Update"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedTugas && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Konfirmasi Hapus
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Yakin ingin menghapus tugas{" "}
                                <strong>{selectedTugas.judul_tugas}</strong>?
                            </p>

                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteForm.processing}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {deleteForm.processing
                                        ? "Menghapus..."
                                        : "Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Pilih Tugas untuk Export Nilai
                            </h3>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    Pilih tugas yang ingin diexport. Setiap
                                    tugas akan menjadi sheet terpisah dalam file
                                    Excel.
                                </p>

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
                                                    handleTugasSelection(
                                                        tugasItem.id,
                                                    )
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
                                                        ? `Kelas: ${tugasItem.kelas.nama_kelas}`
                                                        : "Semua Kelas"}{" "}
                                                    • Deadline:{" "}
                                                    {formatDate(
                                                        tugasItem.deadline,
                                                    )}
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
                                    disabled={
                                        selectedTugasForExport.length === 0
                                    }
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Export ({selectedTugasForExport.length}{" "}
                                    tugas)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TugasPraktikumIndex;
