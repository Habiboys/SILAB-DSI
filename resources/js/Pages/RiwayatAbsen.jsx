import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EyeIcon } from '@heroicons/react/24/outline';

const RiwayatAbsen = ({ riwayatAbsensi, periode, periodes }) => {
  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState(null);

  const handlePeriodeChange = (e) => {
    const periodeId = e.target.value;
    setSelectedPeriode(periodeId);
    window.location.href = route('absensi.index', { periode_id: periodeId });
  };

  const openDetailModal = (absensi) => {
    setSelectedAbsensi(absensi);
    setShowDetailModal(true);
  };

  return (
    <DashboardLayout>
      <Head title="Riwayat Absen" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Riwayat Absen</h1>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriode}
              onChange={handlePeriodeChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Periode</option>
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({new Date(p.tanggal_mulai).toLocaleDateString()} - {new Date(p.tanggal_selesai).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            {periode ? (
              <h2 className="text-lg font-medium">
                Periode: {periode.nama} ({new Date(periode.tanggal_mulai).toLocaleDateString()} - {new Date(periode.tanggal_selesai).toLocaleDateString()})
                {periode.isactive && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Aktif
                  </span>
                )}
              </h2>
            ) : (
              <h2 className="text-lg font-medium">Pilih periode untuk melihat riwayat absen</h2>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kegiatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riwayatAbsensi.length > 0 ? (
                  riwayatAbsensi.map((absensi, index) => {
                    const tanggal = new Date(absensi.tanggal);
                    const hari = tanggal.toLocaleDateString('id-ID', { weekday: 'long' });
                    
                    return (
                      <tr key={absensi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tanggal.toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hari}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {absensi.jadwalPiket?.user?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {absensi.jam_masuk}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {absensi.jam_keluar || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {absensi.kegiatan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => openDetailModal(absensi)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      {periode ? 'Tidak ada data absensi untuk periode ini' : 'Pilih periode untuk melihat data absensi'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {showDetailModal && selectedAbsensi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Absensi</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama
                  </label>
                  <div className="text-gray-900">
                    {selectedAbsensi.jadwalPiket?.user?.name || '-'}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <div className="text-gray-900">
                    {new Date(selectedAbsensi.tanggal).toLocaleDateString('id-ID')}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Mulai
                  </label>
                  <div className="text-gray-900">
                    {selectedAbsensi.jam_masuk}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jam Selesai
                  </label>
                  <div className="text-gray-900">
                    {selectedAbsensi.jam_keluar || '-'}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kegiatan
                  </label>
                  <div className="text-gray-900">
                    {selectedAbsensi.kegiatan}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto
                </label>
                <div className="mt-1">
                  {selectedAbsensi.foto ? (
                    <img
                      src={`/storage/${selectedAbsensi.foto}`}
                      alt="Foto Absensi"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  ) : (
                    <div className="text-gray-500">Tidak ada foto</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RiwayatAbsen;