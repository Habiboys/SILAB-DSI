import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Download, MessageSquare, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SuratMasuk = ({ suratMasuk, kepengurusanLab, anggotaLab, filters, flash, canCreate, canEdit, canDelete, canExport, canDisposisi }) => {
    const { selected_kepengurusan } = usePage().props;
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [modal, setModal] = useState(null);
    const [selectedSurat, setSelectedSurat] = useState(null);

    const createForm = useForm({ kepengurusan_lab_id: kepengurusanLab?.id || "", nomor_surat_asal: "", asal_surat: "", perihal: "", tanggal_surat: "", tanggal_terima: new Date().toISOString().split("T")[0], isi_ringkas: "", file_surat: null });
    const editForm = useForm({ nomor_surat_asal: "", asal_surat: "", perihal: "", tanggal_surat: "", tanggal_terima: "", isi_ringkas: "", file_surat: null });
    const disposisiForm = useForm({ kepada_user_id: "", catatan: "" });

    const buildParams = useCallback((extra = {}) => {
        const params = {};
        if (selected_kepengurusan?.id) params.kepengurusan_lab_id = selected_kepengurusan.id;
        else if (kepengurusanLab?.id) params.kepengurusan_lab_id = kepengurusanLab.id;
        params.search = search;
        params.perPage = perPage;
        return { ...params, ...extra };
    }, [selected_kepengurusan, kepengurusanLab, search, perPage]);

    const navigate = (extra = {}) => router.get(route("surat-menyurat.surat-masuk.index"), buildParams(extra), { preserveState: true, replace: true });

    const debouncedSearch = useCallback(debounce((value) => navigate({ search: value, perPage }), 400), [kepengurusanLab, perPage, selected_kepengurusan]);

    const onSearchChange = (event) => { setSearch(event.target.value); debouncedSearch(event.target.value); };
    const onPerPageChange = (event) => { const value = Number(event.target.value); setPerPage(value); navigate({ perPage: value }); };

    const close = () => { setModal(null); setSelectedSurat(null); };
    const openCreateModal = () => {
        if (!kepengurusanLab) { toast.error("Silakan pilih laboratorium terlebih dahulu"); return; }
        createForm.reset();
        createForm.setData({ kepengurusan_lab_id: kepengurusanLab.id, nomor_surat_asal: "", asal_surat: "", perihal: "", tanggal_surat: "", tanggal_terima: new Date().toISOString().split("T")[0], isi_ringkas: "", file_surat: null });
        createForm.clearErrors();
        setModal("create");
    };
    const openEditModal = (surat) => {
        setSelectedSurat(surat);
        editForm.setData({ nomor_surat_asal: surat.nomor_surat_asal, asal_surat: surat.asal_surat, perihal: surat.perihal, tanggal_surat: surat.tanggal_surat, tanggal_terima: surat.tanggal_terima, isi_ringkas: surat.isi_ringkas || "", file_surat: null });
        editForm.clearErrors();
        setModal("edit");
    };
    const openDisposisiModal = (surat) => {
        setSelectedSurat(surat);
        disposisiForm.reset();
        disposisiForm.clearErrors();
        setModal("disposisi");
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("surat-menyurat.surat-masuk.store"), { forceFormData: true, onSuccess: () => { close(); createForm.reset(); toast.success("Surat masuk berhasil ditambahkan"); }, onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal menambahkan surat masuk") });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.post(route("surat-menyurat.surat-masuk.update", selectedSurat.id), { forceFormData: true, _method: "PUT", onSuccess: () => { close(); editForm.reset(); toast.success("Surat masuk berhasil diperbarui"); }, onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal memperbarui surat masuk") });
    };
    const handleDelete = () => router.delete(route("surat-menyurat.surat-masuk.destroy", selectedSurat.id), { onSuccess: () => { close(); toast.success("Surat masuk berhasil dihapus"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus surat masuk") });
    const handleDisposisi = (event) => {
        event.preventDefault();
        disposisiForm.post(route("surat-menyurat.disposisi.store", selectedSurat.id), { onSuccess: () => { close(); disposisiForm.reset(); toast.success("Disposisi berhasil ditambahkan"); }, onError: (errors) => toast.error(Object.values(errors)[0] || "Gagal menambahkan disposisi") });
    };
    const handleExport = () => { if (kepengurusanLab) window.location.href = route("surat-menyurat.surat-masuk.export", { kepengurusan_lab_id: kepengurusanLab.id }); };

    useEffect(() => { if (flash?.success) toast.success(flash.success); if (flash?.error) toast.error(flash.error); }, [flash]);

    const formatDate = (date) => (date ? new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-");
    const columns = [
        { key: "nomor_agenda", header: "No agenda" },
        { key: "nomor_surat_asal", header: "Nomor surat", cellClassName: "max-w-xs truncate" },
        { key: "asal_surat", header: "Asal", cellClassName: "max-w-xs truncate" },
        { key: "perihal", header: "Perihal", cellClassName: "max-w-xs truncate" },
        { key: "tanggal_surat", header: "Tgl surat", render: (surat) => formatDate(surat.tanggal_surat) },
        { key: "tanggal_terima", header: "Tgl terima", render: (surat) => formatDate(surat.tanggal_terima) },
        { key: "jumlah_disposisi", header: "Disposisi", render: (surat) => surat.jumlah_disposisi > 0 ? <StatusBadge status="info" label={`${surat.jumlah_disposisi} disposisi`} /> : "-" },
        { key: "file_surat", header: "File", searchable: false, sortable: false, render: (surat) => surat.file_surat ? <a className="link link-primary inline-flex items-center gap-1" href={route("surat-menyurat.surat-masuk.download", surat.id)}><Download className="h-4 w-4" aria-hidden="true" />Unduh</a> : "-" },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            headerClassName: "text-right",
            render: (surat) => (
                <RowActions onEdit={canEdit ? () => openEditModal(surat) : undefined} onDelete={canDelete ? () => { setSelectedSurat(surat); setModal("delete"); } : undefined}>
                    <IconAction label="Lihat disposisi" icon={MessageSquare} tone="detail" href={route("surat-menyurat.surat-masuk.disposisi", surat.id)} />
                    {canDisposisi && <IconAction label="Tambah disposisi" icon={Plus} tone="neutral" onClick={() => openDisposisiModal(surat)} />}
                </RowActions>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Surat Masuk" />
            <PageHeader
                title="Surat Masuk"
                description={kepengurusanLab ? `${kepengurusanLab.laboratorium?.nama} · ${kepengurusanLab.tahunKepengurusan?.tahun}` : "Pilih laboratorium pada navigasi untuk mulai."}
                actions={<>{canExport && kepengurusanLab && <Button variant="ghost" onClick={handleExport}><Download className="h-4 w-4" />Ekspor Excel</Button>}{canCreate && <Button onClick={openCreateModal} disabled={!kepengurusanLab}><Plus className="h-4 w-4" />Tambah surat</Button>}</>}
            />
            <PageSection>
                <ServerDataTable paginator={suratMasuk} columns={columns} search={search} onSearchChange={onSearchChange} searchPlaceholder="Cari surat..." perPage={perPage} onPerPageChange={onPerPageChange} emptyMessage={kepengurusanLab ? "Belum ada surat masuk." : "Pilih laboratorium dan tahun kepengurusan terlebih dahulu."} />
            </PageSection>

            <Modal show={modal === "create"} onClose={close} maxWidth="lg">
                <ModalHeader title="Tambah surat masuk" onClose={close} />
                <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-5">
                    <SuratMasukFields form={createForm} />
                    <ModalActions onCancel={close} processing={createForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "edit" && !!selectedSurat} onClose={close} maxWidth="lg">
                <ModalHeader title="Edit surat masuk" onClose={close} />
                <form onSubmit={handleEdit} className="space-y-4 p-4 sm:p-5">
                    <SuratMasukFields form={editForm} currentFile={selectedSurat?.file_surat} />
                    <ModalActions onCancel={close} processing={editForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "disposisi" && !!selectedSurat} onClose={close} maxWidth="md">
                <ModalHeader title="Tambah disposisi" onClose={close} />
                <form onSubmit={handleDisposisi} className="space-y-4 p-4 sm:p-5">
                    {selectedSurat && <dl className="rounded bg-base-200 px-3 py-2 text-sm"><dt className="text-base-content/60">Perihal</dt><dd className="font-medium">{selectedSurat.perihal}</dd><dt className="mt-1 text-base-content/60">Nomor surat</dt><dd className="font-medium">{selectedSurat.nomor_surat_asal}</dd></dl>}
                    <FormField label="Kepada" error={disposisiForm.errors.kepada_user_id} required>
                        <select className="select select-bordered min-h-11 w-full" value={disposisiForm.data.kepada_user_id} onChange={(e) => disposisiForm.setData("kepada_user_id", e.target.value)} required>
                            <option value="">Pilih anggota</option>
                            {anggotaLab?.map((anggota) => <option key={anggota.id} value={anggota.id}>{anggota.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Catatan" error={disposisiForm.errors.catatan}><textarea rows={3} className="textarea textarea-bordered w-full" placeholder="Instruksi atau catatan tambahan..." value={disposisiForm.data.catatan} onChange={(e) => disposisiForm.setData("catatan", e.target.value)} /></FormField>
                    <ModalActions onCancel={close} processing={disposisiForm.processing} label="Kirim disposisi" />
                </form>
            </Modal>

            <ConfirmModal show={modal === "delete" && !!selectedSurat} onClose={close} onConfirm={handleDelete} title="Hapus surat masuk" message={`Yakin ingin menghapus surat agenda #${selectedSurat?.nomor_agenda}? Semua disposisi terkait akan ikut terhapus.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
};

function ModalHeader({ title, onClose }) {
    return <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div>;
}

function ModalActions({ onCancel, processing, label = "Simpan" }) {
    return <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onCancel}>Batal</Button><Button type="submit" loading={processing}>{label}</Button></div>;
}

function SuratMasukFields({ form, currentFile }) {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Nomor surat asal" error={form.errors.nomor_surat_asal} required><input className="input input-bordered min-h-11 w-full" value={form.data.nomor_surat_asal} onChange={(e) => form.setData("nomor_surat_asal", e.target.value)} required /></FormField>
                <FormField label="Asal surat" error={form.errors.asal_surat} required><input className="input input-bordered min-h-11 w-full" value={form.data.asal_surat} onChange={(e) => form.setData("asal_surat", e.target.value)} required /></FormField>
            </div>
            <FormField label="Perihal" error={form.errors.perihal} required><input className="input input-bordered min-h-11 w-full" value={form.data.perihal} onChange={(e) => form.setData("perihal", e.target.value)} required /></FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Tanggal surat" error={form.errors.tanggal_surat} required><input type="date" className="input input-bordered min-h-11 w-full" value={form.data.tanggal_surat} onChange={(e) => form.setData("tanggal_surat", e.target.value)} required /></FormField>
                <FormField label="Tanggal terima" error={form.errors.tanggal_terima} required><input type="date" className="input input-bordered min-h-11 w-full" value={form.data.tanggal_terima} onChange={(e) => form.setData("tanggal_terima", e.target.value)} required /></FormField>
            </div>
            <FormField label="Isi ringkas" error={form.errors.isi_ringkas}><textarea rows={3} className="textarea textarea-bordered w-full" value={form.data.isi_ringkas} onChange={(e) => form.setData("isi_ringkas", e.target.value)} /></FormField>
            <FormField label="File surat" error={form.errors.file_surat} hint={`PDF atau DOC, maksimal 5 MB.${currentFile ? " Sudah ada berkas tersimpan." : ""}`}><input type="file" accept=".pdf,.doc,.docx" className="file-input file-input-bordered min-h-11 w-full" onChange={(e) => form.setData("file_surat", e.target.files[0])} /></FormField>
        </>
    );
}

export default SuratMasuk;
