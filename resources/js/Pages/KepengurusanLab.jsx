import React, { useState, useEffect } from 'react';
  import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
  import DashboardLayout from '../Layouts/DashboardLayout';
  import { toast, ToastContainer } from 'react-toastify';
  import { useLab } from "../Components/LabContext"; 
  import 'react-toastify/dist/ReactToastify.css';

  const KepengurusanLab = ({ kepengurusanLab, tahunKepengurusan, flash }) => {
    const { selectedLab } = useLab();
    const { auth } = usePage().props;
  
    // Add function to check if user can manage kepengurusan
    const canManageKepengurusan = () => {
      return auth?.user?.roles?.some(role => ['admin', 'kalab'].includes(role));
    };
  
    // State untuk modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form untuk create
    const createForm = useForm({
      tahun_kepengurusan_id: '',
      laboratorium_id: selectedLab ? selectedLab.id : null,
      sk: null,
    });
    
    // Form untuk edit - perbaikan di sini
    const editForm = useForm({
      sk: null,
      _method: 'PUT', // Menambahkan method spoofing
    });
    
    const openCreateModal = () => {
      createForm.reset();
      createForm.setData('laboratorium_id', selectedLab ? selectedLab.id : null);
      setIsCreateModalOpen(true);
    };
    
    const closeCreateModal = () => {
      setIsCreateModalOpen(false);
      createForm.reset();
    };
    
    const openEditModal = (item) => {
      setSelectedItem(item);
      editForm.reset();
      editForm.setData({
        sk: null,
        _method: 'PUT',
      });
      setIsEditModalOpen(true);
    };
    
    const closeEditModal = () => {
      setIsEditModalOpen(false);
      setSelectedItem(null);
      editForm.reset();
    };
    
    const handleCreate = (e) => {
      e.preventDefault();
      createForm.post(route('kepengurusan-lab.store'), {
        // preserveState: false,
        onSuccess: () => {
          closeCreateModal();
          toast.success('Kepengurusan Lab berhasil ditambahkan');
          
          // router.reload();
        },
        onError: (errors) => {
          console.log('Form errors:', errors);
          
          if (errors.duplicate) {
            toast.error(errors.duplicate);
          } else if (errors.laboratorium_id) {
            toast.error(errors.laboratorium_id);
          } else if (errors.tahun_kepengurusan_id) {
            toast.error(errors.tahun_kepengurusan_id);
          } else if (errors.sk) {
            toast.error(errors.sk);
          } else if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Gagal menambahkan data');
          }
        },
        forceFormData: true,
      });
    };
    
    const handleEdit = (e) => {
      e.preventDefault();
      
      // Perbaikan logic upload file
      if (!editForm.data.sk) {
        toast.warning('Tidak ada file yang dipilih');
        return;
      }
      
      // Menggunakan post dengan method spoofing sebagai ganti put
      editForm.post(route('kepengurusan-lab.update', selectedItem.id), {
        onSuccess: () => {
          closeEditModal();
          toast.success('SK Kepengurusan Lab berhasil diperbarui');
        },
        onError: (errors) => {
          console.log('Upload errors:', errors);
          if (errors.sk) {
            toast.error(errors.sk);
          } else {
            toast.error('Gagal memperbarui data');
          }
        },
        forceFormData: true, // Memastikan dikirim sebagai multipart/form-data
      });
    };

    // Flash message handler
    useEffect(() => {
      if (flash && flash.message) {
        toast.success(flash.message);
      }
      if (flash && flash.error) {
        toast.error(flash.error);
      }
    }, [flash]);

    useEffect(() => {
        if (selectedLab) {
          // Gunakan method visit yang lebih tepat
          router.visit("kepengurusan-lab", {
            data: { lab_id: selectedLab.id },
            preserveState: true, // Pertahankan state komponen
            preserveScroll: true, // Pertahankan posisi scroll
            replace: true, // Hindari menambah riwayat browser
          });
        }
      }, [selectedLab]);

    return (
      <DashboardLayout>
        <Head title="Kepengurusan Lab" />
        <ToastContainer />
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold text-gray-800">Periode Kepengurusan Lab</h2>
            {canManageKepengurusan() && (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Kepengurusan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SK</th>
                  {canManageKepengurusan() &&  (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  
                  )}
              
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kepengurusanLab.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tahun_kepengurusan ? item.tahun_kepengurusan.tahun : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tahun_kepengurusan ? item.tahun_kepengurusan.mulai : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tahun_kepengurusan ? item.tahun_kepengurusan.selesai : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.tahun_kepengurusan.isactive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.tahun_kepengurusan.isactive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sk ? (
                        <a 
                          href={route('kepengurusan-lab.download-sk', item.id)} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Unduh SK
                        </a>
                      ) : (
                        <span className="text-gray-400">Tidak ada file</span>
                      )}
                    </td>
                      {canManageKepengurusan() && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                    </td>
                      )}
                  </tr>
                ))}
                
                {kepengurusanLab.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
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
                <h3 className="text-lg font-semibold">Tambah Kepengurusan Lab</h3>
                <button 
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreate} encType="multipart/form-data">
                <div className="mb-4">
                  <label htmlFor="create-tahun" className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun Kepengurusan
                  </label>
                  <select
                    id="create-tahun"
                    className={`w-full px-3 py-2 border rounded-md ${
                      createForm.errors.tahun_kepengurusan_id ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={createForm.data.tahun_kepengurusan_id}
                    onChange={(e) => createForm.setData('tahun_kepengurusan_id', e.target.value)}
                  >
                    <option value="">Pilih Tahun Kepengurusan</option>
                    {tahunKepengurusan.map(tahun => (
                      <option key={tahun.id} value={tahun.id}>{tahun.tahun}</option>
                    ))}
                  </select>
                  {createForm.errors.tahun_kepengurusan_id && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.tahun_kepengurusan_id}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="create-sk" className="block text-sm font-medium text-gray-700 mb-1">
                    File SK (PDF, maks. 5MB)
                  </label>
                  <input
                    type="file"
                    id="create-sk"
                    name="sk"
                    accept=".pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      createForm.errors.sk ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onChange={(e) => createForm.setData('sk', e.target.files[0])}
                  />
                  {createForm.errors.sk && (
                    <p className="mt-1 text-sm text-red-600">{createForm.errors.sk}</p>
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
        
        {/* Edit Modal - fixed */}
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Update SK Kepengurusan Lab</h3>
                <button 
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleEdit} encType="multipart/form-data">
                {/* Hidden field for method spoofing */}
                <input type="hidden" name="_method" value="PUT" />
                
                <div className="mb-4">
                  <label htmlFor="edit-sk" className="block text-sm font-medium text-gray-700 mb-1">
                    File SK Baru (PDF, maks. 5MB)
                  </label>
                  <input
                    type="file"
                    id="edit-sk"
                    name="sk"
                    accept=".pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      editForm.errors.sk ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log("File selected:", file ? file.name : "none");
                      editForm.setData('sk', file);
                    }}
                  />
                  {editForm.errors.sk && (
                    <p className="mt-1 text-sm text-red-600">{editForm.errors.sk}</p>
                  )}
                  
                  {selectedItem.sk && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>SK saat ini: 
                        <a 
                          href={route('kepengurusan-lab.download-sk', selectedItem.id)} 
                          className="text-blue-600 hover:text-blue-900 ml-1"
                        >
                          Unduh SK
                        </a>
                      </p>
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

  export default KepengurusanLab;