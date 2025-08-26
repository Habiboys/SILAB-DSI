import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Index({ tugas }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingKomponen, setEditingKomponen] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_komponen: '',
        deskripsi: '',
        bobot: '',
        nilai_maksimal: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingKomponen) {
            put(route('praktikum.tugas.komponen.update', { tugas: tugas.id, komponen: editingKomponen.id }), {
                onSuccess: () => {
                    setEditingKomponen(null);
                    reset();
                }
            });
        } else {
            post(route('praktikum.tugas.komponen.store', tugas.id), {
                onSuccess: () => {
                    setShowAddForm(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (komponen) => {
        setEditingKomponen(komponen);
        setData({
            nama_komponen: komponen.nama_komponen,
            deskripsi: komponen.deskripsi || '',
            bobot: komponen.bobot,
            nilai_maksimal: komponen.nilai_maksimal
        });
        setShowAddForm(true);
    };

    const handleDelete = (komponen) => {
        if (confirm('Apakah Anda yakin ingin menghapus komponen ini?')) {
            router.delete(route('praktikum.tugas.komponen.destroy', { tugas: tugas.id, komponen: komponen.id }));
        }
    };

    const handleMoveUp = (komponen) => {
        const komponenList = [...tugas.komponen_rubriks];
        const currentIndex = komponenList.findIndex(k => k.id === komponen.id);
        if (currentIndex > 0) {
            [komponenList[currentIndex], komponenList[currentIndex - 1]] = [komponenList[currentIndex - 1], komponenList[currentIndex]];
            updateUrutan(komponenList);
        }
    };

    const handleMoveDown = (komponen) => {
        const komponenList = [...tugas.komponen_rubriks];
        const currentIndex = komponenList.findIndex(k => k.id === komponen.id);
        if (currentIndex < komponenList.length - 1) {
            [komponenList[currentIndex], komponenList[currentIndex + 1]] = [komponenList[currentIndex + 1], komponenList[currentIndex]];
            updateUrutan(komponenList);
        }
    };

    const updateUrutan = (komponenList) => {
        const komponenIds = komponenList.map(k => k.id);
        router.put(route('praktikum.tugas.komponen.update-urutan', tugas.id), {
            komponen_ids: komponenIds
        });
    };

    const totalBobot = tugas.komponen_rubriks?.reduce((sum, komponen) => sum + parseFloat(komponen.bobot), 0) || 0;

    return (
        <DashboardLayout>
            <Head title={`Komponen Rubrik - ${tugas.judul_tugas}`} />
            
            {/* Tombol Back */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.get(route('praktikum.tugas.submissions', { tugas: tugas.id }))}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Kembali
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                                Kelola Komponen Rubrik
                            </h2>
                            <div className="text-gray-600 text-sm space-y-1">
                                <p><strong>Mata Kuliah:</strong> {tugas.praktikum?.mata_kuliah || 'N/A'}</p>
                                <p><strong>Judul Tugas:</strong> {tugas.judul_tugas}</p>
                                <p><strong>Total Bobot:</strong> {totalBobot}% {totalBobot === 100 ? '✓' : '(harus 100%)'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm w-full sm:w-auto"
                        >
                            <PlusIcon className="h-4 w-4" />
                            <span>Tambah Komponen</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">

                    {/* Form Tambah/Edit Komponen */}
                    {showAddForm && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-medium mb-4">
                                {editingKomponen ? 'Edit Komponen' : 'Tambah Komponen Baru'}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Komponen *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama_komponen}
                                            onChange={(e) => setData('nama_komponen', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Contoh: Kesesuaian Algoritma"
                                        />
                                        {errors.nama_komponen && <p className="text-red-500 text-xs mt-1">{errors.nama_komponen}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bobot (%) *
                                        </label>
                                        <input
                                            type="number"
                                            value={data.bobot}
                                            onChange={(e) => setData('bobot', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0-100"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                        {errors.bobot && <p className="text-red-500 text-xs mt-1">{errors.bobot}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nilai Maksimal *
                                        </label>
                                        <input
                                            type="number"
                                            value={data.nilai_maksimal}
                                            onChange={(e) => setData('nilai_maksimal', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0-100"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                        {errors.nilai_maksimal && <p className="text-red-500 text-xs mt-1">{errors.nilai_maksimal}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            value={data.deskripsi}
                                            onChange={(e) => setData('deskripsi', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            rows="2"
                                            placeholder="Penjelasan kriteria penilaian..."
                                        />
                                        {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingKomponen(null);
                                            reset();
                                        }}
                                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : (editingKomponen ? 'Update' : 'Simpan')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tabel Komponen */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Urutan
                                    </th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama Komponen
                                    </th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bobot
                                    </th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nilai Maks
                                    </th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                    tugas.komponen_rubriks.map((komponen, index) => (
                                        <tr key={komponen.id} className="hover:bg-gray-50">
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{komponen.urutan}
                                            </td>
                                            <td className="px-3 md:px-6 py-4 text-sm font-medium text-gray-900">
                                                {komponen.nama_komponen}
                                            </td>
                                            <td className="px-3 md:px-6 py-4 text-sm text-gray-500">
                                                {komponen.deskripsi || '-'}
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {komponen.bobot}%
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {komponen.nilai_maksimal}
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleMoveUp(komponen)}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        title="Pindah ke atas"
                                                    >
                                                        <ArrowUpIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(komponen)}
                                                        disabled={index === tugas.komponen_rubriks.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                        title="Pindah ke bawah"
                                                    >
                                                        <ArrowDownIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(komponen)}
                                                        className="p-1 text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(komponen)}
                                                        className="p-1 text-red-600 hover:text-red-800"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-3 md:px-6 py-8 text-center text-gray-500">
                                            <p>Belum ada komponen rubrik. Tambahkan komponen untuk memulai penilaian.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
