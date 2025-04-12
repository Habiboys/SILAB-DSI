import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLab } from "@/Components/LabContext";

const RekapAbsen = ({ 
  rekapAbsensi, 
  jadwalByDay,
  periode, 
  periodes, 
  isAdmin, 
  isSuperAdmin,
  tahunKepengurusan,
  laboratorium,
  currentTahunId,
  currentLabId,
  flash 
}) => {
  // Get the authenticated user
  const { auth } = usePage().props;
  
  // Use the lab context to get the selected lab
  const { selectedLab } = useLab();
  
  // State for filters
  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  const [selectedTahun, setSelectedTahun] = useState(currentTahunId || '');
  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal' or 'rekap'
  
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
    router.get(route('piket.rekap-absen'), params, {
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
    
    router.get(route('piket.rekap-absen'), params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };
  
  // Format currency (for denda/fine)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'hadir':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'tidak hadir':
      default:
        return 'bg-red-100 text-red-800';
    }
  };
  
  // Get day name in Indonesian
  const getDayName = (day) => {
    const dayNames = {
      'senin': 'Senin',
      'selasa': 'Selasa',
      'rabu': 'Rabu',
      'kamis': 'Kamis',
      'jumat': 'Jumat',
    };
    return dayNames[day] || day;
  };
  
  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (flash?.message) {
      toast.info(flash.message);
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
      router.visit(route('piket.rekap-absen'), {
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
  
  return (
    <DashboardLayout>
      <Head title="Rekap Absensi" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">
              Rekap Absensi
              {selectedLab && ` - ${selectedLab.nama}`}
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
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 000-2v-3a1 1 00-1-1H9z" clipRule="evenodd" />
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
        
        {!selectedLab && isSuperAdmin ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Laboratorium</h3>
            <p className="text-gray-600">
              Silakan pilih laboratorium terlebih dahulu untuk melihat rekap absensi.
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
              Silakan pilih periode piket untuk melihat rekap absensi.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('jadwal')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'jadwal' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Jadwal Mingguan
              </button>
              <button
                onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'rekap' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Rekap Kehadiran
              </button>
            </div>
            
            {/* Jadwal Mingguan Tab */}
            {activeTab === 'jadwal' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hari
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Petugas 1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Petugas 2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Petugas 3
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Petugas 4
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Petugas 5
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(jadwalByDay).length > 0 ? (
                      Object.keys(jadwalByDay).map(day => (
                        <tr key={day}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getDayName(day)}
                          </td>
                          {[0, 1, 2, 3, 4].map(index => (
                            <td key={`${day}-${index}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {jadwalByDay[day][index] ? (
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusColor(jadwalByDay[day][index].status)}`}>
                                    {jadwalByDay[day][index].status === 'hadir' ? '✓' : jadwalByDay[day][index].status === 'pending' ? '⏳' : '✗'}
                                  </span>
                                  {jadwalByDay[day][index].name}
                                </div>
                              ) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada data jadwal piket untuk periode dan filter yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Rekap Kehadiran Tab */}
            {activeTab === 'rekap' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Jadwal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hadir
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tidak Hadir
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ganti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Denda
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rekapAbsensi.length > 0 ? (
                      rekapAbsensi.map((item, index) => (
                        <tr key={item.user.id} className={`hover:bg-gray-50 ${item.user.id === auth.user.id ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.user.id === auth.user.id ? `${item.user.name} (Anda)` : item.user.name}
                                </div>
                                <div className="text-sm text-gray-500">{item.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.total_jadwal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {item.hadir}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {item.tidak_hadir}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.ganti}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.denda)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada data rekap absensi untuk periode dan filter yang dipilih.
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
    </DashboardLayout>
  );
};

export default RekapAbsen;