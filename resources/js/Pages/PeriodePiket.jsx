import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const PeriodePiket = ({ periodes, flash }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);

  const createForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
  });
  
  const editForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
  });

  const [deleteForm] = useState({
    _method: 'DELETE',
  });

  const openCreateModal = () => {
    createForm.reset();
    setIsCreateModalOpen(true);
  };
  
  const openEditModal = (periode) => {
    setSelectedPeriode(periode);
    editForm.setData({
      nama: periode.nama,
      tanggal_mulai: periode.tanggal_mulai,
      tanggal_selesai: periode.tanggal_selesai,
      isactive: periode.isactive,
    });
    setIsEditModalOpen(true);
  };
  
  const openDeleteModal = (periode) => {
    setSelectedPeriode(periode);
    setIsDeleteModalOpen(true);
  };
  
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route('piket.periode-piket.store'), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        toast.success('Periode piket berhasil ditambahkan');
      },
      onError: (errors) => {
        Object.keys(errors).forEach(key => {
          toast.error(errors[key]);
        });
      },
    });
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    editForm.put(route('piket.periode-piket.update', selectedPeriode.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast.success('Periode piket berhasil diperbarui');
      },
      onError: (errors) => {
        Object.keys(errors).forEach(key => {
          toast.error(errors[key]);
        });
      },
    });
  };
  
  const handleDelete = () => {
    setIsDeleteModalOpen(false);
    
    const toastId = toast.info('Menghapus periode...', { autoClose: false });
    
    axios.delete(route('piket.periode-piket.destroy', selectedPeriode.id))
      .then(response => {
        toast.update(toastId, {
          render: response.data.message || 'Periode piket berhasil dihapus',
          type: 'success',
          autoClose: 3000
        });
        
        setTimeout(() => {
          router.visit(route('piket.periode-piket.index'), {
            preserveState: true,
          });
        }, 1000);
      })
      .catch(error => {
        console.error('Delete error:', error);
        
        const errorMessage = error.response?.data?.message || 'Gagal menghapus periode piket';
        
        toast.update(toastId, {
          render: errorMessage,
          type: 'error',
          autoClose: 3000
        });
      });
  };
  
  const handleActivate = (periode) => {
    router.put(route('piket.periode-piket.update', periode.id), {
      isactive: true,
    }, {
      onSuccess: () => {
        toast.success('Periode piket berhasil diaktifkan');
      },
      onError: (errors) => {
        Object.keys(errors).forEach(key => {
          toast.error(errors[key]);
        });
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getDayName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNames[date.getDay()];
  };

  const isWeekday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };

  const calculateEndDate = (startDateString) => {
    if (!startDateString) return '';
    
    const startDate = new Date(startDateString);
    const dayOfWeek = startDate.getDay();
    
    let daysToAdd = 0;
    
    if (dayOfWeek === 0) {
      daysToAdd = 5;
    } else if (dayOfWeek === 6) {
      daysToAdd = 6;
    } else if (dayOfWeek < 5) {
      daysToAdd = 5 - dayOfWeek;
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + daysToAdd);
    return endDate.toISOString().split('T')[0];
  };

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
      <Head title="Periode Piket" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Periode Piket</h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola periode piket untuk sistem absensi laboratorium
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Tambah Periode
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodes.length > 0 ? (
                  periodes.map((periode, index) => (
                    <tr key={periode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{periode.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(periode.tanggal_mulai)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(periode.tanggal_selesai)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          periode.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {periode.isactive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!periode.isactive && (
                            <button
                              onClick={() => handleActivate(periode)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Aktifkan Periode"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(periode)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Periode"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(periode)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus Periode"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Tidak ada data periode piket
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Periode Piket</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Periode
                </label>
                <input
                  type="text"
                  id="nama"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.nama ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.nama}
                  onChange={e => createForm.setData('nama', e.target.value)}
                  placeholder="Contoh: Minggu 1 April 2025"
                  required
                />
                {createForm.errors.nama && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.nama}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai (Senin)
                </label>
                <input
                  type="date"
                  id="tanggal_mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.tanggal_mulai}
                  onChange={e => {
                    createForm.setData('tanggal_mulai', e.target.value);
                    if (e.target.value) {
                      const startDate = new Date(e.target.value);
                      const dayName = getDayName(e.target.value);
                      
                      if (!isWeekday(e.target.value)) {
                        toast.warning(`Anda memilih hari ${dayName}. Tanggal mulai sebaiknya hari kerja (Senin-Jumat).`);
                      } else if (dayName !== 'Senin') {
                        toast.info(`Anda memilih hari ${dayName}. Periode piket biasanya dimulai pada hari Senin.`);
                      }
                      
                      const endDateStr = calculateEndDate(e.target.value);
                      createForm.setData('tanggal_selesai', endDateStr);
                    }
                  }}
                  required
                />
                {createForm.errors.tanggal_mulai && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.tanggal_mulai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai (Jumat)
                </label>
                <input
                  type="date"
                  id="tanggal_selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.tanggal_selesai}
                  onChange={e => {
                    createForm.setData('tanggal_selesai', e.target.value);
                    
                    if (e.target.value && createForm.data.tanggal_mulai) {
                      const endDate = new Date(e.target.value);
                      const startDate = new Date(createForm.data.tanggal_mulai);
                      const dayName = getDayName(e.target.value);
                      
                      if (!isWeekday(e.target.value)) {
                        toast.warning(`Anda memilih hari ${dayName}. Tanggal selesai sebaiknya hari kerja (Senin-Jumat).`);
                      }
                      
                      if (endDate < startDate) {
                        toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
                      }
                      
                      const diffTime = Math.abs(endDate - startDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays > 5) {
                        toast.warning(`Periode piket biasanya tidak lebih dari 5 hari kerja. Anda memilih ${diffDays} hari.`);
                      }
                    }
                  }}
                  required
                />
                {createForm.errors.tanggal_selesai && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.tanggal_selesai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isactive"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={createForm.data.isactive}
                    onChange={e => createForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="isactive" className="ml-2 block text-sm text-gray-700">
                    Jadikan sebagai periode aktif
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jika diaktifkan, periode lain akan dinonaktifkan secara otomatis.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isEditModalOpen && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Periode Piket</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label htmlFor="edit_nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Periode
                </label>
                <input
                  type="text"
                  id="edit_nama"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.nama ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.nama}
                  onChange={e => editForm.setData('nama', e.target.value)}
                  placeholder="Contoh: Minggu 1 April 2025"
                  required
                />
                {editForm.errors.nama && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.nama}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit_tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai (Senin)
                </label>
                <input
                  type="date"
                  id="edit_tanggal_mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.tanggal_mulai}
                  onChange={e => {
                    editForm.setData('tanggal_mulai', e.target.value);
                    if (e.target.value) {
                      const startDate = new Date(e.target.value);
                      const dayName = getDayName(e.target.value);
                      
                      if (!isWeekday(e.target.value)) {
                        toast.warning(`Anda memilih hari ${dayName}. Tanggal mulai sebaiknya hari kerja (Senin-Jumat).`);
                      } else if (dayName !== 'Senin') {
                        toast.info(`Anda memilih hari ${dayName}. Periode piket biasanya dimulai pada hari Senin.`);
                      }
                      
                      const endDateStr = calculateEndDate(e.target.value);
                      editForm.setData('tanggal_selesai', endDateStr);
                    }
                  }}
                  required
                />
                {editForm.errors.tanggal_mulai && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.tanggal_mulai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit_tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai (Jumat)
                </label>
                <input
                  type="date"
                  id="edit_tanggal_selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.tanggal_selesai}
                  onChange={e => {
                    editForm.setData('tanggal_selesai', e.target.value);
                    
                    if (e.target.value && editForm.data.tanggal_mulai) {
                      const endDate = new Date(e.target.value);
                      const startDate = new Date(editForm.data.tanggal_mulai);
                      const dayName = getDayName(e.target.value);
                      
                      if (!isWeekday(e.target.value)) {
                        toast.warning(`Anda memilih hari ${dayName}. Tanggal selesai sebaiknya hari kerja (Senin-Jumat).`);
                      }
                      
                      if (endDate < startDate) {
                        toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
                      }
                      
                      const diffTime = Math.abs(endDate - startDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays > 5) {
                        toast.warning(`Periode piket biasanya tidak lebih dari 5 hari kerja. Anda memilih ${diffDays} hari.`);
                      }
                    }
                  }}
                  required
                />
                {editForm.errors.tanggal_selesai && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.tanggal_selesai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_isactive"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={editForm.data.isactive}
                    onChange={e => editForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="edit_isactive" className="ml-2 block text-sm text-gray-700">
                    Jadikan sebagai periode aktif
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jika diaktifkan, periode lain akan dinonaktifkan secara otomatis.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {editForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isDeleteModalOpen && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <p className="mb-4 text-gray-700">
              Apakah Anda yakin ingin menghapus periode piket <span className="font-medium">{selectedPeriode.nama}</span>?
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
            <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PeriodePiket;