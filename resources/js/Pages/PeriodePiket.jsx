import React, { useState, useEffect } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLab } from '@/Components/LabContext';

const PeriodePiket = ({ periodes, kepengurusanlab, tahunKepengurusan, laboratorium, filters, errors, flash }) => {
  const { selectedLab, setSelectedLab } = useLab();
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  
  // Form untuk tambah periode
  const createForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
    kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : '',
    // Add these fields to pass with form submission
    lab_id: selectedLab ? selectedLab.id : '',
    tahun_id: selectedTahun || '',
  });
  
  // Form untuk edit periode
  const editForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
    // Add these fields to pass with form submission
    lab_id: selectedLab ? selectedLab.id : '',
    tahun_id: selectedTahun || '',
  });
  
  // Update lab_id and tahun_id in forms when they change
  useEffect(() => {
    if (selectedLab) {
      createForm.setData('lab_id', selectedLab.id);
      editForm.setData('lab_id', selectedLab.id);
    }
  }, [selectedLab]);
  
  useEffect(() => {
    createForm.setData('tahun_id', selectedTahun);
    editForm.setData('tahun_id', selectedTahun);
  }, [selectedTahun]);
  
  // Handler untuk filter tahun
  const handleTahunChange = (e) => {
    setSelectedTahun(e.target.value);
    
    router.get('/piket/periode-piket', {
      lab_id: selectedLab ? selectedLab.id : '',
      tahun_id: e.target.value,
    }, {
      preserveState: true,
      replace: true,
    });
  };
  
  // Handle lab change via context
  useEffect(() => {
    if (selectedLab) {
      router.get('/piket/periode-piket', {
        lab_id: selectedLab.id,
        tahun_id: selectedTahun,
      }, {
        preserveState: true,
        replace: true,
      });
    }
  }, [selectedLab]);
  
  // Helper function to calculate Friday from a Monday date
  const calculateFriday = (mondayDate) => {
    if (!mondayDate) return '';
    
    // Parse the date
    const date = new Date(mondayDate);
    
    // Check if it's a Monday
    if (date.getDay() !== 1) {
      return ''; // Not a Monday, return empty
    }
    
    // Calculate the Friday (Monday + 4 days)
    const friday = new Date(date);
    friday.setDate(date.getDate() + 4);
    
    // Format as YYYY-MM-DD for input
    return friday.toISOString().split('T')[0];
  };
  
  // Function to check if a date is a Monday
  const isMonday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getDay() === 1; // 1 = Monday
  };
  
  // Handle start date change in create form
  const handleStartDateChange = (e, formType = 'create') => {
    const startDate = e.target.value;
    
    if (formType === 'create') {
      createForm.setData('tanggal_mulai', startDate);
      
      // Only auto-calculate end date if start date is a Monday
      if (isMonday(startDate)) {
        const fridayDate = calculateFriday(startDate);
        createForm.setData('tanggal_selesai', fridayDate);
      } else if (startDate) {
        // Notify user if not a Monday
        toast.warning('Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.');
      }
    } else {
      editForm.setData('tanggal_mulai', startDate);
      
      // Only auto-calculate end date if start date is a Monday
      if (isMonday(startDate)) {
        const fridayDate = calculateFriday(startDate);
        editForm.setData('tanggal_selesai', fridayDate);
      } else if (startDate) {
        // Notify user if not a Monday
        toast.warning('Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.');
      }
    }
  };
  
  // Handlers for modals
  const openCreateModal = () => {
    if (!kepengurusanlab) {
      toast.error('Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu');
      return;
    }
    
    createForm.reset();
    createForm.setData({
      kepengurusan_lab_id: kepengurusanlab.id,
      lab_id: selectedLab ? selectedLab.id : '',
      tahun_id: selectedTahun || '',
      isactive: false  // Default to not active
    });
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };
  
  const openEditModal = (periode) => {
    setSelectedPeriode(periode);
    
    const formattedStartDate = periode.tanggal_mulai ? new Date(periode.tanggal_mulai).toISOString().split('T')[0] : '';
    const formattedEndDate = periode.tanggal_selesai ? new Date(periode.tanggal_selesai).toISOString().split('T')[0] : '';
    
    editForm.setData({
      nama: periode.nama,
      tanggal_mulai: formattedStartDate,
      tanggal_selesai: formattedEndDate,
      isactive: periode.isactive,
      lab_id: selectedLab ? selectedLab.id : '',
      tahun_id: selectedTahun || '',
    });
    
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPeriode(null);
    editForm.reset();
  };
  
  const openDeleteModal = (periode) => {
    setSelectedPeriode(periode);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedPeriode(null);
  };
  
  // Handlers for form submission
  const handleCreate = (e) => {
    e.preventDefault();
    
    // Perform client-side validation before submitting
    const startDate = new Date(createForm.data.tanggal_mulai);
    const endDate = new Date(createForm.data.tanggal_selesai);
    
    // Check if start date is Monday and end date is Friday
    if (startDate.getDay() !== 1) {
      toast.error('Tanggal mulai harus hari Senin');
      return;
    }
    
    if (endDate.getDay() !== 5) {
      toast.error('Tanggal selesai harus hari Jumat');
      return;
    }
    
    // Check if end date is Friday of the same week (start date + 4 days)
    const expectedFriday = new Date(startDate);
    expectedFriday.setDate(startDate.getDate() + 4);
    
    if (endDate.toDateString() !== expectedFriday.toDateString()) {
      toast.error('Tanggal selesai harus Jumat di minggu yang sama dengan tanggal mulai');
      return;
    }
    
    createForm.post(route('piket.periode-piket.store'), {
      onSuccess: () => {
        closeCreateModal();
        toast.success('Periode piket berhasil ditambahkan');
      },
      onError: (errors) => {
        console.error('Create errors:', errors);
        if (errors.tanggal_mulai) {
          toast.error(errors.tanggal_mulai);
        } else if (errors.tanggal_selesai) {
          toast.error(errors.tanggal_selesai);
        } else {
          toast.error('Gagal menambahkan periode piket');
        }
      },
      preserveState: true,
    });
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    
    // Perform client-side validation before submitting
    const startDate = new Date(editForm.data.tanggal_mulai);
    const endDate = new Date(editForm.data.tanggal_selesai);
    
    // Check if start date is Monday and end date is Friday
    if (startDate.getDay() !== 1) {
      toast.error('Tanggal mulai harus hari Senin');
      return;
    }
    
    if (endDate.getDay() !== 5) {
      toast.error('Tanggal selesai harus hari Jumat');
      return;
    }
    
    // Check if end date is Friday of the same week (start date + 4 days)
    const expectedFriday = new Date(startDate);
    expectedFriday.setDate(startDate.getDate() + 4);
    
    if (endDate.toDateString() !== expectedFriday.toDateString()) {
      toast.error('Tanggal selesai harus Jumat di minggu yang sama dengan tanggal mulai');
      return;
    }
    
    editForm.put(route('piket.periode-piket.update', selectedPeriode.id), {
      onSuccess: () => {
        closeEditModal();
        toast.success('Periode piket berhasil diperbarui');
      },
      onError: (errors) => {
        console.error('Edit errors:', errors);
        if (errors.tanggal_mulai) {
          toast.error(errors.tanggal_mulai);
        } else if (errors.tanggal_selesai) {
          toast.error(errors.tanggal_selesai);
        } else {
          toast.error('Gagal memperbarui periode piket');
        }
      },
      preserveState: true,
    });
  };
  
  const handleDelete = () => {
    router.delete(route('piket.periode-piket.destroy', selectedPeriode.id), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Periode piket berhasil dihapus');
      },
      onError: (error) => {
        console.error('Delete error:', error);
        closeDeleteModal();
        
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Gagal menghapus periode piket');
        }
      },
      preserveState: true, // Keep the state after successful deletion
      preserveScroll: true,
    });
  };
  
  const toggleActive = (periode) => {
    // Create a simplified form with just the isactive toggle and necessary filter params
    const data = {
      isactive: !periode.isactive,
      lab_id: selectedLab ? selectedLab.id : '',
      tahun_id: selectedTahun || '',
    };
    
    // Log what we're sending to help with debugging
    console.log('Toggling active status with data:', data);
    
    router.put(route('piket.periode-piket.update', periode.id), data, {
      onSuccess: () => {
        toast.success(periode.isactive ? 'Periode piket berhasil dinonaktifkan' : 'Periode piket berhasil diaktifkan');
      },
      onError: (errors) => {
        console.error('Toggle active error:', errors);
        
        // Only show one error message rather than multiple validation errors
        if (errors.message) {
          toast.error(errors.message);
        } else {
          toast.error('Gagal mengubah status periode piket');
        }
      },
      preserveState: true,
      preserveScroll: true,
    });
  };
  
  // Format date to Indonesian format
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Get day name
  const getDayName = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };
  
  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    
    if (errors && Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
    }
  }, [flash, errors]);
  
  return (
    <DashboardLayout>
      <Head title="Periode Piket" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Periode Piket</h2>
            <p className="text-sm text-gray-500 mt-1">
              {kepengurusanlab ? (
                <>
                  <span className="font-medium">{kepengurusanlab.laboratorium?.nama}</span> - Tahun {kepengurusanlab.tahunKepengurusan?.tahun}
                </>
              ) : (
                'Silakan pilih laboratorium dan tahun kepengurusan'
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
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
            
            <button
              onClick={openCreateModal}
              disabled={!kepengurusanlab}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                ${!kepengurusanlab ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Tambah Periode
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="overflow-x-auto">
          {!selectedLab ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Laboratorium</h3>
              <p className="text-gray-600">
                Silakan pilih laboratorium terlebih dahulu untuk melihat periode piket.
              </p>
            </div>
          ) : !kepengurusanlab ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Tahun Kepengurusan</h3>
              <p className="text-gray-600">
                Silakan pilih tahun kepengurusan untuk melihat periode piket.
              </p>
            </div>
          ) : periodes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Periode Piket</h3>
              <p className="text-gray-600">
                Belum ada periode piket yang ditambahkan untuk laboratorium dan tahun kepengurusan ini.
                Silakan tambahkan periode piket baru.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Mulai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Selesai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodes.map((periode, index) => (
                  <tr key={periode.id} className={periode.isactive ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {periode.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(periode.tanggal_mulai)} ({getDayName(periode.tanggal_mulai)})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(periode.tanggal_selesai)} ({getDayName(periode.tanggal_selesai)})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${periode.isactive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {periode.isactive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => toggleActive(periode)}
                          className={`text-sm px-3 py-1 rounded ${periode.isactive 
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                          {periode.isactive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button 
                          onClick={() => openEditModal(periode)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => openDeleteModal(periode)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Periode Piket</h3>
              <button 
                onClick={closeCreateModal}
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
                  placeholder="Contoh: Minggu 1 Januari 2025"
                  required
                />
                {createForm.errors.nama && (
                  <div className="text-red-500 text-xs mt-1">{createForm.errors.nama}</div>
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
                  onChange={(e) => handleStartDateChange(e, 'create')}
                  required
                />
                {createForm.errors.tanggal_mulai ? (
                  <div className="text-red-500 text-xs mt-1">{createForm.errors.tanggal_mulai}</div>
                ) : (
                  <div className="text-gray-500 text-xs mt-1">
                    {createForm.data.tanggal_mulai && !isMonday(createForm.data.tanggal_mulai) ? 
                      'Tanggal yang dipilih bukan hari Senin' : 
                      createForm.data.tanggal_mulai ? 
                        getDayName(createForm.data.tanggal_mulai) : 
                        'Pilih hari Senin untuk tanggal mulai'}
                  </div>
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
                  onChange={e => createForm.setData('tanggal_selesai', e.target.value)}
                  required
                  readOnly={isMonday(createForm.data.tanggal_mulai)} // Make read-only if start date is a Monday
                />
                {createForm.errors.tanggal_selesai ? (
                  <div className="text-red-500 text-xs mt-1">{createForm.errors.tanggal_selesai}</div>
                ) : (
                  <div className="text-gray-500 text-xs mt-1">
                    {createForm.data.tanggal_selesai ? 
                      getDayName(createForm.data.tanggal_selesai) : 
                      'Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin'}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isactive"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={createForm.data.isactive}
                    onChange={e => createForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="isactive" className="ml-2 block text-sm text-gray-700">
                    Aktifkan Periode
                  </label>
                </div>
                {createForm.errors.isactive && (
                  <div className="text-red-500 text-xs mt-1">{createForm.errors.isactive}</div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  disabled={createForm.processing}
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Periode Piket</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label htmlFor="edit-nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Periode
                </label>
                <input
                  type="text"
                  id="edit-nama"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.nama ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.nama}
                  onChange={e => editForm.setData('nama', e.target.value)}
                  required
                />
                {editForm.errors.nama && (
                  <div className="text-red-500 text-xs mt-1">{editForm.errors.nama}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai (Senin)
                </label>
                <input
                  type="date"
                  id="edit-tanggal_mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.tanggal_mulai}
                  onChange={(e) => handleStartDateChange(e, 'edit')}
                  required
                />
                {editForm.errors.tanggal_mulai ? (
                  <div className="text-red-500 text-xs mt-1">{editForm.errors.tanggal_mulai}</div>
                ) : (
                  <div className="text-gray-500 text-xs mt-1">
                    {editForm.data.tanggal_mulai && !isMonday(editForm.data.tanggal_mulai) ? 
                      'Tanggal yang dipilih bukan hari Senin' : 
                      editForm.data.tanggal_mulai ? 
                        getDayName(editForm.data.tanggal_mulai) : 
                        'Pilih hari Senin untuk tanggal mulai'}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai (Jumat)
                </label>
                <input
                  type="date"
                  id="edit-tanggal_selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.tanggal_selesai}
                  onChange={e => editForm.setData('tanggal_selesai', e.target.value)}
                  required
                  readOnly={isMonday(editForm.data.tanggal_mulai)} // Make read-only if start date is a Monday
                />
                {editForm.errors.tanggal_selesai ? (
                  <div className="text-red-500 text-xs mt-1">{editForm.errors.tanggal_selesai}</div>
                ) : (
                  <div className="text-gray-500 text-xs mt-1">
                    {editForm.data.tanggal_selesai ? 
                      getDayName(editForm.data.tanggal_selesai) : 
                      'Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin'}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-isactive"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={editForm.data.isactive}
                    onChange={e => editForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="edit-isactive" className="ml-2 block text-sm text-gray-700">
                    Aktifkan Periode
                  </label>
                </div>
                {editForm.errors.isactive && (
                  <div className="text-red-500 text-xs mt-1">{editForm.errors.isactive}</div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  disabled={editForm.processing}
                >
                  {editForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {isDeleteModalOpen && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
              <p className="text-gray-600">
                Apakah Anda yakin ingin menghapus periode <span className="font-medium">{selectedPeriode.nama}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
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