import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Laboratorium = ({ laboratorium, flash }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form untuk edit
  const editForm = useForm({
    nama: '',
    logo: null,
  });
  
  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      nama: item.nama,
      logo: null,
    });
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    editForm.reset();
  };

  const handleEdit = (e) => {
    e.preventDefault();
    
    // Debug: log form data
    console.log('Form data:', editForm.data);
    console.log('Selected item:', selectedItem);
    
    // Use Inertia's built-in file handling
    editForm.post(route('laboratorium.update', selectedItem.id), {
      onSuccess: (page) => {
        console.log('Success response:', page);
        closeEditModal();
        toast.success('Data Laboratorium berhasil diperbarui');
      },
      onError: (errors) => {
        console.log('Validation errors:', errors);
        if (errors.logo) {
          toast.error(errors.logo);
        } else {
          toast.error('Gagal memperbarui data');
        }
      }
    });
  };

  // Flash message handler
  React.useEffect(() => {
    if (flash && flash.message) {
      toast.success(flash.message);
    }
  }, [flash]);

  return (
    <DashboardLayout>
      <Head title="Data Laboratorium" />
      <ToastContainer />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">Data Laboratorium</h2>
          <p className="text-sm text-gray-600">Hanya dapat mengedit data yang ada</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Laboratorium</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {laboratorium.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.logo ? (
                      <img src={`/storage/${item.logo}`} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-gray-400">Tidak ada logo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Laboratorium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              
              {laboratorium.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data laboratorium
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Laboratorium</h3>
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
                  Nama Laboratorium
                </label>
                <input
                  type="text"
                  id="edit-nama"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.nama ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.nama}
                  onChange={(e) => editForm.setData('nama', e.target.value)}
                  required
                />
                {editForm.errors.nama && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.nama}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-logo" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo (Opsional)
                </label>
                <input
                  type="file"
                  id="edit-logo"
                  accept="image/*"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.logo ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => editForm.setData('logo', e.target.files[0])}
                />
                {editForm.errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.logo}</p>
                )}
                {selectedItem && selectedItem.logo && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Logo saat ini:</p>
                    <img src={`/storage/${selectedItem.logo}`} alt="Current Logo" className="h-12 w-12 object-contain border rounded" />
                  </div>
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
    </DashboardLayout>
  );
};

export default Laboratorium; 