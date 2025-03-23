import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function KirimSurat({ flash, penerima = [] }) {
    const { auth } = usePage().props;
    const [previewFile, setPreviewFile] = useState(null);
    
    // Filter out current user from recipients list
    const filteredPenerima = penerima.filter(user => user.id !== auth.user.id);
    
    // Form untuk kirim surat
    const form = useForm({
        nomor_surat: '',
        tanggal_surat: new Date().toISOString().split('T')[0], // Hari ini sebagai default
        penerima_id: '',
        perihal: '',
        file: null,
    });

    // Toggle preview file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Simpan file ke form data
            form.setData('file', file);
            
            // Buat URL untuk preview
            const fileUrl = URL.createObjectURL(file);
            setPreviewFile(fileUrl);
        }
    };

    // Handle submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validasi form sebelum submit
        if (!form.data.nomor_surat) {
            toast.error('Nomor surat harus diisi');
            return;
        }
        
        if (!form.data.penerima_id) {
            toast.error('Penerima harus dipilih');
            return;
        }
        
        if (!form.data.perihal) {
            toast.error('Perihal surat harus diisi');
            return;
        }
        
        if (!form.data.file) {
            toast.error('File surat harus diunggah');
            return;
        }
        
        form.post(route('surat.store'), {
            onSuccess: () => {
                toast.success('Surat berhasil dikirim');
                form.reset();
                setPreviewFile(null);
            },
            onError: (errors) => {
                console.error('Submit errors:', errors);
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Gagal mengirim surat');
                }
            },
            forceFormData: true,
        });
    };

    // Tampilkan flash message jika ada
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Kirim Surat" />
            <ToastContainer />

            {/* Breadcrumb dan Judul */}
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Kirim Surat</h1>
                    <div className="flex text-sm text-gray-500 mt-1">
                        <a href="/dashboard" className="hover:text-blue-600">Home</a>
                        <span className="mx-2">/</span>
                        <a href="#" className="hover:text-blue-600">Surat Menyurat</a>
                        <span className="mx-2">/</span>
                        <span>Kirim Surat</span>
                    </div>
                </div>
            </div>
            
            {/* Form Kirim Surat */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-6 p-6">
                        {/* Kolom Kiri - Informasi Surat */}
                        <div>
                            <div className="mb-4">
                                <label htmlFor="nomor_surat" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Surat
                                </label>
                                <input
                                    type="text"
                                    id="nomor_surat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Masukan Nomor Surat"
                                    value={form.data.nomor_surat}
                                    onChange={e => form.setData('nomor_surat', e.target.value)}
                                />
                                {form.errors.nomor_surat && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.nomor_surat}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="tanggal_surat" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Surat
                                </label>
                                <input
                                    type="date"
                                    id="tanggal_surat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.data.tanggal_surat}
                                    onChange={e => form.setData('tanggal_surat', e.target.value)}
                                />
                                {form.errors.tanggal_surat && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.tanggal_surat}</div>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan - Penerima dan Perihal */}
                        <div>
                            <div className="mb-4">
                                <label htmlFor="penerima_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pilih Penerima
                                </label>
                                <div className="relative">
                                    <select
                                        id="penerima_id"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        value={form.data.penerima_id}
                                        onChange={e => form.setData('penerima_id', e.target.value)}
                                    >
                                        <option value="">Pilih Penerima</option>
                                        {filteredPenerima.length > 0 ? (
                                            filteredPenerima.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} - {user.struktur?.struktur || 'Anggota'}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Tidak ada penerima tersedia</option>
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                {form.errors.penerima_id && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.penerima_id}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="perihal" className="block text-sm font-medium text-gray-700 mb-1">
                                    Perihal
                                </label>
                                <input
                                    type="text"
                                    id="perihal"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Perihal Surat"
                                    value={form.data.perihal}
                                    onChange={e => form.setData('perihal', e.target.value)}
                                />
                                {form.errors.perihal && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.perihal}</div>
                                )}
                            </div>
                        </div>

                        {/* File Upload - Span Kedua Kolom */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload File Surat
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                {!previewFile ? (
                                    // Upload Area
                                    <div className="py-8 flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                        />
                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">Drag and drop file di sini, atau</p>
                                        <label htmlFor="file-upload" className="mt-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                            Pilih file
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">PDF hingga 5MB</p>
                                    </div>
                                ) : (
                                    // PDF Preview
                                    <div className="h-[400px] overflow-hidden">
                                        <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700 truncate">
                                                    {form.data.file.name}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-sm text-red-600 hover:text-red-800"
                                                onClick={() => {
                                                    form.setData('file', null);
                                                    setPreviewFile(null);
                                                }}
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <iframe
                                            src={previewFile}
                                            className="w-full h-full"
                                            title="Preview Surat"
                                        ></iframe>
                                    </div>
                                )}
                            </div>
                            {form.errors.file && (
                                <div className="text-red-500 text-xs mt-1">{form.errors.file}</div>
                            )}
                        </div>
                    </div>

                    {/* Tombol Kirim */}
                    <div className="flex justify-end px-6 py-4 bg-gray-50 border-t">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Mengirim...' : 'Kirim'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}