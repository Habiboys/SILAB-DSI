import { Head, useForm, Link, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { debounce } from "lodash";

export default function DetailInventaris({ aset, detailAsets, filters = {}, flash = {} }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // State untuk pencarian dan pagination
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);

  // Menampilkan pesan flash
  useEffect(() => {
    if (flash?.message) {
      toast.success(flash.message);
    }
    if (flash?.error) {
      toast.error(flash.error); 
    }
  }, [flash]);

  const createForm = useForm({
    aset_id: aset.id,
    kode_barang: "",
    keadaan: "",
    status: "",
  });

  const editForm = useForm({
    kode_barang: "",
    keadaan: "", 
    status: "",
  });

  const deleteForm = useForm({});

  // Debounced search handler
  const handleSearch = debounce((value) => {
    router.visit(`/inventaris/${aset.id}/detail`, {
      data: { 
        search: value,
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
    router.visit(`/inventaris/${aset.id}/detail`, {
      data: { 
        search: searchTerm,
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
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createForm.post(route("detail-inventaris.store"), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createForm.reset();
        toast.success("Detail inventaris berhasil ditambahkan");
      },
      onError: (errors) => {
        toast.error("Gagal menambahkan detail inventaris");
        console.error("Errors:", errors);
      },
      preserveScroll: true,
    });
  };

  // EDIT ACTIONS  
  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      kode_barang: item.kode_barang,
      keadaan: item.keadaan,
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editForm.put(route("detail-inventaris.update", selectedItem.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedItem(null);
        toast.success("Detail inventaris berhasil diperbarui");
      },
      onError: () => {
        toast.error("Gagal memperbarui detail inventaris");
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
    deleteForm.delete(route("detail-inventaris.destroy", selectedItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        toast.success("Detail inventaris berhasil dihapus");
      },
      onError: () => {
        toast.error("Gagal menghapus detail inventaris");
      },
      preserveScroll: true,
    });
  };

  return (
    <DashboardLayout>
    
      <Head title="Detail Inventaris" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b">
          <div className="flex items-center gap-4">
            <Link
              href={route('inventaris.index')}
              className="text-gray-700 hover:text-gray-900"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            </Link>
            <h2 className="text-xl font-semibold text-gray-800">
              Detail Inventaris - {aset.nama}
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tambah Detail
            </button>
          </div>
        </div>

        {/* Search dan Per Page */}
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
                placeholder="Cari detail inventaris..."
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

        {/* Message when no data */}
        {detailAsets.data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : "Belum ada detail inventaris"}
          </div>
        )}

        {/* Table */}
        {detailAsets.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Barang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keadaan
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
                {detailAsets.data.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {detailAsets.from + index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.kode_barang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.keadaan === 'baik' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.keadaan === 'baik' ? 'Baik' : 'Rusak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'tersedia' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'tersedia' ? 'Tersedia' : 'Dipinjam'}
                      </span>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {detailAsets.data.length > 0 && (
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-700">
              Menampilkan {detailAsets.from} sampai {detailAsets.to} dari {detailAsets.total} data
            </div>
            
            <div className="flex items-center space-x-2">
              {detailAsets.links.map((link, i) => (
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tambah Detail Inventaris
              </h3>
              <form onSubmit={handleCreateSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={createForm.data.kode_barang}
                    onChange={(e) =>
                      createForm.setData("kode_barang", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {createForm.errors.kode_barang && (
                    <div className="text-red-500 text-sm mt-1">{createForm.errors.kode_barang}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Keadaan
                  </label>
                  <select
                    value={createForm.data.keadaan}
                    onChange={(e) =>
                      createForm.setData("keadaan", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Pilih Keadaan</option>
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                  </select>
                  {createForm.errors.keadaan && (
                    <div className="text-red-500 text-sm mt-1">{createForm.errors.keadaan}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={createForm.data.status}
                    onChange={(e) =>
                      createForm.setData("status", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Pilih Status</option>
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                  </select>
                  {createForm.errors.status && (
                    <div className="text-red-500 text-sm mt-1">{createForm.errors.status}</div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Detail Inventaris
              </h3>
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={editForm.data.kode_barang}
                    onChange={(e) =>
                      editForm.setData("kode_barang", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {editForm.errors.kode_barang && (
                    <div className="text-red-500 text-sm mt-1">{editForm.errors.kode_barang}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Keadaan
                  </label>
                  <select
                    value={editForm.data.keadaan}
                    onChange={(e) =>
                      editForm.setData("keadaan", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Pilih Keadaan</option>
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                  </select>
                  {editForm.errors.keadaan && (
                    <div className="text-red-500 text-sm mt-1">{editForm.errors.keadaan}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={editForm.data.status}
                    onChange={(e) =>
                      editForm.setData("status", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Pilih Status</option>
                    <option value="tersedia">Tersedia</option>
                    <option value="dipinjam">Dipinjam</option>
                  </select>
                  {editForm.errors.status && (
                    <div className="text-red-500 text-sm mt-1">{editForm.errors.status}</div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-700 mb-4">
                Apakah Anda yakin ingin menghapus detail inventaris ini?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
