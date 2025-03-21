import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const RekapAbsen = ({ rekapAbsensi, periode, periodes, jadwalByDay }) => {
  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  const [activeTab, setActiveTab] = useState('harian'); // 'harian' or 'personal'

  const handlePeriodeChange = (e) => {
    const periodeId = e.target.value;
    setSelectedPeriode(periodeId);
    window.location.href = route('absensi.rekap', { periode_id: periodeId });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
  const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
  };

  return (
    <DashboardLayout>
      <Head title="Rekap Absen" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Rekap Absen</h1>
          
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
            
            <button
              onClick={() => window.location.href = route('absensi.export', { periode_id: selectedPeriode })}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
              disabled={!periode}
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'harian' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('harian')}
            >
              Rekap Harian
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('personal')}
            >
              Rekap Personal
            </button>
          </div>
          
          {/* Rekap Harian Content */}
          {activeTab === 'harian' && (
            <div className="p-4">
              {!periode ? (
                <div className="text-center py-6 text-gray-500">
                  Pilih periode untuk melihat rekap absen
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                            <th key={num} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Petugas {num}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {days.map((day) => (
                          <tr key={day}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {dayLabels[day]}
                            </td>
                            {Array.from({ length: 6 }, (_, i) => i).map((index) => {
                              const petugas = jadwalByDay[day] && jadwalByDay[day][index] ? jadwalByDay[day][index] : null;
                              
                              return (
                                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {petugas ? (
                                    <div className="flex items-center">
                                      {petugas.status === 'hadir' && (
                                        <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                                      )}
                                      {petugas.status === 'tidak hadir' && (
                                        <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                                      )}
                                      {petugas.status === 'pending' && (
                                        <div className="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
                                      )}
                                      {petugas.name}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex items-center space-x-6 mb-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Hadir</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <span>Tidak Hadir</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span>Pending</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Rekap Personal Content */}
          {activeTab === 'personal' && (
            <div className="p-4">
              {!periode ? (
                <div className="text-center py-6 text-gray-500">
                  Pilih periode untuk melihat rekap absen
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jadwal Piket</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hadir</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tidak Hadir</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganti</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denda</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rekapAbsensi.length > 0 ? (
                        rekapAbsensi.map((rekap, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {rekap.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rekap.total_jadwal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rekap.hadir}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rekap.tidak_hadir}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rekap.ganti}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              {formatCurrency(rekap.denda)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Tidak ada data rekap absensi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RekapAbsen;