import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '../Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TahunKepengurusan = ({ tahunKepengurusan, flash }) => {
  // State untuk modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form untuk delete
  const { delete: destroy } = useForm();
  
  // Form untuk create
  const createForm = useForm({
    tahun: '',
    mulai: '',
    selesai: '',
    isactive: false,
  });
  
  // Form untuk edit
  const editForm = useForm({
    tahun: '',
    mulai: '',
    selesai: '',
    isactive: false,
  });
  
  // Modal handlers
  const openDeleteModal = (id) => {
    setSelectedId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedId(null);
  };
  
  const openCreateModal = () => {
    createForm.reset();
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };
  
  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      tahun: item.tahun,
      mulai: item.mulai,
      selesai: item.selesai,
      isactive: item.isactive,
    });
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    editForm.reset();
  };

  // Handle submissions
  const handleDelete = () => {
    destroy(route('tahun-kepengurusan.destroy', selectedId), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Tahun Kepengurusan berhasil dihapus');
      },
      onError: () => {
        toast.error('Gagal menghapus data');
      }
    });
  };
  
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route('tahun-kepengurusan.store'), {
      onSuccess: () => {
        closeCreateModal();
        toast.success('Tahun Kepengurusan berhasil ditambahkan');
      },
      onError: () => {
        toast.error('Gagal menambahkan data');
      }
    });
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    editForm.put(route('tahun-kepengurusan.update', selectedItem.id), {
      onSuccess: () => {
        closeEditModal();
        toast.success('Tahun Kepengurusan berhasil diperbarui');
      },
      onError: () => {
        toast.error('Gagal memperbarui data');
      }
    });
  };

  // Flash message handler
  useEffect(() => {
    if (flash && flash.message) {
      toast.success(flash.message);
    }
  }, [flash]);

  return (
    <DashboardLayout>
      <Head title="Tahun Kepengurusan" />
      <ToastContainer />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">Daftar Tahun Kepengurusan</h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Tambah Baru
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tahunKepengurusan.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tahun}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.mulai}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.selesai}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.isactive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isactive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
</svg>

                    </button>
                    <button
                      onClick={() => openDeleteModal(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>

                  
                    </button>
                  </td>
                </tr>
                
              ))}
              
              {tahunKepengurusan.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Tahun Kepengurusan</h3>
              <button 
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="create-tahun" className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun
                </label>
                <input
                  type="text"
                  id="create-tahun"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.tahun ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.tahun}
                  onChange={(e) => createForm.setData('tahun', e.target.value)}
                />
                {createForm.errors.tahun && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.tahun}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="create-mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Mulai
                </label>
                <input
                  type="text"
                  id="create-mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Contoh: Januari"
                  value={createForm.data.mulai}
                  onChange={(e) => createForm.setData('mulai', e.target.value)}
                />
                {createForm.errors.mulai && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.mulai}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="create-selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Selesai
                </label>
                <input
                  type="text"
                  id="create-selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Contoh: Desember"
                  value={createForm.data.selesai}
                  onChange={(e) => createForm.setData('selesai', e.target.value)}
                />
                {createForm.errors.selesai && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.selesai}</p>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="create-isactive"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={createForm.data.isactive}
                    onChange={(e) => createForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="create-isactive" className="ml-2 block text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
                {createForm.errors.isactive && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.isactive}</p>
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
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Tahun Kepengurusan</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label htmlFor="edit-tahun" className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun
                </label>
                <input
                  type="text"
                  id="edit-tahun"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.tahun ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.tahun}
                  onChange={(e) => editForm.setData('tahun', e.target.value)}
                />
                {editForm.errors.tahun && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.tahun}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Mulai
                </label>
                <input
                  type="text"
                  id="edit-mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Contoh: Januari"
                  value={editForm.data.mulai}
                  onChange={(e) => editForm.setData('mulai', e.target.value)}
                />
                {editForm.errors.mulai && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.mulai}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Selesai
                </label>
                <input
                  type="text"
                  id="edit-selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Contoh: Desember"
                  value={editForm.data.selesai}
                  onChange={(e) => editForm.setData('selesai', e.target.value)}
                />
                {editForm.errors.selesai && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.selesai}</p>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-isactive"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={editForm.data.isactive}
                    onChange={(e) => editForm.setData('isactive', e.target.checked)}
                  />
                  <label htmlFor="edit-isactive" className="ml-2 block text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
                {editForm.errors.isactive && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.isactive}</p>
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
                  {editForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus tahun kepengurusan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
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

export default TahunKepengurusan;