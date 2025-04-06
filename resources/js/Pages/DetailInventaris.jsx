import { Head, useForm, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DetailInventaris({ aset, flash = {} }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

        {/* Message when no data */}
        {aset.detail_aset.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Belum ada detail inventaris
          </div>
        )}

        {/* Table */}
        {aset.detail_aset.length > 0 && (
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
                {aset.detail_aset.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.kode_barang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.keadaan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
