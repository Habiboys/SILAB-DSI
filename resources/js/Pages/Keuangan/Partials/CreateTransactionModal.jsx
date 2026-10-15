import Button from "@/Components/Button";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";

export default function CreateTransactionModal({ isCreateModalOpen, setIsCreateModalOpen, handleCreate, createForm, handleJenisChange, isUangKas, handleUangKasChange, selectedAnggota, handleAnggotaChange, asisten, currentNominalKas, formatCurrency }) {
    return (
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Transaksi
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="text-base-content/60 hover:text-base-content/80"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <form
                        onSubmit={handleCreate}
                        encType="multipart/form-data"
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Tanggal" error={createForm.errors.tanggal} required>
                                <input
                                    type="date"
                                    name="tanggal"
                                    className="input min-h-11 w-full"
                                    value={
                                        createForm.data.tanggal ||
                                        new Date().toISOString().split("T")[0]
                                    }
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tanggal",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FormField>
                            <FormField label="Jenis Transaksi" error={createForm.errors.jenis} required>
                                <select
                                    name="jenis"
                                    className="select min-h-11 w-full"
                                    value={createForm.data.jenis}
                                    onChange={handleJenisChange}
                                    required
                                >
                                    <option value="masuk">Pemasukan</option>
                                    <option value="keluar">Pengeluaran</option>
                                </select>
                            </FormField>
                        </div>

                        {createForm.data.jenis === "masuk" && (
                            <label className="flex min-h-11 cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_uang_kas"
                                    name="is_uang_kas"
                                    checked={isUangKas}
                                    onChange={handleUangKasChange}
                                    className="checkbox checkbox-primary"
                                />
                                <span className="text-sm">Uang Kas</span>
                            </label>
                        )}

                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Pilih Anggota" error={createForm.errors.user_id} required>
                                <select
                                    name="user_id"
                                    className="select min-h-11 w-full"
                                    value={selectedAnggota}
                                    onChange={handleAnggotaChange}
                                    required
                                >
                                    <option value="">Pilih Anggota</option>
                                    {asisten?.map((anggota) => (
                                        <option
                                            key={anggota.id}
                                            value={anggota.id}
                                        >
                                            {anggota.name} -{" "}
                                            {anggota.profile.nomor_anggota}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        )}

                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Nominal Kas Acuan (Otomatis)" error={createForm.errors.nominal_kas_id}>
                                <div className="w-full rounded-md border border-base-300 bg-base-200 px-3 py-2 text-sm text-base-content/80">
                                    {currentNominalKas
                                        ? `${formatCurrency(currentNominalKas.nominal)} • ${currentNominalKas.periode} (aktif)`
                                        : "Nominal kas aktif belum tersedia"}
                                </div>
                                <input
                                    type="hidden"
                                    name="nominal_kas_id"
                                    value={createForm.data.nominal_kas_id || ""}
                                />
                            </FormField>
                        )}

                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Jenis Pembayaran" hint={'Pilih "Normal" jika pembayaran untuk periode selanjutnya, atau "Lebih" jika hanya bonus/tambahan'} error={createForm.errors.jenis_pembayaran_kas} required>
                                <select
                                    name="jenis_pembayaran_kas"
                                    className="select min-h-11 w-full"
                                    value={createForm.data.jenis_pembayaran_kas}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "jenis_pembayaran_kas",
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">
                                        Pilih jenis pembayaran...
                                    </option>
                                    <option value="normal">
                                        Normal (untuk periode selanjutnya)
                                    </option>
                                    <option value="lebih">
                                        Lebih (bonus/tambahan)
                                    </option>
                                </select>
                            </FormField>
                        )}

                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Catatan Pembayaran (Opsional)" error={createForm.errors.catatan_pembayaran}>
                                <textarea
                                    name="catatan_pembayaran"
                                    className="textarea w-full"
                                    value={createForm.data.catatan_pembayaran}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "catatan_pembayaran",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    placeholder="Catatan tambahan untuk pembayaran ini..."
                                />
                            </FormField>
                        )}

                        <FormField label="Nominal" error={createForm.errors.nominal} required>
                            <input
                                type="number"
                                name="nominal"
                                className="input min-h-11 w-full"
                                value={createForm.data.nominal}
                                onChange={(e) =>
                                    createForm.setData(
                                        "nominal",
                                        e.target.value,
                                    )
                                }
                                min="500"
                                step="500"
                                required
                            />
                        </FormField>

                        {!isUangKas || createForm.data.jenis !== "masuk" ? (
                            <FormField label="Deskripsi" error={createForm.errors.deskripsi} required>
                                <textarea
                                    name="deskripsi"
                                    className="textarea w-full"
                                    value={createForm.data.deskripsi}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "deskripsi",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    rows="2"
                                ></textarea>
                            </FormField>
                        ) : (

                            <input
                                type="hidden"
                                name="deskripsi"
                                value={createForm.data.deskripsi}
                            />
                        )}

                        <FormField label="Bukti Transaksi (Opsional)" error={createForm.errors.bukti}>
                            <input
                                type="file"
                                name="bukti"
                                id="bukti"
                                accept="image/*"
                                onChange={(e) =>
                                    createForm.setData("bukti", e.target.files[0])
                                }
                                className="file-input file-min-h-11 w-full"
                            />
                        </FormField>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                            <Button type="submit" loading={createForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>
    );
}
