import { Head } from "@inertiajs/react";
import { ArrowRight, History, Package } from "lucide-react";
import EmptyState from "@/Components/EmptyState";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";

function dateLabel(value, withTime = false) {
    if (!value) return "Belum tercatat";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Belum tercatat";
    return date.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}

function Details({ rows }) {
    return <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{rows.map(([label, value]) => (
        <div key={label} className="min-w-0 space-y-1">
            <dt className="text-xs text-base-content/60">{label}</dt>
            <dd className="break-words text-sm font-medium">{value ?? "Belum tercatat"}</dd>
        </div>
    ))}</dl>;
}

export default function PublicDetail({ aset, kategori, laboratorium }) {
    const history = aset.riwayat_kondisi || [];
    const price = aset.harga_perolehan != null && aset.harga_perolehan !== ""
        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(aset.harga_perolehan))
        : "Belum tercatat";

    return (
        <div className="min-h-screen bg-base-200 text-base-content">
            <Head title={`Detail aset: ${aset.nama || aset.kode_barang}`} />
            <header className="border-b border-base-300 bg-base-100">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
                    <img src="/images/silab2.png" alt="Logo SILAB" className="h-9 w-auto shrink-0" />
                    <div><p className="text-sm font-bold">SILAB</p><p className="text-xs text-base-content/60">Informasi aset laboratorium</p></div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
                <PageHeader title={aset.nama || kategori?.nama || "Detail aset"} description={laboratorium?.nama || "Laboratorium belum tercatat"}
                    actions={<div className="flex flex-wrap gap-2"><StatusBadge status={aset.keadaan || "Tidak diketahui"} /><StatusBadge status={aset.status || "Tidak diketahui"} /></div>} />
                <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <PageSection title="Foto aset" bodyClassName="space-y-3">
                        {aset.foto ? <img src={`/storage/${aset.foto}`} alt={aset.nama || aset.kode_barang} className="max-h-96 w-full rounded-lg bg-base-200 object-contain" />
                            : <EmptyState icon={Package} title="Foto aset belum tersedia" className="min-h-52 rounded-lg bg-base-200" />}
                        <p className="break-all font-mono text-sm text-base-content/70">{aset.kode_barang}</p>
                    </PageSection>
                    <div className="space-y-5">
                        <PageSection title="Identitas aset"><Details rows={[
                            ["Nama aset", aset.nama || "Belum tercatat"], ["Kode barang", aset.kode_barang],
                            ["Kategori", kategori?.nama], ["Laboratorium", laboratorium?.nama],
                            ["Dicatat pada", dateLabel(aset.created_at)], ["Terakhir diperbarui", dateLabel(aset.updated_at)],
                        ]} /></PageSection>
                        <PageSection title="Deskripsi dan keterangan">
                            <div className="space-y-4 text-sm">
                                <div><h3 className="mb-1 text-xs font-medium text-base-content/60">Keterangan aset</h3>
                                    <p className="whitespace-pre-wrap break-words">{aset.keterangan || "Keterangan aset belum tersedia."}</p></div>
                                {kategori?.deskripsi && <div><h3 className="mb-1 text-xs font-medium text-base-content/60">Deskripsi kategori</h3>
                                    <p className="whitespace-pre-wrap break-words">{kategori.deskripsi}</p></div>}
                            </div>
                        </PageSection>
                        <PageSection title="Informasi perolehan"><Details rows={[
                            ["Tanggal perolehan", dateLabel(aset.tanggal_perolehan)], ["Harga perolehan", price],
                            ["Asal barang", aset.asal_barang || "Belum tercatat"],
                        ]} /></PageSection>
                    </div>
                </div>
                <PageSection title="Riwayat kondisi" description="Perubahan kondisi barang, dari catatan terbaru.">
                    {history.length ? <ol className="divide-y divide-base-200">{history.map((entry) => (
                        <li key={entry.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status={entry.kondisi_sebelum || "Tidak diketahui"} />
                                    <ArrowRight className="h-4 w-4 text-base-content/50" aria-label="berubah menjadi" />
                                    <StatusBadge status={entry.kondisi_sesudah || "Tidak diketahui"} />
                                </div>
                                <time dateTime={entry.created_at} className="text-xs text-base-content/60">{dateLabel(entry.created_at, true)}</time>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm">{entry.catatan || "Tidak ada catatan tambahan."}</p>
                            <p className="text-xs text-base-content/60">Dicatat oleh {entry.pencatat?.name || "Petugas laboratorium"}</p>
                        </li>
                    ))}</ol> : <EmptyState icon={History} title="Belum ada riwayat kondisi" description="Perubahan kondisi yang dicatat petugas akan tampil di sini." />}
                </PageSection>
            </main>
        </div>
    );
}
