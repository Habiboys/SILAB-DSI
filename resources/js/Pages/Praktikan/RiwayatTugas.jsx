import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import PdfViewer from '../../Components/PdfViewer';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Calendar, BookOpen, Eye } from 'lucide-react';

export default function RiwayatTugas({ riwayatPengumpulan, praktikans }) {
    const [selectedPraktikum, setSelectedPraktikum] = useState('all');
    const { flash } = usePage().props;
    
    // Toast notification untuk flash message
    useEffect(() => {
        if (flash && flash.success) {
            // Simple toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
            toast.textContent = flash.success;
            document.body.appendChild(toast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 3000);
        }
    }, [flash?.success]);

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

    const filteredRiwayat = selectedPraktikum === 'all' 
        ? riwayatPengumpulan 
        : riwayatPengumpulan.filter(r => r.tugasPraktikum?.praktikum?.id === selectedPraktikum);

    return (
        <DashboardLayout>
            <Head title="Riwayat Pengumpulan Tugas" />
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 flex items-center border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Riwayat Pengumpulan Tugas</h2>
                        <p className="text-gray-600">Lihat semua tugas yang telah Anda kumpulkan</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Filter */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <label htmlFor="praktikum-filter" className="text-sm font-medium text-gray-700">
                                Filter Praktikum:
                            </label>
                            <select
                                id="praktikum-filter"
                                value={selectedPraktikum}
                                onChange={(e) => setSelectedPraktikum(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
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

                    {/* Riwayat Table */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900">Riwayat Pengumpulan</h3>
                        


                        {filteredRiwayat.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada riwayat</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedPraktikum === 'all' 
                                        ? 'Anda belum mengumpulkan tugas apapun.'
                                        : 'Belum ada tugas yang dikumpulkan untuk praktikum ini.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table - Hidden on mobile */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                    Praktikum
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                    Tugas
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                    Tanggal Kumpul
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-r border-gray-200">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                                    Nilai
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredRiwayat.map((riwayat) => (
                                                <tr key={riwayat.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                        {riwayat.tugasPraktikum?.praktikum?.mata_kuliah || 'Nama Praktikum Tidak Diketahui'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                        <div>
                                                            <div className="font-medium">{riwayat.tugasPraktikum?.judul_tugas || 'Judul Tugas Tidak Diketahui'}</div>
                                                            {riwayat.tugasPraktikum?.deskripsi && (
                                                                <div className="text-gray-500 text-xs mt-1">
                                                                    {riwayat.tugasPraktikum.deskripsi}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                            {new Date(riwayat.submitted_at).toLocaleDateString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(riwayat.status)}`}>
                                                            {getStatusIcon(riwayat.status)}
                                                            <span className="ml-1 capitalize">
                                                                {riwayat.status.replace('_', ' ')}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                        {riwayat.nilai ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {riwayat.nilai}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            {riwayat.file_pengumpulan && (
                                                                <div className="flex flex-col space-y-1">
                                                                    {(() => {
                                                                        try {
                                                                            const files = JSON.parse(riwayat.file_pengumpulan);
                                                                            if (Array.isArray(files)) {
                                                                                return files.map((filePath, index) => (
                                                                                    <a
                                                                                        key={index}
                                                                                        href={route('praktikum.pengumpulan.download.filename', { filename: filePath.split('/').pop() })}
                                                                                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                                    >
                                                                                        <Download className="w-3 h-3 mr-1" />
                                                                                        File {index + 1}
                                                                                    </a>
                                                                                ));
                                                                            }
                                                                        } catch (e) {
                                                                            // Jika bukan JSON, tampilkan sebagai single file
                                                                            return (
                                                                                <a
                                                                                    href={`/storage/${riwayat.file_pengumpulan}`}
                                                                                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                                >
                                                                                    <Download className="w-3 h-3 mr-1" />
                                                                                    Download
                                                                                </a>
                                                                            );
                                                                        }
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards - Hidden on desktop */}
                                <div className="md:hidden space-y-3">
                                    {filteredRiwayat.map((riwayat) => (
                                        <div key={riwayat.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    {riwayat.tugasPraktikum?.praktikum?.mata_kuliah || 'Nama Praktikum Tidak Diketahui'}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {riwayat.tugasPraktikum?.judul_tugas || 'Judul Tugas Tidak Diketahui'}
                                                </p>
                                                {riwayat.tugasPraktikum?.deskripsi && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        {riwayat.tugasPraktikum.deskripsi}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                <span>Tanggal: {new Date(riwayat.submitted_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(riwayat.status)}`}>
                                                    {getStatusIcon(riwayat.status)}
                                                    <span className="ml-1 capitalize">
                                                        {riwayat.status.replace('_', ' ')}
                                                    </span>
                                                </span>
                                                
                                                <div className="text-sm">
                                                    {riwayat.nilai ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {riwayat.nilai}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-gray-100">
                                                {riwayat.file_pengumpulan && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {(() => {
                                                            try {
                                                                const files = JSON.parse(riwayat.file_pengumpulan);
                                                                if (Array.isArray(files)) {
                                                                    return files.map((filePath, index) => (
                                                                        <a
                                                                            key={index}
                                                                            href={route('praktikum.pengumpulan.download.filename', { filename: filePath.split('/').pop() })}
                                                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                        >
                                                                            <Download className="w-3 h-3 mr-1" />
                                                                            File {index + 1}
                                                                        </a>
                                                                    ));
                                                                }
                                                            } catch (e) {
                                                                // Jika bukan JSON, tampilkan sebagai single file
                                                                return (
                                                                    <a
                                                                        href={`/storage/${riwayat.file_pengumpulan}`}
                                                                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        Download
                                                                    </a>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
