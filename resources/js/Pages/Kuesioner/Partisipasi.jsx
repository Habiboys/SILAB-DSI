import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Partisipasi({ kuesioner }) {
    const { data, setData, post, processing, errors } = useForm({
        jawaban: kuesioner.pertanyaan.map(p => ({
            pertanyaan_id: p.id,
            jawaban: p.tipe_pertanyaan === 'checkbox' ? [] : ''
        }))
    });

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...data.jawaban];
        newAnswers[index].jawaban = value;
        setData('jawaban', newAnswers);
    };

    // opt is a string (opt.teks extracted before calling this)
    const handleCheckboxChange = (index, optTeks, checked) => {
        const newAnswers = [...data.jawaban];
        let currentValues = Array.isArray(newAnswers[index].jawaban) ? newAnswers[index].jawaban : [];

        newAnswers[index].jawaban = checked
            ? [...currentValues, optTeks]
            : currentValues.filter(v => v !== optTeks);

        setData('jawaban', newAnswers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kuesioner.submit', kuesioner.id));
    };

    // opsi bisa berupa array string atau array object {teks, ...}
    const getOptTeks = (opt) => (typeof opt === 'object' && opt !== null ? opt.teks : opt);

    return (
        <DashboardLayout>
            <Head title={`Isi Kuesioner – ${kuesioner.judul}`} />

            <div className="max-w-3xl mx-auto">
                {/* Header card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-5">
                    <div className="p-6 border-b border-gray-100">
                        <Link
                            href={route('kuesioner.show', kuesioner.id)}
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                        >
                            &larr; Kembali ke detail
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">{kuesioner.judul}</h1>
                        {kuesioner.deskripsi && (
                            <p className="text-sm text-gray-500 mt-1">{kuesioner.deskripsi}</p>
                        )}
                    </div>
                </div>

                {/* Questions */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {kuesioner.pertanyaan.map((q, index) => (
                        <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <label className="block text-gray-800 font-medium mb-3">
                                <span className="text-gray-400 font-normal mr-1">{index + 1}.</span>
                                {q.pertanyaan}
                                {q.wajib_diisi && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {q.tipe_pertanyaan === 'text' && (
                                <input
                                    type="text"
                                    value={data.jawaban[index].jawaban}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Jawaban Anda…"
                                    required={!!q.wajib_diisi}
                                />
                            )}

                            {q.tipe_pertanyaan === 'textarea' && (
                                <textarea
                                    value={data.jawaban[index].jawaban}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Jawaban Anda…"
                                    required={!!q.wajib_diisi}
                                />
                            )}

                            {q.tipe_pertanyaan === 'radio' && (
                                q.opsi && q.opsi.length > 0 ? (
                                    <div className="space-y-2">
                                        {q.opsi.map((opt, i) => {
                                            const teks = getOptTeks(opt);
                                            return (
                                                <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name={`q_${q.id}`}
                                                        value={teks}
                                                        checked={data.jawaban[index].jawaban === teks}
                                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        required={!!q.wajib_diisi}
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{teks}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500">Opsi tidak tersedia.</p>
                                )
                            )}

                            {q.tipe_pertanyaan === 'checkbox' && (
                                q.opsi && q.opsi.length > 0 ? (
                                    <div className="space-y-2">
                                        {q.opsi.map((opt, i) => {
                                            const teks = getOptTeks(opt);
                                            const currentArr = Array.isArray(data.jawaban[index].jawaban) ? data.jawaban[index].jawaban : [];
                                            return (
                                                <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        value={teks}
                                                        checked={currentArr.includes(teks)}
                                                        onChange={(e) => handleCheckboxChange(index, teks, e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{teks}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500">Opsi tidak tersedia.</p>
                                )
                            )}

                            {q.tipe_pertanyaan === 'scale' && (
                                <div className="flex flex-wrap items-center gap-6 mt-1">
                                    <span className="text-xs text-gray-400">Tidak Setuju</span>
                                    {[1, 2, 3, 4, 5].map(nu => (
                                        <label key={nu} className="flex flex-col items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`question_${q.id}`}
                                                value={nu}
                                                checked={parseInt(data.jawaban[index].jawaban) === nu}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                required={!!q.wajib_diisi}
                                            />
                                            <span className="text-sm font-semibold text-gray-600">{nu}</span>
                                        </label>
                                    ))}
                                    <span className="text-xs text-gray-400">Sangat Setuju</span>
                                </div>
                            )}

                            {errors[`jawaban.${index}.jawaban`] && (
                                <p className="text-red-500 text-xs mt-2">{errors[`jawaban.${index}.jawaban`]}</p>
                            )}
                        </div>
                    ))}

                    {/* Submit */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                        <Link
                            href={route('kuesioner.show', kuesioner.id)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            &larr; Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                        >
                            {processing ? 'Mengirim…' : 'Kirim Jawaban'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
