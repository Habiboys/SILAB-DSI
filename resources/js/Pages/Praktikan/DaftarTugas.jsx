import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';

export default function DaftarTugas({ praktikans = [], tugasPraktikums = [], riwayatPengumpulan = [] }) {
    const names = useMemo(() => new Map(praktikans.map((item) => [String(item.praktikum_id || item.praktikum?.id), item.praktikum?.mata_kuliah || item.praktikum?.nama_praktikum])), [praktikans]);
    const submitted = useMemo(() => new Set(riwayatPengumpulan.map((item) => String(item.tugas_praktikum_id))), [riwayatPengumpulan]);
    const rows = useMemo(() => tugasPraktikums.filter((item) => !submitted.has(String(item.id))).map((item) => {
        const praktikumId = item.praktikum_id || item.praktikum?.id || item.kelas?.praktikum_id || item.pertemuan?.kelas?.praktikum_id;
        return { ...item, praktikum_label: item.praktikum?.mata_kuliah || names.get(String(praktikumId)) || 'Praktikum tidak diketahui', status_label: 'Belum Dikumpulkan' };
    }), [tugasPraktikums, submitted, names]);
    const praktikumOptions = useMemo(() => [...new Set(rows.map((item) => item.praktikum_label))].map((label) => ({ value: label, label })), [rows]);
    const formatDeadline = (value) => value ? new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const columns = [
        { key: 'judul_tugas', header: 'Tugas' },
        { key: 'praktikum_label', header: 'Praktikum' },
        { key: 'deadline', header: 'Tenggat', render: (item) => formatDeadline(item.deadline) },
        { key: 'status_label', header: 'Status', render: () => <StatusBadge tone="warning" label="Belum Dikumpulkan" /> },
        { header: 'Aksi', sortable: false, searchable: false, render: (item) => <Button href={route('praktikan.tugas.show', item.id)} variant="ghost"><Eye className="h-4 w-4" /> Lihat dan Kumpulkan</Button> },
    ];
    return <DashboardLayout>
        <Head title="Daftar Tugas Praktikum" />
        <PageHeader title="Daftar Tugas Praktikum" description="Lihat dan kerjakan tugas yang tersedia untuk praktikum Anda." />
        <PageSection bodyClassName="p-0 sm:p-0"><DataGrid rows={rows} columns={columns} filters={[{ key: 'praktikum_label', label: 'Praktikum', options: praktikumOptions }]} searchPlaceholder="Cari judul tugas atau praktikum..." emptyMessage="Tidak ada tugas yang perlu dikumpulkan." /></PageSection>
    </DashboardLayout>;
}
