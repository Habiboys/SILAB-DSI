import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';

const getOptTeks = (opt) => (typeof opt === 'object' && opt !== null ? opt.teks : opt);

export default function Partisipasi({ kuesioner }) {
    const { data, setData, post, processing, errors } = useForm({
        jawaban: kuesioner.pertanyaan.map((p) => ({
            pertanyaan_id: p.id,
            jawaban: p.tipe_pertanyaan === 'checkbox' ? [] : '',
        })),
    });

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...data.jawaban];
        newAnswers[index].jawaban = value;
        setData('jawaban', newAnswers);
    };

    const handleCheckboxChange = (index, optTeks, checked) => {
        const newAnswers = [...data.jawaban];
        const currentValues = Array.isArray(newAnswers[index].jawaban) ? newAnswers[index].jawaban : [];
        newAnswers[index].jawaban = checked ? [...currentValues, optTeks] : currentValues.filter((v) => v !== optTeks);
        setData('jawaban', newAnswers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kuesioner.submit', kuesioner.id));
    };

    return (
        <DashboardLayout>
            <Head title={`Isi Kuesioner - ${kuesioner.judul}`} />
            <div className="mx-auto max-w-3xl">
                <PageHeader
                    title={kuesioner.judul}
                    description={kuesioner.deskripsi}
                    actions={
                        <Button variant="ghost" href={route('kuesioner.show', kuesioner.id)}>
                            Batal
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-4">
                    {kuesioner.pertanyaan.map((q, index) => (
                        <PageSection key={q.id}>
                            <fieldset className="space-y-3">
                                <legend className="text-base font-medium">
                                    <span className="mr-1 text-base-content/50">{index + 1}.</span>
                                    {q.pertanyaan}
                                    {q.wajib_diisi && <span className="ml-1 text-error" aria-hidden="true">*</span>}
                                </legend>

                                {q.tipe_pertanyaan === 'text' && (
                                    <input
                                        type="text"
                                        value={data.jawaban[index].jawaban}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        className="input input-bordered min-h-11 w-full"
                                        placeholder="Jawaban Anda"
                                        required={!!q.wajib_diisi}
                                        aria-label={q.pertanyaan}
                                    />
                                )}

                                {q.tipe_pertanyaan === 'textarea' && (
                                    <textarea
                                        value={data.jawaban[index].jawaban}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        className="textarea textarea-bordered min-h-24 w-full"
                                        rows={4}
                                        placeholder="Jawaban Anda"
                                        required={!!q.wajib_diisi}
                                        aria-label={q.pertanyaan}
                                    />
                                )}

                                {q.tipe_pertanyaan === 'radio' && (
                                    q.opsi?.length > 0 ? (
                                        <div className="space-y-1">
                                            {q.opsi.map((opt, i) => {
                                                const teks = getOptTeks(opt);
                                                return (
                                                    <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name={`q_${q.id}`}
                                                            value={teks}
                                                            checked={data.jawaban[index].jawaban === teks}
                                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                            className="radio radio-primary"
                                                            required={!!q.wajib_diisi}
                                                        />
                                                        <span className="text-sm">{teks}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-error">Opsi tidak tersedia.</p>
                                    )
                                )}

                                {q.tipe_pertanyaan === 'checkbox' && (
                                    q.opsi?.length > 0 ? (
                                        <div className="space-y-1">
                                            {q.opsi.map((opt, i) => {
                                                const teks = getOptTeks(opt);
                                                const currentArr = Array.isArray(data.jawaban[index].jawaban) ? data.jawaban[index].jawaban : [];
                                                return (
                                                    <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-primary"
                                                            value={teks}
                                                            checked={currentArr.includes(teks)}
                                                            onChange={(e) => handleCheckboxChange(index, teks, e.target.checked)}
                                                        />
                                                        <span className="text-sm">{teks}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-error">Opsi tidak tersedia.</p>
                                    )
                                )}

                                {q.tipe_pertanyaan === 'scale' && (
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <span className="text-xs text-base-content/60">Tidak Setuju</span>
                                        {[1, 2, 3, 4, 5].map((nu) => (
                                            <label key={nu} className="flex min-h-11 cursor-pointer flex-col items-center gap-1">
                                                <input
                                                    type="radio"
                                                    className="radio radio-primary"
                                                    name={`question_${q.id}`}
                                                    value={nu}
                                                    checked={parseInt(data.jawaban[index].jawaban) === nu}
                                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                    required={!!q.wajib_diisi}
                                                />
                                                <span className="text-sm font-semibold">{nu}</span>
                                            </label>
                                        ))}
                                        <span className="text-xs text-base-content/60">Sangat Setuju</span>
                                    </div>
                                )}

                                {errors[`jawaban.${index}.jawaban`] && (
                                    <p className="text-sm text-error">{errors[`jawaban.${index}.jawaban`]}</p>
                                )}
                            </fieldset>
                        </PageSection>
                    ))}

                    <PageSection bodyClassName="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="ghost" href={route('kuesioner.show', kuesioner.id)}>Batal</Button>
                        <Button type="submit" loading={processing}>
                            <Send className="h-4 w-4" /> Kirim Jawaban
                        </Button>
                    </PageSection>
                </form>
            </div>
        </DashboardLayout>
    );
}
