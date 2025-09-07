import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLab } from '@/Components/LabContext';

const JadwalPiket = ({ jadwalPiket, kepengurusanLab, users, message, flash, tahunKepengurusan, laboratorium, filters, auth }) => {
  const { selectedLab, setSelectedLab } = useLab();
  const [currentTahun, setCurrentTahun] = useState(filters?.tahun_id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Add a state variable to track whether a toast message should be shown after a refresh
  const [pendingToast, setPendingToast] = useState(null);

  // Function to check if user can manage schedules
  const canManageSchedule = () => {
    return auth?.user && auth.user.roles?.some(role => 
      [ 'admin', 'kalab'].includes(role)
    );
  };

  // Form for creating a new schedule
  const createForm = useForm({
    user_id: '',
    hari: '',
    kepengurusan_lab_id: kepengurusanLab?.id || '',
  });

  // Form for editing a schedule
  const editForm = useForm({
    user_id: '',
    hari: '',
    kepengurusan_lab_id: kepengurusanLab?.id || '',
    _method: 'PUT',
  });

  // Delete form
  const deleteForm = useForm({
    _method: 'DELETE',
  });

  // Handle tahun selection change
  const handleTahunChange = (e) => {
    const tahunId = e.target.value;
    setCurrentTahun(tahunId);
  };
  
  // Update URL when lab or tahun changes
  useEffect(() => {
    if (selectedLab?.id && currentTahun) {  // Check for both values
      setIsLoading(true);
      router.visit(route('piket.jadwal.index'), {
        data: { lab_id: selectedLab.id, tahun_id: currentTahun },
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onFinish: () => setIsLoading(false),
      });
    }
  }, [selectedLab, currentTahun]);

  // Open create modal for specific day
  const openCreateModal = (day) => {
    createForm.reset();
    createForm.setData({
      user_id: '',
      hari: day,
      kepengurusan_lab_id: kepengurusanLab?.id || '',
    });
    setSelectedDay(day);
    setIsCreateModalOpen(true);
  };

  // Open edit modal for a jadwal
  const openEditModal = (item, day) => {
    setSelectedItem(item);
    setSelectedDay(day);
    editForm.reset();
    editForm.setData({
      user_id: item.id,
      hari: day,
      kepengurusan_lab_id: kepengurusanLab?.id || '',
      _method: 'PUT',
    });
    setIsEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (item, day) => {
    setSelectedItem(item);
    setSelectedDay(day);
    setIsDeleteModalOpen(true);
  };

  // Store the current lab_id and tahun_id to use after form submissions
  const storeCurrentSelections = () => {
    if (selectedLab) {
      localStorage.setItem('selectedLabId', selectedLab.id);
    }
    if (currentTahun) {
      localStorage.setItem('selectedTahunId', currentTahun);
    }
  };

  // NEW: Function to store pending toast message that should survive page reload
  const storePendingToast = (message, type) => {
    const toastInfo = { message, type, timestamp: Date.now() };
    localStorage.setItem('pendingToast', JSON.stringify(toastInfo));
  };

  // Helper function to reload the page with current lab and tahun
  const refreshWithCurrentSelections = () => {
    const labId = localStorage.getItem('selectedLabId');
    const tahunId = localStorage.getItem('selectedTahunId');
    
    // Use router to reload with preserved state
    router.visit(route('piket.jadwal.index'), {
      data: { 
        lab_id: labId,
        tahun_id: tahunId
      },
      preserveScroll: true
    });
  };

  // Handle create form submission
  const handleCreate = (e) => {
    e.preventDefault();
    
    // Store current selections before submitting
    storeCurrentSelections();
    
    // Store a pending toast that will survive the page reload
    storePendingToast('Jadwal piket berhasil ditambahkan', 'success');
    
    setIsLoading(true);
    createForm.post(route('piket.jadwal.store'), {
      data: {
        ...createForm.data,
        lab_id: selectedLab?.id,
        tahun_id: currentTahun
      },
      onSuccess: () => {
        setIsCreateModalOpen(false);
        // Don't show toast here, let the effect handle it after reload
        refreshWithCurrentSelections();
      },
      onError: (errors) => {
        setIsLoading(false);
        // Show error toasts immediately since we're not refreshing
        if (errors.user_id) toast.error(errors.user_id);
        else if (errors.hari) toast.error(errors.hari);
        else toast.error('Gagal menambahkan jadwal piket');
      },
      preserveScroll: false, // Don't preserve scroll position
    });
  };

  // Function to filter users who are already assigned to a specific day
  const filterAvailableUsers = (day) => {
    if (!jadwalPiket || !jadwalPiket[day]) return users;
    
    // Get IDs of users who are already assigned to this day
    const assignedUserIds = jadwalPiket[day].map(user => user.id);
    
    // Filter out users who are already assigned to this day
    return users.filter(user => !assignedUserIds.includes(user.id));
  };

  // Function to refresh data
  const refreshData = () => {
    window.location.href = route('piket.jadwal.index') + `?lab_id=${selectedLab?.id}&tahun_id=${currentTahun}`;
  };

  // Handle edit form submission
  const handleEdit = (e) => {
    e.preventDefault();
    
    // Store current selections before submitting
    storeCurrentSelections();
    
    // Store a pending toast message
    storePendingToast('Jadwal piket berhasil diperbarui', 'success');
    
    setIsLoading(true);
    
    // Get more information about the route
    const routePath = route('piket.jadwal.update', { id: selectedItem.jadwalId });
    console.log('DETAILED EDIT INFO:', {
      routePath: routePath,
      selectedItem: selectedItem,
      formData: editForm.data,
      lab_id: selectedLab?.id,
      tahun_id: currentTahun
    });
    
    // Try with axios directly instead
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('user_id', editForm.data.user_id);
    formData.append('hari', editForm.data.hari);
    formData.append('lab_id', selectedLab?.id);
    formData.append('tahun_id', currentTahun);
    
    axios.post(`/piket/jadwal/${selectedItem.jadwalId}`, formData, {
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'multipart/form-data',
      }
    })
    .then(response => {
      console.log('Axios edit success:', response);
      setIsEditModalOpen(false);
      // Don't show toast here, let the effect handle it after reload
      refreshWithCurrentSelections();
    })
    .catch(error => {
      console.error('Axios edit error:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui jadwal piket');
      setIsLoading(false);
    });
  };

  // Handle delete confirmation
  const handleDelete = () => {
    // Store current selections before submitting
    storeCurrentSelections();
    
    // Store a pending toast message
    storePendingToast('Jadwal piket berhasil dihapus', 'success');
    
    setIsLoading(true);
    
    // Get more information about the route
    const routePath = route('piket.jadwal.destroy', { id: selectedItem.jadwalId });
    console.log('DETAILED DELETE INFO:', {
      routePath: routePath,
      selectedItem: selectedItem,
      deleteFormData: deleteForm.data
    });
    
    // Try with axios directly instead
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const formData = new FormData();
    formData.append('_method', 'DELETE');
    formData.append('lab_id', selectedLab?.id);
    formData.append('tahun_id', currentTahun);
    
    axios.post(`/piket/jadwal/${selectedItem.jadwalId}`, formData, {
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'multipart/form-data',
      }
    })
    .then(response => {
      console.log('Axios delete success:', response);
      setIsDeleteModalOpen(false);
      // Don't show toast here, let the effect handle it after reload
      refreshWithCurrentSelections();
    })
    .catch(error => {
      console.error('Axios delete error:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus jadwal piket');
      setIsLoading(false);
    });
  };

  // On component mount, check for pending toast messages from localStorage
  useEffect(() => {
    try {
      const storedToast = localStorage.getItem('pendingToast');
      if (storedToast) {
        const toastInfo = JSON.parse(storedToast);
        
        // Only show toasts that are less than 2 seconds old to prevent showing old messages
        const isRecent = (Date.now() - toastInfo.timestamp) < 2000;
        
        if (isRecent) {
          setPendingToast(toastInfo);
        }
        
        // Clear the stored toast message
        localStorage.removeItem('pendingToast');
      }
    } catch (err) {
      console.error("Error processing stored toast:", err);
      localStorage.removeItem('pendingToast');
    }
  }, []);
  
  // Show pending toast after component mounts
  useEffect(() => {
    if (pendingToast) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        // Show the toast with the stored type and message
        if (pendingToast.type === 'success') {
          toast.success(pendingToast.message);
        } else if (pendingToast.type === 'error') {
          toast.error(pendingToast.message);
        } else if (pendingToast.type === 'info') {
          toast.info(pendingToast.message);
        }
        
        // Clear the pending toast
        setPendingToast(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [pendingToast]);

  // Handle flash messages from the server
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (message) {
      toast.info(message);
    }
  }, [flash, message]);

  // Restore the selections when component mounts
  useEffect(() => {
    const storedLabId = localStorage.getItem('selectedLabId');
    const storedTahunId = localStorage.getItem('selectedTahunId');
    
    // If we have stored values and they don't match current ones,
    // visit the page with the stored values to restore state
    if (storedLabId && (!selectedLab || selectedLab.id !== parseInt(storedLabId))) {
      const labToSelect = laboratorium.find(lab => lab.id === parseInt(storedLabId));
      if (labToSelect) {
        setSelectedLab(labToSelect);
      }
    }
    
    if (storedTahunId && currentTahun !== storedTahunId) {
      setCurrentTahun(storedTahunId);
    }
  }, []);

  // When lab or tahun changes, store the new values
  useEffect(() => {
    if (selectedLab) {
      localStorage.setItem('selectedLabId', selectedLab.id);
    }
    if (currentTahun) {
      localStorage.setItem('selectedTahunId', currentTahun);
    }
  }, [selectedLab, currentTahun]);

  // Format day names to Indonesian
  const dayNames = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
  };

  // Find selected lab and tahun info for display
  const selectedLabInfo = selectedLab ? selectedLab.nama : null;
  const selectedTahunInfo = tahunKepengurusan?.find(t => t.id == currentTahun)?.tahun || null;
  const filterActive = Boolean(selectedLabInfo && selectedTahunInfo);

  return (
    <DashboardLayout>
      <Head title="Jadwal Piket" />
      {/* Increase autoClose duration to make toasts stay longer */}
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Jadwal Piket
            </h2>
          </div>
          
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="w-full lg:w-auto">
              <select
                value={currentTahun}
                onChange={handleTahunChange}
                className="w-full lg:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">Pilih Tahun</option>
                {tahunKepengurusan && tahunKepengurusan.map(tahun => (
                  <option key={tahun.id} value={tahun.id}>
                    {tahun.tahun}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Filter info banner */}
        {filterActive && (
          <div className="mx-6 mt-4 mb-2 flex items-center p-4 border rounded-lg bg-blue-50 border-blue-200">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-blue-500 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="flex-1 text-sm text-blue-800">
              Menampilkan jadwal piket untuk <strong>{selectedLabInfo}</strong> pada tahun kepengurusan <strong>{selectedTahunInfo}</strong>
            </div>
            {isLoading && (
              <div className="flex-shrink-0 ml-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        )}
        
        {!kepengurusanLab ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Tersedia</h3>
            <p className="text-gray-600">
              Silakan pilih laboratorium dan tahun kepengurusan untuk melihat jadwal piket.
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.keys(dayNames).map(day => (
              <div key={day} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">{dayNames[day]}</h3>
                  {canManageSchedule() && (
                    <button
                      onClick={() => openCreateModal(day)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                      title="Tambah Petugas"
                      disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {jadwalPiket[day] && jadwalPiket[day].length > 0 ? (
                    jadwalPiket[day].map(user => (
                      <div key={user.jadwalId} className="p-2 bg-white rounded border flex justify-between items-center">
                        <div className="font-medium text-gray-700">{user.name}</div>
                        {canManageSchedule() && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditModal(user, day)}
                              className="text-blue-600 hover:text-blue-800 focus:outline-none"
                              title="Edit"
                              disabled={isLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(user, day)}
                              className="text-red-600 hover:text-red-800 focus:outline-none"
                              title="Hapus"
                              disabled={isLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      Belum ada petugas untuk hari {dayNames[day]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Tambah Petugas Piket ({dayNames[selectedDay]})
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createForm.processing || isLoading}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                  Anggota
                </label>
                <select
                  id="user_id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={createForm.data.user_id}
                  onChange={e => createForm.setData('user_id', e.target.value)}
                  required
                  disabled={createForm.processing || isLoading}
                >
                  <option value="">Pilih Anggota</option>
                  {filterAvailableUsers(selectedDay).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {filterAvailableUsers(selectedDay).length === 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    Semua anggota sudah ditugaskan untuk hari {dayNames[selectedDay]}
                  </p>
                )}
              </div>
              
              <div className="mt-5 sm:mt-6 space-x-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createForm.processing || isLoading || filterAvailableUsers(selectedDay).length === 0}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={createForm.processing || isLoading || filterAvailableUsers(selectedDay).length === 0}
                >
                  {createForm.processing || isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Petugas Piket ({dayNames[selectedDay]})
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editForm.processing || isLoading}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label htmlFor="edit_user_id" className="block text-sm font-medium text-gray-700">
                  Anggota
                </label>
                <select
                  id="edit_user_id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={editForm.data.user_id}
                  onChange={e => editForm.setData('user_id', e.target.value)}
                  required
                  disabled={editForm.processing || isLoading}
                >
                  <option value="">Pilih Anggota</option>
                  {/* For edit, we need to include the currently selected user plus other available users */}
                  {[
                    ...filterAvailableUsers(selectedDay),
                    ...(!filterAvailableUsers(selectedDay).some(u => u.id === selectedItem.id) ? [users.find(u => u.id === selectedItem.id)] : [])
                  ]
                    .filter(Boolean)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="mt-5 sm:mt-6 space-x-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editForm.processing || isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={editForm.processing || isLoading}
                >
                  {editForm.processing || isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Konfirmasi Hapus
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isLoading}
              >
                &times;
              </button>
            </div>
            
            <p className="mb-4 text-gray-600">
              Apakah Anda yakin ingin menghapus {selectedItem.name} dari jadwal piket hari {dayNames[selectedDay]}?
            </p>
            
            <div className="mt-5 sm:mt-6 space-x-2 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menghapus...
                  </span>
                ) : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JadwalPiket;