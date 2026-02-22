import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { toast } from 'sonner';

export default function InventarisIndex({ 
    kepengurusanlab, 
    inventaris, 
    categories, 
    filters = {}, 
    flash = {} 
}) {
  const { auth, laboratorium } = usePage().props;
  const { can } = usePermission();
  
  // Permission-based access control
  const canCreate = can('inventaris.create');
  const canUpdate = can('inventaris.update');
  const canDelete = can('inventaris.delete');
  
  // Define isAdmin
  // Define isAdmin using usePermission if available, or fix logic
  const isUserAdmin = () => {
    if (auth.user.roles && Array.isArray(auth.user.roles)) {
        return auth.user.roles.includes('admin') || auth.user.roles.includes('superadmin');
    }
    return false;
  };
  const isAdmin = isUserAdmin();
  
  // State
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedCategory, setSelectedCategory] = useState(filters.kategori_id || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const allSelected = inventaris.data.length > 0 && selectedIds.length === inventaris.data.length;

  const toggleSelectAll = () => {
      if (allSelected) setSelectedIds([]);
      else setSelectedIds(inventaris.data.map(i => i.id));
  };
  const toggleSelect = (id) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk actions
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const handleBulkDelete = () => setIsBulkDeleteModalOpen(true);
  const executeBulkDelete = () => {
      router.post(route('detail-inventaris.bulk-delete'), { ids: selectedIds }, {
          onSuccess: () => { setSelectedIds([]); setIsBulkDeleteModalOpen(false); toast.success('Aset terpilih berhasil dihapus'); },
          preserveScroll: true
      });
  };
    // Label Configuration State
    const [isLabelConfigModalOpen, setIsLabelConfigModalOpen] = useState(false);
    const [labelConfigMode, setLabelConfigMode] = useState('selected'); // 'selected' or 'all'
    const [labelConfig, setLabelConfig] = useState({
        layout: 'standard', // standard (3), medium (4), small (5), mini (6)
        show_qr: true
    });

    const openLabelConfigModal = (mode = 'selected') => {
        setLabelConfigMode(mode);
        setIsLabelConfigModalOpen(true);
    };

    const handleDownloadLabels = () => {
        // Construct URL with params
        const url = route('detail-inventaris.batch-labels');
        
        // Create a hidden form to submit the array of IDs and config
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = '_blank'; // Open in new tab

        // CSRF Token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        // Scope
        const scopeInput = document.createElement('input');
        scopeInput.type = 'hidden';
        scopeInput.name = 'scope';
        scopeInput.value = labelConfigMode;
        form.appendChild(scopeInput);

        if (labelConfigMode === 'selected') {
            // IDs
            selectedIds.forEach(id => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'ids[]';
                input.value = id;
                form.appendChild(input);
            });
        } else {
            // Filters for 'all' mode
            // Pass current filters
            if (searchTerm) {
                 const input = document.createElement('input');
                 input.type = 'hidden'; input.name = 'search'; input.value = searchTerm;
                 form.appendChild(input);
            }
            if (selectedCategory) {
                 const input = document.createElement('input');
                 input.type = 'hidden'; input.name = 'kategori_id'; input.value = selectedCategory;
                 form.appendChild(input);
            }
            if (filters.lab_id) {
                 const input = document.createElement('input');
                 input.type = 'hidden'; input.name = 'lab_id'; input.value = filters.lab_id;
                 form.appendChild(input);
            }
        }

        // Config
        const layoutInput = document.createElement('input');
        layoutInput.type = 'hidden';
        layoutInput.name = 'layout';
        layoutInput.value = labelConfig.layout;
        form.appendChild(layoutInput);

        const qrInput = document.createElement('input');
        qrInput.type = 'hidden';
        qrInput.name = 'show_qr';
        qrInput.value = labelConfig.show_qr ? '1' : '0';
        form.appendChild(qrInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        setIsLabelConfigModalOpen(false);
        // setLabelConfig({ layout: 'standard', show_qr: true }); // Keep last config for convenience?
        // setSelectedIds([]); // Don't clear selection if 'all', maybe clear if 'selected'?
        if (labelConfigMode === 'selected') setSelectedIds([]);
    };

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // QR Preview
  const openQrPreview = (item) => {
      setSelectedItem(item);
      setIsQrPreviewOpen(true);
  };

  // Flash messages
  useEffect(() => {
    if (flash?.message) toast.success(flash.message);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  // Search handler
  const handleSearch = debounce((search, category, pageLimit) => {
    router.get(route('inventaris.index'), {
        search: search,
        kategori_id: category,
        perPage: pageLimit,
        lab_id: filters.lab_id
    }, {
        preserveState: true,
        preserveScroll: true,
        replace: true
    });
  }, 300);

  const onSearchChange = (e) => {
      setSearchTerm(e.target.value);
      handleSearch(e.target.value, selectedCategory, perPage);
  };

  const onCategoryChange = (e) => {
      setSelectedCategory(e.target.value);
      handleSearch(searchTerm, e.target.value, perPage);
  };

  const onPerPageChange = (e) => {
      setPerPage(e.target.value);
      handleSearch(searchTerm, selectedCategory, e.target.value);
  };

  const handlePageChange = (url) => {
      if (url) router.visit(url, { preserveState: true, preserveScroll: true });
  };

  // --- Forms ---

  // CREATE Form
  const createForm = useForm({
      kategori_aset_id: '',
      nama: '', // Added nama
      kode_barang: '',
      keadaan: 'baik',
      status: 'tersedia',
      keterangan: '',
      foto: null
  });

  const handleCreateSubmit = (e) => {
      e.preventDefault();
      createForm.post(route('detail-inventaris.store'), {
          onSuccess: () => {
              setIsCreateModalOpen(false);
              createForm.reset();
              toast.success('Aset berhasil ditambahkan');
          },
          onError: () => toast.error('Gagal menambahkan aset')
      });
  };

  // EDIT Form
  const editForm = useForm({
      id: '',
      kategori_aset_id: '',
      nama: '', // Added nama
      kode_barang: '',
      keadaan: '',
      status: '',
      keterangan: '',
      foto: null,
      _method: 'PUT' // For Laravel method spoofing if needed via POST, but Inertia put handles it
  });

  const openEditModal = (item) => {
      setSelectedItem(item);
      editForm.setData({
          id: item.id,
          kategori_aset_id: item.kategori_aset_id,
          nama: item.nama || '', // Added nama
          kode_barang: item.kode_barang,
          keadaan: item.keadaan,
          status: item.status,
          keterangan: item.keterangan || '',
          foto: null, // Don't prepopulate file input
          _method: 'PUT' 
      });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
      e.preventDefault();
      // Using post with _method: PUT because file uploads with PUT/PATCH are tricky in standard HTML forms / Inertia sometimes
      // But standard Inertia .put usually works unless specific server config issues. 
      // Safest for file upload updates is often POST with _method=PUT.
      // Let's try standard put first, if file upload fails we switch to post w/ spoofing.
      // Actually, Inertia recommends router.post with `_method: 'put'` for FormData with files.
      
      router.post(route('detail-inventaris.update', selectedItem.id), {
          ...editForm.data,
          _method: 'PUT',
          foto: editForm.data.foto
      }, {
          forceFormData: true,
          onSuccess: () => {
             setIsEditModalOpen(false);
             setSelectedItem(null);
             editForm.reset();
             toast.success('Aset berhasil diperbarui');
          },
          onError: () => toast.error('Gagal memperbarui aset')
      });
  };

  // DELETE Form
  const deleteForm = useForm({});
  
  const openDeleteModal = (item) => {
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = (e) => {
      e.preventDefault();
      deleteForm.delete(route('detail-inventaris.destroy', selectedItem.id), {
          onSuccess: () => {
              setIsDeleteModalOpen(false);
              setSelectedItem(null);
              toast.success('Aset berhasil dihapus');
          },
          onError: () => toast.error('Gagal menghapus aset')
      });
  };

  const handleFileChange = (e, form) => {
    form.setData('foto', e.target.files[0]);
  };

  return (
    <DashboardLayout>
      <Head title="Daftar Inventaris" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Aset Laboratorium
          </h2>
          <div className="flex items-center gap-2">
           {canCreate && (
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
                Tambah Aset
            </button>
           )}
            <a
                href={route('inventaris.export-excel', { lab_id: filters.lab_id })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 text-sm font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
            </a>
            <button
                onClick={() => openLabelConfigModal('all')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Download Semua Label
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder="Cari kode barang atau nama kategori..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
                <select
                    value={selectedCategory}
                    onChange={onCategoryChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nama}</option>
                    ))}
                </select>
            </div>

            {/* Per Page */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Tampilkan:</label>
                <select
                    value={perPage}
                    onChange={onPerPageChange}
                    className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
            </div>

            {/* Link to Category Management (Admin only) */}
            {isAdmin && (
                <Link
                    href={route('inventaris.kategori.index', { lab_id: filters.lab_id })}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                >
                    Kelola Kategori
                </Link>
            )}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                    {selectedIds.length} item terpilih
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openLabelConfigModal('selected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Download Label ({selectedIds.length})
                    </button>
                    {canDelete && (
                        <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => setSelectedIds([])}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Batal Pilih
                    </button>
                </div>
            </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 w-10">
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kondisi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                        {(canUpdate || canDelete) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {inventaris.data.length > 0 ? inventaris.data.map((item, index) => (
                        <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedIds.includes(item.id) ? '!bg-blue-50' : ''}`}>
                            <td className="px-4 py-4 w-10">
                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inventaris.from + index}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {item.foto ? (
                                    <img src={`/storage/${item.foto}`} alt={item.kode_barang} className="h-10 w-10 object-cover rounded" />
                                ) : (
                                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.kode_barang}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kategori_aset?.nama || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${item.keadaan === 'baik' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.keadaan === 'baik' ? 'Baik' : 'Rusak'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'tersedia' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {item.status === 'tersedia' ? 'Tersedia' : 'Dipinjam'}
                                </span>
                            </td>
                            {/* QR Code Column */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                {item.qr_code_path ? (
                                    <button
                                        onClick={() => openQrPreview(item)}
                                        className="group relative"
                                        title="Lihat QR Code"
                                    >
                                        <img
                                            src={`/storage/${item.qr_code_path}`}
                                            alt={`QR ${item.kode_barang}`}
                                            className="h-10 w-10 rounded border border-gray-200 group-hover:border-blue-400 group-hover:shadow-md transition-all duration-200"
                                        />
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Belum ada</span>
                                )}
                            </td>
                            
                             {(canUpdate || canDelete) && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex gap-2">
                                        {canUpdate && (
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 p-2 rounded-full transition-colors duration-200"
                                            title="Edit Aset"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        )}
                                        {/* Download Label Button */}
                                        <a
                                            href={route('detail-inventaris.label-download', item.id)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full transition-colors duration-200"
                                            title="Download Label QR"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </a>
                                        {canDelete && (
                                        <button
                                            onClick={() => openDeleteModal(item)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full transition-colors duration-200"
                                             title="Hapus Aset"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        )}
                                    </div>
                                </td>
                             )}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={(canUpdate || canDelete) ? "10" : "9"} className="px-6 py-4 text-center text-gray-500">
                                Tidak ada data inventaris.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        {inventaris.links && (
             <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                        Menampilkan {inventaris.from} - {inventaris.to} dari {inventaris.total} data
                    </span>
                    <div className="flex gap-1">
                        {inventaris.links.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(link.url)}
                                disabled={!link.url || link.active}
                                className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'} ${!link.url ? 'opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{__html: link.label}}
                            />
                        ))}
                    </div>
                </div>
             </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Tambah Aset Baru</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori Aset *</label>
                            <select
                                value={createForm.data.kategori_aset_id}
                                onChange={e => createForm.setData('kategori_aset_id', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nama}</option>
                                ))}
                            </select>
                            {createForm.errors.kategori_aset_id && <p className="mt-1 text-sm text-red-600">{createForm.errors.kategori_aset_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Barang</label>
                            <input
                                type="text"
                                value={createForm.data.nama}
                                onChange={e => createForm.setData('nama', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Opsional (jika berbeda dengan kategori)"
                            />
                            {createForm.errors.nama && <p className="mt-1 text-sm text-red-600">{createForm.errors.nama}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kode Barang *</label>
                            <input
                                type="text"
                                value={createForm.data.kode_barang}
                                onChange={e => createForm.setData('kode_barang', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                            {createForm.errors.kode_barang && <p className="mt-1 text-sm text-red-600">{createForm.errors.kode_barang}</p>}
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kondisi</label>
                                <select
                                    value={createForm.data.keadaan}
                                    onChange={e => createForm.setData('keadaan', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="baik">Baik</option>
                                    <option value="rusak">Rusak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={createForm.data.status}
                                    onChange={e => createForm.setData('status', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="tersedia">Tersedia</option>
                                    <option value="dipinjam">Dipinjam</option>
                                </select>
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                            <textarea
                                value={createForm.data.keterangan}
                                onChange={e => createForm.setData('keterangan', e.target.value)}
                                rows="3"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Foto</label>
                            <input
                                type="file"
                                onChange={(e) => handleFileChange(e, createForm)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {createForm.errors.foto && <p className="mt-1 text-sm text-red-600">{createForm.errors.foto}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Edit Aset</h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori Aset *</label>
                            <select
                                value={editForm.data.kategori_aset_id}
                                onChange={e => editForm.setData('kategori_aset_id', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nama}</option>
                                ))}
                            </select>
                            {editForm.errors.kategori_aset_id && <p className="mt-1 text-sm text-red-600">{editForm.errors.kategori_aset_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Barang</label>
                            <input
                                type="text"
                                value={editForm.data.nama}
                                onChange={e => editForm.setData('nama', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Opsional"
                            />
                            {editForm.errors.nama && <p className="mt-1 text-sm text-red-600">{editForm.errors.nama}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kode Barang *</label>
                            <input
                                type="text"
                                value={editForm.data.kode_barang}
                                onChange={e => editForm.setData('kode_barang', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                            {editForm.errors.kode_barang && <p className="mt-1 text-sm text-red-600">{editForm.errors.kode_barang}</p>}
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kondisi</label>
                                <select
                                    value={editForm.data.keadaan}
                                    onChange={e => editForm.setData('keadaan', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="baik">Baik</option>
                                    <option value="rusak">Rusak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={editForm.data.status}
                                    onChange={e => editForm.setData('status', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="tersedia">Tersedia</option>
                                    <option value="dipinjam">Dipinjam</option>
                                </select>
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                            <textarea
                                value={editForm.data.keterangan}
                                onChange={e => editForm.setData('keterangan', e.target.value)}
                                rows="3"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Foto</label>
                            <div className="mt-1 mb-2">
                                {selectedItem.foto && !editForm.data.foto && (
                                     <div className="mb-2">
                                        <p className="text-xs text-gray-500 mb-1">Foto saat ini:</p>
                                        <img src={`/storage/${selectedItem.foto}`} alt="Current" className="h-16 w-16 object-cover rounded" />
                                     </div>
                                )}
                                <input
                                    type="file"
                                    onChange={(e) => handleFileChange(e, editForm)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            {editForm.errors.foto && <p className="mt-1 text-sm text-red-600">{editForm.errors.foto}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing} // Note: Inertia router visits use a general loading state or form-specific if passed manually, but for manual router.post we check global or local processing. Here editing is done via router.post manually? No, I used form helper for data but manual router submit. Better checks:
                                // Actually better to use editForm for processing state if possible, or local state.
                                // In handleEditSubmit I used router.post, which returns a visit.
                                // Let's just use a simple submit button.
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedItem && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Hapus Aset</h3>
                    <p className="text-gray-500 mb-6">
                        Apakah Anda yakin ingin menghapus aset dengan kode <strong>{selectedItem.kode_barang}</strong>? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                             disabled={deleteForm.processing}
                            className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {deleteForm.processing ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* QR Preview Modal */}
        {isQrPreviewOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                    <div className="flex justify-between items-center p-5 border-b">
                        <h3 className="text-lg font-medium text-gray-900">QR Code - {selectedItem.kode_barang}</h3>
                        <button onClick={() => { setIsQrPreviewOpen(false); setSelectedItem(null); }} className="text-gray-400 hover:text-gray-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="p-6 flex flex-col items-center">
                        {selectedItem.qr_code_path ? (
                            <img
                                src={`/storage/${selectedItem.qr_code_path}`}
                                alt={`QR ${selectedItem.kode_barang}`}
                                className="w-48 h-48 border border-gray-200 rounded-lg shadow-sm"
                            />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                QR belum tersedia
                            </div>
                        )}
                        <p className="mt-3 text-sm text-gray-500">Scan untuk melihat detail aset</p>
                    </div>
                    <div className="p-4 border-t flex gap-2 justify-center">
                        <a
                            href={route('detail-inventaris.qr-download', selectedItem.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download QR
                        </a>
                        <a
                            href={route('detail-inventaris.label-download', selectedItem.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Download Label
                        </a>
                    </div>
                </div>
            </div>
        )}

        {/* Label Config Modal */}
        {isLabelConfigModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                             Konfigurasi Label ({labelConfigMode === 'all' ? 'Semua Data' : `${selectedIds.length} Item`})
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Atur tampilan label sebelum download.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran / Layout</label>
                            <div className="space-y-2">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="layout" 
                                        value="standard" 
                                        checked={labelConfig.layout === 'standard'} 
                                        onChange={(e) => setLabelConfig({...labelConfig, layout: e.target.value})}
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Standar (3 Kolom) - ~7cm</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="layout" 
                                        value="medium" 
                                        checked={labelConfig.layout === 'medium'} 
                                        onChange={(e) => setLabelConfig({...labelConfig, layout: e.target.value})}
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Medium (4 Kolom) - ~5cm</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="layout" 
                                        value="small" 
                                        checked={labelConfig.layout === 'small'} 
                                        onChange={(e) => setLabelConfig({...labelConfig, layout: e.target.value})}
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Kecil (5 Kolom) - ~4cm</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="layout" 
                                        value="mini" 
                                        checked={labelConfig.layout === 'mini'} 
                                        onChange={(e) => setLabelConfig({...labelConfig, layout: e.target.value})}
                                        className="text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Mini (6 Kolom) - ~3.3cm</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={labelConfig.show_qr} 
                                    onChange={(e) => setLabelConfig({...labelConfig, show_qr: e.target.checked})}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-700">Tampilkan QR Code</span>
                            </label>
                             {!labelConfig.show_qr && (
                                <p className="text-xs text-blue-600 mt-1 ml-6">
                                    Label akan menjadi lebih ramping jika QR disembunyikan.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
                        <button
                            onClick={() => setIsLabelConfigModalOpen(false)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDownloadLabels}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>
             </div>
        )}


        {/* Bulk Delete Confirmation Modal */}
        {isBulkDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Hapus Aset Massal</h3>
                    </div>
                    <p className="text-gray-500 mb-6">
                        Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} aset</strong> terpilih? Semua data termasuk foto dan QR code akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsBulkDeleteModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Batal</button>
                        <button onClick={executeBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700">Hapus {selectedIds.length} Aset</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </DashboardLayout>
  );
}
