import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ClipboardList, ExternalLink, Pencil, TableProperties } from 'lucide-react';

function InfoRow({ label, children }) {
    return (
        <div className="grid grid-cols-1 gap-1 border-b border-base-content/10 py-2 last:border-0 sm:grid-cols-5 sm:gap-2">
            <dt className="text-sm font-medium text-base-content/70 sm:col-span-2">{label}</dt>
            <dd className="text-sm sm:col-span-3">{children}</dd>
        </div>
    );
}

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

const TIPE_LABEL = { text: 'Teks Singkat', textarea: 'Teks Panjang', radio: 'Pilihan Ganda', checkbox: 'Kotak Centang', scale: 'Skala 1-5' };

export default function Show({ kuesioner, can, hasSubmitted }) {
    return (
        <DashboardLayout>
            <Head title={kuesioner.judul} />
            <PageHeader
                title={kuesioner.judul}
                description={kuesioner.deskripsi}
                actions={
                    <>
                        <Button variant="ghost" href={route('kuesioner.index')}>
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Button>
                        {can?.edit && (
                            <Button variant="ghost" href={route('kuesioner.edit', kuesioner.id)}>
                                <Pencil className="h-4 w-4" /> Edit
                            </Button>
                        )}
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    <PageSection title="Detail Kuesioner">
                        <dl>
                            <InfoRow label="Status">
                                <StatusBadge status={kuesioner.is_active ? 'aktif' : 'nonaktif'} label={kuesioner.is_active ? 'Aktif' : 'Nonaktif'} />
                            </InfoRow>
                            <InfoRow label="Tipe">
                                <StatusBadge tone={kuesioner.tipe === 'internal' ? 'success' : 'info'} label={kuesioner.tipe === 'internal' ? 'Internal' : 'Eksternal'} />
                            </InfoRow>
                            <InfoRow label="Periode">
                                {kuesioner.tanggal_mulai ? (
                                    <>{fmtDate(kuesioner.tanggal_mulai)} sampai {kuesioner.tanggal_selesai ? fmtDate(kuesioner.tanggal_selesai) : 'seterusnya'}</>
                                ) : (
                                    <span className="text-base-content/50">Tidak dibatasi</span>
                                )}
                            </InfoRow>
                            {kuesioner.tipe === 'eksternal' && kuesioner.link_eksternal && (
                                <InfoRow label="Link Eksternal">
                                    <a href={kuesioner.link_eksternal} target="_blank" rel="noopener noreferrer" className="link link-info inline-flex items-center gap-1 text-sm">
                                        {kuesioner.link_eksternal}
                                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                    </a>
                                </InfoRow>
                            )}
                            {kuesioner.pembuat && <InfoRow label="Dibuat Oleh">{kuesioner.pembuat.name}</InfoRow>}
                        </dl>
                    </PageSection>

                    {kuesioner.tipe === 'internal' && kuesioner.pertanyaan?.length > 0 && (
                        <PageSection title="Daftar Pertanyaan" description={`${kuesioner.pertanyaan.length} pertanyaan.`} bodyClassName="p-0 sm:p-0">
                            <ul className="divide-y divide-base-content/10">
                                {kuesioner.pertanyaan.map((q, index) => (
                                    <li key={q.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                                        <span className="mt-0.5 w-5 shrink-0 text-right text-sm font-medium text-base-content/50">{index + 1}.</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">{q.pertanyaan}</p>
                                            {q.wajib_diisi && <span className="text-xs text-error">Wajib diisi</span>}
                                        </div>
                                        <StatusBadge tone="neutral" label={TIPE_LABEL[q.tipe_pertanyaan] ?? q.tipe_pertanyaan} />
                                    </li>
                                ))}
                            </ul>
                        </PageSection>
                    )}
                </div>

                <PageSection title="Aksi">
                    <div className="flex flex-col gap-2.5">
                        {kuesioner.tipe === 'internal' && can?.participate && !hasSubmitted && (
                            <Button href={route('kuesioner.participate', kuesioner.id)}>
                                <ClipboardList className="h-4 w-4" /> Isi Kuesioner
                            </Button>
                        )}
                        {hasSubmitted && kuesioner.tipe === 'internal' && (
                            <StatusBadge status="selesai" label="Sudah Diisi" className="justify-center py-2" />
                        )}
                        {kuesioner.tipe === 'eksternal' && kuesioner.link_eksternal && (
                            <a
                                href={kuesioner.link_eksternal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary min-h-11"
                            >
                                <ExternalLink className="h-4 w-4" /> Buka Link
                            </a>
                        )}
                        <Button variant="ghost" href={route('kuesioner.results', kuesioner.id)}>
                            <TableProperties className="h-4 w-4" /> Lihat Hasil Respons
                        </Button>
                        {hasSubmitted && (
                            <p className="flex items-center gap-2 text-sm text-base-content/70">
                                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" /> Jawaban Anda sudah tersimpan.
                            </p>
                        )}
                    </div>
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
