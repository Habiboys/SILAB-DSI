import Button from '@/Components/Button';
import { DataGrid } from '@/Components/DataTable';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import RowActions, { IconAction } from '@/Components/RowActions';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronLeft, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Index({ tugas }) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ nama_komponen: '', deskripsi: '', bobot: '', nilai_maksimal: '' });
    const rows = tugas.komponen_rubriks ?? [];
    const totalBobot = rows.reduce((sum, item) => sum + Number(item.bobot), 0);

    const closeForm = () => { setShowForm(false); setEditing(null); reset(); };
    const edit = (item) => {
        setEditing(item);
        setData({ nama_komponen: item.nama_komponen, deskripsi: item.deskripsi || '', bobot: item.bobot, nilai_maksimal: item.nilai_maksimal });
        setShowForm(true);
    };
    const submit = (event) => {
        event.preventDefault();
        const options = { onSuccess: closeForm };
        editing
            ? put(route('praktikum.tugas.komponen.update', { tugas: tugas.id, komponen: editing.id }), options)
            : post(route('praktikum.tugas.komponen.store', tugas.id), options);
    };
    const remove = (item) => confirm('Apakah Anda yakin ingin menghapus komponen ini?')
        && router.delete(route('praktikum.tugas.komponen.destroy', { tugas: tugas.id, komponen: item.id }));
    const move = (item, offset) => {
        const next = [...rows];
        const index = next.findIndex(({ id }) => id === item.id);
        const target = index + offset;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        router.put(route('praktikum.tugas.komponen.update-urutan', tugas.id), { komponen_ids: next.map(({ id }) => id) });
    };

    const columns = [
        { key: 'urutan', header: 'Urutan', render: (item) => `#${item.urutan}` },
        { key: 'nama_komponen', header: 'Nama Komponen' },
        { key: 'deskripsi', header: 'Deskripsi', render: (item) => item.deskripsi || '-' },
        { key: 'bobot', header: 'Bobot', render: (item) => `${item.bobot}%` },
        { key: 'nilai_maksimal', header: 'Nilai Maksimal' },
        {
            header: 'Aksi', sortable: false, searchable: false, cellClassName: 'w-48',
            render: (item) => {
                const index = rows.findIndex(({ id }) => id === item.id);
                return <RowActions onEdit={() => edit(item)} onDelete={() => remove(item)}>
                    <IconAction label="Pindah ke atas" icon={ArrowUp} onClick={() => move(item, -1)} tone="text-base-content" disabled={index === 0} />
                    <IconAction label="Pindah ke bawah" icon={ArrowDown} onClick={() => move(item, 1)} tone="text-base-content" disabled={index === rows.length - 1} />
                </RowActions>;
            },
        },
    ];

    return <DashboardLayout>
        <Head title={`Komponen Rubrik - ${tugas.judul_tugas}`} />
        <PageHeader
            title="Kelola Komponen Rubrik"
            description={`${tugas.praktikum?.mata_kuliah || 'Mata kuliah'} · ${tugas.judul_tugas}`}
            actions={<>
                <Button variant="ghost" onClick={() => router.get(route('praktikum.tugas.submissions', { tugas: tugas.id }))}><ChevronLeft className="h-4 w-4" /> Kembali</Button>
                <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Tambah Komponen</Button>
            </>}
        />

        {showForm && <PageSection title={editing ? 'Edit Komponen' : 'Tambah Komponen'} className="mb-5">
            <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Nama Komponen" error={errors.nama_komponen} required><input className="input input-bordered min-h-11 w-full" value={data.nama_komponen} onChange={(e) => setData('nama_komponen', e.target.value)} required /></FormField>
                <FormField label="Bobot (%)" error={errors.bobot} required><input type="number" min="0" max="100" step="0.1" className="input input-bordered min-h-11 w-full" value={data.bobot} onChange={(e) => setData('bobot', e.target.value)} required /></FormField>
                <FormField label="Nilai Maksimal" error={errors.nilai_maksimal} required><input type="number" min="0" step="0.1" className="input input-bordered min-h-11 w-full" value={data.nilai_maksimal} onChange={(e) => setData('nilai_maksimal', e.target.value)} required /></FormField>
                <FormField label="Deskripsi" error={errors.deskripsi}><textarea className="textarea textarea-bordered min-h-24 w-full" value={data.deskripsi} onChange={(e) => setData('deskripsi', e.target.value)} /></FormField>
                <div className="flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeForm}>Batal</Button><Button type="submit" loading={processing}>{editing ? 'Perbarui' : 'Simpan'}</Button></div>
            </form>
        </PageSection>}

        <PageSection title="Komponen Penilaian" description={`Total bobot ${totalBobot}%. ${totalBobot === 100 ? 'Bobot sudah lengkap.' : 'Total bobot harus 100%.'}`} bodyClassName="p-0 sm:p-0">
            <DataGrid rows={rows} columns={columns} searchPlaceholder="Cari nama atau deskripsi komponen..." emptyMessage="Belum ada komponen rubrik. Tambahkan komponen untuk memulai penilaian." />
        </PageSection>
    </DashboardLayout>;
}
