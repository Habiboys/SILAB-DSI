import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';

const ManageNilaiTambahanModal = ({ isOpen, onClose, submission, tugas, onSave }) => {
    const [nilaiTambahans, setNilaiTambahans] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        nilai: '',
        kategori: '',
        keterangan: ''
    });

    useEffect(() => {
        if (isOpen && submission) {
            loadNilaiTambahans();
        }
    }, [isOpen, submission]);

    const loadNilaiTambahans = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/praktikum/tugas/${tugas.id}/praktikan/${submission.praktikan_id}/nilai-tambahan`);
            if (response.ok) {
                const data = await response.json();
                setNilaiTambahans(data.data || []);
            }
        } catch (error) {
            console.error('Error loading nilai tambahan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (nilai) => {
        setEditingId(nilai.id);
        setEditForm({
            nilai: nilai.nilai.toString(),
            kategori: nilai.kategori,
            keterangan: nilai.keterangan || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({
            nilai: '',
            kategori: '',
            keterangan: ''
        });
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`/praktikum/tugas/${tugas.id}/nilai-tambahan/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                await loadNilaiTambahans();
                handleCancelEdit();
                onSave();
            } else {
                alert('Gagal mengupdate nilai tambahan');
            }
        } catch (error) {
            console.error('Error updating nilai tambahan:', error);
            alert('Terjadi kesalahan saat mengupdate nilai tambahan');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus nilai tambahan ini?')) {
            return;
        }

        try {
            const response = await fetch(`/praktikum/tugas/${tugas.id}/nilai-tambahan/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.ok) {
                await loadNilaiTambahans();
                onSave();
            } else {
                alert('Gagal menghapus nilai tambahan');
            }
        } catch (error) {
            console.error('Error deleting nilai tambahan:', error);
            alert('Terjadi kesalahan saat menghapus nilai tambahan');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        Kelola Nilai Tambahan - {submission?.praktikan?.nama}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Memuat data...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {nilaiTambahans.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Belum ada nilai tambahan untuk praktikan ini</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {nilaiTambahans.map((nilai) => (
                                    <div key={nilai.id} className="border rounded-lg p-4">
                                        {editingId === nilai.id ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Kategori
                                                        </label>
                                                        <select
                                                            value={editForm.kategori}
                                                            onChange={(e) => setEditForm(prev => ({ ...prev, kategori: e.target.value }))}
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="bonus">Bonus</option>
                                                            <option value="partisipasi">Partisipasi</option>
                                                            <option value="keaktifan">Keaktifan</option>
                                                            <option value="lainnya">Lainnya</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Nilai
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={editForm.nilai}
                                                            onChange={(e) => setEditForm(prev => ({ ...prev, nilai: e.target.value }))}
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Keterangan
                                                    </label>
                                                    <textarea
                                                        value={editForm.keterangan}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, keterangan: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        rows="2"
                                                    />
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                    >
                                                        Simpan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {nilai.kategori}
                                                        </span>
                                                        <span className="text-lg font-semibold text-green-600">
                                                            +{parseFloat(nilai.nilai).toFixed(1)}
                                                        </span>
                                                    </div>
                                                    {nilai.keterangan && (
                                                        <p className="text-sm text-gray-600 mb-2">{nilai.keterangan}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        Diberikan pada: {new Date(nilai.diberikan_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(nilai)}
                                                        className="p-1 text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(nilai.id)}
                                                        className="p-1 text-red-600 hover:text-red-800"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageNilaiTambahanModal;
