import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DataMasterStruktur = ({ struktur, roles, parentOptions = [] }) => {
    const [formOpen, setFormOpen] = useState(false);
    const [editingStruktur, setEditingStruktur] = useState(null);
    const [deletingStruktur, setDeletingStruktur] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        struktur: "",
        jabatan_tunggal: true,
        default_role_id: "",
        parent_id: "",
    });

    const openModal = (strukturData = null) => {
        clearErrors();
        if (strukturData) {
            setEditingStruktur(strukturData);
            setData({
                struktur: strukturData.struktur,
                jabatan_tunggal: strukturData.jabatan_tunggal,
                default_role_id: strukturData.default_role_id || "",
                parent_id: strukturData.parent_id || "",
            });
        } else {
            setEditingStruktur(null);
            reset();
        }
        setFormOpen(true);
    };

    const closeModal = () => {
        setFormOpen(false);
        setEditingStruktur(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                closeModal();
                toast.success(editingStruktur ? "Struktur berhasil diperbarui" : "Struktur berhasil ditambahkan");
            },
            onError: (formErrors) => toast.error(Object.values(formErrors).find(Boolean) || "Gagal menyimpan struktur"),
        };
        if (editingStruktur) put(route("data-master.struktur.update", editingStruktur.id), options);
        else post(route("data-master.struktur.store"), options);
    };

    const handleDelete = () => {
        destroy(route("data-master.struktur.destroy", deletingStruktur.id), {
            onSuccess: () => {
                setDeletingStruktur(null);
                toast.success("Struktur berhasil dihapus");
            },
            onError: (formErrors) => {
                setDeletingStruktur(null);
                toast.error(Object.values(formErrors).find(Boolean) || "Gagal menghapus struktur");
            },
        });
    };

    const columns = [
        { key: "struktur", header: "Nama struktur", cellClassName: "font-medium" },
        { header: "Induk (parent)", searchable: false, render: (item) => item.parent ? <StatusBadge status="info" label={item.parent.struktur} /> : <StatusBadge status="aktif" label="Koordinator" /> },
        { key: "jabatan_tunggal", header: "Jabatan tunggal", render: (item) => <StatusBadge status={item.jabatan_tunggal ? "aktif" : "pending"} label={item.jabatan_tunggal ? "Ya" : "Tidak"} /> },
        { header: "Role default", searchable: false, render: (item) => item.default_role?.name ? <span className="uppercase">{item.default_role.name}</span> : "-" },
        { header: "Aksi", sortable: false, searchable: false, headerClassName: "text-right", render: (item) => <RowActions onEdit={() => openModal(item)} onDelete={() => setDeletingStruktur(item)} /> },
    ];

    return (
        <DashboardLayout>
            <Head title="Data Master - Struktur Jabatan" />
            <PageHeader title="Struktur Jabatan" description="Kelola data master struktur jabatan dan role default untuk user." actions={<Button onClick={() => openModal()}><Plus className="h-4 w-4" />Tambah struktur</Button>} />
            <PageSection>
                <DataGrid rows={struktur} columns={columns} searchPlaceholder="Cari struktur..." emptyMessage="Belum ada data struktur jabatan." />
            </PageSection>

            <Modal show={formOpen} onClose={closeModal} maxWidth="md">
                <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
                    <h2 className="text-lg font-semibold">{editingStruktur ? "Edit struktur" : "Tambah struktur"}</h2>
                    <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={closeModal} aria-label="Tutup"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Nama struktur" error={errors.struktur} required>
                        <input className="input input-bordered min-h-11 w-full" value={data.struktur} onChange={(e) => setData("struktur", e.target.value)} required />
                    </FormField>
                    <FormField label="Role default" error={errors.default_role_id} hint="User yang masuk ke struktur ini otomatis mendapatkan role ini." required>
                        <select className="select select-bordered min-h-11 w-full uppercase" value={data.default_role_id} onChange={(e) => setData("default_role_id", e.target.value)} required>
                            <option value="">Pilih role</option>
                            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Induk (parent) struktur" error={errors.parent_id} hint="Kosongkan jika ini koordinator/kepala divisi.">
                        <select className="select select-bordered min-h-11 w-full" value={data.parent_id} onChange={(e) => setData("parent_id", e.target.value)}>
                            <option value="">Tidak ada (koordinator/parent)</option>
                            {parentOptions.filter((parent) => !editingStruktur || parent.id !== editingStruktur.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.struktur}</option>)}
                        </select>
                    </FormField>
                    <FormField error={errors.jabatan_tunggal}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3">
                            <input type="checkbox" className="toggle toggle-primary" checked={data.jabatan_tunggal} onChange={(e) => setData("jabatan_tunggal", e.target.checked)} />
                            <span>Jabatan tunggal</span>
                        </label>
                    </FormField>
                    <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={closeModal}>Batal</Button>
                        <Button type="submit" loading={processing}>{editingStruktur ? "Perbarui" : "Simpan"}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                show={!!deletingStruktur}
                onClose={() => setDeletingStruktur(null)}
                onConfirm={handleDelete}
                title="Hapus struktur"
                message={`Apakah Anda yakin ingin menghapus struktur "${deletingStruktur?.struktur}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default DataMasterStruktur;
