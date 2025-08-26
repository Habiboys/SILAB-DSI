import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const NilaiTambahanModal = ({ isOpen, onClose, tugas, praktikans, onSave }) => {
    const [formData, setFormData] = useState({
        praktikan_id: '',
        nilai: '',
        kategori: 'bonus',
        keterangan: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                praktikan_id: '',
                nilai: '',
                kategori: 'bonus',
                keterangan: ''
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.praktikan_id || !formData.nilai) {
            alert('Mohon lengkapi data praktikan dan nilai');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/praktikum/tugas/${tugas.id}/nilai-tambahan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success || response.ok) {
                onSave();
                onClose();
            } else {
                alert('Gagal menyimpan nilai tambahan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving nilai tambahan:', error);
            alert('Terjadi kesalahan saat menyimpan nilai tambahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Berikan Nilai Tambahan</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Praktikan *
                            </label>
                            <select
                                value={formData.praktikan_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, praktikan_id: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Pilih Praktikan</option>
                                {praktikans?.map((praktikan) => (
                                    <option key={praktikan.id} value={praktikan.id}>
                                        {praktikan.user?.name || praktikan.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori *
                            </label>
                            <select
                                value={formData.kategori}
                                onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
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
                                Nilai *
                            </label>
                            <input
                                type="number"
                                value={formData.nilai}
                                onChange={(e) => setFormData(prev => ({ ...prev, nilai: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nilai tambahan"
                                step="0.1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan
                            </label>
                            <textarea
                                value={formData.keterangan}
                                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                placeholder="Alasan pemberian nilai tambahan..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Berikan Nilai
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NilaiTambahanModal;
