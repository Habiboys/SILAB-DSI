import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import DashboardLayout from '../Layouts/DashboardLayout';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLab } from '../Components/LabContext';
import ActionButtons from '../Components/ActionButtons';

const Proker = ({ 
  prokerData, 
  kepengurusanlab, 
  strukturList, 
  tahunKepengurusan, 
  selectedTahun: initialSelectedTahun,
  laboratorium,
  filters
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProker, setEditingProker] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProker, setDeletingProker] = useState(null);
  
  const { selectedLab } = useLab();
  const [selectedTahun, setSelectedTahun] = useState(initialSelectedTahun || filters?.tahun_id || "");

  // Auto-select tahun aktif jika tidak ada yang dipilih
  useEffect(() => {
    if (!selectedTahun && tahunKepengurusan.length > 0) {
      const tahunAktif = tahunKepengurusan.find(tahun => tahun.isactive == 1);
      if (tahunAktif) {
        setSelectedTahun(tahunAktif.id);
      }
    }
  }, [selectedTahun, tahunKepengurusan]);

  // Trigger router.visit saat lab atau tahun berubah
  useEffect(() => {
    if (selectedLab?.id && selectedTahun) {
      router.visit('/proker', {
        data: {
          lab_id: selectedLab.id,
          tahun_id: selectedTahun
        },
        preserveState: true
      });
    }
  }, [selectedLab?.id, selectedTahun]);

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    lab_id: selectedLab?.id || '', // Tambahkan lab_id
    kepengurusan_lab_id: kepengurusanlab?.id || '',
    struktur_id: '',
    deskripsi: '',
    status: 'belum_mulai',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keterangan: '',
    file_proker: null, // Tambahkan file_proker
  });



  const openModal = (prokerItem = null) => {
    if (prokerItem) {
      setEditingProker(prokerItem);
          setData({
      lab_id: selectedLab?.id || '', // Tambahkan lab_id
      kepengurusan_lab_id: prokerItem.kepengurusan_lab_id,
      struktur_id: prokerItem.struktur_id,
      deskripsi: prokerItem.deskripsi,
      status: prokerItem.status,
      tanggal_mulai: prokerItem.tanggal_mulai || '',
      tanggal_selesai: prokerItem.tanggal_selesai || '',
      keterangan: prokerItem.keterangan || '',
      file_proker: null, // Reset file untuk edit
    });
    } else {
      setEditingProker(null);
      reset();
      setData('lab_id', selectedLab?.id || '');
      setData('kepengurusan_lab_id', kepengurusanlab?.id || '');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProker(null);
    reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProker) {
      put(route('proker.update', editingProker.id), {
        onSuccess: () => {
          closeModal();
          toast.success('Program kerja berhasil diperbarui');
        },
        onError: () => {
          toast.error('Gagal memperbarui program kerja');
        }
      });
    } else {
      post(route('proker.store'), {
        onSuccess: () => {
          closeModal();
          toast.success('Program kerja berhasil ditambahkan');
        },
        onError: () => {
          toast.error('Gagal menambahkan program kerja');
        }
      });
    }
  };

  const openDeleteModal = (prokerItem) => {
    setDeletingProker(prokerItem);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProker(null);
  };

  const handleDelete = () => {
    destroy(route('proker.destroy', deletingProker.id), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success('Program kerja berhasil dihapus');
      },
      onError: () => {
        toast.error('Gagal menghapus program kerja');
      }
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'belum_mulai': 'bg-gray-100 text-gray-800',
      'sedang_berjalan': 'bg-blue-100 text-blue-800',
      'selesai': 'bg-green-100 text-green-800',
      'ditunda': 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'belum_mulai': 'Belum Mulai',
      'sedang_berjalan': 'Sedang Berjalan',
      'selesai': 'Selesai',
      'ditunda': 'Ditunda',
    };
    return texts[status] || 'Tidak Diketahui';
  };

  return (
    <DashboardLayout>
      <Head title="Program Kerja" />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Program Kerja Laboratorium
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Kelola program kerja berdasarkan struktur jabatan dan periode kepengurusan
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Filter Tahun */}
            <select
              value={selectedTahun || ''}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tahun</option>
              {tahunKepengurusan?.map((tahun) => (
                <option key={tahun.id} value={tahun.id}>
                  {tahun.tahun}
                </option>
              ))}
            </select>

            {/* Button Tambah */}
            {kepengurusanlab?.tahun_kepengurusan?.isactive == 1 && (
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                disabled={!kepengurusanlab}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tambah
                </span>
              </button>
            )}
          </div>
        </div>



        {/* Content */}
        {!selectedLab && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih laboratorium dari navbar terlebih dahulu
          </div>
        )}
        
        {selectedLab && !selectedTahun && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih tahun untuk melihat data
          </div>
        )}

        {selectedLab && selectedTahun && !kepengurusanlab && (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data kepengurusan untuk laboratorium dan tahun yang dipilih
          </div>
        )}

        {kepengurusanlab && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Struktur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi Program Kerja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prokerData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Belum ada program kerja untuk periode ini
                    </td>
                  </tr>
                ) : (
                  prokerData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.struktur?.struktur}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.deskripsi}
                        </div>
                        {item.keterangan && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.keterangan}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.tanggal_mulai && item.tanggal_selesai ? (
                          <>
                            {new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} - 
                            {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons
                          item={{...item, kepengurusanlab: kepengurusanlab}}
                          onEdit={openModal}
                          onDelete={openDeleteModal}
                          showEdit={true}
                          showDelete={true}
                          editLabel="Edit"
                          deleteLabel="Hapus"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingProker ? 'Edit Program Kerja' : 'Tambah Program Kerja'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Struktur Jabatan <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.struktur_id}
                  onChange={(e) => setData('struktur_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Struktur</option>
                  {strukturList?.map((struktur) => (
                    <option key={struktur.id} value={struktur.id}>
                      {struktur.struktur}
                    </option>
                  ))}
                </select>
                {errors.struktur_id && (
                  <div className="text-red-500 text-xs mt-1">{errors.struktur_id}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Program Kerja <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={data.deskripsi}
                  onChange={(e) => setData('deskripsi', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  required
                />
                {errors.deskripsi && (
                  <div className="text-red-500 text-xs mt-1">{errors.deskripsi}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Mulai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={data.tanggal_mulai}
                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.tanggal_mulai && (
                    <div className="text-red-500 text-xs mt-1">{errors.tanggal_mulai}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Selesai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={data.tanggal_selesai}
                    onChange={(e) => setData('tanggal_selesai', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.tanggal_selesai && (
                    <div className="text-red-500 text-xs mt-1">{errors.tanggal_selesai}</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="belum_mulai">Belum Mulai</option>
                  <option value="sedang_berjalan">Sedang Berjalan</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditunda">Ditunda</option>
                </select>
                {errors.status && (
                  <div className="text-red-500 text-xs mt-1">{errors.status}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan (Opsional)
                </label>
                <textarea
                  value={data.keterangan}
                  onChange={(e) => setData('keterangan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="2"
                />
                {errors.keterangan && (
                  <div className="text-red-500 text-xs mt-1">{errors.keterangan}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Proker (Opsional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setData('file_proker', e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: PDF, DOC, DOCX (Max: 2MB)
                </p>
                {errors.file_proker && (
                  <div className="text-red-500 text-xs mt-1">{errors.file_proker}</div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {processing ? 'Menyimpan...' : editingProker ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Konfirmasi Hapus
              </h3>
              <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus program kerja ini? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
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
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-75"
              >
                {processing ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}


    </DashboardLayout>
  );
};

export default Proker; 