import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import RowActions from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MataKuliahIndex = ({ mataKuliah, filters, flash }) => {
    const { can } = usePermission();
    const canCreate = can("matakuliah.create");
    const canUpdate = can("matakuliah.update");
    const canDelete = can("matakuliah.delete");

    const [search, setSearch] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(filters.perPage || 10);
    const [modal, setModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const createForm = useForm({ kode_mata_kuliah: "", nama: "", sks: "", semester: "" });
    const editForm = useForm({ id: "", kode_mata_kuliah: "", nama: "", sks: "", semester: "", status: "aktif" });
    const deleteForm = useForm({});

    useEffect(() => { if (flash?.message) toast.success(flash.message); if (flash?.error) toast.error(flash.error); }, [flash]);

    const navigate = (extra = {}) => router.visit("/data-master/mata-kuliah", { data: { search, perPage, ...extra }, preserveState: true, preserveScroll: true, replace: true });
    const debouncedSearch = debounce((value) => navigate({ search: value }), 300);

    const onSearchChange = (event) => { setSearch(event.target.value); debouncedSearch(event.target.value); };
    const onPerPageChange = (event) => { setPerPage(event.target.value); navigate({ perPage: event.target.value }); };

    const close = () => { setModal(null); setSelectedItem(null); };
    const openCreateModal = () => { createForm.reset(); createForm.clearErrors(); setModal("create"); };
    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({ id: item.id, kode_mata_kuliah: item.kode_mata_kuliah, nama: item.nama, sks: item.sks, semester: item.semester, status: item.status || "aktif" });
        editForm.clearErrors();
        setModal("edit");
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("data-master.mata-kuliah.store"), { preserveScroll: true, onSuccess: () => { close(); createForm.reset(); toast.success("Mata kuliah berhasil ditambahkan"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menambahkan mata kuliah") });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.put(route("data-master.mata-kuliah.update", editForm.data.id), { preserveScroll: true, onSuccess: () => { close(); toast.success("Mata kuliah berhasil diperbarui"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui mata kuliah") });
    };
    const handleDelete = () => deleteForm.delete(route("data-master.mata-kuliah.destroy", selectedItem.id), { preserveScroll: true, onSuccess: () => { close(); toast.success("Mata kuliah berhasil dihapus"); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus mata kuliah") });

    const columns = [
        { key: "kode_mata_kuliah", header: "Kode", cellClassName: "font-mono" },
        { key: "nama", header: "Nama mata kuliah", cellClassName: "font-medium" },
        { key: "sks", header: "SKS" },
        { key: "semester", header: "Semester" },
        { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} label={item.status} /> },
        ...(canUpdate || canDelete ? [{ header: "Aksi", sortable: false, searchable: false, headerClassName: "text-right", render: (item) => <RowActions onEdit={canUpdate ? () => openEditModal(item) : undefined} onDelete={canDelete ? () => { setSelectedItem(item); setModal("delete"); } : undefined} /> }] : []),
    ];

    return (
        <DashboardLayout>
            <Head title="Kelola Mata Kuliah" />
            <PageHeader title="Kelola Mata Kuliah" description="Kelola kode, SKS, semester, dan status mata kuliah." actions={canCreate && <Button onClick={openCreateModal}><Plus className="h-4 w-4" />Tambah mata kuliah</Button>} />
            <PageSection>
                <ServerDataTable paginator={mataKuliah} columns={columns} search={search} onSearchChange={onSearchChange} searchPlaceholder="Cari mata kuliah..." perPage={perPage} onPerPageChange={onPerPageChange} emptyMessage={search ? `Tidak ada hasil untuk "${search}".` : "Belum ada data mata kuliah."} />
            </PageSection>

            <Modal show={modal === "create"} onClose={close} maxWidth="md">
                <ModalHeader title="Tambah mata kuliah" onClose={close} />
                <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Kode mata kuliah" error={createForm.errors.kode_mata_kuliah} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.kode_mata_kuliah} onChange={(e) => createForm.setData("kode_mata_kuliah", e.target.value)} required /></FormField>
                    <FormField label="Nama mata kuliah" error={createForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.nama} onChange={(e) => createForm.setData("nama", e.target.value)} required /></FormField>
                    <FormField label="SKS" error={createForm.errors.sks} required><input type="number" min="1" max="6" className="input input-bordered min-h-11 w-full" value={createForm.data.sks} onChange={(e) => createForm.setData("sks", e.target.value)} required /></FormField>
                    <FormField label="Semester" error={createForm.errors.semester} required><input type="number" min="1" max="14" className="input input-bordered min-h-11 w-full" value={createForm.data.semester} onChange={(e) => createForm.setData("semester", e.target.value)} required /></FormField>
                    <ModalActions onCancel={close} processing={createForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "edit" && !!selectedItem} onClose={close} maxWidth="md">
                <ModalHeader title="Edit mata kuliah" onClose={close} />
                <form onSubmit={handleEdit} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Kode mata kuliah" error={editForm.errors.kode_mata_kuliah} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.kode_mata_kuliah} onChange={(e) => editForm.setData("kode_mata_kuliah", e.target.value)} required /></FormField>
                    <FormField label="Nama mata kuliah" error={editForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.nama} onChange={(e) => editForm.setData("nama", e.target.value)} required /></FormField>
                    <FormField label="SKS" error={editForm.errors.sks} required><input type="number" min="1" max="6" className="input input-bordered min-h-11 w-full" value={editForm.data.sks} onChange={(e) => editForm.setData("sks", e.target.value)} required /></FormField>
                    <FormField label="Semester" error={editForm.errors.semester} required><input type="number" min="1" max="14" className="input input-bordered min-h-11 w-full" value={editForm.data.semester} onChange={(e) => editForm.setData("semester", e.target.value)} required /></FormField>
                    <FormField label="Status" error={editForm.errors.status}><select className="select select-bordered min-h-11 w-full" value={editForm.data.status} onChange={(e) => editForm.setData("status", e.target.value)}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></FormField>
                    <ModalActions onCancel={close} processing={editForm.processing} label="Simpan perubahan" />
                </form>
            </Modal>

            <ConfirmModal show={modal === "delete" && !!selectedItem} onClose={close} onConfirm={handleDelete} title="Hapus mata kuliah" message={`Apakah Anda yakin ingin menghapus mata kuliah "${selectedItem?.kode_mata_kuliah} - ${selectedItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
};

export function ModalHeader({ title, onClose }) {
    return <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div>;
}

export function ModalActions({ onCancel, processing, label = "Simpan" }) {
    return <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onCancel}>Batal</Button><Button type="submit" loading={processing}>{label}</Button></div>;
}

export default MataKuliahIndex;
