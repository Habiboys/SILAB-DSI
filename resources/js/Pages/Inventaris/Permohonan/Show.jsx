import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_META = {
    draft: { label: "Draft", tone: "neutral" },
    diajukan: { label: "Diajukan (Menunggu Review Kalab)", tone: "warning" },
    disetujui_kalab: { label: "Disetujui Kalab", tone: "info" },
    ditolak_kalab: { label: "Ditolak Kalab", tone: "error" },
    disetujui_kadep: { label: "Disetujui Kadep (Final)", tone: "success" },
    ditolak_kadep: { label: "Ditolak Kadep", tone: "error" },
};

const ITEM_STATUS_META = {
    draft: { label: "Draft", tone: "neutral" },
    diajukan: { label: "Diajukan", tone: "warning" },
    disetujui_kalab: { label: "Disetujui Kalab", tone: "info" },
    ditolak_kalab: { label: "Ditolak Kalab", tone: "error" },
    disetujui_kadep: { label: "Disetujui Kadep", tone: "success" },
    ditolak_kadep: { label: "Ditolak Kadep", tone: "error" },
    dipesan: { label: "Dipesan", tone: "info" },
    diterima: { label: "Diterima / Jadi Aset", tone: "success" },
};

const URGENSI_META = {
    sangat_tinggi: { label: "sangat tinggi", tone: "error" },
    tinggi: { label: "tinggi", tone: "warning" },
    sedang: { label: "sedang", tone: "warning" },
    rendah: { label: "rendah", tone: "success" },
};

export default function PermohonanAsetShow({ permohonan, kategoriAset }) {
    const { can, isKalab, hasRole } = usePermission();

    const canSubmit = can("inventaris.manage-permohonan");
    const canReview =
        can("inventaris.review-permohonan") ||
        isKalab() ||
        hasRole("superadmin");
    const canApprove =
        can("inventaris.approve-final") ||
        hasRole("kadep") ||
        hasRole("superadmin");
    const canConvert =
        can("inventaris.convert-to-aset") || hasRole("superadmin");

    const status = permohonan.status_permohonan;
    const isDraft = status === "draft";
    const isAjukan = status === "diajukan";
    const isSetujuiKalab = status === "disetujui_kalab";

    const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
    const handleSubmit = () => {
        router.post(
            route("inventaris.permohonan.submit", permohonan.id),
            {},
            {
                onSuccess: () => {
                    setIsSubmitConfirmOpen(false);
                    toast.success("Permohonan berhasil diajukan ke Kalab");
                },
                onError: () => toast.error("Gagal mengajukan permohonan"),
            },
        );
    };

    const buildInitialDecisions = () => {
        const obj = {};
        (permohonan.wishlist_aset || []).forEach((item) => {
            obj[item.id] = {
                status:
                    item.status_item === "diajukan"
                        ? "disetujui_kalab"
                        : item.status_item,
                jumlah_disetujui: item.jumlah_disetujui ?? item.jumlah_diminta,
                catatan: item.catatan_item ?? "",
            };
        });
        return obj;
    };
    const [itemDecisions, setItemDecisions] = useState(buildInitialDecisions);
    const [catatanReview, setCatatanReview] = useState(
        permohonan.catatan_review ?? "",
    );
    const [isReviewConfirm, setIsReviewConfirm] = useState(false);

    const reviewForm = useForm({
        keputusan: "disetujui_kalab",
        catatan_review: "",
        items: {},
    });

    const updateItemDecision = (id, field, value) =>
        setItemDecisions((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value },
        }));

    const computeKalabDecision = () => {
        const statuses = Object.values(itemDecisions).map((d) => d.status);
        return statuses.every((s) => s === "ditolak_kalab")
            ? "ditolak_kalab"
            : "disetujui_kalab";
    };

    const handleSaveReview = () => {
        const overall = computeKalabDecision();
        reviewForm.transform(() => ({
            keputusan: overall,
            catatan_review: catatanReview,
            items: itemDecisions,
        }));
        reviewForm.post(
            route("inventaris.permohonan.review-kalab", permohonan.id),
            {
                onSuccess: () => {
                    setIsReviewConfirm(false);
                    toast.success("Review Kalab berhasil disimpan");
                },
                onError: () => toast.error("Gagal menyimpan review"),
            },
        );
    };

    const [kadepDecision, setKadepDecision] = useState("disetujui_kadep");
    const [catatanKadep, setCatatanKadep] = useState(
        permohonan.catatan_approval ?? "",
    );
    const [isKadepConfirm, setIsKadepConfirm] = useState(false);
    const kadepForm = useForm({
        keputusan: "disetujui_kadep",
        catatan_approval: "",
    });

    const handleKadepApprove = () => {
        kadepForm.transform(() => ({
            keputusan: kadepDecision,
            catatan_approval: catatanKadep,
        }));
        kadepForm.post(
            route("inventaris.permohonan.approve-kadep", permohonan.id),
            {
                onSuccess: () => {
                    setIsKadepConfirm(false);
                    toast.success("Keputusan Kadep berhasil disimpan");
                },
                onError: () => toast.error("Gagal menyimpan keputusan Kadep"),
            },
        );
    };

    const [convertItem, setConvertItem] = useState(null);
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const convertForm = useForm({
        kategori_aset_id: "",
        laboratorium_id: permohonan.laboratorium_id ?? "",
        kode_barang: "",
        kode_barang_list_text: "",
        nama: "",
        keadaan: "baik",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "pengadaan",
        keterangan: "",
    });

    const openConvert = (item) => {
        setConvertItem(item);
        convertForm.setData("nama", item.nama_barang);
        convertForm.setData("harga_perolehan", item.perkiraan_harga ?? "");
        convertForm.setData("kode_barang", "");
        convertForm.setData("kode_barang_list_text", "");
        setIsConvertOpen(true);
    };

    const handleConvert = (e) => {
        e.preventDefault();
        convertForm.transform((data) => {
            const { kode_barang_list_text, ...rest } = data;
            const list = (kode_barang_list_text || "")
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
            return {
                ...rest,
                kode_barang_list: list,
            };
        });
        convertForm.post(
            route("inventaris.wishlist.convert-to-aset", convertItem.id),
            {
                onSuccess: () => {
                    setIsConvertOpen(false);
                    toast.success("Aset berhasil ditambahkan");
                },
                onError: () =>
                    toast.error(
                        "Gagal menambahkan aset, periksa kembali inputan",
                    ),
            },
        );
    };

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              })
            : "-";
    const fmtMoney = (n) =>
        n
            ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
              }).format(n)
            : "-";

    const columns = useMemo(
        () => [
            {
                key: "nama_barang",
                header: "Nama Barang",
                sortable: false,
                render: (item) => (
                    <div className="font-medium">
                        {item.nama_barang}
                        {item.referensi_url && (
                            <a
                                href={item.referensi_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-info ml-2 text-xs"
                            >
                                (Ref)
                            </a>
                        )}
                    </div>
                ),
            },
            {
                header: "Spesifikasi",
                sortable: false,
                searchable: false,
                cellClassName: "max-w-[180px]",
                render: (item) => (
                    <div className="truncate" title={item.spesifikasi_teknis}>
                        {item.spesifikasi_teknis || "-"}
                    </div>
                ),
            },
            {
                header: "Jumlah",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap",
                render: (item) => (
                    <div>
                        {item.jumlah_diminta} {item.satuan || "unit"}
                        {item.jumlah_disetujui != null &&
                            !["draft", "diajukan"].includes(
                                item.status_item,
                            ) && (
                                <div className="mt-0.5 text-xs font-medium text-success">
                                    Disetujui: {item.jumlah_disetujui}
                                </div>
                            )}
                    </div>
                ),
            },
            {
                header: "Est. Harga",
                sortable: false,
                searchable: false,
                cellClassName: "whitespace-nowrap",
                render: (item) => (
                    <span className="text-base-content/70">
                        {fmtMoney(item.perkiraan_harga)}
                    </span>
                ),
            },
            {
                key: "urgensi",
                header: "Urgensi",
                sortable: false,
                cellClassName: "whitespace-nowrap",
                render: (item) => {
                    const meta = URGENSI_META[item.urgensi] ?? {
                        label: item.urgensi?.replace("_", " ") ?? "-",
                        tone: "neutral",
                    };
                    return (
                        <StatusBadge
                            status={item.urgensi}
                            tone={meta.tone}
                            label={meta.label}
                        />
                    );
                },
            },
            {
                key: "status_item",
                header: "Status Item",
                sortable: false,
                render: (item) => {
                    const meta = ITEM_STATUS_META[item.status_item] ?? {
                        label: item.status_item,
                        tone: "neutral",
                    };
                    return (
                        <div>
                            <StatusBadge
                                status={item.status_item}
                                tone={meta.tone}
                                label={meta.label}
                            />
                            {item.catatan_item && (
                                <p className="mt-0.5 text-xs italic text-base-content/60">
                                    {item.catatan_item}
                                </p>
                            )}
                        </div>
                    );
                },
            },
            ...(canReview && isAjukan
                ? [
                      {
                          header: "Keputusan Kalab",
                          sortable: false,
                          searchable: false,
                          headerClassName: "min-w-[240px]",
                          render: (item) => {
                              const dec = itemDecisions[item.id] ?? {
                                  status: "disetujui_kalab",
                                  jumlah_disetujui: item.jumlah_diminta,
                                  catatan: "",
                              };
                              const isApproving =
                                  dec.status === "disetujui_kalab";
                              return (
                                  <div className="space-y-2">
                                      <div
                                          role="group"
                                          aria-label={`Keputusan untuk ${item.nama_barang}`}
                                          className="join w-full"
                                      >
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  updateItemDecision(
                                                      item.id,
                                                      "status",
                                                      "disetujui_kalab",
                                                  )
                                              }
                                              aria-pressed={isApproving}
                                              className={`btn join-item min-h-11 flex-1 ${isApproving ? "btn-primary" : "btn-ghost border border-base-300"}`}
                                          >
                                              <Check className="h-3.5 w-3.5" />
                                              Setuju
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() =>
                                                  updateItemDecision(
                                                      item.id,
                                                      "status",
                                                      "ditolak_kalab",
                                                  )
                                              }
                                              aria-pressed={!isApproving}
                                              className={`btn join-item min-h-11 flex-1 ${!isApproving ? "btn-error" : "btn-ghost border border-base-300"}`}
                                          >
                                              <X className="h-3.5 w-3.5" />
                                              Tolak
                                          </button>
                                      </div>
                                      {isApproving && (
                                          <div className="flex items-center gap-1.5">
                                              <label className="text-xs text-base-content/70">
                                                  Jml:
                                              </label>
                                              <input
                                                  type="number"
                                                  min="0"
                                                  max={item.jumlah_diminta}
                                                  value={dec.jumlah_disetujui}
                                                  onChange={(e) =>
                                                      updateItemDecision(
                                                          item.id,
                                                          "jumlah_disetujui",
                                                          e.target.value,
                                                      )
                                                  }
                                                  aria-label={`Jumlah disetujui untuk ${item.nama_barang}`}
                                                  className="input input-bordered input-xs w-16"
                                              />
                                              <span className="text-xs text-base-content/50">
                                                  / {item.jumlah_diminta}
                                              </span>
                                          </div>
                                      )}
                                      <input
                                          type="text"
                                          value={dec.catatan}
                                          onChange={(e) =>
                                              updateItemDecision(
                                                  item.id,
                                                  "catatan",
                                                  e.target.value,
                                              )
                                          }
                                          placeholder="Catatan (opsional)"
                                          aria-label={`Catatan untuk ${item.nama_barang}`}
                                          className="input input-bordered input-sm w-full"
                                      />
                                  </div>
                              );
                          },
                      },
                  ]
                : []),
            ...(canConvert && status === "disetujui_kadep"
                ? [
                      {
                          header: "Aksi",
                          sortable: false,
                          searchable: false,
                          headerClassName: "text-right whitespace-nowrap",
                          cellClassName: "whitespace-nowrap",
                          render: (item) => {
                              const alreadyConverted =
                                  (item.detail_asets?.length ?? 0) > 0;
                              if (
                                  item.status_item === "disetujui_kadep" &&
                                  !alreadyConverted
                              ) {
                                  return (
                                      <div className="flex justify-end">
                                          <Button
                                              size="sm"
                                              variant="success"
                                              onClick={() => openConvert(item)}
                                          >
                                              Jadikan Aset
                                          </Button>
                                      </div>
                                  );
                              }
                              if (
                                  item.status_item === "diterima" ||
                                  alreadyConverted
                              ) {
                                  return (
                                      <span className="text-xs font-medium text-success">
                                          Sudah jadi aset
                                      </span>
                                  );
                              }
                              return (
                                  <span className="text-base-content/40">
                                      —
                                  </span>
                              );
                          },
                      },
                  ]
                : []),
        ],
        [canConvert, canReview, isAjukan, itemDecisions, status],
    );

    return (
        <DashboardLayout>
            <Head
                title={`Detail Permohonan ${permohonan.nomor_permohonan}`}
            />

            <PageHeader
                title="Detail Permohonan Aset"
                description={permohonan.nomor_permohonan}
                actions={
                    <Button
                        variant="ghost"
                        href={route("inventaris.permohonan.index")}
                    >
                        Kembali
                    </Button>
                }
            />

            <div className="space-y-6">

            <PageSection title="Informasi Permohonan">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-base-content/60">
                                Tanggal
                            </p>
                            <p className="text-sm font-medium">
                                {fmtDate(permohonan.tanggal_permohonan)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-base-content/60">
                                Status
                            </p>
                            <div className="mt-1">
                                <StatusBadge
                                    status={status}
                                    tone={STATUS_META[status]?.tone}
                                    label={
                                        STATUS_META[status]?.label ?? status
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-base-content/10 pt-2">
                            {permohonan.reviewer && (
                                <div className="text-xs text-base-content/70">
                                    <span className="font-medium text-info">
                                        Review Kalab
                                    </span>{" "}
                                    oleh {permohonan.reviewer.name} ·{" "}
                                    {fmtDate(permohonan.reviewed_at)}
                                    {permohonan.catatan_review && (
                                        <p className="mt-0.5 italic text-base-content/60">
                                            {permohonan.catatan_review}
                                        </p>
                                    )}
                                </div>
                            )}
                            {permohonan.approver && (
                                <div className="text-xs text-base-content/70">
                                    <span className="font-medium text-success">
                                        ACC Kadep
                                    </span>{" "}
                                    oleh {permohonan.approver.name} ·{" "}
                                    {fmtDate(permohonan.approved_at)}
                                    {permohonan.catatan_approval && (
                                        <p className="mt-0.5 italic text-base-content/60">
                                            {permohonan.catatan_approval}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-base-content/60">Nama</p>
                            <p className="text-sm font-medium">
                                {permohonan.user_pemohon?.name ?? "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-base-content/60">
                                Laboratorium
                            </p>
                            <p className="text-sm">
                                {permohonan.laboratorium?.nama ?? "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-base-content/60">
                                Alasan Pengadaan
                            </p>
                            <p className="mt-1 rounded-box bg-base-200 p-3 text-sm">
                                {permohonan.alasan_umum_pengadaan}
                            </p>
                        </div>
                    </div>
                </div>
            </PageSection>

            {isDraft && canSubmit && (
                <div role="alert" className="alert alert-warning">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Permohonan masih dalam tahap Draft
                            </p>
                            <p className="text-xs text-base-content/70">
                                Klik &quot;Ajukan ke Kalab&quot; untuk mengirim
                                ke proses review.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="warning"
                                onClick={() => setIsSubmitConfirmOpen(true)}
                            >
                                Ajukan ke Kalab
                            </Button>
                            <Button
                                variant="info"
                                href={route("inventaris.permohonan.index")}
                            >
                                Edit Draft
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <PageSection
                title="Daftar Barang yang Diminta"
                actions={
                    canReview &&
                    isAjukan && (
                        <div className="flex items-center gap-3 text-xs text-base-content/70">
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-3 w-3 rounded-full bg-primary" />{" "}
                                Setujui Kalab
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-3 w-3 rounded-full bg-error" />{" "}
                                Tolak
                            </span>
                        </div>
                    )
                }
            >
                <DataGrid
                    rows={permohonan.wishlist_aset ?? []}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari nama barang..."
                    emptyMessage="Belum ada barang yang diminta."
                />
            </PageSection>

            {canReview && isAjukan && (
                <PageSection
                    title="Keputusan Review Kalab"
                    description={
                        <span>
                            Keputusan akhir:{" "}
                            <span
                                className={
                                    computeKalabDecision() ===
                                    "disetujui_kalab"
                                        ? "font-semibold text-info"
                                        : "font-semibold text-error"
                                }
                            >
                                {computeKalabDecision() === "disetujui_kalab"
                                    ? "Disetujui (lanjut ke Kadep)"
                                    : "Ditolak"}
                            </span>
                        </span>
                    }
                >
                    <div className="space-y-4">
                        <FormField label="Catatan Review (opsional)">
                            <textarea
                                value={catatanReview}
                                onChange={(e) =>
                                    setCatatanReview(e.target.value)
                                }
                                rows="3"
                                placeholder="Catatan keseluruhan untuk pemohon..."
                                className="textarea textarea-bordered w-full focus:textarea-primary"
                            />
                        </FormField>
                        <div className="flex justify-end">
                            <Button
                                loading={reviewForm.processing}
                                onClick={() => setIsReviewConfirm(true)}
                            >
                                Simpan Keputusan Kalab
                            </Button>
                        </div>
                    </div>
                </PageSection>
            )}

            {canApprove && isSetujuiKalab && (
                <PageSection
                    title="ACC Kepala Departemen"
                    description="Permohonan telah direview oleh Kalab dan menunggu persetujuan final Kadep."
                >
                    <div className="space-y-4">
                        <div>
                            <span className="mb-2 block text-sm font-medium">
                                Keputusan
                            </span>
                            <div
                                role="group"
                                aria-label="Keputusan Kadep"
                                className="join w-full"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setKadepDecision("disetujui_kadep")
                                    }
                                    aria-pressed={
                                        kadepDecision === "disetujui_kadep"
                                    }
                                    className={`btn join-item min-h-11 flex-1 ${kadepDecision === "disetujui_kadep" ? "btn-success" : "btn-ghost border border-base-300"}`}
                                >
                                    <Check className="h-4 w-4" />
                                    ACC (Setujui)
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setKadepDecision("ditolak_kadep")
                                    }
                                    aria-pressed={
                                        kadepDecision === "ditolak_kadep"
                                    }
                                    className={`btn join-item min-h-11 flex-1 ${kadepDecision === "ditolak_kadep" ? "btn-error" : "btn-ghost border border-base-300"}`}
                                >
                                    <X className="h-4 w-4" />
                                    Tolak
                                </button>
                            </div>
                        </div>
                        <FormField label="Catatan Kadep (opsional)">
                            <textarea
                                value={catatanKadep}
                                onChange={(e) =>
                                    setCatatanKadep(e.target.value)
                                }
                                rows="3"
                                className="textarea textarea-bordered w-full"
                            />
                        </FormField>
                        <div className="flex justify-end">
                            <Button
                                variant={
                                    kadepDecision === "disetujui_kadep"
                                        ? "success"
                                        : "danger"
                                }
                                loading={kadepForm.processing}
                                onClick={() => setIsKadepConfirm(true)}
                            >
                                Konfirmasi Keputusan Kadep
                            </Button>
                        </div>
                    </div>
                </PageSection>
            )}
            </div>

            <ConfirmModal
                show={isSubmitConfirmOpen}
                onClose={() => setIsSubmitConfirmOpen(false)}
                onConfirm={handleSubmit}
                title="Ajukan Permohonan?"
                message="Permohonan akan dikirim ke Kalab untuk direview. Pastikan semua item sudah benar."
                confirmText="Ya, Ajukan"
                cancelText="Batal"
                type="warning"
            />

            <ConfirmModal
                show={isReviewConfirm}
                onClose={() => setIsReviewConfirm(false)}
                onConfirm={handleSaveReview}
                title="Konfirmasi Review Kalab"
                confirmText="Simpan Review"
                cancelText="Kembali"
                type="info"
                message={
                    <span className="block space-y-1">
                        {(permohonan.wishlist_aset || []).map((item) => {
                            const d = itemDecisions[item.id];
                            return (
                                <span
                                    key={item.id}
                                    className="flex items-center justify-between gap-2 border-b border-base-content/10 py-1 last:border-0"
                                >
                                    <span className="truncate">
                                        {item.nama_barang}
                                    </span>
                                    <StatusBadge
                                        status={
                                            d?.status === "disetujui_kalab"
                                                ? "disetujui_kalab"
                                                : "ditolak_kalab"
                                        }
                                        tone={
                                            d?.status === "disetujui_kalab"
                                                ? "info"
                                                : "error"
                                        }
                                        label={
                                            d?.status === "disetujui_kalab"
                                                ? `${d.jumlah_disetujui} ${item.satuan || "unit"}`
                                                : "Ditolak"
                                        }
                                    />
                                </span>
                            );
                        })}
                    </span>
                }
            />

            <ConfirmModal
                show={isKadepConfirm}
                onClose={() => setIsKadepConfirm(false)}
                onConfirm={handleKadepApprove}
                title="Konfirmasi Keputusan Kadep"
                confirmText="Ya, Konfirmasi"
                cancelText="Batal"
                type={kadepDecision === "disetujui_kadep" ? "info" : "danger"}
                message={
                    <span>
                        Anda akan{" "}
                        <strong
                            className={
                                kadepDecision === "disetujui_kadep"
                                    ? "text-success"
                                    : "text-error"
                            }
                        >
                            {kadepDecision === "disetujui_kadep"
                                ? "menyetujui"
                                : "menolak"}
                        </strong>{" "}
                        permohonan ini secara final. Tindakan ini tidak dapat
                        dibatalkan.
                    </span>
                }
            />

            <Modal
                show={isConvertOpen}
                onClose={() => setIsConvertOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleConvert}>
                    <div className="border-b border-base-content/10 p-5">
                        <h3 className="text-lg font-semibold">
                            Tambahkan sebagai Aset
                        </h3>
                        <p className="mt-1 text-sm text-base-content/70">
                            Item: <strong>{convertItem?.nama_barang}</strong>
                        </p>
                        <p className="mt-1 text-xs text-base-content/60">
                            Jumlah disetujui:{" "}
                            <span className="font-medium">
                                {convertItem?.jumlah_disetujui ??
                                    convertItem?.jumlah_diminta ??
                                    1}
                            </span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <FormField
                            label="Kategori Aset"
                            required
                            error={convertForm.errors.kategori_aset_id}
                        >
                            <select
                                value={convertForm.data.kategori_aset_id}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "kategori_aset_id",
                                        e.target.value,
                                    )
                                }
                                className="select select-bordered w-full min-h-11 focus:select-primary"
                                required
                            >
                                <option value="">Pilih kategori...</option>
                                {(kategoriAset || []).map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <div>
                            {(convertItem?.jumlah_disetujui ??
                                convertItem?.jumlah_diminta ??
                                1) <= 1 ? (
                                <FormField
                                    label="Kode Barang"
                                    required
                                    error={convertForm.errors.kode_barang}
                                >
                                    <input
                                        type="text"
                                        value={convertForm.data.kode_barang}
                                        onChange={(e) =>
                                            convertForm.setData(
                                                "kode_barang",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                        required
                                    />
                                </FormField>
                            ) : (
                                <FormField
                                    label="Kode Barang per Unit"
                                    required
                                    hint={`Wajib ${
                                        convertItem?.jumlah_disetujui ??
                                        convertItem?.jumlah_diminta ??
                                        1
                                    } kode, satu baris per kode.`}
                                    error={
                                        convertForm.errors.kode_barang_list ||
                                        convertForm.errors["kode_barang_list.0"]
                                    }
                                >
                                    <textarea
                                        value={
                                            convertForm.data
                                                .kode_barang_list_text
                                        }
                                        onChange={(e) =>
                                            convertForm.setData(
                                                "kode_barang_list_text",
                                                e.target.value,
                                            )
                                        }
                                        rows="4"
                                        placeholder="Masukkan 1 kode per baris"
                                        className="textarea textarea-bordered w-full"
                                        required
                                    />
                                </FormField>
                            )}
                        </div>
                        <FormField label="Nama Spesifik" required>
                            <input
                                type="text"
                                value={convertForm.data.nama}
                                onChange={(e) =>
                                    convertForm.setData("nama", e.target.value)
                                }
                                className="input input-bordered w-full min-h-11"
                                required
                            />
                        </FormField>
                        <FormField label="Keadaan" required>
                            <select
                                value={convertForm.data.keadaan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "keadaan",
                                        e.target.value,
                                    )
                                }
                                className="select select-bordered w-full min-h-11 focus:select-primary"
                                required
                            >
                                <option value="baik">Baik</option>
                                <option value="rusak">Rusak</option>
                            </select>
                        </FormField>
                        <FormField label="Tanggal Perolehan">
                            <input
                                type="date"
                                value={convertForm.data.tanggal_perolehan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "tanggal_perolehan",
                                        e.target.value,
                                    )
                                }
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                        <FormField label="Harga Perolehan">
                            <input
                                type="number"
                                min="0"
                                value={convertForm.data.harga_perolehan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "harga_perolehan",
                                        e.target.value,
                                    )
                                }
                                className="input input-bordered w-full min-h-11"
                            />
                        </FormField>
                        <FormField label="Asal Barang">
                            <select
                                value={convertForm.data.asal_barang}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "asal_barang",
                                        e.target.value,
                                    )
                                }
                                className="select select-bordered w-full min-h-11 focus:select-primary"
                            >
                                <option value="pengadaan">Pengadaan</option>
                                <option value="hibah">Hibah</option>
                                <option value="pembelian_mandiri">
                                    Pembelian Mandiri
                                </option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </FormField>
                        <FormField
                            label="Keterangan"
                            className="sm:col-span-2"
                        >
                            <textarea
                                value={convertForm.data.keterangan}
                                onChange={(e) =>
                                    convertForm.setData(
                                        "keterangan",
                                        e.target.value,
                                    )
                                }
                                rows="2"
                                className="textarea textarea-bordered w-full"
                            />
                        </FormField>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-base-content/10 bg-base-200 px-5 py-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsConvertOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="success"
                            loading={convertForm.processing}
                        >
                            Simpan sebagai Aset
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
