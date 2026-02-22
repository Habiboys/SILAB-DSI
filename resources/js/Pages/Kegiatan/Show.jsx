import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '../../Layouts/DashboardLayout';
import PesertaManager from './PesertaManager';

export default function KegiatanShow({ kegiatan, can }) {
  const { data, setData, post, processing } = useForm({
    status: '',
  });

  const handleApproval = (status) => {
    if (confirm(`Apakah Anda yakin ingin men-${status === 'disetujui' ? 'yetujui' : 'olak'} kegiatan ini?`)) {
        setData('status', status);
        // Use a trick to submit immediately after setting state, or better: use router or form helper
        // Since setData is async-ish or state based, better to use inertia router directly or form with explicit data
        // But useForm is better for CSRF and error handling.
        // Actually, let's use router.post directly for simple actions or create a tailored form submission
    }
  };
  
  // Custom submit handler to ensuring status is passed
  const submitApproval = (status) => {
      post(route('kegiatan.approve', kegiatan.id), {
          data: { status },
          onSuccess: () => toast.success(`Kegiatan berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}`),
          onError: () => toast.error('Gagal memproses persetujuan')
      });
  }

  const getStatusBadge = (status) => {
    const classes = {
      'diajukan': 'bg-yellow-100 text-yellow-800',
      'disetujui': 'bg-green-100 text-green-800',
      'ditolak': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${classes[status] || 'bg-gray-100'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString, withTime = false) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: withTime ? '2-digit' : undefined, minute: withTime ? '2-digit' : undefined
    });
  };

  // --- Laporan Logic ---
  const [showLpjForm, setShowLpjForm] = useState(false);
  const { data: lpjData, setData: setLpjData, post: postLpj, processing: lpjProcessing, errors: lpjErrors, reset: resetLpj } = useForm({
    jenis_laporan: 'Laporan Pertanggungjawaban',
    periode_bulan: new Date().getMonth() + 1,
    periode_tahun: new Date().getFullYear(),
    deskripsi_capaian: '',
    file_lpj: null
  });

  const submitLpj = (e) => {
    e.preventDefault();
    postLpj(route('laporan-kegiatan.store', kegiatan.id), {
        forceFormData: true,
        onSuccess: () => {
            toast.success('Laporan berhasil diunggah');
            resetLpj();
            setShowLpjForm(false);
        },
        onError: () => toast.error('Gagal mengunggah laporan')
    });
  };

  const deleteLpj = (id) => {
      if(confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
          router.delete(route('laporan-kegiatan.destroy', id), {
             onSuccess: () => toast.success('Laporan berhasil dihapus') 
          });
      }
  }

  return (
    <DashboardLayout>
      <Head title={`Detail Kegiatan: ${kegiatan.nama_kegiatan}`} />

      <div className="space-y-6">
        {/* Header / Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{kegiatan.nama_kegiatan}</h1>
                <div className="mt-2 text-sm text-gray-500">
                    Diajukan pada {formatDate(kegiatan.created_at, true)}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                {getStatusBadge(kegiatan.status_approval)}
                {kegiatan.approved_by && (
                    <div className="text-xs text-gray-500 text-right">
                        Oleh: {kegiatan.approver?.name} <br/>
                        {formatDate(kegiatan.approved_at, true)}
                    </div>
                )}
            </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Informasi Kegiatan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <strong className="block text-sm font-medium text-gray-500">Program Kerja</strong>
                    <div className="mt-1 text-gray-900">{kegiatan.proker?.nama_proker || '-'}</div>
                </div>
                <div>
                    <strong className="block text-sm font-medium text-gray-500">Waktu Pelaksanaan</strong>
                    <div className="mt-1 text-gray-900">
                        {formatDate(kegiatan.tanggal_mulai)} - {formatDate(kegiatan.tanggal_selesai)}
                    </div>
                </div>
                <div className="col-span-full">
                    <strong className="block text-sm font-medium text-gray-500">Deskripsi</strong>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {kegiatan.deskripsi_kegiatan || '-'}
                    </div>
                </div>
            </div>
        </div>

        {/* Approval Actions */}
        {can.approve && kegiatan.status_approval === 'diajukan' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Tindakan Persetujuan</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Sebagai Approver, Anda dapat menyetujui atau menolak pengajuan kegiatan ini.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => submitApproval('disetujui')}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        Setujui Kegiatan
                    </button>
                    <button
                        onClick={() => submitApproval('ditolak')}
                        disabled={processing}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                        Tolak Kegiatan
                    </button>
                </div>
            </div>
        )}

        {/* Laporan Kegiatan Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Laporan Kegiatan</h3>
                {kegiatan.status_approval === 'disetujui' && (can.create || can.approve) && !showLpjForm && (
                    <button 
                        onClick={() => setShowLpjForm(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
                    >
                        + Upload Laporan
                    </button>
                )}
            </div>

            {/* List Laporan */}
            <div className="space-y-4 mb-6">
                {kegiatan.laporan_kegiatan && kegiatan.laporan_kegiatan.length > 0 ? (
                    kegiatan.laporan_kegiatan.map((laporan) => (
                        <div key={laporan.id} className="border rounded p-4 flex justify-between items-start">
                             <div>
                                 <h4 className="font-medium text-gray-900">{laporan.jenis_laporan}</h4>
                                 <p className="text-sm text-gray-500">
                                     Periode: {laporan.periode_bulan}/{laporan.periode_tahun}
                                 </p>
                                 {laporan.deskripsi_capaian && (
                                     <p className="text-sm text-gray-600 mt-1">{laporan.deskripsi_capaian}</p>
                                 )}
                                 <div className="mt-2 text-xs text-gray-400">
                                     Diunggah: {formatDate(laporan.created_at, true)}
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <a 
                                    href={route('laporan-kegiatan.download', laporan.id)} 
                                    target="_blank"
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                                 >
                                     Download
                                 </a>
                                 {(can.create || can.approve) && (
                                     <button 
                                        onClick={() => deleteLpj(laporan.id)}
                                        className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100"
                                     >
                                         Hapus
                                     </button>
                                 )}
                             </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic text-sm">Belum ada laporan yang diunggah.</p>
                )}
            </div>

            {/* Form Upload */}
            {showLpjForm && (
                <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-medium mb-3">Upload Laporan Baru</h4>
                    <form onSubmit={submitLpj} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Jenis Laporan</label>
                                <select 
                                    value={lpjData.jenis_laporan}
                                    onChange={e => setLpjData('jenis_laporan', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="Laporan Pertanggungjawaban">Laporan Pertanggungjawaban (LPJ)</option>
                                    <option value="Laporan Bulanan">Laporan Bulanan</option>
                                    <option value="Dokumentasi">Dokumentasi</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bulan</label>
                                    <input 
                                        type="number" min="1" max="12"
                                        value={lpjData.periode_bulan}
                                        onChange={e => setLpjData('periode_bulan', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tahun</label>
                                    <input 
                                        type="number"
                                        value={lpjData.periode_tahun}
                                        onChange={e => setLpjData('periode_tahun', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Deskripsi Capaian / Keterangan</label>
                             <textarea 
                                 value={lpjData.deskripsi_capaian}
                                 onChange={e => setLpjData('deskripsi_capaian', e.target.value)}
                                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                 rows="2"
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">File Laporan (PDF/DOCX, Max 10MB)</label>
                             <input 
                                 type="file"
                                 onChange={e => setLpjData('file_lpj', e.target.files[0])}
                                 className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                 accept=".pdf,.doc,.docx"
                             />
                             {lpjErrors.file_lpj && <div className="text-red-500 text-xs mt-1">{lpjErrors.file_lpj}</div>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowLpjForm(false)}
                                className="px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                disabled={lpjProcessing}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {lpjProcessing ? 'Mengunggah...' : 'Unggah Laporan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* Peserta & Sertifikat Manager */}
        {kegiatan.status_approval === 'disetujui' && (
             <PesertaManager kegiatan={kegiatan} can={can} />
        )}
        
        <div className="flex justify-start">
             <Link href={route('kegiatan.index')} className="text-blue-600 hover:text-blue-800 font-medium">
                &larr; Kembali ke Daftar
             </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
