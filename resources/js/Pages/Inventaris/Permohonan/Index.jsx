import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useState } from "react";
import { toast } from "sonner";

export default function PermohonanIndex({ permohonan, filters }) {
    const { auth, laboratorium: labList } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [perPage, setPerPage] = useState(filters.perPage || 10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Bulk selection
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

    // Form handling
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

    // Debounced filter
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
                toast.success("Permohonan berhasil diajukan");
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

    const statusBadge = (status) => {
        const map = {
            disetujui: "bg-green-100 text-green-800",
            ditolak: "bg-red-100 text-red-800",
            diajukan: "bg-yellow-100 text-yellow-800",
        };
        return map[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <DashboardLayout>
            <Head title="Permohonan Aset" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Permohonan Aset
                    </h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                        Buat Permohonan
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                    {/* Search */}
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

                    {/* Status Filter */}
                    <div className="w-full md:w-44">
                        <select
                            value={statusFilter}
                            onChange={onStatusChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="diajukan">Diajukan</option>
                            <option value="disetujui">Disetujui</option>
                            <option value="ditolak">Ditolak</option>
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
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.length} item terpilih
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                                Hapus ({selectedIds.length})
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
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${statusBadge(item.status_permohonan)}`}
                                            >
                                                {item.status_permohonan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            "inventaris.permohonan.show",
                                                            item.id,
                                                        ),
                                                    )
                                                }
                                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors focus:outline-none"
                                                title="Lihat Detail"
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
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                            </button>
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

                {/* Pagination */}
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

            {/* Create Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="overflow-y-auto max-h-[85vh]">
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Buat Permohonan Aset
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
                        {/* General Info */}
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

                        {/* Items */}
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
        </DashboardLayout>
    );
}
