import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import DashboardLayout from '../Layouts/DashboardLayout';
import { toast, ToastContainer } from 'react-toastify';
import { useLab } from "../Components/LabContext"; 
import 'react-toastify/dist/ReactToastify.css';


const Anggota = ({ anggota, struktur, flash, kepengurusanlab, tahunKepengurusan }) => {
  const { selectedLab } = useLab();
  const { auth } = usePage().props; // Get auth user from page props
  
  // Check if user has admin privileges (not asisten or dosen)
  const isAdmin = auth.user && !auth.user.roles.some(role => ['asisten', 'dosen', 'kadep'].includes(role));

  // State untuk modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedTahun, setSelectedTahun] = useState(() => {
    const activeTahun = tahunKepengurusan?.find((tahun) => tahun.isactive);
    return activeTahun ? activeTahun.id : "";
  });

  // Form untuk create
  const createForm = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nomor_induk: '',
    nomor_anggota: '',
    jenis_kelamin: '',
    foto_profile: null,
    alamat: '',
    no_hp: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    struktur_id: '',
    lab_id: selectedLab?.id || '',
  });
  
  // Form untuk edit
  const editForm = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nomor_induk: '',
    nomor_anggota: '',
    jenis_kelamin: '',
    foto_profile: null,
    alamat: '',
    no_hp: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    struktur_id: '',
    _method: 'PUT',
  });
  
  const openCreateModal = () => {
    createForm.reset();
    createForm.setData('lab_id', selectedLab?.id || '');
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
    setPreviewImage(null);
  };
  
  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.reset();
    editForm.setData({
      name: item.name,
      email: item.email,
      nomor_induk: item.profile.nomor_induk,
      nomor_anggota: item.profile.nomor_anggota || '',
      jenis_kelamin: item.profile.jenis_kelamin,
      alamat: item.profile.alamat || '',
      no_hp: item.profile.no_hp || '',
      tempat_lahir: item.profile.tempat_lahir || '',
      tanggal_lahir: item.profile.tanggal_lahir || '',
      struktur_id: item.struktur_id || '',
      _method: 'PUT',
    });
    
    if (item.profile.foto_profile) {
      setPreviewImage(`/storage/${item.profile.foto_profile}`);
    } else {
      setPreviewImage(null);
    }
    
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    editForm.reset();
    setPreviewImage(null);
  };
  
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };
  
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route('anggota.store'), {
      onSuccess: () => {
        closeCreateModal();
        toast.success('Anggota berhasil ditambahkan');
      },
      onError: (errors) => {
        console.log('Form errors:', errors);
        
        if (errors.message) {
          toast.error(errors.message);
        } else {
          toast.error('Gagal menambahkan anggota baru');
        }
      },
      forceFormData: true,
    });
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    
    editForm.post(route('anggota.update', selectedItem.id), {
      onSuccess: () => {
        closeEditModal();
        toast.success('Anggota berhasil diperbarui');
      },
      onError: (errors) => {
        if (errors.message) {
          toast.error(errors.message);
        } else {
          toast.error('Gagal memperbarui data anggota');
        }
      },
      forceFormData: true, // Memastikan dikirim sebagai multipart/form-data
    });
  };
  
  const handleDelete = () => {
    router.delete(route('anggota.destroy', selectedItem.id), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Anggota berhasil dihapus');
      },
      onError: () => {
        toast.error('Gagal menghapus anggota');
      },
    });
  };
  
  const handleFileChange = (e, form) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      if (form === 'create') {
        createForm.setData('foto_profile', file);
      } else {
        editForm.setData('foto_profile', file);
      }
    }
  };
  const handleFilterChange = (e) => {
    setSelectedTahun(e.target.value);
  };


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
      router.visit(route('anggota.index'), {
        data: { lab_id: selectedLab.id, tahun_id: selectedTahun },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab, selectedTahun]);

  return (
    <DashboardLayout>
      <Head title="Keanggotaan Lab" />
      <ToastContainer />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
  <div className="p-6 flex justify-between items-center border-b">
    <h2 className="text-xl font-semibold text-gray-800">Keanggotaan {selectedLab?.nama_lab}</h2>
    
    <div className="flex items-center space-x-4">
      <div>
        <select
          value={selectedTahun}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Pilih Periode</option>
          {tahunKepengurusan?.map((tahun) => (
            <option key={tahun.id} value={tahun.id}>
              {tahun.tahun}
            </option>
          ))}
        </select>
      </div>
      
      {/* Only show Add button for admin users */}
      {isAdmin && (
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Tambah Anggota
        </button>
      )}
    </div>
  </div>
  
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM/NIK</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Anggota</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
          {/* Only show Action column for admin users */}
          {isAdmin && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          )}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {anggota && anggota.length > 0 ? (
          anggota.map((item, index) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.profile.nomor_induk}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.struktur.struktur}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{item.profile.nomor_anggota || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.profile.foto_profile ? (
                  <img 
                    src={`/storage/${item.profile.foto_profile}`} 
                    alt={`Foto ${item.name}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No Img</span>
                  </div>
                )}
              </td>
              {/* Only show Action buttons for admin users */}
              {isAdmin && (
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
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={isAdmin ? "7" : "6"} className="px-6 py-4 text-center text-gray-500">
              Tidak ada data anggota
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
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Anggota</h3>
              <button 
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate} encType="multipart/form-data">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 mb-3">
                  <h4 className="font-medium text-gray-700 mb-2">Informasi Akun</h4>
                  <div className="h-0.5 bg-gray-100"></div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.data.name}
                    onChange={e => createForm.setData('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {createForm.errors.name && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.name}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.data.email}
                    onChange={e => createForm.setData('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {createForm.errors.email && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.email}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.data.password}
                    onChange={e => createForm.setData('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {createForm.errors.password && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.password}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.data.password_confirmation}
                    onChange={e => createForm.setData('password_confirmation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.data.struktur_id}
                    onChange={e => createForm.setData('struktur_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    {struktur && struktur.map(item => (
                      <option key={item.id} value={item.id}>{item.struktur}</option>
                    ))}
                  </select>
                  {createForm.errors.struktur_id && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.struktur_id}</div>
                  )}
                </div>
                
                <div className="col-span-2 mb-3 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Informasi Personal</h4>
                  <div className="h-0.5 bg-gray-100"></div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIM/NIDN/NIP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.data.nomor_induk}
                    onChange={e => createForm.setData('nomor_induk', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {createForm.errors.nomor_induk && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.nomor_induk}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Anggota
                  </label>
                  <input
                    type="text"
                    value={createForm.data.nomor_anggota}
                    onChange={e => createForm.setData('nomor_anggota', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.data.jenis_kelamin}
                    onChange={e => createForm.setData('jenis_kelamin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                  {createForm.errors.jenis_kelamin && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.jenis_kelamin}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={createForm.data.no_hp}
                    onChange={e => createForm.setData('no_hp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={createForm.data.tempat_lahir}
                    onChange={e => createForm.setData('tempat_lahir', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={createForm.data.tanggal_lahir}
                    onChange={e => createForm.setData('tanggal_lahir', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={createForm.data.alamat}
                    onChange={e => createForm.setData('alamat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto Profil
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        onChange={e => handleFileChange(e, 'create')}
                        className="w-full"
                        accept="image/*"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Format: JPG, JPEG, PNG. Max: 2MB
                      </div>
                    </div>
                  </div>
                  {createForm.errors.foto_profile && (
                    <div className="text-red-500 text-xs mt-1">{createForm.errors.foto_profile}</div>
                  )}
                </div>
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
    

{isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Anggota</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEdit} encType="multipart/form-data">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 mb-3">
                  <h4 className="font-medium text-gray-700 mb-2">Informasi Akun</h4>
                  <div className="h-0.5 bg-gray-100"></div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.data.name}
                    onChange={e => editForm.setData('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {editForm.errors.name && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.name}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.data.email}
                    onChange={e => editForm.setData('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {editForm.errors.email && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.email}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (Kosongkan jika tidak diubah)
                  </label>
                  <input
                    type="password"
                    value={editForm.data.password}
                    onChange={e => editForm.setData('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {editForm.errors.password && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.password}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    value={editForm.data.password_confirmation}
                    onChange={e => editForm.setData('password_confirmation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.data.struktur_id}
                    onChange={e => editForm.setData('struktur_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    {struktur && struktur.map(item => (
                      <option key={item.id} value={item.id}>{item.struktur}</option>
                    ))}
                  </select>
                  {editForm.errors.struktur_id && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.struktur_id}</div>
                  )}
                </div>
                
                <div className="col-span-2 mb-3 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Informasi Personal</h4>
                  <div className="h-0.5 bg-gray-100"></div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIM/NIDN/NIP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.data.nomor_induk}
                    onChange={e => editForm.setData('nomor_induk', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {editForm.errors.nomor_induk && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.nomor_induk}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Anggota
                  </label>
                  <input
                    type="text"
                    value={editForm.data.nomor_anggota}
                    onChange={e => editForm.setData('nomor_anggota', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.data.jenis_kelamin}
                    onChange={e => editForm.setData('jenis_kelamin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                  {editForm.errors.jenis_kelamin && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.jenis_kelamin}</div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={editForm.data.no_hp}
                    onChange={e => editForm.setData('no_hp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={editForm.data.tempat_lahir}
                    onChange={e => editForm.setData('tempat_lahir', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={editForm.data.tanggal_lahir}
                    onChange={e => editForm.setData('tanggal_lahir', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={editForm.data.alamat}
                    onChange={e => editForm.setData('alamat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto Profil
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        onChange={e => handleFileChange(e, 'edit')}
                        className="w-full"
                        accept="image/*"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Format: JPG, JPEG, PNG. Max: 2MB
                      </div>
                    </div>
                  </div>
                  {editForm.errors.foto_profile && (
                    <div className="text-red-500 text-xs mt-1">{editForm.errors.foto_profile}</div>
                  )}
                </div>
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
      
      {/* Delete Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
              <p className="text-gray-700 mt-2">
                Apakah Anda yakin ingin menghapus anggota <span className="font-semibold">{selectedItem.name}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
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


export default Anggota;