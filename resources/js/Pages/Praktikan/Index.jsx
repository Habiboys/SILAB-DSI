import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PraktikanIndex = ({ 
  praktikum, 
  praktikan, // all praktikan for backward compatibility
  praktikanByKelas, 
  praktikanTanpaKelas, 
  availableUsers,
  kelas,
  lab 
}) => {
  const { auth } = usePage().props;
  
  // Role-based access control
  const isAdmin = auth.user && auth.user.roles.some(role => ['admin', 'superadmin'].includes(role));
  
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignKelasModalOpen, setIsAssignKelasModalOpen] = useState(false);
  const [selectedPraktikan, setSelectedPraktikan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create form
  const createForm = useForm({
    nim: '',
    nama: '',
    no_hp: '',
    kelas_id: '',
    is_existing_user: false,
  });

  // Add existing user form
  const addExistingForm = useForm({
    user_id: '',
    kelas_id: '',
  });

  // Assign to class form
  const assignKelasForm = useForm({
    kelas_id: '',
  });

  // Import form
  const importForm = useForm({
    file: null,
  });

  // Delete form
  const deleteForm = useForm({});

  // Filter available users based on search query
  const filteredUsers = availableUsers?.filter(user => 
    user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get praktikan data based on active tab
  const getCurrentPraktikanData = () => {
    if (activeTab === 'all') {
      return praktikan || [];
    } else if (activeTab === 'unassigned') {
      return praktikanTanpaKelas || [];
    } else {
      // Specific kelas tab
      return praktikanByKelas?.[activeTab] || [];
    }
  };

  // Open modals
  const openCreateModal = () => {
    if (!isAdmin) return;
    createForm.reset();
    setIsCreateModalOpen(true);
  };

  const openAddExistingModal = () => {
    if (!isAdmin) return;
    addExistingForm.reset();
    setSearchQuery('');
    setIsAddExistingModalOpen(true);
  };

  const openAssignKelasModal = (praktikan) => {
    if (!isAdmin) return;
    setSelectedPraktikan(praktikan);
    assignKelasForm.setData('kelas_id', praktikan.kelas_id || '');
    setIsAssignKelasModalOpen(true);
  };

  // Close modals
  const closeCreateModal = () => {
    createForm.reset();
    setIsCreateModalOpen(false);
  };

  const closeAddExistingModal = () => {
    addExistingForm.reset();
    setSearchQuery('');
    setIsAddExistingModalOpen(false);
  };

  const closeAssignKelasModal = () => {
    assignKelasForm.reset();
    setSelectedPraktikan(null);
    setIsAssignKelasModalOpen(false);
  };

  // Handle form submissions
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route('praktikum.praktikan.store', { praktikum: praktikum.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Praktikan berhasil ditambahkan');
        closeCreateModal();
      },
      onError: (errors) => {
        console.error(errors);
        toast.error('Gagal menambahkan praktikan');
      }
    });
  };

  const handleAddExisting = (e) => {
    e.preventDefault();
    addExistingForm.post(route('praktikum.praktikan.add-existing', { praktikum: praktikum.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Praktikan berhasil ditambahkan');
        closeAddExistingModal();
      },
      onError: (errors) => {
        console.error(errors);
        toast.error('Gagal menambahkan praktikan');
      }
    });
  };

  const handleAssignKelas = (e) => {
    e.preventDefault();
    if (!selectedPraktikan) return;

    if (assignKelasForm.data.kelas_id) {
      assignKelasForm.put(route('praktikum.praktikan.assign-kelas', { 
        praktikum: praktikum.id, 
        praktikan: selectedPraktikan.id 
      }), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Praktikan berhasil diassign ke kelas');
          closeAssignKelasModal();
        },
        onError: () => {
          toast.error('Gagal assign praktikan ke kelas');
        }
      });
    } else {
      // Remove from kelas
      router.put(route('praktikum.praktikan.remove-kelas', { 
        praktikum: praktikum.id, 
        praktikan: selectedPraktikan.id 
      }), {}, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Praktikan berhasil dikeluarkan dari kelas');
          closeAssignKelasModal();
        },
        onError: () => {
          toast.error('Gagal mengeluarkan praktikan dari kelas');
        }
      });
    }
  };

  // Handle import
  const handleImport = (e) => {
    e.preventDefault();
    importForm.post(route('praktikum.praktikan.import', { praktikum: praktikum.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Data praktikan berhasil diimport');
        setIsImportModalOpen(false);
      },
      onError: () => {
        toast.error('Gagal mengimport data praktikan');
      }
    });
  };

  // Handle delete
  const handleDelete = (praktikan) => {
    setSelectedPraktikan(praktikan);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteForm.delete(route('praktikum.praktikan.destroy', { praktikan: selectedPraktikan.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Praktikan berhasil dihapus');
        setIsDeleteModalOpen(false);
        setSelectedPraktikan(null);
      },
      onError: () => {
        toast.error('Gagal menghapus praktikan');
      }
    });
  };

  // Update status
  const updateStatus = (praktikan, newStatus) => {
    router.put(route('praktikum.praktikan.update-status', { praktikan: praktikan.id }), {
      status: newStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Status praktikan berhasil diubah');
      },
      onError: () => {
        toast.error('Gagal mengubah status praktikan');
      }
    });
  };

  // Download template
  const downloadTemplate = () => {
    const url = route('praktikan.template.download', { praktikum_id: praktikum.id });
    window.open(url, '_blank');
  };

  // Get tab count
  const getTabCount = (tabType, kelasId = null) => {
    if (tabType === 'all') {
      return praktikan?.length || 0;
    } else if (tabType === 'unassigned') {
      return praktikanTanpaKelas?.length || 0;
    } else {
      return praktikanByKelas?.[kelasId]?.length || 0;
    }
  };

  return (
    <DashboardLayout>
      <Head title="Kelola Praktikan" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.get(route('praktikum.index'))}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Kelola Praktikan</h2>
              <h3 className="text-md text-gray-600">Mata Kuliah: {praktikum?.mata_kuliah}</h3>
              <p className="text-sm text-gray-500">Lab: {lab?.nama_lab}</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex space-x-3">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Download Template
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Import Excel
              </button>
              <button
                onClick={openAddExistingModal}
                className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Tambah Existing User
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Tambah Praktikan
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {/* All Tab */}
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Semua Kelas ({getTabCount('all')})
            </button>

            {/* Unassigned Tab */}
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'unassigned'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Belum Diassign ({getTabCount('unassigned')})
            </button>

            {/* Kelas Tabs */}
            {kelas?.map((kelasItem) => (
              <button
                key={kelasItem.id}
                onClick={() => setActiveTab(kelasItem.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === kelasItem.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kelas {kelasItem.nama_kelas} ({getTabCount('kelas', kelasItem.id)})
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  NIM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  No HP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentPraktikanData().map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium border-r border-gray-200">
                    {p.nim}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                    {p.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {p.user?.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {p.no_hp || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {p.kelas ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {p.kelas.nama_kelas}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Belum Diassign
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      p.status === 'aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openAssignKelasModal(p)}
                          className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none"
                          title="Assign Kelas"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <select
                          value={p.status}
                          onChange={(e) => updateStatus(p, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="aktif">Aktif</option>
                          <option value="nonaktif">Nonaktif</option>
                        </select>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                          title="Hapus"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {getCurrentPraktikanData().length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Tidak ada data praktikan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Existing User Modal */}
      {isAddExistingModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tambah Existing User sebagai Praktikan
              </h3>
              
              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari User:
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama, NIM, atau email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <form onSubmit={handleAddExisting}>
                {/* User Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih User:
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <input
                            type="radio"
                            name="user_id"
                            value={user.id}
                            checked={addExistingForm.data.user_id === user.id}
                            onChange={(e) => addExistingForm.setData('user_id', e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user.nama}</div>
                            <div className="text-sm text-gray-500">
                              NIM: {user.nim || 'N/A'} | Email: {user.email}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">
                        {searchQuery ? 'Tidak ada user yang sesuai dengan pencarian' : 'Tidak ada user tersedia'}
                      </div>
                    )}
                  </div>
                  {addExistingForm.errors.user_id && (
                    <p className="mt-1 text-sm text-red-600">{addExistingForm.errors.user_id}</p>
                  )}
                </div>

                {/* Kelas Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign ke Kelas (Opsional):
                  </label>
                  <select
                    value={addExistingForm.data.kelas_id}
                    onChange={(e) => addExistingForm.setData('kelas_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Pilih Kelas (Opsional)</option>
                    {kelas?.map((kelasItem) => (
                      <option key={kelasItem.id} value={kelasItem.id}>
                        {kelasItem.nama_kelas}
                      </option>
                    ))}
                  </select>
                  {addExistingForm.errors.kelas_id && (
                    <p className="mt-1 text-sm text-red-600">{addExistingForm.errors.kelas_id}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAddExistingModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addExistingForm.processing || !addExistingForm.data.user_id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {addExistingForm.processing ? 'Menyimpan...' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Kelas Modal */}
      {isAssignKelasModalOpen && selectedPraktikan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Kelas - {selectedPraktikan.nama}
              </h3>
              
              <form onSubmit={handleAssignKelas}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Kelas:
                  </label>
                  <select
                    value={assignKelasForm.data.kelas_id}
                    onChange={(e) => assignKelasForm.setData('kelas_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tidak Assign ke Kelas</option>
                    {kelas?.map((kelasItem) => (
                      <option key={kelasItem.id} value={kelasItem.id}>
                        {kelasItem.nama_kelas}
                      </option>
                    ))}
                  </select>
                  {assignKelasForm.errors.kelas_id && (
                    <p className="mt-1 text-sm text-red-600">{assignKelasForm.errors.kelas_id}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAssignKelasModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={assignKelasForm.processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {assignKelasForm.processing ? 'Menyimpan...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tambah Praktikan Baru
              </h3>
              
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIM:
                  </label>
                  <input
                    type="text"
                    value={createForm.data.nim}
                    onChange={(e) => createForm.setData('nim', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {createForm.errors.nim && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.nim}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama:
                  </label>
                  <input
                    type="text"
                    value={createForm.data.nama}
                    onChange={(e) => createForm.setData('nama', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {createForm.errors.nama && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.nama}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No HP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={createForm.data.no_hp}
                    onChange={(e) => createForm.setData('no_hp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {createForm.errors.no_hp && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.no_hp}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign ke Kelas (Opsional):
                  </label>
                  <select
                    value={createForm.data.kelas_id}
                    onChange={(e) => createForm.setData('kelas_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Pilih Kelas (Opsional)</option>
                    {kelas?.map((kelasItem) => (
                      <option key={kelasItem.id} value={kelasItem.id}>
                        {kelasItem.nama_kelas}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.kelas_id && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.kelas_id}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createForm.processing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {createForm.processing ? 'Menyimpan...' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import Data Praktikan
              </h3>
              
              {/* Informasi Kelas yang Tersedia */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  📋 Kelas yang Tersedia untuk Import:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {kelas?.map((kelasItem) => (
                    <div key={kelasItem.id} className="text-sm text-blue-700">
                      <span className="font-medium">ID: {kelasItem.id}</span>
                      <span className="mx-2">-</span>
                      <span>{kelasItem.nama_kelas}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Gunakan ID kelas di atas untuk mengisi kolom 'kelas_id' pada file Excel
                </p>
              </div>

              {/* Instruksi Import */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ Penting: Format Import yang Diperlukan
                </h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Kolom wajib: <strong>nim</strong>, <strong>nama</strong>, <strong>kelas_id</strong></p>
                  <p>• Kolom opsional: <strong>no_hp</strong></p>
                  <p>• <strong>kelas_id</strong> harus sesuai dengan ID kelas yang tersedia di atas</p>
                  <p>• Jika NIM sudah ada, data akan diupdate</p>
                  <p>• Jika NIM baru, akun baru akan dibuat otomatis</p>
                </div>
              </div>
              
              <form onSubmit={handleImport}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Excel (.xlsx atau .xls):
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => importForm.setData('file', e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {importForm.errors.file && (
                    <p className="mt-1 text-sm text-red-600">{importForm.errors.file}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={importForm.processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {importForm.processing ? 'Mengimport...' : 'Import'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedPraktikan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Yakin ingin menghapus praktikan <strong>{selectedPraktikan.nama}</strong>?
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteForm.processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteForm.processing ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" />
    </DashboardLayout>
  );
};

export default PraktikanIndex;
