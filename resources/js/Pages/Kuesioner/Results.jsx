import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Results({ kuesioner, statistics, responden_count, responden_data }) {
    const [activeTab, setActiveTab] = useState('questions'); // questions or respondents

    return (
        <DashboardLayout>
            <Head title={`Hasil - ${kuesioner.judul}`} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Hasil Kuesioner: {kuesioner.judul}
                        </h2>
                        <div className="text-gray-600 text-sm mt-1">
                            Total Responden: <span className="font-bold text-gray-900">{responden_count}</span>
                        </div>
                    </div>
                    <a
                        href={route('kuesioner.export', kuesioner.id)}
                        target="_blank"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm transition-colors"
                    >
                        <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                        </svg>
                        <span>Download Excel</span>
                    </a>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`${
                                activeTab === 'questions'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors`}
                        >
                            Per Pertanyaan
                        </button>
                        <button
                            onClick={() => setActiveTab('respondents')}
                            className={`${
                                activeTab === 'respondents'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors`}
                        >
                            Per Responden
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'questions' ? (
                        <div className="space-y-8">
                            {statistics.map((stat, index) => (
                                <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0">
                                    <h3 className="text-lg font-bold mb-4">{index + 1}. {stat.pertanyaan}</h3>

                                    <div className="text-sm text-gray-500 mb-2">Tipe: {stat.tipe} | Total Jawaban: {stat.total_jawaban}</div>

                                    {stat.counts ? (
                                        <div className="mt-4">
                                            {Object.entries(stat.counts).map(([option, count]) => (
                                                <div key={option} className="mb-2">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>{option}</span>
                                                        <span>{count} ({Math.round(count / responden_count * 100)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-blue-600 h-2.5 rounded-full"
                                                            style={{ width: `${(count / responden_count * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                                            <ul className="list-disc pl-5 space-y-2">
                                                {stat.answers.map((ans, i) => (
                                                    <li key={i} className="text-gray-700">{ans}</li>
                                                ))}
                                                {stat.answers.length === 0 && <li className="text-gray-400 italic">Belum ada jawaban text.</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {responden_data && responden_data.length > 0 ? (
                                responden_data.map((responseData, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{responseData.user}</h3>
                                                <p className="text-sm text-gray-500">Dikirim pada: {responseData.tanggal}</p>
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">Responden #{index + 1}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {responseData.jawaban.map((ans, aIndex) => (
                                                <div key={aIndex} className="text-sm">
                                                    <p className="font-medium text-gray-700 mb-1">{aIndex + 1}. {ans.pertanyaan}</p>
                                                    <div className="pl-4 border-l-2 border-gray-300">
                                                        {Array.isArray(ans.jawaban) ? (
                                                            <ul className="list-disc pl-4">
                                                                {ans.jawaban.map((item, i) => <li key={i}>{item}</li>)}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-gray-900">{ans.jawaban || <span className="text-gray-400 italic">Tidak menjawab</span>}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">Belum ada data responden.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
