import { router, useForm } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
        <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-400 w-32 flex-shrink-0">
                {label}
            </span>
            <span className="text-sm text-gray-800 flex-1">{value ?? "—"}</span>
        </div>
    );
}

function TabBtn({ active, onClick, children, badge = 0 }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            <span className="inline-flex items-center gap-2">
                {children}
                {badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                        {badge}
                    </span>
                )}
            </span>
        </button>
    );
}

export default function AsetDrawer({ item, onClose, canUpdate, canDelete }) {
    const CLOSE_ANIMATION_MS = 220;
    const [activeTab, setActiveTab] = useState("detail");
    const [riwayat, setRiwayat] = useState([]);
    const [riwayatLoading, setRiwayatLoading] = useState(false);
    const [riwayatPeminjaman, setRiwayatPeminjaman] = useState([]);
    const [riwayatPeminjamanLoading, setRiwayatPeminjamanLoading] =
        useState(false);
    const [expandedPeminjamanId, setExpandedPeminjamanId] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const closeTimerRef = useRef(null);

    const requestClose = useCallback(() => {
        if (closeTimerRef.current) return;
        setIsVisible(false);
        closeTimerRef.current = setTimeout(() => {
            onClose();
        }, CLOSE_ANIMATION_MS);
    }, [onClose]);

    useEffect(() => {
        const rafId = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(rafId);
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

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
        const onEsc = (e) => {
            if (e.key === "Escape") requestClose();
        };

        document.addEventListener("keydown", onEsc);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onEsc);
            document.body.style.overflow = previousOverflow;
        };
    }, [requestClose]);

    // Load riwayat when kondisi tab opens
    useEffect(() => {
        if (activeTab === "kondisi" && item) loadRiwayat();
    }, [activeTab, item?.id]);

    useEffect(() => {
        if (
            (activeTab === "riwayat-pinjam" || activeTab === "kembali") &&
            item
        ) {
            loadRiwayatPeminjaman();
        }
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
                tanggal_perolehan: item.tanggal_perolehan
                    ? item.tanggal_perolehan.substring(0, 10)
                    : "",
                harga_perolehan: item.harga_perolehan || "",
                asal_barang: item.asal_barang || "",
                foto: null,
                _method: "PUT",
            });
        }
    }, [item?.id]);

    const handleEdit = (e) => {
        e.preventDefault();
        router.post(
            route("detail-inventaris.update", item.id),
            {
                ...editForm.data,
                _method: "PUT",
                foto: editForm.data.foto,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Aset berhasil diperbarui");
                    requestClose();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal memperbarui aset");
                },
            },
        );
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal memperbarui kondisi");
            },
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal mencatat peminjaman");
            },
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
            kondisi_setelah_kembali:
                item.keadaan === "baik" || item.keadaan === "rusak"
                    ? item.keadaan
                    : "",
        });
    }, [item?.id]);

    const handleKembalikan = (e) => {
        e.preventDefault();
        if (!activePeminjamanId) {
            toast.error("Data peminjaman aktif tidak ditemukan.");
            return;
        }

        // Pengembalian per-item: activePeminjamanId di sini = id item
        kembaliForm.post(
            route("inventaris.peminjaman.kembalikan-item", activePeminjamanId),
            {
                onSuccess: () => {
                    requestClose();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal mencatat pengembalian aset");
                },
            },
        );
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

    useEffect(() => {
        setActiveTab("detail");
        setIsDeleteConfirm(false);
        setExpandedPeminjamanId(null);
        setIsVisible(true);
    }, [item?.id]);

    const handleDelete = () => {
        router.delete(route("detail-inventaris.destroy", item.id), {
            onSuccess: () => {
                toast.success("Aset berhasil dihapus");
                requestClose();
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus aset");
            },
        });
    };

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              })
            : "—";
    const fmtMoney = (n) =>
        n
            ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
              }).format(n)
            : "—";

    const ASAL_LABEL = {
        pengadaan: "Pengadaan",
        hibah: "Hibah",
        pembelian_mandiri: "Pembelian Mandiri",
        lainnya: "Lainnya",
    };

    // Cari item yang masih aktif (belum kembali). Setiap baris di riwayatPeminjaman
    // mewakili 1 item, dan field `id` sudah diset = id item oleh backend.
    const activePeminjaman = riwayatPeminjaman.find(
        (p) => !p?.tanggal_kembali_aktual,
    );
    // Untuk pengembalian: kita butuh id item, bukan id header transaksi.
    const activePeminjamanId =
        activePeminjaman?.item_id ?? activePeminjaman?.id;

    const visibleTabs = TABS.filter((t) => {
        if (t.id === "edit" && !canUpdate) return false;
        if (
            t.id === "pinjam" &&
            (!canUpdate ||
                item?.status !== "tersedia" ||
                item?.keadaan === "hilang")
        )
            return false;
        if (t.id === "kembali" && (!canUpdate || item?.status !== "dipinjam"))
            return false;
        return true;
    });

    if (!item) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
                onClick={requestClose}
            />

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-white shadow-2xl transform transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                            Aset
                        </p>
                        <h2 className="text-lg font-semibold text-gray-900 mt-0.5">
                            {item.nama || item.kategori_aset?.nama || "—"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {item.kode_barang}
                        </p>
                    </div>
                    <button
                        onClick={requestClose}
                        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div
                    className="flex border-b overflow-x-auto bg-white px-2 flex-shrink-0 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {visibleTabs.map((t) => (
                        <TabBtn
                            key={t.id}
                            active={activeTab === t.id}
                            onClick={() => setActiveTab(t.id)}
                            badge={
                                t.id === "kondisi"
                                    ? riwayat.length
                                    : t.id === "riwayat-pinjam"
                                      ? riwayatPeminjaman.length
                                      : 0
                            }
                        >
                            {t.label}
                        </TabBtn>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* ── TAB: Detail ─────────────────────────────────── */}
                    {activeTab === "detail" && (
                        <div className="p-6 space-y-5">
                            {/* Foto */}
                            {item.foto && (
                                <img
                                    src={`/storage/${item.foto}`}
                                    alt={item.kode_barang}
                                    className="w-full max-h-52 object-contain rounded-lg border bg-gray-50"
                                />
                            )}

                            {/* Info */}
                            <div>
                                <InfoRow
                                    label="Kode Barang"
                                    value={item.kode_barang}
                                />
                                <InfoRow
                                    label="Kategori"
                                    value={item.kategori_aset?.nama}
                                />
                                <InfoRow
                                    label="Nama Spesifik"
                                    value={item.nama}
                                />
                                <InfoRow
                                    label="Kondisi"
                                    value={
                                        <span
                                            className={`px-2 py-0.5 text-xs rounded-full ${item.keadaan === "baik" ? "bg-green-100 text-green-800" : item.keadaan === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}
                                        >
                                            {item.keadaan}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label="Status"
                                    value={
                                        <span
                                            className={`px-2 py-0.5 text-xs rounded-full ${item.status === "tersedia" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
                                        >
                                            {item.status}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label="Tgl Perolehan"
                                    value={fmtDate(item.tanggal_perolehan)}
                                />
                                <InfoRow
                                    label="Harga Perolehan"
                                    value={fmtMoney(item.harga_perolehan)}
                                />
                                <InfoRow
                                    label="Asal Barang"
                                    value={
                                        ASAL_LABEL[item.asal_barang] ??
                                        item.asal_barang
                                    }
                                />
                                <InfoRow
                                    label="Keterangan"
                                    value={item.keterangan}
                                />
                            </div>

                            {/* QR */}
                            {item.qr_code_path && (
                                <div className="border rounded-lg p-4 bg-gray-50 flex items-center gap-4">
                                    <img
                                        src={`/storage/${item.qr_code_path}`}
                                        alt="QR"
                                        className="w-20 h-20 border rounded"
                                    />
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">
                                            QR Code Aset
                                        </p>
                                        <a
                                            href={route(
                                                "detail-inventaris.qr-download",
                                                item.id,
                                            )}
                                            className="text-xs text-blue-600 hover:underline block"
                                        >
                                            Download QR (.svg)
                                        </a>
                                        <a
                                            href={route(
                                                "detail-inventaris.label-download",
                                                item.id,
                                            )}
                                            className="text-xs text-indigo-600 hover:underline block"
                                        >
                                            Download Label PDF
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Delete */}
                            {canDelete && (
                                <div className="pt-4 border-t">
                                    {isDeleteConfirm ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-sm text-red-700 mb-3">
                                                Yakin ingin menghapus aset ini?
                                                Tindakan tidak bisa dibatalkan.
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDelete}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                                >
                                                    Ya, Hapus
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setIsDeleteConfirm(
                                                            false,
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-white border text-gray-700 text-sm rounded-md"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setIsDeleteConfirm(true)
                                            }
                                            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1.5"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                            Hapus Aset
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: Edit ────────────────────────────────────── */}
                    {activeTab === "edit" && canUpdate && (
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Spesifik
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.nama}
                                    onChange={(e) =>
                                        editForm.setData("nama", e.target.value)
                                    }
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kode Barang *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.kode_barang}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "kode_barang",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                />
                                {editForm.errors.kode_barang && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {editForm.errors.kode_barang}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kondisi
                                    </label>
                                    <select
                                        value={editForm.data.keadaan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "keadaan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    >
                                        <option value="baik">Baik</option>
                                        <option value="rusak">Rusak</option>
                                        <option value="hilang">Hilang</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    >
                                        <option value="tersedia">
                                            Tersedia
                                        </option>
                                        <option value="dipinjam">
                                            Dipinjam
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tgl Perolehan
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.data.tanggal_perolehan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "tanggal_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Harga Perolehan
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.data.harga_perolehan}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "harga_perolehan",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Asal Barang
                                </label>
                                <select
                                    value={editForm.data.asal_barang}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "asal_barang",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                >
                                    <option value="">— Pilih —</option>
                                    <option value="pengadaan">Pengadaan</option>
                                    <option value="hibah">Hibah</option>
                                    <option value="pembelian_mandiri">
                                        Pembelian Mandiri
                                    </option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Keterangan
                                </label>
                                <textarea
                                    value={editForm.data.keterangan}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "keterangan",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Ganti Foto
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        editForm.setData(
                                            "foto",
                                            e.target.files[0],
                                        )
                                    }
                                    className="mt-1 w-full text-sm"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {editForm.processing
                                        ? "Menyimpan..."
                                        : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── TAB: Riwayat & Kondisi ───────────────────────── */}
                    {activeTab === "kondisi" && (
                        <div className="p-6 space-y-6">
                            {/* Update kondisi form */}
                            {canUpdate && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-orange-800 mb-3">
                                        Catat Perubahan Kondisi
                                    </h4>
                                    <form
                                        onSubmit={handleKondisi}
                                        className="space-y-3"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">
                                                    Kondisi Baru
                                                </label>
                                                <select
                                                    value={
                                                        kondisiForm.data.keadaan
                                                    }
                                                    onChange={(e) =>
                                                        kondisiForm.setData(
                                                            "keadaan",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 w-full border border-gray-300 rounded text-sm py-1.5 px-2"
                                                >
                                                    <option value="baik">
                                                        Baik
                                                    </option>
                                                    <option value="rusak">
                                                        Rusak
                                                    </option>
                                                    <option value="hilang">
                                                        Hilang
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">
                                                    Tanggal
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        kondisiForm.data
                                                            .tanggal_pencatatan
                                                    }
                                                    onChange={(e) =>
                                                        kondisiForm.setData(
                                                            "tanggal_pencatatan",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 w-full border border-gray-300 rounded text-sm py-1.5 px-2"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600">
                                                Catatan
                                            </label>
                                            <input
                                                type="text"
                                                value={kondisiForm.data.catatan}
                                                onChange={(e) =>
                                                    kondisiForm.setData(
                                                        "catatan",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Alasan perubahan kondisi..."
                                                className="mt-1 w-full border border-gray-300 rounded text-sm py-1.5 px-2"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={kondisiForm.processing}
                                            className="w-full py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                                        >
                                            {kondisiForm.processing
                                                ? "Menyimpan..."
                                                : "Simpan Kondisi"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Riwayat timeline */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    Riwayat Kondisi
                                </h4>
                                {riwayatLoading ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        Memuat...
                                    </p>
                                ) : riwayat.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        Belum ada riwayat kondisi.
                                    </p>
                                ) : (
                                    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
                                        {riwayat.map((r) => (
                                            <li key={r.id} className="ml-4">
                                                <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {r.kondisi_sebelum ? (
                                                        <>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs rounded-full ${r.kondisi_sebelum === "baik" ? "bg-green-100 text-green-800" : r.kondisi_sebelum === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}
                                                            >
                                                                {
                                                                    r.kondisi_sebelum
                                                                }
                                                            </span>
                                                            <span className="text-gray-400 text-xs">
                                                                →
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Awal —
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded-full ${r.kondisi_sesudah === "baik" ? "bg-green-100 text-green-800" : r.kondisi_sesudah === "rusak" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}
                                                    >
                                                        {r.kondisi_sesudah}
                                                    </span>
                                                </div>
                                                {r.catatan && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">
                                                        {r.catatan}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(
                                                        r.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                    {r.pencatat?.name &&
                                                        ` · ${r.pencatat.name}`}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: Peminjaman ──────────────────────────────── */}
                    {activeTab === "pinjam" &&
                        canUpdate &&
                        item.status === "tersedia" && (
                            <form
                                onSubmit={handlePinjam}
                                className="p-6 space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nama Peminjam *
                                    </label>
                                    <input
                                        type="text"
                                        value={pinjamForm.data.nama_peminjam}
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "nama_peminjam",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                    {pinjamForm.errors.nama_peminjam && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {pinjamForm.errors.nama_peminjam}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Institusi
                                    </label>
                                    <input
                                        type="text"
                                        value={pinjamForm.data.institusi}
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "institusi",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Keperluan *
                                    </label>
                                    <textarea
                                        value={pinjamForm.data.keperluan}
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "keperluan",
                                                e.target.value,
                                            )
                                        }
                                        required
                                        rows="2"
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tgl Pinjam *
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                pinjamForm.data.tanggal_pinjam
                                            }
                                            onChange={(e) =>
                                                pinjamForm.setData(
                                                    "tanggal_pinjam",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Rencana Kembali *
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                pinjamForm.data
                                                    .tanggal_kembali_rencana
                                            }
                                            onChange={(e) =>
                                                pinjamForm.setData(
                                                    "tanggal_kembali_rencana",
                                                    e.target.value,
                                                )
                                            }
                                            min={
                                                pinjamForm.data
                                                    .tanggal_pinjam || undefined
                                            }
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Surat Peminjaman
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "surat_peminjaman",
                                                e.target.files[0],
                                            )
                                        }
                                        className="mt-1 w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Catatan
                                    </label>
                                    <textarea
                                        value={pinjamForm.data.catatan}
                                        onChange={(e) =>
                                            pinjamForm.setData(
                                                "catatan",
                                                e.target.value,
                                            )
                                        }
                                        rows="2"
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={pinjamForm.processing}
                                    className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {pinjamForm.processing
                                        ? "Menyimpan..."
                                        : "Catat Peminjaman"}
                                </button>
                            </form>
                        )}

                    {/* ── TAB: Riwayat Peminjaman ─────────────────────── */}
                    {activeTab === "riwayat-pinjam" && (
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">
                                    Riwayat Peminjaman Aset
                                </h4>
                                <button
                                    type="button"
                                    onClick={loadRiwayatPeminjaman}
                                    className="text-xs px-2.5 py-1 border rounded-md text-gray-600 hover:bg-gray-50"
                                >
                                    Refresh
                                </button>
                            </div>

                            {riwayatPeminjamanLoading ? (
                                <p className="text-sm text-gray-400 text-center py-6">
                                    Memuat riwayat peminjaman...
                                </p>
                            ) : riwayatPeminjaman.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">
                                    Belum ada riwayat peminjaman.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {riwayatPeminjaman.map((p) => {
                                        const isExpanded =
                                            expandedPeminjamanId === p.id;

                                        return (
                                            <div
                                                key={p.id}
                                                className="border rounded-lg bg-white"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedPeminjamanId(
                                                            isExpanded
                                                                ? null
                                                                : p.id,
                                                        )
                                                    }
                                                    className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left hover:bg-gray-50"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {p.nama_peminjam ||
                                                                "Peminjam"}
                                                            {p.institusi
                                                                ? ` · ${p.institusi}`
                                                                : ""}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {fmtDate(
                                                                p.tanggal_pinjam,
                                                            )}
                                                            {p.tanggal_kembali_rencana
                                                                ? ` → ${fmtDate(p.tanggal_kembali_rencana)}`
                                                                : ""}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span
                                                            className={`px-2 py-0.5 text-[11px] rounded-full ${p.status === "dipinjam" ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"}`}
                                                        >
                                                            {p.status}
                                                        </span>
                                                        <span className="text-gray-400 text-xs">
                                                            {isExpanded
                                                                ? "▲"
                                                                : "▼"}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 pb-4 border-t bg-gray-50/70">
                                                        <div className="pt-3 space-y-2 text-sm text-gray-700">
                                                            <InfoRow
                                                                label="Keperluan"
                                                                value={
                                                                    p.keperluan ||
                                                                    "—"
                                                                }
                                                            />
                                                            <InfoRow
                                                                label="Tgl Pinjam"
                                                                value={fmtDate(
                                                                    p.tanggal_pinjam,
                                                                )}
                                                            />
                                                            <InfoRow
                                                                label="Rencana Kembali"
                                                                value={fmtDate(
                                                                    p.tanggal_kembali_rencana,
                                                                )}
                                                            />
                                                            <InfoRow
                                                                label="Aktual Kembali"
                                                                value={fmtDate(
                                                                    p.tanggal_kembali_aktual,
                                                                )}
                                                            />
                                                            <InfoRow
                                                                label="Input Oleh"
                                                                value={
                                                                    p
                                                                        .diprosesoleh
                                                                        ?.name ||
                                                                    p.peminjam
                                                                        ?.name ||
                                                                    "—"
                                                                }
                                                            />
                                                            <InfoRow
                                                                label="Catatan"
                                                                value={
                                                                    p.catatan ||
                                                                    "—"
                                                                }
                                                            />
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {p.surat_peminjaman_url ? (
                                                                <a
                                                                    href={
                                                                        p.surat_peminjaman_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                                                >
                                                                    Lihat Surat
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">
                                                                    Surat tidak
                                                                    tersedia
                                                                </span>
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

                    {/* ── TAB: Pengembalian ───────────────────────────── */}
                    {activeTab === "kembali" &&
                        canUpdate &&
                        item.status === "dipinjam" && (
                            <form
                                onSubmit={handleKembalikan}
                                className="p-6 space-y-4"
                            >
                                {!activePeminjamanId && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                        Data peminjaman aktif belum ditemukan.
                                        Klik tab Riwayat Peminjaman lalu
                                        refresh, kemudian buka kembali tab ini.
                                    </div>
                                )}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                    <p className="font-medium">
                                        Aset sedang dipinjam
                                    </p>
                                    <p className="mt-1">
                                        {activePeminjaman?.nama_peminjam ||
                                            "Peminjam"}
                                        {activePeminjaman?.institusi
                                            ? ` · ${activePeminjaman.institusi}`
                                            : ""}
                                    </p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        Tgl pinjam:{" "}
                                        {fmtDate(
                                            activePeminjaman?.tanggal_pinjam,
                                        )}
                                        {activePeminjaman?.tanggal_kembali_rencana
                                            ? ` · Rencana kembali: ${fmtDate(activePeminjaman.tanggal_kembali_rencana)}`
                                            : ""}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Kembali Aktual *
                                    </label>
                                    <input
                                        type="date"
                                        value={
                                            kembaliForm.data
                                                .tanggal_kembali_aktual
                                        }
                                        onChange={(e) =>
                                            kembaliForm.setData(
                                                "tanggal_kembali_aktual",
                                                e.target.value,
                                            )
                                        }
                                        min={
                                            activePeminjaman?.tanggal_pinjam ||
                                            undefined
                                        }
                                        required
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                    {kembaliForm.errors
                                        .tanggal_kembali_aktual && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {
                                                kembaliForm.errors
                                                    .tanggal_kembali_aktual
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kondisi Setelah Kembali
                                    </label>
                                    <select
                                        value={
                                            kembaliForm.data
                                                .kondisi_setelah_kembali
                                        }
                                        onChange={(e) =>
                                            kembaliForm.setData(
                                                "kondisi_setelah_kembali",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    >
                                        <option value="">
                                            — Biarkan kondisi saat ini —
                                        </option>
                                        <option value="baik">Baik</option>
                                        <option value="rusak">Rusak</option>
                                    </select>
                                    {kembaliForm.errors
                                        .kondisi_setelah_kembali && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {
                                                kembaliForm.errors
                                                    .kondisi_setelah_kembali
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Catatan Pengembalian
                                    </label>
                                    <textarea
                                        value={kembaliForm.data.catatan_kembali}
                                        onChange={(e) =>
                                            kembaliForm.setData(
                                                "catatan_kembali",
                                                e.target.value,
                                            )
                                        }
                                        rows="2"
                                        className="mt-1 w-full border border-gray-300 rounded-md text-sm py-2 px-3"
                                    />
                                    {kembaliForm.errors.catatan_kembali && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {kembaliForm.errors.catatan_kembali}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        kembaliForm.processing ||
                                        !activePeminjamanId
                                    }
                                    className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {kembaliForm.processing
                                        ? "Menyimpan..."
                                        : "Tandai Sudah Dikembalikan"}
                                </button>
                            </form>
                        )}
                </div>
            </div>
        </>
    );
}
