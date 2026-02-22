import { usePermission } from '@/Hooks/usePermission';
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from 'sonner';

export default function PermohonanAsetShow({ permohonan }) {
    const { can, isKalab, hasRole } = usePermission();
    
    // Check if user can approve (Kalab or Superadmin)
    const canApprove = can('inventaris.approve-permohonan') && (isKalab() || hasRole('superadmin')); 

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    
    // Approval Form
    const form = useForm({
        status_permohonan: '',
        catatan_approval: '',
    });

    const handleApprove = (e) => {
        e.preventDefault();
        form.setData('status_permohonan', 'disetujui');
        form.put(route('inventaris.permohonan.update', permohonan.id), {
            data: {
                status_permohonan: 'disetujui',
                catatan_approval: form.data.catatan_approval
            },
            onSuccess: () => {
                setIsApproveModalOpen(false);
                toast.success('Permohonan disetujui');
            },
            onError: () => toast.error('Gagal menyetujui permohonan')
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        form.setData('status_permohonan', 'ditolak');
        form.put(route('inventaris.permohonan.update', permohonan.id), {
             data: {
                status_permohonan: 'ditolak',
                catatan_approval: form.data.catatan_approval
            },
            onSuccess: () => {
                setIsRejectModalOpen(false);
                toast.success('Permohonan ditolak');
            },
            onError: () => toast.error('Gagal menolak permohonan')
        });
    };

    return (
        <DashboardLayout>
            <Head title={`Detail Permohonan ${permohonan.nomor_permohonan}`} />

            <div className="space-y-6"> 
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Detail Permohonan Aset
                        </h2>
                        <Link href={route('inventaris.permohonan.index')} className="text-gray-500 hover:text-gray-700">
                            &larr; Kembali
                        </Link>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Informasi Permohonan</h3>
                             <div className="space-y-3">
                                 <div>
                                     <label className="text-xs text-gray-500">Nomor Permohonan</label>
                                     <p className="font-medium">{permohonan.nomor_permohonan}</p>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500">Tanggal</label>
                                     <p>{new Date(permohonan.tanggal_permohonan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500">Status</label>
                                     <div className="mt-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                permohonan.status_permohonan === 'disetujui' ? 'bg-green-100 text-green-800' :
                                                permohonan.status_permohonan === 'ditolak' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {permohonan.status_permohonan.toUpperCase()}
                                        </span>
                                     </div>
                                 </div>
                                 {permohonan.catatan_approval && (
                                     <div className="bg-gray-50 p-3 rounded text-sm">
                                         <span className="font-semibold block mb-1">Catatan Approval:</span>
                                         {permohonan.catatan_approval}
                                     </div>
                                 )}
                             </div>
                         </div>
                         <div>
                             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Informasi Pemohon</h3>
                             <div className="space-y-3">
                                 <div>
                                     <label className="text-xs text-gray-500">Nama Pemohon</label>
                                     <p className="font-medium">{permohonan.user_pemohon?.name || '-'}</p>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500">Laboratorium</label>
                                     <p>{permohonan.laboratorium?.nama || '-'}</p>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500">Alasan Pengadaan</label>
                                     <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-1">
                                         {permohonan.alasan_umum_pengadaan}
                                     </p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-800">Daftar Barang yang Diminta</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spesifikasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Harga</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgensi</th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Item</th> */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {permohonan.wishlist_aset?.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.nama_barang}
                                            {item.referensi_url && (
                                                <a href={item.referensi_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700 text-xs">
                                                    (Link)
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.spesifikasi_teknis}>
                                            {item.spesifikasi_teknis || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.jumlah_diminta} {item.satuan}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.perkiraan_harga ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.perkiraan_harga) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                item.urgensi === 'sangat_tinggi' ? 'bg-red-100 text-red-800' :
                                                item.urgensi === 'tinggi' ? 'bg-orange-100 text-orange-800' :
                                                item.urgensi === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {item.urgensi.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions for Approvers */}
                {canApprove && permohonan.status_permohonan === 'diajukan' && (
                    <div className="flex gap-4 justify-end mb-10">
                        <button
                            onClick={() => setIsRejectModalOpen(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                        >
                            Tolak Permohonan
                        </button>
                        <button
                            onClick={() => setIsApproveModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
                        >
                            Setujui Permohonan
                        </button>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {isApproveModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Setujui Permohonan</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Apakah Anda yakin ingin menyetujui permohonan ini? Anda dapat menambahkan catatan opsional.
                        </p>
                        <textarea
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm mb-4"
                            rows="3"
                            placeholder="Catatan persetujuan (opsional)"
                            value={form.data.catatan_approval}
                            onChange={e => form.setData('catatan_approval', e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                             <button
                                onClick={() => setIsApproveModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={form.processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                {form.processing ? 'Memproses...' : 'Setujui'}
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {/* Reject Modal */}
             {isRejectModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tolak Permohonan</h3>
                         <p className="text-gray-500 text-sm mb-4">
                            Mohon berikan alasan penolakan untuk permohonan ini.
                        </p>
                        <textarea
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm mb-4"
                            rows="3"
                            placeholder="Alasan penolakan (wajib)"
                            value={form.data.catatan_approval}
                            onChange={e => form.setData('catatan_approval', e.target.value)}
                            required
                        />
                        <div className="flex justify-end gap-2">
                             <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={form.processing || !form.data.catatan_approval}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                {form.processing ? 'Memproses...' : 'Tolak'}
                            </button>
                        </div>
                    </div>
                 </div>
            )}

        </DashboardLayout>
    );
}
