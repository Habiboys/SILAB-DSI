import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    RotateCcw,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_LABEL = {
    dipinjam: "Dipinjam",
    dikembalikan: "Dikembalikan",
    terlambat: "Terlambat",
};

const STATUS_TONE = {
    dipinjam: "info",
    dikembalikan: "success",
    terlambat: "error",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({
    value,
    label,
}));

export default function PeminjamanIndex({
    peminjaman,
    asetTersedia = [],
    filters,
    flash,
}) {
    const { selectedLab } = useLab();
    const { canAny } = usePermission();

    const canManage = canAny([
        "inventaris.manage-peminjaman",
        "inventaris.manage-items",
    ]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isKembalikanModalOpen, setIsKembalikanModalOpen] = useState(false);
    const [kembalikanMode, setKembalikanMode] = useState("transaction");
    const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (!selectedLab) return;
        router.get(
            route("inventaris.peminjaman.index"),
            { lab_id: selectedLab.id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [selectedLab?.id]);

    const applyServerQuery = useMemo(
        () =>
            debounce((state) => {
                router.get(
                    route("inventaris.peminjaman.index"),
                    {
                        lab_id: selectedLab?.id || undefined,
                        search: state.search || undefined,
                        status: state.filters?.status || undefined,
                        perPage: state.perPage || undefined,
                        page: state.page,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }, 300),
        [selectedLab?.id],
    );

    const createForm = useForm({
        aset_ids: [],
        nama_peminjam: "",
        institusi: "",
        jenis_jaminan: "",
        detail_jaminan: "",
        keperluan: "",
        tanggal_pinjam: new Date().toISOString().split("T")[0],
        tanggal_kembali_rencana: "",
        catatan: "",
        surat_peminjaman: null,
    });

    const kembalikanForm = useForm({
        tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
        kondisi_setelah_kembali: "",
        catatan_kembali: "",
    });

    const [asetSearch, setAsetSearch] = useState("");
    const filteredAset = useMemo(() => {
        const q = asetSearch.trim().toLowerCase();
        if (!q) return asetTersedia;
        return asetTersedia.filter(
            (a) =>
                a.kode_barang?.toLowerCase().includes(q) ||
                a.nama?.toLowerCase().includes(q) ||
                a.kategori_aset?.nama?.toLowerCase().includes(q),
        );
    }, [asetSearch, asetTersedia]);

    const toggleAsetId = (id) => {
        const arr = createForm.data.aset_ids;
        createForm.setData(
            "aset_ids",
            arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
        );
    };

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData({
            aset_ids: [],
            nama_peminjam: "",
            institusi: "",
            jenis_jaminan: "",
            detail_jaminan: "",
            keperluan: "",
            tanggal_pinjam: new Date().toISOString().split("T")[0],
            tanggal_kembali_rencana: "",
            catatan: "",
            surat_peminjaman: null,
        });
        setAsetSearch("");
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (createForm.data.aset_ids.length === 0) {
            toast.error("Pilih minimal 1 aset.");
            return;
        }
        createForm.post(route("inventaris.peminjaman.store"), {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
            onError: () => toast.error("Gagal mencatat peminjaman"),
            preserveScroll: true,
        });
    };

    const openKembalikanTransaksi = (item) => {
        setKembalikanMode("transaction");
        setSelectedPeminjaman(item);
        setSelectedItem(null);
        kembalikanForm.reset();
        kembalikanForm.setData({
            tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
            kondisi_setelah_kembali: "",
            catatan_kembali: "",
        });
        setIsKembalikanModalOpen(true);
    };

    const openKembalikanItem = (transaksi, itemData) => {
        setKembalikanMode("item");
        setSelectedPeminjaman(transaksi);
        setSelectedItem(itemData);
        kembalikanForm.reset();
        kembalikanForm.setData({
            tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
            kondisi_setelah_kembali: "",
            catatan_kembali: "",
        });
        setIsKembalikanModalOpen(true);
    };

    const handleKembalikanSubmit = (e) => {
        e.preventDefault();
        const url =
            kembalikanMode === "item"
                ? route("inventaris.peminjaman.kembalikan-item", selectedItem.id)
                : route("inventaris.peminjaman.kembalikan", selectedPeminjaman.id);
        kembalikanForm.post(url, {
            onSuccess: () => {
                setIsKembalikanModalOpen(false);
                setSelectedPeminjaman(null);
                setSelectedItem(null);
            },
            onError: () => toast.error("Gagal mencatat pengembalian"),
            preserveScroll: true,
        });
    };

    const confirmDelete = () => {
        router.delete(route("inventaris.peminjaman.destroy", deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Catatan peminjaman berhasil dihapus");
                setDeleteTarget(null);
            },
            onError: (errors) =>
                toast.error(
                    Object.values(errors).find(Boolean) ||
                        "Gagal menghapus catatan peminjaman",
                ),
        });
    };

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "-";

    const columns = useMemo(
        () => [
            {
                header: "",
                sortable: false,
                searchable: false,
                headerClassName: "w-12",
                cellClassName: "align-top",
                render: (trx) => {
                    const isExpanded = expandedRowId === trx.id;
                    return (
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedRowId(isExpanded ? null : trx.id)
                            }
                            className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                            aria-expanded={isExpanded}
                            aria-label={
                                isExpanded
                                    ? `Tutup daftar aset ${trx.nama_peminjam}`
                                    : `Lihat daftar aset ${trx.nama_peminjam}`
                            }
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    );
                },
            },
            {
                key: "nama_peminjam",
                header: "Peminjam",
                sortable: false,
                searchable: false,
                cellClassName: "align-top",
                render: (trx) => (
                    <div>
                        <div className="font-medium">{trx.nama_peminjam}</div>
                        {trx.institusi && (
                            <div className="text-xs text-base-content/70">
                                {trx.institusi}
                            </div>
                        )}
                        {trx.keperluan && (
                            <div
                                className="mt-0.5 max-w-[200px] truncate text-xs text-base-content/50"
                                title={trx.keperluan}
                            >
                                {trx.keperluan}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                header: "Aset",
                sortable: false,
                searchable: false,
                headerClassName: "min-w-[240px]",
                cellClassName: "align-top",
                render: (trx) => {
                    const items = trx.items || [];
                    const itemAktif = items.filter(
                        (it) => !it.tanggal_kembali_aktual,
                    ).length;
                    const isExpanded = expandedRowId === trx.id;
                    return (
                        <div>
                            <div className="font-medium">
                                {items.length} aset
                            </div>
                            <div className="text-xs text-base-content/70">
                                {itemAktif > 0
                                    ? `${itemAktif} belum kembali`
                                    : "semua sudah kembali"}
                            </div>
                            {isExpanded && (
                                <div className="mt-2 space-y-2 border-t border-base-content/10 pt-2">
                                    {items.length === 0 ? (
                                        <p className="text-xs italic text-base-content/50">
                                            Tidak ada item.
                                        </p>
                                    ) : (
                                        items.map((it) => {
                                            const sudahKembali =
                                                !!it.tanggal_kembali_aktual;
                                            const aset = it.detail_aset || {};
                                            return (
                                                <div
                                                    key={it.id}
                                                    className="flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">
                                                            {aset.kode_barang ||
                                                                "—"}
                                                            {aset.nama
                                                                ? ` · ${aset.nama}`
                                                                : ""}
                                                        </div>
                                                        <div className="text-xs text-base-content/60">
                                                            {aset.kategori_aset
                                                                ?.nama || "—"}
                                                            {aset.laboratorium
                                                                ?.nama
                                                                ? ` · ${aset.laboratorium.nama}`
                                                                : ""}
                                                        </div>
                                                        {sudahKembali && (
                                                            <div className="text-xs text-success">
                                                                Dikembalikan{" "}
                                                                {fmtDate(
                                                                    it.tanggal_kembali_aktual,
                                                                )}
                                                                {it.kondisi_setelah_kembali
                                                                    ? ` · kondisi: ${it.kondisi_setelah_kembali}`
                                                                    : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge
                                                            status={
                                                                sudahKembali
                                                                    ? "dikembalikan"
                                                                    : "dipinjam"
                                                            }
                                                            tone={
                                                                sudahKembali
                                                                    ? "success"
                                                                    : "warning"
                                                            }
                                                            label={
                                                                sudahKembali
                                                                    ? "kembali"
                                                                    : "dipinjam"
                                                            }
                                                        />
                                                        {!sudahKembali &&
                                                            canManage && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="success"
                                                                    onClick={() =>
                                                                        openKembalikanItem(
                                                                            trx,
                                                                            it,
                                                                        )
                                                                    }
                                                                >
                                                                    Kembalikan
                                                                </Button>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                key: "tanggal_pinjam",
                header: "Tgl Pinjam",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap align-top",
                render: (trx) => (
                    <span className="text-base-content/70">
                        {fmtDate(trx.tanggal_pinjam)}
                    </span>
                ),
            },
            {
                key: "tanggal_kembali_rencana",
                header: "Rencana Kembali",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap align-top",
                render: (trx) => (
                    <span className="text-base-content/70">
                        {fmtDate(trx.tanggal_kembali_rencana)}
                    </span>
                ),
            },
            {
                key: "status",
                header: "Status",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap align-top",
                render: (trx) => (
                    <StatusBadge
                        status={trx.status}
                        tone={STATUS_TONE[trx.status]}
                        label={STATUS_LABEL[trx.status] ?? trx.status}
                    />
                ),
            },
            {
                header: "Surat",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap align-top",
                render: (trx) =>
                    trx.surat_peminjaman_path ? (
                        <a
                            href={`/storage/${trx.surat_peminjaman_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-info inline-flex items-center gap-1"
                        >
                            <FileText className="h-4 w-4" />
                            Lihat
                        </a>
                    ) : (
                        <span className="text-base-content/40">—</span>
                    ),
            },
            ...(canManage
                ? [
                      {
                          header: "Aksi",
                          sortable: false,
                          searchable: false,
                          headerClassName: "text-right",
                          cellClassName: "align-top",
                          render: (trx) => {
                              const itemAktif = (trx.items || []).filter(
                                  (it) => !it.tanggal_kembali_aktual,
                              ).length;
                              return (
                                  <RowActions
                                      onDelete={() => setDeleteTarget(trx)}
                                  >
                                      {itemAktif > 0 && (
                                          <IconAction
                                              label="Kembalikan semua item"
                                              icon={RotateCcw}
                                              tone="success"
                                              onClick={() =>
                                                  openKembalikanTransaksi(trx)
                                              }
                                          />
                                      )}
                                  </RowActions>
                              );
                          },
                      },
                  ]
                : []),
        ],
        [canManage, expandedRowId],
    );

    return (
        <DashboardLayout>
            <Head title="Peminjaman Aset" />

            <PageHeader
                title="Peminjaman Aset"
                description="Kelola transaksi peminjaman aset laboratorium. Satu transaksi bisa berisi banyak aset."
                actions={
                    canManage && (
                        <Button onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            Tambah Peminjaman
                        </Button>
                    )
                }
            />

            <PageSection>
                <DataGrid
                    rows={peminjaman?.data ?? []}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari nama peminjam atau kode aset..."
                    emptyMessage="Belum ada catatan peminjaman."
                    defaultPerPage={Number(filters?.perPage) || 10}
                    filters={[
                        {
                            key: "status",
                            label: "Status",
                            options: STATUS_OPTIONS,
                        },
                    ]}
                    server={{
                        search: filters?.search || "",
                        perPage: Number(filters?.perPage) || 10,
                        page: peminjaman?.current_page ?? 1,
                        filters: { status: filters?.status || "" },
                        total: peminjaman?.total ?? 0,
                        from: peminjaman?.from ?? 0,
                        to: peminjaman?.to ?? 0,
                        lastPage: peminjaman?.last_page ?? 1,
                        onChange: applyServerQuery,
                    }}
                />
            </PageSection>

            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="flex items-start justify-between border-b border-base-content/10 p-5">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Tambah Peminjaman
                        </h3>
                        <p className="text-sm text-base-content/70">
                            Pilih satu atau lebih aset untuk peminjaman ini.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                        aria-label="Tutup"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form
                    onSubmit={handleCreateSubmit}
                    className="max-h-[70vh] space-y-4 overflow-y-auto p-5"
                >
                    <div className="w-full">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Pilih Aset{" "}
                                <span className="text-error">*</span>
                            </span>
                            <span className="text-xs text-base-content/60">
                                {createForm.data.aset_ids.length} terpilih
                            </span>
                        </div>
                        <input
                            type="text"
                            value={asetSearch}
                            onChange={(e) => setAsetSearch(e.target.value)}
                            placeholder="Cari kode/nama aset..."
                            className="input input-bordered mb-2 w-full min-h-11 focus:input-primary"
                        />
                        <div className="max-h-52 overflow-y-auto rounded-box border border-base-content/10">
                            {filteredAset.length === 0 ? (
                                <p className="px-3 py-4 text-center text-xs text-base-content/50">
                                    Tidak ada aset tersedia di lab ini.
                                </p>
                            ) : (
                                filteredAset.map((a) => {
                                    const checked =
                                        createForm.data.aset_ids.includes(a.id);
                                    return (
                                        <label
                                            key={a.id}
                                            className={`flex cursor-pointer items-start gap-2 border-b border-base-content/10 px-3 py-2 text-sm last:border-0 hover:bg-base-200 ${
                                                checked ? "bg-primary/10" : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleAsetId(a.id)
                                                }
                                                className="checkbox checkbox-sm mt-0.5"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium">
                                                    {a.kode_barang}
                                                    {a.nama
                                                        ? ` · ${a.nama}`
                                                        : ""}
                                                </span>
                                                <span className="block text-xs text-base-content/60">
                                                    {a.kategori_aset?.nama ||
                                                        "—"}
                                                    {a.laboratorium?.nama
                                                        ? ` · ${a.laboratorium.nama}`
                                                        : ""}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {createForm.errors.aset_ids && (
                            <p className="mt-1 text-xs text-error">
                                {createForm.errors.aset_ids}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField
                            label="Nama Peminjam"
                            required
                            error={createForm.errors.nama_peminjam}
                        >
                            <input
                                type="text"
                                value={createForm.data.nama_peminjam}
                                onChange={(e) =>
                                    createForm.setData(
                                        "nama_peminjam",
                                        e.target.value,
                                    )
                                }
                                required
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                        <FormField label="Institusi">
                            <input
                                type="text"
                                value={createForm.data.institusi}
                                onChange={(e) =>
                                    createForm.setData(
                                        "institusi",
                                        e.target.value,
                                    )
                                }
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField label="Jenis Jaminan">
                            <select
                                value={createForm.data.jenis_jaminan}
                                onChange={(e) =>
                                    createForm.setData(
                                        "jenis_jaminan",
                                        e.target.value,
                                    )
                                }
                                className="select select-bordered w-full min-h-11 focus:select-primary"
                            >
                                <option value="">Pilih jaminan...</option>
                                <option value="KTM">KTM</option>
                                <option value="KTP">KTP</option>
                                <option value="SIM">SIM</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </FormField>
                        <FormField label="Detail Jaminan">
                            <input
                                type="text"
                                value={createForm.data.detail_jaminan}
                                onChange={(e) =>
                                    createForm.setData(
                                        "detail_jaminan",
                                        e.target.value,
                                    )
                                }
                                placeholder="Nomor identitas / keterangan"
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                    </div>

                    <FormField label="Keperluan" required>
                        <textarea
                            value={createForm.data.keperluan}
                            onChange={(e) =>
                                createForm.setData("keperluan", e.target.value)
                            }
                            required
                            rows="2"
                            className="textarea textarea-bordered w-full"
                        />
                    </FormField>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField label="Tgl Pinjam" required>
                            <input
                                type="date"
                                value={createForm.data.tanggal_pinjam}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_pinjam",
                                        e.target.value,
                                    )
                                }
                                required
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                        <FormField label="Rencana Kembali" required>
                            <input
                                type="date"
                                value={createForm.data.tanggal_kembali_rencana}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_kembali_rencana",
                                        e.target.value,
                                    )
                                }
                                min={
                                    createForm.data.tanggal_pinjam || undefined
                                }
                                required
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                    </div>

                    <FormField label="Surat Peminjaman">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) =>
                                createForm.setData(
                                    "surat_peminjaman",
                                    e.target.files[0],
                                )
                            }
                            className="file-input file-input-bordered w-full min-h-11"
                        />
                    </FormField>

                    <FormField label="Catatan">
                        <textarea
                            value={createForm.data.catatan}
                            onChange={(e) =>
                                createForm.setData("catatan", e.target.value)
                            }
                            rows="2"
                            className="textarea textarea-bordered w-full"
                        />
                    </FormField>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={createForm.processing}>
                            Simpan Peminjaman
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={isKembalikanModalOpen}
                onClose={() => setIsKembalikanModalOpen(false)}
                maxWidth="md"
            >
                <div className="flex items-start justify-between border-b border-base-content/10 p-5">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {kembalikanMode === "item"
                                ? "Kembalikan Item"
                                : "Kembalikan Seluruh Aset"}
                        </h3>
                        <p className="text-sm text-base-content/70">
                            {kembalikanMode === "item" && selectedItem
                                ? `${selectedItem.detail_aset?.kode_barang || "-"} — ${selectedPeminjaman?.nama_peminjam || ""}`
                                : selectedPeminjaman
                                  ? `${selectedPeminjaman.items?.filter((it) => !it.tanggal_kembali_aktual).length || 0} item belum kembali — ${selectedPeminjaman.nama_peminjam}`
                                  : ""}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsKembalikanModalOpen(false)}
                        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                        aria-label="Tutup"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form
                    onSubmit={handleKembalikanSubmit}
                    className="space-y-4 p-5"
                >
                    <FormField
                        label="Tanggal Kembali Aktual"
                        required
                        error={
                            kembalikanForm.errors.tanggal_kembali_aktual
                        }
                    >
                        <input
                            type="date"
                            value={kembalikanForm.data.tanggal_kembali_aktual}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "tanggal_kembali_aktual",
                                    e.target.value,
                                )
                            }
                            required
                            className="input input-bordered block w-full min-h-11"
                        />
                    </FormField>
                    <FormField
                        label="Kondisi Setelah Kembali"
                        required
                        error={kembalikanForm.errors.kondisi_setelah_kembali}
                    >
                        <select
                            value={kembalikanForm.data.kondisi_setelah_kembali}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "kondisi_setelah_kembali",
                                    e.target.value,
                                )
                            }
                            className="select select-bordered block w-full min-h-11 focus:select-primary"
                            required
                        >
                            <option value="">Pilih kondisi...</option>
                            <option value="baik">Baik</option>
                            <option value="rusak">Rusak</option>
                            <option value="hilang">Hilang</option>
                        </select>
                    </FormField>
                    <FormField label="Catatan Pengembalian">
                        <textarea
                            value={kembalikanForm.data.catatan_kembali}
                            onChange={(e) =>
                                kembalikanForm.setData(
                                    "catatan_kembali",
                                    e.target.value,
                                )
                            }
                            rows="3"
                            placeholder="Catatan kondisi barang, kerusakan, dll..."
                            className="textarea textarea-bordered block w-full"
                        />
                    </FormField>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsKembalikanModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="success"
                            loading={kembalikanForm.processing}
                        >
                            Konfirmasi Pengembalian
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus Catatan Peminjaman"
                message={`Apakah Anda yakin ingin menghapus catatan peminjaman oleh "${deleteTarget?.nama_peminjam}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}
