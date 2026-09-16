import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { BookOpen, ClipboardList, Eye, History, Users } from 'lucide-react';
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
    const kelas = useMemo(() => praktikans.map((item) => ({
        id: item.praktikum_id || item.praktikum?.id,
        title: item.praktikum?.mata_kuliah || item.praktikum?.nama_praktikum || 'Praktikum',
        className: item.kelas?.nama_kelas || 'Kelas belum ditentukan',
        lab: item.praktikum?.kepengurusan_lab?.laboratorium?.nama || item.praktikum?.kepengurusanLab?.laboratorium?.nama,
        taskCount: rows.filter((task) => String(task.praktikum_id || task.praktikum?.id || task.kelas?.praktikum_id || task.pertemuan?.kelas?.praktikum_id) === String(item.praktikum_id || item.praktikum?.id)).length,
    })).filter((item, index, all) => item.id && all.findIndex((entry) => String(entry.id) === String(item.id)) === index), [praktikans, rows]);

    return <DashboardLayout>
        <Head title="Kelas Praktikum Saya" />
        <PageHeader title="Kelas Praktikum Saya" description="Masuk ke kelas untuk membuka modul, tugas aktif, dan riwayat pengumpulan." />
        <div className="tabs tabs-box mb-4 w-fit" role="tablist" aria-label="Navigasi kelas praktikum"><span className="tab tab-active" role="tab">Kelas dan tugas</span></div>
        <div className="grid gap-3 lg:grid-cols-2">
            {kelas.map((item) => <article key={item.id} className="border border-base-300 bg-base-100">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><h2 className="card-title text-base">{item.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-base-content/65"><Users className="h-4 w-4" /> {item.className}</p>{item.lab && <p className="mt-1 text-xs text-base-content/55">{item.lab}</p>}</div>
                        <StatusBadge tone={item.taskCount ? 'warning' : 'success'} label={`${item.taskCount} tugas`} />
                    </div>
                    <div className="grid shrink-0 grid-cols-3 gap-1">
                        <Button href={route('praktikan.modul.praktikum', item.id)} variant="ghost" size="sm" className="flex-col gap-1 min-h-16"><BookOpen className="h-4 w-4" /> Modul</Button>
                        <Button href={route('praktikan.praktikum.tugas', item.id)} variant="ghost" size="sm" className="flex-col gap-1 min-h-16"><ClipboardList className="h-4 w-4" /> Tugas</Button>
                        <Button href={route('praktikan.riwayat.praktikum', item.id)} variant="ghost" size="sm" className="flex-col gap-1 min-h-16"><History className="h-4 w-4" /> Riwayat</Button>
                    </div>
                </div>
            </article>)}
        </div>
        {kelas.length === 0 && <PageSection><p className="py-8 text-center text-sm text-base-content/60">Anda belum terdaftar pada kelas praktikum aktif.</p></PageSection>}
        <PageSection title="Semua tugas aktif" description="Ringkasan tugas dari seluruh kelas Anda." bodyClassName="p-0 sm:p-0"><DataGrid rows={rows} columns={columns} filters={[{ key: 'praktikum_label', label: 'Praktikum', options: praktikumOptions }]} searchPlaceholder="Cari judul tugas atau praktikum..." emptyMessage="Tidak ada tugas yang perlu dikumpulkan." /></PageSection>
    </DashboardLayout>;
}
