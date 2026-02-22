import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft, Calendar,
    CheckCircle, Clock,
    Download,
    ExternalLink,
    FileText,
    Info, Plus, Trash2,
    Upload, X,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function DaftarTugasDetail({ tugas, pengumpulan }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        files: [],
        links: [],
        catatan: "",
    });

    // Helper CSRF Token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
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
            case 'dikumpulkan':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Telah Dikumpulkan
                    </span>
                );
            case 'terlambat':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <AlertCircle className="w-4 h-4 mr-1.5" /> Dikumpulkan Terlambat
                    </span>
                );
            case 'dinilai':
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
            toast.error("Minimal harus ada satu file atau satu link untuk dikumpulkan.");
            return;
        }

        const validLinks = uploadForm.links.filter((link) => link.trim() !== "");

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
                toast.error("Gagal mengumpulkan tugas: " + (errors.message || "Terjadi kesalahan"));
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleConfirmCancel = async () => {
        if (!pengumpulan) return;

        try {
            const response = await fetch(`/praktikum/pengumpulan/${pengumpulan.id}/cancel`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Pengumpulan tugas berhasil dibatalkan");
                setIsConfirmModalOpen(false);
                window.location.reload();
            } else {
                toast.error(data.message || "Gagal membatalkan pengumpulan tugas");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Terjadi kesalahan saat membatalkan pengumpulan tugas");
        }
    };

    // Parse submitted items
    let submittedFiles = [];
    let submittedLinks = [];

    if (pengumpulan && pengumpulan.file_pengumpulan) {
        try {
            const attachments = JSON.parse(pengumpulan.file_pengumpulan);
            if (Array.isArray(attachments)) {
                // Format lama
                attachments.forEach(item => {
                    if (typeof item === 'string') {
                        if (item.startsWith('http://') || item.startsWith('https://')) {
                            submittedLinks.push({ title: item, url: item });
                        } else {
                            const fileName = item.split('/').pop() || 'File Attachment';
                            submittedFiles.push({ title: fileName, path: item });
                        }
                    } else if (item && item.type) {
                        if (item.type === 'file') submittedFiles.push(item);
                        else if (item.type === 'link') submittedLinks.push(item);
                    }
                });
            } else if (attachments && typeof attachments === 'object') {
                // Format baru { files: [], links: [] }
                submittedFiles = attachments.files || [];
                submittedLinks = attachments.links || [];
            }
        } catch (e) {
            console.error("Gagal parse file pengumpulan", e);
            if (typeof pengumpulan.file_pengumpulan === 'string') {
                if (pengumpulan.file_pengumpulan.startsWith('http')) {
                    submittedLinks.push({ title: pengumpulan.file_pengumpulan, url: pengumpulan.file_pengumpulan });
                } else {
                    const fileName = pengumpulan.file_pengumpulan.split('/').pop() || 'File Attachment';
                    submittedFiles.push({ title: fileName, path: pengumpulan.file_pengumpulan });
                }
            }
        }
    }

    return (
        <DashboardLayout>
            <Head title="Detail Tugas" />

            <div className="mb-6">
                <Link href={route('praktikan.daftar-tugas')} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Tugas
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Task Info & Instructions */}
                <div className="lg:w-2/3 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-xl transform scale-150"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-white/20 px-3 py-1 rounded-md text-sm font-medium backdrop-blur-sm">
                                        {tugas.praktikum?.mata_kuliah || 'Praktikum'}
                                    </span>
                                    {getStatusBadge()}
                                </div>
                                <h1 className="text-2xl font-bold mb-2 leading-tight">
                                    {tugas.judul_tugas}
                                </h1>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Deadline</p>
                                        <p className={`text-base font-medium ${isLate && !pengumpulan ? 'text-red-600' : 'text-gray-900'}`}>
                                            {new Date(tugas.deadline).toLocaleDateString("id-ID", {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(tugas.deadline).toLocaleTimeString("id-ID", {
                                                hour: '2-digit', minute: '2-digit'
                                            })} WIB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-700 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi Tugas</h3>
                                {tugas.deskripsi ? (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line text-sm leading-relaxed">
                                        {tugas.deskripsi}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak ada deskripsi tambahan.</p>
                                )}
                            </div>

                            {tugas.file_tugas && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">File Instruksi / Soal</h3>
                                    <a
                                        href={route("praktikum.tugas.download", { tugas: tugas.id })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Unduh File Instruksi
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Section (if not submitted or if user can cancel) */}
                    {!pengumpulan && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
                                <Upload className="w-5 h-5 text-blue-600 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Pengumpulan Tugas</h2>
                            </div>
                            <div className="p-6">
                                {isLate ? (
                                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start">
                                        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Batas Waktu Telah Berlalu</h4>
                                            <p className="text-sm mt-1">Anda mengirimkan tugas ini melebihi batas waktu yang ditentukan. Keterlambatan mungkin mempengaruhi penilaian.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 flex items-start">
                                        <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm">Silakan unggah file presentasi, laporan, atau cantumkan tautan terkait pengumpulan tugas Anda di bawah ini.</p>
                                    </div>
                                )}

                                {/* Pengumpulan Form */}
                                <div className="space-y-6">
                                    {/* Upload File */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-gray-50/50 relative">
                                            <div className="space-y-1 text-center">
                                                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                        <span>Pilih file untuk diunggah</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                                    </label>
                                                    <p className="pl-1">atau seret dan lepas</p>
                                                </div>
                                                <p className="text-xs text-gray-500">Bisa lebih dari 1 file.</p>
                                            </div>
                                        </div>

                                        {/* List Uploaded Files */}
                                        {uploadForm.files.length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {uploadForm.files.map((file, idx) => (
                                                    <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <div className="flex items-center">
                                                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                                                            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Links */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Tautan / Link</label>
                                            <button type="button" onClick={addLink} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                <Plus className="w-4 h-4 mr-1" /> Tambah Link
                                            </button>
                                        </div>
                                        {uploadForm.links.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Belum ada tautan ditambahkan.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {uploadForm.links.map((link, idx) => (
                                                    <div key={idx} className="flex relative items-center">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="url"
                                                            value={link}
                                                            onChange={(e) => updateLink(idx, e.target.value)}
                                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg p-2.5 border bg-gray-50 focus:bg-white transition-colors"
                                                            placeholder="https://..."
                                                        />
                                                        <button type="button" onClick={() => removeLink(idx)} className="absolute right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Catatan Tambahan */}
                                    <div>
                                        <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                                        <textarea
                                            id="catatan"
                                            rows={3}
                                            value={uploadForm.catatan}
                                            onChange={(e) => setUploadForm({ ...uploadForm, catatan: e.target.value })}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-lg p-3"
                                            placeholder="Tambahkan catatan untuk asisten laboratorium (opsional)..."
                                        />
                                    </div>

                                    {/* Submit Action */}
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || (uploadForm.files.length === 0 && uploadForm.links.length === 0)}
                                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Memproses...</>
                                            ) : (
                                                <><CheckCircle className="w-4 h-4 mr-2" /> Kumpulkan Tugas</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Status & Submission Details */}
                <div className="lg:w-1/3 space-y-6">
                    {/* Status Info */}
                    {(pengumpulan) && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-semibold text-gray-900">Status Tugas</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Status Pengumpulan</p>
                                        <div className="mt-1">{getStatusBadge()}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Waktu Pengumpulan</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(pengumpulan.submitted_at).toLocaleDateString("id-ID", {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(pengumpulan.submitted_at).toLocaleTimeString("id-ID", {
                                                hour: '2-digit', minute: '2-digit'
                                            })} WIB
                                        </p>
                                    </div>
                                    {pengumpulan.status === 'dinilai' && pengumpulan.dinilai_at && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Waktu Penilaian</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(pengumpulan.dinilai_at).toLocaleDateString("id-ID", {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action to Cancel Delivery */}
                                    {pengumpulan.status !== 'dinilai' && (
                                        <div className="pt-6 border-t border-gray-100 mt-6">
                                            <button
                                                onClick={() => setIsConfirmModalOpen(true)}
                                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Batalkan Pengumpulan
                                            </button>
                                            <p className="text-xs text-center text-gray-500 mt-2">
                                                Tugas yang telah dibatalkan dapat diubah dan dikumpul kembali.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Riwayat Lampiran */}
                    {pengumpulan && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-semibold text-gray-900">Lampiran Jawaban</h3>
                            </div>
                            <div className="p-6">
                                {/* Catatan */}
                                {pengumpulan.catatan && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Catatan</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                                            {pengumpulan.catatan}
                                        </div>
                                    </div>
                                )}

                                {/* Files */}
                                {submittedFiles.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-500 mb-3">File Terlampir</h4>
                                        <ul className="space-y-2">
                                            {submittedFiles.map((file, idx) => (
                                                <li key={idx}>
                                                    <a 
                                                        href={route('praktikan.riwayat.download', pengumpulan.id) + `?file=${encodeURIComponent(file.path)}`}
                                                        className="flex items-center p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group shadow-sm bg-white"
                                                    >
                                                        <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-blue-200 transition-colors">
                                                            <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                {file.title || file.path.split('/').pop()}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0 ml-4 group-hover:scale-110 transition-transform">
                                                            <Download className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                                                        </div>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Links */}
                                {submittedLinks.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-3">Tautan Terlampir</h4>
                                        <ul className="space-y-2">
                                            {submittedLinks.map((link, idx) => (
                                                <li key={idx}>
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-gray-400 mr-3 group-hover:text-blue-500" />
                                                        <span className="text-sm text-blue-600 hover:underline truncate">
                                                            {link.title || link.url}
                                                        </span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi Pembatalan */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Batalkan Pengumpulan Tugas?</h3>
                            <p className="text-sm text-center text-gray-500 mb-6">
                                Anda yakin ingin membatalkan pengumpulan ini? Pengumpulan yang dibatalkan akan dihapus dan Anda harus mengirim ulang jika ingin dinilai.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    Tidak, Tutup
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                    Ya, Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
