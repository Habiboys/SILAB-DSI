import React, { useState, useEffect, Fragment } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";
import { debounce } from "lodash";

const Inventaris = ({ 
  kepengurusanlab, 
  inventaris,
  filters, 
  flash 
}) => {
  const { auth, laboratorium } = usePage().props;
  const { selectedLab, setSelectedLab } = useLab(); 
  
  // Add isAdmin check
  const isAdmin = auth.user && !auth.user.roles.some(role => ['asisten', 'dosen', 'kadep'].includes(role));

  // State untuk pencarian dan pagination
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  
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
          search: searchTerm,
          perPage: perPage
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

  // Debounced search handler
  const handleSearch = debounce((value) => {
    router.visit('/inventaris', {
      data: { 
        search: value,
        lab_id: selectedLab?.id,
        perPage: perPage
      },
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  }, 300);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Handle per page change
  const handlePerPageChange = (e) => {
    const value = e.target.value;
    setPerPage(value);
    router.visit('/inventaris', {
      data: { 
        search: searchTerm,
        lab_id: selectedLab?.id,
        perPage: value
      },
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

  // Pagination handler
  const handlePageChange = (page) => {
    router.visit(page, {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

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

  useEffect(() => {
    if (auth?.user) {
        const hasAdminRole = auth.user.roles?.some(role => 
            ['superadmin', 'kadep'].includes(role)
        );

        if (!hasAdminRole) {
            const userLab = laboratorium?.find(lab => 
                lab.id === auth.user.laboratory_id
            );
            if (userLab) {
                setSelectedLab(userLab);
            }
        }
    }
  }, [auth?.user?.laboratory_id, laboratorium]);

   
  
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
            {/* Only show Add button for admin users */}
            {isAdmin && (
              <button
                onClick={openCreateModal}
                disabled={!selectedLab?.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah
              </button>
            )}
          </div>
        </div>

        {!selectedLab?.id && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih laboratorium untuk melihat data inventaris
          </div>
        )}

        {selectedLab?.id && (
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Cari inventaris..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <label htmlFor="perPage" className="text-sm text-gray-600">Tampilkan:</label>
                <select
                  id="perPage"
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 min-w-[70px] text-left"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Message when no data */}
        {selectedLab?.id && inventaris.data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : "Belum ada data inventaris"}
          </div>
        )}

        {/* Tabel */}
        {inventaris.data && inventaris.data.length > 0 && (
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
                {inventaris.data.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inventaris.from + index}
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
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors focus:outline-none"
                            title="Edit"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-900 mr-3 transition-colors focus:outline-none"
                            title="Hapus"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => handleInfoClick(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors focus:outline-none"
                        title="Info"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {inventaris.data && inventaris.data.length > 0 && (
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-700">
              Menampilkan {inventaris.from} sampai {inventaris.to} dari {inventaris.total} data
            </div>
            
            <div className="flex items-center space-x-2">
              {inventaris.links.map((link, i) => (
                <button 
                  key={i}
                  onClick={() => link.url && handlePageChange(link.url)}
                  className={`px-4 py-2 rounded-md text-sm ${
                    link.active 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!link.url}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
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