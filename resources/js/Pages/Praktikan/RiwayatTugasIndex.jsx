import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function RiwayatTugasIndex({ praktikumRiwayatList = [] }) {
    const columns = [
        {
            key: 'mata_kuliah',
            header: 'Mata Kuliah',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="font-medium">{item.mata_kuliah}</span>
                </div>
            ),
        },
        { key: 'periode', header: 'Periode', render: (item) => item.periode || '-' },
        { key: 'riwayat_count', header: 'Riwayat', render: (item) => `${item.riwayat_count} pengumpulan` },
        {
            header: 'Aksi',
            sortable: false,
            searchable: false,
            headerClassName: 'text-right',
            render: (item) => (
                <Button variant="ghost" href={route('praktikan.riwayat.praktikum', item.id)}>
                    Lihat Riwayat <ChevronRight className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Riwayat Tugas" />
            <PageHeader title="Riwayat Tugas" description="Pilih praktikum untuk melihat riwayat pengumpulan tugasnya." />
            <PageSection bodyClassName="p-0 sm:p-0">
                <DataGrid
                    rows={praktikumRiwayatList}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari mata kuliah atau periode..."
                    emptyMessage="Belum ada praktikum aktif. Praktikum yang Anda ikuti akan tampil di sini."
                />
            </PageSection>
        </DashboardLayout>
    );
}
