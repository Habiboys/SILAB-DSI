import Button from '@/Components/Button';
import ConfirmModal from '@/Components/ConfirmModal';
import { ServerDataTable } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import RowActions from '@/Components/RowActions';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Index({ kuesioner, can, filters = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [tipe, setTipe] = useState(filters.tipe ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [perPage, setPerPage] = useState(Number(filters.per_page ?? 10));
    const [selected, setSelected] = useState(null);
    const timer = useRef(null);
    const deleteForm = useForm({});

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const apply = (changes = {}) => router.get(route('kuesioner.index'), {
        search, tipe, status, per_page: perPage, ...changes,
    }, { preserveScroll: true, preserveState: true, replace: true });
    const changeSearch = (event) => {
        const value = event.target.value;
        setSearch(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => apply({ search: value }), 400);
    };
    const changeTipe = (value) => { setTipe(value); apply({ tipe: value }); };
    const changeStatus = (value) => { setStatus(value); apply({ status: value }); };
    const changePerPage = (event) => { const value = Number(event.target.value); setPerPage(value); apply({ per_page: value }); };
    const remove = () => deleteForm.delete(route('kuesioner.destroy', selected.id), {
        preserveScroll: true,
        onSuccess: () => setSelected(null),
        onError: () => toast.error('Gagal menghapus kuesioner.'),
    });
    const fmtDate = (date) => date ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
    const columns = [
        { header: 'No', render: (_, index) => index + 1 },
        { key: 'judul', header: 'Judul', render: (item) => <div><div className="font-medium">{item.judul}</div>{item.deskripsi && <div className="max-w-xs truncate text-xs text-base-content/70">{item.deskripsi}</div>}{item.is_mandatory && <StatusBadge status="warning" label="Wajib Diisi" className="mt-1" />}</div> },
        { key: 'tipe', header: 'Tipe', render: (item) => <StatusBadge tone={item.tipe === 'internal' ? 'success' : 'info'} label={item.tipe === 'internal' ? 'Internal' : 'Eksternal'} /> },
        { key: 'tanggal_mulai', header: 'Periode', render: (item) => item.tanggal_mulai ? `${fmtDate(item.tanggal_mulai)} sampai ${item.tanggal_selesai ? fmtDate(item.tanggal_selesai) : 'seterusnya'}` : '-' },
        { key: 'is_active', header: 'Status', render: (item) => <StatusBadge status={item.is_active ? 'aktif' : 'nonaktif'} label={item.is_active ? 'Aktif' : 'Nonaktif'} /> },
        { key: 'pembuat.name', header: 'Dibuat Oleh', render: (item) => item.pembuat?.name ?? '-' },
        { header: 'Aksi', render: (item) => <RowActions detailHref={route('kuesioner.show', item.id)} editHref={can.edit ? route('kuesioner.edit', item.id) : null} onDelete={can.delete ? () => setSelected(item) : null} /> },
    ];

    return <DashboardLayout>
        <Head title="Kuesioner" />
        <PageHeader title="Daftar Kuesioner" description="Kelola kuesioner internal dan eksternal." actions={can.create && <Button href={route('kuesioner.create')}><PlusCircle className="h-4 w-4" /> Buat Kuesioner</Button>} />
        <PageSection bodyClassName="p-0 sm:p-0">
            <ServerDataTable
                paginator={{ ...kuesioner.meta, data: kuesioner.data, links: kuesioner.links }}
                columns={columns}
                search={search}
                onSearchChange={changeSearch}
                searchPlaceholder="Cari judul atau deskripsi..."
                perPage={perPage}
                onPerPageChange={changePerPage}
                filters={[
                    { key: 'tipe', label: 'Tipe', control: <select className="select select-bordered min-h-11" value={tipe} onChange={(e) => changeTipe(e.target.value)}><option value="">Semua</option><option value="internal">Internal</option><option value="eksternal">Eksternal</option></select> },
                    { key: 'status', label: 'Status', control: <select className="select select-bordered min-h-11" value={status} onChange={(e) => changeStatus(e.target.value)}><option value="">Semua</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select> },
                ]}
                emptyMessage={search || tipe || status ? 'Tidak ada kuesioner yang cocok dengan filter.' : 'Belum ada kuesioner yang dibuat.'}
            />
        </PageSection>
        <ConfirmModal show={!!selected} onClose={() => setSelected(null)} onConfirm={remove} title="Hapus Kuesioner" message={selected ? `Yakin ingin menghapus kuesioner "${selected.judul}"? Semua respons terkait akan dihapus dan tindakan ini tidak dapat dibatalkan.` : ''} confirmText={deleteForm.processing ? 'Menghapus...' : 'Hapus'} cancelText="Batal" type="danger" />
    </DashboardLayout>;
}
