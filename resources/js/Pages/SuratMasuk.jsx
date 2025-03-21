import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SuratMasuk({ flash }) {
    // Sample data untuk demonstrasi
    const [suratMasuk, setSuratMasuk] = useState([
        {
            id: 1,
            nomor_surat: 'XXX/XXX/XXX',
            tanggal_surat: '2025-03-15',
            judul: 'Undangan Rapat Koordinasi Kegiatan',
            pengirim: 'Ketua Departemen',
            file: 'surat-sample.pdf',
            isread: false
        },
        {
            id: 2,
            nomor_surat: 'XXX/XXX/XXX',
            tanggal_surat: '2025-03-10',
            judul: 'Pengumuman Jadwal Praktikum Semester Genap',
            pengirim: 'Koordinator Praktikum',
            file: 'surat-sample.pdf',
            isread: true
        },
        {
            id: 3,
            nomor_surat: 'XXX/XXX/XXX',
            tanggal_surat: '2025-03-05',
            judul: 'Permohonan Pengadaan Alat Laboratorium',
            pengirim: 'Kepala Laboratorium',
            file: 'surat-sample.pdf',
            isread: false
        },
    ]);

    // State untuk filter dan search
    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedSurat, setSelectedSurat] = useState(null);

    // Menampilkan flash message
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Handler untuk membuka modal lihat surat
    const openViewModal = (surat) => {
        setSelectedSurat(surat);
        setIsViewModalOpen(true);
        
        // Mark as read if not already read
        if (!surat.isread) {
            const updatedSuratList = suratMasuk.map(item => {
                if (item.id === surat.id) {
                    return { ...item, isread: true };
                }
                return item;
            });
            setSuratMasuk(updatedSuratList);
        }
    };

    // Handler untuk hapus surat
    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
            // Di sini seharusnya ada panggilan API untuk menghapus di server
            // Tapi untuk contoh, cukup update state lokal
            const updatedSuratList = suratMasuk.filter(surat => surat.id !== id);
            setSuratMasuk(updatedSuratList);
            toast.success('Surat berhasil dihapus');
        }
    };

    // Format tanggal Indonesia
    const formatTanggal = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // Filter data surat berdasarkan search dan filter
    const filteredSurat = suratMasuk.filter(surat => {
        const matchSearch = searchTerm === '' || 
            surat.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
            surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
            surat.nomor_surat.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchDate = filterDate === '' || surat.tanggal_surat.includes(filterDate);
        
        return matchSearch && matchDate;
    });

    return (
        <DashboardLayout>
            <Head title="Surat Masuk" />
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="py-4">
                {/* <div className="flex items-center justify-between mb-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <Link href="#" className="ml-1 text-gray-700 hover:text-gray-900 md:ml-2">Surat Menyurat</Link>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="ml-1 text-gray-500 md:ml-2">Surat Masuk</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div> */}
                
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">Surat Masuk</h1>
                
                {/* Filter dan Search */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Filter: Tanggal"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cari Surat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Tabel Surat Masuk */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tanggal
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Judul
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pengirim
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nomor Surat
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lihat Surat
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSurat.length > 0 ? (
                                    filteredSurat.map((surat, index) => (
                                        <tr key={surat.id} className={surat.isread ? 'bg-white' : 'bg-blue-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatTanggal(surat.tanggal_surat)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                {surat.judul}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {surat.pengirim}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {surat.nomor_surat}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openViewModal(surat)}
                                                    className="text-blue-600 hover:text-blue-900 rounded-full p-1 hover:bg-blue-100 transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDelete(surat.id)}
                                                    className="text-red-600 hover:text-red-900 rounded-full p-1 hover:bg-red-100 transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            Tidak ada data surat masuk
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Modal Lihat Surat */}
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
                        
                        <div className="p-4 overflow-y-auto">
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
                                    <p className="text-sm text-gray-500">Pengirim</p>
                                    <p className="font-medium">{selectedSurat.pengirim}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Judul</p>
                                    <p className="font-medium">{selectedSurat.judul}</p>
                                </div>
                            </div>
                            
                            {/* Preview Dokumen */}
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-2">Preview Dokumen</p>
                                <div className="bg-gray-100 rounded-md p-8 flex flex-col items-center justify-center" style={{ height: '400px' }}>
                                    <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-center text-gray-500 mt-4">
                                        Dokumen preview tidak tersedia. <br/>
                                        <span className="text-blue-600">Klik untuk mengunduh dokumen</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end p-4 border-t bg-gray-50">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition mr-2"
                            >
                                Tutup
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                Unduh Surat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}