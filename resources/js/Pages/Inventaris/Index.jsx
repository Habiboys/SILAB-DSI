import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Clock, FileDown, Printer, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InventarisIndex({
    kepengurusanlab,
    inventaris,
    categories,
    approvedWishlist = [],
    filters = {},
    flash = {},
}) {
    const { auth, laboratorium } = usePage().props;
    const { can } = usePermission();

    // Permission-based access control
    const canManageItems = can("inventaris.manage-items");
    const canManageKategori = can("inventaris.manage-kategori");
    const canCreate = canManageItems;
    const canUpdate = canManageItems;
    const canDelete = canManageItems;

    // Define isAdmin
    // Define isAdmin using usePermission if available, or fix logic
    const isUserAdmin = () => {
        if (auth.user.roles && Array.isArray(auth.user.roles)) {
            return (
                auth.user.roles.includes("admin") ||
                auth.user.roles.includes("superadmin")
            );
        }
        return false;
    };
    const isAdmin = isUserAdmin();
    const isSuperAdmin =
        auth.user.roles &&
        Array.isArray(auth.user.roles) &&
        auth.user.roles.includes("superadmin");

    // State
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(
        filters.kategori_id || "",
    );
    const [perPage, setPerPage] = useState(filters.perPage || 10);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState([]);
    const allSelected =
        inventaris.data.length > 0 &&
        selectedIds.length === inventaris.data.length;

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(inventaris.data.map((i) => i.id));
    };
    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    // Bulk actions
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const handleBulkDelete = () => setIsBulkDeleteModalOpen(true);
    const executeBulkDelete = () => {
        router.post(
            route("detail-inventaris.bulk-delete"),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsBulkDeleteModalOpen(false);
                    toast.success("Aset terpilih berhasil dihapus");
                },
                preserveScroll: true,
            },
        );
    };
    // Label Configuration State
    const [isLabelConfigModalOpen, setIsLabelConfigModalOpen] = useState(false);
    const [labelConfigMode, setLabelConfigMode] = useState("selected"); // 'selected' or 'all'
    const [labelConfig, setLabelConfig] = useState({
        layout: "standard", // standard (3), medium (4), small (5), mini (6)
        show_qr: true,
    });

    const openLabelConfigModal = (mode = "selected") => {
        setLabelConfigMode(mode);
        setIsLabelConfigModalOpen(true);
    };

    const handleDownloadLabels = () => {
        // Construct URL with params
        const url = route("detail-inventaris.batch-labels");

        // Create a hidden form to submit the array of IDs and config
        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;
        form.target = "_blank"; // Open in new tab

        // CSRF Token
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");
        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "_token";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        // Scope
        const scopeInput = document.createElement("input");
        scopeInput.type = "hidden";
        scopeInput.name = "scope";
        scopeInput.value = labelConfigMode;
        form.appendChild(scopeInput);

        if (labelConfigMode === "selected") {
            // IDs
            selectedIds.forEach((id) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "ids[]";
                input.value = id;
                form.appendChild(input);
            });
        } else {
            // Filters for 'all' mode
            // Pass current filters
            if (searchTerm) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "search";
                input.value = searchTerm;
                form.appendChild(input);
            }
            if (selectedCategory) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "kategori_id";
                input.value = selectedCategory;
                form.appendChild(input);
            }
            if (filters.lab_id) {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "lab_id";
                input.value = filters.lab_id;
                form.appendChild(input);
            }
        }

        // Config
        const layoutInput = document.createElement("input");
        layoutInput.type = "hidden";
        layoutInput.name = "layout";
        layoutInput.value = labelConfig.layout;
        form.appendChild(layoutInput);

        const qrInput = document.createElement("input");
        qrInput.type = "hidden";
        qrInput.name = "show_qr";
        qrInput.value = labelConfig.show_qr ? "1" : "0";
        form.appendChild(qrInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setIsLabelConfigModalOpen(false);
        // setLabelConfig({ layout: 'standard', show_qr: true }); // Keep last config for convenience?
        // setSelectedIds([]); // Don't clear selection if 'all', maybe clear if 'selected'?
        if (labelConfigMode === "selected") setSelectedIds([]);
    };

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // QR Preview
    const openQrPreview = (item) => {
        setSelectedItem(item);
        setIsQrPreviewOpen(true);
    };

    // Flash messages
    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Search handler
    const handleSearch = debounce((search, category, pageLimit) => {
        router.get(
            route("inventaris.index"),
            {
                search: search,
                kategori_id: category,
                perPage: pageLimit,
                lab_id: filters.lab_id,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }, 300);

    const onSearchChange = (e) => {
        setSearchTerm(e.target.value);
        handleSearch(e.target.value, selectedCategory, perPage);
    };

    const onCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        handleSearch(searchTerm, e.target.value, perPage);
    };

    const onPerPageChange = (e) => {
        setPerPage(e.target.value);
        handleSearch(searchTerm, selectedCategory, e.target.value);
    };

    const handlePageChange = (url) => {
        if (url)
            router.visit(url, { preserveState: true, preserveScroll: true });
    };

    // --- Forms ---

    // CREATE Form
    const createForm = useForm({
        kategori_aset_id: "",
        laboratorium_id: filters.lab_id || "",
        nama: "",
        kode_barang: "",
        keadaan: "baik",
        status: "tersedia",
        keterangan: "",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "",
        wishlist_aset_id: "",
        foto: null,
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route("detail-inventaris.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success("Aset berhasil ditambahkan");
            },
            onError: () => toast.error("Gagal menambahkan aset"),
        });
    };

    // EDIT Form
    const editForm = useForm({
        id: "",
        kategori_aset_id: "",
        nama: "",
        kode_barang: "",
        keadaan: "",
        status: "",
        keterangan: "",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "",
        wishlist_aset_id: "",
        foto: null,
        _method: "PUT",
    });

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            id: item.id,
            kategori_aset_id: item.kategori_aset_id,
            nama: item.nama || "",
            kode_barang: item.kode_barang,
            keadaan: item.keadaan,
            status: item.status,
            keterangan: item.keterangan || "",
            tanggal_perolehan: item.tanggal_perolehan
                ? item.tanggal_perolehan.substring(0, 10)
                : "",
            harga_perolehan: item.harga_perolehan || "",
            asal_barang: item.asal_barang || "",
            wishlist_aset_id: item.wishlist_aset_id || "",
            foto: null,
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        // Using post with _method: PUT because file uploads with PUT/PATCH are tricky in standard HTML forms / Inertia sometimes
        // But standard Inertia .put usually works unless specific server config issues.
        // Safest for file upload updates is often POST with _method=PUT.
        // Let's try standard put first, if file upload fails we switch to post w/ spoofing.
        // Actually, Inertia recommends router.post with `_method: 'put'` for FormData with files.

        router.post(
            route("detail-inventaris.update", selectedItem.id),
            {
                ...editForm.data,
                _method: "PUT",
                foto: editForm.data.foto,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                    editForm.reset();
                    toast.success("Aset berhasil diperbarui");
                },
                onError: () => toast.error("Gagal memperbarui aset"),
            },
        );
    };

    // Riwayat kondisi modal
    const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
    const [riwayatData, setRiwayatData] = useState([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);

    const openRiwayatModal = async (item) => {
        setSelectedItem(item);
        setIsRiwayatModalOpen(true);
        setRiwayatLoading(true);
        try {
            const res = await fetch(
                route("detail-inventaris.riwayat-kondisi", item.id),
            );
            const data = await res.json();
            setRiwayatData(data);
        } catch {
            setRiwayatData([]);
        } finally {
            setRiwayatLoading(false);
        }
    };

    // Update kondisi modal
    const [isUpdateKondisiModalOpen, setIsUpdateKondisiModalOpen] =
        useState(false);
    const kondisiForm = useForm({
        keadaan: "baik",
        catatan: "",
        tanggal_pencatatan: new Date().toISOString().split("T")[0],
    });

    const openUpdateKondisiModal = (item) => {
        setSelectedItem(item);
        kondisiForm.setData({
            keadaan: item.keadaan,
            catatan: "",
            tanggal_pencatatan: new Date().toISOString().split("T")[0],
        });
        setIsUpdateKondisiModalOpen(true);
    };

    const handleUpdateKondisiSubmit = (e) => {
        e.preventDefault();
        kondisiForm.post(
            route("detail-inventaris.update-kondisi", selectedItem.id),
            {
                onSuccess: () => {
                    setIsUpdateKondisiModalOpen(false);
                    setSelectedItem(null);
                    kondisiForm.reset();
                    toast.success("Kondisi barang berhasil diperbarui");
                },
                onError: () => toast.error("Gagal memperbarui kondisi"),
            },
        );
    };

    // Pinjam aset modal
    const [isPinjamModalOpen, setIsPinjamModalOpen] = useState(false);
    const pinjamForm = useForm({
        detail_aset_id: "",
        nama_peminjam: "",
        institusi: "",
        keperluan: "",
        tanggal_pinjam: new Date().toISOString().split("T")[0],
        tanggal_kembali_rencana: "",
        catatan: "",
        surat_peminjaman: null,
    });

    const openPinjamModal = (item) => {
        setSelectedItem(item);
        pinjamForm.setData({ ...pinjamForm.data, detail_aset_id: item.id });
        setIsPinjamModalOpen(true);
    };

    const handlePinjamSubmit = (e) => {
        e.preventDefault();
        pinjamForm.post(route("inventaris.peminjaman.store"), {
            forceFormData: true,
            onSuccess: () => {
                setIsPinjamModalOpen(false);
                setSelectedItem(null);
                pinjamForm.reset();
                toast.success("Peminjaman berhasil dicatat");
            },
            onError: () => toast.error("Gagal mencatat peminjaman"),
        });
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSubmit = (e) => {
        e.preventDefault();
        deleteForm.delete(route("detail-inventaris.destroy", selectedItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
                toast.success("Aset berhasil dihapus");
            },
            onError: () => toast.error("Gagal menghapus aset"),
        });
    };

    // DELETE Form
    const deleteForm = useForm({});

    const handleFileChange = (e, form) => {
        form.setData("foto", e.target.files[0]);
    };

    return (
        <DashboardLayout>
            <Head title="Daftar Inventaris" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex items-center justify-between border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Daftar Aset Laboratorium
                    </h2>
                    <div className="flex items-center gap-2">
                        {canCreate && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            >
                                Tambah Aset
                            </button>
                        )}
                        <a
                            href={route("inventaris.export-excel", {
                                lab_id: filters.lab_id,
                            })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 text-sm font-medium"
                        >
                            <FileDown className="w-4 h-4" />
                            Export Excel
                        </a>
                        <button
                            onClick={() => openLabelConfigModal("all")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Download Semua Label
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={onSearchChange}
                            placeholder="Cari kode barang atau nama kategori..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Search className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="w-full md:w-48">
                        <select
                            value={selectedCategory}
                            onChange={onCategoryChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nama}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Per Page */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 whitespace-nowrap">
                            Tampilkan:
                        </label>
                        <select
                            value={perPage}
                            onChange={onPerPageChange}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>

                    {/* Link to Category Management */}
                    {canManageKategori && (
                        <Link
                            href={route("data-master.kategori-aset.index")}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                        >
                            Kelola Kategori
                        </Link>
                    )}
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.length} item terpilih
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openLabelConfigModal("selected")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Download Label ({selectedIds.length})
                            </button>
                            {canDelete && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus ({selectedIds.length})
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Batal Pilih
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Barang
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Foto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kode Barang
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kategori
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tgl Perolehan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asal Barang
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kondisi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    QR Code
                                </th>
                                {(canUpdate || canDelete) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventaris.data.length > 0 ? (
                                inventaris.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${selectedIds.includes(item.id) ? "!bg-blue-50" : ""}`}
                                    >
                                        <td className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    item.id,
                                                )}
                                                onChange={() =>
                                                    toggleSelect(item.id)
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {inventaris.from + index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.nama || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.foto ? (
                                                <img
                                                    src={`/storage/${item.foto}`}
                                                    alt={item.kode_barang}
                                                    className="h-10 w-10 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                    <svg
                                                        className="h-6 w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.kode_barang}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.kategori_aset?.nama || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.tanggal_perolehan
                                                ? new Date(
                                                      item.tanggal_perolehan,
                                                  ).toLocaleDateString("id-ID")
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.asal_barang ? (
                                                <span className="capitalize">
                                                    {item.asal_barang.replace(
                                                        "_",
                                                        " ",
                                                    )}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    item.keadaan === "baik"
                                                        ? "bg-green-100 text-green-800"
                                                        : item.keadaan ===
                                                            "rusak"
                                                          ? "bg-red-100 text-red-800"
                                                          : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {item.keadaan === "baik"
                                                    ? "Baik"
                                                    : item.keadaan === "rusak"
                                                      ? "Rusak"
                                                      : "Hilang"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${item.status === "tersedia" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
                                            >
                                                {item.status === "tersedia"
                                                    ? "Tersedia"
                                                    : "Dipinjam"}
                                            </span>
                                        </td>
                                        {/* QR Code Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.qr_code_path ? (
                                                <button
                                                    onClick={() =>
                                                        openQrPreview(item)
                                                    }
                                                    className="group relative"
                                                    title="Lihat QR Code"
                                                >
                                                    <img
                                                        src={`/storage/${item.qr_code_path}`}
                                                        alt={`QR ${item.kode_barang}`}
                                                        className="h-10 w-10 rounded border border-gray-200 group-hover:border-blue-400 group-hover:shadow-md transition-all duration-200"
                                                    />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">
                                                    Belum ada
                                                </span>
                                            )}
                                        </td>

                                        {(canUpdate || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    {/* Riwayat Kondisi */}
                                                    <button
                                                        onClick={() =>
                                                            openRiwayatModal(
                                                                item,
                                                            )
                                                        }
                                                        className="text-gray-500 hover:text-gray-800 p-1 rounded-full transition-colors"
                                                        title="Riwayat Kondisi"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </button>
                                                    {canUpdate && (
                                                        <>
                                                            {/* Update Kondisi */}
                                                            <button
                                                                onClick={() =>
                                                                    openUpdateKondisiModal(
                                                                        item,
                                                                    )
                                                                }
                                                                className="text-orange-500 hover:text-orange-700 p-1 rounded-full transition-colors"
                                                                title="Update Kondisi"
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
                                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            {/* Pinjam */}
                                                            {item.status ===
                                                                "tersedia" &&
                                                                item.keadaan !==
                                                                    "hilang" && (
                                                                    <button
                                                                        onClick={() =>
                                                                            openPinjamModal(
                                                                                item,
                                                                            )
                                                                        }
                                                                        className="text-purple-600 hover:text-purple-800 p-1 rounded-full transition-colors"
                                                                        title="Catat Peminjaman"
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
                                                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            {/* Edit */}
                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        item,
                                                                    )
                                                                }
                                                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full transition-colors"
                                                                title="Edit Aset"
                                                            >
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* Download Label Button */}
                                                    <a
                                                        href={route(
                                                            "detail-inventaris.label-download",
                                                            item.id,
                                                        )}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full transition-colors"
                                                        title="Download Label QR"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                    </a>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    item,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900 p-1 rounded-full transition-colors"
                                                            title="Hapus Aset"
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
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
                                            canUpdate || canDelete ? "12" : "11"
                                        }
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        Tidak ada data inventaris.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {inventaris.links && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">
                                Menampilkan {inventaris.from} - {inventaris.to}{" "}
                                dari {inventaris.total} data
                            </span>
                            <div className="flex gap-1">
                                {inventaris.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            handlePageChange(link.url)
                                        }
                                        disabled={!link.url || link.active}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? "bg-blue-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"} ${!link.url ? "opacity-50" : ""}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Modal */}
                <Modal
                    show={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    maxWidth="lg"
                >
                    <div className="max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                            <h3 className="text-lg font-medium text-gray-900">
                                Tambah Aset Baru
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <form
                            onSubmit={handleCreateSubmit}
                            className="p-6 space-y-4 overflow-y-auto"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kategori Aset *
                                </label>
                                <select
                                    value={createForm.data.kategori_aset_id}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "kategori_aset_id",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nama}
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.kategori_aset_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.kategori_aset_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Barang
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.nama}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nama",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Opsional (jika berbeda dengan kategori)"
                                />
                                {createForm.errors.nama && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kode Barang *
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.kode_barang}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "kode_barang",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                                {createForm.errors.kode_barang && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.kode_barang}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Perolehan
                                    </label>
                                    <input
                                        type="date"
                                        value={
                                            createForm.data.tanggal_perolehan
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                "tanggal_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    {createForm.errors.tanggal_perolehan && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                createForm.errors
                                                    .tanggal_perolehan
                                            }
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Harga Perolehan (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={createForm.data.harga_perolehan}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "harga_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {createForm.errors.harga_perolehan && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {createForm.errors.harga_perolehan}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Asal Barang
                                </label>
                                <select
                                    value={createForm.data.asal_barang}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "asal_barang",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">
                                        -- Pilih Asal Barang --
                                    </option>
                                    <option value="pengadaan">Pengadaan</option>
                                    <option value="hibah">Hibah</option>
                                    <option value="pembelian_mandiri">
                                        Pembelian Mandiri
                                    </option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                {createForm.errors.asal_barang && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.asal_barang}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Dari Permohonan / Wishlist
                                </label>
                                <select
                                    value={createForm.data.wishlist_aset_id}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "wishlist_aset_id",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">
                                        -- Tidak dari permohonan --
                                    </option>
                                    {approvedWishlist.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.nama_barang} —{" "}
                                            {w.permohonan_aset
                                                ?.nomor_permohonan ?? ""}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Pilih jika barang ini realisasi dari
                                    permohonan yang disetujui
                                </p>
                                {createForm.errors.wishlist_aset_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.wishlist_aset_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kondisi
                                    </label>
                                    <select
                                        value={createForm.data.keadaan}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "keadaan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="baik">Baik</option>
                                        <option value="rusak">Rusak</option>
                                        <option value="hilang">Hilang</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        value={createForm.data.status}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="tersedia">
                                            Tersedia
                                        </option>
                                        <option value="dipinjam">
                                            Dipinjam
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keterangan
                                </label>
                                <textarea
                                    value={createForm.data.keterangan}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "keterangan",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Foto
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        handleFileChange(e, createForm)
                                    }
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {createForm.errors.foto && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {createForm.errors.foto}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {createForm.processing
                                        ? "Menyimpan..."
                                        : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    show={isEditModalOpen && !!selectedItem}
                    onClose={() => setIsEditModalOpen(false)}
                    maxWidth="lg"
                >
                    <div className="max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Edit Aset
                                </h3>
                                {selectedItem?.wishlist_aset
                                    ?.permohonan_aset && (
                                    <a
                                        href={route(
                                            "inventaris.permohonan.show",
                                            selectedItem.wishlist_aset
                                                .permohonan_aset.id,
                                        )}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        title="Lihat permohonan asal"
                                    >
                                        <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Dari Permohonan:{" "}
                                        {
                                            selectedItem.wishlist_aset
                                                .permohonan_aset
                                                .nomor_permohonan
                                        }
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <form
                            onSubmit={handleEditSubmit}
                            className="p-6 space-y-4 overflow-y-auto"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kategori Aset *
                                </label>
                                <select
                                    value={editForm.data.kategori_aset_id}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "kategori_aset_id",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nama}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.kategori_aset_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.kategori_aset_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Barang
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.nama}
                                    onChange={(e) =>
                                        editForm.setData("nama", e.target.value)
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Opsional"
                                />
                                {editForm.errors.nama && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kode Barang *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.kode_barang}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "kode_barang",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                                {editForm.errors.kode_barang && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.kode_barang}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Perolehan
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.data.tanggal_perolehan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "tanggal_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    {editForm.errors.tanggal_perolehan && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {editForm.errors.tanggal_perolehan}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Harga Perolehan (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.data.harga_perolehan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "harga_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {editForm.errors.harga_perolehan && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {editForm.errors.harga_perolehan}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Asal Barang
                                </label>
                                <select
                                    value={editForm.data.asal_barang}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "asal_barang",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">
                                        -- Pilih Asal Barang --
                                    </option>
                                    <option value="pengadaan">Pengadaan</option>
                                    <option value="hibah">Hibah</option>
                                    <option value="pembelian_mandiri">
                                        Pembelian Mandiri
                                    </option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                {editForm.errors.asal_barang && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.asal_barang}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Dari Permohonan / Wishlist
                                </label>
                                <select
                                    value={editForm.data.wishlist_aset_id}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "wishlist_aset_id",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">
                                        -- Tidak dari permohonan --
                                    </option>
                                    {approvedWishlist.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.nama_barang} —{" "}
                                            {w.permohonan_aset
                                                ?.nomor_permohonan ?? ""}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.wishlist_aset_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.wishlist_aset_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kondisi
                                    </label>
                                    <select
                                        value={editForm.data.keadaan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "keadaan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="baik">Baik</option>
                                        <option value="rusak">Rusak</option>
                                        <option value="hilang">Hilang</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="tersedia">
                                            Tersedia
                                        </option>
                                        <option value="dipinjam">
                                            Dipinjam
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keterangan
                                </label>
                                <textarea
                                    value={editForm.data.keterangan}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "keterangan",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Foto
                                </label>
                                <div className="mt-1 mb-2">
                                    {selectedItem?.foto &&
                                        !editForm.data.foto && (
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    Foto saat ini:
                                                </p>
                                                <img
                                                    src={`/storage/${selectedItem?.foto}`}
                                                    alt="Current"
                                                    className="h-16 w-16 object-cover rounded"
                                                />
                                            </div>
                                        )}
                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            handleFileChange(e, editForm)
                                        }
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                {editForm.errors.foto && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {editForm.errors.foto}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Delete Modal */}
                <Modal
                    show={isDeleteModalOpen && !!selectedItem}
                    onClose={() => setIsDeleteModalOpen(false)}
                    maxWidth="md"
                >
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Hapus Aset
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus aset dengan kode{" "}
                            <strong>{selectedItem?.kode_barang}</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSubmit}
                                disabled={deleteForm.processing}
                                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {deleteForm.processing
                                    ? "Menghapus..."
                                    : "Hapus"}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* QR Preview Modal */}
                <Modal
                    show={isQrPreviewOpen && !!selectedItem}
                    onClose={() => {
                        setIsQrPreviewOpen(false);
                        setSelectedItem(null);
                    }}
                    maxWidth="sm"
                >
                    <div className="flex justify-between items-center p-5 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                            QR Code - {selectedItem?.kode_barang}
                        </h3>
                        <button
                            onClick={() => {
                                setIsQrPreviewOpen(false);
                                setSelectedItem(null);
                            }}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6 flex flex-col items-center">
                        {selectedItem?.qr_code_path ? (
                            <img
                                src={`/storage/${selectedItem?.qr_code_path}`}
                                alt={`QR ${selectedItem?.kode_barang}`}
                                className="w-48 h-48 border border-gray-200 rounded-lg shadow-sm"
                            />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                QR belum tersedia
                            </div>
                        )}
                        <p className="mt-3 text-sm text-gray-500">
                            Scan untuk melihat detail aset
                        </p>
                    </div>
                    <div className="p-4 border-t flex gap-2 justify-center">
                        {selectedItem && (
                            <>
                                <a
                                    href={route(
                                        "detail-inventaris.qr-download",
                                        selectedItem.id,
                                    )}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Download QR
                                </a>
                                <a
                                    href={route(
                                        "detail-inventaris.label-download",
                                        selectedItem.id,
                                    )}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                        />
                                    </svg>
                                    Download Label
                                </a>
                            </>
                        )}
                    </div>
                </Modal>

                {/* Label Config Modal */}
                <Modal
                    show={isLabelConfigModalOpen}
                    onClose={() => setIsLabelConfigModalOpen(false)}
                    maxWidth="sm"
                >
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                            Konfigurasi Label (
                            {labelConfigMode === "all"
                                ? "Semua Data"
                                : `${selectedIds.length} Item`}
                            )
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Atur tampilan label sebelum download.
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ukuran / Layout
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="layout"
                                        value="standard"
                                        checked={
                                            labelConfig.layout === "standard"
                                        }
                                        onChange={(e) =>
                                            setLabelConfig({
                                                ...labelConfig,
                                                layout: e.target.value,
                                            })
                                        }
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Standar (3 Kolom) - ~7cm
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="layout"
                                        value="medium"
                                        checked={
                                            labelConfig.layout === "medium"
                                        }
                                        onChange={(e) =>
                                            setLabelConfig({
                                                ...labelConfig,
                                                layout: e.target.value,
                                            })
                                        }
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Medium (4 Kolom) - ~5cm
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="layout"
                                        value="small"
                                        checked={labelConfig.layout === "small"}
                                        onChange={(e) =>
                                            setLabelConfig({
                                                ...labelConfig,
                                                layout: e.target.value,
                                            })
                                        }
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Kecil (5 Kolom) - ~4cm
                                    </span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="layout"
                                        value="mini"
                                        checked={labelConfig.layout === "mini"}
                                        onChange={(e) =>
                                            setLabelConfig({
                                                ...labelConfig,
                                                layout: e.target.value,
                                            })
                                        }
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Mini (6 Kolom) - ~3.3cm
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={labelConfig.show_qr}
                                    onChange={(e) =>
                                        setLabelConfig({
                                            ...labelConfig,
                                            show_qr: e.target.checked,
                                        })
                                    }
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Tampilkan QR Code
                                </span>
                            </label>
                            {!labelConfig.show_qr && (
                                <p className="text-xs text-blue-600 mt-1 ml-6">
                                    Label akan menjadi lebih ramping jika QR
                                    disembunyikan.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
                        <button
                            onClick={() => setIsLabelConfigModalOpen(false)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDownloadLabels}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                        >
                            Download PDF
                        </button>
                    </div>
                </Modal>

                {/* Riwayat Kondisi Modal */}
                <Modal
                    show={isRiwayatModalOpen}
                    onClose={() => setIsRiwayatModalOpen(false)}
                    maxWidth="2xl"
                >
                    <div className="max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Riwayat Kondisi Aset
                                </h3>
                                {selectedItem && (
                                    <p className="text-sm text-gray-500">
                                        {selectedItem.kode_barang} —{" "}
                                        {selectedItem.kategori_aset?.nama}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsRiwayatModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {riwayatLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <svg
                                        className="animate-spin h-8 w-8 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    <span className="ml-3 text-gray-500">
                                        Memuat riwayat...
                                    </span>
                                </div>
                            ) : riwayatData.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <svg
                                        className="mx-auto h-12 w-12 mb-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.5"
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <p>
                                        Belum ada riwayat kondisi untuk aset ini
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {riwayatData.map((r, idx) => (
                                        <div
                                            key={r.id ?? idx}
                                            className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50"
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                                                ${r.kondisi_sesudah === "baik" ? "bg-green-500" : r.kondisi_sesudah === "rusak" ? "bg-red-500" : "bg-gray-500"}`}
                                                >
                                                    {idx + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {r.kondisi_sebelum ? (
                                                        <>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs rounded-full font-medium
                                                            ${r.kondisi_sebelum === "baik" ? "bg-green-100 text-green-800" : r.kondisi_sebelum === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                                                            >
                                                                {r.kondisi_sebelum
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    r.kondisi_sebelum.slice(
                                                                        1,
                                                                    )}
                                                            </span>
                                                            <svg
                                                                className="w-4 h-4 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Kondisi awal
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded-full font-medium
                                                    ${r.kondisi_sesudah === "baik" ? "bg-green-100 text-green-800" : r.kondisi_sesudah === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                                                    >
                                                        {r.kondisi_sesudah
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            r.kondisi_sesudah.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </div>
                                                {r.catatan && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {r.catatan}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {r.pencatat?.name ??
                                                        "Sistem"}{" "}
                                                    &bull;{" "}
                                                    {new Date(
                                                        r.created_at,
                                                    ).toLocaleString("id-ID")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex-shrink-0">
                            <button
                                onClick={() => setIsRiwayatModalOpen(false)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Update Kondisi Modal */}
                <Modal
                    show={isUpdateKondisiModalOpen && !!selectedItem}
                    onClose={() => setIsUpdateKondisiModalOpen(false)}
                    maxWidth="md"
                >
                    <div className="flex justify-between items-center p-6 border-b">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Update Kondisi Aset
                            </h3>
                            <p className="text-sm text-gray-500">
                                {selectedItem?.kode_barang}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsUpdateKondisiModalOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <form
                        onSubmit={handleUpdateKondisiSubmit}
                        className="p-6 space-y-4"
                    >
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 text-sm">
                            <span className="text-gray-500">
                                Kondisi saat ini:
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium
                                ${selectedItem?.keadaan === "baik" ? "bg-green-100 text-green-800" : selectedItem?.keadaan === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                            >
                                {selectedItem?.keadaan
                                    ?.charAt(0)
                                    .toUpperCase() +
                                    selectedItem?.keadaan?.slice(1)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Kondisi Baru *
                            </label>
                            <select
                                value={kondisiForm.data.keadaan}
                                onChange={(e) =>
                                    kondisiForm.setData(
                                        "keadaan",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                required
                            >
                                <option value="baik">Baik</option>
                                <option value="rusak">Rusak</option>
                                <option value="hilang">Hilang</option>
                            </select>
                            {kondisiForm.errors.keadaan && (
                                <p className="mt-1 text-sm text-red-600">
                                    {kondisiForm.errors.keadaan}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Catatan
                            </label>
                            <textarea
                                value={kondisiForm.data.catatan}
                                onChange={(e) =>
                                    kondisiForm.setData(
                                        "catatan",
                                        e.target.value,
                                    )
                                }
                                rows="3"
                                placeholder="Deskripsikan kondisi, penyebab kerusakan, dll..."
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            />
                            {kondisiForm.errors.catatan && (
                                <p className="mt-1 text-sm text-red-600">
                                    {kondisiForm.errors.catatan}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Pencatatan
                            </label>
                            <input
                                type="date"
                                value={kondisiForm.data.tanggal_pencatatan}
                                onChange={(e) =>
                                    kondisiForm.setData(
                                        "tanggal_pencatatan",
                                        e.target.value,
                                    )
                                }
                                max={new Date().toISOString().split("T")[0]}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                required
                            />
                            {kondisiForm.errors.tanggal_pencatatan && (
                                <p className="mt-1 text-sm text-red-600">
                                    {kondisiForm.errors.tanggal_pencatatan}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsUpdateKondisiModalOpen(false)
                                }
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={kondisiForm.processing}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-sm hover:bg-orange-700 disabled:opacity-50"
                            >
                                {kondisiForm.processing
                                    ? "Menyimpan..."
                                    : "Update Kondisi"}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Pinjam Aset Modal */}
                <Modal
                    show={isPinjamModalOpen && !!selectedItem}
                    onClose={() => setIsPinjamModalOpen(false)}
                    maxWidth="lg"
                >
                    <div className="max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Catat Peminjaman Aset
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {selectedItem?.kode_barang} —{" "}
                                    {selectedItem?.kategori_aset?.nama}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPinjamModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <form
                            onSubmit={handlePinjamSubmit}
                            className="p-6 space-y-4 overflow-y-auto"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Peminjam *
                                </label>
                                <input
                                    type="text"
                                    value={pinjamForm.data.nama_peminjam}
                                    onChange={(e) =>
                                        pinjamForm.setData(
                                            "nama_peminjam",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    required
                                />
                                {pinjamForm.errors.nama_peminjam && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {pinjamForm.errors.nama_peminjam}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Institusi / Unit
                                </label>
                                <input
                                    type="text"
                                    value={pinjamForm.data.institusi}
                                    onChange={(e) =>
                                        pinjamForm.setData(
                                            "institusi",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                                {pinjamForm.errors.institusi && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {pinjamForm.errors.institusi}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keperluan *
                                </label>
                                <textarea
                                    value={pinjamForm.data.keperluan}
                                    onChange={(e) =>
                                        pinjamForm.setData(
                                            "keperluan",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    required
                                />
                                {pinjamForm.errors.keperluan && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {pinjamForm.errors.keperluan}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Pinjam *
                                    </label>
                                    <input
                                        type="date"
                                        value={pinjamForm.data.tanggal_pinjam}
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "tanggal_pinjam",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                    {pinjamForm.errors.tanggal_pinjam && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {pinjamForm.errors.tanggal_pinjam}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Rencana Kembali *
                                    </label>
                                    <input
                                        type="date"
                                        value={
                                            pinjamForm.data
                                                .tanggal_kembali_rencana
                                        }
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "tanggal_kembali_rencana",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                    {pinjamForm.errors
                                        .tanggal_kembali_rencana && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                pinjamForm.errors
                                                    .tanggal_kembali_rencana
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Upload Surat Peminjaman
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        pinjamForm.setData(
                                            "surat_peminjaman",
                                            e.target.files[0],
                                        )
                                    }
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Format: PDF, DOC, DOCX, JPG, PNG
                                </p>
                                {pinjamForm.errors.surat_peminjaman && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {pinjamForm.errors.surat_peminjaman}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Catatan
                                </label>
                                <textarea
                                    value={pinjamForm.data.catatan}
                                    onChange={(e) =>
                                        pinjamForm.setData(
                                            "catatan",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPinjamModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinjamForm.processing}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {pinjamForm.processing
                                        ? "Menyimpan..."
                                        : "Catat Peminjaman"}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Bulk Delete Confirmation Modal */}
                <Modal
                    show={isBulkDeleteModalOpen}
                    onClose={() => setIsBulkDeleteModalOpen(false)}
                    maxWidth="md"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Hapus Aset Massal
                            </h3>
                        </div>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus{" "}
                            <strong>{selectedIds.length} aset</strong> terpilih?
                            Semua data termasuk foto dan QR code akan ikut
                            dihapus. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                onClick={executeBulkDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700"
                            >
                                Hapus {selectedIds.length} Aset
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
