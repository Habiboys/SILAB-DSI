import { Head, Link } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    FileText,
    MessageCircle,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function RiwayatTugasDetail({ riwayat }) {
    if (!riwayat) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-gray-500">
                    Data riwayat tidak ditemukan.
                </div>
            </DashboardLayout>
        );
    }

    const { tugasPraktikum, praktikan } = riwayat;
    const [showPdf, setShowPdf] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case "dikumpulkan":
                return "text-blue-600 bg-blue-100 border-blue-200";
            case "dinilai":
                return "text-green-600 bg-green-100 border-green-200";
            case "terlambat":
                return "text-red-600 bg-red-100 border-red-200";
            default:
                return "text-gray-600 bg-gray-100 border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "dikumpulkan":
                return <Clock className="w-5 h-5" />;
            case "dinilai":
                return <CheckCircle className="w-5 h-5" />;
            case "terlambat":
                return <XCircle className="w-5 h-5" />;
            default:
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Fungsi bantu untuk merender link/file
    const renderFiles = (filePengumpulan) => {
        if (!filePengumpulan)
            return (
                <span className="text-gray-400 italic">
                    Tidak ada file yang dilampirkan
                </span>
            );

        try {
            const submissionData = JSON.parse(filePengumpulan);
            if (Array.isArray(submissionData) && submissionData.length > 0) {
                if (
                    typeof submissionData[0] === "object" &&
                    submissionData[0].type
                ) {
                    return (
                        <ul className="space-y-2">
                            {submissionData.map((item, index) => {
                                if (item.type === "file") {
                                    const fullFileName = item.data
                                        .split("/")
                                        .pop();
                                    return (
                                        <li
                                            key={index}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.original_name ||
                                                        `File Lampiran ${index + 1}`}
                                                </p>
                                            </div>
                                            <a
                                                href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Download className="w-4 h-4 mr-1.5" />{" "}
                                                Download
                                            </a>
                                        </li>
                                    );
                                } else if (item.type === "link") {
                                    return (
                                        <li
                                            key={index}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            <div className="bg-green-100 text-green-600 p-2 rounded-md mr-3">
                                                <ExternalLink className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.original_name ||
                                                        "Tautan Eksternal"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.data}
                                                </p>
                                            </div>
                                            <a
                                                href={item.data}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1.5" />{" "}
                                                Buka Link
                                            </a>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                        </ul>
                    );
                } else {
                    // Penanganan format lama
                    return (
                        <ul className="space-y-2">
                            {submissionData.map((filePath, index) => {
                                const fullFileName = filePath.split("/").pop();
                                return (
                                    <li
                                        key={index}
                                        className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                File Lampiran {index + 1}
                                            </p>
                                        </div>
                                        <a
                                            href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Download className="w-4 h-4 mr-1.5" />{" "}
                                            Download
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }
            }
        } catch (e) {
            // fallback raw
            const fullFileName = filePengumpulan.split("/").pop();
            return (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            Berkas Tugas
                        </p>
                    </div>
                    <a
                        href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`}
                        className="ml-3 inline-flex items-center px-3 py-1.5 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Download
                    </a>
                </div>
            );
        }
    };

    return (
        <DashboardLayout>
            <Head title="Detail Pengumpulan Tugas" />

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 flex items-center justify-between border-b">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route("praktikan.riwayat")}
                            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {tugasPraktikum?.judul_tugas || "Judul Tugas"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {tugasPraktikum?.praktikum?.mata_kuliah ||
                                    "Praktikum"}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(riwayat.status)}`}
                    >
                        {getStatusIcon(riwayat.status)}
                        <span className="ml-1.5 capitalize">
                            {riwayat.status.replace("_", " ")}
                        </span>
                    </span>
                </div>

                <div className="p-6 space-y-5">
                    {/* Waktu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500">Tenggat:</span>
                            <span className="font-medium text-gray-800">
                                {formatDate(tugasPraktikum?.deadline)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500">Dikumpulkan:</span>
                            <span className="font-medium text-gray-800">
                                {formatDate(riwayat.submitted_at)}
                            </span>
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Deskripsi Tugas
                        </p>
                        {tugasPraktikum?.deskripsi ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {tugasPraktikum.deskripsi}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">
                                Tidak ada deskripsi.
                            </p>
                        )}
                    </div>

                    {/* File Instruksi + PDF Viewer */}
                    {tugasPraktikum?.file_tugas && (
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700">
                                    File Instruksi / Soal
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPdf(!showPdf)}
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        {showPdf ? "Sembunyikan" : "Lihat PDF"}
                                    </button>
                                    <a
                                        href={route(
                                            "praktikum.tugas.download",
                                            { tugas: tugasPraktikum.id },
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-1.5" />{" "}
                                        Unduh
                                    </a>
                                </div>
                            </div>
                            {showPdf && (
                                <iframe
                                    src={route("praktikum.tugas.download", {
                                        tugas: tugasPraktikum.id,
                                    })}
                                    className="w-full border border-gray-200 rounded-lg"
                                    style={{ height: "520px" }}
                                    title="File Instruksi"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lampiran Pengumpulan */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        File / Lampiran Pengumpulan
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    {renderFiles(riwayat.file_pengumpulan)}
                    {riwayat.catatan && (
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-500 mb-2">
                                Catatan ke Asisten
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700">
                                {riwayat.catatan}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hasil Penilaian */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-800">
                        Hasil Penilaian
                    </h2>
                </div>
                <div className="p-6">
                    {riwayat.status === "dinilai" ? (
                        <div className="space-y-5">
                            {/* Nilai */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-600">
                                    Nilai Akhir
                                </span>
                                <span className="text-3xl font-bold text-gray-900">
                                    {parseFloat(
                                        riwayat.total_nilai_with_bonus,
                                    ).toFixed(1)}
                                </span>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Nilai Dasar (Rubrik)
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {parseFloat(riwayat.nilai || 0).toFixed(
                                            1,
                                        )}
                                    </span>
                                </div>
                                {riwayat.total_nilai_tambahan > 0 && (
                                    <div className="flex justify-between items-center text-sm text-blue-600">
                                        <span>Total Bonus</span>
                                        <span className="font-bold">
                                            +
                                            {parseFloat(
                                                riwayat.total_nilai_tambahan,
                                            ).toFixed(1)}
                                        </span>
                                    </div>
                                )}
                                {riwayat.detail_nilai_tambahan &&
                                    riwayat.detail_nilai_tambahan.length >
                                        0 && (
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-2">
                                            {riwayat.detail_nilai_tambahan.map(
                                                (bonus, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex justify-between text-gray-600"
                                                    >
                                                        <span className="italic">
                                                            {bonus.keterangan ||
                                                                "Nilai tambahan"}
                                                        </span>
                                                        <span className="font-semibold text-blue-600">
                                                            +
                                                            {parseFloat(
                                                                bonus.nilai,
                                                            ).toFixed(1)}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Feedback */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <MessageCircle className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700">
                                        Catatan Asisten / Dosen
                                    </p>
                                </div>
                                {riwayat.feedback ? (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {riwayat.feedback}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                        Tidak ada catatan.
                                    </p>
                                )}
                            </div>

                            {riwayat.dinilai_at && (
                                <p className="text-xs text-gray-400 text-center">
                                    Dinilai pada:{" "}
                                    {formatDate(riwayat.dinilai_at)}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600">
                                Belum Dinilai
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Tugas Anda telah diterima, menunggu proses
                                penilaian.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
