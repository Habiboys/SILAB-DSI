import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';

const RubrikGradingModal = ({ isOpen, onClose, submission, tugas, onSave }) => {
    const [nilaiRubrik, setNilaiRubrik] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen && tugas.komponen_rubriks) {
            // Initialize nilai rubrik
            const initialNilai = {};
            tugas.komponen_rubriks.forEach(komponen => {
                // Check if there's existing nilai for this komponen
                const existingNilai = submission?.nilai_rubriks?.find(nr => nr.komponen_rubrik_id === komponen.id);
                
                initialNilai[komponen.id] = {
                    nilai: existingNilai?.nilai || '',
                    catatan: existingNilai?.catatan || ''
                };
            });
            setNilaiRubrik(initialNilai);
        }
    }, [isOpen, tugas.komponen_rubriks, submission]);

    const handleNilaiChange = (komponenId, field, value) => {
        setNilaiRubrik(prev => ({
            ...prev,
            [komponenId]: {
                ...prev[komponenId],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const requestData = {
                tugas_id: tugas.id, // Tambahkan tugas_id untuk kasus praktikan yang belum submit
                pengumpulan_tugas_id: submission.id || null, // Bisa null untuk praktikan yang belum submit
                praktikan_id: submission.praktikan_id,
                nilai_rubrik: tugas.komponen_rubriks.map(komponen => ({
                    komponen_rubrik_id: komponen.id,
                    nilai: parseFloat(nilaiRubrik[komponen.id].nilai),
                    catatan: nilaiRubrik[komponen.id].catatan
                }))
            };

            console.log('Sending request data:', requestData);

            const response = await fetch(route('praktikum.submission.rubrik-grade'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Success:', result);
                
                // Tutup modal
                onClose();
                
                // Reload data menggunakan Inertia router
                if (onSave) {
                    onSave();
                }
            } else {
                // Debug: log response
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                let errorMessage = 'Terjadi kesalahan saat menyimpan nilai rubrik';
                
                try {
                    const errorData = await response.text();
                    console.log('Error response:', errorData);
                    
                    // Coba parse sebagai JSON
                    try {
                        const errorJson = JSON.parse(errorData);
                        errorMessage = errorJson.message || errorMessage;
                    } catch (e) {
                        // Jika bukan JSON, handle HTML error response
                        if (errorData.includes('<!DOCTYPE') || errorData.includes('<html')) {
                            errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
                        } else {
                            errorMessage = errorData || errorMessage;
                        }
                    }
                } catch (e) {
                    console.log('Error reading response:', e);
                }
                
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error saving rubrik grade:', error);
            toast.error('Terjadi kesalahan: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateTotal = () => {
        let total = 0;
        let totalBobot = 0;

        // Debug: log nilai yang sedang dihitung
        console.log('Calculating total with nilaiRubrik:', nilaiRubrik);
        console.log('Komponen rubriks:', tugas.komponen_rubriks);

        tugas.komponen_rubriks?.forEach(komponen => {
            const nilai = nilaiRubrik[komponen.id]?.nilai;
            console.log(`Komponen ${komponen.id}: nilai=${nilai}, bobot=${komponen.bobot}, max=${komponen.nilai_maksimal}`);
            
            if (nilai && nilai !== '' && !isNaN(parseFloat(nilai))) {
                const nilaiFloat = parseFloat(nilai);
                const maxFloat = parseFloat(komponen.nilai_maksimal);
                const bobotFloat = parseFloat(komponen.bobot);
                
                // Pastikan semua nilai valid
                if (nilaiFloat >= 0 && maxFloat > 0 && bobotFloat >= 0) {
                    // Cap nilai pada maksimal yang diizinkan
                    const nilaiCapped = Math.min(nilaiFloat, maxFloat);
                    
                    // Hitung persentase dari nilai maksimal
                    const persentaseNilai = (nilaiCapped / maxFloat) * 100;
                    
                    // Hitung kontribusi berdasarkan bobot
                    const kontribusi = (persentaseNilai * bobotFloat) / 100;
                    
                    total += kontribusi;
                    totalBobot += bobotFloat;
                    
                    console.log(`  Nilai asli: ${nilaiFloat}, Capped: ${nilaiCapped}`);
                    console.log(`  Persentase: ${nilaiCapped}/${maxFloat} * 100 = ${persentaseNilai}%`);
                    console.log(`  Kontribusi: ${persentaseNilai}% * ${bobotFloat}% = ${kontribusi}%`);
                }
            }
        });

        console.log(`Total: ${total}%, Total Bobot: ${totalBobot}%`);
        
        if (totalBobot > 0) {
            const result = total.toFixed(2);
            console.log(`Final result: ${result}%`);
            return result;
        } else {
            console.log('No valid values, returning 0');
            return '0.00';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                        Penilaian Rubrik - {submission?.praktikan?.user?.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                    <div className="space-y-6">
                        {tugas.komponen_rubriks.map((komponen) => (
                            <div key={komponen.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{komponen.nama_komponen}</h3>
                                    <div className="flex space-x-2">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                            {komponen.bobot}%
                                        </span>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                            Max: {komponen.nilai_maksimal}
                                        </span>
                                    </div>
                                </div>
                                
                                {komponen.deskripsi && (
                                    <p className="text-gray-600 text-sm mb-3">{komponen.deskripsi}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nilai (0 - {komponen.nilai_maksimal}) *
                                        </label>
                                        <input
                                            type="number"
                                            value={nilaiRubrik[komponen.id]?.nilai || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const maxValue = parseFloat(komponen.nilai_maksimal);
                                                
                                                // Validasi nilai tidak boleh melebihi maksimal
                                                if (parseFloat(value) > maxValue) {
                                                    alert(`Nilai tidak boleh melebihi ${maxValue}`);
                                                    return;
                                                }
                                                
                                                handleNilaiChange(komponen.id, 'nilai', value);
                                            }}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            min="0"
                                            max={komponen.nilai_maksimal}
                                            step="0.1"
                                            placeholder={`0 - ${komponen.nilai_maksimal}`}
                                        />
                                        {nilaiRubrik[komponen.id]?.nilai && parseFloat(nilaiRubrik[komponen.id].nilai) > parseFloat(komponen.nilai_maksimal) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                Nilai melebihi maksimal yang diizinkan
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Catatan
                                        </label>
                                        <textarea
                                            value={nilaiRubrik[komponen.id]?.catatan || ''}
                                            onChange={(e) => handleNilaiChange(komponen.id, 'catatan', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            rows="2"
                                            placeholder="Catatan untuk komponen ini..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Total Nilai */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Total Nilai Akhir:</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {(() => {
                                        const total = calculateTotal();
                                        console.log('Displaying total:', total);
                                        return total && total !== '0.00' ? `${total}%` : '0.00%';
                                    })()}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                Nilai dihitung berdasarkan bobot komponen rubrik (maksimal 100%)
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan Nilai
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>Belum ada komponen rubrik untuk tugas ini.</p>
                        <p className="text-sm mt-2">Silakan buat komponen rubrik terlebih dahulu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RubrikGradingModal;
