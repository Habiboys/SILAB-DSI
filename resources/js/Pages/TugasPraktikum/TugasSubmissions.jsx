// Backup of original file - will restore basic functionality
import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import PdfViewer from '../../Components/PdfViewer';
import ConfirmModal from '../../Components/ConfirmModal';
import RubrikGradingModal from '../../Components/RubrikGradingModal';
import NilaiTambahanModal from '../../Components/NilaiTambahanModal';
import ManageNilaiTambahanModal from '../../Components/ManageNilaiTambahanModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, MessageSquare, Calendar, BookOpen, Eye, Edit, X, ArrowLeft, Plus, Settings, FileSpreadsheet } from 'lucide-react';

export default function TugasSubmissions({ tugas, submissions, nonSubmittedPraktikans }) {
    const { props } = usePage();
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isRubrikGradingOpen, setIsRubrikGradingOpen] = useState(false);
    const [isNilaiTambahanOpen, setIsNilaiTambahanOpen] = useState(false);
    const [isManageNilaiTambahanOpen, setIsManageNilaiTambahanOpen] = useState(false);
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSubmissions, setFilteredSubmissions] = useState(submissions || []);
    const [filteredNonSubmitted, setFilteredNonSubmitted] = useState(nonSubmittedPraktikans || []);

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        return props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    // Filter submissions based on search term
    React.useEffect(() => {
        const filtered = (submissions || []).filter(submission => {
            const praktikanName = submission.praktikan?.nama || submission.praktikan?.user?.name || '';
            const praktikanNim = submission.praktikan?.nim || '';
            return praktikanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   praktikanNim.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredSubmissions(filtered);

        const filteredNon = (nonSubmittedPraktikans || []).filter(student => {
            const praktikanName = student.praktikan?.nama || student.praktikan?.user?.name || '';
            const praktikanNim = student.praktikan?.nim || '';
            return praktikanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   praktikanNim.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredNonSubmitted(filteredNon);
    }, [searchTerm, submissions, nonSubmittedPraktikans]);

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

    const openNilaiTambahanModal = () => {
        setIsNilaiTambahanOpen(true);
    };

    const openDirectGrading = (student) => {
        // Buat submission dummy untuk praktikan yang belum mengumpulkan
        const dummySubmission = {
            id: null,
            praktikan_id: student.praktikan?.id,
            praktikan: student.praktikan,
            nilai: null,
            feedback: null
        };
        setSelectedSubmission(dummySubmission);
        setIsRubrikGradingOpen(true);
    };

    const openManageNilaiTambahan = (submission) => {
        setSelectedSubmission(submission);
        setIsManageNilaiTambahanOpen(true);
    };

    const handleRubrikGradeSaved = () => {
        router.reload();
        toast.success('Nilai rubrik berhasil disimpan');
    };

    const handleNilaiTambahanSaved = () => {
        router.reload();
        toast.success('Nilai tambahan berhasil diberikan');
    };

    const handleExportGrades = () => {
        // Navigate to export route
        window.open(route('praktikum.tugas.export-grades', { tugas: tugas.id }), '_blank');
    };

    return (
        <DashboardLayout>
            <Head title={`Pengumpulan Tugas - ${tugas.judul_tugas}`} />
            
            <div className="bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                    {/* Back Button */}
                    <div className="mb-4">
                        <button
                            onClick={() => router.visit(`/praktikum/${tugas.praktikum_id}/tugas`)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali ke Daftar Tugas
                        </button>
                    </div>
                    
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
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleExportGrades}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Export Nilai</span>
                                </button>
                                <button
                                    onClick={() => router.visit(`/praktikum/tugas/${tugas.id}/komponen`)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Kelola Komponen Rubrik</span>
                                </button>
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
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Total Pengumpulan</div>
                    <div className="text-2xl font-bold text-gray-900">{filteredSubmissions?.length || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Sudah Dinilai</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(s => s.status === 'dinilai').length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Belum Dinilai</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(s => s.status === 'dikumpulkan' || s.status === 'terlambat').length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">Terlambat</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(s => s.status === 'terlambat').length || 0}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari nama praktikan atau NIM..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'all'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Semua ({(filteredSubmissions?.length || 0) + (filteredNonSubmitted?.length || 0)})
                    </button>
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'submitted'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Sudah Kumpul ({filteredSubmissions?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('not-submitted')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'not-submitted'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Belum Kumpul ({filteredNonSubmitted?.length || 0})
                    </button>
                </nav>
            </div>

            {/* Table Content */}
            <div className="bg-white shadow rounded-lg">
                {/* Desktop Table */}
                <div className="hidden lg:block">
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
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nilai
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nilai Tambahan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Tampilkan yang sudah mengumpulkan */}
                            {(activeTab === 'submitted' || activeTab === 'all') && filteredSubmissions?.length > 0 && (
                                filteredSubmissions.map((submission) => (
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
                                            <td className="px-6 py-4">
                                                {submission.file_pengumpulan ? (
                                                    (() => {
                                                        try {
                                                            const files = JSON.parse(submission.file_pengumpulan);
                                                            return (
                                                                <div className="space-y-1">
                                                                    {files.map((filePath, index) => {
                                                                        const fullFileName = filePath.split('/').pop();
                                                                        const displayFileName = fullFileName.replace(/^\d+_/, '');
                                                                        return (
                                                                            <div key={index} className="flex items-center space-x-2">
                                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                                <a
                                                                                    href={`/praktikum/pengumpulan/download/${fullFileName}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                                                                    title={displayFileName}
                                                                                >
                                                                                    {displayFileName}
                                                                                </a>
                                                                                <Download 
                                                                                    className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                                                                    onClick={() => window.open(`/praktikum/pengumpulan/download/${fullFileName}`, '_blank')}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        } catch (e) {
                                                            // Fallback untuk file tunggal (format lama)
                                                            const fullFileName = submission.file_pengumpulan.split('/').pop();
                                                            const displayFileName = fullFileName.replace(/^\d+_/, '');
                                                            return (
                                                                <div className="flex items-center space-x-2">
                                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                                    <a
                                                                        href={`/praktikum/pengumpulan/download/${fullFileName}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                                                        title={displayFileName}
                                                                    >
                                                                        {displayFileName}
                                                                    </a>
                                                                    <Download 
                                                                        className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                                                        onClick={() => window.open(`/praktikum/pengumpulan/download/${fullFileName}`, '_blank')}
                                                                    />
                                                                </div>
                                                            );
                                                        }
                                                    })()
                                                ) : (
                                                    <span className="text-sm text-gray-500">Tidak ada file</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {submission.nilai ? parseFloat(submission.nilai).toFixed(1) : 
                                                     submission.total_nilai_rubrik ? parseFloat(submission.total_nilai_rubrik).toFixed(1) : 
                                                     'Belum dinilai'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {submission.has_nilai_tambahan ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div>
                                                            <div className="text-sm font-medium text-green-600">
                                                                +{parseFloat(submission.total_nilai_tambahan || 0).toFixed(1)}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                Total: {parseFloat(submission.total_nilai_with_bonus || 0).toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => openManageNilaiTambahan(submission)}
                                                            className="p-1 text-blue-600 hover:text-blue-800"
                                                            title="Kelola nilai tambahan"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
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
                            )}
                            
                            {/* Tampilkan yang belum mengumpulkan */}
                            {(activeTab === 'not-submitted' || activeTab === 'all') && filteredNonSubmitted?.length > 0 && (
                                filteredNonSubmitted.map((student) => (
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
                                                <span className="text-sm text-gray-500">-</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">-</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.has_nilai_tambahan ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div>
                                                            <div className="text-sm font-medium text-green-600">
                                                                +{parseFloat(student.total_nilai_tambahan || 0).toFixed(1)}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                Total: {parseFloat(student.total_nilai_with_bonus || 0).toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => openManageNilaiTambahan({
                                                                praktikan_id: student.praktikan?.id,
                                                                praktikan: student.praktikan
                                                            })}
                                                            className="p-1 text-blue-600 hover:text-blue-800"
                                                            title="Kelola nilai tambahan"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => openDirectGrading(student)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Beri Nilai Langsung
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                            
                            {/* Empty state */}
                            {((activeTab === 'submitted' && filteredSubmissions?.length === 0) ||
                              (activeTab === 'not-submitted' && filteredNonSubmitted?.length === 0) ||
                              (activeTab === 'all' && filteredSubmissions?.length === 0 && filteredNonSubmitted?.length === 0)) && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            {activeTab === 'submitted' ? 'Belum ada pengumpulan' :
                                             activeTab === 'not-submitted' ? 'Semua praktikan sudah mengumpulkan' :
                                             'Tidak ada data'}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {activeTab === 'submitted' ? 'Praktikan belum mengumpulkan tugas ini.' :
                                             activeTab === 'not-submitted' ? 'Tidak ada praktikan yang belum mengumpulkan tugas.' :
                                             'Tidak ada data untuk ditampilkan.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden">
                    {/* Submissions */}
                    {(activeTab === 'submitted' || activeTab === 'all') && filteredSubmissions?.length > 0 && (
                        <div className="space-y-4 p-4">
                            {filteredSubmissions.map((submission) => (
                                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {submission.praktikan?.nama || submission.praktikan?.user?.name || 'N/A'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {submission.praktikan?.nim || 'N/A'}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                                {getStatusIcon(submission.status)}
                                                <span className="ml-1">
                                                    {submission.status === 'dikumpulkan' ? 'Dikumpulkan' :
                                                     submission.status === 'dinilai' ? 'Sudah Dinilai' :
                                                     submission.status === 'terlambat' ? 'Terlambat' : submission.status}
                                                </span>
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">File:</span>
                                            <div className="mt-1">
                                                {submission.file_pengumpulan ? (
                                                    (() => {
                                                        try {
                                                            const files = JSON.parse(submission.file_pengumpulan);
                                                            return (
                                                                <div className="space-y-1">
                                                                    {files.map((filePath, index) => {
                                                                        const fileName = filePath.split('/').pop().replace(/^\d+_/, '');
                                                                        return (
                                                                            <div key={index} className="flex items-center space-x-2">
                                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                                <a
                                                                                    href={`/storage/${filePath.replace('public/', '')}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                                                                                >
                                                                                    {fileName}
                                                                                </a>
                                                                                <Download 
                                                                                    className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                                                                    onClick={() => window.open(`/storage/${filePath.replace('public/', '')}`, '_blank')}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        } catch (e) {
                                                            const fileName = submission.file_pengumpulan.split('/').pop().replace(/^\d+_/, '');
                                                            return (
                                                                <div className="flex items-center space-x-2">
                                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                                    <a
                                                                        href={`/storage/${submission.file_pengumpulan.replace('public/', '')}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                                                                    >
                                                                        {fileName}
                                                                    </a>
                                                                    <Download 
                                                                        className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                                                        onClick={() => window.open(`/storage/${submission.file_pengumpulan.replace('public/', '')}`, '_blank')}
                                                                    />
                                                                </div>
                                                            );
                                                        }
                                                    })()
                                                ) : (
                                                    <span className="text-sm text-gray-500">Tidak ada file</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">Nilai:</span>
                                            <div className="mt-1">
                                                {submission.has_nilai_tambahan ? (
                                                    <div className="flex items-center justify-between">
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
                                                        <button
                                                            onClick={() => openManageNilaiTambahan(submission)}
                                                            className="p-1 text-blue-600 hover:text-blue-800"
                                                            title="Kelola nilai tambahan"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-900">
                                                        {submission.nilai ? parseFloat(submission.nilai).toFixed(1) : 'Belum dinilai'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-gray-200">
                                            {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                <button
                                                    onClick={() => openRubrikGrading(submission)}
                                                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    {submission.nilai ? 'Edit Nilai' : 'Beri Nilai'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openGradeModal(submission)}
                                                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    {submission.nilai ? 'Edit Nilai' : 'Beri Nilai'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                    )}
                    
                    {/* Non-Submitted */}
                    {(activeTab === 'not-submitted' || activeTab === 'all') && filteredNonSubmitted?.length > 0 && (
                        <div className="space-y-4 p-4">
                            {filteredNonSubmitted.map((student) => (
                                    <div key={student.praktikan_id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {student.praktikan?.nama || student.praktikan?.user?.name || 'N/A'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {student.praktikan?.nim || 'N/A'}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                                <XCircle className="w-4 h-4" />
                                                <span className="ml-1">Belum Mengumpulkan</span>
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">Nilai:</span>
                                            <div className="mt-1">
                                                {student.has_nilai_tambahan ? (
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                Total: {parseFloat(student.total_nilai_with_bonus || 0).toFixed(1)}
                                                            </div>
                                                            <div className="text-xs text-green-600">
                                                                Bonus: +{parseFloat(student.total_nilai_tambahan || 0).toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => openManageNilaiTambahan({
                                                                praktikan_id: student.praktikan?.id,
                                                                praktikan: student.praktikan
                                                            })}
                                                            className="p-1 text-blue-600 hover:text-blue-800"
                                                            title="Kelola nilai tambahan"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Belum ada nilai</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-gray-200">
                                            <button
                                                onClick={() => openDirectGrading(student)}
                                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Beri Nilai Langsung
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    )}
                    
                    {/* Mobile Empty State */}
                    {((activeTab === 'submitted' && filteredSubmissions?.length === 0) ||
                      (activeTab === 'not-submitted' && filteredNonSubmitted?.length === 0) ||
                      (activeTab === 'all' && filteredSubmissions?.length === 0 && filteredNonSubmitted?.length === 0)) && (
                        <div className="px-6 py-12 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {activeTab === 'submitted' ? 'Belum ada pengumpulan' :
                                 activeTab === 'not-submitted' ? 'Semua praktikan sudah mengumpulkan' :
                                 'Tidak ada data'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {activeTab === 'submitted' ? 'Praktikan belum mengumpulkan tugas ini.' :
                                 activeTab === 'not-submitted' ? 'Tidak ada praktikan yang belum mengumpulkan tugas.' :
                                 'Tidak ada data untuk ditampilkan.'}
                            </p>
                        </div>
                    )}
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
                praktikans={tugas.praktikum?.praktikans}
                onSave={handleNilaiTambahanSaved}
            />

            <ManageNilaiTambahanModal
                isOpen={isManageNilaiTambahanOpen}
                onClose={() => setIsManageNilaiTambahanOpen(false)}
                submission={selectedSubmission}
                tugas={tugas}
                onSave={handleNilaiTambahanSaved}
            />

            <ToastContainer />
        </DashboardLayout>
    );
}
