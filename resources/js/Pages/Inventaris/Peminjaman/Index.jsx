import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { ChevronDown, ChevronRight, ClipboardList, FileText, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function PeminjamanIndex({
    peminjaman,
    templates,
    asetTersedia = [],
    filters,
    flash,
}) {
    const { auth, laboratorium } = usePage().props;
    const { selectedLab } = useLab();
    const { canAny, isSuperAdmin, isKadep } = usePermission();

    
    
    const canManage = canAny([
        "inventaris.manage-peminjaman",
        "inventaris.manage-items",
    ]);
    const canManageTemplate = canManage;

    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "");

    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isKembalikanModalOpen, setIsKembalikanModalOpen] = useState(false);
    const [kembalikanMode, setKembalikanMode] = useState("transaction"); 
    const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState(null);

    
    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    
    useEffect(() => {
        if (selectedLab) {
            router.visit(route("inventaris.peminjaman.index"), {
                data: {
                    lab_id: selectedLab.id,
                    search: searchTerm,
                    status: statusFilter,
                    perPage: filters?.perPage,
                },
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [selectedLab]);

    
    const createForm = useForm({
        aset_ids: [],
        nama_peminjam: "",
        institusi: "",
        keperluan: "",
        tanggal_pinjam: new Date().toISOString().split("T")[0],
        tanggal_kembali_rencana: "",
        catatan: "",
        surat_peminjaman: null,
    });

    const kembalikanForm = useForm({
        tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
        kondisi_setelah_kembali: "",
        catatan_kembali: "",
    });

    const templateForm = useForm({
        nama_template: "",
        deskripsi: "",
        laboratorium_id: "",
        file: null,
    });

    const handleSearch = debounce((value) => {
        router.visit(route("inventaris.peminjaman.index"), {
            data: {
                search: value,
                status: statusFilter,
                lab_id: selectedLab?.id,
                perPage: filters?.perPage,
            },
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, 300);

    const applyFilters = (overrides = {}) => {
        router.visit(route("inventaris.peminjaman.index"), {
            data: {
                search: searchTerm,
                status: statusFilter,
                lab_id: selectedLab?.id,
                perPage: filters?.perPage,
                ...overrides,
            },
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    
    const [asetSearch, setAsetSearch] = useState("");
    const filteredAset = useMemo(() => {
        const q = asetSearch.trim().toLowerCase();
        if (!q) return asetTersedia;
        return asetTersedia.filter(
            (a) =>
                a.kode_barang?.toLowerCase().includes(q) ||
                a.nama?.toLowerCase().includes(q) ||
                a.kategori_aset?.nama?.toLowerCase().includes(q),
        );
    }, [asetSearch, asetTersedia]);

    const toggleAsetId = (id) => {
        const arr = createForm.data.aset_ids;
        createForm.setData(
            "aset_ids",
            arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
        );
    };

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData({
            aset_ids: [],
            nama_peminjam: "",
            institusi: "",
            keperluan: "",
            tanggal_pinjam: new Date().toISOString().split("T")[0],
            tanggal_kembali_rencana: "",
            catatan: "",
            surat_peminjaman: null,
        });
        setAsetSearch("");
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (createForm.data.aset_ids.length === 0) {
            toast.error("Pilih minimal 1 aset.");
            return;
        }
        createForm.post(route("inventaris.peminjaman.store"), {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                
            },
            onError: () => toast.error("Gagal mencatat peminjaman"),
            preserveScroll: true,
        });
    };

    
    const openKembalikanTransaksi = (item) => {
        setKembalikanMode("transaction");
        setSelectedPeminjaman(item);
        setSelectedItem(null);
        kembalikanForm.reset();
        kembalikanForm.setData({
            tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
            kondisi_setelah_kembali: "",
            catatan_kembali: "",
        });
        setIsKembalikanModalOpen(true);
    };

    const openKembalikanItem = (transaksi, itemData) => {
        setKembalikanMode("item");
        setSelectedPeminjaman(transaksi);
        setSelectedItem(itemData);
        kembalikanForm.reset();
        kembalikanForm.setData({
            tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
            kondisi_setelah_kembali: "",
            catatan_kembali: "",
        });
        setIsKembalikanModalOpen(true);
    };

    const handleKembalikanSubmit = (e) => {
        e.preventDefault();
        const url =
            kembalikanMode === "item"
                ? route(
                      "inventaris.peminjaman.kembalikan-item",
                      selectedItem.id,
                  )
                : route(
                      "inventaris.peminjaman.kembalikan",
                      selectedPeminjaman.id,
                  );
        kembalikanForm.post(url, {
            onSuccess: () => {
                setIsKembalikanModalOpen(false);
                setSelectedPeminjaman(null);
                setSelectedItem(null);
                
            },
            onError: () => toast.error("Gagal mencatat pengembalian"),
            preserveScroll: true,
        });
    };

    
    const handleTemplateSubmit = (e) => {
        e.preventDefault();
        templateForm.post(route("inventaris.template-surat.store"), {
            onSuccess: () => {
                setIsTemplateModalOpen(false);
                templateForm.reset();
                
            },
            onError: () => toast.error("Gagal mengupload template"),
            preserveScroll: true,
        });
    };

    const handleDeleteTemplate = (id) => {
        if (!confirm("Hapus template ini?")) return;
        router.delete(route("inventaris.template-surat.destroy", id), {
            
            preserveScroll: true,
        });
    };

    const handleDeletePeminjaman = (id) => {
        if (!confirm("Hapus catatan peminjaman ini?")) return;
        router.delete(route("inventaris.peminjaman.destroy", id), {
            
            preserveScroll: true,
        });
    };

    const statusBadge = (status) => {
        const map = {
            dipinjam: "bg-yellow-100 text-yellow-800",
            dikembalikan: "bg-green-100 text-green-800",
            terlambat: "bg-red-100 text-red-800",
        };
        return map[status] || "bg-gray-100 text-gray-800";
    };

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "-";

    return (
        <DashboardLayout>
            <Head title="Peminjaman Aset" />

            <div className="space-y-6">
                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Peminjaman Aset
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola transaksi peminjaman aset laboratorium.
                                Satu transaksi bisa berisi banyak aset.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {canManage && (
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Peminjaman
                                </button>
                            )}
                        </div>
                    </div>

                    
                    <div className="p-4 border-b">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="relative flex-1 md:max-w-xs">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Search className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                    placeholder="Cari nama peminjam atau kode aset..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="dipinjam">Dipinjam</option>
                                <option value="dikembalikan">
                                    Dikembalikan
                                </option>
                                <option value="terlambat">Terlambat</option>
                            </select>
                        </div>
                    </div>

                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Peminjam
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aset
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tgl Pinjam
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rencana Kembali
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Surat
                                    </th>
                                    {canManage && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {peminjaman?.data?.length > 0 ? (
                                    peminjaman.data.map((trx) => {
                                        const isExpanded =
                                            expandedRowId === trx.id;
                                        const items = trx.items || [];
                                        const itemAktif = items.filter(
                                            (it) => !it.tanggal_kembali_aktual,
                                        ).length;
                                        const totalItem = items.length;

                                        return (
                                            <>
                                                <tr
                                                    key={trx.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedRowId(
                                                                    isExpanded
                                                                        ? null
                                                                        : trx.id,
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title={
                                                                isExpanded
                                                                    ? "Tutup"
                                                                    : "Lihat item"
                                                            }
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {trx.nama_peminjam}
                                                        </div>
                                                        {trx.institusi && (
                                                            <div className="text-gray-500 text-xs">
                                                                {trx.institusi}
                                                            </div>
                                                        )}
                                                        {trx.keperluan && (
                                                            <div
                                                                className="text-gray-400 text-xs mt-0.5 max-w-[200px] truncate"
                                                                title={
                                                                    trx.keperluan
                                                                }
                                                            >
                                                                {trx.keperluan}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <div className="text-gray-900 font-medium">
                                                            {totalItem} aset
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {itemAktif > 0
                                                                ? `${itemAktif} belum kembali`
                                                                : "semua sudah kembali"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                        {fmtDate(
                                                            trx.tanggal_pinjam,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                        {fmtDate(
                                                            trx.tanggal_kembali_rencana,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full font-medium ${statusBadge(trx.status)}`}
                                                        >
                                                            {trx.status?.replace(
                                                                "_",
                                                                " ",
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                        {trx.surat_peminjaman_path ? (
                                                            <a
                                                                href={`/storage/${trx.surat_peminjaman_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                Lihat
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    {canManage && (
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                {itemAktif >
                                                                    0 && (
                                                                    <button
                                                                        onClick={() =>
                                                                            openKembalikanTransaksi(
                                                                                trx,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                                        title="Kembalikan semua item"
                                                                    >
                                                                        Kembalikan
                                                                        Semua
                                                                    </button>
                                                                )}
                                                                <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                                    onClick={() =>
                                                                        handleDeletePeminjaman(
                                                                            trx.id,
                                                                        )
                                                                    }
                                                                    
                                                                    title="Hapus Catatan"
                                                                >
    <Trash2 className="w-4 h-4" />
</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>

                                                {isExpanded && (
                                                    <tr
                                                        key={`${trx.id}-items`}
                                                        className="bg-gray-50/70"
                                                    >
                                                        <td
                                                            colSpan={
                                                                canManage
                                                                    ? 8
                                                                    : 7
                                                            }
                                                            className="px-4 py-3"
                                                        >
                                                            <div className="text-xs text-gray-500 mb-2">
                                                                Daftar aset
                                                                dalam transaksi
                                                                ini:
                                                            </div>
                                                            {items.length ===
                                                            0 ? (
                                                                <p className="text-xs text-gray-400 italic">
                                                                    Tidak ada
                                                                    item.
                                                                </p>
                                                            ) : (
                                                                <div className="rounded-md border bg-white divide-y">
                                                                    {items.map(
                                                                        (
                                                                            it,
                                                                        ) => {
                                                                            const sudahKembali =
                                                                                !!it.tanggal_kembali_aktual;
                                                                            const aset =
                                                                                it.detail_aset ||
                                                                                {};
                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        it.id
                                                                                    }
                                                                                    className="flex items-center justify-between gap-3 px-3 py-2"
                                                                                >
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                                                            {aset.kode_barang ||
                                                                                                "—"}{" "}
                                                                                            {aset.nama
                                                                                                ? `· ${aset.nama}`
                                                                                                : ""}
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500">
                                                                                            {aset
                                                                                                .kategori_aset
                                                                                                ?.nama ||
                                                                                                "—"}
                                                                                            {aset
                                                                                                .laboratorium
                                                                                                ?.nama
                                                                                                ? ` · ${aset.laboratorium.nama}`
                                                                                                : ""}
                                                                                        </div>
                                                                                        {sudahKembali && (
                                                                                            <div className="text-xs text-emerald-600 mt-0.5">
                                                                                                Dikembalikan{" "}
                                                                                                {fmtDate(
                                                                                                    it.tanggal_kembali_aktual,
                                                                                                )}
                                                                                                {it.kondisi_setelah_kembali
                                                                                                    ? ` · kondisi: ${it.kondisi_setelah_kembali}`
                                                                                                    : ""}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span
                                                                                            className={`px-2 py-0.5 text-[11px] rounded-full ${
                                                                                                sudahKembali
                                                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                                                    : "bg-yellow-100 text-yellow-800"
                                                                                            }`}
                                                                                        >
                                                                                            {sudahKembali
                                                                                                ? "kembali"
                                                                                                : "dipinjam"}
                                                                                        </span>
                                                                                        {!sudahKembali &&
                                                                                            canManage && (
                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        openKembalikanItem(
                                                                                                            trx,
                                                                                                            it,
                                                                                                        )
                                                                                                    }
                                                                                                    className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                                                                                >
                                                                                                    Kembalikan
                                                                                                </button>
                                                                                            )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={canManage ? 8 : 7}
                                            className="px-6 py-10 text-center text-gray-400"
                                        >
                                            <ClipboardList
                                                className="mx-auto h-10 w-10 mb-2"
                                                strokeWidth={1.5}
                                            />
                                            Belum ada catatan peminjaman
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    
                    {peminjaman?.links && peminjaman.data?.length > 0 && (
                        <div className="p-4 flex flex-col md:flex-row items-center justify-between border-t gap-4">
                            <div className="text-sm text-gray-700">
                                Menampilkan {peminjaman.from}–{peminjaman.to}{" "}
                                dari {peminjaman.total} data
                            </div>
                            <div className="flex items-center gap-1">
                                {peminjaman.links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            link.url &&
                                            router.visit(link.url, {
                                                preserveState: true,
                                            })
                                        }
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded text-sm ${link.active ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"} ${!link.url ? "opacity-40 cursor-not-allowed" : ""}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                
                
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Tambah Peminjaman
                        </h3>
                        <p className="text-sm text-gray-500">
                            Pilih satu atau lebih aset untuk peminjaman ini.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <form
                    onSubmit={handleCreateSubmit}
                    className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pilih Aset *
                            <span className="ml-1 text-xs text-gray-500">
                                ({createForm.data.aset_ids.length} terpilih)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={asetSearch}
                            onChange={(e) => setAsetSearch(e.target.value)}
                            placeholder="Cari kode/nama aset..."
                            className="w-full mb-2 border border-gray-300 rounded-md text-sm py-2 px-3"
                        />
                        <div className="border rounded-md max-h-52 overflow-y-auto">
                            {filteredAset.length === 0 ? (
                                <p className="px-3 py-4 text-xs text-gray-400 text-center">
                                    Tidak ada aset tersedia di lab ini.
                                </p>
                            ) : (
                                filteredAset.map((a) => {
                                    const checked =
                                        createForm.data.aset_ids.includes(a.id);
                                    return (
                                        <label
                                            key={a.id}
                                            className={`flex items-start gap-2 px-3 py-2 border-b last:border-0 text-sm cursor-pointer hover:bg-gray-50 ${
                                                checked ? "bg-purple-50" : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleAsetId(a.id)
                                                }
                                                className="mt-0.5 rounded border-gray-300"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {a.kode_barang}
                                                    {a.nama
                                                        ? ` · ${a.nama}`
                                                        : ""}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {a.kategori_aset?.nama ||
                                                        "—"}
                                                    {a.laboratorium?.nama
                                                        ? ` · ${a.laboratorium.nama}`
                                                        : ""}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {createForm.errors.aset_ids && (
                            <p className="mt-1 text-xs text-red-500">
                                {createForm.errors.aset_ids}
                            </p>
                        )}
                    </div>

                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nama Peminjam *
                            </label>
                            <input
                                type="text"
                                value={createForm.data.nama_peminjam}
                                onChange={(e) =>
                                    createForm.setData(
                                        "nama_peminjam",
                                        e.target.value,
                                    )
                                }
                                required
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                            {createForm.errors.nama_peminjam && (
                                <p className="mt-1 text-xs text-red-500">
                                    {createForm.errors.nama_peminjam}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Institusi
                            </label>
                            <input
                                type="text"
                                value={createForm.data.institusi}
                                onChange={(e) =>
                                    createForm.setData(
                                        "institusi",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Keperluan *
                        </label>
                        <textarea
                            value={createForm.data.keperluan}
                            onChange={(e) =>
                                createForm.setData("keperluan", e.target.value)
                            }
                            required
                            rows="2"
                            className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tgl Pinjam *
                            </label>
                            <input
                                type="date"
                                value={createForm.data.tanggal_pinjam}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_pinjam",
                                        e.target.value,
                                    )
                                }
                                required
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Rencana Kembali *
                            </label>
                            <input
                                type="date"
                                value={createForm.data.tanggal_kembali_rencana}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_kembali_rencana",
                                        e.target.value,
                                    )
                                }
                                min={
                                    createForm.data.tanggal_pinjam || undefined
                                }
                                required
                                className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Surat Peminjaman
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) =>
                                createForm.setData(
                                    "surat_peminjaman",
                                    e.target.files[0],
                                )
                            }
                            className="mt-1 w-full text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Catatan
                        </label>
                        <textarea
                            value={createForm.data.catatan}
                            onChange={(e) =>
                                createForm.setData("catatan", e.target.value)
                            }
                            rows="2"
                            className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm disabled:opacity-50"
                        >
                            {createForm.processing
                                ? "Menyimpan..."
                                : "Simpan Peminjaman"}
                        </button>
                    </div>
                </form>
            </Modal>

            
            <Modal
                show={isKembalikanModalOpen}
                onClose={() => setIsKembalikanModalOpen(false)}
                maxWidth="md"
            >
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {kembalikanMode === "item"
                                ? "Kembalikan Item"
                                : "Kembalikan Seluruh Aset"}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {kembalikanMode === "item" && selectedItem
                                ? `${selectedItem.detail_aset?.kode_barang || "-"} — ${selectedPeminjaman?.nama_peminjam || ""}`
                                : selectedPeminjaman
                                  ? `${selectedPeminjaman.items?.filter((it) => !it.tanggal_kembali_aktual).length || 0} item belum kembali — ${selectedPeminjaman.nama_peminjam}`
                                  : ""}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsKembalikanModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <form
                    onSubmit={handleKembalikanSubmit}
                    className="p-6 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tanggal Kembali Aktual *
                        </label>
                        <input
                            type="date"
                            value={kembalikanForm.data.tanggal_kembali_aktual}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "tanggal_kembali_aktual",
                                    e.target.value,
                                )
                            }
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                        {kembalikanForm.errors.tanggal_kembali_aktual && (
                            <p className="mt-1 text-sm text-red-600">
                                {kembalikanForm.errors.tanggal_kembali_aktual}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Kondisi Setelah Kembali
                        </label>
                        <select
                            value={kembalikanForm.data.kondisi_setelah_kembali}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "kondisi_setelah_kembali",
                                    e.target.value,
                                )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        >
                            <option value="">
                                — Biarkan kondisi saat ini —
                            </option>
                            <option value="baik">Baik</option>
                            <option value="rusak">Rusak</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Catatan Pengembalian
                        </label>
                        <textarea
                            value={kembalikanForm.data.catatan_kembali}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "catatan_kembali",
                                    e.target.value,
                                )
                            }
                            rows="3"
                            placeholder="Catatan kondisi barang, kerusakan, dll..."
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsKembalikanModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={kembalikanForm.processing}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                            {kembalikanForm.processing
                                ? "Menyimpan..."
                                : "Konfirmasi Pengembalian"}
                        </button>
                    </div>
                </form>
            </Modal>

            
            <Modal
                show={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                maxWidth="md"
            >
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-lg font-medium text-gray-900">
                        Upload Template Surat
                    </h3>
                    <button
                        onClick={() => setIsTemplateModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nama Template *
                        </label>
                        <input
                            type="text"
                            value={templateForm.data.nama_template}
                            onChange={(e) =>
                                templateForm.setData(
                                    "nama_template",
                                    e.target.value,
                                )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Deskripsi
                        </label>
                        <input
                            type="text"
                            value={templateForm.data.deskripsi}
                            onChange={(e) =>
                                templateForm.setData(
                                    "deskripsi",
                                    e.target.value,
                                )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                            placeholder="Misal: Template untuk mahasiswa"
                        />
                    </div>
                    {(isSuperAdmin() || isKadep()) && laboratorium && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Khusus Laboratorium (Opsional)
                            </label>
                            <select
                                value={templateForm.data.laboratorium_id}
                                onChange={(e) =>
                                    templateForm.setData(
                                        "laboratorium_id",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                            >
                                <option value="">Semua Laboratorium</option>
                                {laboratorium.map((lab) => (
                                    <option key={lab.id} value={lab.id}>
                                        {lab.nama}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            File Template *
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) =>
                                templateForm.setData("file", e.target.files[0])
                            }
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Format: PDF, DOC, DOCX
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={templateForm.processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                            {templateForm.processing
                                ? "Mengupload..."
                                : "Upload Template"}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
