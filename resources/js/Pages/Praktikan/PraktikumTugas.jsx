import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Calendar, Download, Eye, Upload } from 'lucide-react';
import { useState } from 'react';
import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';

const statuses = {
    belum_dikumpulkan: { label: 'Belum Dikumpulkan', tone: 'warning' },
    dikumpulkan: { label: 'Dikumpulkan', tone: 'info' },
    dinilai: { label: 'Dinilai', tone: 'success' },
    terlambat: { label: 'Terlambat', tone: 'error' },
};
const formatDate = (value) => value ? new Date(value).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '-';

export default function PraktikumTugas({ praktikan, tugasPraktikums = [], riwayatPengumpulan = [] }) {
    const [selectedTugas, setSelectedTugas] = useState(null);
    const praktikum = praktikan?.praktikum ?? praktikan?.praktikumData ?? {};
    const title = `Tugas ${praktikum.mata_kuliah || praktikum.nama_praktikum || 'Praktikum'}`;
    const form = useForm({ files: [], catatan: '' });
    const close = () => { if (form.processing) return; setSelectedTugas(null); form.reset(); form.clearErrors(); };
    const submit = (event) => {
        event.preventDefault();
        if (!selectedTugas) return;
        form.post(route('praktikum.tugas.pengumpulan.store', { tugas: selectedTugas.id }), {
            preserveScroll: true,
            onSuccess: () => { setSelectedTugas(null); form.reset(); form.clearErrors(); },
        });
    };

    return <DashboardLayout backFallback={route('praktikan.daftar-tugas')}>
        <Head title={title} />
        <PageHeader title={title} description={praktikan?.kelas?.nama_kelas ? `Kelas ${praktikan.kelas.nama_kelas}` : undefined} />
        <PageSection title="Daftar Tugas" description={`${tugasPraktikums.length} tugas tersedia untuk kelas Anda.`}>
            {tugasPraktikums.length === 0 ? <p className="py-8 text-center text-sm text-base-content/60">Belum ada tugas untuk kelas ini.</p> :
                <div className={`grid gap-4 ${tugasPraktikums.length > 1 ? 'xl:grid-cols-2' : ''}`}>
                    {tugasPraktikums.map((tugas) => {
                        const pengumpulan = riwayatPengumpulan.find(item => item.tugas_praktikum_id === tugas.id);
                        const status = statuses[pengumpulan?.status] || statuses.belum_dikumpulkan;
                        const expired = tugas.deadline && new Date(tugas.deadline) < new Date();
                        return <article key={tugas.id} className="flex min-w-0 flex-col gap-4 rounded-box border border-base-300 p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <h3 className="min-w-0 flex-1 break-words text-base font-semibold">{tugas.judul_tugas}</h3>
                                <StatusBadge tone={status.tone} label={status.label} className="shrink-0" />
                            </div>
                            {tugas.deskripsi && <p className="whitespace-pre-wrap break-words text-sm text-base-content/70">{tugas.deskripsi}</p>}
                            <p className="flex items-start gap-2 text-sm text-base-content/60"><Calendar className="mt-0.5 h-4 w-4 shrink-0" /><span>Tenggat: {formatDate(tugas.deadline)}</span></p>
                            {pengumpulan && <div className="space-y-2 rounded-box bg-base-200 p-3 text-sm">
                                <p>Dikumpulkan: {formatDate(pengumpulan.submitted_at)}</p>
                                {pengumpulan.nilai !== null && pengumpulan.nilai !== undefined && <p className="font-medium">Nilai: {pengumpulan.nilai}</p>}
                                {pengumpulan.feedback && <p className="break-words"><strong>Umpan balik:</strong> {pengumpulan.feedback}</p>}
                            </div>}
                            {expired && !pengumpulan && <p className="text-sm text-error">Tenggat pengumpulan telah lewat.</p>}
                            <div className="mt-auto flex flex-col gap-2 border-t border-base-200 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                                <Button href={pengumpulan?.id ? route('praktikan.riwayat.show', { pengumpulan: pengumpulan.id }) : route('praktikan.tugas.show', { tugas: tugas.id })} variant="outline" size="sm"><Eye className="h-4 w-4" />{pengumpulan?.id ? 'Detail Pengumpulan' : 'Detail Tugas'}</Button>
                                {tugas.file_tugas && <Button external href={route('praktikan.tugas.view-instruksi', { tugas: tugas.id })} target="_blank" rel="noopener noreferrer" variant="outline" size="sm"><Download className="h-4 w-4" />Lihat Instruksi</Button>}
                                {!pengumpulan && !expired && <Button size="sm" onClick={() => { form.reset(); form.clearErrors(); setSelectedTugas(tugas); }}><Upload className="h-4 w-4" />Kumpul Tugas</Button>}
                            </div>
                        </article>;
                    })}
                </div>}
        </PageSection>
        <Modal show={!!selectedTugas} onClose={close} maxWidth="md">
            <form onSubmit={submit} className="space-y-4 p-4 sm:p-6">
                <div><h2 className="text-lg font-semibold">Kumpul Tugas</h2><p className="mt-1 break-words text-sm text-base-content/60">{selectedTugas?.judul_tugas}</p></div>
                <FormField label="File tugas" required error={form.errors.files || form.errors['files.0']} hint="PDF, DOC, DOCX, ZIP, atau RAR. Maksimal 10 MB per file.">
                    <input type="file" multiple required accept=".pdf,.doc,.docx,.zip,.rar" className="file-input min-h-11 w-full" onChange={event => form.setData('files', Array.from(event.target.files))} />
                </FormField>
                <FormField label="Catatan (opsional)" error={form.errors.catatan}>
                    <textarea className="textarea min-h-24 w-full" rows={3} value={form.data.catatan} onChange={event => form.setData('catatan', event.target.value)} />
                </FormField>
                <div className="flex flex-col-reverse gap-2 border-t border-base-200 pt-4 sm:flex-row sm:justify-end">
                    <Button variant="ghost" onClick={close} disabled={form.processing}>Batal</Button>
                    <Button type="submit" loading={form.processing}>Kumpul Tugas</Button>
                </div>
            </form>
        </Modal>
    </DashboardLayout>;
}
