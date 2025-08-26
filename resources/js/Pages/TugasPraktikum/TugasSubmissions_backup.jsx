// Backup of original file - will restore basic functionality
import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import PdfViewer from '../../Components/PdfViewer';
import ConfirmModal from '../../Components/ConfirmModal';
import RubrikGradingModal from '../../Components/RubrikGradingModal';
import NilaiTambahanModal from '../../Components/NilaiTambahanModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, MessageSquare, Calendar, BookOpen, Eye, Edit, X, ArrowLeft, Plus, Settings } from 'lucide-react';

export default function TugasSubmissions({ tugas, submissions, nonSubmittedPraktikans }) {
    const { props } = usePage();
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [activeTab, setActiveTab] = useState('submitted');
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isRubrikGradingOpen, setIsRubrikGradingOpen] = useState(false);
    const [isNilaiTambahanOpen, setIsNilaiTambahanOpen] = useState(false);
    const [gradeForm, setGradeForm] = useState({
        nilai: '',
        feedback: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
    const [selectedPdfFile, setSelectedPdfFile] = useState({ url: '', filename: '' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState({ action: null, submission: null, type: 'warning' });
    const [rejectReason, setRejectReason] = useState('');
    const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);
    const [selectedCatatan, setSelectedCatatan] = useState('');

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        return props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'dikumpulkan':
                return 'text-blue-600 bg-blue-100';
            case 'dinilai':
                return 'text-green-600 bg-green-100';
            case 'terlambat':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'dikumpulkan':
                return <Clock className="w-4 h-4" />;
            case 'dinilai':
                return <CheckCircle className="w-4 h-4" />;
            case 'terlambat':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setGradeForm({
            nilai: submission.nilai || '',
            feedback: submission.feedback || ''
        });
        setIsGradeModalOpen(true);
    };

    const closeGradeModal = () => {
        setIsGradeModalOpen(false);
        setSelectedSubmission(null);
        setGradeForm({ nilai: '', feedback: '' });
    };

    const openRubrikGrading = (submission) => {
        setSelectedSubmission(submission);
        setIsRubrikGradingOpen(true);
    };

    const closeRubrikGrading = () => {
        setIsRubrikGradingOpen(false);
        setSelectedSubmission(null);
    };

    const handleRubrikGradeSaved = () => {
        router.reload();
        toast.success('Nilai rubrik berhasil disimpan');
    };

    const handleNilaiTambahanSaved = () => {
        router.reload();
        toast.success('Nilai tambahan berhasil diberikan');
    };

    return (
        <DashboardLayout>
            <Head title={`Pengumpulan Tugas - ${tugas.judul_tugas}`} />
            
            <div className="bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div className="sm:flex sm:items-center">
                            <div className="flex-shrink-0">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Pengumpulan Tugas: {tugas.judul_tugas}
                                </h2>
                                <div className="text-gray-600 text-sm">
                                    <p><strong>Mata Kuliah:</strong> {tugas.praktikum?.mata_kuliah || 'N/A'}</p>
                                    <p><strong>Deadline:</strong> {new Date(tugas.deadline).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <button
                                onClick={() => setIsNilaiTambahanOpen(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nilai Tambahan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Total Pengumpulan</div>
                    <div className="text-2xl font-bold text-gray-900">{submissions?.length || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Sudah Dinilai</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {submissions?.filter(s => s.status === 'dinilai').length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Belum Dinilai</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {submissions?.filter(s => s.status === 'dikumpulkan').length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Terlambat</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {submissions?.filter(s => s.status === 'terlambat').length || 0}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'submitted'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Sudah Mengumpulkan ({submissions?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('not-submitted')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'not-submitted'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Belum Mengumpulkan ({nonSubmittedPraktikans?.length || 0})
                    </button>
                </nav>
            </div>

            {/* Table Content */}
            <div className="bg-white shadow rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Praktikan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nilai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeTab === 'submitted' ? (
                                submissions?.length > 0 ? (
                                    submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {submission.praktikan?.nama || submission.praktikan?.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {submission.praktikan?.nim || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                                    {getStatusIcon(submission.status)}
                                                    <span className="ml-1">
                                                        {submission.status === 'dikumpulkan' ? 'Dikumpulkan' :
                                                         submission.status === 'dinilai' ? 'Sudah Dinilai' :
                                                         submission.status === 'terlambat' ? 'Terlambat' : submission.status}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {submission.has_nilai_tambahan ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Total: {parseFloat(submission.total_nilai_with_bonus || 0).toFixed(1)}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            Nilai: {parseFloat(submission.nilai || submission.total_nilai_rubrik || 0).toFixed(1)}
                                                        </div>
                                                        <div className="text-xs text-green-600">
                                                            Bonus: +{parseFloat(submission.total_nilai_tambahan || 0).toFixed(1)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {submission.nilai ? parseFloat(submission.nilai).toFixed(1) : 'Belum dinilai'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                        <button
                                                            onClick={() => openRubrikGrading(submission)}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            {submission.nilai ? 'Edit Nilai' : 'Beri Nilai'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openGradeModal(submission)}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            {submission.nilai ? 'Edit Nilai' : 'Beri Nilai'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pengumpulan</h3>
                                            <p className="mt-1 text-sm text-gray-500">Praktikan belum mengumpulkan tugas ini.</p>
                                        </td>
                                    </tr>
                                )
                            ) : (
                                nonSubmittedPraktikans?.length > 0 ? (
                                    nonSubmittedPraktikans.map((student) => (
                                        <tr key={student.praktikan_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.praktikan?.nama || student.praktikan?.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.praktikan?.nim || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="ml-1">Belum Mengumpulkan</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.has_nilai_tambahan ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Total: {parseFloat(student.total_nilai_with_bonus || 0).toFixed(1)}
                                                        </div>
                                                        <div className="text-xs text-green-600">
                                                            Bonus: +{parseFloat(student.total_nilai_tambahan || 0).toFixed(1)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Belum ada nilai</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => console.log('Give direct score for:', student.praktikan?.nama)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Beri Nilai Langsung
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">Semua praktikan sudah mengumpulkan</h3>
                                            <p className="mt-1 text-sm text-gray-500">Tidak ada praktikan yang belum mengumpulkan tugas.</p>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <RubrikGradingModal
                isOpen={isRubrikGradingOpen}
                onClose={closeRubrikGrading}
                submission={selectedSubmission}
                tugas={tugas}
                onSave={handleRubrikGradeSaved}
            />

            <NilaiTambahanModal
                isOpen={isNilaiTambahanOpen}
                onClose={() => setIsNilaiTambahanOpen(false)}
                tugas={tugas}
                praktikans={tugas.praktikum?.praktikan}
                onSave={handleNilaiTambahanSaved}
            />

            <ToastContainer />
        </DashboardLayout>
    );
}
