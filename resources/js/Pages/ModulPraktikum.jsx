import React, { useState, useEffect } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react"; // Add usePage
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const ModulPraktikum = ({ 
  praktikum, 
  modulPraktikum, 
  filters, 
  flash 
}) => {
  const { auth } = usePage().props; // Add this to get auth data
  
  // Add isAdmin check - only admin and superadmin can access actions
  const isAdmin = auth.user && auth.user.roles.some(role => ['admin', 'superadmin'].includes(role));
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Create form 
  const createForm = useForm({
    praktikum_id: praktikum?.id,
    pertemuan: '',
    judul: '',
    modul: null,
    is_public: false
  });
  
  // Edit form 
  const editForm = useForm({
    pertemuan: '',
    judul: '',
    modul: null,
    is_public: false,
    _method: 'PUT'
  });
  
  const deleteForm = useForm({});

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
  
  // Handle create form submission
  const handleCreate = (e) => {
    e.preventDefault();
    
    createForm.post(route('praktikum.modul.store', { praktikum: praktikum.id }), {
      preserveScroll: true,
      onSuccess: () => {
        closeCreateModal();
        toast.success('Modul praktikum berhasil ditambahkan');
      },
      onError: () => {
        toast.error('Gagal menambahkan modul praktikum');
      }
    });
  };
  
  // Open edit modal
  const openEditModal = (modul) => {
    setSelectedItem(modul);
    editForm.setData({
      praktikum_id: modul.praktikum_id,
      pertemuan: modul.pertemuan,
      judul: modul.judul,
      modul: null,
      is_public: modul.is_public || false,
      _method: 'PUT'
    });
    setIsEditModalOpen(true);
  };
  
  // Close edit modal
  const closeEditModal = () => {
    setSelectedItem(null);
    editForm.reset();
    setIsEditModalOpen(false);
  };
  
  // Handle edit form submission
  const handleUpdate = (e) => {
    e.preventDefault();
    
    // For debugging
    console.log("Updating module:", selectedItem.id, "in praktikum:", selectedItem.praktikum_id);
    
    editForm.post(route('praktikum.modul.update', {
      praktikum: selectedItem.praktikum_id,
      modul: selectedItem.id
    }), {
      preserveScroll: true,
      onSuccess: () => {
        closeEditModal();
        toast.success('Modul praktikum berhasil diperbarui');
      },
      onError: (errors) => {
        console.error("Update errors:", errors);
        toast.error('Gagal memperbarui modul praktikum');
      }
    });
  };
  
  // Open delete modal
  const openDeleteModal = (item) => {
    if (!isAdmin) return;
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    deleteForm.delete(route('praktikum.modul.destroy', {
      praktikum: selectedItem.praktikum_id,
      modul: selectedItem.id
    }), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        toast.success('Modul praktikum berhasil dihapus');
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.error('Gagal menghapus modul praktikum');
      },
    });
  };
  
  //Handle view modul
  const viewModul = (modulId, modulFilename) => {
    // Check if modulFilename is defined before trying to split it
    if (!modulFilename) {
      console.error("Module filename is undefined");
      // Open the module view without filename parameter
      window.open(route('praktikum.modul.view', {
        praktikum: praktikum.id,
        modul: modulId
      }), '_blank');
      return;
    }
    
    // Extract just the filename from the path
    const filename = modulFilename.split('/').pop();
    
    window.open(route('praktikum.modul.view', {
      praktikum: praktikum.id,
      modul: modulId,
      filename: filename
    }), '_blank');
  };

  // Toggle share link
  const toggleShareLink = (modul) => {
    router.post(route('praktikum.modul.toggle-share', {
      praktikum: praktikum.id,
      modul: modul.id
    }), {}, {
      onSuccess: () => {
        // Update local state instead of reloading
        const updatedModulPraktikum = modulPraktikum.map(m => {
          if (m.id === modul.id) {
            return {
              ...m,
              is_public: !m.is_public,
              hash: !m.is_public ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : null
            };
          }
          return m;
        });
        // Force re-render by updating the page props
        router.reload();
        
        // Show success message
        const message = !modul.is_public ? 'Link berhasil dibuka' : 'Link berhasil ditutup';
        toast.success(message);
      },
      onError: () => {
        toast.error('Gagal mengubah status share link');
      }
    });
  };

    // Copy share link
  const copyShareLink = async (modul) => {
    if (!modul.hash) {
      toast.error('Hash tidak tersedia, silakan refresh halaman');
      return;
    }
    
    const shareUrl = route('modul.public.view', {
      hash: modul.hash
    });
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link berhasil disalin ke clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link berhasil disalin ke clipboard!');
    }
  };

  useEffect(() => {
    if (flash && flash.message) {
      toast.success(flash.message);
    }
    if (flash && flash.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  return (
    <DashboardLayout>
      <Head title="Modul Praktikum" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          {/* Title Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Modul Praktikum</h2>
            <h3 className="text-md text-gray-600">Mata Kuliah: {praktikum?.mata_kuliah}</h3>
          </div>
        </div>
  
        <div className="flex gap-4 items-center">
          {/* Add Button */}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah
            </button>
          )}
      
        </div>

      </div>

        {/* Table Display */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pertemuan ke-
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Modul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share Link
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modulPraktikum && modulPraktikum.length > 0 ? (
                modulPraktikum.map((modul) => (
                  <tr key={modul.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {modul.pertemuan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {modul.judul}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => {
                          console.log("Modul object:", modul);
                          viewModul(modul.id, modul.modul);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Lihat Modul
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {modul.is_public ? (
                          <>
                            <button
                              onClick={() => toggleShareLink(modul)}
                              className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                              title="Klik untuk menutup link"
                            >
                              Tutup Link
                            </button>
                            <button
                              onClick={() => copyShareLink(modul)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                              title="Copy link ke clipboard"
                            >
                              Copy Link
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => toggleShareLink(modul)}
                            className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
                            title="Klik untuk membuka link"
                          >
                            Buka Link
                          </button>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openEditModal(modul)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors focus:outline-none"
                            title="Edit"
                          >
                           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(modul)}
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
                ))
              ) : (
                <tr>
                                  <td colSpan={isAdmin ? "5" : "4"} className="px-6 py-4 text-center text-sm text-gray-500">
                  Belum ada data modul praktikum
                </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Total Modul: {modulPraktikum?.length || 0}
              </div>
              <div className="text-gray-500">
                {praktikum?.mata_kuliah} - Semester {praktikum?.semester}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Tambah Modul */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Modul Praktikum</h3>
              <button 
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate} encType="multipart/form-data">
              <div className="mb-4">
                <label htmlFor="pertemuan" className="block text-sm font-medium text-gray-700 mb-1">
                  Pertemuan ke-
                </label>
                <input
                  type="number"
                  id="pertemuan"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.pertemuan ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.pertemuan}
                  onChange={(e) => createForm.setData('pertemuan', e.target.value)}
                  required
                />
                {createForm.errors.pertemuan && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.pertemuan}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  id="judul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.judul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.judul}
                  onChange={(e) => createForm.setData('judul', e.target.value)}
                  required
                />
                {createForm.errors.judul && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.judul}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="modul" className="block text-sm font-medium text-gray-700 mb-1">
                  File Modul (PDF Only) *
                </label>
                <input
                  type="file"
                  id="modul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.modul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => createForm.setData('modul', e.target.files[0])}
                  accept=".pdf"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Hanya file PDF yang diterima. Maksimal ukuran 10MB.
                </p>
                {createForm.errors.modul && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.modul}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.data.is_public}
                    onChange={(e) => createForm.setData('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Buat link publik (bisa diakses tanpa login)</span>
                </label>
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

      {/* Modal Edit Modul */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Modul Praktikum</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdate} encType="multipart/form-data">
              <div className="mb-4">
                <label htmlFor="edit-pertemuan" className="block text-sm font-medium text-gray-700 mb-1">
                  Pertemuan ke-
                </label>
                <input
                  type="number"
                  id="edit-pertemuan"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.pertemuan ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.pertemuan}
                  onChange={(e) => editForm.setData('pertemuan', e.target.value)}
                  required
                />
                {editForm.errors.pertemuan && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.pertemuan}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-judul" className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  id="edit-judul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.judul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.judul}
                  onChange={(e) => editForm.setData('judul', e.target.value)}
                  required
                />
                {editForm.errors.judul && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.judul}</p>
                )}
              </div>
              

              
              <div className="mb-4">
                <label htmlFor="edit-modul" className="block text-sm font-medium text-gray-700 mb-1">
                  File Modul (PDF Only - Opsional)
                </label>
                <input
                  type="file"
                  id="edit-modul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.modul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => editForm.setData('modul', e.target.files[0])}
                  accept=".pdf"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Biarkan kosong jika tidak ingin mengubah file. Hanya file PDF yang diterima. Maksimal ukuran 10MB.
                </p>
                {editForm.errors.modul && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.modul}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.data.is_public}
                    onChange={(e) => editForm.setData('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Buat link publik (bisa diakses tanpa login)</span>
                </label>
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
                  disabled={editForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {editForm.processing ? 'Memperbarui...' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              <button onClick={() => setIsDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Apakah Anda yakin ingin menghapus modul praktikum pertemuan ke-{selectedItem.pertemuan} "{selectedItem.judul}"? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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

export default ModulPraktikum;