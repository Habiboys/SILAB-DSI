import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, ClipboardList, ExternalLink } from 'lucide-react';

function InfoRow({ label, children }) {
    return (
        <div className="grid grid-cols-5 gap-2 py-2 border-b border-gray-50 last:border-0">
            <dt className="col-span-2 text-sm text-gray-500 font-medium">{label}</dt>
            <dd className="col-span-3 text-sm text-gray-800">{children}</dd>
        </div>
    );
}

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

export default function Show({ kuesioner, can, hasSubmitted }) {
    return (
        <DashboardLayout>
            <Head title={kuesioner.judul} />

            {/* Back */}
            <Link
                href={route('kuesioner.index')}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
                &larr; Kembali ke daftar
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Info card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{kuesioner.judul}</h1>
                                {kuesioner.deskripsi && (
                                    <p className="text-sm text-gray-500 mt-1">{kuesioner.deskripsi}</p>
                                )}
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${kuesioner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {kuesioner.is_active ? 'Aktif' : 'Non-aktif'}
                            </span>
                        </div>
                        <div className="p-5">
                            <dl>
                                <InfoRow label="Tipe">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${kuesioner.tipe === 'internal' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {kuesioner.tipe === 'internal' ? 'Internal' : 'Eksternal'}
                                    </span>
                                </InfoRow>
                                <InfoRow label="Periode">
                                    {kuesioner.tanggal_mulai
                                        ? <>{fmtDate(kuesioner.tanggal_mulai)} — {kuesioner.tanggal_selesai ? fmtDate(kuesioner.tanggal_selesai) : 'Seterusnya'}</>
                                        : <span className="text-gray-400">Tidak dibatasi</span>
                                    }
                                </InfoRow>
                                {kuesioner.tipe === 'eksternal' && kuesioner.link_eksternal && (
                                    <InfoRow label="Link Eksternal">
                                        <a href={kuesioner.link_eksternal} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm">
                                            {kuesioner.link_eksternal}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </InfoRow>
                                )}
                                {kuesioner.pembuat && (
                                    <InfoRow label="Dibuat Oleh">{kuesioner.pembuat.name}</InfoRow>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Questions preview */}
                    {kuesioner.tipe === 'internal' && kuesioner.pertanyaan?.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800">
                                    Daftar Pertanyaan
                                    <span className="ml-2 text-sm font-normal text-gray-400">({kuesioner.pertanyaan.length} pertanyaan)</span>
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {kuesioner.pertanyaan.map((q, index) => (
                                    <div key={q.id} className="px-5 py-3.5 flex items-start gap-3">
                                        <span className="shrink-0 text-sm font-medium text-gray-400 w-5 text-right mt-0.5">{index + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800">{q.pertanyaan}</p>
                                            {q.wajib_diisi && (
                                                <span className="text-xs text-red-500">* Wajib diisi</span>
                                            )}
                                        </div>
                                        <span className="shrink-0 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                                            {q.tipe_pertanyaan}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar actions */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-800 mb-4">Aksi</h3>
                        <div className="flex flex-col gap-2.5">
                            {/* Isi Kuesioner */}
                            {kuesioner.tipe === 'internal' && can?.participate && !hasSubmitted && (
                                <Link
                                    href={route('kuesioner.participate', kuesioner.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    Isi Kuesioner
                                </Link>
                            )}

                            {/* Sudah diisi */}
                            {hasSubmitted && kuesioner.tipe === 'internal' && (
                                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-md">
                                    <CheckCircle className="h-4 w-4" />
                                    Sudah Diisi
                                </div>
                            )}

                            {/* Buka Link (eksternal) */}
                            {kuesioner.tipe === 'eksternal' && kuesioner.link_eksternal && (
                                <a
                                    href={kuesioner.link_eksternal}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Buka Link
                                </a>
                            )}

                            {/* Lihat Hasil */}
                            <Link
                                href={route('kuesioner.results', kuesioner.id)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Lihat Hasil Respons
                            </Link>

                            {/* Edit */}
                            {can?.edit && (
                                <Link
                                    href={route('kuesioner.edit', kuesioner.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Edit Kuesioner
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
