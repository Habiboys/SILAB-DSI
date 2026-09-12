import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Download, Plus, Settings, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SuratKeluar = ({ suratKeluar, kepengurusanLab, konfigurasi, filters, flash, canCreate, canEdit, canDelete, canExport, canConfig }) => {
    const { selected_kepengurusan } = usePage().props;
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [modal, setModal] = useState(null);
    const [selectedSurat, setSelectedSurat] = useState(null);

    const createForm = useForm({ kepengurusan_lab_id: kepengurusanLab?.id || "", perihal: "", tujuan: "", tanggal_surat: "", isi_ringkas: "", kode_klasifikasi: "", file_surat: null });
    const editForm = useForm({ perihal: "", tujuan: "", tanggal_surat: "", isi_ringkas: "", kode_klasifikasi: "", file_surat: null });

    const buildParams = useCallback((extra = {}) => {
        const params = {};
        if (selected_kepengurusan?.id) params.kepengurusan_lab_id = selected_kepengurusan.id;
        else if (kepengurusanLab?.id) params.kepengurusan_lab_id = kepengurusanLab.id;
        params.search = search;
        params.perPage = perPage;
        return { ...params, ...extra };
    }, [selected_kepengurusan, kepengurusanLab, search, perPage]);

    const navigate = (extra = {}) => router.get(route("surat-menyurat.surat-keluar.index"), buildParams(extra), { preserveState: true, replace: true });

    const debouncedSearch = useCallback(debounce((value) => navigate({ search: value, perPage }), 400), [kepengurusanLab, perPage, selected_kepengurusan]);

    const onSearchChange = (event) => { setSearch(event.target.value); debouncedSearch(event.target.value); };
    const onPerPageChange = (event) => { const value = Number(event.target.value); setPerPage(value); navigate({ perPage: value }); };

    const close = () => { setModal(null); setSelectedSurat(null); };
    const openCreateModal = () => {
        if (!kepengurusanLab) { toast.error("Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu"); return; }
        createForm.reset();
        createForm.setData("kepengurusan_lab_id", kepengurusanLab.id);
        createForm.clearErrors();
        setModal("create");
    };
    const openEditModal = (surat) => {
        setSelectedSurat(surat);
        editForm.setData({ perihal: surat.perihal, tujuan: surat.tujuan, tanggal_surat: surat.tanggal_surat, isi_ringkas: surat.isi_ringkas || "", kode_klasifikasi: surat.kode_klasifikasi || "", file_surat: null });
        editForm.clearErrors();
        setModal("edit");
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("surat-menyurat.surat-keluar.store"), { forceFormData: true, onSuccess: () => { close(); createForm.reset(); toast.success("Surat keluar berhasil ditambahkan"); }, onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal menambahkan surat keluar") });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.post(route("surat-menyurat.surat-keluar.update", selectedSurat.id), { forceFormData: true, _method: "PUT", onSuccess: () => { close(); editForm.reset(); toast.success("Surat keluar berhasil diperbarui"); }, onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal memperbarui surat keluar") });
    };
    const handleDelete = () => router.delete(route("surat-menyurat.surat-keluar.destroy", selectedSurat.id), { onSuccess: () => { close(); toast.success("Surat keluar berhasil dihapus"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus surat keluar") });
    const handleExport = () => { if (kepengurusanLab) window.location.href = route("surat-menyurat.surat-keluar.export", { kepengurusan_lab_id: kepengurusanLab.id }); };

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash]);

    const formatDate = (date) => (date ? new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");
    const columns = [
        { key: "nomor_urut", header: "No" },
        { key: "nomor_surat", header: "Nomor surat", cellClassName: "font-medium" },
        { key: "perihal", header: "Perihal", cellClassName: "max-w-xs truncate" },
        { key: "tujuan", header: "Tujuan", cellClassName: "max-w-xs truncate" },
        { key: "tanggal_surat", header: "Tanggal", render: (surat) => formatDate(surat.tanggal_surat) },
        { key: "dibuat_oleh", header: "Dibuat oleh", render: (surat) => surat.dibuat_oleh || "-" },
        { key: "file_surat", header: "File", searchable: false, sortable: false, render: (surat) => surat.file_surat ? <a className="link link-primary inline-flex items-center gap-1" href={route("surat-menyurat.surat-keluar.download", surat.id)}><Download className="h-4 w-4" aria-hidden="true" />Unduh</a> : "-" },
        { header: "Aksi", sortable: false, searchable: false, headerClassName: "text-right", render: (surat) => <RowActions onEdit={canEdit ? () => openEditModal(surat) : undefined} onDelete={canDelete ? () => { setSelectedSurat(surat); setModal("delete"); } : undefined} /> },
    ];

    return (
        <DashboardLayout>
            <Head title="Surat Keluar" />
            <PageHeader
                title="Surat Keluar"
                description={kepengurusanLab ? `${kepengurusanLab.laboratorium?.nama} · ${kepengurusanLab.tahunKepengurusan?.tahun}` : "Pilih laboratorium pada navigasi untuk mulai."}
                actions={<>{canExport && kepengurusanLab && <Button variant="ghost" onClick={handleExport}><Download className="h-4 w-4" />Ekspor Excel</Button>}{canConfig && kepengurusanLab && <Button variant="ghost" href={route("surat-menyurat.konfigurasi.show", { kepengurusan_lab_id: kepengurusanLab.id })}><Settings className="h-4 w-4" />Konfigurasi</Button>}{canCreate && <Button onClick={openCreateModal} disabled={!kepengurusanLab}><Plus className="h-4 w-4" />Tambah surat</Button>}</>}
            />
            <PageSection>
                <ServerDataTable paginator={suratKeluar} columns={columns} search={search} onSearchChange={onSearchChange} searchPlaceholder="Cari surat..." perPage={perPage} onPerPageChange={onPerPageChange} emptyMessage={kepengurusanLab ? "Belum ada surat keluar." : "Pilih laboratorium dan tahun kepengurusan terlebih dahulu."} />
            </PageSection>

            <Modal show={modal === "create"} onClose={close} maxWidth="lg">
                <ModalHeader title="Tambah surat keluar" onClose={close} />
                <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-5">
                    {konfigurasi && <p className="rounded bg-base-200 px-3 py-2 text-xs">Format nomor: <code className="font-mono">{konfigurasi.format_nomor}</code></p>}
                    <SuratKeluarFields form={createForm} />
                    <ModalActions onCancel={close} processing={createForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "edit" && !!selectedSurat} onClose={close} maxWidth="lg">
                <ModalHeader title={`Edit surat keluar${selectedSurat?.nomor_surat ? ` (${selectedSurat.nomor_surat})` : ""}`} onClose={close} />
                <form onSubmit={handleEdit} className="space-y-4 p-4 sm:p-5">
                    <SuratKeluarFields form={editForm} currentFile={selectedSurat?.file_surat} />
                    <ModalActions onCancel={close} processing={editForm.processing} />
                </form>
            </Modal>

            <ConfirmModal show={modal === "delete" && !!selectedSurat} onClose={close} onConfirm={handleDelete} title="Hapus surat keluar" message={`Yakin ingin menghapus surat "${selectedSurat?.nomor_surat}"? Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
};

function ModalHeader({ title, onClose }) {
    return <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div>;
}

function ModalActions({ onCancel, processing }) {
    return <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onCancel}>Batal</Button><Button type="submit" loading={processing}>Simpan</Button></div>;
}

function SuratKeluarFields({ form, currentFile }) {
    return (
        <>
            <FormField label="Perihal" error={form.errors.perihal} required><input className="input input-bordered min-h-11 w-full" value={form.data.perihal} onChange={(e) => form.setData("perihal", e.target.value)} required /></FormField>
            <FormField label="Tujuan" error={form.errors.tujuan} required><input className="input input-bordered min-h-11 w-full" value={form.data.tujuan} onChange={(e) => form.setData("tujuan", e.target.value)} required /></FormField>
            <FormField label="Tanggal surat" error={form.errors.tanggal_surat} required><input type="date" className="input input-bordered min-h-11 w-full" value={form.data.tanggal_surat} onChange={(e) => form.setData("tanggal_surat", e.target.value)} required /></FormField>
            <FormField label="Kode klasifikasi" error={form.errors.kode_klasifikasi}><input className="input input-bordered min-h-11 w-full" value={form.data.kode_klasifikasi} onChange={(e) => form.setData("kode_klasifikasi", e.target.value)} /></FormField>
            <FormField label="Isi ringkas" error={form.errors.isi_ringkas}><textarea rows={3} className="textarea textarea-bordered w-full" value={form.data.isi_ringkas} onChange={(e) => form.setData("isi_ringkas", e.target.value)} /></FormField>
            <FormField label="File surat" error={form.errors.file_surat} hint={`PDF atau DOC, maksimal 5 MB.${currentFile ? " Sudah ada berkas tersimpan." : ""}`}><input type="file" accept=".pdf,.doc,.docx" className="file-input file-input-bordered min-h-11 w-full" onChange={(e) => form.setData("file_surat", e.target.files[0])} /></FormField>
        </>
    );
}

export default SuratKeluar;
