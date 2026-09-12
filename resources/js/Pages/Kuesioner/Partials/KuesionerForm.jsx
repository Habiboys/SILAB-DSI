import Button from '@/Components/Button';
import FormField from '@/Components/FormField';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const TIPE_PERTANYAAN = [
    { value: 'text', label: 'Teks Singkat' },
    { value: 'textarea', label: 'Teks Panjang' },
    { value: 'radio', label: 'Pilihan Ganda' },
    { value: 'checkbox', label: 'Kotak Centang' },
    { value: 'scale', label: 'Skala 1-5' },
];

const blankQuestion = () => ({
    pertanyaan: '',
    tipe_pertanyaan: 'text',
    wajib_diisi: false,
    opsi: [],
});

export default function KuesionerForm({ kuesioner, roles = [], mode = 'create' }) {
    const isEdit = mode === 'edit';
    const { data, setData, post, put, processing, errors } = useForm({
        judul: kuesioner?.judul ?? '',
        deskripsi: kuesioner?.deskripsi ?? '',
        tipe: kuesioner?.tipe ?? 'internal',
        link_eksternal: kuesioner?.link_eksternal ?? '',
        tanggal_mulai: kuesioner?.tanggal_mulai ? kuesioner.tanggal_mulai.substring(0, 10) : '',
        tanggal_selesai: kuesioner?.tanggal_selesai ? kuesioner.tanggal_selesai.substring(0, 10) : '',
        is_active: kuesioner?.is_active ?? true,
        is_mandatory: kuesioner?.is_mandatory ?? false,
        pertanyaan: kuesioner?.pertanyaan?.length
            ? kuesioner.pertanyaan.map((q) => ({
                  ...q,
                  opsi: (q.opsi || []).map((opt) => (typeof opt === 'object' && opt !== null ? opt.teks : opt)),
              }))
            : [blankQuestion()],
        targets: kuesioner?.targets ?? [],
    });

    const setQuestions = (next) => setData('pertanyaan', next);
    const updateQuestion = (index, field, value) =>
        setQuestions(data.pertanyaan.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    const addQuestion = () => setQuestions([...data.pertanyaan, blankQuestion()]);
    const removeQuestion = (index) => setQuestions(data.pertanyaan.filter((_, i) => i !== index));
    const updateOpsi = (index, opsiIndex, value) =>
        setQuestions(
            data.pertanyaan.map((item, i) =>
                i === index ? { ...item, opsi: (item.opsi || []).map((opt, oi) => (oi === opsiIndex ? value : opt)) } : item,
            ),
        );
    const addOpsi = (index) =>
        setQuestions(data.pertanyaan.map((item, i) => (i === index ? { ...item, opsi: [...(item.opsi || []), ''] } : item)));
    const removeOpsi = (index, opsiIndex) =>
        setQuestions(
            data.pertanyaan.map((item, i) =>
                i === index ? { ...item, opsi: (item.opsi || []).filter((_, oi) => oi !== opsiIndex) } : item,
            ),
        );

    const toggleTarget = (name, checked) =>
        setData('targets', checked ? [...data.targets, name] : data.targets.filter((t) => t !== name));

    const submit = (event) => {
        event.preventDefault();
        isEdit
            ? put(route('kuesioner.update', kuesioner.id))
            : post(route('kuesioner.store'));
    };

    return (
        <DashboardLayout>
            <Head title={isEdit ? 'Edit Kuesioner' : 'Buat Kuesioner'} />
            <PageHeader
                title={isEdit ? 'Edit Kuesioner' : 'Buat Kuesioner Baru'}
                description="Kuesioner internal punya daftar pertanyaan di sini. Kuesioner eksternal memakai tautan ke layanan lain."
                actions={
                    <Button variant="ghost" href={route('kuesioner.index')}>
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                }
            />

            <form onSubmit={submit} className="space-y-5">
                <PageSection title="Detail Kuesioner" bodyClassName="space-y-4">
                    <FormField label="Judul" error={errors.judul} required>
                        <input className="input input-bordered min-h-11 w-full" value={data.judul} onChange={(e) => setData('judul', e.target.value)} required />
                    </FormField>
                    <FormField label="Deskripsi" error={errors.deskripsi}>
                        <textarea className="textarea textarea-bordered min-h-24 w-full" rows={3} value={data.deskripsi} onChange={(e) => setData('deskripsi', e.target.value)} />
                    </FormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField label="Tipe" error={errors.tipe} required>
                            <select className="select select-bordered min-h-11 w-full focus:select-primary" value={data.tipe} onChange={(e) => setData('tipe', e.target.value)}>
                                <option value="internal">Internal</option>
                                <option value="eksternal">Eksternal (tautan)</option>
                            </select>
                        </FormField>
                        <FormField label="Tanggal Mulai" error={errors.tanggal_mulai}>
                            <input type="date" className="input input-bordered min-h-11 w-full" value={data.tanggal_mulai} onChange={(e) => setData('tanggal_mulai', e.target.value)} />
                        </FormField>
                        <FormField label="Tanggal Selesai" error={errors.tanggal_selesai}>
                            <input type="date" className="input input-bordered min-h-11 w-full" value={data.tanggal_selesai} onChange={(e) => setData('tanggal_selesai', e.target.value)} />
                        </FormField>
                    </div>
                    {data.tipe === 'eksternal' && (
                        <FormField label="Link Eksternal" error={errors.link_eksternal}>
                            <input type="url" className="input input-bordered min-h-11 w-full" placeholder="https://forms.example.com/..." value={data.link_eksternal} onChange={(e) => setData('link_eksternal', e.target.value)} />
                        </FormField>
                    )}
                    <fieldset className="space-y-3 rounded-box border border-base-content/10 p-4">
                        <legend className="px-2 text-sm font-medium">Status</legend>
                        <label className="flex min-h-11 items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={data.is_active}
                                onChange={(e) => {
                                    setData('is_active', e.target.checked);
                                    if (!e.target.checked) setData('is_mandatory', false);
                                }}
                            />
                            <span className="text-sm">Aktif, dapat diakses responden</span>
                        </label>
                        <label className={`flex min-h-11 items-center gap-3 ${data.is_active ? '' : 'opacity-40'}`}>
                            <input type="checkbox" className="checkbox checkbox-primary" checked={data.is_mandatory} disabled={!data.is_active} onChange={(e) => setData('is_mandatory', e.target.checked)} />
                            <span className="text-sm">Wajib diisi sebelum responden mengakses menu lain</span>
                        </label>
                    </fieldset>
                </PageSection>

                <PageSection title="Target Responden" description="Pilih minimal satu peran yang menjadi target responden." bodyClassName="space-y-3">
                    {roles.length === 0 ? (
                        <p className="text-sm text-base-content/70">Peran belum tersedia.</p>
                    ) : (
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {roles.map((role) => (
                                <label key={role.id} className="flex min-h-11 items-center gap-2">
                                    <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={data.targets.includes(role.name)} onChange={(e) => toggleTarget(role.name, e.target.checked)} />
                                    <span className="text-sm capitalize">{role.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {errors.targets && <p className="text-sm text-error">{errors.targets}</p>}
                </PageSection>

                {data.tipe === 'internal' && (
                    <PageSection title="Pertanyaan" description={`${data.pertanyaan.length} pertanyaan.`} bodyClassName="space-y-4">
                        {data.pertanyaan.map((q, index) => (
                            <fieldset key={index} className="space-y-3 rounded-box border border-base-content/10 p-4">
                                <legend className="flex items-center gap-2 px-2 text-sm font-medium">
                                    Pertanyaan {index + 1}
                                    {data.pertanyaan.length > 1 && (
                                        <button type="button" className="btn btn-ghost btn-xs min-h-6 text-error" onClick={() => removeQuestion(index)}>
                                            <Trash2 className="h-3 w-3" /> Hapus
                                        </button>
                                    )}
                                </legend>
                                <FormField label="Pertanyaan" required>
                                    <input className="input input-bordered min-h-11 w-full" placeholder="Tulis pertanyaan" value={q.pertanyaan} onChange={(e) => updateQuestion(index, 'pertanyaan', e.target.value)} required />
                                </FormField>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <FormField label="Tipe Jawaban">
                                        <select className="select select-bordered min-h-11 w-full focus:select-primary" value={q.tipe_pertanyaan} onChange={(e) => updateQuestion(index, 'tipe_pertanyaan', e.target.value)}>
                                            {TIPE_PERTANYAAN.map((tipe) => (
                                                <option key={tipe.value} value={tipe.value}>{tipe.label}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <label className="flex min-h-11 items-end gap-2 pb-3">
                                        <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={q.wajib_diisi} onChange={(e) => updateQuestion(index, 'wajib_diisi', e.target.checked)} />
                                        <span className="text-sm">Wajib diisi</span>
                                    </label>
                                </div>
                                {(q.tipe_pertanyaan === 'radio' || q.tipe_pertanyaan === 'checkbox') && (
                                    <div className="space-y-2 border-l-2 border-base-content/10 pl-4">
                                        <p className="text-sm font-medium">Opsi Pilihan</p>
                                        {(q.opsi || []).length === 0 && <p className="text-sm text-base-content/60">Belum ada opsi.</p>}
                                        {(q.opsi || []).map((opt, opsiIndex) => (
                                            <div key={opsiIndex} className="flex items-center gap-2">
                                                <input className="input input-bordered min-h-11 w-full" placeholder={`Opsi ${opsiIndex + 1}`} value={opt} onChange={(e) => updateOpsi(index, opsiIndex, e.target.value)} />
                                                <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11 text-error" aria-label={`Hapus opsi ${opsiIndex + 1}`} onClick={() => removeOpsi(index, opsiIndex)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => addOpsi(index)}>
                                            <Plus className="h-4 w-4" /> Tambah Opsi
                                        </Button>
                                    </div>
                                )}
                            </fieldset>
                        ))}
                        <Button variant="ghost" onClick={addQuestion}>
                            <Plus className="h-4 w-4" /> Tambah Pertanyaan
                        </Button>
                    </PageSection>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" href={route('kuesioner.index')}>Batal</Button>
                    <Button type="submit" loading={processing}>{isEdit ? 'Perbarui' : 'Simpan'}</Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
