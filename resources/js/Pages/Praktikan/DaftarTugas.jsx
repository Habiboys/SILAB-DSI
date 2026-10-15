import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, Eye, History, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function DaftarTugas({ praktikans = [], tugasPraktikums = [], riwayatPengumpulan = [], practicumYear, practicumArchive = false }) {
    const [tab, setTab] = useState('tugas');
    const { kepengurusan_list = [], selected_kepengurusan } = usePage().props;
    const changeYear = (event) => {
        const url = new URL(window.location.href);
        url.searchParams.set('kepengurusan_lab_id', event.target.value);
        url.searchParams.delete('tahun_id');
        url.searchParams.delete('lab_id');
        router.get(url.pathname + url.search, {}, { preserveState: false, preserveScroll: true });
    };
    const names = useMemo(() => new Map(praktikans.map((item) => [String(item.praktikum_id || item.praktikum?.id), item.praktikum?.mata_kuliah || item.praktikum?.nama_praktikum])), [praktikans]);
    const submitted = useMemo(() => new Set(riwayatPengumpulan.map((item) => String(item.tugas_praktikum_id))), [riwayatPengumpulan]);
    const rows = useMemo(() => tugasPraktikums.filter((item) => !submitted.has(String(item.id))).map((item) => {
        const praktikumId = item.praktikum_id || item.praktikum?.id || item.kelas?.praktikum_id || item.pertemuan?.kelas?.praktikum_id;
        return { ...item, praktikum_label: item.praktikum?.mata_kuliah || names.get(String(praktikumId)) || 'Praktikum tidak diketahui', status_label: 'Belum Dikumpulkan' };
    }), [tugasPraktikums, submitted, names]);
    const upcoming = rows.filter(item => !item.deadline || new Date(item.deadline) >= new Date()).sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));
    const overdue = rows.filter(item => item.deadline && new Date(item.deadline) < new Date());
    const praktikumOptions = useMemo(() => [...new Set(rows.map((item) => item.praktikum_label))].map((label) => ({ value: label, label })), [rows]);
    const formatDeadline = (value) => value ? new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const columns = [
        { header: 'No', sortable: false, searchable: false, render: (_, index) => index + 1 },
        { key: 'judul_tugas', header: 'Tugas' },
        { key: 'praktikum_label', header: 'Praktikum' },
        { key: 'deadline', header: 'Tenggat', render: (item) => formatDeadline(item.deadline) },
        { key: 'status_label', header: 'Status', render: (item) => <StatusBadge tone={item.deadline && new Date(item.deadline) < new Date() ? 'error' : 'warning'} label={item.deadline && new Date(item.deadline) < new Date() ? 'Lewat Tenggat' : 'Belum Dikumpulkan'} /> },
        { header: 'Aksi', sortable: false, searchable: false, render: (item) => <Button href={route('praktikan.tugas.show', item.id)} variant="ghost"><Eye className="h-4 w-4" /> {item.deadline && new Date(item.deadline) < new Date() ? 'Lihat Tugas' : 'Lihat dan Kumpulkan'}</Button> },
    ];
    const kelas = useMemo(() => praktikans.map((item) => ({
        id: item.praktikum_id || item.praktikum?.id,
        title: item.praktikum?.mata_kuliah || item.praktikum?.nama_praktikum || 'Praktikum',
        className: item.kelas?.nama_kelas || 'Kelas belum ditentukan',
        lab: item.praktikum?.kepengurusan_lab?.laboratorium?.nama || item.praktikum?.kepengurusanLab?.laboratorium?.nama,
        taskCount: upcoming.filter((task) => String(task.praktikum_id || task.praktikum?.id || task.kelas?.praktikum_id || task.pertemuan?.kelas?.praktikum_id) === String(item.praktikum_id || item.praktikum?.id)).length,
    })).filter((item, index, all) => item.id && all.findIndex((entry) => String(entry.id) === String(item.id)) === index), [praktikans, rows]);

    return <DashboardLayout>
        <Head title="Praktikum Saya" />
        <PageHeader title="Praktikum Saya" description="Pantau tugas, buka modul, dan lihat riwayat pengumpulan."
            actions={kepengurusan_list.length > 0 && <label className="fieldset"><span className="fieldset-legend">Tahun praktikum</span><select className="select min-h-11 w-full sm:w-48" value={selected_kepengurusan?.id || ''} onChange={changeYear}>{kepengurusan_list.map(item => <option key={item.id} value={item.id}>{item.label || item.tahun}{!item.is_active ? ' - Arsip' : ''}</option>)}</select></label>} />
        <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
            <div className="tabs tabs-box w-fit" role="tablist" aria-label="Navigasi praktikum">
                <button type="button" role="tab" aria-selected={tab === 'tugas'} className={`tab ${tab === 'tugas' ? 'tab-active' : ''}`} onClick={() => setTab('tugas')}>Tugas ({upcoming.length})</button>
                <button type="button" role="tab" aria-selected={tab === 'praktikum'} className={`tab ${tab === 'praktikum' ? 'tab-active' : ''}`} onClick={() => setTab('praktikum')}>Praktikum ({kelas.length})</button>
            </div>
            {practicumArchive && <StatusBadge tone="neutral" label={`Arsip ${practicumYear || ''}`} />}
        </div>
        {tab === 'praktikum' && <>
        <div className="grid gap-3 lg:grid-cols-2">
            {kelas.map((item) => <article key={item.id} className="border border-base-300 bg-base-100">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><h2 className="card-title text-base">{item.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-base-content/65"><Users className="h-4 w-4" /> {item.className}</p></div>
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
        {kelas.length === 0 && <PageSection><p className="py-8 text-center text-sm text-base-content/60">Tidak ada praktikum pada tahun yang dipilih.</p></PageSection>}
        </>}
        {tab === 'tugas' && <div className="space-y-4">
            {upcoming.length === 0 ? <PageSection title="Tugas yang Perlu Dikumpulkan"><div className="space-y-3 py-6 text-center"><p className="text-sm text-base-content/60">Tidak ada tugas yang perlu dikumpulkan.</p><Button variant="outline" onClick={() => setTab('praktikum')}>Lihat Praktikum</Button></div></PageSection> :
                <PageSection title="Tugas yang Perlu Dikumpulkan" description="Diurutkan dari tenggat terdekat." bodyClassName="p-0 sm:p-0"><DataGrid rows={upcoming} columns={columns} filters={[{ key: 'praktikum_label', label: 'Praktikum', options: praktikumOptions }]} searchPlaceholder="Cari tugas atau praktikum..." /></PageSection>}
            {overdue.length > 0 && <details className="rounded-box border border-base-300 bg-base-100"><summary className="cursor-pointer p-4 text-sm font-medium">Lewat Tenggat ({overdue.length})</summary><DataGrid rows={overdue} columns={columns} searchPlaceholder="Cari tugas lewat tenggat..." /></details>}
        </div>}
        </div>
    </DashboardLayout>;
}
