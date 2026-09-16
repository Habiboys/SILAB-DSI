import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Download, FileText, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../Components/Modal';

export default function PraktikumTugas({ praktikan, tugasPraktikums, riwayatPengumpulan }) {
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);

    
    const praktikanData = praktikan?.praktikan ?? {};
    const praktikumData = praktikan?.praktikum ?? praktikan?.praktikumData ?? {};
    const kelasData = praktikan?.kelas ?? null;
    const laboratorium = praktikumData?.kepengurusanLab?.laboratorium?.nama
        ?? praktikumData?.kepengurusan_lab?.laboratorium?.nama
        ?? 'Belum tersedia';

    const submitForm = useForm({
        file_pengumpulan: null,
        catatan: '',
    });

    const openSubmitModal = (tugas) => {
        setSelectedTugas(tugas);
        submitForm.reset();
        setIsSubmitModalOpen(true);
    };

    const closeSubmitModal = () => {
        setIsSubmitModalOpen(false);
        setSelectedTugas(null);
        submitForm.reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        submitForm.post(route('praktikum.tugas.pengumpulan.store', { tugas: selectedTugas.id }), {
            preserveScroll: true,
            onSuccess: () => {
                closeSubmitModal();
                
                window.location.reload();
            },
            onError: () => {
                
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'dikumpulkan':
                return 'text-primary bg-primary/15';
            case 'dinilai':
                return 'text-success bg-success/15';
            case 'terlambat':
                return 'text-error bg-error/15';
            default:
                return 'text-base-content/70 bg-base-200';
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

    const isDeadlinePassed = (deadline) => {
        return new Date(deadline) < new Date();
    };

    return (
        <>
            <Head title={`Tugas ${praktikumData.nama_praktikum}`} />
            
            <div className="min-h-screen bg-base-200">
                
                <div className="bg-base-100 shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center py-4">
                            <Link
                                href={route('praktikan.daftar-tugas')}
                                className="mr-4 p-2 text-base-content/50 hover:text-base-content/70 rounded-md hover:bg-base-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">
                                    {praktikumData.nama_praktikum}
                                </h1>
                                <p className="text-base-content/70">
                                    Laboratorium: {laboratorium} | 
                                    Periode: {praktikumData.periode}
                                    {kelasData && ` | Kelas: ${kelasData.nama_kelas}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-base-content">Daftar Tugas</h2>
                        
                        {tugasPraktikums.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-base-content/50" />
                                <h3 className="mt-2 text-sm font-medium text-base-content">Belum ada tugas</h3>
                                <p className="mt-1 text-sm text-base-content/60">Belum ada tugas yang diberikan untuk praktikum ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {tugasPraktikums.map((tugas) => {
                                    const pengumpulan = riwayatPengumpulan.find(
                                        r => r.tugas_praktikum_id === tugas.id
                                    );
                                    const status = pengumpulan ? pengumpulan.status : 'belum_dikumpulkan';
                                    const isTerlambat = isDeadlinePassed(tugas.deadline);
                                    
                                    return (
                                        <div key={tugas.id} className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-medium text-base-content">
                                                    {tugas.judul_tugas}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                    {getStatusIcon(status)}
                                                    <span className="ml-1 capitalize">
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                </span>
                                            </div>
                                            
                                            {tugas.deskripsi && (
                                                <p className="text-base-content/70 mb-4">{tugas.deskripsi}</p>
                                            )}
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-base-content/60">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                
                                                {isTerlambat && (
                                                    <div className="text-sm text-error font-medium">
                                                        ⚠️ Deadline telah lewat
                                                    </div>
                                                )}
                                            </div>
                                            
                                            
                                            {tugas.file_tugas && (
                                                <div className="mb-4">
                                                    <a
                                                        href={route('praktikum.tugas.view', { tugas: tugas.id })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-2 border border-base-300 shadow-sm text-sm font-medium rounded-md text-base-content bg-base-100 hover:bg-base-200"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Lihat Instruksi
                                                    </a>
                                                </div>
                                            )}
                                            
                                            
                                            {pengumpulan && (
                                                <div className="mb-4 p-3 bg-base-200 rounded-md">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-base-content mb-1">
                                                            Status Pengumpulan:
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center">
                                                                <Clock className="w-4 h-4 mr-2 text-base-content/50" />
                                                                <span>Dikumpulkan: {new Date(pengumpulan.submitted_at).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            
                                                            {pengumpulan.nilai && (
                                                                <div className="flex items-center">
                                                                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                                                    <span>Nilai: {pengumpulan.nilai}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {pengumpulan.feedback && (
                                                                <div className="mt-2 p-2 bg-primary/10 rounded text-sm text-primary">
                                                                    <strong>Feedback:</strong> {pengumpulan.feedback}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            
                                            {!pengumpulan && !isTerlambat && (
                                                <button
                                                    onClick={() => openSubmitModal(tugas)}
                                                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Kumpul Tugas
                                                </button>
                                            )}
                                            
                                            {!pengumpulan && isTerlambat && (
                                                <div className="text-center py-2 text-sm text-error font-medium">
                                                    Deadline telah lewat
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            
            <Modal
                show={isSubmitModalOpen && !!selectedTugas}
                onClose={closeSubmitModal}
                maxWidth="md"
            >
                <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Kumpul Tugas</h3>
                        </div>

                        <div className="mb-4">
                            <h4 className="font-medium text-base-content">{selectedTugas?.judul_tugas ?? 'Tugas belum dipilih'}</h4>
                            {selectedTugas?.deadline && (
                                <p className="text-sm text-base-content/70">
                                    Deadline: {new Date(selectedTugas.deadline).toLocaleDateString('id-ID')}
                                </p>
                            )}
                            {selectedTugas?.deskripsi && (
                                <p className="text-sm text-base-content/70 mt-1">{selectedTugas.deskripsi}</p>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <div className="mb-4">
                                <label htmlFor="file_pengumpulan" className="block text-sm font-medium text-base-content mb-1">
                                    File Tugas *
                                </label>
                                <input
                                    type="file"
                                    id="file_pengumpulan"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        submitForm.errors.file_pengumpulan ? 'border-error' : 'border-base-300'
                                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                                    onChange={(e) => submitForm.setData('file_pengumpulan', e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.zip,.rar"
                                    required
                                />
                                <p className="mt-1 text-sm text-base-content/60">
                                    Format: PDF, DOC, DOCX, ZIP, RAR. Maksimal 10MB.
                                </p>
                                {submitForm.errors.file_pengumpulan && (
                                    <p className="mt-1 text-sm text-error">{submitForm.errors.file_pengumpulan}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label htmlFor="catatan" className="block text-sm font-medium text-base-content mb-1">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    id="catatan"
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        submitForm.errors.catatan ? 'border-error' : 'border-base-300'
                                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                                    value={submitForm.data.catatan}
                                    onChange={(e) => submitForm.setData('catatan', e.target.value)}
                                    placeholder="Tambahkan catatan atau keterangan tambahan..."
                                />
                                {submitForm.errors.catatan && (
                                    <p className="mt-1 text-sm text-error">{submitForm.errors.catatan}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeSubmitModal}
                                    className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-300 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitForm.processing}
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition disabled:opacity-75"
                                >
                                    {submitForm.processing ? 'Mengumpulkan...' : 'Kumpul Tugas'}
                                </button>
                            </div>
                        </form>
                </div>
            </Modal>
        </>
    );
}
