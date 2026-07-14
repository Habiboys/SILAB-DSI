import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ConfirmModal from '../Components/ConfirmModal';
import Modal from '../Components/Modal';
import { usePermission } from '../Components/PermissionContext';
import DashboardLayout from '../Layouts/DashboardLayout';
import { Edit, Trash2 } from "lucide-react";

const TahunKepengurusan = ({ tahunKepengurusan, flash }) => {
  const { can } = usePermission();
  
  
  const canCreate = can('tahun_kepengurusan.create');
  const canUpdate = can('tahun_kepengurusan.update');
  const canDelete = can('tahun_kepengurusan.delete');

  
  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const bulanNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${bulanNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  
  const formatToMonthInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  
  const { delete: destroy } = useForm();
  
  
  const createForm = useForm({
    tahun: '',
    mulai: '',
    selesai: '',
    isactive: false,
  });
  
  
  const editForm = useForm({
    tahun: '',
    mulai: '',
    selesai: '',
    isactive: false,
  });
  
  const openDeleteModal = (id) => {
    if (!canDelete) return;
    setSelectedId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedId(null);
  };
  
  const openCreateModal = () => {
    if (!canCreate) return;
    createForm.reset();
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };
  
  const openEditModal = (item) => {
    if (!canUpdate) return;
    setSelectedItem(item);
    editForm.setData({
      tahun: item.tahun,
      mulai: formatToMonthInput(item.mulai),
      selesai: formatToMonthInput(item.selesai),
      isactive: item.isactive,
    });
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    editForm.reset();
  };

  
  const handleDelete = () => {
    if (!canDelete) return;
    destroy(route('tahun-kepengurusan.destroy', selectedId), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Tahun Kepengurusan berhasil dihapus');
      },
      onError: (errors) => {
        const firstError = Object.values(errors).find(Boolean);
        toast.error(firstError || 'Gagal menghapus data');
      }
    });
  };
  
  const handleCreate = (e) => {
    e.preventDefault();
    if (!canCreate) return;
    createForm.post(route('tahun-kepengurusan.store'), {
      onSuccess: () => {
        closeCreateModal();
        toast.success('Tahun Kepengurusan berhasil ditambahkan');
      },
      onError: (errors) => {
        const firstError = Object.values(errors).find(Boolean);
        toast.error(firstError || 'Gagal menambahkan data');
      }
    });
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    if (!canUpdate) return;
    editForm.put(route('tahun-kepengurusan.update', selectedItem.id), {
      onSuccess: () => {
        closeEditModal();
        toast.success('Tahun Kepengurusan berhasil diperbarui');
      },
      onError: (errors) => {
        const firstError = Object.values(errors).find(Boolean);
        toast.error(firstError || 'Gagal memperbarui data');
      }
    });
  };

  
  useEffect(() => {
    if (flash && flash.message) {
      toast.success(flash.message);
    }
  }, [flash]);

  return (
    <DashboardLayout>
      <Head title="Tahun Kepengurusan" />

      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">Daftar Tahun Kepengurusan</h2>
          {canCreate && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Tambah Baru
          </button>
          )}
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
                {(canUpdate || canDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tahunKepengurusan.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tahun}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatMonthYear(item.mulai)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatMonthYear(item.selesai)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.isactive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isactive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  {(canUpdate || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {canUpdate && (
                    <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors" title="Edit"
                      onClick={() => openEditModal(item)}
                      
                    >
    <Edit className="w-4 h-4" />
</button>
                    )}
                    {canDelete && (
                    <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Hapus"
                      onClick={() => openDeleteModal(item.id)}
                      
                    >
    <Trash2 className="w-4 h-4" />
</button>
                    )}
                  </td>
                  )}
                </tr>
                
              ))}
              
              {tahunKepengurusan.length === 0 && (
                <tr>
                  <td colSpan={(canUpdate || canDelete) ? "6" : "5"} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      <Modal
        show={isCreateModalOpen}
        onClose={closeCreateModal}
        maxWidth="md"
      >
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Tahun Kepengurusan</h3>
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
                  type="month"
                  id="create-mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  type="month"
                  id="create-selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
      </Modal>
      
      
      <Modal
        show={isEditModalOpen && !!selectedItem}
        onClose={closeEditModal}
        maxWidth="md"
      >
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Tahun Kepengurusan</h3>
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
                  type="month"
                  id="edit-mulai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.mulai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  type="month"
                  id="edit-selesai"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.selesai ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
      </Modal>

      
      <ConfirmModal
        show={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus tahun kepengurusan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </DashboardLayout>
  );
};

export default TahunKepengurusan;