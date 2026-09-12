import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const KategoriAset = ({ inventaris, filters, flash }) => {
    const [modal, setModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const createForm = useForm({ nama: "", deskripsi: "" });
    const editForm = useForm({ id: "", nama: "", deskripsi: "" });
    const deleteForm = useForm({});

    const allSelected = inventaris.data.length > 0 && selectedIds.length === inventaris.data.length;
    const toggleSelectAll = () => setSelectedIds(allSelected ? [] : inventaris.data.map((item) => item.id));
    const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

    useEffect(() => { if (flash?.message) toast.success(flash.message); if (flash?.error) toast.error(flash.error); }, [flash]);

    const visit = useCallback(
        (extra) =>
            router.visit("/data-master/kategori-aset", {
                data: { search: filters?.search, perPage: filters?.perPage, ...extra },
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }),
        [filters?.search, filters?.perPage],
    );
    const visitRef = useRef(visit);
    visitRef.current = visit;
    // ponytail: debounce ketikan saja; ganti baris/halaman tetap instan.
    const debouncedVisit = useMemo(() => debounce((extra) => visitRef.current(extra), 300), []);

    const applyServerChange = ({ search, perPage, page }) => {
        const extra = { search, perPage, page };
        if (search !== (filters?.search ?? "")) debouncedVisit(extra);
        else visit(extra);
    };

    const close = () => { setModal(null); setSelectedItem(null); };
    const openCreateModal = () => { createForm.reset(); createForm.setData({ nama: "", deskripsi: "" }); createForm.clearErrors(); setModal("create"); };
    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || "" });
        editForm.clearErrors();
        setModal("edit");
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("data-master.kategori-aset.store"), { preserveScroll: true, onSuccess: () => { close(); createForm.reset(); toast.success("Kategori berhasil ditambahkan"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menambahkan kategori") });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.put(route("data-master.kategori-aset.update", editForm.data.id), { preserveScroll: true, onSuccess: () => { close(); toast.success("Kategori berhasil diperbarui"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui kategori") });
    };
    const handleDelete = () => deleteForm.delete(route("data-master.kategori-aset.destroy", selectedItem.id), { preserveScroll: true, onSuccess: () => { close(); toast.success("Kategori berhasil dihapus"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus kategori") });
    const executeBulkDelete = () => router.post(route("data-master.kategori-aset.bulk-delete"), { ids: selectedIds }, { preserveScroll: true, onSuccess: () => { setSelectedIds([]); setModal(null); toast.success("Kategori terpilih berhasil dihapus"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus kategori terpilih") });

    const columns = [
        {
            key: "select",
            header: <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={allSelected} onChange={toggleSelectAll} aria-label={allSelected ? "Batalkan pilih semua" : "Pilih semua baris"} />,
            searchable: false,
            sortable: false,
            headerClassName: "w-12",
            render: (item) => <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Pilih ${item.nama}`} />,
        },
        { key: "nama", header: "Nama aset", sortable: false, cellClassName: "font-medium" },
        { key: "deskripsi", header: "Deskripsi", sortable: false, render: (item) => item.deskripsi || "-" },
        { key: "jumlah", header: "Jumlah", sortable: false, render: (item) => item.jumlah || 0 },
        { header: "Aksi", sortable: false, searchable: false, headerClassName: "text-right", render: (item) => <RowActions onEdit={() => openEditModal(item)} onDelete={() => { setSelectedItem(item); setModal("delete"); }} /> },
    ];

    return (
        <DashboardLayout>
            <Head title="Kategori Aset" />
            <PageHeader title="Kategori Aset" description="Kelola kategori inventaris laboratorium." actions={<Button onClick={openCreateModal}><Plus className="h-4 w-4" />Tambah kategori</Button>} />
            {selectedIds.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-3">
                    <span className="text-sm font-medium">{selectedIds.length} item terpilih</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="danger" onClick={() => setModal("bulk-delete")}><Trash2 className="h-4 w-4" />Hapus terpilih</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Batal pilih</Button>
                    </div>
                </div>
            )}
            <PageSection>
                <DataGrid rows={inventaris.data} columns={columns} rowKey="id" searchPlaceholder="Cari aset..." server={{ search: filters?.search, perPage: filters?.perPage, page: inventaris.current_page, lastPage: inventaris.last_page, total: inventaris.total, from: inventaris.from, to: inventaris.to, onChange: applyServerChange }} emptyMessage="Belum ada data aset." />
            </PageSection>

            <Modal show={modal === "create"} onClose={close} maxWidth="md">
                <ModalHeader title="Tambah kategori" onClose={close} />
                <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Nama aset" error={createForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.nama} onChange={(e) => createForm.setData("nama", e.target.value)} required /></FormField>
                    <FormField label="Deskripsi" error={createForm.errors.deskripsi}><textarea rows={3} className="textarea textarea-bordered w-full" value={createForm.data.deskripsi} onChange={(e) => createForm.setData("deskripsi", e.target.value)} /></FormField>
                    <ModalActions onCancel={close} processing={createForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "edit" && !!selectedItem} onClose={close} maxWidth="md">
                <ModalHeader title="Edit inventaris" onClose={close} />
                <form onSubmit={handleEdit} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Nama aset" error={editForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.nama} onChange={(e) => editForm.setData("nama", e.target.value)} required /></FormField>
                    <FormField label="Deskripsi" error={editForm.errors.deskripsi}><textarea rows={3} className="textarea textarea-bordered w-full" value={editForm.data.deskripsi} onChange={(e) => editForm.setData("deskripsi", e.target.value)} /></FormField>
                    <ModalActions onCancel={close} processing={editForm.processing} label="Simpan perubahan" />
                </form>
            </Modal>

            <ConfirmModal show={modal === "delete" && !!selectedItem} onClose={close} onConfirm={handleDelete} title="Hapus kategori" message={`Apakah Anda yakin ingin menghapus data aset "${selectedItem?.nama}"? Semua detail aset terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
            <ConfirmModal show={modal === "bulk-delete"} onClose={close} onConfirm={executeBulkDelete} title="Hapus kategori massal" message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} kategori terpilih? Semua detail aset terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
};

function ModalHeader({ title, onClose }) {
    return <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div>;
}

function ModalActions({ onCancel, processing, label = "Simpan" }) {
    return <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onCancel}>Batal</Button><Button type="submit" loading={processing}>{label}</Button></div>;
}

export default KategoriAset;
