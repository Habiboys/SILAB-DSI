import ConfirmModal from "@/Components/ConfirmModal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Index({ kuesioner, can, filters }) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters?.search ?? "");
    const [filterTipe, setFilterTipe] = useState(filters?.tipe ?? "");
    const [filterStatus, setFilterStatus] = useState(filters?.status ?? "");
    const [perPage, setPerPage] = useState(filters?.per_page ?? 10);
    const searchTimer = useRef(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const deleteForm = useForm({});

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    /* ─── Helpers ─── */
    const applyFilters = (overrides = {}) => {
        router.get(
            route("kuesioner.index"),
            {
                search,
                tipe: filterTipe,
                status: filterStatus,
                per_page: perPage,
                ...overrides,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val });
        }, 450);
    };

    const handleTipe = (val) => {
        setFilterTipe(val);
        applyFilters({ tipe: val });
    };

    const handleStatus = (val) => {
        setFilterStatus(val);
        applyFilters({ status: val });
    };

    const handlePerPage = (val) => {
        setPerPage(Number(val));
        applyFilters({ per_page: Number(val) });
    };

    const clearFilters = () => {
        setSearch("");
        setFilterTipe("");
        setFilterStatus("");
        setPerPage(10);
        router.get(
            route("kuesioner.index"),
            {},
            { preserveScroll: true, replace: true },
        );
    };

    const hasActiveFilters = search || filterTipe || filterStatus;

    /* ─── Delete ─── */
    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        setSelectedItem(null);
        setDeleteModalOpen(false);
    };
    const confirmDelete = () => {
        deleteForm.delete(route("kuesioner.destroy", selectedItem.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Kuesioner berhasil dihapus.");
                closeDeleteModal();
            },
            onError: () => toast.error("Gagal menghapus kuesioner."),
        });
    };

    /* ─── Pagination ─── */
    const { links, meta } = kuesioner;
    const goTo = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveScroll: true, preserveState: true });
    };

    /* ─── Render helpers ─── */
    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              })
            : null;

    return (
        <DashboardLayout>
            <Head title="Kuesioner" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* ── Header ── */}
                <div className="p-6 flex flex-wrap justify-between items-center gap-3 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Daftar Kuesioner
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Kelola kuesioner internal maupun eksternal
                        </p>
                    </div>
                    {can.create && (
                        <Link
                            href={route("kuesioner.create")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Buat Kuesioner
                        </Link>
                    )}
                </div>

                {/* ── Filter bar ── */}
                <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari judul atau deskripsi…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter tipe */}
                    <select
                        value={filterTipe}
                        onChange={(e) => handleTipe(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[130px]"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="internal">Internal</option>
                        <option value="eksternal">Eksternal</option>
                    </select>

                    {/* Filter status */}
                    <select
                        value={filterStatus}
                        onChange={(e) => handleStatus(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                    >
                        <option value="">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Non-aktif</option>
                    </select>

                    {/* Per page */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto">
                        <span className="shrink-0">Per halaman:</span>
                        <select
                            value={perPage}
                            onChange={(e) => handlePerPage(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[70px]"
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            <X className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="overflow-x-auto">
                    {kuesioner.data.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">
                                {hasActiveFilters
                                    ? "Tidak ada kuesioner yang cocok dengan filter."
                                    : "Belum ada kuesioner yang dibuat."}
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                                        No
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Judul
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipe
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Periode
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dibuat Oleh
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {kuesioner.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {/* No */}
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {(kuesioner.meta?.from ?? 1) +
                                                index}
                                        </td>

                                        {/* Judul */}
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.judul}
                                            </div>
                                            {item.deskripsi && (
                                                <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                                                    {item.deskripsi}
                                                </div>
                                            )}
                                            {item.is_mandatory && (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-600 rounded">
                                                    Wajib Diisi
                                                </span>
                                            )}
                                        </td>

                                        {/* Tipe */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                                    item.tipe === "internal"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                            >
                                                {item.tipe === "internal"
                                                    ? "Internal"
                                                    : "Eksternal"}
                                            </span>
                                        </td>

                                        {/* Periode */}
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.tanggal_mulai ? (
                                                <>
                                                    {fmtDate(
                                                        item.tanggal_mulai,
                                                    )}
                                                    {" — "}
                                                    {item.tanggal_selesai
                                                        ? fmtDate(
                                                              item.tanggal_selesai,
                                                          )
                                                        : "Seterusnya"}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                                    item.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {item.is_active
                                                    ? "Aktif"
                                                    : "Non-aktif"}
                                            </span>
                                        </td>

                                        {/* Pembuat */}
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.pembuat?.name ?? "—"}
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Link
                                                    href={route(
                                                        "kuesioner.show",
                                                        item.id,
                                                    )}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                    title="Detail"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {can.edit && (
                                                    <Link
                                                        href={route(
                                                            "kuesioner.edit",
                                                            item.id,
                                                        )}
                                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {can.delete && (
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                item,
                                                            )
                                                        }
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Pagination ── */}
                {kuesioner.meta && kuesioner.meta.last_page > 1 && (
                    <div className="px-5 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
                        <span>
                            Menampilkan{" "}
                            <span className="font-medium">
                                {kuesioner.meta.from ?? 0}
                            </span>{" "}
                            –{" "}
                            <span className="font-medium">
                                {kuesioner.meta.to ?? 0}
                            </span>{" "}
                            dari{" "}
                            <span className="font-medium">
                                {kuesioner.meta.total}
                            </span>{" "}
                            data
                        </span>

                        <div className="flex items-center gap-1 flex-wrap">
                            {kuesioner.links.map((link, i) => {
                                const isFirst = i === 0;
                                const isLast = i === kuesioner.links.length - 1;

                                if (isFirst || isLast) {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goTo(link.url)}
                                            disabled={!link.url}
                                            className="px-2 py-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => goTo(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                            link.active
                                                ? "bg-blue-600 text-white"
                                                : "hover:bg-gray-100 text-gray-600"
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete Modal ── */}
            <ConfirmModal
                show={deleteModalOpen && !!selectedItem}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Hapus Kuesioner"
                message={
                    selectedItem
                        ? `Yakin ingin menghapus kuesioner "${selectedItem.judul}"? Semua data respons yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText={deleteForm.processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}
