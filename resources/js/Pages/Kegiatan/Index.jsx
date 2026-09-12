import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Button from '../../Components/Button';
import ConfirmModal from '../../Components/ConfirmModal';
import { DataGrid } from '../../Components/DataTable';
import { useLab } from '../../Components/LabContext';
import PageHeader from '../../Components/PageHeader';
import PageSection from '../../Components/PageSection';
import RowActions from '../../Components/RowActions';
import StatusBadge from '../../Components/StatusBadge';
import DashboardLayout from '../../Layouts/DashboardLayout';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

export default function KegiatanIndex({ kegiatan, filters, can, kepengurusanLabId }) {
    const [activeStatus, setActiveStatus] = useState(filters.status || 'all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { selectedKepengurusanLabId } = useLab();
    
    useEffect(() => {
        if (!selectedKepengurusanLabId || String(selectedKepengurusanLabId) === String(filters.kepengurusan_lab_id)) return;
        router.get(route('kegiatan.index'), { kepengurusan_lab_id: selectedKepengurusanLabId, status: activeStatus !== 'all' ? activeStatus : undefined }, { preserveState: true });
    }, [selectedKepengurusanLabId]);

    const changeStatus = (status) => {
        setActiveStatus(status);
        router.get(route('kegiatan.index'), { status: status === 'all' ? undefined : status, kepengurusan_lab_id: filters.kepengurusan_lab_id || undefined }, { preserveState: true });
    };

    const columns = useMemo(() => [
        { key: 'nama_kegiatan', header: 'Kegiatan', render: (item) => <div><div className="font-medium">{item.nama_kegiatan}</div>{item.deskripsi_kegiatan && <div className="max-w-xs truncate text-sm text-base-content/70">{item.deskripsi_kegiatan}</div>}</div> },
        { key: 'proker.nama_proker', header: 'Proker', render: (item) => item.proker?.nama_proker || '-' },
        { key: 'tanggal_mulai', header: 'Tanggal', render: (item) => <span className="whitespace-nowrap">{formatDate(item.tanggal_mulai)} sampai {formatDate(item.tanggal_selesai)}</span> },
        { key: 'status_approval', header: 'Status', render: (item) => <StatusBadge status={item.status_approval} label={item.status_approval?.[0]?.toUpperCase() + item.status_approval?.slice(1)} /> },
        { key: 'approver.name', header: 'Approver', render: (item) => item.approver?.name || '-' },
        { header: 'Aksi', sortable: false, searchable: false, headerClassName: 'text-right', render: (item) => <RowActions detailHref={route('kegiatan.show', item.id)} editHref={item.status_approval === 'diajukan' && can.create ? route('kegiatan.edit', item.id) : null} onDelete={can.approve ? () => setDeleteTarget(item) : null} /> },
    ], [can]);

    const confirmDelete = () => router.delete(route('kegiatan.destroy', deleteTarget.id), {
        preserveScroll: true,
        onSuccess: () => { toast.success('Kegiatan berhasil dihapus'); setDeleteTarget(null); },
        onError: (errors) => toast.error(Object.values(errors).find(Boolean) || 'Gagal menghapus kegiatan'),
    });

    return <DashboardLayout>
            <Head title="Kegiatan" />
        <PageHeader title="Kegiatan" description="Kelola kegiatan dan program kerja." actions={<><Button variant="ghost" href={route('kegiatan.calendar-view', { kepengurusan_lab_id: kepengurusanLabId })}>Kalender</Button>{can.create && <Button href={route('kegiatan.create', { kepengurusan_lab_id: kepengurusanLabId })}>Buat Kegiatan</Button>}</>} />
        <PageSection actions={<div role="tablist" className="tabs tabs-boxed" aria-label="Filter status kegiatan">{['all', 'diajukan', 'disetujui', 'ditolak'].map((status) => <button key={status} type="button" role="tab" aria-selected={activeStatus === status} onClick={() => changeStatus(status)} className={`tab min-h-11 ${activeStatus === status ? 'tab-active' : ''}`}>{status === 'all' ? 'Semua' : status[0].toUpperCase() + status.slice(1)}</button>)}</div>}>
            <DataGrid rows={kegiatan} columns={columns} searchPlaceholder="Cari kegiatan, proker, atau approver..." emptyMessage="Belum ada kegiatan untuk filter ini." filters={[{ key: 'status_approval', label: 'Status', options: ['diajukan', 'disetujui', 'ditolak'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })) }]} />
        </PageSection>
        <ConfirmModal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Hapus Kegiatan" message={`Apakah Anda yakin ingin menghapus kegiatan "${deleteTarget?.nama_kegiatan}"? Tindakan ini tidak dapat dibatalkan.`} confirmText="Hapus" cancelText="Batal" type="danger" />
    </DashboardLayout>;
}
