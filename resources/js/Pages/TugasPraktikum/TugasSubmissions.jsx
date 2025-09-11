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
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, MessageSquare, Calendar, BookOpen, Eye, Edit, X, ArrowLeft, Plus, Settings, Save } from 'lucide-react';

export default function TugasSubmissions({ tugas, submissions, nonSubmittedPraktikans, praktikum }) {
    const { props } = usePage();
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isRubrikGradingOpen, setIsRubrikGradingOpen] = useState(false);
    const [isNilaiTambahanOpen, setIsNilaiTambahanOpen] = useState(false);
    const [isManageNilaiTambahanOpen, setIsManageNilaiTambahanOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [inlineNilaiData, setInlineNilaiData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [savingPraktikan, setSavingPraktikan] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [modifiedData, setModifiedData] = useState(new Set());
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

    // Debug log untuk melihat data yang diterima dari backend
    React.useEffect(() => {
        console.log('Raw submissions data:', submissions);
        console.log('Raw nonSubmittedPraktikans data:', nonSubmittedPraktikans);
        if (submissions && submissions.length > 0) {
            console.log('First submission praktikan_id:', submissions[0].praktikan_id, 'Length:', submissions[0].praktikan_id?.length);
        }
        if (nonSubmittedPraktikans && nonSubmittedPraktikans.length > 0) {
            console.log('First non-submitted praktikan_id:', nonSubmittedPraktikans[0].praktikan_id, 'Length:', nonSubmittedPraktikans[0].praktikan_id?.length);
        }
    }, [submissions, nonSubmittedPraktikans]);

    // Initialize inline nilai data
    React.useEffect(() => {
        if (tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0) {
            const initialData = {};
            
            // Initialize for submissions
            (submissions || []).forEach(submission => {
                initialData[submission.praktikan_id] = {};
                tugas.komponen_rubriks.forEach(komponen => {
                    const existingNilai = submission.nilai_rubriks?.find(
                        nr => nr.komponen_rubrik_id === komponen.id
                    );
                    initialData[submission.praktikan_id][komponen.id] = {
                        nilai: existingNilai?.nilai || ''
                    };
                });
            });

            // Initialize for non-submitted praktikans
            (nonSubmittedPraktikans || []).forEach(student => {
                initialData[student.praktikan_id] = {};
                tugas.komponen_rubriks.forEach(komponen => {
                    initialData[student.praktikan_id][komponen.id] = {
                        nilai: ''
                    };
                });
            });

            setInlineNilaiData(initialData);
        }
    }, [tugas.komponen_rubriks, submissions, nonSubmittedPraktikans]);

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

    const handleInlineNilaiChange = (praktikanId, komponenId, field, value) => {
        if (!isEditMode && editingRow !== praktikanId) return;
        
        setInlineNilaiData(prev => ({
            ...prev,
            [praktikanId]: {
                ...prev[praktikanId],
                [komponenId]: {
                    ...prev[praktikanId][komponenId],
                    [field]: value
                }
            }
        }));

        // Track perubahan data
        const key = `${praktikanId}-${komponenId}`;
        setModifiedData(prev => new Set([...prev, key]));
    };

    const toggleRowEdit = (praktikanId) => {
        console.log('toggleRowEdit called with praktikanId:', praktikanId);
        console.log('Current editingRow:', editingRow);
        if (editingRow === praktikanId) {
            setEditingRow(null);
            console.log('Set editingRow to null');
        } else {
            setEditingRow(praktikanId);
            console.log('Set editingRow to:', praktikanId);
        }
    };

    const calculateTotalForPraktikan = (praktikanId) => {
        let total = 0;
        let totalBobot = 0;

        tugas.komponen_rubriks?.forEach(komponen => {
            const nilai = inlineNilaiData[praktikanId]?.[komponen.id]?.nilai;
            
            if (nilai && nilai !== '' && !isNaN(parseFloat(nilai))) {
                const nilaiFloat = parseFloat(nilai);
                const maxFloat = parseFloat(komponen.nilai_maksimal);
                const bobotFloat = parseFloat(komponen.bobot);
                
                if (nilaiFloat >= 0 && maxFloat > 0 && bobotFloat >= 0) {
                    const nilaiCapped = Math.min(nilaiFloat, maxFloat);
                    const persentaseNilai = (nilaiCapped / maxFloat) * 100;
                    const kontribusi = (persentaseNilai * bobotFloat) / 100;
                    
                    total += kontribusi;
                    totalBobot += bobotFloat;
                }
            }
        });

        return totalBobot > 0 ? total.toFixed(2) : '0.00';
    };

    const handleSaveAllNilai = async () => {
        setIsSaving(true);

        try {
            // Debug: Log data yang akan dikirim
            console.log('Modified data:', modifiedData);
            console.log('Inline nilai data:', inlineNilaiData);
            
            // Hanya ambil data yang benar-benar diubah
            const modifiedPraktikans = new Set();
            modifiedData.forEach(key => {
                // UUID menggunakan format: praktikanId-komponenId
                // Karena UUID berisi tanda '-', kita perlu split dengan cara yang benar
                const parts = key.split('-');
                // UUID praktikan adalah 5 bagian pertama yang digabung dengan '-'
                const praktikanId = parts.slice(0, 5).join('-');
                modifiedPraktikans.add(praktikanId);
            });

            console.log('Modified praktikans:', modifiedPraktikans);

            // Jika tidak ada data yang diubah, ambil semua data yang ada nilai
            if (modifiedPraktikans.size === 0) {
                console.log('No modified data found, using all data with values');
                const allPraktikans = new Set();
                Object.keys(inlineNilaiData).forEach(praktikanId => {
                    const hasValues = Object.values(inlineNilaiData[praktikanId] || {}).some(
                        komponenData => komponenData.nilai !== undefined && komponenData.nilai !== null && komponenData.nilai !== ''
                    );
                    if (hasValues) {
                        allPraktikans.add(praktikanId);
                    }
                });
                modifiedPraktikans.clear();
                allPraktikans.forEach(id => modifiedPraktikans.add(id));
            }

            // Jika masih kosong, ambil semua praktikan yang ada di submissions dan non-submitted
            if (modifiedPraktikans.size === 0) {
                console.log('Still no data, using all praktikans from submissions and non-submitted');
                [...(submissions || []), ...(nonSubmittedPraktikans || [])].forEach(item => {
                    if (item.praktikan_id) {
                        modifiedPraktikans.add(item.praktikan_id.toString());
                    }
                });
            }

            const requestData = {
                tugas_id: tugas.id,
                matrix_data: Array.from(modifiedPraktikans).map(praktikanId => {
                    const submission = submissions?.find(s => s.praktikan_id == praktikanId);
                    const nonSubmitted = nonSubmittedPraktikans?.find(ns => ns.praktikan_id == praktikanId);
                    
                    // Validasi praktikan_id
                    if (!praktikanId || typeof praktikanId !== 'string') {
                        console.error('Invalid praktikan_id:', praktikanId);
                        return null;
                    }
                    
                    const nilaiRubrik = tugas.komponen_rubriks
                        .filter(komponen => {
                            // Jika ada tracking spesifik, gunakan itu
                            if (modifiedData.has(`${praktikanId}-${komponen.id}`)) {
                                return true;
                            }
                            // Jika tidak ada tracking, ambil semua komponen (untuk save semua)
                            return true;
                        })
                        .map(komponen => ({
                            komponen_rubrik_id: komponen.id,
                            nilai: parseFloat(inlineNilaiData[praktikanId]?.[komponen.id]?.nilai || 0),
                            catatan: ''
                        }));
                    
                    console.log(`Praktikan ${praktikanId} nilai rubrik:`, nilaiRubrik);
                    
                    // Validasi: pastikan ada nilai rubrik yang dikirim
                    if (nilaiRubrik.length === 0) {
                        console.warn(`No nilai rubrik for praktikan ${praktikanId}`);
                        return null;
                    }
                    
                    return {
                        praktikan_id: praktikanId,
                        pengumpulan_tugas_id: submission?.id || null,
                        nilai_rubrik: nilaiRubrik
                    };
                }).filter(data => data !== null)
            };

            console.log('Request data:', requestData);
            console.log('Tugas ID:', tugas.id);
            console.log('Tugas ID type:', typeof tugas.id);
            console.log('Tugas object:', tugas);
            console.log('Tugas ID yang akan dikirim:', tugas.id);
            console.log('Submissions:', submissions);
            console.log('Non-submitted praktikans:', nonSubmittedPraktikans);
            console.log('Modified praktikans:', Array.from(modifiedPraktikans));
            console.log('Praktikan IDs in submissions:', submissions?.map(s => ({ id: s.praktikan_id, length: s.praktikan_id?.length })));
            console.log('Praktikan IDs in non-submitted:', nonSubmittedPraktikans?.map(ns => ({ id: ns.praktikan_id, length: ns.praktikan_id?.length })));
            
            // Debug: cek data yang akan dikirim
            console.log('Matrix data yang akan dikirim:', requestData.matrix_data?.map(data => ({
                praktikan_id: data.praktikan_id,
                praktikan_id_length: data.praktikan_id?.length
            })));

            // Validasi tugas_id
            if (!tugas.id || typeof tugas.id !== 'string') {
                console.error('Invalid tugas_id:', tugas.id);
                toast.error('ID tugas tidak valid');
                return;
            }

            // Validasi matrix_data tidak kosong
            if (!requestData.matrix_data || requestData.matrix_data.length === 0) {
                console.warn('No matrix data to send');
                toast.error('Tidak ada data yang diubah untuk disimpan');
                return;
            }

            const response = await fetch('/praktikum/submission/matrix-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Semua nilai berhasil disimpan');
                setIsEditMode(false);
                setModifiedData(new Set()); // Clear semua tracking
            } else {
                const errorData = await response.json();
                console.error('Error saving matrix data:', errorData);
                let errorMessage = 'Terjadi kesalahan saat menyimpan nilai';
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.errors) {
                    errorMessage = Object.values(errorData.errors).flat().join(', ');
                }
                
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error saving inline nilai:', error);
            toast.error('Terjadi kesalahan: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveIndividualNilai = async (praktikanId) => {
        console.log('handleSaveIndividualNilai called with praktikanId:', praktikanId);
        setSavingPraktikan(praktikanId);

        try {
            const submission = submissions?.find(s => s.praktikan_id == praktikanId);
            const nonSubmitted = nonSubmittedPraktikans?.find(ns => ns.praktikan_id == praktikanId);
            
            // Validasi praktikan_id
            if (!praktikanId || typeof praktikanId !== 'string') {
                console.error('Invalid praktikan_id:', praktikanId);
                toast.error('ID praktikan tidak valid');
                return;
            }

            const nilaiRubrik = tugas.komponen_rubriks
                .filter(komponen => {
                    const nilai = inlineNilaiData[praktikanId]?.[komponen.id]?.nilai;
                    return nilai !== undefined && nilai !== null && nilai !== '';
                })
                .map(komponen => ({
                    komponen_rubrik_id: komponen.id,
                    nilai: parseFloat(inlineNilaiData[praktikanId]?.[komponen.id]?.nilai || 0),
                    catatan: ''
                }));

            // Validasi: pastikan ada nilai rubrik yang dikirim
            if (nilaiRubrik.length === 0) {
                console.warn(`No nilai rubrik for praktikan ${praktikanId}`);
                toast.error('Tidak ada nilai yang diubah untuk disimpan');
                return;
            }

            // Validasi tugas_id
            if (!tugas.id || typeof tugas.id !== 'string') {
                console.error('Invalid tugas_id:', tugas.id);
                toast.error('ID tugas tidak valid');
                return;
            }

            const requestData = {
                tugas_id: tugas.id,
                matrix_data: [{
                    praktikan_id: praktikanId,
                    pengumpulan_tugas_id: submission?.id || null,
                    nilai_rubrik: nilaiRubrik
                }]
            };

            console.log('Individual save request data:', requestData);
            console.log('Modified data before save:', modifiedData);
            console.log('Nilai rubrik length:', nilaiRubrik.length);

            const response = await fetch('/praktikum/submission/matrix-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Individual save response:', result);
                toast.success('Nilai berhasil disimpan');
                setEditingRow(null);
                // Clear tracking untuk praktikan yang sudah disimpan
                const newModifiedData = new Set(modifiedData);
                tugas.komponen_rubriks.forEach(komponen => {
                    newModifiedData.delete(`${praktikanId}-${komponen.id}`);
                });
                setModifiedData(newModifiedData);
                console.log('Modified data after clear:', newModifiedData);
            } else {
                const errorData = await response.json();
                console.error('Error saving individual data:', errorData);
                let errorMessage = 'Terjadi kesalahan saat menyimpan nilai';
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.errors) {
                    errorMessage = Object.values(errorData.errors).flat().join(', ');
                }
                
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error saving individual nilai:', error);
            toast.error('Terjadi kesalahan: ' + error.message);
        } finally {
            setSavingPraktikan(null);
        }
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
                                    onClick={() => router.visit(`/praktikum/tugas/${tugas.id}/komponen`)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Kelola Komponen Rubrik</span>
                                </button>
                                {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 && (
                                    <button
                                        onClick={isEditMode ? handleSaveAllNilai : () => setIsEditMode(true)}
                                        disabled={isSaving}
                                        className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                                            isEditMode 
                                                ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {isEditMode ? (
                                            <>
                                                {isSaving ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        <span>Menyimpan...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        <span>Simpan Semua Nilai</span>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="w-4 h-4" />
                                                <span>Aktifkan Input Nilai</span>
                                            </>
                                        )}
                                    </button>
                                )}
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

            {/* Edit Mode Notification */}
            {isEditMode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
                        <p className="text-green-800">
                            <strong>Mode Edit Aktif!</strong> Anda dapat mengisi nilai untuk setiap komponen rubrik. 
                            Klik "Simpan Semua Nilai" untuk menyimpan perubahan.
                        </p>
                    </div>
                </div>
            )}

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
                                    {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                        <>
                                            {tugas.komponen_rubriks.map((komponen) => (
                                                <th key={komponen.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="text-center">
                                                        <div className="font-medium">{komponen.nama_komponen}</div>
                                                        <div className="flex justify-center mt-1">
                                                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                                                                {parseFloat(komponen.bobot)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </>
                                    ) : (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nilai
                                    </th>
                                    )}
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
                                                                                    href={`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                                                                    title={displayFileName}
                                                                                >
                                                                                    {displayFileName}
                                                                                </a>
                                                                                <Download 
                                                                                    className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                                                                    onClick={() => window.open(`/praktikum/pengumpulan/download/${encodeURIComponent(fullFileName)}`, '_blank')}
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
                                            {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                <>
                                                    {tugas.komponen_rubriks.map((komponen) => (
                                                        <td key={komponen.id} className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                value={inlineNilaiData[submission.praktikan_id]?.[komponen.id]?.nilai || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const maxValue = parseFloat(komponen.nilai_maksimal);
                                                                    
                                                                    if (parseFloat(value) > maxValue) {
                                                                        toast.warning(`Nilai tidak boleh melebihi ${maxValue}`);
                                                                        return;
                                                                    }
                                                                    
                                                                    handleInlineNilaiChange(submission.praktikan_id, komponen.id, 'nilai', value);
                                                                }}
                                                                className={`w-16 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                    (isEditMode || editingRow === submission.praktikan_id)
                                                                        ? 'border-gray-300 focus:border-blue-500' 
                                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                                }`}
                                                                min="0"
                                                                max={komponen.nilai_maksimal}
                                                                step="0.1"
                                                                placeholder="0"
                                                                disabled={!(isEditMode || editingRow === submission.praktikan_id)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-lg font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(submission.praktikan_id)}%
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {submission.nilai ? parseFloat(submission.nilai).toFixed(1) : 
                                                     submission.total_nilai_rubrik ? parseFloat(submission.total_nilai_rubrik).toFixed(1) : 
                                                     'Belum dinilai'}
                                                </span>
                                            </td>
                                            )}
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
                                                        <div className="flex space-x-1">
                                                            {(() => {
                                                                const shouldShowSave = (isEditMode || editingRow === submission.praktikan_id);
                                                                console.log('Button condition check:', {
                                                                    isEditMode,
                                                                    editingRow,
                                                                    praktikanId: submission.praktikan_id,
                                                                    shouldShowSave
                                                                });
                                                                return shouldShowSave;
                                                            })() ? (
                                                        <button
                                                                    onClick={() => handleSaveIndividualNilai(submission.praktikan_id)}
                                                                    disabled={savingPraktikan === submission.praktikan_id}
                                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    {savingPraktikan === submission.praktikan_id ? (
                                                                        <>
                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                            Simpan...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="w-3 h-3 mr-1" />
                                                                            Simpan
                                                                        </>
                                                                    )}
                                                        </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => toggleRowEdit(submission.praktikan_id)}
                                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Edit className="w-3 h-3 mr-1" />
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>
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
                                            {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                <>
                                                    {tugas.komponen_rubriks.map((komponen) => (
                                                        <td key={komponen.id} className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                value={inlineNilaiData[student.praktikan_id]?.[komponen.id]?.nilai || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const maxValue = parseFloat(komponen.nilai_maksimal);
                                                                    
                                                                    if (parseFloat(value) > maxValue) {
                                                                        toast.warning(`Nilai tidak boleh melebihi ${maxValue}`);
                                                                        return;
                                                                    }
                                                                    
                                                                    handleInlineNilaiChange(student.praktikan_id, komponen.id, 'nilai', value);
                                                                }}
                                                                className={`w-16 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                    (isEditMode || editingRow === student.praktikan_id)
                                                                        ? 'border-gray-300 focus:border-blue-500' 
                                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                                }`}
                                                                min="0"
                                                                max={komponen.nilai_maksimal}
                                                                step="0.1"
                                                                placeholder="0"
                                                                disabled={!(isEditMode || editingRow === student.praktikan_id)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-lg font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(student.praktikan_id)}%
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">-</span>
                                            </td>
                                            )}
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
                                                {(isEditMode || editingRow === student.praktikan_id) ? (
                                                <button
                                                        onClick={() => handleSaveIndividualNilai(student.praktikan_id)}
                                                        disabled={savingPraktikan === student.praktikan_id}
                                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {savingPraktikan === student.praktikan_id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                Simpan...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-3 h-3 mr-1" />
                                                                Simpan
                                                            </>
                                                        )}
                                                </button>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleRowEdit(student.praktikan_id)}
                                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <Edit className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </button>
                                                )}
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

                {/* Mobile View - Simple Table */}
                <div className="lg:hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Praktikan
                                    </th>
                                    {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 && (
                                        <>
                                            {tugas.komponen_rubriks.map((komponen) => (
                                                <th key={komponen.id} className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <div className="text-center">
                                                        <div className="font-medium text-xs">{komponen.nama_komponen}</div>
                                                        <div className="text-xs text-gray-400">
                                                            {parseFloat(komponen.bobot)}%
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </>
                                    )}
                                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                    {/* Submissions */}
                    {(activeTab === 'submitted' || activeTab === 'all') && filteredSubmissions?.length > 0 && (
                                    filteredSubmissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">
                                                    {submission.praktikan?.nama || submission.praktikan?.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                    {submission.praktikan?.nim || 'N/A'}
                                            </div>
                                        </div>
                                            </td>
                                            {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                <>
                                                    {tugas.komponen_rubriks.map((komponen) => (
                                                        <td key={komponen.id} className="px-1 py-2">
                                                            <input
                                                                type="number"
                                                                value={inlineNilaiData[submission.praktikan_id]?.[komponen.id]?.nilai || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const maxValue = parseFloat(komponen.nilai_maksimal);
                                                                    
                                                                    if (parseFloat(value) > maxValue) {
                                                                        toast.warning(`Nilai tidak boleh melebihi ${maxValue}`);
                                                                        return;
                                                                    }
                                                                    
                                                                    handleInlineNilaiChange(submission.praktikan_id, komponen.id, 'nilai', value);
                                                                }}
                                                                className={`w-12 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                    (isEditMode || editingRow === submission.praktikan_id)
                                                                        ? 'border-gray-300 focus:border-blue-500' 
                                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                                }`}
                                                                min="0"
                                                                max={komponen.nilai_maksimal}
                                                                step="0.1"
                                                                placeholder="0"
                                                                disabled={!(isEditMode || editingRow === submission.praktikan_id)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(submission.praktikan_id)}%
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-2 py-2 text-center">
                                                    <span className="text-xs text-gray-900">
                                                        {submission.nilai ? parseFloat(submission.nilai).toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-2 py-2">
                                                {(isEditMode || editingRow === submission.praktikan_id) ? (
                                                <button
                                                        onClick={() => handleSaveIndividualNilai(submission.praktikan_id)}
                                                        disabled={savingPraktikan === submission.praktikan_id}
                                                        className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {savingPraktikan === submission.praktikan_id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        ) : (
                                                            <Save className="w-3 h-3" />
                                                        )}
                                                </button>
                                            ) : (
                                                <button
                                                        onClick={() => toggleRowEdit(submission.praktikan_id)}
                                                        className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                        <Edit className="w-3 h-3" />
                                                </button>
                                            )}
                                            </td>
                                        </tr>
                                    ))
                    )}
                    
                    {/* Non-Submitted */}
                    {(activeTab === 'not-submitted' || activeTab === 'all') && filteredNonSubmitted?.length > 0 && (
                                    filteredNonSubmitted.map((student) => (
                                        <tr key={student.praktikan_id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">
                                                    {student.praktikan?.nama || student.praktikan?.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                    {student.praktikan?.nim || 'N/A'}
                                            </div>
                                        </div>
                                            </td>
                                            {tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? (
                                                <>
                                                    {tugas.komponen_rubriks.map((komponen) => (
                                                        <td key={komponen.id} className="px-1 py-2">
                                                            <input
                                                                type="number"
                                                                value={inlineNilaiData[student.praktikan_id]?.[komponen.id]?.nilai || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    const maxValue = parseFloat(komponen.nilai_maksimal);
                                                                    
                                                                    if (parseFloat(value) > maxValue) {
                                                                        toast.warning(`Nilai tidak boleh melebihi ${maxValue}`);
                                                                        return;
                                                                    }
                                                                    
                                                                    handleInlineNilaiChange(student.praktikan_id, komponen.id, 'nilai', value);
                                                                }}
                                                                className={`w-12 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                    (isEditMode || editingRow === student.praktikan_id)
                                                                        ? 'border-gray-300 focus:border-blue-500' 
                                                                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                                                }`}
                                                                min="0"
                                                                max={komponen.nilai_maksimal}
                                                                step="0.1"
                                                                placeholder="0"
                                                                disabled={!(isEditMode || editingRow === student.praktikan_id)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(student.praktikan_id)}%
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-2 py-2 text-center">
                                                    <span className="text-xs text-gray-500">-</span>
                                                </td>
                                            )}
                                            <td className="px-2 py-2">
                                                {(isEditMode || editingRow === student.praktikan_id) ? (
                                                        <button
                                                        onClick={() => handleSaveIndividualNilai(student.praktikan_id)}
                                                        disabled={savingPraktikan === student.praktikan_id}
                                                        className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {savingPraktikan === student.praktikan_id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        ) : (
                                                            <Save className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                ) : (
                                            <button
                                                        onClick={() => toggleRowEdit(student.praktikan_id)}
                                                        className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                        <Edit className="w-3 h-3" />
                                            </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                
                                {/* Empty state */}
                    {((activeTab === 'submitted' && filteredSubmissions?.length === 0) ||
                      (activeTab === 'not-submitted' && filteredNonSubmitted?.length === 0) ||
                      (activeTab === 'all' && filteredSubmissions?.length === 0 && filteredNonSubmitted?.length === 0)) && (
                                    <tr>
                                        <td colSpan={tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0 ? 
                                            (tugas.komponen_rubriks.length + 3) : 3} className="px-6 py-12 text-center">
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
