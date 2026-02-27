import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PeminjamanIndex({
    peminjaman,
    templates,
    filters,
    flash,
}) {
    const { auth, laboratorium } = usePage().props;
    const { selectedLab } = useLab();
    const { can, isSuperAdmin, isKadep } = usePermission();

    const canManage = can("inventaris.update");
    const canManageTemplate = can("inventaris.manage_categories");

    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "");

    // Modal states
    const [isKembalikanModalOpen, setIsKembalikanModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);

    // Flash messages
    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Re-fetch when selected lab changes (matching sidebar lab selector)
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

    // Kembalikan form
    const kembalikanForm = useForm({
        kondisi_kembali: "baik",
        catatan_kembali: "",
    });

    // Template upload form
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

    const openKembalikanModal = (item) => {
        setSelectedPeminjaman(item);
        kembalikanForm.reset();
        setIsKembalikanModalOpen(true);
    };

    const handleKembalikanSubmit = (e) => {
        e.preventDefault();
        kembalikanForm.post(
            route("inventaris.peminjaman.kembalikan", selectedPeminjaman.id),
            {
                onSuccess: () => {
                    setIsKembalikanModalOpen(false);
                    setSelectedPeminjaman(null);
                    toast.success("Aset berhasil dikembalikan");
                },
                onError: () => toast.error("Gagal mencatat pengembalian"),
                preserveScroll: true,
            },
        );
    };

    const handleTemplateSubmit = (e) => {
        e.preventDefault();
        templateForm.post(route("inventaris.template-surat.store"), {
            onSuccess: () => {
                setIsTemplateModalOpen(false);
                templateForm.reset();
                toast.success("Template berhasil diupload");
            },
            onError: () => toast.error("Gagal mengupload template"),
            preserveScroll: true,
        });
    };

    const handleDeleteTemplate = (id) => {
        if (!confirm("Hapus template ini?")) return;
        router.delete(route("inventaris.template-surat.destroy", id), {
            onSuccess: () => toast.success("Template dihapus"),
            preserveScroll: true,
        });
    };

    const handleDeletePeminjaman = (id) => {
        if (!confirm("Hapus catatan peminjaman ini?")) return;
        router.delete(route("inventaris.peminjaman.destroy", id), {
            onSuccess: () => toast.success("Catatan peminjaman dihapus"),
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

    return (
        <DashboardLayout>
            <Head title="Peminjaman Aset" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Peminjaman Aset
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola catatan peminjaman aset laboratorium
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href={route("inventaris.index")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                Kembali ke Inventaris
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="relative flex-1 md:max-w-xs">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <svg
                                        className="h-4 w-4"
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
                            {selectedLab && (
                                <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2">
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
                                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                        />
                                    </svg>
                                    {selectedLab.nama}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aset
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Peminjam
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Keperluan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tgl Pinjam
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rencana Kembali
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tgl Kembali
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Surat
                                    </th>
                                    {canManage && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {peminjaman?.data?.length > 0 ? (
                                    peminjaman.data.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className={
                                                idx % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                            }
                                        >
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {item.detail_aset
                                                        ?.kode_barang || "-"}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {item.detail_aset
                                                        ?.kategori_aset?.nama ||
                                                        ""}
                                                </div>
                                                <div className="text-gray-400 text-xs">
                                                    {item.detail_aset
                                                        ?.laboratorium?.nama ||
                                                        ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {item.nama_peminjam}
                                                </div>
                                                {item.institusi && (
                                                    <div className="text-gray-500 text-xs">
                                                        {item.institusi}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px]">
                                                <div
                                                    className="truncate"
                                                    title={item.keperluan}
                                                >
                                                    {item.keperluan}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {item.tanggal_pinjam
                                                    ? new Date(
                                                          item.tanggal_pinjam,
                                                      ).toLocaleDateString(
                                                          "id-ID",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {item.tanggal_kembali_rencana
                                                    ? new Date(
                                                          item.tanggal_kembali_rencana,
                                                      ).toLocaleDateString(
                                                          "id-ID",
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {item.tanggal_kembali_aktual ? (
                                                    new Date(
                                                        item.tanggal_kembali_aktual,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )
                                                ) : (
                                                    <span className="text-yellow-600 text-xs">
                                                        Belum dikembalikan
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full font-medium ${statusBadge(item.status)}`}
                                                >
                                                    {item.status?.replace(
                                                        "_",
                                                        " ",
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {item.surat_peminjaman_path ? (
                                                    <a
                                                        href={`/storage/${item.surat_peminjaman_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        Lihat
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        {item.status ===
                                                            "dipinjam" && (
                                                            <button
                                                                onClick={() =>
                                                                    openKembalikanModal(
                                                                        item,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                                title="Catat Pengembalian"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3"
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
                                                                Kembalikan
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                handleDeletePeminjaman(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="p-1 text-red-500 hover:text-red-700 rounded"
                                                            title="Hapus Catatan"
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
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={canManage ? "9" : "8"}
                                            className="px-6 py-10 text-center text-gray-400"
                                        >
                                            <svg
                                                className="mx-auto h-10 w-10 mb-2"
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
                                            Belum ada catatan peminjaman
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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

                {/* Template Surat Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">
                                Template Surat Peminjaman
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Template surat yang bisa didownload oleh
                                peminjam
                            </p>
                        </div>
                        {canManageTemplate && (
                            <button
                                onClick={() => setIsTemplateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Upload Template
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                        {templates && templates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((tmpl) => (
                                    <div
                                        key={tmpl.id}
                                        className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                    <svg
                                                        className="w-5 h-5 text-indigo-600"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {tmpl.nama_template}
                                                    </p>
                                                    {tmpl.laboratorium && (
                                                        <p className="text-xs text-gray-400">
                                                            {
                                                                tmpl
                                                                    .laboratorium
                                                                    .nama
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {canManageTemplate && (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteTemplate(
                                                            tmpl.id,
                                                        )
                                                    }
                                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 rounded"
                                                    title="Hapus Template"
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
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        {tmpl.deskripsi && (
                                            <p className="text-xs text-gray-500">
                                                {tmpl.deskripsi}
                                            </p>
                                        )}
                                        <a
                                            href={route(
                                                "inventaris.template-surat.download",
                                                tmpl.id,
                                            )}
                                            className="inline-flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 text-sm font-medium transition-colors"
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
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-400">
                                <svg
                                    className="mx-auto h-10 w-10 mb-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                                <p className="text-sm">
                                    Belum ada template surat
                                </p>
                                {canManageTemplate && (
                                    <button
                                        onClick={() =>
                                            setIsTemplateModalOpen(true)
                                        }
                                        className="mt-2 text-blue-600 hover:underline text-sm"
                                    >
                                        Upload template pertama
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Kembalikan Modal */}
            <Modal
                show={isKembalikanModalOpen && !!selectedPeminjaman}
                onClose={() => setIsKembalikanModalOpen(false)}
                maxWidth="md"
            >
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Catat Pengembalian Aset
                        </h3>
                        <p className="text-sm text-gray-500">
                            {selectedPeminjaman.detail_aset?.kode_barang} —{" "}
                            {selectedPeminjaman.nama_peminjam}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsKembalikanModalOpen(false)}
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
                    onSubmit={handleKembalikanSubmit}
                    className="p-6 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Kondisi Saat Dikembalikan
                        </label>
                        <select
                            value={kembalikanForm.data.kondisi_kembali}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "kondisi_kembali",
                                    e.target.value,
                                )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        >
                            <option value="baik">Baik</option>
                            <option value="rusak">Rusak</option>
                            <option value="hilang">Hilang</option>
                        </select>
                        {kembalikanForm.errors.kondisi_kembali && (
                            <p className="mt-1 text-sm text-red-600">
                                {kembalikanForm.errors.kondisi_kembali}
                            </p>
                        )}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                        {kembalikanForm.errors.catatan_kembali && (
                            <p className="mt-1 text-sm text-red-600">
                                {kembalikanForm.errors.catatan_kembali}
                            </p>
                        )}
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

            {/* Upload Template Modal */}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                        {templateForm.errors.nama_template && (
                            <p className="mt-1 text-sm text-red-600">
                                {templateForm.errors.nama_template}
                            </p>
                        )}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                        {templateForm.errors.file && (
                            <p className="mt-1 text-sm text-red-600">
                                {templateForm.errors.file}
                            </p>
                        )}
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
