import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Upload, History, Calendar } from 'lucide-react';

export default function PraktikumTugas({ praktikan, tugasPraktikums, riwayatPengumpulan }) {
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);

    const submitForm = useForm({
        file_pengumpulan: null,
        catatan: '',
    });

    const openSubmitModal = (tugas) => {
        setSelectedTugas(tugas);
        submitForm.reset();
        setIsSubmitModalOpen(true);
    };

    const closeSubmitModal = () => {
        setIsSubmitModalOpen(false);
        setSelectedTugas(null);
        submitForm.reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        submitForm.post(route('praktikum.tugas.pengumpulan.store', { tugas: selectedTugas.id }), {
            preserveScroll: true,
            onSuccess: () => {
                closeSubmitModal();
                // Reload page to update data
                window.location.reload();
            },
            onError: () => {
                // Error handling
            }
        });
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

    const isDeadlinePassed = (deadline) => {
        return new Date(deadline) < new Date();
    };

    return (
        <>
            <Head title={`Tugas ${praktikan.praktikum.nama_praktikum}`} />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center py-4">
                            <Link
                                href={route('praktikan.dashboard')}
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {praktikan.praktikum.nama_praktikum}
                                </h1>
                                <p className="text-gray-600">
                                    Laboratorium: {praktikan.kepengurusanLab.laboratorium.nama} | 
                                    Periode: {praktikan.praktikum.periode}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Tugas List */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Tugas</h2>
                        
                        {tugasPraktikums.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada tugas</h3>
                                <p className="mt-1 text-sm text-gray-500">Belum ada tugas yang diberikan untuk praktikum ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {tugasPraktikums.map((tugas) => {
                                    const pengumpulan = riwayatPengumpulan.find(
                                        r => r.tugas_praktikum_id === tugas.id
                                    );
                                    const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                    const isTerlambat = isDeadlinePassed(tugas.deadline);
                                    
                                    return (
                                        <div key={tugas.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {tugas.judul_tugas}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                    {getStatusIcon(status)}
                                                    <span className="ml-1 capitalize">
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                </span>
                                            </div>
                                            
                                            {tugas.deskripsi && (
                                                <p className="text-gray-600 mb-4">{tugas.deskripsi}</p>
                                            )}
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                
                                                {isTerlambat && (
                                                    <div className="text-sm text-red-600 font-medium">
                                                        ⚠️ Deadline telah lewat
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* File Tugas */}
                                            {tugas.file_tugas && (
                                                <div className="mb-4">
                                                    <a
                                                        href={`/storage/${tugas.file_tugas}`}
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download File Tugas
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* Status Pengumpulan */}
                                            {pengumpulan && (
                                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900 mb-1">
                                                            Status Pengumpulan:
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center">
                                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                                <span>Dikumpulkan: {new Date(pengumpulan.submitted_at).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            
                                                            {pengumpulan.nilai && (
                                                                <div className="flex items-center">
                                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                                    <span>Nilai: {pengumpulan.nilai}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {pengumpulan.feedback && (
                                                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                                                    <strong>Feedback:</strong> {pengumpulan.feedback}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Action Button */}
                                            {!pengumpulan && !isTerlambat && (
                                                <button
                                                    onClick={() => openSubmitModal(tugas)}
                                                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Kumpul Tugas
                                                </button>
                                            )}
                                            
                                            {!pengumpulan && isTerlambat && (
                                                <div className="text-center py-2 text-sm text-red-600 font-medium">
                                                    Deadline telah lewat
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Submit Tugas */}
            {isSubmitModalOpen && selectedTugas && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Kumpul Tugas</h3>
                            <button 
                                onClick={closeSubmitModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-800">{selectedTugas.judul_tugas}</h4>
                            <p className="text-sm text-gray-600">
                                Deadline: {new Date(selectedTugas.deadline).toLocaleDateString('id-ID')}
                            </p>
                            {selectedTugas.deskripsi && (
                                <p className="text-sm text-gray-600 mt-1">{selectedTugas.deskripsi}</p>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <div className="mb-4">
                                <label htmlFor="file_pengumpulan" className="block text-sm font-medium text-gray-700 mb-1">
                                    File Tugas *
                                </label>
                                <input
                                    type="file"
                                    id="file_pengumpulan"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        submitForm.errors.file_pengumpulan ? 'border-red-500' : 'border-gray-300'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    onChange={(e) => submitForm.setData('file_pengumpulan', e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.zip,.rar"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Format: PDF, DOC, DOCX, ZIP, RAR. Maksimal 10MB.
                                </p>
                                {submitForm.errors.file_pengumpulan && (
                                    <p className="mt-1 text-sm text-red-600">{submitForm.errors.file_pengumpulan}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    id="catatan"
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        submitForm.errors.catatan ? 'border-red-500' : 'border-gray-300'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    value={submitForm.data.catatan}
                                    onChange={(e) => submitForm.setData('catatan', e.target.value)}
                                    placeholder="Tambahkan catatan atau keterangan tambahan..."
                                />
                                {submitForm.errors.catatan && (
                                    <p className="mt-1 text-sm text-red-600">{submitForm.errors.catatan}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeSubmitModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitForm.processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                                >
                                    {submitForm.processing ? 'Mengumpulkan...' : 'Kumpul Tugas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
