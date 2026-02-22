import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ kuesioner, can, hasSubmitted }) {
    return (
        <DashboardLayout>
            <Head title={kuesioner.judul} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Kuesioner
                    </h2>
                </div>
                <div className="p-6">
                            <h3 className="text-2xl font-bold mb-2">{kuesioner.judul}</h3>
                            <p className="text-gray-600 mb-4">{kuesioner.deskripsi}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <span className="font-bold">Tipe:</span> {kuesioner.tipe === 'internal' ? 'Internal' : 'Eksternal'}
                                </div>
                                <div>
                                    <span className="font-bold">Status:</span> {kuesioner.is_active ? 'Aktif' : 'Non-aktif'}
                                </div>
                                <div>
                                    <span className="font-bold">Periode:</span> {kuesioner.tanggal_mulai ? new Date(kuesioner.tanggal_mulai).toLocaleDateString() : '-'} s/d {kuesioner.tanggal_selesai ? new Date(kuesioner.tanggal_selesai).toLocaleDateString() : 'Seterusnya'}
                                </div>
                            </div>

                            {kuesioner.tipe === 'eksternal' && (
                                <div className="mb-6">
                                    <span className="font-bold">Link:</span> <a href={kuesioner.link_eksternal} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{kuesioner.link_eksternal}</a>
                                </div>
                            )}

                            {kuesioner.tipe === 'internal' && (
                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Daftar Pertanyaan</h4>
                                    <div className="space-y-4">
                                        {kuesioner.pertanyaan.map((q, index) => (
                                            <div key={q.id} className="border p-4 rounded bg-gray-50">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-gray-700">{index + 1}. {q.pertanyaan}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{q.tipe_pertanyaan}</span>
                                                </div>
                                                {q.wajib_diisi && <div className="text-xs text-red-500 mt-1">* Wajib diisi</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                                <Link href={route('kuesioner.index')} className="text-gray-600 hover:text-gray-900 mr-4 font-medium">
                                    Kembali
                                </Link>

                                {kuesioner.tipe === 'internal' && can.participate && !hasSubmitted && (
                                    <Link
                                        href={route('kuesioner.participate', kuesioner.id)}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150 ml-2"
                                    >
                                        Isi Kuesioner
                                    </Link>
                                )}

                                {hasSubmitted && kuesioner.tipe === 'internal' && (
                                    <span className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-200 rounded-md font-semibold text-xs text-green-800 uppercase tracking-widest ml-2">
                                        Sudah Diisi
                                    </span>
                                )}

                                {/* Assuming creator or admin can view results */}
                                <Link
                                    href={route('kuesioner.results', kuesioner.id)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150 ml-2"
                                >
                                    Lihat Hasil
                                </Link>

                                {kuesioner.tipe === 'eksternal' && (
                                    <a
                                        href={kuesioner.link_eksternal}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150 ml-2"
                                    >
                                        Buka Link
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
        </DashboardLayout>
    );
}
