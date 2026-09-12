import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Button from '../Components/Button';
import ConfirmModal from '../Components/ConfirmModal';
import { DataGrid } from '../Components/DataTable';
import FormField from '../Components/FormField';
import Modal from '../Components/Modal';
import PageHeader from '../Components/PageHeader';
import PageSection from '../Components/PageSection';
import { usePermission } from '../Components/PermissionContext';
import RowActions from '../Components/RowActions';
import StatusBadge from '../Components/StatusBadge';
import DashboardLayout from '../Layouts/DashboardLayout';

const formatMonthYear = (value) => value ? new Date(value).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-';
const monthInput = (value) => value ? `${new Date(value).getFullYear()}-${String(new Date(value).getMonth() + 1).padStart(2, '0')}` : '';

function TahunForm({ form, onSubmit, onClose, title }) {
    return <form onSubmit={onSubmit} className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="space-y-3">
            <FormField label="Tahun" error={form.errors.tahun} required><input className={`input input-bordered min-h-11 w-full ${form.errors.tahun ? 'input-error' : ''}`} value={form.data.tahun} onChange={(e) => form.setData('tahun', e.target.value)} required /></FormField>
            <FormField label="Mulai" error={form.errors.mulai} required><input type="month" className={`input input-bordered min-h-11 w-full ${form.errors.mulai ? 'input-error' : ''}`} value={form.data.mulai} onChange={(e) => form.setData('mulai', e.target.value)} required /></FormField>
            <FormField label="Selesai" error={form.errors.selesai} required><input type="month" className={`input input-bordered min-h-11 w-full ${form.errors.selesai ? 'input-error' : ''}`} value={form.data.selesai} onChange={(e) => form.setData('selesai', e.target.value)} required /></FormField>
            <FormField error={form.errors.isactive}><label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" className="checkbox checkbox-primary" checked={!!form.data.isactive} onChange={(e) => form.setData('isactive', e.target.checked)} /><span>Aktif</span></label></FormField>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button type="submit" loading={form.processing}>Simpan</Button></div>
    </form>;
}

export default function TahunKepengurusan({ tahunKepengurusan, flash }) {
    const { can } = usePermission();
    const canCreate = can('tahun_kepengurusan.create');
    const canUpdate = can('tahun_kepengurusan.update');
    const canDelete = can('tahun_kepengurusan.delete');
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const createForm = useForm({ tahun: '', mulai: '', selesai: '', isactive: false });
    const editForm = useForm({ tahun: '', mulai: '', selesai: '', isactive: false });
    const { delete: destroy } = useForm();

    useEffect(() => { if (flash?.message) toast.success(flash.message); }, [flash]);
    const close = () => { setModal(null); setSelected(null); createForm.reset(); editForm.reset(); };
    const openEdit = (item) => { setSelected(item); editForm.setData({ tahun: item.tahun, mulai: monthInput(item.mulai), selesai: monthInput(item.selesai), isactive: !!item.isactive }); setModal('edit'); };
    const submit = (form, method, url, message) => (event) => { event.preventDefault(); form[method](url, { onSuccess: () => { close(); toast.success(message); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menyimpan data') }); };

    const columns = useMemo(() => [
        { key: 'tahun', header: 'Tahun' },
        { key: 'mulai', header: 'Mulai', render: (item) => formatMonthYear(item.mulai) },
        { key: 'selesai', header: 'Selesai', render: (item) => formatMonthYear(item.selesai) },
        { key: 'isactive', header: 'Status', render: (item) => <StatusBadge status={item.isactive ? 'aktif' : 'nonaktif'} label={item.isactive ? 'Aktif' : 'Tidak Aktif'} /> },
        ...(canUpdate || canDelete ? [{ header: 'Aksi', sortable: false, searchable: false, headerClassName: 'text-right', render: (item) => <RowActions onEdit={canUpdate ? () => openEdit(item) : null} onDelete={canDelete ? () => { setSelected(item); setModal('delete'); } : null} /> }] : []),
    ], [canUpdate, canDelete]);

    return <DashboardLayout>
        <Head title="Tahun Kepengurusan" />
        <PageHeader title="Tahun Kepengurusan" description="Kelola rentang dan status tahun kepengurusan." actions={canCreate && <Button onClick={() => setModal('create')}>Tambah Baru</Button>} />
        <PageSection><DataGrid rows={tahunKepengurusan} columns={columns} searchPlaceholder="Cari tahun kepengurusan..." emptyMessage="Belum ada tahun kepengurusan." filters={[{ key: 'isactive', label: 'Status', options: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Tidak Aktif' }] }]} /></PageSection>
        <Modal show={modal === 'create'} onClose={close} maxWidth="md"><TahunForm title="Tambah Tahun Kepengurusan" form={createForm} onClose={close} onSubmit={submit(createForm, 'post', route('tahun-kepengurusan.store'), 'Tahun kepengurusan berhasil ditambahkan')} /></Modal>
        <Modal show={modal === 'edit' && !!selected} onClose={close} maxWidth="md">{selected && <TahunForm title="Edit Tahun Kepengurusan" form={editForm} onClose={close} onSubmit={submit(editForm, 'put', route('tahun-kepengurusan.update', selected.id), 'Tahun kepengurusan berhasil diperbarui')} />}</Modal>
        <ConfirmModal show={modal === 'delete' && !!selected} onClose={close} onConfirm={() => destroy(route('tahun-kepengurusan.destroy', selected.id), { onSuccess: () => { close(); toast.success('Tahun kepengurusan berhasil dihapus'); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menghapus data') })} title="Konfirmasi Hapus" message="Apakah Anda yakin ingin menghapus tahun kepengurusan ini? Tindakan ini tidak dapat dibatalkan." confirmText="Hapus" cancelText="Batal" type="danger" />
    </DashboardLayout>;
}
