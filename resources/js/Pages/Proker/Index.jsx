import ConfirmModal from "@/Components/ConfirmModal";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Archive, CheckCircle, ChevronLeft, ChevronRight, Eye, FileText, Filter, Pencil, Plus, Search, Trash2, X, Check, Edit } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SP_BADGE = {
    draft: "bg-gray-100 text-gray-700",
    diajukan: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    ditolak: "bg-red-100 text-red-800",
};
const SP_TEXT = {
    draft: "Draft",
    diajukan: "Diajukan",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
};
const S_BADGE = {
    belum_mulai: "bg-gray-100 text-gray-800",
    sedang_berjalan: "bg-blue-100 text-blue-800",
    selesai: "bg-green-100 text-green-800",
    ditunda: "bg-orange-100 text-orange-800",
};
const S_TEXT = {
    belum_mulai: "Belum Mulai",
    sedang_berjalan: "Sedang Berjalan",
    selesai: "Selesai",
    ditunda: "Ditunda",
};

function SummaryCard({ label, value, color = "blue" }) {
    const valueColors = {
        blue: "text-blue-600",
        yellow: "text-yellow-600",
        green: "text-green-600",
        red: "text-red-600",
        gray: "text-gray-600",
    };
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className={`text-2xl font-bold ${valueColors[color]}`}>
                {value}
            </div>
            <div className="text-xs mt-0.5 font-medium text-gray-500">
                {label}
            </div>
        </div>
    );
}

function Pagination({ links, meta }) {
    if (!meta || meta.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            <span>
                Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total}{" "}
                data
            </span>
            <div className="flex items-center gap-1">
                {links.map((link, i) => {
                    if (link.label === "&laquo; Previous") {
                        return (
                            <button
                                key={i}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                        },
                                    )
                                }
                                disabled={!link.url}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        );
                    }
                    if (link.label === "Next &raquo;") {
                        return (
                            <button
                                key={i}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                        },
                                    )
                                }
                                disabled={!link.url}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        );
                    }
                    return (
                        <button
                            key={i}
                            onClick={() =>
                                link.url &&
                                router.get(
                                    link.url,
                                    {},
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                            disabled={!link.url}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${
                                link.active
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100 disabled:opacity-40"
                            }`}
                        >
                            {link.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const Proker = ({
    prokerData,
    kepengurusanlab,
    strukturList,
    tahunKepengurusan,
    selectedTahun: initialSelectedTahun,
    laboratorium,
    summary,
    can = {},
    filters,
}) => {
    const { selectedLab } = useLab();

    
    const [showModal, setShowModal] = useState(false);
    const [editingProker, setEditingProker] = useState(null);

    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProker, setDeletingProker] = useState(null);

    
    const [approveModal, setApproveModal] = useState(false);
    const [approvingItem, setApprovingItem] = useState(null);
    const [approveAction, setApproveAction] = useState("approve");
    const [approveCatatan, setApproveCatatan] = useState("");
    const [approving, setApproving] = useState(false);

    
    const [search, setSearch] = useState(filters?.search ?? "");
    const [filterStruktur, setFilterStruktur] = useState(
        filters?.filter_struktur ?? "",
    );
    const [filterSP, setFilterSP] = useState(
        filters?.filter_status_pengajuan ?? "",
    );
    const [filterStatus, setFilterStatus] = useState(
        filters?.filter_status ?? "",
    );
    const [perPage, setPerPage] = useState(filters?.per_page ?? 10);
    const searchTimer = useRef(null);

    const kepLabId = filters?.kepengurusan_lab_id ?? kepengurusanlab?.id;

    const applyFilters = (overrides = {}) => {
        router.get(
            route("proker.index"),
            {
                kepengurusan_lab_id: kepLabId,
                search,
                filter_struktur: filterStruktur,
                filter_status_pengajuan: filterSP,
                filter_status: filterStatus,
                per_page: perPage,
                ...overrides,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    
    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search });
        }, 450);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    const handleFilterChange = (key, value) => {
        const newVals = {
            filter_struktur: filterStruktur,
            filter_status_pengajuan: filterSP,
            filter_status: filterStatus,
            per_page: perPage,
        };
        newVals[key] = value;
        if (key === "filter_struktur") setFilterStruktur(value);
        if (key === "filter_status_pengajuan") setFilterSP(value);
        if (key === "filter_status") setFilterStatus(value);
        if (key === "per_page") setPerPage(value);
        applyFilters({ ...newVals, search });
    };

    const clearFilters = () => {
        setSearch("");
        setFilterStruktur("");
        setFilterSP("");
        setFilterStatus("");
        setPerPage(10);
        applyFilters({
            search: "",
            filter_struktur: "",
            filter_status_pengajuan: "",
            filter_status: "",
            per_page: 10,
        });
    };

    const hasActiveFilters =
        search || filterStruktur || filterSP || filterStatus;

    
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        lab_id: selectedLab?.id || "",
        kepengurusan_lab_id: kepengurusanlab?.id || "",
        struktur_id: "",
        nama_proker: "",
        deskripsi: "",
        tujuan: "",
        sasaran: "",
        output_kegiatan: "",
        status: "belum_mulai",
        tanggal_mulai: "",
        tanggal_selesai: "",
        keterangan: "",
        file_proker: null,
    });

    useEffect(() => {
        if (selectedLab) setData("lab_id", selectedLab.id);
    }, [selectedLab]);

    const openModal = (prokerItem = null) => {
        if (prokerItem) {
            setEditingProker(prokerItem);
            setData({
                _method: "put",
                lab_id: selectedLab?.id || "",
                kepengurusan_lab_id: prokerItem.kepengurusan_lab_id,
                struktur_id: prokerItem.struktur_id,
                nama_proker:
                    prokerItem.nama_proker || prokerItem.deskripsi || "",
                deskripsi: prokerItem.deskripsi || "",
                tujuan: prokerItem.tujuan || "",
                sasaran: prokerItem.sasaran || "",
                output_kegiatan: prokerItem.output_kegiatan || "",
                status: prokerItem.status,
                tanggal_mulai: prokerItem.tanggal_mulai || "",
                tanggal_selesai: prokerItem.tanggal_selesai || "",
                keterangan: prokerItem.keterangan || "",
                file_proker: null,
            });
        } else {
            setEditingProker(null);
            reset();
            setData((prev) => ({
                ...prev,
                lab_id: selectedLab?.id || "",
                kepengurusan_lab_id: kepengurusanlab?.id || "",
            }));
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProker(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProker) {
            post(route("proker.update", editingProker.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    toast.success("Program kerja berhasil diperbarui");
                },
                onError: () => toast.error("Gagal memperbarui program kerja"),
            });
        } else {
            post(route("proker.store"), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    toast.success("Program kerja berhasil ditambahkan");
                },
                onError: () => toast.error("Gagal menambahkan program kerja"),
            });
        }
    };

    const handleDelete = () => {
        destroy(route("proker.destroy", deletingProker.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingProker(null);
                toast.success("Program kerja berhasil dihapus");
            },
            onError: () => toast.error("Gagal menghapus program kerja"),
        });
    };

    const openApprove = (item, action) => {
        setApprovingItem(item);
        setApproveAction(action);
        setApproveCatatan("");
        setApproveModal(true);
    };

    const handleApprove = () => {
        setApproving(true);
        router.post(
            route("proker.approve", approvingItem.id),
            { action: approveAction, catatan: approveCatatan },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        approveAction === "approve"
                            ? "Proker disetujui"
                            : "Proker ditolak",
                    );
                    setApproveModal(false);
                },
                onError: () => toast.error("Gagal memproses persetujuan"),
                onFinish: () => setApproving(false),
            },
        );
    };

    const items = prokerData?.data ?? [];

    return (
        <DashboardLayout>
            <Head title="Program Kerja" />

            
            <div className="mb-5 flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                        Program Kerja Laboratorium
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Kelola & pantau program kerja berdasarkan divisi dan
                        periode kepengurusan
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {kepengurusanlab && (
                        <>
                            <Link
                                href={route("lpj-kepengurusan.preview-page", {
                                    kepengurusan_lab_id: kepengurusanlab.id,
                                    type: "rangkuman",
                                })}
                                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700 transition-colors shrink-0 shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                Laporan Kalab
                            </Link>
                            <Link
                                href={route("lpj-kepengurusan.preview-page", {
                                    kepengurusan_lab_id: kepengurusanlab.id,
                                    type: "lengkap",
                                })}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
                            >
                                <Archive className="w-4 h-4" />
                                Laporan LPJ Labor
                            </Link>
                        </>
                    )}
                    {kepengurusanlab?.is_active && can.create && (
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Proker
                        </button>
                    )}
                </div>
            </div>

            {!selectedLab && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                    Silakan pilih laboratorium dari navbar terlebih dahulu
                </div>
            )}

            {selectedLab && !kepengurusanlab && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                    Belum ada kepengurusan yang dipilih atau aktif
                </div>
            )}

            {kepengurusanlab && (
                <>
                    
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                            <SummaryCard
                                label="Total Proker"
                                value={summary.total}
                                color="blue"
                            />
                            <SummaryCard
                                label="Menunggu Persetujuan"
                                value={summary.diajukan}
                                color="yellow"
                            />
                            <SummaryCard
                                label="Disetujui"
                                value={summary.disetujui}
                                color="green"
                            />
                            <SummaryCard
                                label="Selesai"
                                value={summary.selesai}
                                color="green"
                            />
                            <SummaryCard
                                label="Ditolak"
                                value={summary.ditolak}
                                color="red"
                            />
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        
                        <div className="p-4 border-b flex flex-wrap gap-3 items-center">
                            
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama program kerja…"
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            
                            <select
                                value={filterStruktur}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "filter_struktur",
                                        e.target.value,
                                    )
                                }
                                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Semua Divisi</option>
                                {(strukturList || []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.struktur}
                                    </option>
                                ))}
                            </select>

                            
                            <select
                                value={filterSP}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "filter_status_pengajuan",
                                        e.target.value,
                                    )
                                }
                                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Semua Status Pengajuan</option>
                                <option value="draft">Draft</option>
                                <option value="diajukan">Diajukan</option>
                                <option value="disetujui">Disetujui</option>
                                <option value="ditolak">Ditolak</option>
                            </select>

                            
                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "filter_status",
                                        e.target.value,
                                    )
                                }
                                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">
                                    Semua Status Pelaksanaan
                                </option>
                                <option value="belum_mulai">Belum Mulai</option>
                                <option value="sedang_berjalan">
                                    Sedang Berjalan
                                </option>
                                <option value="selesai">Selesai</option>
                                <option value="ditunda">Ditunda</option>
                            </select>

                            
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto">
                                <span className="shrink-0">Per halaman:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "per_page",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <X className="h-3 w-3" /> Reset
                                </button>
                            )}
                        </div>

                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Program Kerja
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Divisi / PJ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Parameter
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Capaian
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="px-6 py-12 text-center text-gray-400"
                                            >
                                                {hasActiveFilters
                                                    ? "Tidak ada program kerja yang sesuai filter"
                                                    : "Belum ada program kerja untuk periode ini"}
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => {
                                            const from =
                                                prokerData?.meta?.from ?? 1;
                                            const spBadge =
                                                SP_BADGE[
                                                    item.status_pengajuan
                                                ] ??
                                                "bg-gray-100 text-gray-700";
                                            const spText =
                                                SP_TEXT[
                                                    item.status_pengajuan
                                                ] ?? item.status_pengajuan;
                                            const sBadge =
                                                S_BADGE[item.status] ??
                                                "bg-gray-100 text-gray-800";
                                            const sText =
                                                S_TEXT[item.status] ??
                                                item.status;
                                            const pjNames = (item.pjs || [])
                                                .map((p) => p.user?.name)
                                                .filter(Boolean);
                                            const capaian =
                                                item.persentase_capaian;
                                            const canApproveItem =
                                                can.approve &&
                                                item.status_pengajuan ===
                                                    "diajukan";
                                            const canEdit =
                                                kepengurusanlab?.is_active;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3.5 text-sm text-gray-500">
                                                        {from + index}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <Link
                                                            href={route(
                                                                "proker.show",
                                                                item.id,
                                                            )}
                                                            className="text-sm font-medium text-blue-700 hover:underline"
                                                        >
                                                            {item.nama_display ||
                                                                item.nama_proker ||
                                                                item.deskripsi}
                                                        </Link>
                                                        {item.tanggal_mulai &&
                                                            item.tanggal_selesai && (
                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                    {new Date(
                                                                        item.tanggal_mulai,
                                                                    ).toLocaleDateString(
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        },
                                                                    )}
                                                                    {" – "}
                                                                    {new Date(
                                                                        item.tanggal_selesai,
                                                                    ).toLocaleDateString(
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        },
                                                                    )}
                                                                </div>
                                                            )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="text-sm font-medium text-gray-800">
                                                            {
                                                                item.struktur
                                                                    ?.struktur
                                                            }
                                                        </div>
                                                        {pjNames.length > 0 && (
                                                            <div className="text-xs text-gray-500 mt-0.5">
                                                                {pjNames.join(
                                                                    ", ",
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${spBadge}`}
                                                        >
                                                            {spText}
                                                        </span>
                                                        <div className="mt-1">
                                                            <span
                                                                className={`inline-flex px-2 py-0.5 text-xs rounded-full ${sBadge}`}
                                                            >
                                                                {sText}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-sm text-gray-600">
                                                        {item.parameter
                                                            ?.length > 0 ? (
                                                            <span>
                                                                {
                                                                    item
                                                                        .parameter
                                                                        .length
                                                                }{" "}
                                                                ind. (
                                                                {
                                                                    item.total_bobot
                                                                }
                                                                %)
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                –
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-sm">
                                                        {capaian !== null &&
                                                        capaian !==
                                                            undefined ? (
                                                            <span
                                                                className={`font-semibold ${capaian >= 80 ? "text-green-600" : capaian >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                                            >
                                                                {capaian}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">
                                                                –
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            
                                                            <Link className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                                href={route(
                                                                    "proker.show",
                                                                    item.id,
                                                                )}
                                                                
                                                                title="Detail"
                                                            >
    <Eye className="w-4 h-4" />
</Link>

                                                            
                                                            {canApproveItem && (
                                                                <>
                                                                    <button className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                                        onClick={() =>
                                                                            openApprove(
                                                                                item,
                                                                                "approve",
                                                                            )
                                                                        }
                                                                        
                                                                        title="Setujui"
                                                                    >
    <Check className="w-4 h-4" />
</button>
                                                                    <button className="p-1.5 rounded-md bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                                                        onClick={() =>
                                                                            openApprove(
                                                                                item,
                                                                                "reject",
                                                                            )
                                                                        }
                                                                        
                                                                        title="Tolak"
                                                                    >
    <X className="w-4 h-4" />
</button>
                                                                </>
                                                            )}

                                                            
                                                            {canEdit && (
                                                                <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                                    onClick={() =>
                                                                        openModal(
                                                                            item,
                                                                        )
                                                                    }
                                                                    
                                                                    title="Edit"
                                                                >
    <Edit className="w-4 h-4" />
</button>
                                                            )}

                                                            
                                                            {canEdit && (
                                                                <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                                    onClick={() => {
                                                                        setDeletingProker(
                                                                            item,
                                                                        );
                                                                        setShowDeleteModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    
                                                                    title="Hapus"
                                                                >
    <Trash2 className="w-4 h-4" />
</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        
                        {prokerData?.links && (
                            <Pagination
                                links={prokerData.links}
                                meta={prokerData.meta}
                            />
                        )}
                    </div>
                </>
            )}

            
            <Modal show={showModal} maxWidth="2xl" onClose={closeModal}>
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg font-semibold">
                            {editingProker
                                ? "Edit Program Kerja"
                                : "Tambah Program Kerja"}
                        </h3>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Divisi / Struktur{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.struktur_id}
                                onChange={(e) =>
                                    setData("struktur_id", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                required
                            >
                                <option value="">
                                    Pilih Divisi / Struktur
                                </option>
                                {strukturList?.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.struktur}
                                    </option>
                                ))}
                            </select>
                            {errors.struktur_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.struktur_id}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Program Kerja{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nama_proker}
                                onChange={(e) =>
                                    setData("nama_proker", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Contoh: Neo Portofolio x Marketing"
                                required
                            />
                            {errors.nama_proker && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.nama_proker}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi Kegiatan{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.deskripsi}
                                onChange={(e) =>
                                    setData("deskripsi", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                rows="2"
                                placeholder="Penjelasan singkat kegiatan…"
                                required
                            />
                            {errors.deskripsi && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.deskripsi}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tujuan
                                </label>
                                <textarea
                                    value={data.tujuan}
                                    onChange={(e) =>
                                        setData("tujuan", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    rows="2"
                                    placeholder="Apa yang ingin dicapai…"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sasaran
                                </label>
                                <textarea
                                    value={data.sasaran}
                                    onChange={(e) =>
                                        setData("sasaran", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    rows="2"
                                    placeholder="Target peserta / pihak terdampak…"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Output Kegiatan
                            </label>
                            <textarea
                                value={data.output_kegiatan}
                                onChange={(e) =>
                                    setData("output_kegiatan", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                rows="2"
                                placeholder="Hasil nyata yang dihasilkan…"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Mulai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) =>
                                        setData("tanggal_mulai", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Selesai
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pelaksanaan{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                required
                            >
                                <option value="belum_mulai">Belum Mulai</option>
                                <option value="sedang_berjalan">
                                    Sedang Berjalan
                                </option>
                                <option value="selesai">Selesai</option>
                                <option value="ditunda">Ditunda</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan
                            </label>
                            <textarea
                                value={data.keterangan}
                                onChange={(e) =>
                                    setData("keterangan", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                rows="2"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File Dokumen Proker
                            </label>
                            <input
                                type="file"
                                onChange={(e) =>
                                    setData("file_proker", e.target.files[0])
                                }
                                className="w-full text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-2 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept=".pdf,.doc,.docx"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                PDF, DOC, DOCX — maks 10 MB. Foto/galeri dapat
                                diunggah di halaman detail setelah proker
                                dibuat.
                            </p>
                            {errors.file_proker && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.file_proker}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                            >
                                {processing
                                    ? "Menyimpan…"
                                    : editingProker
                                      ? "Perbarui"
                                      : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={approveModal}
                onClose={() => setApproveModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                        {approveAction === "approve"
                            ? "Setujui Program Kerja"
                            : "Tolak Program Kerja"}
                    </h3>
                    {approvingItem && (
                        <p className="text-sm text-gray-500 mb-4">
                            <span className="font-medium text-gray-700">
                                {approvingItem.nama_display ||
                                    approvingItem.nama_proker}
                            </span>
                        </p>
                    )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan{" "}
                            {approveAction === "reject" && (
                                <span className="text-red-500">*</span>
                            )}
                        </label>
                        <textarea
                            value={approveCatatan}
                            onChange={(e) => setApproveCatatan(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
                            rows="3"
                            placeholder={
                                approveAction === "approve"
                                    ? "Opsional: catatan persetujuan…"
                                    : "Jelaskan alasan penolakan…"
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setApproveModal(false)}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={
                                approving ||
                                (approveAction === "reject" &&
                                    !approveCatatan.trim())
                            }
                            className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-70 ${approveAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            {approving
                                ? "Memproses…"
                                : approveAction === "approve"
                                  ? "Setujui"
                                  : "Tolak"}
                        </button>
                    </div>
                </div>
            </Modal>

            
            <ConfirmModal
                show={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletingProker(null);
                }}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus program kerja ini? Semua parameter dan dokumentasi terkait juga akan dihapus."
                confirmText={processing ? "Menghapus…" : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default Proker;
