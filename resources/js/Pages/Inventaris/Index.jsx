import AsetDrawer from "@/Components/AsetDrawer";
import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { FileDown, Printer, Search, Trash2 } from "lucide-react";
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

    
    const canManageItems = can("inventaris.manage-items");
    const canManageKategori = can("inventaris.manage-kategori");
    const canCreate = canManageItems;
    const canUpdate = canManageItems;
    const canDelete = canManageItems;

    
    
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

    
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(
        filters.kategori_id || "",
    );
    const [perPage, setPerPage] = useState(filters.perPage || 10);

    
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
    
    const [isLabelConfigModalOpen, setIsLabelConfigModalOpen] = useState(false);
    const [labelConfigMode, setLabelConfigMode] = useState("selected"); 
    const [labelConfig, setLabelConfig] = useState({
        layout: "standard", 
        show_qr: true,
    });

    const openLabelConfigModal = (mode = "selected") => {
        setLabelConfigMode(mode);
        setIsLabelConfigModalOpen(true);
    };

    const handleDownloadLabels = () => {
        
        const url = route("detail-inventaris.batch-labels");

        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;
        form.target = "_blank"; 

        
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");
        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "_token";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        
        const scopeInput = document.createElement("input");
        scopeInput.type = "hidden";
        scopeInput.name = "scope";
        scopeInput.value = labelConfigMode;
        form.appendChild(scopeInput);

        if (labelConfigMode === "selected") {
            
            selectedIds.forEach((id) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = "ids[]";
                input.value = id;
                form.appendChild(input);
            });
        } else {
            
            
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
        
        
        if (labelConfigMode === "selected") setSelectedIds([]);
    };

    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAsetDrawerOpen, setIsAsetDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const openAsetDrawer = (item) => {
        setSelectedItem(item);
        setIsAsetDrawerOpen(true);
    };

    
    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    
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

                
                <div className="p-4 border-b space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    
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

                    
                    {canManageKategori && (
                        <Link
                            href={route("data-master.kategori-aset.index")}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                        >
                            Kelola Kategori
                        </Link>
                    )}
                </div>

                
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
                                    Kondisi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    QR Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
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
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.qr_code_path ? (
                                                <img
                                                    src={`/storage/${item.qr_code_path}`}
                                                    alt={`QR ${item.kode_barang}`}
                                                    className="h-10 w-10 rounded border border-gray-200"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">
                                                    Belum ada
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    openAsetDrawer(item)
                                                }
                                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            >
                                                Detail & Aksi
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        Tidak ada data inventaris.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                
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

                {isAsetDrawerOpen && selectedItem && (
                    <AsetDrawer
                        item={selectedItem}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        onClose={() => {
                            setIsAsetDrawerOpen(false);
                            setSelectedItem(null);
                        }}
                    />
                )}

                
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
