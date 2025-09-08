import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import ConfirmModal from '../../Components/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Upload, Calendar, BookOpen, X } from 'lucide-react';

export default function DaftarTugas({ praktikans, tugasPraktikums, riwayatPengumpulan }) {
    const { props } = usePage();
    const [selectedPraktikum, setSelectedPraktikum] = useState('all');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        files: [],
        catatan: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ action: null, pengumpulanId: null });

    // Helper function untuk mendapatkan CSRF token
    const getCsrfToken = () => {
        return props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'dikumpulkan':
                return 'text-blue-600 bg-blue-100';
            case 'dinilai':
                return 'text-green-600 bg-green-100';
            case 'terlambat':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'dikumpulkan':
                return <Clock className="w-4 h-4" />;
            case 'dinilai':
                return <CheckCircle className="w-4 h-4" />;
            case 'terlambat':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const openUploadModal = (tugas) => {
        setSelectedTugas(tugas);
        setUploadForm({ files: [], catatan: '' });
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedTugas(null);
        setUploadForm({ files: [], catatan: '' });
        setIsSubmitting(false);
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setUploadForm(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    };

    const removeFile = (index) => {
        setUploadForm(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        if (uploadForm.files.length === 0) {
            alert('Pilih file terlebih dahulu');
            return;
        }

        setIsSubmitting(true);

        // Buat FormData untuk upload
        const formData = new FormData();
        uploadForm.files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        formData.append('catatan', uploadForm.catatan);
        formData.append('tugas_praktikum_id', selectedTugas.id);

        // Gunakan Inertia router untuk submit
        router.post(`/praktikum/tugas/${selectedTugas.id}/pengumpulan`, formData, {
            onSuccess: () => {
                toast.success('Tugas berhasil dikumpulkan!');
                closeUploadModal();
                // Refresh halaman untuk update status
                window.location.reload();
            },
            onError: (errors) => {
                toast.error('Gagal mengumpulkan tugas: ' + (errors.message || 'Terjadi kesalahan'));
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const openConfirmModal = (action, pengumpulanId) => {
        setConfirmAction({ action, pengumpulanId });
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction({ action: null, pengumpulanId: null });
    };

    const handleConfirmAction = async () => {
        if (confirmAction.action === 'cancel') {
            try {
                const response = await fetch(`/praktikum/pengumpulan/${confirmAction.pengumpulanId}/cancel`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken()
                    }
                });

                const data = await response.json();

                if (data.success) {
                    toast.success('Pengumpulan tugas berhasil dibatalkan');
                    closeConfirmModal();
                    // Refresh halaman untuk update data
                    window.location.reload();
                } else {
                    toast.error(data.message || 'Gagal membatalkan pengumpulan tugas');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Terjadi kesalahan saat membatalkan pengumpulan tugas');
            }
        }
    };

    // Kelompokkan tugas berdasarkan praktikum
    const tugasByPraktikum = {};
    tugasPraktikums.forEach(tugas => {
        const praktikumId = tugas.praktikum_id;
        if (!tugasByPraktikum[praktikumId]) {
            tugasByPraktikum[praktikumId] = [];
        }
        tugasByPraktikum[praktikumId].push(tugas);
    });

    // Filter berdasarkan praktikum yang dipilih
    const filteredTugas = selectedPraktikum === 'all' 
        ? tugasPraktikums 
        : tugasPraktikums.filter(t => t.praktikum_id === selectedPraktikum);

    return (
        <DashboardLayout>
            <Head title="Daftar Tugas Praktikum" />
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-6 flex items-center border-b">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Daftar Tugas Praktikum</h2>
                        <p className="text-sm sm:text-base text-gray-600">Lihat semua tugas yang tersedia untuk praktikum Anda</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Filter */}
                    <div className="mb-6">
                        <div className="flex flex-col space-y-3">
                            <label htmlFor="praktikum-filter" className="text-sm font-medium text-gray-700">
                                Filter Praktikum:
                            </label>
                            <select
                                id="praktikum-filter"
                                value={selectedPraktikum}
                                onChange={(e) => setSelectedPraktikum(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="all">Semua Praktikum</option>
                                {praktikans.map((praktikan) => (
                                    <option key={praktikan.praktikum_id} value={praktikan.praktikum_id}>
                                        {praktikan.praktikum?.mata_kuliah || 'Nama Praktikum Tidak Diketahui'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tugas Table */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900">Daftar Tugas</h3>
                        
                        {filteredTugas.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada tugas</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedPraktikum === 'all' 
                                        ? 'Belum ada tugas yang diberikan untuk praktikum Anda.'
                                        : 'Belum ada tugas yang diberikan untuk praktikum ini.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {selectedPraktikum === 'all' ? (
                                    // Tampilkan tugas dikelompokkan berdasarkan praktikum
                                    Object.entries(tugasByPraktikum).map(([praktikumId, tugasList]) => {
                                        const praktikan = praktikans.find(p => p.praktikum_id === praktikumId);
                                        const praktikum = praktikan?.praktikum;
                                        
                                        if (!praktikum) return null;
                                        
                                        return (
                                            <div key={praktikumId} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                        <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                                                        {praktikum.mata_kuliah || 'Nama Praktikum Tidak Diketahui'}
                                                        {praktikum.kepengurusanLab?.laboratorium?.nama && (
                                                            <span className="ml-2 text-sm text-gray-500">
                                                                ({praktikum.kepengurusanLab.laboratorium.nama})
                                                            </span>
                                                        )}
                                                    </h4>
                                                </div>
                                                
                                                {/* Desktop Table */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                                    Tugas
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                                    Deadline
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-r border-gray-200">
                                                                    Status
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Aksi
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {tugasList.map((tugas) => {
                                                                const pengumpulan = riwayatPengumpulan.find(
                                                                    r => r.tugas_praktikum_id === tugas.id
                                                                );
                                                                const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                                                
                                                                return (
                                                                    <tr key={tugas.id}>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                                            <div>
                                                                                <div className="font-medium">{tugas.judul_tugas}</div>
                                                                                {tugas.deskripsi && (
                                                                                    <div className="text-gray-500 text-xs mt-1">
                                                                                        {tugas.deskripsi}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                                            <div className="flex items-center">
                                                                                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                                                                {new Date(tugas.deadline).toLocaleDateString('id-ID')} {new Date(tugas.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                                                {getStatusIcon(status)}
                                                                                <span className="ml-1 capitalize">
                                                                                    {status.replace('_', ' ')}
                                                                                </span>
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                            <div className="flex space-x-2">
                                                                                {tugas.file_tugas && (
                                                                                    <a
                                                                                        href={route('praktikum.tugas.download', { tugas: tugas.id })}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                                    >
                                                                                        <Download className="w-3 h-3 mr-1" />
                                                                                        Lihat Instruksi
                                                                                    </a>
                                                                                )}
                                                                                {!pengumpulan ? (
                                                                                    <button 
                                                                                        onClick={() => openUploadModal(tugas)}
                                                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                                                    >
                                                                                        <Upload className="w-3 h-3 mr-1" />
                                                                                        Kumpul
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="flex space-x-2">
                                                                                        {pengumpulan.status !== 'dinilai' && (
                                                                                            <button
                                                                                                onClick={() => openConfirmModal('cancel', pengumpulan.id)}
                                                                                                className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                                                            >
                                                                                                <X className="w-3 h-3 mr-1" />
                                                                                                Cancel
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mobile Cards */}
                                                <div className="md:hidden space-y-4 p-4">
                                                    {tugasList.map((tugas) => {
                                                        const pengumpulan = riwayatPengumpulan.find(
                                                            r => r.tugas_praktikum_id === tugas.id
                                                        );
                                                        const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                                        
                                                        return (
                                                            <div key={tugas.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900 text-base">{tugas.judul_tugas}</h4>
                                                                    {tugas.deskripsi && (
                                                                        <p className="text-gray-500 text-sm mt-2">{tugas.deskripsi}</p>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Clock className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm">Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')} {new Date(tugas.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                
                                                                <div className="flex flex-col space-y-3">
                                                                    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status)} w-fit`}>
                                                                        {getStatusIcon(status)}
                                                                        <span className="ml-2 capitalize">
                                                                            {status.replace('_', ' ')}
                                                                        </span>
                                                                    </span>
                                                                    
                                                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                                                                        {tugas.file_tugas && (
                                                                            <a
                                                                                href={route('praktikum.tugas.download', { tugas: tugas.id })}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                                                                            >
                                                                                <Download className="w-4 h-4 mr-2" />
                                                                                Lihat Instruksi
                                                                            </a>
                                                                        )}
                                                                        {!pengumpulan ? (
                                                                            <button
                                                                                onClick={() => openUploadModal(tugas)}
                                                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                                                            >
                                                                                <Upload className="w-4 h-4 mr-2" />
                                                                                Kumpul Tugas
                                                                            </button>
                                                                        ) : (
                                                                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                                                                                {pengumpulan.status !== 'dinilai' && (
                                                                                    <button
                                                                                        onClick={() => openConfirmModal('cancel', pengumpulan.id)}
                                                                                        className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
                                                                                    >
                                                                                        <X className="w-4 h-4 mr-2" />
                                                                                        Batalkan
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    // Tampilkan tugas dalam format table biasa untuk praktikum tertentu
                                    <>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                            Tugas
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                            Deadline
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-r border-gray-200">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Aksi
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredTugas.map((tugas) => {
                                                        const pengumpulan = riwayatPengumpulan.find(
                                                            r => r.tugas_praktikum_id === tugas.id
                                                        );
                                                        const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                                        
                                                        return (
                                                            <tr key={tugas.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                                    <div>
                                                                        <div className="font-medium">{tugas.judul_tugas}</div>
                                                                        {tugas.deskripsi && (
                                                                            <div className="text-gray-500 text-xs mt-1">
                                                                                {tugas.deskripsi}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                                    <div className="flex items-center">
                                                                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                                                        {new Date(tugas.deadline).toLocaleDateString('id-ID')} {new Date(tugas.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                                        {getStatusIcon(status)}
                                                                        <span className="ml-1 capitalize">
                                                                            {status.replace('_', ' ')}
                                                                        </span>
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                    <div className="flex space-x-2">
                                                                        {tugas.file_tugas && (
                                                                            <a
                                                                                href={route('praktikum.tugas.download', { tugas: tugas.id })}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                            >
                                                                                <Download className="w-3 h-3 mr-1" />
                                                                                Lihat Instruksi
                                                                            </a>
                                                                        )}
                                                                        {!pengumpulan && (
                                                                            <button 
                                                                                onClick={() => openUploadModal(tugas)}
                                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                                            >
                                                                                <Upload className="w-3 h-3 mr-1" />
                                                                                Kumpul
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Cards untuk Praktikum Tertentu */}
                                        <div className="md:hidden space-y-4 p-4">
                                            {filteredTugas.map((tugas) => {
                                                const pengumpulan = riwayatPengumpulan.find(
                                                    r => r.tugas_praktikum_id === tugas.id
                                                );
                                                const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                                
                                                return (
                                                    <div key={tugas.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 text-base">{tugas.judul_tugas}</h4>
                                                            {tugas.deskripsi && (
                                                                <p className="text-gray-500 text-sm mt-2">{tugas.deskripsi}</p>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Clock className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm">Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')} {new Date(tugas.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        
                                                        <div className="flex flex-col space-y-3">
                                                            <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status)} w-fit`}>
                                                                {getStatusIcon(status)}
                                                                <span className="ml-2 capitalize">
                                                                    {status.replace('_', ' ')}
                                                                </span>
                                                            </span>
                                                            
                                                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                                                                {tugas.file_tugas && (
                                                                    <a
                                                                        href={route('praktikum.tugas.download', { tugas: tugas.id })}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                                                                    >
                                                                        <Download className="w-4 h-4 mr-2" />
                                                                        Lihat Instruksi
                                                                    </a>
                                                                )}
                                                                {!pengumpulan ? (
                                                                    <button
                                                                        onClick={() => openUploadModal(tugas)}
                                                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                                                    >
                                                                        <Upload className="w-4 h-4 mr-2" />
                                                                        Kumpul Tugas
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                                                                        {pengumpulan.status !== 'dinilai' && (
                                                                            <button
                                                                                onClick={() => openConfirmModal('cancel', pengumpulan.id)}
                                                                                className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
                                                                            >
                                                                                <X className="w-4 h-4 mr-2" />
                                                                                Batalkan
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Pengumpulan Tugas */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Kumpul Tugas</h3>
                            <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">{selectedTugas?.judul_tugas}</h4>
                            <p className="text-sm text-gray-600">
                                Praktikum: {selectedTugas?.praktikum?.mata_kuliah || 'Nama Praktikum Tidak Diketahui'}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Tugas * (Max: 10MB per file)
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                accept=".pdf,.doc,.docx,.zip,.rar"
                                multiple
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Format: PDF, DOC, DOCX, ZIP, RAR
                            </p>
                            {uploadForm.files.length > 0 && (
                                <div className="mt-2 text-sm text-gray-600">
                                    {uploadForm.files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between py-1">
                                            <span>{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={uploadForm.catatan}
                                onChange={(e) => setUploadForm(prev => ({ ...prev, catatan: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                rows="3"
                                placeholder="Tambahkan catatan atau keterangan tambahan..."
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={closeUploadModal}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="w-full sm:flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <Upload className="w-4 h-4 mr-2 inline" />
                                )}
                                {isSubmitting ? 'Mengkumpulkan...' : 'Kumpul Tugas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

                {/* Confirm Modal */}
                <ConfirmModal
                    show={isConfirmModalOpen}
                    onClose={closeConfirmModal}
                    onConfirm={handleConfirmAction}
                    title="Batalkan Pengumpulan Tugas"
                    message="Apakah Anda yakin ingin membatalkan pengumpulan tugas ini? Anda bisa mengumpulkan ulang nanti."
                    confirmText="Batalkan"
                    cancelText="Tidak"
                    type="warning"
                />
            </DashboardLayout>
        );
    }
