import React, { useState, useEffect, Fragment } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const Inventaris = ({ 
  kepengurusanlab, 
  inventaris ,
  filters, 
  flash 
}) => {
  const { selectedLab } = useLab(); 
  
  // State management for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item for edit/delete
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Create form
  const createForm = useForm({
    kepengurusan_lab_id: kepengurusanlab?.id || "",
    nama: "",
    deskripsi: "",
  });

  // Edit form 
  const editForm = useForm({
    id: "",
    kepengurusan_lab_id: "",
    nama: "",
    deskripsi: "",
  });

  // Form untuk delete
  const deleteForm = useForm({});

  // Update data when lab changes
  useEffect(() => {
    console.log('Lab changed: Lab ID:', selectedLab?.id);
    
    if (selectedLab) {
      console.log('Navigating with updated lab filter');
      router.visit("/inventaris", {
        data: {
          lab_id: selectedLab.id,
        },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab]);

  // Flash messages
  useEffect(() => {
    if (flash?.message) {
      toast.success(flash.message);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // CREATE ACTIONS
  const openCreateModal = () => {
    // Reset form and open modal
    createForm.reset();
    createForm.setData({
      kepengurusan_lab_id: kepengurusanlab?.id || "",
      nama: "",
      deskripsi: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    
    createForm.post(route("inventaris.store"), {
      onSuccess: (response) => {
        setIsCreateModalOpen(false);
        createForm.reset();
      },
      onError: (errors) => {
        console.error("Errors:", errors);
      },
      preserveScroll: true,
    });
  };

  // EDIT ACTIONS
  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      id: item.id,
      kepengurusan_lab_id: item.kepengurusan_lab_id,
      nama: item.nama,
      deskripsi: item.deskripsi,
      jumlah: item.jumlah,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    editForm.put(route("inventaris.update", editForm.data.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedItem(null);
      },
      preserveScroll: true,
    });
  };

  // DELETE ACTIONS
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    deleteForm.delete(route("inventaris.destroy", selectedItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
      },
      preserveScroll: true,
    });
  };

  // Function to handle info click
  const handleInfoClick = (item) => {
    router.visit(`/inventaris/${item.id}/detail`);
  };

   
  
  return (
    <DashboardLayout>
      <Head title="Inventaris" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Inventaris
          </h2>
          <div className="flex gap-4 items-center">
            {/* Add Button */}
            <button
              onClick={openCreateModal}
              disabled={!selectedLab?.id}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah
            </button>
          </div>
        </div>

        {!selectedLab?.id && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih laboratorium untuk melihat data inventaris
          </div>
        )}

        {/* Message when no data */}
        {selectedLab?.id && inventaris.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Belum ada data inventaris
          </div>
        )}

        {/* Tabel */}
        {inventaris.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama aset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventaris.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.deskripsi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.jumlah}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors focus:outline-none"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="text-red-600 hover:text-red-900 mr-3 transition-colors focus:outline-none"
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
                      <button
                        onClick={() => handleInfoClick(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none"
                        title="Info"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Inventaris Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-lg font-semibold">Tambah Inventaris</h3>
              <button 
                type="button"
                onClick={() => {
                  console.log('Closing create inventaris modal');
                  setIsCreateModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form 
              onSubmit={handleCreateSubmit} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Inventaris Data */}
              <div className="overflow-y-auto flex-1 px-1">
                <div className="mb-3">
                  <label htmlFor="nama" className="block text-xs font-medium text-gray-700 mb-1">
                    Nama Aset
                  </label>
                  <input
                    type="text"
                    id="nama"
                    value={createForm.data.nama}
                    onChange={(e) => createForm.setData('nama', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                  {createForm.errors.nama && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.nama}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="deskripsi" className="block text-xs font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    id="deskripsi"
                    value={createForm.data.deskripsi}
                    onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows="3"
                  />
                  {createForm.errors.deskripsi && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.deskripsi}</div>
                  )}
                </div>

              </div>
              
              {/* Footer buttons */}
              <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inventaris Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-lg font-semibold">Edit Inventaris</h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form 
              onSubmit={handleEditSubmit} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Inventaris Data */}
              <div className="overflow-y-auto flex-1 px-1">
                <div className="mb-3">
                  <label htmlFor="edit-nama" className="block text-xs font-medium text-gray-700 mb-1">
                    Nama Aset
                  </label>
                  <input
                    type="text"
                    id="edit-nama"
                    value={editForm.data.nama}
                    onChange={(e) => editForm.setData('nama', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                  {editForm.errors.nama && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.nama}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="edit-deskripsi" className="block text-xs font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    id="edit-deskripsi"
                    value={editForm.data.deskripsi}
                    onChange={(e) => editForm.setData('deskripsi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows="3"
                  />
                  {editForm.errors.deskripsi && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.deskripsi}</div>
                  )}
                </div>

                <div className="mb-3">
                <label htmlFor="edit-jumlah" className="block text-xs font-medium text-gray-700 mb-1">
                    Jumlah
                </label>
                <input
                    type="number"
                    id="edit-jumlah"
                    value={editForm.data.jumlah}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-100 text-gray-700 text-sm cursor-not-allowed"
                    disabled
                />
                <p className="text-xs text-gray-500 mt-1">Jumlah akan otomatis terhitung dari detail aset</p>
                </div>
              </div>
              
              {/* Footer buttons */}
              <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {editForm.processing ? 'Menyimpan...' : 'Simpan'}
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
                    Apakah Anda yakin ingin menghapus data aset "{selectedItem.nama}" ? Semua detail aset terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
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

export default Inventaris;