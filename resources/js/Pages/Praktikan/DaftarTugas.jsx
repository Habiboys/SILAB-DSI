import { Head, Link, usePage } from "@inertiajs/react";
import {
    AlertCircle,
    BookOpen,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function DaftarTugas({
    praktikans,
    tugasPraktikums,
    riwayatPengumpulan,
}) {
    const [selectedPraktikum, setSelectedPraktikum] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { flash } = usePage().props;

    const praktikumNameById = useMemo(() => {
        const map = new Map();
        (praktikans || []).forEach((pp) => {
            const id = pp?.praktikum_id || pp?.praktikum?.id;
            const name =
                pp?.praktikum?.mata_kuliah || pp?.praktikum?.nama_praktikum;
            if (id && name && !map.has(String(id))) {
                map.set(String(id), name);
            }
        });
        return map;
    }, [praktikans]);

    const getTaskPraktikumId = (tugas) => {
        return (
            tugas?.praktikum_id ||
            tugas?.praktikum?.id ||
            tugas?.kelas?.praktikum_id ||
            tugas?.pertemuan?.kelas?.praktikum_id ||
            null
        );
    };

    const getTaskPraktikumName = (tugas) => {
        const effectiveId = getTaskPraktikumId(tugas);
        return (
            tugas?.praktikum?.mata_kuliah ||
            (effectiveId ? praktikumNameById.get(String(effectiveId)) : null) ||
            "Praktikum Tidak Diketahui"
        );
    };

    const submittedTaskIds = useMemo(() => {
        const ids = new Set();
        (riwayatPengumpulan || []).forEach((r) => {
            if (r?.tugas_praktikum_id) {
                ids.add(String(r.tugas_praktikum_id));
            }
        });
        return ids;
    }, [riwayatPengumpulan]);

    const pendingTugas = useMemo(() => {
        return (tugasPraktikums || []).filter(
            (t) => !submittedTaskIds.has(String(t?.id)),
        );
    }, [tugasPraktikums, submittedTaskIds]);

    const praktikumOptions = useMemo(() => {
        const optionsMap = new Map();

        (praktikans || []).forEach((pp) => {
            const id = pp?.praktikum_id || pp?.praktikum?.id;
            const name =
                pp?.praktikum?.mata_kuliah || pp?.praktikum?.nama_praktikum;
            if (id && name) {
                optionsMap.set(String(id), { id: String(id), name });
            }
        });

        (pendingTugas || []).forEach((t) => {
            const id = getTaskPraktikumId(t);
            const name = getTaskPraktikumName(t);
            if (id && name) {
                optionsMap.set(String(id), { id: String(id), name });
            }
        });

        return Array.from(optionsMap.values());
    }, [praktikans, pendingTugas, praktikumNameById]);

    
    useEffect(() => {
        if (flash && flash.success) {
            const toast = document.createElement("div");
            toast.className =
                "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 transition-opacity duration-300";
            toast.textContent = flash.success;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 3000);
        }
    }, [flash?.success]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "dikumpulkan":
                return {
                    color: "text-blue-700",
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
                };
            case "dinilai":
                return {
                    color: "text-green-700",
                    bg: "bg-green-50",
                    border: "border-green-200",
                    icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
                };
            case "terlambat":
                return {
                    color: "text-red-700",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    icon: <AlertCircle className="w-4 h-4 mr-1.5" />,
                };
            case "belum_dikumpulkan":
            default:
                return {
                    color: "text-orange-700",
                    bg: "bg-orange-50",
                    border: "border-orange-200",
                    icon: <Clock className="w-4 h-4 mr-1.5" />,
                };
        }
    };

    
    const filteredTugas = useMemo(() => {
        return (pendingTugas || []).filter((t) => {
            const effectivePraktikumId = getTaskPraktikumId(t);
            const matchPraktikum =
                selectedPraktikum === "all" ||
                (effectivePraktikumId &&
                    String(effectivePraktikumId) === String(selectedPraktikum));
            const matchSearch = (t.judul_tugas || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            return matchPraktikum && matchSearch;
        });
    }, [pendingTugas, selectedPraktikum, searchQuery]);

    
    const groupedTugas = useMemo(() => {
        const groups = {};
        filteredTugas.forEach((t) => {
            const prakId = getTaskPraktikumId(t) || "unknown";
            const prakName = getTaskPraktikumName(t);
            if (!groups[prakId]) {
                groups[prakId] = { name: prakName, items: [] };
            }
            groups[prakId].items.push(t);
        });
        return groups;
    }, [filteredTugas, praktikumNameById]);

    
    const flattenedGrouped = useMemo(() => {
        const flat = [];
        Object.values(groupedTugas).forEach((group) => {
            flat.push({ type: "header", name: group.name });
            group.items.forEach((item) => {
                flat.push({ type: "item", data: item });
            });
        });
        return flat;
    }, [groupedTugas]);

    const totalPages = Math.ceil(flattenedGrouped.length / ITEMS_PER_PAGE);
    const paginatedData = flattenedGrouped.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPraktikum, searchQuery]);

    const handlePrevPage = () =>
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    return (
        <DashboardLayout>
            <Head title="Daftar Tugas Praktikum" />

            <div className="space-y-6">
                
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Daftar Tugas Praktikum
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Lihat dan kerjakan semua tugas yang tersedia untuk
                        praktikum Anda saat ini.
                    </p>
                </div>

                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center zoom-in-95 animate-in duration-300">
                    <div className="w-full sm:w-1/3 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari judul tugas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-3">
                        <label
                            htmlFor="praktikum-filter"
                            className="text-sm font-medium text-gray-600 hidden sm:block"
                        >
                            Filter Praktikum:
                        </label>
                        <select
                            id="praktikum-filter"
                            value={selectedPraktikum}
                            onChange={(e) =>
                                setSelectedPraktikum(e.target.value)
                            }
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer"
                        >
                            <option value="all">
                                Semua Praktikum ({pendingTugas.length})
                            </option>
                            {praktikumOptions.map((praktikum) => (
                                <option key={praktikum.id} value={praktikum.id}>
                                    {praktikum.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {flattenedGrouped.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Belum ada tugas
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Coba sesuaikan kata kunci pencarian atau ubah
                                filter praktikum di atas.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {paginatedData.map((row, index) => {
                                if (row.type === "header") {
                                    return (
                                        <div
                                            key={`header-${index}`}
                                            className="bg-gray-50/80 px-6 py-3 border-l-4 border-blue-500"
                                        >
                                            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                {row.name}
                                            </h3>
                                        </div>
                                    );
                                }

                                const tugas = row.data;
                                const pengumpulan = riwayatPengumpulan.find(
                                    (r) => r.tugas_praktikum_id === tugas.id,
                                );
                                const status = pengumpulan
                                    ? pengumpulan.status
                                    : "belum_dikumpulkan";
                                const statusStyle = getStatusStyle(status);

                                return (
                                    <div
                                        key={tugas.id}
                                        className="p-5 sm:p-6 hover:bg-slate-50/50 transition duration-150 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h4 className="text-base font-semibold text-gray-900 truncate">
                                                    {tugas.judul_tugas}
                                                </h4>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                                                >
                                                    {statusStyle.icon}
                                                    <span className="capitalize">
                                                        {status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap text-sm text-gray-500 gap-y-2 gap-x-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                                    <span>
                                                        Deadline:{" "}
                                                        {new Date(
                                                            tugas.deadline,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            },
                                                        )}{" "}
                                                        {new Date(
                                                            tugas.deadline,
                                                        ).toLocaleTimeString(
                                                            "id-ID",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex items-center justify-end">
                                            <Link
                                                href={route(
                                                    "praktikan.tugas.show",
                                                    tugas.id,
                                                )}
                                                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm group-hover:shadow"
                                            >
                                                {status ===
                                                "belum_dikumpulkan" ? (
                                                    "Lihat & Kumpulkan"
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Lihat Detail
                                                    </>
                                                )}
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Menampilkan{" "}
                                <span className="font-medium text-gray-900">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                hingga{" "}
                                <span className="font-medium text-gray-900">
                                    {Math.min(
                                        currentPage * ITEMS_PER_PAGE,
                                        flattenedGrouped.length,
                                    )}
                                </span>{" "}
                                dari{" "}
                                <span className="font-medium text-gray-900">
                                    {flattenedGrouped.length}
                                </span>{" "}
                                baris
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
