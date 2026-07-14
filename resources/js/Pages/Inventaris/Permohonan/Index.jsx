import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye, Edit } from "lucide-react";

export default function PermohonanIndex({ permohonan, filters }) {
    const { auth, laboratorium: labList } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [perPage, setPerPage] = useState(filters.perPage || 10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPermohonan, setEditPermohonan] = useState(null);

    const editForm = useForm({ ...useForm().data });
    const openEditModal = (item) => {
        setEditPermohonan(item);
        editForm.setData({
            alasan_umum_pengadaan: item.alasan_umum_pengadaan,
            items: (item.wishlist_aset || []).map((w) => ({
                id: w.id,
                nama_barang: w.nama_barang,
                jenis_barang: w.jenis_barang || "",
                spesifikasi_teknis: w.spesifikasi_teknis || "",
                perkiraan_harga: w.perkiraan_harga || "",
                jumlah_diminta: w.jumlah_diminta,
                satuan: w.satuan || "unit",
                urgensi: w.urgensi || "sedang",
                referensi_url: w.referensi_url || "",
            })),
        });
        setIsEditModalOpen(true);
    };
    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route("inventaris.permohonan.update", editPermohonan.id), {
            onSuccess: () => {
                toast.success("Draft permohonan berhasil diperbarui");
                setIsEditModalOpen(false);
                setEditPermohonan(null);
            },
            onError: (err) => {
                toast.error("Gagal memperbarui draft, periksa kembali inputan Anda.");
                console.error(err);
            },
        });
    };
    const addEditItem = () => {
        editForm.setData("items", [
            ...editForm.data.items,
            {
                id: undefined,
                nama_barang: "",
                jenis_barang: "",
                spesifikasi_teknis: "",
                perkiraan_harga: "",
                jumlah_diminta: 1,
                satuan: "unit",
                urgensi: "sedang",
                referensi_url: "",
            },
        ]);
    };
    const removeEditItem = (index) => {
        const newItems = editForm.data.items.filter((_, i) => i !== index);
        editForm.setData("items", newItems);
    };
    const updateEditItem = (index, field, value) => {
        const newItems = [...editForm.data.items];
        newItems[index][field] = value;
        editForm.setData("items", newItems);
    };

    
    const [selectedIds, setSelectedIds] = useState([]);
    const allSelected =
        permohonan.data.length > 0 &&
        selectedIds.length === permohonan.data.length;
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(permohonan.data.map((i) => i.id));
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
            route("inventaris.permohonan.bulk-delete"),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsBulkDeleteModalOpen(false);
                    toast.success("Permohonan terpilih berhasil dihapus");
                },
                preserveScroll: true,
            },
        );
    };

    
    const { data, setData, post, processing, errors, reset } = useForm({
        laboratorium_id: filters.lab_id || auth.user.laboratory?.id || "",
        alasan_umum_pengadaan: "",
        items: [
            {
                nama_barang: "",
                jenis_barang: "",
                spesifikasi_teknis: "",
                perkiraan_harga: "",
                jumlah_diminta: 1,
                satuan: "unit",
                urgensi: "sedang",
                referensi_url: "",
            },
        ],
    });

    
    const applyFilters = debounce((search, status, pageSize) => {
        router.get(
            route("inventaris.permohonan.index"),
            {
                search,
                status,
                perPage: pageSize,
                lab_id: filters.lab_id,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);

    const onSearchChange = (e) => {
        setSearchTerm(e.target.value);
        applyFilters(e.target.value, statusFilter, perPage);
    };
    const onStatusChange = (e) => {
        setStatusFilter(e.target.value);
        applyFilters(searchTerm, e.target.value, perPage);
    };
    const onPerPageChange = (e) => {
        setPerPage(e.target.value);
        applyFilters(searchTerm, statusFilter, e.target.value);
    };
    const handlePageChange = (url) => {
        if (url)
            router.visit(url, { preserveState: true, preserveScroll: true });
    };

    const addItem = () => {
        setData("items", [
            ...data.items,
            {
                nama_barang: "",
                jenis_barang: "",
                spesifikasi_teknis: "",
                perkiraan_harga: "",
                jumlah_diminta: 1,
                satuan: "unit",
                urgensi: "sedang",
                referensi_url: "",
            },
        ]);
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData("items", newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData("items", newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventaris.permohonan.store"), {
            onSuccess: () => {
                toast.success("Draft permohonan berhasil disimpan. Buka detail untuk mengajukan.");
                setIsCreateModalOpen(false);
                reset();
            },
            onError: (err) => {
                toast.error(
                    "Gagal mengajukan permohonan, periksa kembali inputan Anda.",
                );
                console.error(err);
            },
        });
    };

    const STATUS_MAP = {
        draft:           { cls: "bg-gray-100 text-gray-700",    label: "Draft" },
        diajukan:        { cls: "bg-yellow-100 text-yellow-800", label: "Menunggu Review" },
        disetujui_kalab: { cls: "bg-blue-100 text-blue-800",    label: "Disetujui Kalab" },
        ditolak_kalab:   { cls: "bg-red-100 text-red-800",      label: "Ditolak Kalab" },
        disetujui_kadep: { cls: "bg-green-100 text-green-800",  label: "Disetujui Kadep" },
        ditolak_kadep:   { cls: "bg-red-200 text-red-900",      label: "Ditolak Kadep" },
    };
    const statusBadge = (status) => STATUS_MAP[status]?.cls ?? "bg-gray-100 text-gray-800";
    const statusLabel = (status) => STATUS_MAP[status]?.label ?? status;

    return (
        <DashboardLayout>
            <Head title="Permohonan Aset" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Permohonan Aset
                    </h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                        Buat Draft Permohonan
                    </button>
                </div>

                
                <div className="p-4 border-b space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={onSearchChange}
                            placeholder="Cari nomor permohonan..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    
                    <div className="w-full md:w-44">
                        <select
                            value={statusFilter}
                            onChange={onStatusChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="diajukan">Menunggu Review Kalab</option>
                            <option value="disetujui_kalab">Disetujui Kalab</option>
                            <option value="ditolak_kalab">Ditolak Kalab</option>
                            <option value="disetujui_kadep">Disetujui Kadep (Final)</option>
                            <option value="ditolak_kadep">Ditolak Kadep</option>
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
                </div>

                
                {selectedIds.length > 0 && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.length} item terpilih
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Hapus"
                                onClick={handleBulkDelete}
                                
                            >
    <Trash2 className="w-4 h-4" />
</button>
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
                                    No Permohonan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pemohon
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Laboratorium
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {permohonan.data.length > 0 ? (
                                permohonan.data.map((item, index) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.nomor_permohonan}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(
                                                item.tanggal_permohonan,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.user_pemohon?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.laboratorium?.nama || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusBadge(item.status_permohonan)}`}>
                                                {statusLabel(item.status_permohonan)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    onClick={() => router.visit(route("inventaris.permohonan.show", item.id))}
                                                    
                                                    title="Lihat Detail"
                                                >
    <Eye className="w-4 h-4" />
</button>
                                                {item.status_permohonan === "draft" && (
                                                    <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit Draft"
                                                    >
    <Edit className="w-4 h-4" />
</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        Belum ada permohonan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                
                {permohonan.links && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">
                                Menampilkan {permohonan.from || 0} -{" "}
                                {permohonan.to || 0} dari{" "}
                                {permohonan.total || 0} data
                            </span>
                            <div className="flex gap-1">
                                {permohonan.links.map((link, i) => (
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
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="overflow-y-auto max-h-[85vh]">
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Buat Draft Permohonan Aset
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alasan Pengadaan (Umum)
                            </label>
                            <textarea
                                value={data.alasan_umum_pengadaan}
                                onChange={(e) =>
                                    setData(
                                        "alasan_umum_pengadaan",
                                        e.target.value,
                                    )
                                }
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                required
                                placeholder="Jelaskan alasan umum kebutuhan pengadaan aset ini..."
                            />
                            {errors.alasan_umum_pengadaan && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.alasan_umum_pengadaan}
                                </div>
                            )}
                        </div>

                        
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-800">
                                    Daftar Barang
                                </h3>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                    + Tambah Barang
                                </button>
                            </div>

                            {data.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200 relative"
                                >
                                    {data.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">
                                                Nama Barang *
                                            </label>
                                            <input
                                                type="text"
                                                value={item.nama_barang}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "nama_barang",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                            {errors[
                                                `items.${index}.nama_barang`
                                            ] && (
                                                <div className="text-red-500 text-xs mt-1">
                                                    {
                                                        errors[
                                                            `items.${index}.nama_barang`
                                                        ]
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">
                                                Jenis Barang
                                            </label>
                                            <input
                                                type="text"
                                                value={item.jenis_barang}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "jenis_barang",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Elektronik"
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">
                                                Spesifikasi Teknis
                                            </label>
                                            <input
                                                type="text"
                                                value={item.spesifikasi_teknis}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "spesifikasi_teknis",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">
                                                Perkiraan Harga (Rp)
                                            </label>
                                            <input
                                                type="number"
                                                value={item.perkiraan_harga}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "perkiraan_harga",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700">
                                                    Jumlah *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.jumlah_diminta}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            "jumlah_diminta",
                                                            parseInt(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div className="w-1/3">
                                                <label className="block text-xs font-medium text-gray-700">
                                                    Satuan
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.satuan}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            index,
                                                            "satuan",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">
                                                Urgensi
                                            </label>
                                            <select
                                                value={item.urgensi}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "urgensi",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="rendah">
                                                    Rendah
                                                </option>
                                                <option value="sedang">
                                                    Sedang
                                                </option>
                                                <option value="tinggi">
                                                    Tinggi
                                                </option>
                                                <option value="sangat_tinggi">
                                                    Sangat Tinggi
                                                </option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className="block text-xs font-medium text-gray-700">
                                                Link Referensi (Opsional)
                                            </label>
                                            <input
                                                type="url"
                                                value={item.referensi_url}
                                                onChange={(e) =>
                                                    updateItem(
                                                        index,
                                                        "referensi_url",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://..."
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing
                                    ? "Mengirim..."
                                    : "Kirim Permohonan"}
                            </button>
                        </div>
                    </form>
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
                            Hapus Permohonan Massal
                        </h3>
                    </div>
                    <p className="text-gray-500 mb-6">
                        Apakah Anda yakin ingin menghapus{" "}
                        <strong>{selectedIds.length} permohonan</strong>{" "}
                        terpilih? Hanya permohonan dengan status "diajukan" yang
                        dapat dihapus.
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
                            Hapus {selectedIds.length} Permohonan
                        </button>
                    </div>
                </div>
            </Modal>

            
            <Modal
                show={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="overflow-y-auto max-h-[85vh]">
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Edit Draft Permohonan Aset
                        </h2>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} className="p-6">
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alasan Pengadaan (Umum)
                            </label>
                            <textarea
                                value={editForm.data.alasan_umum_pengadaan}
                                onChange={(e) => editForm.setData("alasan_umum_pengadaan", e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                required
                                placeholder="Jelaskan alasan umum kebutuhan pengadaan aset ini..."
                            />
                            {editForm.errors.alasan_umum_pengadaan && (
                                <div className="text-red-500 text-xs mt-1">{editForm.errors.alasan_umum_pengadaan}</div>
                            )}
                        </div>

                        
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-800">Daftar Barang</h3>
                                <button type="button" onClick={addEditItem} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                                    + Tambah Barang
                                </button>
                            </div>

                            {(editForm.data.items || []).map((item, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200 relative">
                                    {(editForm.data.items || []).length > 1 && (
                                        <button type="button" onClick={() => removeEditItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">&times;</button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Nama Barang *</label>
                                            <input type="text" value={item.nama_barang} onChange={(e) => updateEditItem(index, "nama_barang", e.target.value)}
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                                            {editForm.errors[`items.${index}.nama_barang`] && (
                                                <div className="text-red-500 text-xs mt-1">{editForm.errors[`items.${index}.nama_barang`]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Jenis Barang</label>
                                            <input type="text" value={item.jenis_barang} onChange={(e) => updateEditItem(index, "jenis_barang", e.target.value)}
                                                placeholder="Contoh: Elektronik" className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Spesifikasi Teknis</label>
                                            <input type="text" value={item.spesifikasi_teknis} onChange={(e) => updateEditItem(index, "spesifikasi_teknis", e.target.value)}
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Perkiraan Harga (Rp)</label>
                                            <input type="number" value={item.perkiraan_harga} onChange={(e) => updateEditItem(index, "perkiraan_harga", e.target.value)}
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-gray-700">Jumlah *</label>
                                                <input type="number" min="1" value={item.jumlah_diminta} onChange={(e) => updateEditItem(index, "jumlah_diminta", parseInt(e.target.value))}
                                                    className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                                            </div>
                                            <div className="w-1/3">
                                                <label className="block text-xs font-medium text-gray-700">Satuan</label>
                                                <input type="text" value={item.satuan} onChange={(e) => updateEditItem(index, "satuan", e.target.value)}
                                                    className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Urgensi</label>
                                            <select value={item.urgensi} onChange={(e) => updateEditItem(index, "urgensi", e.target.value)}
                                                className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                                <option value="rendah">Rendah</option>
                                                <option value="sedang">Sedang</option>
                                                <option value="tinggi">Tinggi</option>
                                                <option value="sangat_tinggi">Sangat Tinggi</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className="block text-xs font-medium text-gray-700">Link Referensi (Opsional)</label>
                                            <input type="url" value={item.referensi_url} onChange={(e) => updateEditItem(index, "referensi_url", e.target.value)}
                                                placeholder="https://..." className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Batal</button>
                            <button type="submit" disabled={editForm.processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {editForm.processing ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
