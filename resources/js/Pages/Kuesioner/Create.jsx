import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ roles = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        judul: '',
        deskripsi: '',
        tipe: 'internal', // internal or eksternal
        link_eksternal: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        is_active: true,
        is_mandatory: false,
        pertanyaan: [
            { pertanyaan: '', tipe_pertanyaan: 'text', wajib_diisi: false, opsi: [] }
        ],
        targets: []
    });

    const addQuestion = () => {
        setData('pertanyaan', [
            ...data.pertanyaan,
            { pertanyaan: '', tipe_pertanyaan: 'text', wajib_diisi: false, opsi: [] }
        ]);
    };

    const removeQuestion = (index) => {
        const newQuestions = [...data.pertanyaan];
        newQuestions.splice(index, 1);
        setData('pertanyaan', newQuestions);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...data.pertanyaan];
        newQuestions[index][field] = value;
        setData('pertanyaan', newQuestions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kuesioner.store'));
    };

    return (
        <DashboardLayout>
            <Head title="Buat Kuesioner" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Buat Kuesioner Baru
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Judul</label>
                            <input
                                type="text"
                                value={data.judul}
                                onChange={(e) => setData('judul', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.judul && <div className="text-red-500 text-xs italic mt-1">{errors.judul}</div>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Deskripsi</label>
                            <textarea
                                value={data.deskripsi}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Tipe</label>
                            <select
                                value={data.tipe}
                                onChange={(e) => setData('tipe', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="internal">Internal</option>
                                <option value="eksternal">Eksternal (Link)</option>
                            </select>
                        </div>

                        {data.tipe === 'eksternal' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Link Eksternal</label>
                                <input
                                    type="url"
                                    value={data.link_eksternal}
                                    onChange={(e) => setData('link_eksternal', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://google-form.com/..."
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">Tanggal Selesai</label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {data.tipe === 'internal' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Pertanyaan</h3>
                                {data.pertanyaan.map((q, index) => (
                                    <div key={index} className="border p-4 rounded mb-2 bg-gray-50">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold">Pertanyaan {index + 1}</span>
                                            <button type="button" onClick={() => removeQuestion(index)} className="text-red-500 text-sm hover:text-red-700">Hapus</button>
                                        </div>
                                        <div className="mb-2">
                                            <input
                                                type="text"
                                                value={q.pertanyaan}
                                                onChange={(e) => updateQuestion(index, 'pertanyaan', e.target.value)}
                                                placeholder="Tulis pertanyaan..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                                            />
                                        </div>
                                        <div className="flex gap-4 mb-4">
                                            <select
                                                value={q.tipe_pertanyaan}
                                                onChange={(e) => updateQuestion(index, 'tipe_pertanyaan', e.target.value)}
                                                className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="text">Text Singkat</option>
                                                <option value="textarea">Text Panjang</option>
                                                <option value="radio">Pilihan Ganda</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="scale">Skala 1-5</option>
                                            </select>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={q.wajib_diisi}
                                                    onChange={(e) => updateQuestion(index, 'wajib_diisi', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                                                />
                                                <span className="text-sm text-gray-700">Wajib Diisi</span>
                                            </label>
                                        </div>

                                        {/* Option Builder for Radio and Checkbox */}
                                        {(q.tipe_pertanyaan === 'radio' || q.tipe_pertanyaan === 'checkbox') && (
                                            <div className="ml-4 pl-4 border-l-2 border-gray-200">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Opsi Pilihan:</label>
                                                {(!q.opsi || q.opsi.length === 0) && (
                                                    <p className="text-sm text-gray-500 italic mb-2">Belum ada opsi.</p>
                                                )}
                                                {(q.opsi || []).map((opt, oIndex) => (
                                                    <div key={oIndex} className="flex items-center mb-2">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuestions = [...data.pertanyaan];
                                                                if (!newQuestions[index].opsi) newQuestions[index].opsi = [];
                                                                newQuestions[index].opsi[oIndex] = e.target.value;
                                                                setData('pertanyaan', newQuestions);
                                                            }}
                                                            placeholder={`Opsi ${oIndex + 1}`}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newQuestions = [...data.pertanyaan];
                                                                newQuestions[index].opsi.splice(oIndex, 1);
                                                                setData('pertanyaan', newQuestions);
                                                            }}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQuestions = [...data.pertanyaan];
                                                        if (!newQuestions[index].opsi) newQuestions[index].opsi = [];
                                                        newQuestions[index].opsi.push('');
                                                        setData('pertanyaan', newQuestions);
                                                    }}
                                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    + Tambah Opsi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addQuestion} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm mt-2 transition-colors">
                                    + Tambah Pertanyaan
                                </button>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Target Responden (Opsional)</label>
                            <p className="text-xs text-gray-500 mb-2">Jika kosong, kuesioner akan terbuka untuk semua user. Pilih role spesifik jika ingin membatasi.</p>
                            <div className="flex flex-wrap gap-4">
                                {roles.length > 0 ? (
                                    roles.map((role) => (
                                        <label key={role.id} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                value={role.name}
                                                checked={data.targets.includes(role.name)}
                                                onChange={(e) => {
                                                    const current = data.targets || [];
                                                    if (e.target.checked) {
                                                        setData('targets', [...current, role.name]);
                                                    } else {
                                                        setData('targets', current.filter(t => t !== role.name));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 capitalize text-gray-700">{role.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Memuat roles...</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end mt-4">
                            <Link href={route('kuesioner.index')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-4 transition-colors">Batal</Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
