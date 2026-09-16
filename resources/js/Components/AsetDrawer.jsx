import { router, useForm } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Badge from "@/Components/Badge";
import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import Drawer from "@/Components/Drawer";
import FormField from "@/Components/FormField";
import StatusBadge from "@/Components/StatusBadge";

const TABS = [
    { id: "detail", label: "Detail" },
    { id: "edit", label: "Sunting" },
    { id: "kondisi", label: "Riwayat & Kondisi" },
    { id: "pinjam", label: "Peminjaman" },
    { id: "riwayat-pinjam", label: "Riwayat Peminjaman" },
    { id: "kembali", label: "Pengembalian" },
];

function InfoRow({ label, value }) {
    return (
        <div className="flex gap-3 border-b border-base-300 py-2 last:border-0">
            <span className="w-32 shrink-0 text-xs text-base-content/60">{label}</span>
            <span className="flex-1 text-sm">{value ?? "—"}</span>
        </div>
    );
}

const KEADAAN_TONE = { baik: "success", rusak: "error", hilang: "neutral" };
const STATUS_TONE = { tersedia: "info", dipinjam: "warning" };

export default function AsetDrawer({ item, onClose, canUpdate, canDelete }) {
    const CLOSE_ANIMATION_MS = 220;
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("detail");
    const [riwayat, setRiwayat] = useState([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);
    const [riwayatPeminjaman, setRiwayatPeminjaman] = useState([]);
    const [riwayatPeminjamanLoading, setRiwayatPeminjamanLoading] = useState(false);
    const [expandedPeminjamanId, setExpandedPeminjamanId] = useState(null);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const closeTimerRef = useRef(null);

    // Buka dengan checkbox masih false lalu nyalakan di frame berikutnya supaya
    // transisi geser drawer-side sempat berjalan.
    useEffect(() => {
        if (!item) return;
        const rafId = requestAnimationFrame(() => setOpen(true));
        return () => cancelAnimationFrame(rafId);
    }, [item?.id]);

    const requestClose = useCallback(() => {
        if (closeTimerRef.current) return;
        setOpen(false);
        closeTimerRef.current = setTimeout(onClose, CLOSE_ANIMATION_MS);
    }, [onClose]);

    useEffect(() => () => clearTimeout(closeTimerRef.current), []);

    const loadRiwayat = () => {
        if (!item) return;
        setRiwayatLoading(true);
        fetch(route("detail-inventaris.riwayat-kondisi", item.id))
            .then((r) => r.json())
            .then((d) => setRiwayat(Array.isArray(d) ? d : []))
            .catch(() => setRiwayat([]))
            .finally(() => setRiwayatLoading(false));
    };

    const loadRiwayatPeminjaman = () => {
        if (!item) return;
        setRiwayatPeminjamanLoading(true);
        fetch(route("detail-inventaris.riwayat-peminjaman", item.id))
            .then((r) => r.json())
            .then((d) => setRiwayatPeminjaman(Array.isArray(d) ? d : []))
            .catch(() => setRiwayatPeminjaman([]))
            .finally(() => setRiwayatPeminjamanLoading(false));
    };

    useEffect(() => {
        if (activeTab === "kondisi" && item) loadRiwayat();
    }, [activeTab, item?.id]);

    useEffect(() => {
        if ((activeTab === "riwayat-pinjam" || activeTab === "kembali") && item) loadRiwayatPeminjaman();
    }, [activeTab, item?.id]);

    // ── Edit form ──────────────────────────────────────────────────────────
    const editForm = useForm({
        nama: "",
        kode_barang: "",
        keadaan: "baik",
        status: "tersedia",
        keterangan: "",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "",
        foto: null,
        _method: "PUT",
    });

    useEffect(() => {
        if (item) {
            editForm.setData({
                nama: item.nama || "",
                kode_barang: item.kode_barang || "",
                keadaan: item.keadaan || "baik",
                status: item.status || "tersedia",
                keterangan: item.keterangan || "",
                tanggal_perolehan: item.tanggal_perolehan ? item.tanggal_perolehan.substring(0, 10) : "",
                harga_perolehan: item.harga_perolehan || "",
                asal_barang: item.asal_barang || "",
                foto: null,
                _method: "PUT",
            });
        }
    }, [item?.id]);

    const handleEdit = (e) => {
        e.preventDefault();
        router.post(route("detail-inventaris.update", item.id), { ...editForm.data, _method: "PUT", foto: editForm.data.foto }, {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Aset berhasil diperbarui");
                requestClose();
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui aset"),
        });
    };

    // ── Kondisi form ───────────────────────────────────────────────────────
    const kondisiForm = useForm({
        keadaan: item?.keadaan || "baik",
        catatan: "",
        tanggal_pencatatan: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (item) kondisiForm.setData("keadaan", item.keadaan);
    }, [item?.id]);

    const handleKondisi = (e) => {
        e.preventDefault();
        kondisiForm.post(route("detail-inventaris.update-kondisi", item.id), {
            onSuccess: () => {
                toast.success("Kondisi berhasil diperbarui");
                kondisiForm.reset();
                loadRiwayat();
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui kondisi"),
        });
    };

    // ── Pinjam form ────────────────────────────────────────────────────────
    // Single-aset peminjaman dari drawer: kirim aset_ids[] berisi 1 elemen
    // (backend juga kompatibel dengan field aset_id legacy).
    const pinjamForm = useForm({
        "aset_ids[]": item?.id || "",
        nama_peminjam: "",
        institusi: "",
        keperluan: "",
        tanggal_pinjam: new Date().toISOString().split("T")[0],
        tanggal_kembali_rencana: "",
        catatan: "",
        surat_peminjaman: null,
    });

    useEffect(() => {
        if (item) pinjamForm.setData("aset_ids[]", item.id);
    }, [item?.id]);

    const handlePinjam = (e) => {
        e.preventDefault();
        pinjamForm.post(route("inventaris.peminjaman.store"), {
            forceFormData: true,
            onSuccess: () => {
                pinjamForm.reset();
                requestClose();
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal mencatat peminjaman"),
        });
    };

    // ── Pengembalian form ──────────────────────────────────────────────────
    const kembaliForm = useForm({
        tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
        catatan_kembali: "",
        kondisi_setelah_kembali: "",
    });

    useEffect(() => {
        if (!item) return;
        kembaliForm.setData({
            tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
            catatan_kembali: "",
            kondisi_setelah_kembali: item.keadaan === "baik" || item.keadaan === "rusak" ? item.keadaan : "",
        });
    }, [item?.id]);

    const handleKembalikan = (e) => {
        e.preventDefault();
        if (!activePeminjamanId) {
            toast.error("Data peminjaman aktif tidak ditemukan.");
            return;
        }
        // Pengembalian per-item: activePeminjamanId di sini = id item
        kembaliForm.post(route("inventaris.peminjaman.kembalikan-item", activePeminjamanId), {
            onSuccess: () => requestClose(),
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal mencatat pengembalian aset"),
        });
    };

    const handleDelete = () => {
        router.delete(route("detail-inventaris.destroy", item.id), {
            onSuccess: () => {
                toast.success("Aset berhasil dihapus");
                requestClose();
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus aset"),
        });
    };

    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—");
    const fmtMoney = (n) => (n ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n) : "—");

    const ASAL_LABEL = {
        pengadaan: "Pengadaan",
        hibah: "Hibah",
        pembelian_mandiri: "Pembelian Mandiri",
        lainnya: "Lainnya",
    };

    // Cari item yang masih aktif (belum kembali). Setiap baris di riwayatPeminjaman
    // mewakili 1 item, dan field `id` sudah diset = id item oleh backend.
    const activePeminjaman = riwayatPeminjaman.find((p) => !p?.tanggal_kembali_aktual);
    // Untuk pengembalian: kita butuh id item, bukan id header transaksi.
    const activePeminjamanId = activePeminjaman?.item_id ?? activePeminjaman?.id;

    const visibleTabs = TABS.filter((t) => {
        if (t.id === "edit" && !canUpdate) return false;
        if (t.id === "pinjam" && (!canUpdate || item?.status !== "tersedia" || item?.keadaan === "hilang")) return false;
        if (t.id === "kembali" && (!canUpdate || item?.status !== "dipinjam")) return false;
        return true;
    });

    if (!item) return null;

    return (
        <>
            <Drawer
                open={open}
                onClose={requestClose}
                width="xl"
                title={item.nama || item.kategori_aset?.nama || "—"}
                subtitle={item.kode_barang}
                actions={canUpdate && (
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("edit")}>
                        Sunting
                    </Button>
                )}
            >
                <div role="tablist" aria-label="Detail aset" className="tabs tabs-box mb-4">
                    {visibleTabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            className={`tab ${activeTab === t.id ? "tab-active" : ""}`}
                            aria-selected={activeTab === t.id}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.label}
                            {t.id === "kondisi" && riwayat.length > 0 && <Badge tone="neutral" size="xs" className="ml-1">{riwayat.length}</Badge>}
                            {t.id === "riwayat-pinjam" && riwayatPeminjaman.length > 0 && <Badge tone="neutral" size="xs" className="ml-1">{riwayatPeminjaman.length}</Badge>}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Detail ─────────────────────────────────── */}
                {activeTab === "detail" && (
                    <div className="space-y-5">
                        {item.foto && (
                            <img
                                src={`/storage/${item.foto}`}
                                alt={item.kode_barang}
                                className="max-h-52 w-full rounded-md border border-base-300 bg-base-200 object-contain"
                            />
                        )}

                        <div>
                            <InfoRow label="Kode Barang" value={item.kode_barang} />
                            <InfoRow label="Kategori" value={item.kategori_aset?.nama} />
                            <InfoRow label="Nama Spesifik" value={item.nama} />
                            <InfoRow label="Kondisi" value={<StatusBadge status={item.keadaan} tone={KEADAAN_TONE[item.keadaan]} label={item.keadaan} />} />
                            <InfoRow label="Status" value={<StatusBadge status={item.status} tone={STATUS_TONE[item.status]} label={item.status} />} />
                            <InfoRow label="Tgl Perolehan" value={fmtDate(item.tanggal_perolehan)} />
                            <InfoRow label="Harga Perolehan" value={fmtMoney(item.harga_perolehan)} />
                            <InfoRow label="Asal Barang" value={ASAL_LABEL[item.asal_barang] ?? item.asal_barang} />
                            <InfoRow label="Keterangan" value={item.keterangan} />
                        </div>

                        {item.qr_code_path && (
                            <div className="flex items-center gap-4 rounded-md border border-base-300 bg-base-200 p-4">
                                <img src={`/storage/${item.qr_code_path}`} alt="QR" className="h-20 w-20 rounded border border-base-300" />
                                <div className="space-y-1.5">
                                    <p className="text-xs text-base-content/60">QR Code Aset</p>
                                    <a href={route("detail-inventaris.qr-download", item.id)} className="block text-xs text-primary hover:underline">
                                        Download QR (.svg)
                                    </a>
                                    <a href={route("detail-inventaris.label-download", item.id)} className="block text-xs text-primary hover:underline">
                                        Download Label PDF
                                    </a>
                                </div>
                            </div>
                        )}

                        {canDelete && (
                            <div className="border-t border-base-300 pt-4">
                                <Button variant="ghost" size="sm" className="border-error/30 text-error hover:bg-error/10" onClick={() => setIsDeleteConfirm(true)}>
                                    Hapus Aset
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Edit ────────────────────────────────────── */}
                {activeTab === "edit" && canUpdate && (
                    <form onSubmit={handleEdit} className="space-y-4">
                        <FormField label="Nama Spesifik" error={editForm.errors.nama}>
                            <input type="text" value={editForm.data.nama} onChange={(e) => editForm.setData("nama", e.target.value)} className="input min-h-11 w-full" />
                        </FormField>
                        <FormField label="Kode Barang" required error={editForm.errors.kode_barang}>
                            <input type="text" value={editForm.data.kode_barang} onChange={(e) => editForm.setData("kode_barang", e.target.value)} required className="input min-h-11 w-full" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Kondisi">
                                <select value={editForm.data.keadaan} onChange={(e) => editForm.setData("keadaan", e.target.value)} className="select min-h-11 w-full">
                                    <option value="baik">Baik</option>
                                    <option value="rusak">Rusak</option>
                                    <option value="hilang">Hilang</option>
                                </select>
                            </FormField>
                            <FormField label="Status">
                                <select value={editForm.data.status} onChange={(e) => editForm.setData("status", e.target.value)} className="select min-h-11 w-full">
                                    <option value="tersedia">Tersedia</option>
                                    <option value="dipinjam">Dipinjam</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Tgl Perolehan">
                                <input type="date" value={editForm.data.tanggal_perolehan} onChange={(e) => editForm.setData("tanggal_perolehan", e.target.value)} className="input min-h-11 w-full" />
                            </FormField>
                            <FormField label="Harga Perolehan">
                                <input type="number" min="0" value={editForm.data.harga_perolehan} onChange={(e) => editForm.setData("harga_perolehan", e.target.value)} className="input min-h-11 w-full" />
                            </FormField>
                        </div>
                        <FormField label="Asal Barang">
                            <select value={editForm.data.asal_barang} onChange={(e) => editForm.setData("asal_barang", e.target.value)} className="select min-h-11 w-full">
                                <option value="">— Pilih —</option>
                                <option value="pengadaan">Pengadaan</option>
                                <option value="hibah">Hibah</option>
                                <option value="pembelian_mandiri">Pembelian Mandiri</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </FormField>
                        <FormField label="Keterangan">
                            <textarea value={editForm.data.keterangan} onChange={(e) => editForm.setData("keterangan", e.target.value)} rows="2" className="textarea min-h-11 w-full" />
                        </FormField>
                        <FormField label="Ganti Foto" hint="Opsional. Gunakan berkas gambar.">
                            <input type="file" accept="image/*" onChange={(e) => editForm.setData("foto", e.target.files[0])} className="file-input min-h-11 w-full" />
                        </FormField>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setActiveTab("detail")}>Batal</Button>
                            <Button type="submit" loading={editForm.processing}>Simpan Perubahan</Button>
                        </div>
                    </form>
                )}

                {/* ── TAB: Riwayat & Kondisi ───────────────────────── */}
                {activeTab === "kondisi" && (
                    <div className="space-y-6">
                        {canUpdate && (
                            <form onSubmit={handleKondisi} className="space-y-3 rounded-md border border-base-300 bg-base-200 p-4">
                                <h4 className="text-sm font-semibold">Catat Perubahan Kondisi</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Kondisi Baru">
                                        <select value={kondisiForm.data.keadaan} onChange={(e) => kondisiForm.setData("keadaan", e.target.value)} className="select min-h-11 w-full">
                                            <option value="baik">Baik</option>
                                            <option value="rusak">Rusak</option>
                                            <option value="hilang">Hilang</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Tanggal">
                                        <input type="date" value={kondisiForm.data.tanggal_pencatatan} onChange={(e) => kondisiForm.setData("tanggal_pencatatan", e.target.value)} className="input min-h-11 w-full" />
                                    </FormField>
                                </div>
                                <FormField label="Catatan">
                                    <input type="text" value={kondisiForm.data.catatan} onChange={(e) => kondisiForm.setData("catatan", e.target.value)} placeholder="Alasan perubahan kondisi..." className="input min-h-11 w-full" />
                                </FormField>
                                <Button type="submit" loading={kondisiForm.processing} className="w-full">Simpan Kondisi</Button>
                            </form>
                        )}

                        <div>
                            <h4 className="mb-3 text-sm font-semibold">Riwayat Kondisi</h4>
                            {riwayatLoading ? (
                                <div className="space-y-3 py-2">
                                    <div className="silab-table-skeleton w-2/3" />
                                    <div className="silab-table-skeleton w-1/2" />
                                    <div className="silab-table-skeleton w-1/3" />
                                </div>
                            ) : riwayat.length === 0 ? (
                                <p className="py-4 text-center text-sm text-base-content/60">Belum ada riwayat kondisi.</p>
                            ) : (
                                <ol className="relative ml-3 space-y-4 border-l border-base-300">
                                    {riwayat.map((r) => (
                                        <li key={r.id} className="ml-4">
                                            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-base-100 bg-base-content/30" />
                                            <div className="flex flex-wrap items-center gap-2">
                                                {r.kondisi_sebelum ? (
                                                    <>
                                                        <StatusBadge status={r.kondisi_sebelum} tone={KEADAAN_TONE[r.kondisi_sebelum]} label={r.kondisi_sebelum} />
                                                        <span className="text-xs text-base-content/50">→</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs italic text-base-content/50">Awal —</span>
                                                )}
                                                <StatusBadge status={r.kondisi_sesudah} tone={KEADAAN_TONE[r.kondisi_sesudah]} label={r.kondisi_sesudah} />
                                            </div>
                                            {r.catatan && <p className="mt-1 text-xs italic text-base-content/60">{r.catatan}</p>}
                                            <p className="mt-0.5 text-xs text-base-content/50">
                                                {new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                {r.pencatat?.name && ` · ${r.pencatat.name}`}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB: Peminjaman ──────────────────────────────── */}
                {activeTab === "pinjam" && canUpdate && item.status === "tersedia" && (
                    <form onSubmit={handlePinjam} className="space-y-4">
                        <FormField label="Nama Peminjam" required error={pinjamForm.errors.nama_peminjam}>
                            <input type="text" value={pinjamForm.data.nama_peminjam} onChange={(e) => pinjamForm.setData("nama_peminjam", e.target.value)} required className="input min-h-11 w-full" />
                        </FormField>
                        <FormField label="Institusi">
                            <input type="text" value={pinjamForm.data.institusi} onChange={(e) => pinjamForm.setData("institusi", e.target.value)} className="input min-h-11 w-full" />
                        </FormField>
                        <FormField label="Keperluan" required>
                            <textarea value={pinjamForm.data.keperluan} onChange={(e) => pinjamForm.setData("keperluan", e.target.value)} required rows="2" className="textarea min-h-11 w-full" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Tgl Pinjam" required>
                                <input type="date" value={pinjamForm.data.tanggal_pinjam} onChange={(e) => pinjamForm.setData("tanggal_pinjam", e.target.value)} required className="input min-h-11 w-full" />
                            </FormField>
                            <FormField label="Rencana Kembali" required>
                                <input
                                    type="date"
                                    value={pinjamForm.data.tanggal_kembali_rencana}
                                    onChange={(e) => pinjamForm.setData("tanggal_kembali_rencana", e.target.value)}
                                    min={pinjamForm.data.tanggal_pinjam || undefined}
                                    required
                                    className="input min-h-11 w-full"
                                />
                            </FormField>
                        </div>
                        <FormField label="Surat Peminjaman" hint="Opsional. PDF atau gambar.">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => pinjamForm.setData("surat_peminjaman", e.target.files[0])}
                                className="file-input min-h-11 w-full"
                            />
                        </FormField>
                        <FormField label="Catatan">
                            <textarea value={pinjamForm.data.catatan} onChange={(e) => pinjamForm.setData("catatan", e.target.value)} rows="2" className="textarea min-h-11 w-full" />
                        </FormField>
                        <Button type="submit" loading={pinjamForm.processing} className="w-full">Catat Peminjaman</Button>
                    </form>
                )}

                {/* ── TAB: Riwayat Peminjaman ──────────────────────── */}
                {activeTab === "riwayat-pinjam" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Riwayat Peminjaman Aset</h4>
                            <Button variant="ghost" size="sm" onClick={loadRiwayatPeminjaman}>Muat ulang</Button>
                        </div>

                        {riwayatPeminjamanLoading ? (
                            <div className="space-y-3 py-2">
                                <div className="silab-table-skeleton w-3/4" />
                                <div className="silab-table-skeleton w-1/2" />
                                <div className="silab-table-skeleton w-2/3" />
                            </div>
                        ) : riwayatPeminjaman.length === 0 ? (
                            <p className="py-6 text-center text-sm text-base-content/60">Belum ada riwayat peminjaman.</p>
                        ) : (
                            <div className="space-y-3">
                                {riwayatPeminjaman.map((p) => {
                                    const isExpanded = expandedPeminjamanId === p.id;
                                    return (
                                        <div key={p.id} className="rounded-md border border-base-300 bg-base-100">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedPeminjamanId(isExpanded ? null : p.id)}
                                                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-base-200"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {p.nama_peminjam || "Peminjam"}
                                                        {p.institusi ? ` · ${p.institusi}` : ""}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-base-content/60">
                                                        {fmtDate(p.tanggal_pinjam)}
                                                        {p.tanggal_kembali_rencana ? ` → ${fmtDate(p.tanggal_kembali_rencana)}` : ""}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <StatusBadge status={p.status} tone={p.status === "dipinjam" ? "warning" : "success"} label={p.status} />
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-base-300 bg-base-200/60 px-4 pb-4">
                                                    <div className="space-y-2 pt-3 text-sm">
                                                        <InfoRow label="Keperluan" value={p.keperluan || "—"} />
                                                        <InfoRow label="Tgl Pinjam" value={fmtDate(p.tanggal_pinjam)} />
                                                        <InfoRow label="Rencana Kembali" value={fmtDate(p.tanggal_kembali_rencana)} />
                                                        <InfoRow label="Aktual Kembali" value={fmtDate(p.tanggal_kembali_aktual)} />
                                                        <InfoRow label="Input Oleh" value={p.diprosesoleh?.name || p.peminjam?.name || "—"} />
                                                        <InfoRow label="Catatan" value={p.catatan || "—"} />
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {p.surat_peminjaman_url ? (
                                                            <a href={p.surat_peminjaman_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline min-h-11">
                                                                Lihat Surat
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs italic text-base-content/50">Surat tidak tersedia</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Pengembalian ────────────────────────────── */}
                {activeTab === "kembali" && canUpdate && item.status === "dipinjam" && (
                    <form onSubmit={handleKembalikan} className="space-y-4">
                        {!activePeminjamanId && (
                            <div className="alert alert-error text-sm" role="alert">
                                <span>Data peminjaman aktif belum ditemukan. Buka tab Riwayat Peminjaman lalu muat ulang, kemudian kembali ke tab ini.</span>
                            </div>
                        )}
                        <div className="alert alert-warning text-sm">
                            <div>
                                <p className="font-medium">Aset sedang dipinjam</p>
                                <p className="mt-1">
                                    {activePeminjaman?.nama_peminjam || "Peminjam"}
                                    {activePeminjaman?.institusi ? ` · ${activePeminjaman.institusi}` : ""}
                                </p>
                                <p className="mt-1 text-xs">
                                    Tgl pinjam: {fmtDate(activePeminjaman?.tanggal_pinjam)}
                                    {activePeminjaman?.tanggal_kembali_rencana ? ` · Rencana kembali: ${fmtDate(activePeminjaman.tanggal_kembali_rencana)}` : ""}
                                </p>
                            </div>
                        </div>

                        <FormField label="Tanggal Kembali Aktual" required error={kembaliForm.errors.tanggal_kembali_aktual}>
                            <input
                                type="date"
                                value={kembaliForm.data.tanggal_kembali_aktual}
                                onChange={(e) => kembaliForm.setData("tanggal_kembali_aktual", e.target.value)}
                                min={activePeminjaman?.tanggal_pinjam || undefined}
                                required
                                className="input min-h-11 w-full"
                            />
                        </FormField>

                        <FormField label="Kondisi Setelah Kembali" error={kembaliForm.errors.kondisi_setelah_kembali}>
                            <select value={kembaliForm.data.kondisi_setelah_kembali} onChange={(e) => kembaliForm.setData("kondisi_setelah_kembali", e.target.value)} className="select min-h-11 w-full">
                                <option value="">— Biarkan kondisi saat ini —</option>
                                <option value="baik">Baik</option>
                                <option value="rusak">Rusak</option>
                            </select>
                        </FormField>

                        <FormField label="Catatan Pengembalian" error={kembaliForm.errors.catatan_kembali}>
                            <textarea value={kembaliForm.data.catatan_kembali} onChange={(e) => kembaliForm.setData("catatan_kembali", e.target.value)} rows="2" className="textarea min-h-11 w-full" />
                        </FormField>

                        <Button type="submit" loading={kembaliForm.processing} disabled={!activePeminjamanId} className="w-full">
                            Tandai Sudah Dikembalikan
                        </Button>
                    </form>
                )}
            </Drawer>

            <ConfirmModal
                show={isDeleteConfirm}
                onClose={() => setIsDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Hapus Aset"
                message={`Yakin ingin menghapus aset "${item.nama || item.kode_barang}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />
        </>
    );
}
