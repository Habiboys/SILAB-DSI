import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function RubrikPenilaianGrading({ tugas, praktikans, pengumpulans, nilaiRubriks, nilaiTambahans }) {
    const [selectedPraktikan, setSelectedPraktikan] = useState(null);
    const [showTambahModal, setShowTambahModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filteredPraktikans, setFilteredPraktikans] = useState(praktikans);

    // Update filtered praktikans when praktikans change
    useEffect(() => {
        setFilteredPraktikans(praktikans);
    }, [praktikans]);

    const nilaiTambahanForm = useForm({
        tugas_praktikum_id: tugas.id,
        praktikan_id: '',
        praktikan_search: '',
        nilai: 0,
        kategori: 'bonus',
        keterangan: ''
    });

    const handleNilaiRubrikChange = async (praktikanId, komponenId, nilai, catatan = '') => {
        if (nilai < 0 || nilai > getKomponenById(komponenId)?.nilai_maksimal) return;

        setLoading(true);
        try {
            const pengumpulanId = pengumpulans[praktikanId]?.id || null;
            
            await axios.post(route('praktikum.nilai-rubrik.store'), {
                komponen_rubrik_id: komponenId,
                praktikan_id: praktikanId,
                nilai: nilai,
                catatan: catatan,
                pengumpulan_tugas_id: pengumpulanId
            });

            // Reload page to get updated data
            window.location.reload();
        } catch (error) {
            console.error('Error saving nilai:', error);
            alert('Gagal menyimpan nilai: ' + error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTambahNilai = (e) => {
        e.preventDefault();
        nilaiTambahanForm.post(route('praktikum.nilai-tambahan.store'), {
            onSuccess: () => {
                setShowTambahModal(false);
                nilaiTambahanForm.reset();
                window.location.reload();
            }
        });
    };

    const hapusNilaiTambahan = async (nilaiId) => {
        if (!confirm('Hapus nilai tambahan ini?')) return;

        try {
            await axios.delete(route('praktikum.nilai-tambahan.delete', nilaiId));
            window.location.reload();
        } catch (error) {
            alert('Gagal menghapus nilai tambahan');
        }
    };

    const getKomponenById = (komponenId) => {
        return tugas.rubrik_aktif.komponen_rubriks.find(k => k.id === komponenId);
    };

    const getNilaiRubrik = (praktikanId, komponenId) => {
        return nilaiRubriks[praktikanId]?.[komponenId]?.[0];
    };

    const getNilaiTambahan = (praktikanId) => {
        return nilaiTambahans[praktikanId] || [];
    };

    const calculateTotalNilai = (praktikanId) => {
        let total = 0;
        let totalBobot = 0;

        // Hitung nilai dari rubrik
        tugas.rubrik_aktif.komponen_rubriks.forEach(komponen => {
            const nilai = getNilaiRubrik(praktikanId, komponen.id);
            if (nilai) {
                const nilaiTerbobot = (nilai.nilai / komponen.nilai_maksimal) * komponen.bobot;
                total += nilaiTerbobot;
            }
            totalBobot += komponen.bobot;
        });

        // Tambahkan nilai tambahan
        const nilaiTambahan = getNilaiTambahan(praktikanId);
        const totalNilaiTambahan = nilaiTambahan.reduce((sum, nilai) => sum + parseFloat(nilai.nilai), 0);

        return {
            nilaiRubrik: total,
            nilaiTambahan: totalNilaiTambahan,
            nilaiAkhir: total + totalNilaiTambahan
        };
    };

    if (!tugas.rubrik_aktif) {
        return (
            <DashboardLayout>
                <Head title="Penilaian Tugas" />
                <div className="py-6">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <p className="text-gray-500">
                                    Belum ada rubrik penilaian untuk tugas ini.
                                </p>
                                <a
                                    href={route('praktikum.tugas.rubrik.index', tugas.id)}
                                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Buat Rubrik Penilaian
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                            </DashboardLayout>
                        );
                    }

                    return (
                        <DashboardLayout>
                            <Head title={`Penilaian - ${tugas.judul_tugas}`} />            <div className="py-6">
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
                                        Penilaian Tugas
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {tugas.judul_tugas} - {tugas.praktikum.mata_kuliah}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rubrik: {tugas.rubrik_aktif.nama_rubrik}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTambahModal(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                >
                                    Tambah Nilai Bonus
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Grading Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                                            Praktikan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        {tugas.rubrik_aktif.komponen_rubriks.map(komponen => (
                                            <th key={komponen.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="space-y-1">
                                                    <div>{komponen.nama_komponen}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {komponen.bobot}% (Max: {komponen.nilai_maksimal})
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nilai Tambahan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Nilai
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {praktikans.map(praktikan => {
                                        const pengumpulan = pengumpulans[praktikan.id];
                                        const nilaiTotal = calculateTotalNilai(praktikan.id);
                                        const nilaiTambahanList = getNilaiTambahan(praktikan.id);

                                        return (
                                            <tr key={praktikan.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                                    <div>
                                                        <div>{praktikan.user.name}</div>
                                                        <div className="text-xs text-gray-500">{praktikan.nim}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {pengumpulan ? (
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            pengumpulan.status === 'dinilai' ? 'bg-green-100 text-green-800' :
                                                            pengumpulan.status === 'terlambat' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {pengumpulan.status}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Belum mengumpulkan
                                                        </span>
                                                    )}
                                                </td>
                                                {tugas.rubrik_aktif.komponen_rubriks.map(komponen => {
                                                    const nilaiRubrik = getNilaiRubrik(praktikan.id, komponen.id);
                                                    
                                                    return (
                                                        <td key={komponen.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={komponen.nilai_maksimal}
                                                                    step="0.1"
                                                                    value={nilaiRubrik?.nilai || ''}
                                                                    onChange={(e) => {
                                                                        const nilai = parseFloat(e.target.value) || 0;
                                                                        handleNilaiRubrikChange(praktikan.id, komponen.id, nilai);
                                                                    }}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="0"
                                                                    disabled={loading}
                                                                />
                                                                {nilaiRubrik?.catatan && (
                                                                    <div className="text-xs text-gray-400 max-w-20 truncate" title={nilaiRubrik.catatan}>
                                                                        {nilaiRubrik.catatan}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        {nilaiTambahanList.map(nilai => (
                                                            <div key={nilai.id} className="flex items-center justify-between bg-green-50 px-2 py-1 rounded">
                                                                <span className="text-xs">
                                                                    {nilai.kategori}: +{nilai.nilai}
                                                                </span>
                                                                <button
                                                                    onClick={() => hapusNilaiTambahan(nilai.id)}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div className="text-xs font-medium">
                                                            Total: +{nilaiTotal.nilaiTambahan}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="space-y-1">
                                                        <div>Rubrik: {nilaiTotal.nilaiRubrik.toFixed(2)}</div>
                                                        <div className="text-xs text-green-600">
                                                            Bonus: +{nilaiTotal.nilaiTambahan}
                                                        </div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {nilaiTotal.nilaiAkhir.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal Tambah Nilai */}
                    {showTambahModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <form onSubmit={handleTambahNilai}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">Tambah Nilai Bonus</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowTambahModal(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Praktikan</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama atau NIM praktikan..."
                                                    value={nilaiTambahanForm.data.praktikan_search || ''}
                                                    onChange={(e) => {
                                                        nilaiTambahanForm.setData('praktikan_search', e.target.value);
                                                        // Filter praktikan berdasarkan search
                                                        const searchLower = e.target.value.toLowerCase();
                                                        const filtered = praktikans.filter(praktikan => {
                                                            const nama = praktikan.user.name.toLowerCase();
                                                            const nim = (praktikan.nim || '').toLowerCase();
                                                            return nama.includes(searchLower) || nim.includes(searchLower);
                                                        });
                                                        // Update dropdown options
                                                        setFilteredPraktikans(filtered);
                                                    }}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                                                    {filteredPraktikans.map(praktikan => (
                                                        <button
                                                            key={praktikan.id}
                                                            type="button"
                                                            onClick={() => {
                                                                nilaiTambahanForm.setData('praktikan_id', praktikan.id);
                                                                nilaiTambahanForm.setData('praktikan_search', praktikan.user.name);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200 last:border-b-0"
                                                        >
                                                            <div className="font-medium">{praktikan.user.name}</div>
                                                            <div className="text-sm text-gray-500">NIM: {praktikan.nim || 'N/A'}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Kategori</label>
                                            <select
                                                value={nilaiTambahanForm.data.kategori}
                                                onChange={(e) => nilaiTambahanForm.setData('kategori', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="bonus">Bonus</option>
                                                <option value="partisipasi">Partisipasi</option>
                                                <option value="kehadiran">Kehadiran</option>
                                                <option value="inisiatif">Inisiatif</option>
                                                <option value="lainnya">Lainnya</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nilai</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={nilaiTambahanForm.data.nilai}
                                                onChange={(e) => nilaiTambahanForm.setData('nilai', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                                            <textarea
                                                value={nilaiTambahanForm.data.keterangan}
                                                onChange={(e) => nilaiTambahanForm.setData('keterangan', e.target.value)}
                                                rows="3"
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowTambahModal(false)}
                                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Simpan
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
