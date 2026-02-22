import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useLab } from '../../Components/LabContext';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function KegiatanIndex({ kegiatan, filters, can, kepengurusanLabId }) {
  const [activeStatus, setActiveStatus] = useState(filters.status || 'all');
  const { selectedLab } = useLab();

  // Handle Lab Switching


  const handleTabChange = (status) => {
    setActiveStatus(status);
    router.get(route('kegiatan.index'), { status: status === 'all' ? undefined : status }, { preserveState: true });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'diajukan':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Diajukan</span>;
      case 'disetujui':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'ditolak':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Ditolak</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <Head title="Kegiatan" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Daftar Kegiatan</h2>
            <p className="text-sm text-gray-600 mt-1">Kelola kegiatan dan program kerja.</p>
          </div>
          <div className="space-x-2"> 
            <Link
               href={route('kegiatan.calendar-view', { kepengurusan_lab_id: kepengurusanLabId })}
               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
               Kalender
            </Link> 
            {can.create && (
                <Link
                href={route('kegiatan.create', { kepengurusan_lab_id: kepengurusanLabId })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                + Buat Kegiatan
                </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <nav className="-mb-px flex space-x-6">
            {['all', 'diajukan', 'disetujui', 'ditolak'].map((status) => (
              <button
                key={status}
                onClick={() => handleTabChange(status)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeStatus === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kegiatan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kegiatan.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data kegiatan.
                  </td>
                </tr>
              ) : (
                kegiatan.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.nama_kegiatan}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{item.deskripsi_kegiatan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.proker?.nama_proker || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>Mulai: {formatDate(item.tanggal_mulai)}</div>
                      <div>Selesai: {formatDate(item.tanggal_selesai)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status_approval)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.approver?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={route('kegiatan.show', item.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detail
                        </Link>
                        {item.status_approval === 'diajukan' && (can.create) && (
                            <Link
                                href={route('kegiatan.edit', item.id)}
                                className="text-amber-600 hover:text-amber-900"
                            >
                                Edit
                            </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
