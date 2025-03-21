import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const PeriodePiket = ({ periodePiket }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  
  const addForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
  });
  
  const editForm = useForm({
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    isactive: false,
    _method: 'PUT',
  });
  
  const deleteForm = useForm({
    _method: 'DELETE',
  });
  
  const openAddModal = () => {
    addForm.reset();
    setShowAddModal(true);
  };
  
  const openEditModal = (periode) => {
    setSelectedPeriode(periode);
    editForm.setData({
      nama: periode.nama,
      tanggal_mulai: periode.tanggal_mulai,
      tanggal_selesai: periode.tanggal_selesai,
      isactive: periode.isactive,
      _method: 'PUT',
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (periode) => {
    setSelectedPeriode(periode);
    setShowDeleteModal(true);
  };
  
  const handleAddSubmit = (e) => {
    e.preventDefault();
    addForm.post(route('periode-piket.store'), {
      onSuccess: () => {
        setShowAddModal(false);
      },
    });
  };
  
  const handleEditSubmit = (e) => {
    e.preventDefault();
    editForm.put(route('periode-piket.update', selectedPeriode.id), {
      onSuccess: () => {
        setShowEditModal(false);
      },
    });
  };
  
  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    deleteForm.delete(route('periode-piket.destroy', selectedPeriode.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
      },
    });
  };
  
  return (
    <DashboardLayout>
      <Head title="Periode Piket" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Periode Piket</h1>
          
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            Tambah
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodePiket.length > 0 ? (
                  periodePiket.map((periode, index) => (
                    <tr key={periode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {periode.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(periode.tanggal_mulai).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(periode.tanggal_selesai).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          periode.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {periode.isactive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(periode)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(periode)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Tidak ada data periode piket
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Periode Piket</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4">
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Periode
                </label>
                <input
                  id="nama"
                  type="text"
                  value={addForm.data.nama}
                  onChange={(e) => addForm.setData('nama', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {addForm.errors.nama && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.nama}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  id="tanggal_mulai"
                  type="date"
                  value={addForm.data.tanggal_mulai}
                  onChange={(e) => addForm.setData('tanggal_mulai', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {addForm.errors.tanggal_mulai && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.tanggal_mulai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  id="tanggal_selesai"
                  type="date"
                  value={addForm.data.tanggal_selesai}
                  onChange={(e) => addForm.setData('tanggal_selesai', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {addForm.errors.tanggal_selesai && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.tanggal_selesai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="isactive"
                    type="checkbox"
                    checked={addForm.data.isactive}
                    onChange={(e) => addForm.setData('isactive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isactive" className="ml-2 block text-sm text-gray-700">
                    Aktifkan Periode
                  </label>
                </div>
                {addForm.errors.isactive && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.isactive}</div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Periode Piket</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="edit_nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Periode
                </label>
                <input
                  id="edit_nama"
                  type="text"
                  value={editForm.data.nama}
                  onChange={(e) => editForm.setData('nama', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {editForm.errors.nama && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.nama}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit_tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  id="edit_tanggal_mulai"
                  type="date"
                  value={editForm.data.tanggal_mulai}
                  onChange={(e) => editForm.setData('tanggal_mulai', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {editForm.errors.tanggal_mulai && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.tanggal_mulai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit_tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  id="edit_tanggal_selesai"
                  type="date"
                  value={editForm.data.tanggal_selesai}
                  onChange={(e) => editForm.setData('tanggal_selesai', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {editForm.errors.tanggal_selesai && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.tanggal_selesai}</div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="edit_isactive"
                    type="checkbox"
                    checked={editForm.data.isactive}
                    onChange={(e) => editForm.setData('isactive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="edit_isactive" className="ml-2 block text-sm text-gray-700">
                    Aktifkan Periode
                  </label>
                </div>
                {editForm.errors.isactive && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.isactive}</div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {showDeleteModal && selectedPeriode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Hapus Periode Piket</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <p className="mb-4">
              Apakah Anda yakin ingin menghapus periode piket <strong>{selectedPeriode.nama}</strong>?
              {selectedPeriode.isactive && (
                <span className="block text-red-600 mt-2">
                  Periode ini saat ini aktif. Menghapusnya dapat mempengaruhi jadwal piket yang sedang berjalan.
                </span>
              )}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteForm.processing}
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

export default PeriodePiket;