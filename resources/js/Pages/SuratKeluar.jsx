import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SuratKeluar({ suratKeluar, filters, flash }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filterDate, setFilterDate] = useState(filters.tanggal || '');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSurat, setSelectedSurat] = useState(null);

    // Handle search input changes with debounce
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle date filter changes
    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    // Apply filters when search or date changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route('surat.keluar'), 
                { search: searchTerm, tanggal: filterDate },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 500); // Debounce time

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filterDate]);

    // Show flash messages
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Format date to Indonesian format
    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // Open the view modal
    const openViewModal = (surat) => {
        setSelectedSurat(surat);
        setIsViewModalOpen(true);
    };

    // Handle downloading a letter
    const handleDownload = (surat) => {
        window.open(route('surat.download', surat.id), '_blank');
    };

    // Get status label based on whether the recipient has read the letter
    const getStatusLabel = (isread) => {
        return isread ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Dibaca</span>
        ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Belum Dibaca</span>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Surat Keluar" />
            <ToastContainer />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Surat Keluar</h2>
                    
                    <div className="flex items-center space-x-4">
                        <div>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Filter: Tanggal"
                                value={filterDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Cari Surat"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerima</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Surat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suratKeluar && suratKeluar.length > 0 ? (
                                suratKeluar.map((surat, index) => (
                                    <tr key={surat.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatTanggal(surat.tanggal_surat)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800">
                                            {surat.perihal}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {surat.penerima?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {surat.nomor_surat}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusLabel(surat.isread)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => openViewModal(surat)}
                                                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                                    title="Lihat Surat"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(surat)}
                                                    className="text-green-600 hover:text-green-800 focus:outline-none"
                                                    title="Unduh Surat"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Tidak ada data surat keluar
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {isViewModalOpen && selectedSurat && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Detail Surat</h3>
                            <button 
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nomor Surat</p>
                                    <p className="font-medium">{selectedSurat.nomor_surat}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal</p>
                                    <p className="font-medium">{formatTanggal(selectedSurat.tanggal_surat)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Penerima</p>
                                    <p className="font-medium">{selectedSurat.penerima?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-medium">
                                        {selectedSurat.isread ? 'Sudah Dibaca' : 'Belum Dibaca'}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">Perihal</p>
                                    <p className="font-medium">{selectedSurat.perihal}</p>
                                </div>
                            </div>
                            
                            {/* Preview Dokumen */}
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-2">Preview Dokumen</p>
                                {selectedSurat.file ? (
                                    <div className="bg-gray-100 rounded-md overflow-hidden" style={{ height: '400px' }}>
                                        <object
                                            data={route('surat.download', selectedSurat.id)}
                                            type="application/pdf"
                                            width="100%"
                                            height="100%"
                                        >
                                            <div className="p-4 flex flex-col items-center justify-center h-full">
                                                <p className="text-center text-gray-500 mb-4">
                                                    Browser Anda tidak mendukung preview PDF.
                                                </p>
                                                <a 
                                                    href={route('surat.download', selectedSurat.id)} 
                                                    target="_blank"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Download PDF
                                                </a>
                                            </div>
                                        </object>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 rounded-md p-8 flex flex-col items-center justify-center" style={{ height: '400px' }}>
                                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-center text-gray-500 mt-4">
                                            Preview dokumen tidak tersedia
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end p-4 border-t bg-gray-50">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}