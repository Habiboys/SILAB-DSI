import React, { useState } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TugasPraktikumIndex = ({ 
  praktikum, 
  tugas, // all tugas for backward compatibility
  tugasByKelas,
  tugasUmum,
  kelas,
  lab 
}) => {
  const { auth } = usePage().props;
  
  // Role-based access control
  const isAdmin = auth.user && auth.user.roles.some(role => ['admin', 'superadmin'].includes(role));
  
  const [activeTab, setActiveTab] = useState('umum');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);

  // Create form
  const createForm = useForm({
    judul_tugas: '',
    deskripsi: '',
    file_tugas: null,
    deadline: '',
    kelas_id: '',
  });

  // Edit form
  const editForm = useForm({
    judul_tugas: '',
    deskripsi: '',
    file_tugas: null,
    deadline: '',
    kelas_id: '',
    status: 'aktif',
    _method: 'PUT'
  });

  // Delete form
  const deleteForm = useForm({});

  // Get current tugas data based on active tab
  const getCurrentTugasData = () => {
    if (activeTab === 'umum') {
      return tugasUmum || [];
    } else if (activeTab === 'all') {
      return tugas || [];
    } else {
      // Specific kelas tab
      return tugasByKelas?.[activeTab] || [];
    }
  };

  // Get tab count
  const getTabCount = (tabType, kelasId = null) => {
    if (tabType === 'umum') {
      return tugasUmum?.length || 0;
    } else if (tabType === 'all') {
      return tugas?.length || 0;
    } else {
      return tugasByKelas?.[kelasId]?.length || 0;
    }
  };

  // Open create modal
  const openCreateModal = () => {
    if (!isAdmin) return;
    createForm.reset();
    setIsCreateModalOpen(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    createForm.reset();
    setIsCreateModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (tugas) => {
    if (!isAdmin) return;
    setSelectedTugas(tugas);
    editForm.setData({
      judul_tugas: tugas.judul_tugas,
      deskripsi: tugas.deskripsi || '',
      file_tugas: null,
      deadline: tugas.deadline,
      kelas_id: tugas.kelas_id || '',
      status: tugas.status,
      _method: 'PUT'
    });
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    editForm.reset();
    setSelectedTugas(null);
    setIsEditModalOpen(false);
  };

  // Handle create form submission
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route('praktikum.tugas.store', { praktikum: praktikum.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Tugas praktikum berhasil ditambahkan');
        closeCreateModal();
      },
      onError: (errors) => {
        console.error(errors);
        toast.error('Gagal menambahkan tugas praktikum');
      }
    });
  };

  // Handle edit form submission
  const handleEdit = (e) => {
    e.preventDefault();
    editForm.post(route('praktikum.tugas.update', { tugas: selectedTugas.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Tugas praktikum berhasil diperbarui');
        closeEditModal();
      },
      onError: (errors) => {
        console.error(errors);
        toast.error('Gagal memperbarui tugas praktikum');
      }
    });
  };

  // Handle delete
  const handleDelete = (tugas) => {
    setSelectedTugas(tugas);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteForm.delete(route('praktikum.tugas.destroy', { tugas: selectedTugas.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Tugas praktikum berhasil dihapus');
        setIsDeleteModalOpen(false);
        setSelectedTugas(null);
      },
      onError: () => {
        toast.error('Gagal menghapus tugas praktikum');
      }
    });
  };

  // Download file
  const downloadFile = (tugas) => {
    window.open(route('praktikum.tugas.download', { tugas: tugas.id }), '_blank');
  };

  // View submissions
  const viewSubmissions = (tugas) => {
    router.get(route('praktikum.tugas.submissions', { tugas: tugas.id }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <Head title="Kelola Tugas Praktikum" />
      
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
              <h2 className="text-xl font-semibold text-gray-800">Kelola Tugas Praktikum</h2>
              <h3 className="text-md text-gray-600">Mata Kuliah: {praktikum?.mata_kuliah}</h3>
              <p className="text-sm text-gray-500">Lab: {lab?.nama_lab}</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex space-x-3">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Tambah Tugas
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {/* Tugas Umum Tab */}
            <button
              onClick={() => setActiveTab('umum')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'umum'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tugas Umum ({getTabCount('umum')})
            </button>

            {/* All Tab */}
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Semua Tugas ({getTabCount('all')})
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
                  Judul Tugas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  File
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
              {getCurrentTugasData().map((tugasItem, index) => (
                <tr key={tugasItem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium border-r border-gray-200">
                    {tugasItem.judul_tugas}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200 max-w-xs">
                    <div className="truncate">
                      {tugasItem.deskripsi || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {tugasItem.kelas ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {tugasItem.kelas.nama_kelas}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Semua Kelas
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {formatDate(tugasItem.deadline)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {tugasItem.file_tugas ? (
                      <button
                        onClick={() => downloadFile(tugasItem)}
                        className="text-blue-600 hover:text-blue-900 underline"
                      >
                        Download
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tugasItem.status === 'aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tugasItem.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => viewSubmissions(tugasItem)}
                          className="text-green-600 hover:text-green-900 transition-colors focus:outline-none"
                          title="Lihat Pengumpulan"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(tugasItem)}
                          className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none"
                          title="Edit"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(tugasItem)}
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
              {getCurrentTugasData().length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Tidak ada data tugas praktikum
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tambah Tugas Praktikum
              </h3>
              
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Tugas:
                  </label>
                  <input
                    type="text"
                    value={createForm.data.judul_tugas}
                    onChange={(e) => createForm.setData('judul_tugas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {createForm.errors.judul_tugas && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.judul_tugas}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Kelas:
                  </label>
                  <select
                    value={createForm.data.kelas_id}
                    onChange={(e) => createForm.setData('kelas_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Semua Kelas</option>
                    {kelas?.map((kelasItem) => (
                      <option key={kelasItem.id} value={kelasItem.id}>
                        Kelas {kelasItem.nama_kelas}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.kelas_id && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.kelas_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi (Opsional):
                  </label>
                  <textarea
                    value={createForm.data.deskripsi}
                    onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {createForm.errors.deskripsi && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.deskripsi}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Tugas (Opsional):
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => createForm.setData('file_tugas', e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {createForm.errors.file_tugas && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.file_tugas}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline:
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.data.deadline}
                    onChange={(e) => createForm.setData('deadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {createForm.errors.deadline && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.deadline}</p>
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

      {/* Edit Modal */}
      {isEditModalOpen && selectedTugas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Tugas Praktikum
              </h3>
              
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Tugas:
                  </label>
                  <input
                    type="text"
                    value={editForm.data.judul_tugas}
                    onChange={(e) => editForm.setData('judul_tugas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {editForm.errors.judul_tugas && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.judul_tugas}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Kelas:
                  </label>
                  <select
                    value={editForm.data.kelas_id}
                    onChange={(e) => editForm.setData('kelas_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Semua Kelas</option>
                    {kelas?.map((kelasItem) => (
                      <option key={kelasItem.id} value={kelasItem.id}>
                        Kelas {kelasItem.nama_kelas}
                      </option>
                    ))}
                  </select>
                  {editForm.errors.kelas_id && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.kelas_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi (Opsional):
                  </label>
                  <textarea
                    value={editForm.data.deskripsi}
                    onChange={(e) => editForm.setData('deskripsi', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {editForm.errors.deskripsi && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.deskripsi}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Tugas (Opsional):
                  </label>
                  {selectedTugas.file_tugas && (
                    <p className="text-sm text-gray-600 mb-2">
                      File saat ini: <span className="font-medium">Ada file</span>
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => editForm.setData('file_tugas', e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {editForm.errors.file_tugas && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.file_tugas}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline:
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.data.deadline}
                    onChange={(e) => editForm.setData('deadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {editForm.errors.deadline && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.deadline}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status:
                  </label>
                  <select
                    value={editForm.data.status}
                    onChange={(e) => editForm.setData('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  {editForm.errors.status && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.status}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.processing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {editForm.processing ? 'Menyimpan...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedTugas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Yakin ingin menghapus tugas <strong>{selectedTugas.judul_tugas}</strong>?
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

export default TugasPraktikumIndex;
