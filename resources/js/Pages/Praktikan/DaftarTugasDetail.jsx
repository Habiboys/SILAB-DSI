import { Head, Link, router } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Info,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function DaftarTugasDetail({ tugas, pengumpulan }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [lampiranSearchQuery, setLampiranSearchQuery] = useState("");
    const [uploadForm, setUploadForm] = useState({
        files: [],
        links: [],
        catatan: "",
    });

    
    const getCsrfToken = () => {
        return document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
    };

    const isLate = new Date() > new Date(tugas.deadline);

    const getStatusBadge = () => {
        if (!pengumpulan) {
            return isLate ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="w-4 h-4 mr-1.5" /> Terlambat
                </span>
            ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <Clock className="w-4 h-4 mr-1.5" /> Belum Dikumpulkan
                </span>
            );
        }

        switch (pengumpulan.status) {
            case "dikumpulkan":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Telah
                        Dikumpulkan
                    </span>
                );
            case "terlambat":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <AlertCircle className="w-4 h-4 mr-1.5" /> Dikumpulkan
                        Terlambat
                    </span>
                );
            case "dinilai":
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Sudah Dinilai
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <Info className="w-4 h-4 mr-1.5" /> {pengumpulan.status}
                    </span>
                );
        }
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setUploadForm((prev) => ({
            ...prev,
            files: [...prev.files, ...newFiles],
        }));
    };

    const removeFile = (index) => {
        setUploadForm((prev) => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index),
        }));
    };

    const addLink = () => {
        setUploadForm((prev) => ({
            ...prev,
            links: [...prev.links, ""],
        }));
    };

    const updateLink = (index, value) => {
        setUploadForm((prev) => ({
            ...prev,
            links: prev.links.map((link, i) => (i === index ? value : link)),
        }));
    };

    const removeLink = (index) => {
        setUploadForm((prev) => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = () => {
        if (uploadForm.files.length === 0 && uploadForm.links.length === 0) {
            toast.error(
                "Minimal harus ada satu file atau satu link untuk dikumpulkan.",
            );
            return;
        }

        const validLinks = uploadForm.links.filter(
            (link) => link.trim() !== "",
        );

        setIsSubmitting(true);
        const formData = new FormData();

        uploadForm.files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        validLinks.forEach((link, index) => {
            formData.append(`links[${index}]`, link);
        });

        formData.append("catatan", uploadForm.catatan);
        formData.append("tugas_praktikum_id", tugas.id);

        router.post(`/praktikum/tugas/${tugas.id}/pengumpulan`, formData, {
            onSuccess: () => {
                toast.success("Tugas berhasil dikumpulkan!");
                setUploadForm({ files: [], links: [], catatan: "" });
            },
            onError: (errors) => {
                toast.error(
                    "Gagal mengumpulkan tugas: " +
                        (errors.message || "Terjadi kesalahan"),
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleConfirmCancel = async () => {
        if (!pengumpulan) return;

        try {
            const response = await fetch(
                `/praktikum/pengumpulan/${pengumpulan.id}/cancel`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": getCsrfToken(),
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                toast.success("Pengumpulan tugas berhasil dibatalkan");
                setIsConfirmModalOpen(false);
                window.location.reload();
            } else {
                toast.error(
                    data.message || "Gagal membatalkan pengumpulan tugas",
                );
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Terjadi kesalahan saat membatalkan pengumpulan tugas");
        }
    };

    
    let submittedFiles = [];
    let submittedLinks = [];

    if (pengumpulan && pengumpulan.file_pengumpulan) {
        try {
            const attachments = JSON.parse(pengumpulan.file_pengumpulan);
            if (Array.isArray(attachments)) {
                
                attachments.forEach((item) => {
                    if (typeof item === "string") {
                        if (
                            item.startsWith("http://") ||
                            item.startsWith("https://")
                        ) {
                            submittedLinks.push({ title: item, url: item });
                        } else {
                            const fileName =
                                item.split("/").pop() || "File Attachment";
                            submittedFiles.push({
                                title: fileName,
                                path: item,
                            });
                        }
                    } else if (item && item.type) {
                        if (item.type === "file")
                            submittedFiles.push({
                                ...item,
                                path: item.path || item.data || "",
                            });
                        else if (item.type === "link")
                            submittedLinks.push(item);
                    }
                });
            } else if (attachments && typeof attachments === "object") {
                
                submittedFiles = attachments.files || [];
                submittedLinks = attachments.links || [];
            }
        } catch (e) {
            console.error("Gagal parse file pengumpulan", e);
            if (typeof pengumpulan.file_pengumpulan === "string") {
                if (pengumpulan.file_pengumpulan.startsWith("http")) {
                    submittedLinks.push({
                        title: pengumpulan.file_pengumpulan,
                        url: pengumpulan.file_pengumpulan,
                    });
                } else {
                    const fileName =
                        pengumpulan.file_pengumpulan.split("/").pop() ||
                        "File Attachment";
                    submittedFiles.push({
                        title: fileName,
                        path: pengumpulan.file_pengumpulan,
                    });
                }
            }
        }
    }

    const filteredSubmittedFiles = useMemo(() => {
        const q = lampiranSearchQuery.trim().toLowerCase();
        if (!q) return submittedFiles;

        return submittedFiles.filter((file) => {
            const filePath = file?.path || file?.data || "";
            const displayName =
                file?.title ||
                file?.original_name ||
                filePath.split("/").pop() ||
                "";
            return `${displayName} ${filePath}`.toLowerCase().includes(q);
        });
    }, [submittedFiles, lampiranSearchQuery]);

    const filteredSubmittedLinks = useMemo(() => {
        const q = lampiranSearchQuery.trim().toLowerCase();
        if (!q) return submittedLinks;

        return submittedLinks.filter((link) => {
            const title = link?.title || "";
            const url = link?.url || "";
            return `${title} ${url}`.toLowerCase().includes(q);
        });
    }, [submittedLinks, lampiranSearchQuery]);

    return (
        <DashboardLayout>
            <Head title="Detail Tugas" />

            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 flex items-center justify-between border-b">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route("praktikan.daftar-tugas")}
                            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {tugas.judul_tugas}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {tugas.praktikum?.mata_kuliah || "Praktikum"}
                            </p>
                        </div>
                    </div>
                    <div>{getStatusBadge()}</div>
                </div>

                <div className="p-6 space-y-5">
                    
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500 font-medium">
                            Deadline:
                        </span>
                        <span
                            className={
                                isLate && !pengumpulan
                                    ? "text-red-600 font-medium"
                                    : "text-gray-800 font-medium"
                            }
                        >
                            {new Date(tugas.deadline).toLocaleDateString(
                                "id-ID",
                                {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                },
                            )}{" "}
                            {new Date(tugas.deadline).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            WIB
                        </span>
                        {isLate && !pengumpulan && (
                            <span className="text-xs text-red-500 font-medium">
                                (Terlambat)
                            </span>
                        )}
                    </div>

                    
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Deskripsi Tugas
                        </p>
                        {tugas.deskripsi ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {tugas.deskripsi}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">
                                Tidak ada deskripsi tambahan.
                            </p>
                        )}
                    </div>

                    
                    {tugas.file_tugas && (
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700">
                                    File Instruksi / Soal
                                </p>
                                <a
                                    href={route(
                                        "praktikan.tugas.view-instruksi",
                                        {
                                            tugas: tugas.id,
                                        },
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 mr-1.5" />
                                    Lihat Instruksi
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            
            {!pengumpulan && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b flex items-center gap-2">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Pengumpulan Tugas
                        </h2>
                    </div>
                    <div className="p-6">
                        {isLate ? (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">
                                        Batas Waktu Telah Berlalu
                                    </p>
                                    <p className="text-sm mt-1">
                                        Anda mengirimkan tugas ini melebihi
                                        batas waktu yang ditentukan.
                                        Keterlambatan mungkin mempengaruhi
                                        penilaian.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 flex items-start gap-3">
                                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">
                                    Silakan unggah file tugas atau cantumkan
                                    tautan terkait pengumpulan tugas Anda di
                                    bawah ini.
                                </p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload File
                                </label>
                                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-gray-50">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-9 w-9 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                            >
                                                <span>
                                                    Pilih file untuk diunggah
                                                </span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    multiple
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">
                                                atau seret dan lepas
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Bisa lebih dari 1 file.
                                        </p>
                                    </div>
                                </div>
                                {uploadForm.files.length > 0 && (
                                    <ul className="mt-3 space-y-2">
                                        {uploadForm.files.map((file, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700 truncate max-w-xs">
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFile(idx)
                                                    }
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tautan / Link
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Tambah
                                        Link
                                    </button>
                                </div>
                                {uploadForm.links.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">
                                        Belum ada tautan ditambahkan.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {uploadForm.links.map((link, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2"
                                            >
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <ExternalLink className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={link}
                                                        onChange={(e) =>
                                                            updateLink(
                                                                idx,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="block w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeLink(idx)
                                                    }
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="catatan"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Catatan{" "}
                                    <span className="text-gray-400 font-normal">
                                        (Opsional)
                                    </span>
                                </label>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    value={uploadForm.catatan}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            catatan: e.target.value,
                                        })
                                    }
                                    className="block w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Tambahkan catatan untuk asisten laboratorium (opsional)..."
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={
                                        isSubmitting ||
                                        (uploadForm.files.length === 0 &&
                                            uploadForm.links.length === 0)
                                    }
                                    className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>{" "}
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />{" "}
                                            Kumpulkan Tugas
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            
            {pengumpulan && (
                <>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Status Pengumpulan
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Status
                                </p>
                                <div>{getStatusBadge()}</div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Waktu Pengumpulan
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                    {new Date(
                                        pengumpulan.submitted_at,
                                    ).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}{" "}
                                    {new Date(
                                        pengumpulan.submitted_at,
                                    ).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}{" "}
                                    WIB
                                </p>
                            </div>
                            {pengumpulan.status === "dinilai" &&
                                pengumpulan.dinilai_at && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">
                                            Waktu Penilaian
                                        </p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {new Date(
                                                pengumpulan.dinilai_at,
                                            ).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                )}
                            {pengumpulan.status !== "dinilai" && (
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() =>
                                            setIsConfirmModalOpen(true)
                                        }
                                        className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                                    >
                                        <X className="w-4 h-4 mr-2" /> Batalkan
                                        Pengumpulan
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Tugas yang dibatalkan dapat dikumpulkan
                                        kembali.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Lampiran Jawaban
                            </h2>
                        </div>
                        <div className="p-6 space-y-5">
                            {pengumpulan.catatan && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">
                                        Catatan
                                    </p>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                                        {pengumpulan.catatan}
                                    </div>
                                </div>
                            )}

                            <div className="w-full sm:w-1/2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari file atau tautan lampiran..."
                                    value={lampiranSearchQuery}
                                    onChange={(e) =>
                                        setLampiranSearchQuery(e.target.value)
                                    }
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            {filteredSubmittedFiles.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">
                                        File Terlampir
                                    </p>
                                    <ul className="space-y-2">
                                        {filteredSubmittedFiles.map(
                                            (file, idx) => {
                                                const filePath =
                                                    file.path ||
                                                    file.data ||
                                                    "";
                                                const displayName =
                                                    file.title ||
                                                    file.original_name ||
                                                    filePath.split("/").pop() ||
                                                    "File";
                                                return (
                                                    <li key={idx}>
                                                        <a
                                                            href={
                                                                route(
                                                                    "praktikum.pengumpulan.download",
                                                                    pengumpulan.id,
                                                                ) +
                                                                `?file=${encodeURIComponent(filePath)}`
                                                            }
                                                            className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                                        >
                                                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                                                                {displayName}
                                                            </span>
                                                            <Download className="w-4 h-4 text-blue-600 ml-3 flex-shrink-0" />
                                                        </a>
                                                    </li>
                                                );
                                            },
                                        )}
                                    </ul>
                                </div>
                            )}

                            {filteredSubmittedLinks.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">
                                        Tautan Terlampir
                                    </p>
                                    <ul className="space-y-2">
                                        {filteredSubmittedLinks.map(
                                            (link, idx) => (
                                                <li key={idx}>
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-gray-400 mr-3 group-hover:text-blue-500 flex-shrink-0" />
                                                        <span className="text-sm text-blue-600 hover:underline truncate">
                                                            {link.title ||
                                                                link.url}
                                                        </span>
                                                    </a>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                            {filteredSubmittedFiles.length === 0 &&
                                filteredSubmittedLinks.length === 0 &&
                                !pengumpulan.catatan && (
                                    <p className="text-sm text-gray-400 italic text-center py-4">
                                        Tidak ada lampiran.
                                    </p>
                                )}

                            {(submittedFiles.length > 0 ||
                                submittedLinks.length > 0) &&
                                filteredSubmittedFiles.length === 0 &&
                                filteredSubmittedLinks.length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-4">
                                        Tidak ada lampiran yang cocok dengan
                                        pencarian.
                                    </p>
                                )}
                        </div>
                    </div>
                </>
            )}

            
            <ConfirmModal
                show={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Batalkan Pengumpulan Tugas?"
                message="Pengumpulan yang dibatalkan akan dihapus dan Anda harus mengirim ulang jika ingin dinilai."
                confirmText="Ya, Batalkan"
                cancelText="Tidak, Tutup"
                type="danger"
            />
        </DashboardLayout>
    );
}
