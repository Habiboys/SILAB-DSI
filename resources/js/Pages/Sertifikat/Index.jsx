import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Pagination";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Award, Download, Eye, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const JENIS_LABELS = {
    praktikan: "Praktikan",
    asisten: "Asisten",
    kepengurusan: "Kepengurusan",
    kegiatan: "Kegiatan",
};

const JENIS_COLORS = {
    praktikan: "bg-green-100 text-green-800",
    asisten: "bg-purple-100 text-purple-800",
    kepengurusan: "bg-blue-100 text-blue-800",
    kegiatan: "bg-orange-100 text-orange-800",
};

export default function SertifikatIndex({ sertifikats, laboratories, praktikums, filters, flash }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [jenisFilter, setJenisFilter] = useState(filters.jenis_sertifikat || "");
    const [labFilter, setLabFilter] = useState(filters.laboratory_id || "");
    const [praktikumFilter, setPraktikumFilter] = useState(filters.praktikum_id || "");
    const [tglAwal, setTglAwal] = useState(filters.tanggal_awal || "");
    const [tglAkhir, setTglAkhir] = useState(filters.tanggal_akhir || "");
    const [perPage, setPerPage] = useState(filters.perPage || 15);

    const applyFilters = useCallback(
        debounce((overrides = {}) => {
            const params = {
                search: (overrides.search ?? searchTerm) || undefined,
                jenis_sertifikat: (overrides.jenis ?? jenisFilter) || undefined,
                laboratory_id: (overrides.lab ?? labFilter) || undefined,
                praktikum_id: (overrides.praktikum ?? praktikumFilter) || undefined,
                tanggal_awal: (overrides.tglAwal ?? tglAwal) || undefined,
                tanggal_akhir: (overrides.tglAkhir ?? tglAkhir) || undefined,
                perPage: overrides.perPage ?? perPage,
            };
            router.get(route("sertifikat.all"), params, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 400),
        [searchTerm, jenisFilter, labFilter, praktikumFilter, tglAwal, tglAkhir, perPage],
    );

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        applyFilters({ search: val });
    };

    const handleFilterChange = (key, value) => {
        const setters = {
            jenis: setJenisFilter,
            lab: setLabFilter,
            praktikum: setPraktikumFilter,
            tglAwal: setTglAwal,
            tglAkhir: setTglAkhir,
        };
        setters[key]?.(value);
        applyFilters({ [key]: value });
    };

    const handlePerPageChange = (e) => {
        const val = parseInt(e.target.value);
        setPerPage(val);
        applyFilters({ perPage: val });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setJenisFilter("");
        setLabFilter("");
        setPraktikumFilter("");
        setTglAwal("");
        setTglAkhir("");
        setPerPage(15);
        router.get(route("sertifikat.all"), {}, { preserveState: true, preserveScroll: true });
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const hasActiveFilters = filters.search || filters.jenis_sertifikat || filters.laboratory_id ||
        filters.praktikum_id || filters.tanggal_awal || filters.tanggal_akhir;

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Manajemen Sertifikat" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Manajemen Sertifikat
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Semua sertifikat yang diterbitkan di sistem.
                                <span className="ml-1 font-medium text-gray-600">
                                    {sertifikats.total} sertifikat
                                </span>
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center gap-1"
                            >
                                <X className="h-4 w-4" />
                                Hapus Filter
                            </button>
                        )}
                    </div>

                    {/* Filter Bar — single line minimalist */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[160px] flex-1 max-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama/email..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <select
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={jenisFilter}
                            onChange={(e) => handleFilterChange("jenis", e.target.value)}
                        >
                            <option value="">Jenis</option>
                            {Object.entries(JENIS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={labFilter}
                            onChange={(e) => handleFilterChange("lab", e.target.value)}
                        >
                            <option value="">Lab</option>
                            {laboratories.map((lab) => (
                                <option key={lab.id} value={lab.id}>{lab.nama}</option>
                            ))}
                        </select>
                        <select
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={praktikumFilter}
                            onChange={(e) => handleFilterChange("praktikum", e.target.value)}
                        >
                            <option value="">Praktikum</option>
                            {praktikums.map((p) => (
                                <option key={p.id} value={p.id}>{p.mata_kuliah}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-[130px]"
                            value={tglAwal}
                            onChange={(e) => handleFilterChange("tglAwal", e.target.value)}
                            title="Tanggal Awal"
                        />
                        <input
                            type="date"
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-[130px]"
                            value={tglAkhir}
                            onChange={(e) => handleFilterChange("tglAkhir", e.target.value)}
                            title="Tanggal Akhir"
                        />
                        <select
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={perPage}
                            onChange={handlePerPageChange}
                        >
                            {[10, 15, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-2 py-1.5 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 text-sm"
                                title="Hapus Filter"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Sertifikat</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Praktikum / Lab</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Terbit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sertifikats.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Award className="w-8 h-8 text-gray-300" />
                                            <p>Tidak ada sertifikat ditemukan.</p>
                                            {hasActiveFilters && (
                                                <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                                                    Hapus filter untuk melihat semua sertifikat
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sertifikats.data.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {sertifikats.from + idx}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">
                                            {s.nomor_sertifikat}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{s.user?.name || "-"}</div>
                                            <div className="text-xs text-gray-500">{s.user?.email || ""}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${JENIS_COLORS[s.jenis_sertifikat] || "bg-gray-100 text-gray-700"}`}>
                                                {JENIS_LABELS[s.jenis_sertifikat] || s.jenis_sertifikat}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {s.praktikum ? (
                                                <span>{s.praktikum.mata_kuliah}</span>
                                            ) : s.kepengurusan_lab?.laboratorium ? (
                                                <span>{s.kepengurusan_lab.laboratorium.nama} <span className="text-xs text-gray-400">(kepengurusan)</span></span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDate(s.tanggal_terbit)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1">
                                                <a
                                                    href={route("sertifikat.download", s.id)}
                                                    className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {sertifikats.last_page > 1 && (
                    <div className="px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Menampilkan {sertifikats.from}–{sertifikats.to} dari {sertifikats.total} sertifikat
                        </p>
                        <Pagination links={sertifikats.links} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
