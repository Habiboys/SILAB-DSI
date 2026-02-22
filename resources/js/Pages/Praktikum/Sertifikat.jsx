import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function PraktikumSertifikat({ praktikum, templates }) {
    const [activeTab, setActiveTab] = useState('praktikum');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [genProcessing, setGenProcessing] = useState(false);

    const { data: tmplData, setData: setTmplData, post: postTmpl, processing: tmplProcessing, reset: resetTmpl } = useForm({
        template: null,
        kategori: 'praktikum'
    });

    const handleTemplateUpload = (e) => {
        e.preventDefault();
        tmplData.kategori = activeTab;
        postTmpl(route('praktikum.sertifikat.template', praktikum.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Template berhasil diunggah');
                resetTmpl();
            },
            onError: () => toast.error('Gagal upload template')
        });
    };

    const handleGenerateConfirm = () => {
        if (selectedUsers.length === 0) {
            toast.error('Pilih minimal satu user');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleGenerateSubmit = () => {
        setShowConfirmModal(false);
        setGenProcessing(true);
        router.post(route('praktikum.sertifikat.generate', praktikum.id), {
            kategori: activeTab,
            user_ids: selectedUsers,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sertifikat berhasil digenerate');
                setSelectedUsers([]);
                setGenProcessing(false);
            },
            onError: (errors) => {
                console.error('Generate error:', errors);
                toast.error('Gagal generate sertifikat');
                setGenProcessing(false);
            }
        });
    };

    const toggleUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const toggleAll = (users) => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    // For praktikum tab: returns Praktikan models (with .user relation)
    // For aslab tab: returns User models directly
    const usersList = activeTab === 'praktikum' 
        ? praktikum.praktikans 
        : praktikum.aslab;

    const currentTemplate = templates.find(t => t.kategori === activeTab);

    return (
        <DashboardLayout>
            <Head title={`Sertifikat - ${praktikum.mata_kuliah}`} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Sertifikat Praktikum</h2>
                        <p className="text-sm text-gray-600 mt-1">{praktikum.mata_kuliah}</p>
                    </div>
                    <Link 
                        href={route('praktikum.index', {}, false) + (praktikum.kepengurusan_lab_id ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}` : '')}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Kembali
                    </Link>
                </div>

                {/* Tabs */}
                <div className="border-b px-6 bg-gray-50">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => { setActiveTab('praktikum'); setSelectedUsers([]); }}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'praktikum'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Sertifikat Praktikan
                        </button>
                        <button
                            onClick={() => { setActiveTab('aslab'); setSelectedUsers([]); }}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'aslab'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Sertifikat Asisten
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Template Status + Upload + Variable Guide */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-blue-900">Status Template</h4>
                                <p className="text-sm text-blue-700 mb-2">
                                    {currentTemplate 
                                        ? `Template "${currentTemplate.nama}" sudah diunggah.` 
                                        : 'Belum ada template yang diunggah.'}
                                </p>
                                <div className="mt-2 text-xs text-blue-800 bg-white/50 p-2 rounded border border-blue-200">
                                    <strong>Panduan Variabel (.docx):</strong> Gunakan format <code>{`\${nama_variabel}`}</code> pada dokumen Word Anda.
                                    <ul className="list-disc ml-5 mt-1 grid grid-cols-2 gap-x-4">
                                        <li><code>{`\${nama}`}</code> : Nama Tercetak</li>
                                        <li><code>{`\${nim}`}</code> : NIM / ID</li>
                                        <li><code>{`\${peran}`}</code> : Praktikan / Aslab</li>
                                        <li><code>{`\${praktikum}`}</code> : Nama Mata Kuliah</li>
                                        <li><code>{`\${tanggal}`}</code> : Tanggal Terbit</li>
                                        <li><code>{`\${nomor}`}</code> : Nomor Sertifikat</li>
                                        <li><code>{`\${lab}`}</code> : Nama Laboratorium</li>
                                        <li><code>{`\${qr_code}`}</code> : <span className="text-teal-700 font-medium">QR Code Verifikasi</span></li>
                                    </ul>
                                </div>
                            </div>
                            <form onSubmit={handleTemplateUpload} className="flex flex-col gap-2 md:w-64">
                                <input 
                                    type="file" 
                                    accept=".docx"
                                    onChange={e => setTmplData('template', e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50"
                                />
                                <button 
                                    type="submit" 
                                    disabled={tmplProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                >
                                    {tmplProcessing ? 'Uploading...' : 'Upload Template'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Generate Section */}
                    {currentTemplate && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-800">Pilih Penerima</h3>
                                <button
                                    onClick={handleGenerateConfirm}
                                    disabled={genProcessing || selectedUsers.length === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                >
                                    {genProcessing ? 'Generating...' : `Generate Untuk ${selectedUsers.length} Orang`}
                                </button>
                            </div>

                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-10">
                                                <input 
                                                    type="checkbox"
                                                    onChange={() => toggleAll(usersList.map(u => activeTab === 'praktikum' ? u.user : u))}
                                                    checked={selectedUsers.length > 0 && selectedUsers.length === usersList.length}
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM / Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {usersList.length === 0 ? (
                                            <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">Tidak ada data user.</td></tr>
                                        ) : (
                                            usersList.map(item => {
                                                const user = activeTab === 'praktikum' ? item.user : item;
                                                return (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(user.id)}
                                                                onChange={() => toggleUser(user.id)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{user.nim || user.email}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Generate Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Generate Sertifikat</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Anda akan men-generate sertifikat untuk <strong>{selectedUsers.length} orang</strong> pada kategori <strong>{activeTab === 'praktikum' ? 'Praktikan' : 'Asisten'}</strong>.
                                </p>
                                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                    ⚠️ Sertifikat yang sudah ada untuk orang-orang ini akan ditimpa.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerateSubmit}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                                Ya, Generate Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
