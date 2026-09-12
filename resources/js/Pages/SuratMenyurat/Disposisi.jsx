import Button from "@/Components/Button";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeft, CheckCircle, Clock, Download, Eye, Plus, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Disposisi = ({ surat, disposisi, anggotaLab, currentUser, flash, canCreate, canUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const form = useForm({ kepada_user_id: "", catatan: "" });

    const handleAdd = (event) => {
        event.preventDefault();
        form.post(route("surat-menyurat.disposisi.store", surat.id), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                form.reset();
                toast.success("Disposisi berhasil ditambahkan");
            },
            onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal menambahkan disposisi"),
        });
    };

    const handleUpdateStatus = (disposisiId, status) => {
        router.patch(route("surat-menyurat.disposisi.update-status", disposisiId), { status }, {
            onSuccess: () => toast.success("Status disposisi diperbarui"),
            onError: () => toast.error("Gagal memperbarui status"),
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const formatDate = (value) => (value ? new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
    const formatDateShort = (value) => (value ? new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");

    const suratFields = [
        ["No agenda", `#${surat.nomor_agenda}`],
        ["Nomor surat asal", surat.nomor_surat_asal],
        ["Asal surat", surat.asal_surat],
        ["Tanggal surat", formatDateShort(surat.tanggal_surat)],
        ["Tanggal terima", formatDateShort(surat.tanggal_terima)],
        ["Diterima oleh", surat.diterima_oleh],
    ];

    return (
        <DashboardLayout>
            <Head title={`Disposisi – ${surat.perihal}`} />
            <PageHeader
                title={surat.perihal}
                description={surat.lab}
                actions={
                    <>
                        <Button variant="ghost" onClick={() => history.back()}><ArrowLeft className="h-4 w-4" />Kembali</Button>
                        {surat.file_surat && <Button variant="ghost" href={route("surat-menyurat.surat-masuk.download", surat.id)}><Download className="h-4 w-4" />Unduh berkas</Button>}
                    </>
                }
            />
            <PageSection title="Detail surat">
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    {suratFields.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-base-content/60">{label}</dt>
                            <dd className="font-medium">{value || "-"}</dd>
                        </div>
                    ))}
                    {surat.isi_ringkas && (
                        <div className="sm:col-span-3">
                            <dt className="text-base-content/60">Isi ringkas</dt>
                            <dd className="mt-0.5 whitespace-pre-line font-medium">{surat.isi_ringkas}</dd>
                        </div>
                    )}
                </dl>
            </PageSection>

            <div className="mt-5">
                <PageSection title="Riwayat disposisi" description={`${disposisi.length} disposisi`} actions={canCreate && <Button onClick={() => { form.reset(); form.clearErrors(); setIsAddModalOpen(true); }}><Plus className="h-4 w-4" />Tambah disposisi</Button>}>
                    {disposisi.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center text-base-content/60">
                            <Send className="h-10 w-10" aria-hidden="true" />
                            <p>Belum ada disposisi untuk surat ini.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-base-300">
                            {disposisi.map((item) => {
                                const isOwner = item.kepada_user_id === currentUser?.id;
                                return (
                                    <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium">{item.dari_user}</span>
                                                    <Send className="h-3.5 w-3.5 text-base-content/50" aria-hidden="true" />
                                                    <span className="font-medium">{item.kepada_user}</span>
                                                    <StatusBadge status={item.status} />
                                                </div>
                                                {item.catatan && <p className="mt-2 rounded-md bg-base-200 px-3 py-2 text-sm">{item.catatan}</p>}
                                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-base-content/60">
                                                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />Dikirim: {formatDate(item.created_at)}</span>
                                                    {item.dibaca_at && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />Dibaca: {formatDate(item.dibaca_at)}</span>}
                                                    {item.diselesaikan_at && <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" aria-hidden="true" />Selesai: {formatDate(item.diselesaikan_at)}</span>}
                                                </div>
                                            </div>
                                            {canUpdate && isOwner && item.status !== "selesai" && (
                                                <div className="flex flex-shrink-0 flex-wrap gap-2">
                                                    {item.status === "belum_dibaca" && <Button size="sm" variant="warning" onClick={() => handleUpdateStatus(item.id, "sudah_dibaca")}>Tandai dibaca</Button>}
                                                    <Button size="sm" variant="success" onClick={() => handleUpdateStatus(item.id, "selesai")}>Selesai</Button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </PageSection>
            </div>

            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
                    <h2 className="text-lg font-semibold">Tambah disposisi</h2>
                    <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={() => setIsAddModalOpen(false)} aria-label="Tutup"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Kepada" error={form.errors.kepada_user_id} required>
                        <select className="select select-bordered min-h-11 w-full" value={form.data.kepada_user_id} onChange={(e) => form.setData("kepada_user_id", e.target.value)} required>
                            <option value="">Pilih anggota</option>
                            {anggotaLab?.map((anggota) => <option key={anggota.id} value={anggota.id}>{anggota.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Catatan" error={form.errors.catatan}>
                        <textarea rows={4} className="textarea textarea-bordered w-full" placeholder="Instruksi atau catatan untuk penerima..." value={form.data.catatan} onChange={(e) => form.setData("catatan", e.target.value)} />
                    </FormField>
                    <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                        <Button type="submit" loading={form.processing}>Kirim disposisi</Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Disposisi;
