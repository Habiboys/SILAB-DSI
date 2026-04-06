import { Head, Link } from "@inertiajs/react";
import { BookOpen, ChevronRight, Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function RiwayatTugasIndex({ praktikumRiwayatList = [] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPraktikumRiwayat = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return praktikumRiwayatList;

        return praktikumRiwayatList.filter((praktikum) => {
            const mk = (praktikum?.mata_kuliah || "").toLowerCase();
            const periode = (praktikum?.periode || "").toLowerCase();
            return mk.includes(q) || periode.includes(q);
        });
    }, [praktikumRiwayatList, searchQuery]);

    return (
        <DashboardLayout>
            <Head title="Riwayat Tugas" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Riwayat Tugas
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Pilih praktikum terlebih dahulu untuk melihat riwayat
                        tugas per praktikum.
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-full sm:w-1/2 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari praktikum atau periode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {filteredPraktikumRiwayat.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Belum ada praktikum aktif
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Praktikum yang Anda ikuti akan tampil di halaman
                                ini.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredPraktikumRiwayat.map((praktikum) => (
                                <div
                                    key={praktikum.id}
                                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition duration-150 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                                >
                                    <div className="flex-1 min-w-0 pr-4 flex items-start gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 flex-shrink-0">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                                                {praktikum.mata_kuliah}
                                            </h4>
                                            <div className="flex flex-wrap text-sm text-gray-500 gap-y-1 gap-x-3">
                                                {praktikum.periode && (
                                                    <span>
                                                        Periode:{" "}
                                                        {praktikum.periode}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {praktikum.riwayat_count}{" "}
                                                    riwayat
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex items-center justify-end">
                                        <Link
                                            href={route(
                                                "praktikan.riwayat.praktikum",
                                                praktikum.id,
                                            )}
                                            className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                                        >
                                            Lihat Riwayat
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
