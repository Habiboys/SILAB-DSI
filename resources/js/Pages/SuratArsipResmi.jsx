import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export default function SuratArsipResmi({
    suratResmi = [],
    labs = [],
    filters = {},
    flash,
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [filterDate, setFilterDate] = useState(filters.tanggal || "");
    const [filterLab, setFilterLab] = useState(filters.lab_id || "");

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Debounced filter
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route("surat.arsip-resmi"),
                { search: searchTerm, tanggal: filterDate, lab_id: filterLab },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchTerm, filterDate, filterLab]);

    const getPenerimaNama = (surat) => {
        if (surat.penerima_nama_luar) return surat.penerima_nama_luar;
        if (surat.penerima) return surat.penerima.name;
        return "-";
    };

    return (
        <DashboardLayout>
            <Head title="Arsip Surat Resmi" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Arsip Surat Resmi
                    </h1>
                    <div className="flex text-sm text-gray-500 mt-1">
                        <a href="/dashboard" className="hover:text-blue-600">
                            Home
                        </a>
                        <span className="mx-2">/</span>
                        <span>Surat Menyurat</span>
                        <span className="mx-2">/</span>
                        <span>Arsip Resmi</span>
                    </div>
                </div>
                <Link
                    href={route("surat.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Kirim Surat
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Cari nomor surat, perihal, penerima..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {labs.length > 1 && (
                    <select
                        value={filterLab}
                        onChange={(e) => setFilterLab(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Semua Lab</option>
                        {labs.map((l) => (
                            <option key={l.id} value={l.id}>
                                {l.nama}
                            </option>
                        ))}
                    </select>
                )}
                {(searchTerm || filterDate || filterLab) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm("");
                            setFilterDate("");
                            setFilterLab("");
                        }}
                        className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "No",
                                "Nomor Surat",
                                "Tanggal",
                                "Lab Pengirim",
                                "Pengirim",
                                "Penerima",
                                "Perihal",
                                "Aksi",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {suratResmi.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-10 text-center text-sm text-gray-400"
                                >
                                    Belum ada surat resmi tercatat.
                                </td>
                            </tr>
                        ) : (
                            suratResmi.map((surat, idx) => (
                                <tr
                                    key={surat.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-800">
                                        {surat.nomor_surat}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {formatTanggal(surat.tanggal_surat)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {surat.lab?.nama ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {surat.pengirim?.name ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {getPenerimaNama(surat)}
                                        {surat.penerima_nama_luar && (
                                            <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-1 rounded">
                                                Luar
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                                        {surat.perihal}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <Link
                                            href={route("surat.view", surat.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                                        >
                                            Lihat
                                        </Link>
                                        <a
                                            href={route(
                                                "surat.download",
                                                surat.id,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-green-600 hover:text-green-800 font-medium"
                                        >
                                            Unduh
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer count */}
                {suratResmi.length > 0 && (
                    <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
                        Menampilkan {suratResmi.length} surat resmi
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
