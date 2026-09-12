import { Head, router, useForm } from '@inertiajs/react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Button from '../Components/Button';
import { DataGrid } from '../Components/DataTable';
import FormField from '../Components/FormField';
import { useLab } from '../Components/LabContext';
import Modal from '../Components/Modal';
import PageHeader from '../Components/PageHeader';
import PageSection from '../Components/PageSection';
import { usePermission } from '../Components/PermissionContext';
import RowActions, { IconAction } from '../Components/RowActions';
import StatusBadge from '../Components/StatusBadge';
import DashboardLayout from '../Layouts/DashboardLayout';

const formatTanggal = (value) => value ? new Date(value).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-';

export default function KepengurusanLab({ kepengurusanLab, tahunKepengurusan, flash }) {
    const { selectedLab } = useLab();
    const { can } = usePermission();
    const canCreate = can('kepengurusan.manage-struktur') || can('kepengurusan.manage-anggota');
    const canUpdate = canCreate;
    const canToggle = can('kepengurusan.manage-struktur');
    const canCertificate = can('sertifikat.view');
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const createForm = useForm({ tahun_kepengurusan_id: '', laboratorium_id: selectedLab?.id || null, sk: null });
    const editForm = useForm({ sk: null, _method: 'PUT' });

    useEffect(() => { if (flash?.message) toast.success(flash.message); if (flash?.error) toast.error(flash.error); }, [flash]);
    const close = () => { setModal(null); setSelected(null); createForm.reset(); editForm.reset(); };
    const submit = (form, url, message) => (event) => { event.preventDefault(); form.post(url, { forceFormData: true, onSuccess: () => { close(); toast.success(message); }, onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menyimpan data') }); };
    const availableYears = tahunKepengurusan.filter((year) => !kepengurusanLab.some((item) => item.tahun_kepengurusan_id === year.id));

    const columns = useMemo(() => [
        { key: 'tahun_kepengurusan.tahun', header: 'Tahun Kepengurusan' },
        { key: 'tahun_kepengurusan.mulai', header: 'Mulai', render: (item) => formatTanggal(item.tahun_kepengurusan?.mulai) },
        { key: 'tahun_kepengurusan.selesai', header: 'Selesai', render: (item) => formatTanggal(item.tahun_kepengurusan?.selesai) },
        { key: 'is_active', header: 'Status', render: (item) => <StatusBadge status={item.is_active ? 'aktif' : 'nonaktif'} label={item.is_active ? 'Aktif' : 'Tidak Aktif'} /> },
        { key: 'sk', header: 'SK', render: (item) => item.sk ? <a href={route('kepengurusan-lab.download-sk', item.id)} className="link link-primary">Unduh SK</a> : <span className="text-base-content/60">Tidak ada file</span> },
        ...(canCreate || canToggle ? [{ header: 'Aksi', sortable: false, searchable: false, headerClassName: 'text-right', render: (item) => <RowActions onEdit={canUpdate ? () => { setSelected(item); editForm.reset(); setModal('edit'); } : null}>{canCertificate && <Button size="sm" variant="ghost" href={route('kepengurusan-lab.sertifikat', item.id)}>Sertifikat</Button>}{canToggle && <IconAction label={item.is_active ? 'Nonaktifkan' : 'Aktifkan'} icon={item.is_active ? ToggleRight : ToggleLeft} tone={item.is_active ? 'text-success hover:bg-success/10' : 'text-base-content hover:bg-base-200'} onClick={() => confirm(`${item.is_active ? 'Nonaktifkan' : 'Aktifkan'} kepengurusan ${item.tahun_kepengurusan?.tahun}?`) && router.patch(route('kepengurusan-lab.toggle-active', item.id))} />}</RowActions> }] : []),
    ], [canCreate, canUpdate, canToggle, canCertificate]);

    return <DashboardLayout>
        <Head title="Kepengurusan Lab" />
        <PageHeader title="Kepengurusan Lab" description={`Kelola periode kepengurusan ${selectedLab?.nama_lab || selectedLab?.nama || ''}.`} actions={canCreate && <Button onClick={() => { createForm.reset(); createForm.setData('laboratorium_id', selectedLab?.id || null); setModal('create'); }}>Tambah Baru</Button>} />
        <PageSection><DataGrid rows={kepengurusanLab} columns={columns} searchPlaceholder="Cari tahun atau status..." emptyMessage="Belum ada kepengurusan laboratorium." filters={[{ key: 'is_active', label: 'Status', options: [{ value: 'true', label: 'Aktif' }, { value: 'false', label: 'Tidak Aktif' }] }]} /></PageSection>
        <Modal show={modal === 'create'} maxWidth="md" onClose={close}><form onSubmit={submit(createForm, route('kepengurusan-lab.store'), 'Kepengurusan lab berhasil ditambahkan')} className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-semibold">Tambah Kepengurusan Lab</h2><div className="space-y-3"><FormField label="Tahun Kepengurusan" error={createForm.errors.tahun_kepengurusan_id} required><select className={`select select-bordered min-h-11 w-full ${createForm.errors.tahun_kepengurusan_id ? 'select-error' : ''}`} value={createForm.data.tahun_kepengurusan_id} onChange={(e) => createForm.setData('tahun_kepengurusan_id', e.target.value)} required><option value="">Pilih tahun kepengurusan</option>{availableYears.map((year) => <option key={year.id} value={year.id}>{year.tahun} ({formatTanggal(year.mulai)} sampai {formatTanggal(year.selesai)})</option>)}</select></FormField><FormField label="File SK" hint="PDF, maksimal 5 MB" error={createForm.errors.sk}><input type="file" accept=".pdf" className={`file-input file-input-bordered min-h-11 w-full ${createForm.errors.sk ? 'file-input-error' : ''}`} onChange={(e) => createForm.setData('sk', e.target.files[0])} /></FormField></div><div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={close}>Batal</Button><Button type="submit" loading={createForm.processing}>Simpan</Button></div></form></Modal>
        <Modal show={modal === 'edit' && !!selected} maxWidth="md" onClose={close}>{selected && <form onSubmit={submit(editForm, route('kepengurusan-lab.update', selected.id), 'SK kepengurusan lab berhasil diperbarui')} className="p-5 sm:p-6"><h2 className="mb-4 text-lg font-semibold">Perbarui SK</h2><FormField label="File SK Baru" hint="PDF, maksimal 5 MB" error={editForm.errors.sk} required><input type="file" accept=".pdf" className={`file-input file-input-bordered min-h-11 w-full ${editForm.errors.sk ? 'file-input-error' : ''}`} onChange={(e) => editForm.setData('sk', e.target.files[0])} required /></FormField><div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={close}>Batal</Button><Button type="submit" loading={editForm.processing}>Simpan</Button></div></form>}</Modal>
    </DashboardLayout>;
}
