import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';

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

    const handleCheckboxChange = (index, option, checked) => {
        const newAnswers = [...data.jawaban];
        let currentValues = newAnswers[index].jawaban || [];

        // Ensure currentValues is an array
        if (!Array.isArray(currentValues)) {
            currentValues = [];
        }

        if (checked) {
            currentValues = [...currentValues, option];
        } else {
            currentValues = currentValues.filter(v => v !== option);
        }

        newAnswers[index].jawaban = currentValues;
        setData('jawaban', newAnswers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kuesioner.submit', kuesioner.id));
    };

    return (
        <DashboardLayout>
            <Head title={`Partisipasi - ${kuesioner.judul}`} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-7xl mx-auto my-4">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {kuesioner.judul}
                    </h2>
                    <p className="text-gray-500 mt-1">{kuesioner.deskripsi}</p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {kuesioner.pertanyaan.map((q, index) => (
                            <div key={q.id} className="mb-8 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                <label className="block text-gray-800 font-medium text-lg mb-3">
                                    {index + 1}. {q.pertanyaan}
                                    {q.wajib_diisi && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {q.tipe_pertanyaan === 'text' && (
                                    <input
                                        type="text"
                                        value={data.jawaban[index].jawaban}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Jawaban Anda..."
                                        required={!!q.wajib_diisi}
                                    />
                                )}

                                {q.tipe_pertanyaan === 'textarea' && (
                                    <textarea
                                        value={data.jawaban[index].jawaban}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={4}
                                        placeholder="Jawaban Anda..."
                                        required={!!q.wajib_diisi}
                                    />
                                )}

                                {q.tipe_pertanyaan === 'radio' && q.opsi && (
                                    <div className="space-y-2 ml-1">
                                        {q.opsi.map((opt, i) => (
                                            <label key={i} className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`q_${q.id}`}
                                                    value={opt}
                                                    checked={data.jawaban[index].jawaban === opt}
                                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    required={!!q.wajib_diisi}
                                                />
                                                <span className="ml-2 text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.tipe_pertanyaan === 'checkbox' && q.opsi && (
                                    <div className="space-y-2 ml-1">
                                        {q.opsi.map((opt, i) => (
                                            <label key={i} className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={opt}
                                                    checked={Array.isArray(data.jawaban[index].jawaban) && data.jawaban[index].jawaban.includes(opt)}
                                                    onChange={(e) => handleCheckboxChange(index, opt, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.tipe_pertanyaan === 'scale' && (
                                    <div className="flex flex-wrap items-center gap-4 ml-1">
                                        {[1, 2, 3, 4, 5].map(nu => (
                                            <label key={nu} className="flex flex-col items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`question_${q.id}`}
                                                    value={nu}
                                                    checked={parseInt(data.jawaban[index].jawaban) === nu}
                                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mb-1"
                                                    required={!!q.wajib_diisi}
                                                />
                                                <span className="text-sm text-gray-600 font-medium">{nu}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                
                                {q.tipe_pertanyaan === 'radio' && !q.opsi && (
                                    <p className="text-red-500 text-sm">Opsi tidak tersedia.</p>
                                )}
                                {q.tipe_pertanyaan === 'checkbox' && !q.opsi && (
                                    <p className="text-red-500 text-sm">Opsi tidak tersedia.</p>
                                )}
                            </div>
                        ))}

                        <div className="flex items-center justify-end mt-8 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Mengirim...' : 'Kirim Jawaban'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
