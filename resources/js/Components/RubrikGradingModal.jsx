import { Save, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from 'sonner';
import Modal from './Modal';

const RubrikGradingModal = ({ isOpen, onClose, submission, tugas, onSave }) => {
    const [nilaiRubrik, setNilaiRubrik] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (isOpen && tugas.komponen_rubriks) {
            // Initialize nilai rubrik
            const initialNilai = {};
            tugas.komponen_rubriks.forEach((komponen) => {
                // Check if there's existing nilai for this komponen
                const existingNilai = submission?.nilai_rubriks?.find(
                    (nr) => nr.komponen_rubrik_id === komponen.id
                );

                initialNilai[komponen.id] = {
                    nilai: existingNilai?.nilai || "",
                    catatan: existingNilai?.catatan || "",
                };
            });
            setNilaiRubrik(initialNilai);
        }
    }, [isOpen, tugas.komponen_rubriks, submission]);

    const handleNilaiChange = (komponenId, field, value) => {
        setNilaiRubrik((prev) => ({
            ...prev,
            [komponenId]: {
                ...prev[komponenId],
                [field]: value,
            },
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
                nilai_rubrik: tugas.komponen_rubriks.map((komponen) => ({
                    komponen_rubrik_id: komponen.id,
                    nilai: parseFloat(nilaiRubrik[komponen.id].nilai),
                    catatan: nilaiRubrik[komponen.id].catatan,
                })),
            };


            const response = await fetch(
                route("praktikum.submission.rubrik-grade"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document
                            .querySelector('meta[name="csrf-token"]')
                            .getAttribute("content"),
                    },
                    body: JSON.stringify(requestData),
                }
            );

            if (response.ok) {
                const result = await response.json();

                // Tutup modal
                onClose();

                // Reload data menggunakan Inertia router
                if (onSave) {
                    onSave();
                }
            } else {
                // Debug: log response

                let errorMessage =
                    "Terjadi kesalahan saat menyimpan nilai rubrik";

                try {
                    const errorData = await response.text();

                    // Coba parse sebagai JSON
                    try {
                        const errorJson = JSON.parse(errorData);
                        errorMessage = errorJson.message || errorMessage;
                    } catch (e) {
                        // Jika bukan JSON, handle HTML error response
                        if (
                            errorData.includes("<!DOCTYPE") ||
                            errorData.includes("<html")
                        ) {
                            errorMessage =
                                "Terjadi kesalahan server. Silakan coba lagi.";
                        } else {
                            errorMessage = errorData || errorMessage;
                        }
                    }
                } catch (e) {
                }

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Error saving rubrik grade:", error);
            toast.error("Terjadi kesalahan: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateTotal = () => {
        let total = 0;
        let totalBobot = 0;

        tugas.komponen_rubriks?.forEach((komponen) => {
            const nilai = nilaiRubrik[komponen.id]?.nilai;

            if (nilai && nilai !== "" && !isNaN(parseFloat(nilai))) {
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
                }
            }
        });


        if (totalBobot > 0) {
            const result = total.toFixed(2);
            return result;
        } else {
            return "0.00";
        }
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
                <h2 className="text-lg font-semibold">
                    Penilaian Rubrik - {submission?.praktikan?.user?.name}
                </h2>
                <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11" aria-label="Tutup">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">

                {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                    <div className="space-y-6">
                        {tugas.komponen_rubriks.map((komponen) => (
                            <div
                                key={komponen.id}
                                className="border border-base-300 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-base-content">
                                        {komponen.nama_komponen}
                                    </h3>
                                    <div className="flex space-x-2">
                                        <span className="bg-success/15 text-success px-2 py-1 rounded text-sm">
                                            {komponen.bobot}%
                                        </span>
                                        <span className="bg-warning/20 text-warning px-2 py-1 rounded text-sm">
                                            Max: {komponen.nilai_maksimal}
                                        </span>
                                    </div>
                                </div>

                                {komponen.deskripsi && (
                                    <p className="text-base-content/70 text-sm mb-3">
                                        {komponen.deskripsi}
                                    </p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-base-content mb-1">
                                            Nilai (0 - {komponen.nilai_maksimal}
                                            ) *
                                        </label>
                                        <input
                                            type="number"
                                            value={
                                                nilaiRubrik[komponen.id]
                                                    ?.nilai || ""
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const maxValue = parseFloat(
                                                    komponen.nilai_maksimal
                                                );

                                                // Validasi nilai tidak boleh melebihi maksimal
                                                // Gunakan toleransi kecil untuk presisi floating point
                                                if (
                                                    parseFloat(value) >
                                                    maxValue + 0.01
                                                ) {
                                                    toast.error(`Nilai tidak boleh melebihi ${maxValue}`);
                                                    return;
                                                }

                                                handleNilaiChange(
                                                    komponen.id,
                                                    "nilai",
                                                    value
                                                );
                                            }}
                                            className="w-full border border-base-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                                            min="0"
                                            max={komponen.nilai_maksimal}
                                            step="0.1"
                                            placeholder={`0 - ${komponen.nilai_maksimal}`}
                                        />
                                        {nilaiRubrik[komponen.id]?.nilai &&
                                            parseFloat(
                                                nilaiRubrik[komponen.id].nilai
                                            ) >
                                                parseFloat(
                                                    komponen.nilai_maksimal
                                                ) && (
                                                <p className="text-error text-xs mt-1">
                                                    Nilai melebihi maksimal yang
                                                    diizinkan
                                                </p>
                                            )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-base-content mb-1">
                                            Catatan
                                        </label>
                                        <textarea
                                            value={
                                                nilaiRubrik[komponen.id]
                                                    ?.catatan || ""
                                            }
                                            onChange={(e) =>
                                                handleNilaiChange(
                                                    komponen.id,
                                                    "catatan",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border border-base-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                                            rows="2"
                                            placeholder="Catatan untuk komponen ini..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Total Nilai */}
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-base-content">
                                    Total Nilai Akhir:
                                </span>
                                <span className="text-2xl font-bold text-primary">
                                    {(() => {
                                        const total = calculateTotal();
                                        return total && total !== "0.00"
                                            ? `${total}%`
                                            : "0.00%";
                                    })()}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-base-content/70">
                                Nilai dihitung berdasarkan bobot komponen rubrik
                                (maksimal 100%)
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-base-300 rounded-md text-base-content hover:bg-base-200"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50 flex items-center"
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
                    <div className="py-8 text-center text-base-content/60">
                        <p>Belum ada komponen rubrik untuk tugas ini.</p>
                        <p className="mt-2 text-sm">Silakan buat komponen rubrik terlebih dahulu.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default RubrikGradingModal;
