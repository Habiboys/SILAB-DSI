import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLab } from "@/Components/LabContext";

const RiwayatAbsen = ({ 
  riwayatAbsensi, 
  periode, 
  periodes, 
  isAdmin,
  isSuperAdmin,
  tahunKepengurusan,
  laboratorium,
  currentTahunId,
  flash 
}) => {
  // Get the authenticated user
  const { auth } = usePage().props;
  
  // Use the lab context to get the selected lab
  const { selectedLab } = useLab();
  
  // State for filters
  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  const [selectedTahun, setSelectedTahun] = useState(currentTahunId || '');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Handle period selection change
  const handlePeriodeChange = (e) => {
    const periodeId = e.target.value;
    setSelectedPeriode(periodeId);
    
    // Prepare query parameters
    const params = { 
      periode_id: periodeId,
    };
    
    // Add lab_id filter for superadmin/kadep
    if (isSuperAdmin && selectedLab) {
      params.lab_id = selectedLab.id;
    }
    
    // Add tahun_id filter
    if (selectedTahun) {
      params.tahun_id = selectedTahun;
    }
    
    // Navigate with filters
    router.get(route('piket.absensi.show'), params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };
  
  // Handle tahun selection change
  const handleTahunChange = (e) => {
    const tahunId = e.target.value;
    setSelectedTahun(tahunId);
    
    // Include other filters when changing tahun
    const params = {
      tahun_id: tahunId,
      periode_id: selectedPeriode,
    };
    
    // Add lab_id filter for superadmin/kadep
    if (isSuperAdmin && selectedLab) {
      params.lab_id = selectedLab.id;
    }
    
    router.get(route('piket.absensi.show'), params, {
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
  
  // Reset selectedPeriode when lab or year changes
  useEffect(() => {
    // Reset selected period when lab changes
    setSelectedPeriode('');
  }, [selectedLab]);

  useEffect(() => {
    // Reset selected period when year changes
    setSelectedPeriode('');
  }, [selectedTahun]);

  // Update data when lab selection changes in context (for superadmin/kadep)
  useEffect(() => {
    if (isSuperAdmin && selectedLab) {
      router.visit(route('piket.absensi.show'), {
        data: {
          lab_id: selectedLab.id,
          periode_id: '', // Reset period when lab changes
          tahun_id: selectedTahun
        },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [isSuperAdmin, selectedLab]);
  
  // Render user name or you (for own records)
  const renderUserName = (user) => {
    if (!user) return '-';
    return user.id === auth.user.id ? `${user.name} (Anda)` : user.name;
  };
  
  return (
    <DashboardLayout>
      <Head title="Riwayat Absensi" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header with filters */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">
              Riwayat Absensi
              {!isSuperAdmin && selectedLab && ` - ${selectedLab.nama}`}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Tahun selection (for superadmin/kadep and admin) */}
              {(isAdmin || isSuperAdmin) && (
                <div>
                  <select
                    value={selectedTahun}
                    onChange={handleTahunChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Tahun</option>
                    {tahunKepengurusan?.map(tahun => (
                      <option key={tahun.id} value={tahun.id}>
                        {tahun.tahun}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Period selection - for all users */}
              <div>
                <select
                  id="periode"
                  value={selectedPeriode}
                  onChange={handlePeriodeChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {!periodes || periodes.length === 0 ? (
                    <option value="">Tidak ada periode</option>
                  ) : (
                    <>
                      <option value="">Pilih Periode</option>
                      {periodes.map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
          
          {/* Info banner for filter selection */}
          {isSuperAdmin && selectedLab && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center text-blue-700">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Menampilkan data untuk <strong>{selectedLab.nama}</strong>
                  {selectedTahun && tahunKepengurusan && (
                    <> pada tahun <strong>{tahunKepengurusan.find(t => t.id == selectedTahun)?.tahun || '-'}</strong></>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content */}
        {!selectedLab && isSuperAdmin ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Laboratorium</h3>
            <p className="text-gray-600">
              Silakan pilih laboratorium terlebih dahulu untuk melihat riwayat absensi.
            </p>
          </div>
        ) : !periode ? (
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
              {!isAdmin ? 
                "Anda belum memiliki data absensi untuk periode piket yang dipilih." :
                "Belum ada data absensi untuk periode piket yang dipilih."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  {/* Show Nama column for admins/superadmins or if viewing multiple users' data */}
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
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.user?.id === auth.user.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.tanggal)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderUserName(item.user)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_masuk || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_keluar || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.kegiatan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                  <p className="font-medium">{renderUserName(selectedItem.user)}</p>
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
                    onError={(e) => {
                      console.error('Failed to load image:', selectedItem.foto);
                      e.target.onerror = null; // Prevent infinite error loop
                      
                      // Create a more informative fallback than just a placeholder image
                      const canvas = document.createElement('canvas');
                      canvas.width = 300;
                      canvas.height = 150;
                      const ctx = canvas.getContext('2d');
                      
                      // Draw background
                      ctx.fillStyle = '#f3f4f6';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      
                      // Draw error message
                      ctx.fillStyle = '#6b7280';
                      ctx.font = '14px Arial, sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText('Tidak dapat memuat gambar', canvas.width/2, canvas.height/2 - 15);
                      ctx.fillText('(Error 403: Tidak ada akses)', canvas.width/2, canvas.height/2 + 15);
                      
                      e.target.src = canvas.toDataURL();
                    }}
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