import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ArrowLeft } from 'lucide-react';

export default function RubrikPenilaianIndex({ tugas, rubrik }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const createForm = useForm({
        nama_rubrik: '',
        deskripsi: '',
        komponen: [
            {
                nama_komponen: '',
                deskripsi: '',
                bobot: 0,
                nilai_maksimal: 100
            }
        ]
    });

    const addKomponen = () => {
        createForm.setData('komponen', [
            ...createForm.data.komponen,
            {
                nama_komponen: '',
                deskripsi: '',
                bobot: 0,
                nilai_maksimal: 100
            }
        ]);
    };

    const removeKomponen = (index) => {
        if (createForm.data.komponen.length > 1) {
            const newKomponen = createForm.data.komponen.filter((_, i) => i !== index);
            createForm.setData('komponen', newKomponen);
        }
    };

    const updateKomponen = (index, field, value) => {
        const newKomponen = [...createForm.data.komponen];
        newKomponen[index][field] = value;
        createForm.setData('komponen', newKomponen);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validasi total bobot
        const totalBobot = createForm.data.komponen.reduce((sum, komponen) => sum + parseFloat(komponen.bobot || 0), 0);
        if (totalBobot !== 100) {
            alert('Total bobot semua komponen harus 100%');
            return;
        }

        createForm.post(route('praktikum.tugas.rubrik.store', tugas.id), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            }
        });
    };

    const getTotalBobot = () => {
        return createForm.data.komponen.reduce((sum, komponen) => sum + parseFloat(komponen.bobot || 0), 0);
    };

    return (
        <DashboardLayout>
            <Head title={`Rubrik Penilaian - ${tugas.judul_tugas}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 border-b border-gray-200">
                            {/* Back Button */}
                            <div className="mb-4">
                                <button
                                    onClick={() => router.visit(`/praktikum/${tugas.praktikum_id}/tugas`)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali ke Daftar Tugas
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Rubrik Penilaian
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {tugas.judul_tugas} - {tugas.praktikum.mata_kuliah}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {rubrik && (
                                        <a
                                            href={route('praktikum.tugas.grading', tugas.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                        >
                                            Mulai Penilaian
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        {rubrik ? 'Buat Rubrik Baru' : 'Buat Rubrik'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Rubrik */}
                    {rubrik ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Rubrik Aktif: {rubrik.nama_rubrik}
                                </h2>
                                {rubrik.deskripsi && (
                                    <p className="text-gray-600 mb-4">{rubrik.deskripsi}</p>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Komponen
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Deskripsi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Bobot (%)
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Nilai Maksimal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {rubrik.komponen_rubriks.map((komponen, index) => (
                                                <tr key={komponen.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {komponen.nama_komponen}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {komponen.deskripsi || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {komponen.bobot}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {komponen.nilai_maksimal}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500 mb-4">
                                    Belum ada rubrik penilaian untuk tugas ini.
                                </p>
                                <p className="text-sm text-gray-400">
                                    Buat rubrik penilaian untuk memudahkan proses penilaian tugas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Create Modal */}
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                                <form onSubmit={handleSubmit}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">Buat Rubrik Penilaian</h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nama Rubrik</label>
                                            <input
                                                type="text"
                                                value={createForm.data.nama_rubrik}
                                                onChange={(e) => createForm.setData('nama_rubrik', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                                            <textarea
                                                value={createForm.data.deskripsi}
                                                onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                                                rows="3"
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Komponen Penilaian
                                                </label>
                                                <div className="text-sm">
                                                    Total Bobot: <span className={getTotalBobot() === 100 ? 'text-green-600' : 'text-red-600'}>{getTotalBobot()}%</span>
                                                </div>
                                            </div>

                                            {createForm.data.komponen.map((komponen, index) => (
                                                <div key={index} className="border rounded-lg p-4 mb-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-sm font-medium">Komponen {index + 1}</h4>
                                                        {createForm.data.komponen.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeKomponen(index)}
                                                                className="text-red-600 hover:text-red-800 text-sm"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-600">Nama Komponen</label>
                                                            <input
                                                                type="text"
                                                                value={komponen.nama_komponen}
                                                                onChange={(e) => updateKomponen(index, 'nama_komponen', e.target.value)}
                                                                className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600">Bobot (%)</label>
                                                            <input
                                                                type="number"
                                                                value={komponen.bobot}
                                                                onChange={(e) => updateKomponen(index, 'bobot', parseFloat(e.target.value) || 0)}
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs text-gray-600">Deskripsi</label>
                                                            <textarea
                                                                value={komponen.deskripsi}
                                                                onChange={(e) => updateKomponen(index, 'deskripsi', e.target.value)}
                                                                rows="2"
                                                                className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-600">Nilai Maksimal</label>
                                                            <input
                                                                type="number"
                                                                value={komponen.nilai_maksimal}
                                                                onChange={(e) => updateKomponen(index, 'nilai_maksimal', parseFloat(e.target.value) || 100)}
                                                                min="1"
                                                                max="1000"
                                                                className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={addKomponen}
                                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                                            >
                                                + Tambah Komponen
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={getTotalBobot() !== 100}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Simpan Rubrik
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
