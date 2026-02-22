import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function PertemuanAbsensi({ pertemuan, praktikans, aslabs, existingAbsensiPraktikan, existingAbsensiAslab }) {
    const [activeTab, setActiveTab] = useState('praktikan'); // praktikan | aslab

    // --- Praktikan Attendance ---
    const { data: pData, setData: setPData, post: postP, processing: pProcessing } = useForm({
        absensi: praktikans.map(p => ({
            praktikan_id: p.id,
            status: existingAbsensiPraktikan[p.id]?.status || 'hadir',
            keterangan: existingAbsensiPraktikan[p.id]?.keterangan || ''
        }))
    });

    const handlePChange = (index, field, value) => {
        const newAbsensi = [...pData.absensi];
        newAbsensi[index][field] = value;
        setPData('absensi', newAbsensi);
    };

    const submitPraktikan = (e) => {
        e.preventDefault();
        postP(route('praktikum.absensi.praktikan.store', pertemuan.id), {
            onSuccess: () => toast.success('Absensi praktikan berhasil disimpan'),
            onError: () => toast.error('Gagal menyimpan absensi')
        });
    };

    // --- Aslab Attendance ---
    const { data: aData, setData: setAData, post: postA, processing: aProcessing } = useForm({
        absensi: aslabs.map(a => ({
            user_id: a.id,
            status: existingAbsensiAslab[a.id]?.status || 'hadir',
            keterangan: existingAbsensiAslab[a.id]?.keterangan || ''
        }))
    });

    const handleAChange = (index, field, value) => {
        const newAbsensi = [...aData.absensi];
        newAbsensi[index][field] = value;
        setAData('absensi', newAbsensi);
    };

    const submitAslab = (e) => {
        e.preventDefault();
        postA(route('praktikum.absensi.aslab.store', pertemuan.id), {
             onSuccess: () => toast.success('Absensi aslab berhasil disimpan'),
             onError: () => toast.error('Gagal menyimpan absensi')
        });
    };

    const statusColors = {
        hadir: 'bg-green-100 text-green-800',
        izin: 'bg-blue-100 text-blue-800',
        sakit: 'bg-yellow-100 text-yellow-800',
        alpha: 'bg-red-100 text-red-800',
    };

    return (
        <DashboardLayout>
            <Head title={`Absensi - ${pertemuan.judul}`} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Absensi Pertemuan</h2>
                        <p className="text-sm text-gray-600 mt-1">{pertemuan.praktikum.mata_kuliah} - {pertemuan.judul}</p>
                    </div>
                    <Link 
                        href={route('praktikum.pertemuan.index', pertemuan.praktikum_id)}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Kembali
                    </Link>
                </div>

                {/* Tabs */}
                <div className="border-b px-6 bg-gray-50">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('praktikan')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'praktikan'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Absensi Praktikan
                        </button>
                        <button
                            onClick={() => setActiveTab('aslab')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'aslab'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Absensi Asisten
                        </button>
                    </nav>
                </div>

                {/* Praktikan Form */}
                {activeTab === 'praktikan' && (
                    <form onSubmit={submitPraktikan} className="p-6">
                        <div className="overflow-x-auto border rounded-lg mb-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama / NIM</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {praktikans.length === 0 ? (
                                        <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">Belum ada praktikan terdaftar.</td></tr>
                                    ) : (
                                        praktikans.map((p, idx) => (
                                            <tr key={p.id}>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{p.user?.name}</div>
                                                    <div className="text-xs text-gray-500">{p.user?.nim}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        {['hadir', 'izin', 'sakit', 'alpha'].map(status => (
                                                            <label key={status} className={`cursor-pointer px-2 py-1 rounded text-xs font-medium border ${pData.absensi[idx].status === status ? statusColors[status] + ' border-transparent ring-1 ring-offset-1' : 'bg-white border-gray-300 text-gray-600'}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name={`status_p_${p.id}`}
                                                                    value={status}
                                                                    checked={pData.absensi[idx].status === status}
                                                                    onChange={e => handlePChange(idx, 'status', e.target.value)}
                                                                    className="sr-only"
                                                                />
                                                                {status.toUpperCase()}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="text"
                                                        value={pData.absensi[idx].keterangan}
                                                        onChange={e => handlePChange(idx, 'keterangan', e.target.value)}
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        placeholder="Catatan..."
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={pProcessing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                            >
                                {pProcessing ? 'Menyimpan...' : 'Simpan Absensi Praktikan'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Aslab Form */}
                {activeTab === 'aslab' && (
                    <form onSubmit={submitAslab} className="p-6">
                        <div className="overflow-x-auto border rounded-lg mb-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Asisten</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aslabs.length === 0 ? (
                                        <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">Belum ada asisten terdaftar.</td></tr>
                                    ) : (
                                        aslabs.map((a, idx) => (
                                            <tr key={a.id}>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{a.name}</div>
                                                    <div className="text-xs text-gray-500">{a.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                     <div className="flex gap-2">
                                                        {['hadir', 'izin', 'sakit', 'alpha'].map(status => (
                                                            <label key={status} className={`cursor-pointer px-2 py-1 rounded text-xs font-medium border ${aData.absensi[idx].status === status ? statusColors[status] + ' border-transparent ring-1 ring-offset-1' : 'bg-white border-gray-300 text-gray-600'}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name={`status_a_${a.id}`}
                                                                    value={status}
                                                                    checked={aData.absensi[idx].status === status}
                                                                    onChange={e => handleAChange(idx, 'status', e.target.value)}
                                                                    className="sr-only"
                                                                />
                                                                {status.toUpperCase()}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="text"
                                                        value={aData.absensi[idx].keterangan}
                                                        onChange={e => handleAChange(idx, 'keterangan', e.target.value)}
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        placeholder="Catatan..."
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={aProcessing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                            >
                                {aProcessing ? 'Menyimpan...' : 'Simpan Absensi Asisten'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}
