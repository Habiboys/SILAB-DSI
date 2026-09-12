import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import RowActions from '@/Components/RowActions';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Index({ admins, laboratories, roles, flash }) {
    const [modal, setModal] = useState(null);
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const createForm = useForm({ name: '', email: '', password: '', password_confirmation: '', role: 'admin', laboratory_id: '' });
    const editForm = useForm({ name: '', email: '', password: '', password_confirmation: '', role: '', laboratory_id: '' });
    const deleteForm = useForm({});

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const openCreate = () => { createForm.reset(); createForm.clearErrors(); setModal('create'); };
    const openEdit = (admin) => {
        setCurrentAdmin(admin);
        editForm.setData({ name: admin.name, email: admin.email, password: '', password_confirmation: '', role: admin.role, laboratory_id: admin.laboratory?.id || '' });
        editForm.clearErrors();
        setModal('edit');
    };
    const submit = (event, editing = false) => {
        event.preventDefault();
        const form = editing ? editForm : createForm;
        const method = editing ? 'put' : 'post';
        const url = editing ? route('admin.update', currentAdmin.id) : route('admin.store');
        form[method](url, {
            onSuccess: () => { setModal(null); form.reset(); toast.success(`Admin berhasil ${editing ? 'diperbarui' : 'ditambahkan'}`); },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || `Gagal ${editing ? 'memperbarui' : 'menambahkan'} data`),
        });
    };
    const remove = () => deleteForm.delete(route('admin.destroy', currentAdmin.id), {
        onSuccess: () => { setModal(null); setCurrentAdmin(null); toast.success('Admin berhasil dihapus'); },
        onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menghapus data'),
    });

    const columns = [
        { key: 'name', header: 'Nama' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', render: (admin) => <StatusBadge status={admin.role} label={admin.role} /> },
        { key: 'laboratory.name', header: 'Laboratorium', render: (admin) => admin.laboratory?.name || '-' },
        { header: 'Aksi', searchable: false, sortable: false, headerClassName: 'text-right', render: (admin) => <RowActions onEdit={() => openEdit(admin)} onDelete={() => { setCurrentAdmin(admin); setModal('delete'); }} /> },
    ];

    return (
        <DashboardLayout>
            <Head title="Manajemen Admin" />
            <PageHeader title="Manajemen Admin" description="Kelola akun administrator dan akses laboratorium." actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Tambah admin</Button>} />
            <PageSection>
                <DataGrid rows={admins} columns={columns} searchPlaceholder="Cari nama, email, role, atau laboratorium..." emptyMessage="Belum ada akun administrator." />
            </PageSection>
            <AdminModal show={modal === 'create'} title="Tambah administrator" form={createForm} roles={roles} laboratories={laboratories} onClose={() => setModal(null)} onSubmit={(event) => submit(event)} />
            <AdminModal show={modal === 'edit' && !!currentAdmin} title="Edit administrator" form={editForm} roles={roles} laboratories={laboratories} onClose={() => setModal(null)} onSubmit={(event) => submit(event, true)} editing />
            <ConfirmModal show={modal === 'delete' && !!currentAdmin} onClose={() => setModal(null)} onConfirm={remove} title="Hapus administrator" message={`Hapus administrator “${currentAdmin?.name}”? Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
        </DashboardLayout>
    );
}

function AdminModal({ show, title, form, roles, laboratories, onClose, onSubmit, editing = false }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5"><h2 className="text-lg font-semibold">{title}</h2><button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup"><X className="h-5 w-5" /></button></div>
            <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto p-4 sm:p-5">
                <FormField label="Nama" error={form.errors.name} required><input className="input input-bordered min-h-11 w-full" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required /></FormField>
                <FormField label="Email" error={form.errors.email} required><input type="email" className="input input-bordered min-h-11 w-full" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} required /></FormField>
                <FormField label="Password" error={form.errors.password} hint={editing ? 'Kosongkan jika tidak diubah.' : undefined} required={!editing}><input type="password" className="input input-bordered min-h-11 w-full" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} required={!editing} /></FormField>
                <FormField label="Konfirmasi password" required={!editing}><input type="password" className="input input-bordered min-h-11 w-full" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} required={!editing} /></FormField>
                <FormField label="Role" error={form.errors.role} required><select className="select select-bordered min-h-11 w-full" value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} required>{roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</select></FormField>
                {form.data.role === 'admin' && <FormField label="Laboratorium" error={form.errors.laboratory_id} required><select className="select select-bordered min-h-11 w-full" value={form.data.laboratory_id} onChange={(e) => form.setData('laboratory_id', e.target.value)} required><option value="">Pilih laboratorium</option>{laboratories.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}</select></FormField>}
                <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" loading={form.processing}>{editing ? 'Simpan perubahan' : 'Simpan'}</Button></div>
            </form>
        </Modal>
    );
}
