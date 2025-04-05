import React, { useState , useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Create form 
  const createForm = useForm({
    praktikum_id: praktikum?.id,
    pertemuan: '',
    judul: '',
    modul: null
  });
  
  // Edit form 
  const editForm = useForm({
    pertemuan: '',
    judul: '',
    modul: null,
    _method: 'PUT'
  });
  
  const deleteForm = useForm({});

  // Open create modal
  const openCreateModal = () => {
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
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tambah
          </button>
        </div>

      </div>

        {/* Table Display */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Pertemuan ke-
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Judul 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  File Modul
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modulPraktikum && modulPraktikum.length > 0 ? (
                modulPraktikum.map((modul) => (
                  <tr key={modul.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {modul.pertemuan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {modul.judul}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <button
                      onClick={() => {
                        console.log("Modul object:", modul);
                        viewModul(modul.id, modul.modul);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Lihat Modul
                    </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(modul)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(modul)}
                          className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                          title="Hapus"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Belum ada data modul praktikum
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  File Modul (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  id="modul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.modul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => createForm.setData('modul', e.target.files[0])}
                  accept=".pdf,.doc,.docx"
                  required
                />
                {createForm.errors.modul && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.modul}</p>
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
                  File Modul (Opsional)
                </label>
                <input
                  type="file"
                  id="edit-modul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.modul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => editForm.setData('modul', e.target.files[0])}
                  accept=".pdf,.doc,.docx"
                />
                <p className="mt-1 text-sm text-gray-500">Biarkan kosong jika tidak ingin mengubah file</p>
                {editForm.errors.modul && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.modul}</p>
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