import React, { useState, useEffect } from 'react';
import { X, Save, Search, ChevronDown } from 'lucide-react';

const NilaiTambahanModal = ({ isOpen, onClose, tugas, praktikans, onSave }) => {
    // Debug: Log data yang diterima
    console.log('NilaiTambahanModal props:', { tugas, praktikans });
    console.log('Total praktikans:', praktikans?.length);
    
    const [formData, setFormData] = useState({
        praktikan_id: '',
        nilai: '',
        kategori: 'bonus',
        keterangan: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedPraktikan, setSelectedPraktikan] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                praktikan_id: '',
                nilai: '',
                kategori: 'bonus',
                keterangan: ''
            });
            setSearchQuery('');
            setSelectedPraktikan(null);
            setIsDropdownOpen(false);
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.praktikan-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Filter praktikan berdasarkan search query
    const filteredPraktikans = praktikans?.filter(praktikan => {
        const searchLower = searchQuery.toLowerCase();
        const nama = (praktikan.user?.name || praktikan.nama || '').toLowerCase();
        const nim = (praktikan.nim || '').toLowerCase();
        return nama.includes(searchLower) || nim.includes(searchLower);
    }) || [];
    
    // Debug: Log filter results
    console.log('Filtered praktikans:', filteredPraktikans);
    console.log('Search query:', searchQuery);

    const handlePraktikanSelect = (praktikan) => {
        setSelectedPraktikan(praktikan);
        setFormData(prev => ({ ...prev, praktikan_id: praktikan.id }));
        setSearchQuery(praktikan.user?.name || praktikan.nama);
        setIsDropdownOpen(false);
    };

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
                            <div className="relative praktikan-dropdown">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau NIM praktikan..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (!e.target.value) {
                                                setSelectedPraktikan(null);
                                                setFormData(prev => ({ ...prev, praktikan_id: '' }));
                                            }
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"
                                    >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredPraktikans.length > 0 ? (
                                            filteredPraktikans.map((praktikan) => (
                                                <button
                                                    key={praktikan.id}
                                                    type="button"
                                                    onClick={() => handlePraktikanSelect(praktikan)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                >
                                                    <div className="font-medium text-gray-900">
                                                        {praktikan.user?.name || praktikan.nama}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        NIM: {praktikan.nim || 'N/A'}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500 text-center">
                                                {searchQuery ? 'Tidak ada praktikan yang sesuai' : 'Ketik untuk mencari praktikan'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {selectedPraktikan && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="text-sm font-medium text-blue-900">
                                        Dipilih: {selectedPraktikan.user?.name || selectedPraktikan.nama}
                                    </div>
                                    <div className="text-xs text-blue-700">
                                        NIM: {selectedPraktikan.nim || 'N/A'}
                                    </div>
                                </div>
                            )}
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
