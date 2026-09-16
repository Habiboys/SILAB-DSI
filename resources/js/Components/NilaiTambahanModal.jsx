import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { X, Save, Search, ChevronDown } from 'lucide-react';
import Modal from './Modal';

const NilaiTambahanModal = ({ isOpen, onClose, tugas, praktikans, onSave }) => {
    // Debug: Log data yang diterima
    
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

    const handlePraktikanSelect = (praktikan) => {
        setSelectedPraktikan(praktikan);
        setFormData(prev => ({ ...prev, praktikan_id: praktikan.id }));
        setSearchQuery(praktikan.user?.name || praktikan.nama);
        setIsDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.praktikan_id || !formData.nilai) {
            toast.error('Mohon lengkapi data praktikan dan nilai');
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
                toast.error('Gagal menyimpan nilai tambahan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving nilai tambahan:', error);
            toast.error('Terjadi kesalahan saat menyimpan nilai tambahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
                <h2 className="text-lg font-semibold">Berikan Nilai Tambahan</h2>
                <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11" aria-label="Tutup">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 sm:p-5">

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">
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
                                        className="w-full border border-base-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-primary focus:border-primary"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/50" />
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="absolute right-3 top-2.5 h-4 w-4 text-base-content/50"
                                    >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredPraktikans.length > 0 ? (
                                            filteredPraktikans.map((praktikan) => (
                                                <button
                                                    key={praktikan.id}
                                                    type="button"
                                                    onClick={() => handlePraktikanSelect(praktikan)}
                                                    className="w-full text-left px-4 py-2 hover:bg-base-200 focus:bg-base-200 focus:outline-none"
                                                >
                                                    <div className="font-medium text-base-content">
                                                        {praktikan.user?.name || praktikan.nama}
                                                    </div>
                                                    <div className="text-sm text-base-content/60">
                                                        NIM: {praktikan.nim || 'N/A'}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-base-content/60 text-center">
                                                {searchQuery ? 'Tidak ada praktikan yang sesuai' : 'Ketik untuk mencari praktikan'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {selectedPraktikan && (
                                <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded-md">
                                    <div className="text-sm font-medium text-primary">
                                        Dipilih: {selectedPraktikan.user?.name || selectedPraktikan.nama}
                                    </div>
                                    <div className="text-xs text-primary">
                                        NIM: {selectedPraktikan.nim || 'N/A'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">
                                Kategori *
                            </label>
                            <select
                                value={formData.kategori}
                                onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                                className="w-full border border-base-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="bonus">Bonus</option>
                                <option value="partisipasi">Partisipasi</option>
                                <option value="keaktifan">Keaktifan</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">
                                Nilai *
                            </label>
                            <input
                                type="number"
                                value={formData.nilai}
                                onChange={(e) => setFormData(prev => ({ ...prev, nilai: e.target.value }))}
                                className="w-full border border-base-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Nilai tambahan"
                                step="0.1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">
                                Keterangan
                            </label>
                            <textarea
                                value={formData.keterangan}
                                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                                className="w-full border border-base-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                                rows="3"
                                placeholder="Alasan pemberian nilai tambahan..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-base-300 rounded-md text-base-content hover:bg-base-200"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-success text-white rounded-md hover:bg-success disabled:opacity-50 flex items-center"
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
        </Modal>
    );
};

export default NilaiTambahanModal;
