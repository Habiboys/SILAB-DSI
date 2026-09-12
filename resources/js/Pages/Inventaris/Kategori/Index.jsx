import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { usePermission } from "@/Components/PermissionContext";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Inventaris({ inventaris, filters = {}, flash }) {
    const { auth, laboratorium } = usePage().props;
    const { selectedLab, setSelectedLab } = useLab();
    const { can, isSuperAdmin, isKadep } = usePermission();
    const canManage = can("inventaris.manage_categories");

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(Number(filters.perPage || 10));
    const [selectedItem, setSelectedItem] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const createForm = useForm({ nama: "", deskripsi: "" });
    const editForm = useForm({ id: "", nama: "", deskripsi: "" });
    const deleteForm = useForm({});

    const visit = (data) => router.visit("/inventaris/kategori", { data, preserveState: true, preserveScroll: true, replace: true });

    const runSearch = debounce((value) => visit({ search: value, perPage }), 300);
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        runSearch(event.target.value);
    };
    const handlePerPageChange = (event) => {
        const value = Number(event.target.value);
        setPerPage(value);
        visit({ search: searchTerm, perPage: value });
    };

    useEffect(() => {
        if (!selectedLab) return;
        const urlLabId = new URLSearchParams(window.location.search).get("lab_id");
        if (urlLabId === String(selectedLab.id)) return;
        router.visit("/inventaris/kategori", { data: { search: searchTerm, perPage }, preserveState: true, preserveScroll: true, replace: true });
    }, [selectedLab]);

    useEffect(() => {
        if (!auth?.user) return;
        if (isSuperAdmin() || isKadep()) return;
        const userLab = laboratorium?.find((lab) => lab.id === auth.user.laboratory_id);
        if (userLab) setSelectedLab(userLab);
    }, [auth?.user?.laboratory_id, laboratorium]);

    const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedIds(selectedIds.length === inventaris.data.length ? [] : inventaris.data.map((item) => item.id));

    const openCreate = () => {
        createForm.reset();
        setIsCreateModalOpen(true);
    };
    const openEdit = (item) => {
        setSelectedItem(item);
        editForm.setData({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || "" });
        setIsEditModalOpen(true);
    };

    const submitCreate = (event) => {
        event.preventDefault();
        createForm.post(route("inventaris.kategori.store"), {
            onSuccess: () => { setIsCreateModalOpen(false); createForm.reset(); },
            preserveScroll: true,
        });
    };
    const submitEdit = (event) => {
        event.preventDefault();
        editForm.put(route("inventaris.kategori.update", editForm.data.id), {
            onSuccess: () => { setIsEditModalOpen(false); setSelectedItem(null); },
            preserveScroll: true,
        });
    };
    const confirmDelete = () => deleteForm.delete(route("inventaris.kategori.destroy", selectedItem.id), {
        onSuccess: () => { setIsDeleteModalOpen(false); setSelectedItem(null); },
        preserveScroll: true,
    });
    const executeBulkDelete = () => router.post(route("inventaris.kategori.bulk-delete"), { ids: selectedIds }, {
        onSuccess: () => {
            setSelectedIds([]);
            setIsBulkDeleteModalOpen(false);
            toast.success("Kategori terpilih berhasil dihapus");
        },
        preserveScroll: true,
    });

    const columns = [
        {
            header: <input type="checkbox" className="checkbox checkbox-sm" checked={inventaris.data.length > 0 && selectedIds.length === inventaris.data.length} onChange={toggleSelectAll} aria-label="Pilih semua kategori di halaman ini" />,
            headerClassName: "w-10",
            sortable: false,
            searchable: false,
            render: (item) => <input type="checkbox" className="checkbox checkbox-sm" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Pilih ${item.nama}`} />,
        },
        { header: "No", render: (_, index) => inventaris.from + index },
        { key: "nama", header: "Nama Aset" },
        { key: "deskripsi", header: "Deskripsi", render: (item) => item.deskripsi || "-" },
        { key: "jumlah", header: "Jumlah", render: (item) => item.jumlah || 0 },
        { header: "Aksi", sortable: false, searchable: false, render: (item) => <RowActions onEdit={canManage ? () => openEdit(item) : null} onDelete={canManage ? () => { setSelectedItem(item); setIsDeleteModalOpen(true); } : null} /> },
    ];

    return (
        <DashboardLayout>
            <Head title="Kategori Inventaris" />
            <PageHeader title="Kategori Inventaris" description="Kelola kategori aset laboratorium." actions={canManage && <Button onClick={openCreate}>Tambah Kategori</Button>} />

            {selectedIds.length > 0 && (
                <div className="mb-4 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">{selectedIds.length} kategori terpilih</span>
                    <div className="flex flex-wrap gap-2">
                        {canManage && <Button variant="danger" onClick={() => setIsBulkDeleteModalOpen(true)}><Trash2 className="h-4 w-4" /> Hapus</Button>}
                        <Button variant="ghost" onClick={() => setSelectedIds([])}>Batal Pilih</Button>
                    </div>
                </div>
            )}

            <PageSection bodyClassName="p-4 sm:p-5">
                <ServerDataTable
                    paginator={inventaris}
                    columns={columns}
                    search={searchTerm}
                    onSearchChange={handleSearchChange}
                    searchPlaceholder="Cari nama atau deskripsi kategori..."
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    emptyMessage={searchTerm ? `Tidak ada hasil untuk "${searchTerm}".` : "Belum ada kategori aset."}
                />
            </PageSection>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                <form onSubmit={submitCreate} className="p-5">
                    <h2 className="text-lg font-semibold">Tambah Kategori</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="Nama Aset" error={createForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.nama} onChange={(event) => createForm.setData("nama", event.target.value)} required /></FormField>
                        <FormField label="Deskripsi" error={createForm.errors.deskripsi}><textarea className="textarea textarea-bordered min-h-20 w-full" value={createForm.data.deskripsi} onChange={(event) => createForm.setData("deskripsi", event.target.value)} /></FormField>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Batal</Button><Button type="submit" loading={createForm.processing}>Simpan</Button></div>
                </form>
            </Modal>

            <Modal show={isEditModalOpen && !!selectedItem} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                <form onSubmit={submitEdit} className="p-5">
                    <h2 className="text-lg font-semibold">Edit Kategori</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="Nama Aset" error={editForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.nama} onChange={(event) => editForm.setData("nama", event.target.value)} required /></FormField>
                        <FormField label="Deskripsi" error={editForm.errors.deskripsi}><textarea className="textarea textarea-bordered min-h-20 w-full" value={editForm.data.deskripsi} onChange={(event) => editForm.setData("deskripsi", event.target.value)} /></FormField>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Batal</Button><Button type="submit" loading={editForm.processing}>Simpan</Button></div>
                </form>
            </Modal>

            <ConfirmModal show={isDeleteModalOpen && !!selectedItem} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Konfirmasi Hapus" message={selectedItem ? `Apakah Anda yakin ingin menghapus kategori "${selectedItem.nama}"? Semua detail aset terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.` : ""} confirmText="Hapus" cancelText="Batal" type="danger" />

            <ConfirmModal show={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} onConfirm={executeBulkDelete} title="Hapus Kategori Massal" message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} kategori terpilih? Semua detail aset terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
}
