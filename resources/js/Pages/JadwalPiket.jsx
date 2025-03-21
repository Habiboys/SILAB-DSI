import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

const JadwalPiket = ({ jadwalPiket, periode, periodes, users, message }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || '');
  
  const addForm = useForm({
    user_id: '',
    hari: '',
    periode_piket_id: periode?.id || '',
  });
  
  const editForm = useForm({
    user_id: '',
    hari: '',
    _method: 'PUT',
  });
  
  const deleteForm = useForm({
    _method: 'DELETE',
  });
  
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
  const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
  };
  
  const handlePeriodeChange = (e) => {
    const periodeId = e.target.value;
    setSelectedPeriode(periodeId);
    window.location.href = route('jadwal-piket.index', { periode_id: periodeId });
  };
  
  const openAddModal = () => {
    addForm.reset();
    addForm.setData('periode_piket_id', periode.id);
    setShowAddModal(true);
  };
  
  const openEditModal = (jadwal) => {
    setSelectedJadwal(jadwal);
    editForm.setData({
      user_id: jadwal.user_id,
      hari: jadwal.hari,
      _method: 'PUT',
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (jadwal) => {
    setSelectedJadwal(jadwal);
    setShowDeleteModal(true);
  };
  
  const handleAddSubmit = (e) => {
    e.preventDefault();
    addForm.post(route('jadwal-piket.store'), {
      onSuccess: () => {
        setShowAddModal(false);
      },
    });
  };
  
  const handleEditSubmit = (e) => {
    e.preventDefault();
    editForm.put(route('jadwal-piket.update', selectedJadwal.id), {
      onSuccess: () => {
        setShowEditModal(false);
      },
    });
  };
  
  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    deleteForm.delete(route('jadwal-piket.destroy', selectedJadwal.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
      },
    });
  };
  
  return (
    <DashboardLayout>
      <Head title="Jadwal Piket" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Jadwal Piket</h1>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriode}
              onChange={handlePeriodeChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Periode</option>
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({new Date(p.tanggal_mulai).toLocaleDateString()} - {new Date(p.tanggal_selesai).toLocaleDateString()})
                </option>
              ))}
            </select>
            
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
              disabled={!periode}
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              Tambah
            </button>
          </div>
        </div>
        
        {message && (
          <div className="bg-yellow-100 p-4 rounded-md">
            <p className="text-yellow-800">{message}</p>
          </div>
        )}
        
        {periode && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">
                Periode: {periode.nama} ({new Date(periode.tanggal_mulai).toLocaleDateString()} - {new Date(periode.tanggal_selesai).toLocaleDateString()})
                {periode.isactive && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Aktif
                  </span>
                )}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
              {days.map((day) => (
                <div key={day} className="bg-gray-100 rounded-lg">
                  <div className="bg-gray-200 p-3 rounded-t-lg font-medium flex justify-between items-center">
                    <span>{dayLabels[day]}</span>
                    <button
                      onClick={() => {
                        addForm.setData('hari', day);
                        addForm.setData('periode_piket_id', periode.id);
                        setShowAddModal(true);
                      }}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-3 space-y-3">
                    {jadwalPiket[day] && jadwalPiket[day].length > 0 ? (
                      jadwalPiket[day].map((jadwal) => (
                        <div key={jadwal.id} className="bg-white p-3 rounded-md shadow-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{jadwal.user.name}</div>
                              <div className="text-xs text-gray-500">
                                {jadwal.user.profile?.nomor_anggota || jadwal.user.profile?.nomor_induk || '-'}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => openEditModal(jadwal)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(jadwal)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-4">
                        Belum ada jadwal
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periode Piket Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Periode Piket</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minggu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodes.map((periode, index) => (
                  <tr key={periode.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Minggu {index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(periode.tanggal_mulai).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(periode.tanggal_selesai).toLocaleDateString()}
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
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-lg font-semibold">Tambah Jadwal Piket</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4">
                <label htmlFor="hari" className="block text-sm font-medium text-gray-700 mb-1">
                  Hari
                </label>
                <select
                  id="hari"
                  value={addForm.data.hari}
                  onChange={(e) => addForm.setData('hari', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Hari</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {dayLabels[day]}
                    </option>
                  ))}
                </select>
                {addForm.errors.hari && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.hari}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Anggota
                </label>
                <select
                  id="user_id"
                  value={addForm.data.user_id}
                  onChange={(e) => addForm.setData('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Anggota</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.profile?.nomor_anggota || user.profile?.nomor_induk || '-'}
                    </option>
                  ))}
                </select>
                {addForm.errors.user_id && (
                  <div className="text-red-500 text-sm mt-1">{addForm.errors.user_id}</div>
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
      {showEditModal && selectedJadwal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Jadwal Piket</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label htmlFor="edit_hari" className="block text-sm font-medium text-gray-700 mb-1">
                  Hari
                </label>
                <select
                  id="edit_hari"
                  value={editForm.data.hari}
                  onChange={(e) => editForm.setData('hari', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Hari</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {dayLabels[day]}
                    </option>
                  ))}
                </select>
                {editForm.errors.hari && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.hari}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit_user_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Anggota
                </label>
                <select
                  id="edit_user_id"
                  value={editForm.data.user_id}
                  onChange={(e) => editForm.setData('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Anggota</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.profile?.nomor_anggota || user.profile?.nomor_induk || '-'}
                    </option>
                  ))}
                </select>
                {editForm.errors.user_id && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.user_id}</div>
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
      {showDeleteModal && selectedJadwal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Hapus Jadwal Piket</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            
            <p className="mb-4">
              Apakah Anda yakin ingin menghapus jadwal piket untuk <strong>{selectedJadwal.user?.name}</strong> pada hari <strong>{dayLabels[selectedJadwal.hari]}</strong>?
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

export default JadwalPiket;