import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';

const TABS = [
    { id: 'questions', label: 'Per Pertanyaan' },
    { id: 'respondents', label: 'Per Responden' },
];

export default function Results({ kuesioner, statistics, responden_count, responden_data }) {
    const [activeTab, setActiveTab] = useState('questions');

    return (
        <DashboardLayout>
            <Head title={`Hasil - ${kuesioner.judul}`} />
            <PageHeader
                title={`Hasil Kuesioner: ${kuesioner.judul}`}
                description={`${responden_count} responden.`}
                actions={
                    <Button href={route('kuesioner.export', kuesioner.id)} variant="success" target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Unduh Excel
                    </Button>
                }
            />

            <PageSection bodyClassName="space-y-5">
                <div role="tablist" className="tabs tabs-boxed w-full sm:w-auto" aria-label="Tampilan hasil">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab min-h-11 flex-1 sm:flex-none ${activeTab === tab.id ? 'tab-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'questions' ? (
                    <div className="space-y-6">
                        {statistics.map((stat, index) => (
                            <div key={index} className="border-b border-base-content/10 pb-6 last:border-b-0 last:pb-0">
                                <h3 className="mb-1 font-semibold">{index + 1}. {stat.pertanyaan}</h3>
                                <p className="mb-3 text-sm text-base-content/70">Tipe: {stat.tipe} · {stat.total_jawaban} jawaban</p>

                                {stat.counts ? (
                                    <div className="space-y-2">
                                        {Object.entries(stat.counts).map(([option, count]) => {
                                            const persen = responden_count ? Math.round((count / responden_count) * 100) : 0;
                                            return (
                                                <div key={option}>
                                                    <div className="mb-1 flex justify-between text-sm">
                                                        <span>{option}</span>
                                                        <span>{count} ({persen}%)</span>
                                                    </div>
                                                    <progress className="progress progress-primary h-2.5 w-full" value={persen} max="100" aria-label={`${option}: ${persen}%`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <ul className="max-h-60 list-disc space-y-2 overflow-y-auto rounded-box bg-base-200/50 p-4 pl-8">
                                        {(stat.answers ?? []).map((ans, i) => (
                                            <li key={i}>{ans}</li>
                                        ))}
                                        {stat.answers?.length === 0 && <li className="italic text-base-content/60">Belum ada jawaban teks.</li>}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {responden_data?.length > 0 ? (
                            responden_data.map((responseData, index) => (
                                <div key={index} className="rounded-box border border-base-content/10 bg-base-200/40 p-4">
                                    <div className="mb-4 flex flex-col gap-2 border-b border-base-content/10 pb-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{responseData.user}</h3>
                                            <p className="text-sm text-base-content/70">Dikirim pada: {responseData.tanggal}</p>
                                        </div>
                                        <StatusBadge tone="info" label={`Responden #${index + 1}`} />
                                    </div>
                                    <div className="space-y-3">
                                        {responseData.jawaban.map((ans, aIndex) => (
                                            <div key={aIndex} className="text-sm">
                                                <p className="mb-1 font-medium">{aIndex + 1}. {ans.pertanyaan}</p>
                                                <div className="border-l-2 border-base-content/20 pl-4">
                                                    {Array.isArray(ans.jawaban) ? (
                                                        <ul className="list-disc pl-4">
                                                            {ans.jawaban.map((item, i) => <li key={i}>{item}</li>)}
                                                        </ul>
                                                    ) : (
                                                        <p>{ans.jawaban || <span className="italic text-base-content/60">Tidak menjawab</span>}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-base-content/70">Belum ada responden yang mengisi kuesioner ini.</p>
                        )}
                    </div>
                )}
            </PageSection>
        </DashboardLayout>
    );
}
