import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import RowActions, { IconAction } from '@/Components/RowActions';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Power, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Laboratorium = ({ laboratorium, flash }) => {
    const [modal, setModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const createForm = useForm({ nama: '', logo: null });
    const editForm = useForm({ nama: '', logo: null });

    useEffect(() => { if (flash?.message) toast.success(flash.message); }, [flash]);
    const close = () => { setModal(null); setSelectedItem(null); };
    const openEdit = (item) => { setSelectedItem(item); editForm.setData({ nama: item.nama, logo: null }); editForm.clearErrors(); setModal('edit'); };
    const submit = (event, editing = false) => {
        event.preventDefault();
        const form = editing ? editForm : createForm;
        form.post(editing ? route('laboratorium.update', selectedItem.id) : route('laboratorium.store'), {
            forceFormData: true,
            onSuccess: () => { close(); form.reset(); toast.success(`Laboratorium berhasil ${editing ? 'diperbarui' : 'ditambahkan'}`); },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menyimpan laboratorium'),
        });
    };
    const toggle = (item) => router.post(route('laboratorium.toggle', item.id), {}, {
        onSuccess: () => toast.success(`Laboratorium berhasil ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}`),
        onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal memperbarui status'),
    });

    const columns = [
        { header: 'No', key: 'id', searchable: false, render: (_, index) => index + 1 },
        { key: 'nama', header: 'Nama laboratorium' },
        { key: 'logo', header: 'Logo', searchable: false, sortable: false, render: (item) => item.logo ? <img src={`/storage/${item.logo}`} alt={`Logo ${item.nama}`} className="h-10 w-10 object-contain" /> : <span className="text-base-content/60">Tidak ada logo</span> },
        { key: 'is_active', header: 'Status', render: (item) => <StatusBadge status={item.is_active ? 'aktif' : 'nonaktif'} label={item.is_active ? 'Aktif' : 'Nonaktif'} /> },
        { header: 'Aksi', sortable: false, searchable: false, headerClassName: 'text-right', render: (item) => <RowActions onEdit={() => openEdit(item)}><IconAction label={item.is_active ? 'Nonaktifkan' : 'Aktifkan'} icon={Power} tone={item.is_active ? 'neutral' : 'success'} onClick={() => toggle(item)} /></RowActions> },
    ];

    return (
        <DashboardLayout>
            <Head title="Data Laboratorium" />
            <PageHeader title="Data Laboratorium" description="Kelola identitas dan status laboratorium." actions={<Button onClick={() => { createForm.reset(); createForm.clearErrors(); setModal('create'); }}><Plus className="h-4 w-4" />Tambah laboratorium</Button>} />
            <PageSection><DataGrid rows={laboratorium} columns={columns} searchPlaceholder="Cari laboratorium..." filters={[{ key: 'is_active', label: 'Status', options: [{ value: true, label: 'Aktif' }, { value: false, label: 'Nonaktif' }] }]} emptyMessage="Belum ada laboratorium." /></PageSection>
            <LabModal show={modal === 'create'} title="Tambah laboratorium" form={createForm} onClose={close} onSubmit={(event) => submit(event)} />
            <LabModal show={modal === 'edit' && !!selectedItem} title="Edit laboratorium" form={editForm} selectedItem={selectedItem} onClose={close} onSubmit={(event) => submit(event, true)} />
        </DashboardLayout>
    );
};

function LabModal({ show, title, form, selectedItem, onClose, onSubmit }) {
    return <Modal show={show} onClose={onClose} maxWidth="md"><div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div><form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5"><FormField label="Nama laboratorium" error={form.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={form.data.nama} onChange={(e) => form.setData('nama', e.target.value)} required /></FormField><FormField label="Logo" error={form.errors.logo} hint="Opsional. Gunakan berkas gambar."><input type="file" accept="image/*" className="file-input file-input-bordered min-h-11 w-full" onChange={(e) => form.setData('logo', e.target.files[0])} /></FormField>{selectedItem?.logo && <img src={`/storage/${selectedItem.logo}`} alt={`Logo ${selectedItem.nama} saat ini`} className="h-16 w-16 rounded border border-base-300 object-contain" />}<div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" loading={form.processing}>Simpan</Button></div></form></Modal>;
}

export default Laboratorium;
