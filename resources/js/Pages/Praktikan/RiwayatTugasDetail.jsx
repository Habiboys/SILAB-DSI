import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Download, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';

const STATUS_TONE = { dikumpulkan: 'info', dinilai: 'success', terlambat: 'error' };

export default function RiwayatTugasDetail({ riwayat }) {
    const [showPdf, setShowPdf] = useState(false);
    const [lampiranSearchQuery, setLampiranSearchQuery] = useState('');

    if (!riwayat) {
        return (
            <DashboardLayout>
                <PageHeader title="Detail Pengumpulan Tugas" />
                <PageSection>
                    <p className="py-8 text-center text-base-content/70">Data riwayat tidak ditemukan.</p>
                </PageSection>
            </DashboardLayout>
        );
    }

    const { tugasPraktikum } = riwayat;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderFiles = (filePengumpulan, searchQuery = '') => {
        if (!filePengumpulan) return <p className="text-sm italic text-base-content/60">Tidak ada file yang dilampirkan.</p>;

        const normalizedItems = [];

        try {
            const submissionData = JSON.parse(filePengumpulan);
            if (Array.isArray(submissionData) && submissionData.length > 0) {
                if (typeof submissionData[0] === 'object' && submissionData[0].type) {
                    submissionData.forEach((item, index) => {
                        if (item.type === 'file') {
                            normalizedItems.push({ type: 'file', title: item.original_name || `File Lampiran ${index + 1}`, path: item.data || item.path || '' });
                        } else if (item.type === 'link') {
                            normalizedItems.push({ type: 'link', title: item.original_name || 'Tautan Eksternal', url: item.data || '' });
                        }
                    });
                } else {
                    submissionData.forEach((value, index) => {
                        if (typeof value !== 'string') return;
                        if (value.startsWith('http://') || value.startsWith('https://')) {
                            normalizedItems.push({ type: 'link', title: `Tautan ${index + 1}`, url: value });
                        } else {
                            normalizedItems.push({ type: 'file', title: `File Lampiran ${index + 1}`, path: value });
                        }
                    });
                }
            }
        } catch {
            normalizedItems.push({ type: 'file', title: 'Berkas Tugas', path: filePengumpulan });
        }

        const q = searchQuery.trim().toLowerCase();
        const filteredItems = !q
            ? normalizedItems
            : normalizedItems.filter((item) => `${item.title || ''} ${item.path || ''} ${item.url || ''}`.toLowerCase().includes(q));

        if (filteredItems.length === 0) {
            return <p className="text-sm italic text-base-content/60">Tidak ada lampiran yang cocok dengan pencarian.</p>;
        }

        return (
            <ul className="space-y-2">
                {filteredItems.map((item, index) =>
                    item.type === 'link' ? (
                        <li key={`link-${index}`} className="flex flex-col gap-3 rounded-box border border-base-content/10 bg-base-200/40 p-3 sm:flex-row sm:items-center">
                            <ExternalLink className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.title || 'Tautan Eksternal'}</p>
                                <p className="truncate text-xs text-base-content/70">{item.url}</p>
                            </div>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-success min-h-11 btn-sm">
                                <ExternalLink className="h-4 w-4" /> Buka Link
                            </a>
                        </li>
                    ) : (
                        <li key={`file-${index}`} className="flex flex-col gap-3 rounded-box border border-base-content/10 bg-base-200/40 p-3 sm:flex-row sm:items-center">
                            <FileText className="h-5 w-5 shrink-0 text-info" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.title || 'File Lampiran'}</p>
                            </div>
                            <a
                                href={`/praktikum/pengumpulan/download/${encodeURIComponent((item.path || '').split('/').pop() || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost min-h-11 btn-sm"
                            >
                                <Download className="h-4 w-4" /> Unduh
                            </a>
                        </li>
                    ),
                )}
            </ul>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Detail Pengumpulan Tugas" />
            <PageHeader
                title={tugasPraktikum?.judul_tugas || 'Detail Pengumpulan Tugas'}
                description={tugasPraktikum?.praktikum?.mata_kuliah || 'Praktikum'}
                actions={
                    <>
                        <StatusBadge status={riwayat.status} tone={STATUS_TONE[riwayat.status] ?? 'neutral'} label={String(riwayat.status || '-').replaceAll('_', ' ')} />
                        <Button variant="ghost" href={route('praktikan.riwayat')}>
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Button>
                    </>
                }
            />

            <div className="space-y-5">
                <PageSection title="Detail Tugas" bodyClassName="space-y-5">
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
                            <dt className="text-base-content/70">Tenggat:</dt>
                            <dd className="font-medium">{formatDate(tugasPraktikum?.deadline)}</dd>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
                            <dt className="text-base-content/70">Dikumpulkan:</dt>
                            <dd className="font-medium">{formatDate(riwayat.submitted_at)}</dd>
                        </div>
                    </dl>

                    <div>
                        <p className="mb-2 text-sm font-medium">Deskripsi Tugas</p>
                        {tugasPraktikum?.deskripsi ? (
                            <p className="whitespace-pre-wrap rounded-box border border-base-content/10 bg-base-200/40 p-4 text-sm leading-relaxed">{tugasPraktikum.deskripsi}</p>
                        ) : (
                            <p className="text-sm italic text-base-content/60">Tidak ada deskripsi.</p>
                        )}
                    </div>

                    {tugasPraktikum?.file_tugas && (
                        <div className="space-y-3 border-t border-base-content/10 pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">File Instruksi / Soal</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowPdf(!showPdf)}>
                                        {showPdf ? 'Sembunyikan' : 'Lihat PDF'}
                                    </Button>
                                    <a
                                        href={route('praktikum.tugas.download', { tugas: tugasPraktikum.id })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost min-h-11 btn-sm"
                                    >
                                        <Download className="h-4 w-4" /> Unduh
                                    </a>
                                </div>
                            </div>
                            {showPdf && (
                                <iframe
                                    src={route('praktikum.tugas.download', { tugas: tugasPraktikum.id })}
                                    className="h-[520px] w-full rounded-box border border-base-content/10"
                                    title="File Instruksi"
                                />
                            )}
                        </div>
                    )}
                </PageSection>

                <PageSection title="File / Lampiran Pengumpulan" bodyClassName="space-y-4">
                    <label className="form-control w-full sm:max-w-sm">
                        <span className="label"><span className="label-text">Pencarian</span></span>
                        <input
                            type="search"
                            placeholder="Cari file atau tautan lampiran..."
                            value={lampiranSearchQuery}
                            onChange={(e) => setLampiranSearchQuery(e.target.value)}
                            className="input input-bordered min-h-11 w-full"
                        />
                    </label>
                    {renderFiles(riwayat.file_pengumpulan, lampiranSearchQuery)}
                    {riwayat.catatan && (
                        <div className="space-y-2 border-t border-base-content/10 pt-4">
                            <p className="text-sm font-medium text-base-content/70">Catatan ke Asisten</p>
                            <p className="whitespace-pre-wrap rounded-box border border-base-content/10 bg-base-200/40 p-4 text-sm">{riwayat.catatan}</p>
                        </div>
                    )}
                </PageSection>

                <PageSection title="Hasil Penilaian">
                    {riwayat.status === 'dinilai' ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between rounded-box border border-base-content/10 bg-base-200/40 p-4">
                                <span className="text-sm font-medium text-base-content/70">Nilai Akhir</span>
                                <span className="text-3xl font-bold">{parseFloat(riwayat.total_nilai_with_bonus).toFixed(1)}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-base-content/70">Nilai Dasar (Rubrik)</span>
                                    <span className="font-semibold">{parseFloat(riwayat.nilai || 0).toFixed(1)}</span>
                                </div>
                                {riwayat.total_nilai_tambahan > 0 && (
                                    <div className="flex items-center justify-between text-sm text-info">
                                        <span>Total Bonus</span>
                                        <span className="font-bold">+{parseFloat(riwayat.total_nilai_tambahan).toFixed(1)}</span>
                                    </div>
                                )}
                                {riwayat.detail_nilai_tambahan?.length > 0 && (
                                    <div className="space-y-2 rounded-box border border-base-content/10 bg-base-200/40 p-3 text-xs">
                                        {riwayat.detail_nilai_tambahan.map((bonus, i) => (
                                            <div key={i} className="flex justify-between text-base-content/70">
                                                <span className="italic">{bonus.keterangan || 'Nilai tambahan'}</span>
                                                <span className="font-semibold text-info">+{parseFloat(bonus.nilai).toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 border-t border-base-content/10 pt-4">
                                <p className="text-sm font-medium">Catatan Asisten / Dosen</p>
                                {riwayat.feedback ? (
                                    <p className="whitespace-pre-wrap rounded-box border border-base-content/10 bg-base-200/40 p-4 text-sm leading-relaxed">{riwayat.feedback}</p>
                                ) : (
                                    <p className="rounded-box border border-base-content/10 bg-base-200/40 p-4 text-center text-sm italic text-base-content/60">Tidak ada catatan.</p>
                                )}
                            </div>

                            {riwayat.dinilai_at && <p className="text-center text-xs text-base-content/60">Dinilai pada: {formatDate(riwayat.dinilai_at)}</p>}
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <Clock className="mx-auto mb-3 h-10 w-10 text-base-content/30" aria-hidden="true" />
                            <p className="text-sm font-medium">Belum Dinilai</p>
                            <p className="mt-1 text-sm text-base-content/60">Tugas sudah diterima, menunggu proses penilaian.</p>
                        </div>
                    )}
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
