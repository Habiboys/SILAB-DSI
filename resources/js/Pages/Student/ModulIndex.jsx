import { Head } from '@inertiajs/react';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Search
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function StudentModulIndex({ praktikumList }) {
    const [selectedPraktikum, setSelectedPraktikum] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter dan Pencarian
    const filteredModul = useMemo(() => {
        let flat = [];
        praktikumList.forEach(p => {
            if (p.modul_praktikum && p.modul_praktikum.length > 0) {
                p.modul_praktikum.forEach(m => {
                    flat.push({
                        ...m,
                        praktikum: {
                            id: p.id,
                            mata_kuliah: p.mata_kuliah,
                            semester: p.semester
                        }
                    });
                });
            }
        });

        return flat.filter((m) => {
            const matchPraktikum = selectedPraktikum === "all" || m.praktikum.id == selectedPraktikum;
            const matchSearch = (m.judul || "").toLowerCase().includes(searchQuery.toLowerCase());
            return matchPraktikum && matchSearch;
        });
    }, [praktikumList, selectedPraktikum, searchQuery]);

    // Grouping by Praktikum
    const groupedModul = useMemo(() => {
        const groups = {};
        filteredModul.forEach(m => {
            const prakId = m.praktikum.id;
            if (!groups[prakId]) {
                groups[prakId] = { name: m.praktikum.mata_kuliah, items: [] };
            }
            groups[prakId].items.push(m);
        });
        return groups;
    }, [filteredModul]);

    // Flatten grup untuk list
    const flattenedGrouped = useMemo(() => {
        const flat = [];
        Object.values(groupedModul).forEach(group => {
            flat.push({ type: 'header', name: group.name });
            group.items.forEach(item => {
                flat.push({ type: 'item', data: item });
            });
        });
        return flat;
    }, [groupedModul]);

    const totalPages = Math.ceil(flattenedGrouped.length / ITEMS_PER_PAGE);
    const paginatedData = flattenedGrouped.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset pagination ketika filter berubah
    useEffect(() => { setCurrentPage(1); }, [selectedPraktikum, searchQuery]);

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    return (
        <DashboardLayout>
            <Head title="Modul Praktikum Saya" />

            <div className="space-y-6">
                {/* Header Information */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Modul Praktikum Saya</h2>
                    <p className="text-sm text-gray-600 mt-1">Daftar semua modul materi dari praktikum yang Anda ikuti.</p>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center zoom-in-95 animate-in duration-300">
                    <div className="w-full sm:w-1/3 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari judul modul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-3">
                        <label htmlFor="praktikum-filter" className="text-sm font-medium text-gray-600 hidden sm:block">Filter Praktikum:</label>
                        <select
                            id="praktikum-filter"
                            value={selectedPraktikum}
                            onChange={(e) => setSelectedPraktikum(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer"
                        >
                            <option value="all">Semua Praktikum ({praktikumList.length})</option>
                            {praktikumList.map((praktikum) => (
                                <option key={praktikum.id} value={praktikum.id}>
                                    {praktikum.mata_kuliah}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List of Modules */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {flattenedGrouped.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {praktikumList.length === 0 ? "Belum terdaftar di praktikum" : "Belum ada modul"}
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                {praktikumList.length === 0 
                                    ? "Anda belum terdaftar dalam praktikum apapun."
                                    : "Coba sesuaikan kata kunci pencarian atau ubah filter praktikum di atas."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {paginatedData.map((row, index) => {
                                if (row.type === 'header') {
                                    return (
                                        <div key={`header-${index}`} className="bg-gray-50/80 px-6 py-3 border-l-4 border-blue-500">
                                            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-blue-500"/>
                                                {row.name}
                                            </h3>
                                        </div>
                                    );
                                }

                                const modul = row.data;

                                return (
                                    <div key={modul.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition duration-150 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
                                        
                                        <div className="flex-1 min-w-0 pr-4 flex items-start gap-4">
                                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 flex-shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900 mb-1">
                                                    {modul.judul}
                                                </h4>
                                                <div className="flex flex-wrap text-sm text-gray-500 gap-y-1 gap-x-2">
                                                    <span>
                                                        {modul.pertemuan ? modul.pertemuan.judul : `Pertemuan ${modul.pertemuan_id || '-'}`}
                                                    </span>
                                                    {modul.pertemuan && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{modul.pertemuan.formatted_tanggal ? modul.pertemuan.formatted_tanggal : new Date(modul.pertemuan.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex items-center justify-end">
                                            <a
                                                href={route('praktikum.modul.view', { praktikum: modul.praktikum.id, modul: modul.id })} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm group-hover:shadow"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Lihat Modul
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Menampilkan <span className="font-medium text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, flattenedGrouped.length)}</span> dari <span className="font-medium text-gray-900">{flattenedGrouped.length}</span> baris
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Prev
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
