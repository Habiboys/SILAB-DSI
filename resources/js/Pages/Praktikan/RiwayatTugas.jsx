import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { useMemo } from 'react';

export default function RiwayatTugas({ riwayatPengumpulan = [], praktikans = [], praktikum }) {
    const names = useMemo(() => new Map(praktikans.map((item) => [String(item.praktikum_id || item.praktikum?.id), item.praktikum?.mata_kuliah || item.praktikum?.nama_praktikum])), [praktikans]);
    const rows = useMemo(() => riwayatPengumpulan.map((item) => {
        const praktikumId = item.tugasPraktikum?.praktikum?.id || item.tugasPraktikum?.praktikum_id || item.praktikanPraktikum?.praktikum_id;
        return { ...item, judul: item.tugasPraktikum?.judul_tugas || '-', praktikum_label: item.tugasPraktikum?.praktikum?.mata_kuliah || names.get(String(praktikumId)) || 'Praktikum tidak diketahui' };
    }), [riwayatPengumpulan, names]);
    const praktikumOptions = useMemo(() => [...new Set(rows.map((item) => item.praktikum_label))].map((label) => ({ value: label, label })), [rows]);
    const columns = [
        { key: 'judul', header: 'Tugas' },
        { key: 'praktikum_label', header: 'Praktikum' },
        { key: 'submitted_at', header: 'Dikirim', render: (item) => item.submitted_at ? new Date(item.submitted_at).toLocaleString('id-ID') : '-' },
        { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} label={String(item.status || '-').replaceAll('_', ' ')} /> },
        { key: 'total_nilai_with_bonus', header: 'Nilai', render: (item) => item.status === 'dinilai' ? Number(item.total_nilai_with_bonus).toFixed(1) : '-' },
        { header: 'Aksi', sortable: false, searchable: false, render: (item) => <Button href={route('praktikan.riwayat.show', item.id)} variant="ghost"><Eye className="h-4 w-4" /> Lihat Rincian</Button> },
    ];
    return <DashboardLayout>
        <Head title="Riwayat Pengumpulan Tugas" />
        <PageHeader title={`Riwayat Pengumpulan${praktikum?.mata_kuliah ? `: ${praktikum.mata_kuliah}` : ''}`} description="Lacak status, waktu pengumpulan, dan nilai tugas yang telah dikirim." actions={<Button href={route('praktikan.riwayat')} variant="ghost"><ArrowLeft className="h-4 w-4" /> Kembali</Button>} />
        <PageSection bodyClassName="p-0 sm:p-0"><DataGrid rows={rows} columns={columns} filters={praktikum ? [] : [{ key: 'praktikum_label', label: 'Praktikum', options: praktikumOptions }, { key: 'status', label: 'Status', options: [{ value: 'dikumpulkan', label: 'Dikumpulkan' }, { value: 'dinilai', label: 'Dinilai' }, { value: 'terlambat', label: 'Terlambat' }] }]} searchPlaceholder="Cari tugas atau praktikum..." emptyMessage="Belum ada riwayat pengumpulan tugas." /></PageSection>
    </DashboardLayout>;
}
