import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function RubrikPenilaianIndex({ tugas, rubrik }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ nama_rubrik: '', deskripsi: '', komponen: [{ nama_komponen: '', deskripsi: '', bobot: 0, nilai_maksimal: 100 }] });
    const totalBobot = form.data.komponen.reduce((sum, item) => sum + Number(item.bobot || 0), 0);
    const update = (index, key, value) => form.setData('komponen', form.data.komponen.map((item, i) => i === index ? { ...item, [key]: value } : item));
    const add = () => form.setData('komponen', [...form.data.komponen, { nama_komponen: '', deskripsi: '', bobot: 0, nilai_maksimal: 100 }]);
    const remove = (index) => form.data.komponen.length > 1 && form.setData('komponen', form.data.komponen.filter((_, i) => i !== index));
    const submit = (event) => {
        event.preventDefault();
        if (totalBobot !== 100) return;
        form.post(route('praktikum.tugas.rubrik.store', tugas.id), { onSuccess: () => { setOpen(false); form.reset(); } });
    };
    const columns = [
        { key: 'nama_komponen', header: 'Komponen' },
        { key: 'deskripsi', header: 'Deskripsi', render: (item) => item.deskripsi || '-' },
        { key: 'bobot', header: 'Bobot', render: (item) => `${item.bobot}%` },
        { key: 'nilai_maksimal', header: 'Nilai Maksimal' },
    ];

    return <DashboardLayout>
        <Head title={`Rubrik Penilaian - ${tugas.judul_tugas}`} />
        <PageHeader title="Rubrik Penilaian" description={`${tugas.judul_tugas} · ${tugas.praktikum.mata_kuliah}`} actions={<>
            <Button variant="ghost" onClick={() => router.visit(`/praktikum/${tugas.praktikum_id}/tugas`)}><ArrowLeft className="h-4 w-4" /> Daftar Tugas</Button>
            {rubrik && <Button variant="secondary" href={route('praktikum.tugas.grading', tugas.id)}>Mulai Penilaian</Button>}
            <Button onClick={() => setOpen(true)}>{rubrik ? 'Buat Rubrik Baru' : 'Buat Rubrik'}</Button>
        </>} />
        {rubrik ? <PageSection title={`Rubrik Aktif: ${rubrik.nama_rubrik}`} description={rubrik.deskripsi} bodyClassName="p-0 sm:p-0"><DataGrid rows={rubrik.komponen_rubriks ?? []} columns={columns} searchPlaceholder="Cari komponen rubrik..." emptyMessage="Rubrik belum memiliki komponen penilaian." /></PageSection>
            : <PageSection><div className="py-10 text-center text-base-content/70"><p>Belum ada rubrik penilaian untuk tugas ini.</p><p className="mt-1 text-sm">Buat rubrik untuk memulai proses penilaian.</p></div></PageSection>}
        <Modal show={open} onClose={() => setOpen(false)} maxWidth="2xl">
            <form onSubmit={submit} className="flex max-h-[calc(100vh-5rem)] flex-col">
                <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">Buat Rubrik Penilaian</h2></header>
                <div className="space-y-4 overflow-y-auto p-5">
                    <FormField label="Nama Rubrik" error={form.errors.nama_rubrik} required><input className="input input-bordered min-h-11 w-full" value={form.data.nama_rubrik} onChange={(e) => form.setData('nama_rubrik', e.target.value)} required /></FormField>
                    <FormField label="Deskripsi" error={form.errors.deskripsi}><textarea className="textarea textarea-bordered min-h-24 w-full" value={form.data.deskripsi} onChange={(e) => form.setData('deskripsi', e.target.value)} /></FormField>
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Komponen Penilaian</h3><span className={totalBobot === 100 ? 'text-success' : 'text-error'}>Total bobot: {totalBobot}%</span></div>
                    {form.data.komponen.map((item, index) => <fieldset key={index} className="rounded-md border border-base-300 p-4"><legend className="px-2 font-medium">Komponen {index + 1}</legend><div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField label="Nama Komponen" required><input className="input input-bordered min-h-11 w-full" value={item.nama_komponen} onChange={(e) => update(index, 'nama_komponen', e.target.value)} required /></FormField>
                        <FormField label="Bobot (%)" required><input type="number" min="0" max="100" step="0.1" className="input input-bordered min-h-11 w-full" value={item.bobot} onChange={(e) => update(index, 'bobot', Number(e.target.value))} required /></FormField>
                        <FormField label="Deskripsi" className="md:col-span-2"><textarea className="textarea textarea-bordered min-h-20 w-full" value={item.deskripsi} onChange={(e) => update(index, 'deskripsi', e.target.value)} /></FormField>
                        <FormField label="Nilai Maksimal" required><input type="number" min="1" max="1000" className="input input-bordered min-h-11 w-full" value={item.nilai_maksimal} onChange={(e) => update(index, 'nilai_maksimal', Number(e.target.value))} required /></FormField>
                        {form.data.komponen.length > 1 && <div className="flex items-end"><Button variant="danger" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /> Hapus Komponen</Button></div>}
                    </div></fieldset>)}
                    <Button variant="ghost" className="w-full" onClick={add}><Plus className="h-4 w-4" /> Tambah Komponen</Button>
                </div>
                <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" loading={form.processing} disabled={totalBobot !== 100}>Simpan Rubrik</Button></footer>
            </form>
        </Modal>
    </DashboardLayout>;
}
