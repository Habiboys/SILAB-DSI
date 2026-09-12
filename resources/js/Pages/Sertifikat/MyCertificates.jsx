import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';

export default function MyCertificates({ sertifikats }) {
    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const columns = [
        { key: 'nomor_sertifikat', header: 'Nomor sertifikat' },
        { key: 'jenis_sertifikat', header: 'Jenis', render: (item) => <StatusBadge status={item.jenis_sertifikat} label={item.jenis_sertifikat ? item.jenis_sertifikat[0].toUpperCase() + item.jenis_sertifikat.slice(1) : 'Sertifikat'} /> },
        { key: 'praktikum.mata_kuliah', header: 'Kegiatan / praktikum', render: (item) => item.praktikum ? `Praktikum ${item.praktikum.mata_kuliah}` : item.kegiatan_name || 'Kegiatan SILAB' },
        { key: 'tanggal_terbit', header: 'Tanggal terbit', render: (item) => formatDate(item.tanggal_terbit) },
        { header: 'Aksi', sortable: false, searchable: false, headerClassName: 'text-right', render: (item) => <div className="flex justify-end"><Button href={route('sertifikat.download', item.id)} variant="ghost" size="sm"><Download className="h-4 w-4" />Unduh</Button></div> },
    ];
    return <DashboardLayout><Head title="Sertifikat Saya" /><PageHeader title="Sertifikat Saya" description="Sertifikat kegiatan dan praktikum yang telah diterbitkan untuk Anda." /><PageSection><DataGrid rows={sertifikats} columns={columns} searchPlaceholder="Cari sertifikat..." filters={[{ key: 'jenis_sertifikat', label: 'Jenis', options: [{ value: 'praktikan', label: 'Praktikan' }, { value: 'asisten', label: 'Asisten' }, { value: 'kepengurusan', label: 'Kepengurusan' }, { value: 'kegiatan', label: 'Kegiatan' }] }]} emptyMessage="Belum ada sertifikat yang diterbitkan untuk Anda." /></PageSection></DashboardLayout>;
}
