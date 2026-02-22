
import { Menu, Transition } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Calendar, ChevronDown, ChevronRight, ClipboardList, Download, Edit, Trash2, Users } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import ConfirmModal from '../../Components/ConfirmModal';
import Modal from '../../Components/Modal';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function PertemuanIndex({ praktikum, pertemuan }) {
    const [showForm, setShowForm] = useState(false);
    const [editingPertemuan, setEditingPertemuan] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState(praktikum.kelas?.[0]?.id || ''); // activeTab is now always a class_id

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        judul: '',
        deskripsi: '',
        tanggal: '',
        kelas_id: ''
    });

    // Filter pertemuan based on active tab
    const filteredPertemuan = pertemuan.filter(p => {
        return p.kelas_id === activeTab;
    });

    const handleEdit = (p) => {
        setEditingPertemuan(p);
        setData({
            judul: p.judul,
            deskripsi: p.deskripsi || '',
            tanggal: p.tanggal ? p.tanggal.split('T')[0] : '',
            kelas_id: p.kelas_id || ''
        });
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingPertemuan(null);
        reset();
        setData({
            judul: '',
            deskripsi: '',
            tanggal: '',
            kelas_id: activeTab || ''
        });
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPertemuan) {
            put(route('praktikum.pertemuan.update', editingPertemuan.id), {
                onSuccess: () => {
                    toast.success('Pertemuan berhasil diperbarui');
                    setShowForm(false);
                    reset();
                },
                onError: () => toast.error('Gagal memperbarui pertemuan')
            });
        } else {
            post(route('praktikum.pertemuan.store', praktikum.id), {
                onSuccess: () => {
                    toast.success('Pertemuan berhasil ditambahkan');
                    setShowForm(false);
                    reset();
                },
                onError: () => toast.error('Gagal menambahkan pertemuan')
            });
        }
    };

    const confirmDelete = (p) => {
        setMeetingToDelete(p);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (meetingToDelete) {
            destroy(route('praktikum.pertemuan.destroy', meetingToDelete.id), {
                onSuccess: () => {
                    toast.success('Pertemuan berhasil dihapus');
                    setShowDeleteModal(false);
                    setMeetingToDelete(null);
                },
                onError: () => toast.error('Gagal menghapus pertemuan')
            });
        }
    };

    return (
        <DashboardLayout>
            <Head title={`Pertemuan - ${praktikum.mata_kuliah}`} />

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Link href={route('praktikum.index', {}, false) + (praktikum.kepengurusan_lab_id ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}` : '')} className="hover:text-blue-600">Praktikum</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span>Pertemuan</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">{praktikum.mata_kuliah}</h2>
                        <p className="text-gray-600">Kelola jadwal pertemuan dan modul per kelas.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            href={route('praktikum.index', {}, false) + (praktikum.kepengurusan_lab_id ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}` : '')}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Kembali
                        </Link>
                        {/* Export Dropdown */}
                        <Menu as="div" className="relative inline-block text-left">
                            <div>
                                <Menu.Button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    <span>Export Absensi</span>
                                    <ChevronDown className="w-4 h-4" />
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <a
                                                    href={activeTab ? route('praktikum.absensi.export-praktikan', { praktikum: praktikum.id, kelasId: activeTab }) : '#'}
                                                    className={`${
                                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2 ${!activeTab ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Absensi Praktikan
                                                </a>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <a
                                                    href={activeTab ? route('praktikum.absensi.export-aslab', { praktikum: praktikum.id, kelasId: activeTab }) : '#'}
                                                    className={`${
                                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2 ${!activeTab ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Absensi Aslab
                                                </a>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>

                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                        >
                            <span>+ Buat Pertemuan</span>
                        </button>
                    </div>
                </div>

                {/* Tags/Tabs Navigation */}
                <div className="px-6 border-b border-gray-100 flex overflow-x-auto hide-scrollbar">
                    {praktikum.kelas && praktikum.kelas.map(k => (
                        <button
                            key={k.id}
                            onClick={() => setActiveTab(k.id)}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === k.id 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {k.nama_kelas}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="p-6 bg-gray-50/50 min-h-[400px]">
                    {filteredPertemuan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Belum ada pertemuan</h3>
                            <p className="text-gray-500 mt-1 max-w-sm">
                                "Belum ada pertemuan khusus untuk kelas ini."
                            </p>
                            <button
                                onClick={handleCreate}
                                className="mt-4 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                            >
                                + Buat Pertemuan Baru
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredPertemuan.map((p, index) => (
                                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                                                    Pertemuan {index + 1}
                                                </span>
                                                {p.kelas ? (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                        <Users className="w-3 h-3" />
                                                        {p.kelas.nama_kelas}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                                        <Users className="w-3 h-3" />
                                                        Umum (Semua Kelas)
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(p.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                {/* Attendance Status Badges */}
                                                {(!p.absensi_praktikan || p.absensi_praktikan.length === 0) && (
                                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                                                        <ClipboardList className="w-3 h-3" />
                                                        Absen Praktikan Kosong
                                                    </span>
                                                )}
                                                {(!p.absensi_aslab || p.absensi_aslab.length === 0) && (
                                                    <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                                                        <ClipboardList className="w-3 h-3" />
                                                        Absen Aslab Kosong
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {p.judul}
                                            </h4>
                                            
                                            {p.deskripsi && (
                                                <p className="text-sm text-gray-600 mt-2 leading-relaxed border-l-2 border-gray-200 pl-3">
                                                    {p.deskripsi}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                href={route('praktikum.absensi.index', p.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                Absensi
                                            </Link>
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(p)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showForm} onClose={() => setShowForm(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                        {editingPertemuan ? 'Edit Pertemuan' : 'Tambah Pertemuan Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pertemuan <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    value={data.judul}
                                    onChange={e => setData('judul', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Contoh: Pertemuan 1 - Pengenalan Dasar"
                                />
                                {errors.judul && <div className="text-red-500 text-xs mt-1">{errors.judul}</div>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
                                <input 
                                    type="date"
                                    value={data.tanggal}
                                    onChange={e => setData('tanggal', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.tanggal && <div className="text-red-500 text-xs mt-1">{errors.tanggal}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Untuk Kelas <span className="text-red-500">*</span></label>
                                <select
                                    value={data.kelas_id}
                                    onChange={e => setData('kelas_id', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {praktikum.kelas && praktikum.kelas.map(k => (
                                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                                    ))}
                                </select>
                                {errors.kelas_id && <div className="text-red-500 text-xs mt-1">{errors.kelas_id}</div>}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (Opsional)</label>
                                <textarea 
                                    value={data.deskripsi}
                                    onChange={e => setData('deskripsi', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Jelaskan secara singkat materi atau agenda pertemuan ini..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Pertemuan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal 
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Pertemuan"
                message={`Apakah Anda yakin ingin menghapus pertemuan "${meetingToDelete?.judul}"? Data absensi dan modul terkait mungkin akan terhapus.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}
