import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Download, ExternalLink, FileText, MessageCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'dikumpulkan': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'dinilai': return 'text-green-600 bg-green-100 border-green-200';
            case 'terlambat': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'dikumpulkan': return <Clock className="w-5 h-5" />;
            case 'dinilai': return <CheckCircle className="w-5 h-5" />;
            case 'terlambat': return <XCircle className="w-5 h-5" />;
            default: return <AlertCircle className="w-5 h-5" />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fungsi bantu untuk merender link/file
    const renderFiles = (filePengumpulan) => {
        if (!filePengumpulan) return <span className="text-gray-400 italic">Tidak ada file yang dilampirkan</span>;
        
        try {
            const submissionData = JSON.parse(filePengumpulan);
            if (Array.isArray(submissionData) && submissionData.length > 0) {
                if (typeof submissionData[0] === 'object' && submissionData[0].type) {
                    return (
                        <ul className="space-y-2">
                            {submissionData.map((item, index) => {
                                if (item.type === 'file') {
                                    const fullFileName = item.data.split('/').pop();
                                    return (
                                        <li key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.original_name || `File Lampiran ${index + 1}`}
                                                </p>
                                            </div>
                                            <a 
                                                href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Download className="w-4 h-4 mr-1.5" /> Download
                                            </a>
                                        </li>
                                    );
                                } else if (item.type === 'link') {
                                    return (
                                        <li key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="bg-green-100 text-green-600 p-2 rounded-md mr-3">
                                                <ExternalLink className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.original_name || 'Tautan Eksternal'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{item.data}</p>
                                            </div>
                                            <a 
                                                href={item.data}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1.5" /> Buka Link
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
                                const fullFileName = filePath.split('/').pop();
                                return (
                                    <li key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3"><FileText className="w-5 h-5" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">File Lampiran {index + 1}</p>
                                        </div>
                                        <a href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                            <Download className="w-4 h-4 mr-1.5" /> Download
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
            const fullFileName = filePengumpulan.split('/').pop();
            return (
                 <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3"><FileText className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Berkas Tugas</p>
                    </div>
                    <a href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`} className="ml-3 inline-flex items-center px-3 py-1.5 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-1.5" /> Download
                    </a>
                </div>
            )
        }
    };

    return (
        <DashboardLayout>
            <Head title="Detail Pengumpulan Tugas" />
            
            <div className="mb-6">
                <Link href={route('praktikan.riwayat')} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Riwayat Tugas
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-2/3 space-y-6">
                    {/* Header Informasi */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                    {tugasPraktikum?.judul_tugas || "Judul Tugas Tidak Diketahui"}
                                </h1>
                                <p className="text-gray-500 font-medium">
                                    {tugasPraktikum?.praktikum?.mata_kuliah || "Praktikum Tidak Diketahui"}
                                </p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(riwayat.status)}`}>
                                {getStatusIcon(riwayat.status)}
                                <span className="ml-1.5 capitalize">{riwayat.status.replace('_', ' ')}</span>
                            </span>
                        </div>
                        
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-3">Deskripsi Tugas</h3>
                            <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {tugasPraktikum?.deskripsi || <span className="italic text-gray-400">Tidak ada deskripsi.</span>}
                            </div>
                            
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start">
                                    <div className="mt-0.5 bg-red-50 p-2 rounded text-red-500 mr-3">
                                        <Calendar className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Tenggat Waktu</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(tugasPraktikum?.deadline)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="mt-0.5 bg-blue-50 p-2 rounded text-blue-500 mr-3">
                                        <Clock className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Waktu Kumpul</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(riwayat.submitted_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lampiran File Tugas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">File/Lampiran Pengumpulan</h3>
                        </div>
                        <div className="p-6">
                            {renderFiles(riwayat.file_pengumpulan)}
                            
                            {riwayat.catatan && (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Pesan/Catatan ke Asisten:</p>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-gray-700">
                                        {riwayat.catatan}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3 space-y-6">
                    {/* Kartu Penilaian Lengkap */}
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">Hasil Penilaian</h3>
                        </div>
                        
                        <div className="p-6">
                            {riwayat.status === 'dinilai' ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                        <span className="text-sm font-medium text-green-600 mb-1">Nilai Akhir</span>
                                        <span className="text-5xl font-black text-green-700 drop-shadow-sm">{parseFloat(riwayat.total_nilai_with_bonus).toFixed(1)}</span>
                                        {riwayat.total_nilai_with_bonus >= 90 ? <span className="mt-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Sangat Memuaskan!</span> : null}
                                    </div>

                                    {/* Breakdown Nilai */}
                                    <div className="pt-4 border-t border-gray-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Nilai Dasar (Rubrik)</span>
                                            <span className="text-sm font-semibold text-gray-900">{parseFloat(riwayat.nilai || 0).toFixed(1)}</span>
                                        </div>
                                        {riwayat.total_nilai_tambahan > 0 && (
                                            <div className="flex justify-between items-center text-blue-600">
                                                <span className="text-sm flex items-center"><ExternalLink className="w-3 h-3 mr-1" /> Total Bonus</span>
                                                <span className="text-sm font-bold">+{parseFloat(riwayat.total_nilai_tambahan).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {riwayat.detail_nilai_tambahan && riwayat.detail_nilai_tambahan.length > 0 && (
                                             <div className="bg-gray-50 p-3 rounded text-xs space-y-2 mt-2">
                                                {riwayat.detail_nilai_tambahan.map((bonus, i) => (
                                                    <div key={i} className="flex flex-col">
                                                         <div className="flex justify-between italic text-gray-600">
                                                            <span>{bonus.keterangan || "Nilai tambahan"}</span>
                                                            <span className="font-semibold text-blue-600">+{parseFloat(bonus.nilai).toFixed(1)}</span>
                                                         </div>
                                                    </div>
                                                ))}
                                             </div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                            <MessageCircle className="w-4 h-4 mr-1.5 text-gray-500" /> Catatan Asisten / Dosen
                                        </h4>
                                        {riwayat.feedback ? (
                                            <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                                                {riwayat.feedback}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                                                Tidak ada catatan.
                                            </div>
                                        )}
                                    </div>
                                    {riwayat.dinilai_at && (
                                        <p className="text-xs text-center text-gray-400 mt-4">
                                            Dinilai pada: {formatDate(riwayat.dinilai_at)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h4 className="text-base font-medium text-gray-600">Belum Dinilai</h4>
                                    <p className="text-sm text-gray-400 mt-1">Tugas Anda telah diterima namun masih menunggu proses penilaian dari asisten.</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
