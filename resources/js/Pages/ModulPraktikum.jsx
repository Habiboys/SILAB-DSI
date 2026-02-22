import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const ModulPraktikum = ({ 
  praktikum, 
  modulPraktikum, 
  pertemuanList,
  kelas,
  filters, 
  flash 
}) => {
  const { auth } = usePage().props;
  const { can, user } = usePermission();
  
  // Permission checks
  const canCreate = can('modul_praktikum.create');
  const canUpdate = can('modul_praktikum.update');
  const canDelete = can('modul_praktikum.delete');
  
  // State for filters
  const [search, setSearch] = useState(filters.search || '');
  const [selectedPertemuan, setSelectedPertemuan] = useState(filters.pertemuan_id || '');
  const [activeTab, setActiveTab] = useState(filters.kelas_id || 'all');

  // Helper to check if aslab
  const isAssignedAslab = () => {
    return user?.praktikumAslab?.some(ap => ap.id === praktikum.id);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
         router.get(
          route(route().current(), [praktikum.id]),
          { 
              search, 
              pertemuan_id: selectedPertemuan, 
              kelas_id: activeTab 
          },
          { preserveState: true, preserveScroll: true, replace: true }
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (e) => {
      setSearch(e.target.value);
  };

  const handlePertemuanChange = (e) => {
      const val = e.target.value;
      setSelectedPertemuan(val);
      router.get(
          route(route().current(), [praktikum.id]),
          { 
              search, 
              pertemuan_id: val, 
              kelas_id: activeTab 
          },
          { preserveState: true, preserveScroll: true }
      );
  };

  const handleTabChange = (tab) => {
      setActiveTab(tab);
      setSelectedPertemuan(''); // Reset pertemuan filter when tab changes
      router.get(
          route(route().current(), [praktikum.id]),
          { 
              search, 
              pertemuan_id: '', 
              kelas_id: tab 
          },
          { preserveState: true, preserveScroll: true }
      );
  };
  
  // Can manage module links (admin or assigned aslab)
  const canManageModuleLinks = can('modul_praktikum.public_link') || isAssignedAslab();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Create form 
  const createForm = useForm({
    praktikum_id: praktikum?.id,
    pertemuan_id: '',
    judul: '',
    modul: null,
    is_public: false
  });
  
  // Edit form 
  const editForm = useForm({
    pertemuan_id: '',
    judul: '',
    modul: null,
    is_public: false,
    _method: 'PUT'
  });
  
  const deleteForm = useForm({});

  // Open create modal
  const openCreateModal = () => {
    if (!canCreate) return;
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
    if (!canUpdate) return;
    setSelectedItem(modul);
    editForm.setData({
      praktikum_id: modul.praktikum_id,
      pertemuan_id: modul.pertemuan_id || '', 
      judul: modul.judul,
      modul: null,
      is_public: modul.is_public || false,
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
  
  // ... (delete and view logic remains same)
  // Open delete modal
  const openDeleteModal = (item) => {
    if (!canDelete) return;
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
    if (!modulFilename) {
      console.error("Module filename is undefined");
      window.open(route('praktikum.modul.view', {
        praktikum: praktikum.id,
        modul: modulId
      }), '_blank');
      return;
    }
    const filename = modulFilename.split('/').pop();
    window.open(route('praktikum.modul.view', {
      praktikum: praktikum.id,
      modul: modulId,
      filename: filename
    }), '_blank');
  };

  // Toggle share link
  const toggleShareLink = (modul) => {
    router.post(route('praktikum.modul.toggle-share', {
      praktikum: praktikum.id,
      modul: modul.id
    }), {}, {
      onSuccess: () => {
        router.reload();
        const message = !modul.is_public ? 'Link berhasil dibuka' : 'Link berhasil ditutup';
        toast.success(message);
      },
      onError: () => {
        toast.error('Gagal mengubah status share link');
      }
    });
  };

    // Copy share link
  const copyShareLink = async (modul) => {
    if (!modul.hash) {
      toast.error('Hash tidak tersedia, silakan refresh halaman');
      return;
    }
    const shareUrl = route('modul.public.view', {
      hash: modul.hash
    });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link berhasil disalin ke clipboard!');
    } catch (error) {
       // ... fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link berhasil disalin ke clipboard!');
    }
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.get(route('praktikum.index'), praktikum?.kepengurusan_lab_id ? { kepengurusan_lab_id: praktikum.kepengurusan_lab_id } : {})}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Modul Praktikum</h2>
            <h3 className="text-md text-gray-600">Mata Kuliah: {praktikum?.mata_kuliah}</h3>
          </div>
        </div>
  
        <div className="flex gap-4 items-center">
          {canCreate && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah
            </button>
          )}
        </div>

      </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <input
                    type="text"
                    placeholder="Cari modul..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={handleSearchChange}
                />
            </div>
            <div className="w-full md:w-64">
                <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPertemuan}
                    onChange={handlePertemuanChange}
                >
                    <option value="">Semua Pertemuan</option>
                    {pertemuanList
                        .filter(p => activeTab === 'all' || p.kelas_id === activeTab)
                        .map(p => (
                        <option key={p.id} value={p.id}>
                            {p.judul} {p.kelas ? `(${p.kelas.nama_kelas})` : ''} - {p.formatted_tanggal}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto pb-2">
                <button
                    onClick={() => handleTabChange("all")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === "all"
                            ? "border-green-500 text-green-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                    Semua Kelas
                </button>
                {kelas?.map((k) => (
                    <button
                        key={k.id}
                        onClick={() => handleTabChange(k.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab == k.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Kelas {k.nama_kelas}
                    </button>
                ))}
            </nav>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pertemuan/Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Modul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share Link
                </th>
                {(canUpdate || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modulPraktikum && modulPraktikum.length > 0 ? (
                modulPraktikum.map((modul) => (
                  <tr key={modul.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">
                        {modul.pertemuan ? modul.pertemuan.judul : `Pertemuan (ID: ${modul.pertemuan_id})`}
                      </div>
                      {modul.pertemuan?.kelas && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Kelas {modul.pertemuan.kelas.nama_kelas}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {modul.judul}
                    </td>
                    {/* ... (rest of rows same) */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => viewModul(modul.id, modul.modul)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Lihat Modul
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {/* Share link buttons same as before */}
                       <div className="flex items-center space-x-2">
                        {canManageModuleLinks ? (
                          modul.is_public ? (
                            <>
                              <button
                                onClick={() => toggleShareLink(modul)}
                                className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                              >
                                Tutup Link
                              </button>
                              <button
                                onClick={() => copyShareLink(modul)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                              >
                                Copy Link
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => toggleShareLink(modul)}
                              className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Buka Link
                            </button>
                          )
                        ) : (
                          modul.is_public ? (
                            <button
                              onClick={() => copyShareLink(modul)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              Copy Link
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">Link tidak tersedia</span>
                          )
                        )}
                      </div>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {canUpdate && (
                          <button
                            onClick={() => openEditModal(modul)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors focus:outline-none"
                            title="Edit"
                          >
                           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          )}
                          {canDelete && (
                          <button
                            onClick={() => openDeleteModal(modul)}
                            className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                            title="Hapus"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={(canUpdate || canDelete) ? "5" : "4"} className="px-6 py-4 text-center text-sm text-gray-500">
                  Belum ada data modul praktikum
                </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Total Modul: {modulPraktikum?.length || 0}
              </div>
              <div className="text-gray-500">
                {praktikum?.mata_kuliah} - Semester {praktikum?.semester}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Tambah Modul */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Modul Praktikum</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleCreate} encType="multipart/form-data">
              <div className="mb-4">
                <label htmlFor="pertemuan_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Pertemuan
                </label>
                <select
                  id="pertemuan_id"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.pertemuan_id ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.pertemuan_id}
                  onChange={(e) => createForm.setData('pertemuan_id', e.target.value)}
                  required
                >
                    <option value="">Pilih Pertemuan</option>
                    {pertemuanList && pertemuanList.length > 0 ? (
                        pertemuanList.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.judul} {p.kelas ? `(Kelas ${p.kelas.nama_kelas})` : ''} - {p.tanggal}
                            </option>
                        ))
                    ) : (
                        <option disabled>Tidak ada pertemuan tersedia</option>
                    )}
                </select>
                {createForm.errors.pertemuan_id && (
                  <p className="mt-1 text-sm text-red-600">{createForm.errors.pertemuan_id}</p>
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
              </div>
              
              <div className="mb-4">
                <label htmlFor="modul" className="block text-sm font-medium text-gray-700 mb-1">
                  File Modul (PDF Only) *
                </label>
                <input
                  type="file"
                  id="modul"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.modul ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => createForm.setData('modul', e.target.files[0])}
                  accept=".pdf"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.data.is_public}
                    onChange={(e) => createForm.setData('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Buat link publik</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeCreateModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" disabled={createForm.processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75">Simpan</button>
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
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} encType="multipart/form-data">
              <div className="mb-4">
                <label htmlFor="edit-pertemuan_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Pertemuan
                </label>
                <select
                  id="edit-pertemuan_id"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.pertemuan_id ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.pertemuan_id}
                  onChange={(e) => editForm.setData('pertemuan_id', e.target.value)}
                  required
                >
                     <option value="">Pilih Pertemuan</option>
                    {pertemuanList && pertemuanList.length > 0 ? (
                        pertemuanList.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.judul} {p.kelas ? `(Kelas ${p.kelas.nama_kelas})` : ''} - {p.tanggal}
                            </option>
                        ))
                    ) : (
                        <option disabled>Tidak ada pertemuan tersedia</option>
                    )}
                </select>
                {editForm.errors.pertemuan_id && (
                  <p className="mt-1 text-sm text-red-600">{editForm.errors.pertemuan_id}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-judul" className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  id="edit-judul"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.data.judul}
                  onChange={(e) => editForm.setData('judul', e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-modul" className="block text-sm font-medium text-gray-700 mb-1">
                  File Modul (PDF Only - Opsional)
                </label>
                <input
                  type="file"
                  id="edit-modul"
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => editForm.setData('modul', e.target.files[0])}
                  accept=".pdf"
                />
              </div>

               <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.data.is_public}
                    onChange={(e) => editForm.setData('is_public', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Buat link publik</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" disabled={editForm.processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Perbarui</button>
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
              <p className="text-sm text-red-700">
                Apakah Anda yakin ingin menghapus modul "{selectedItem.judul}"? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Batal</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">Hapus</button>
            </div>
          </div>
        </div>
      )}
      
    </DashboardLayout>
  );
};

export default ModulPraktikum;