import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function KirimSurat({ flash, penerima = [] }) {
    const [previewFile, setPreviewFile] = useState(null);
    
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
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="py-4">
                {/* <div className="flex items-center justify-between mb-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <a href="#" className="ml-1 text-gray-700 hover:text-gray-900 md:ml-2">Surat Menyurat</a>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="ml-1 text-gray-500 md:ml-2">Kirim Surat</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div> */}
                
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">Kirim Surat</h1>
                
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="nomor_surat" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Surat
                                </label>
                                <input
                                    type="text"
                                    id="nomor_surat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Masukkan Nomor Surat"
                                    value={form.data.nomor_surat}
                                    onChange={e => form.setData('nomor_surat', e.target.value)}
                                    required
                                />
                                {form.errors.nomor_surat && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.nomor_surat}</div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="penerima" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pilih Penerima
                                </label>
                                <select
                                    id="penerima"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.data.penerima_id}
                                    onChange={e => form.setData('penerima_id', e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Penerima</option>
                                    {penerima.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} - {item?.struktur?.struktur || 'Anggota'}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.penerima_id && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.penerima_id}</div>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="tanggal_surat" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Surat
                                </label>
                                <input
                                    type="date"
                                    id="tanggal_surat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.data.tanggal_surat}
                                    onChange={e => form.setData('tanggal_surat', e.target.value)}
                                    required
                                />
                                {form.errors.tanggal_surat && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.tanggal_surat}</div>
                                )}
                            </div>
                        
                            
                            <div>
                                <label htmlFor="perihal" className="block text-sm font-medium text-gray-700 mb-1">
                                    Perihal
                                </label>
                                <input
                                    type="text"
                                    id="perihal"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Perihal Surat"
                                    value={form.data.perihal}
                                    onChange={e => form.setData('perihal', e.target.value)}
                                    required
                                />
                                {form.errors.perihal && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.perihal}</div>
                                )}
                            </div>
                            
                            <div className="md:col-span-2">
                                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                                    Upload File Surat
                                </label>
                                <input
                                    type="file"
                                    id="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    required={!form.data.file}
                                />
                                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-md p-6">
                                    <div className="flex flex-col justify-center items-center">
                                        {!previewFile ? (
                                            <>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="flex text-sm text-gray-600 mt-4">
                                                    <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                        <span>Upload file</span>
                                                    </label>
                                                    <p className="pl-1">atau drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">PDF hingga 5MB</p>
                                            </>
                                        ) : (
                                            <div className="w-full">
                                                <div className="flex items-center justify-center bg-gray-50 p-4 rounded-md">
                                                    <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 4v12h10V4H5zm5 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="ml-2 text-gray-900 font-medium truncate">
                                                        {form.data.file.name}
                                                    </span>
                                                </div>
                                                <div className="flex justify-center mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            form.setData('file', null);
                                                            setPreviewFile(null);
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Hapus file
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {form.errors.file && (
                                    <div className="text-red-500 text-xs mt-1">{form.errors.file}</div>
                                )}
                            </div>
                        </div>

                        {previewFile && (
                            <div className="mt-6 border p-4 rounded-md">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Dokumen</h4>
                                <div className="bg-gray-100 rounded-md overflow-hidden" style={{ height: '400px' }}>
                                    <iframe 
                                        src={previewFile} 
                                        title="Preview Dokumen" 
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end mt-6">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Mengirim...' : 'Kirim'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}