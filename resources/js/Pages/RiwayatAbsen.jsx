import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RiwayatAbsen = ({ riwayatAbsensi, periode, periodes, isAdmin, flash }) => {
  // Tambahkan di awal component RiwayatAbsen
  console.log('RiwayatAbsen props:', {
    riwayatAbsensi,
    periode,
    periodes,
    isAdmin
  });


  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Handle period selection change
  const handlePeriodeChange = (e) => {
    const periodeId = e.target.value;
    setSelectedPeriode(periodeId);
    router.get(route('piket.absensi.show'), { 
      periode_id: periodeId 
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };
  
  // Format date to Indonesian format
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // View attendance details
  const viewDetails = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };
  
  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);
  
  return (
    <DashboardLayout>
      <Head title="Riwayat Absensi" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Riwayat Absensi</h2>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="periode" className="text-sm font-medium text-gray-700">
              Periode:
            </label>
            <select
              id="periode"
              value={selectedPeriode}
              onChange={handlePeriodeChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Pilih Periode</option>
              {periodes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {!periode ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Periode Piket</h3>
            <p className="text-gray-600">
              Silakan pilih periode piket untuk melihat riwayat absensi.
            </p>
          </div>
        ) : riwayatAbsensi.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data Absensi</h3>
            <p className="text-gray-600">
              Belum ada data absensi untuk periode piket ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Keluar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kegiatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riwayatAbsensi.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.tanggal)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.user?.name || '-'}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_masuk || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_keluar || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.kegiatan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewDetails(item)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* View Modal */}
      {viewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Absensi</h3>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Tanggal</p>
                <p className="font-medium">{formatDate(selectedItem.tanggal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Periode</p>
                <p className="font-medium">{selectedItem.periode || '-'}</p>
              </div>
              {isAdmin && (
                <div>
                  <p className="text-sm text-gray-500">Nama</p>
                  <p className="font-medium">{selectedItem.user?.name || '-'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Jam Masuk</p>
                <p className="font-medium">{selectedItem.jam_masuk || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jam Keluar</p>
                <p className="font-medium">{selectedItem.jam_keluar || '-'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Kegiatan</p>
              <p className="p-3 bg-gray-50 rounded-md">{selectedItem.kegiatan}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Foto Absensi</p>
              {selectedItem.foto ? (
                <div className="flex justify-center">
                  <img 
                    src={selectedItem.foto} 
                    alt="Foto Absensi" 
                    className="max-h-64 rounded-lg border" 
                  />
                </div>
              ) : (
                <div className="p-4 bg-gray-50 text-gray-400 text-center rounded-md">
                  Tidak ada foto
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewModalOpen(false)}
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