import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    BookOpen,
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    MapPin,
    Users
} from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '../../Layouts/DashboardLayout';
// We will need to adjust PertemuanIndex to be embedded or just use its logic
// Actually better to just import it and maybe pass a prop "isEmbedded" if needed or just use it.
// Wait, PertemuanIndex is a full page component with Layout. We need to strip the layout if we embed it.
// Or we can refactor PertemuanIndex to be a component "PertemuanList" and "PertemuanPage" uses it.
// For now, let's assume we might need to copy logic or refactor. 
// Let's check Pertemuan/Index.jsx content again. It uses DashboardLayout. 
// We should probably create a new component or refactor.
// Strategy: I will create the dashboard structure first, and for the tabs, I will ideally use proper components.
// I'll create the tabs content inline first or import if available.

// Since I cannot easily verify refactoring without reading again, I will implementing the Tabs structure first.

export default function PraktikumShow({ praktikum, pertemuanList, modulList, tugasList }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 className="w-4 h-4" /> },
        { id: 'pertemuan', label: 'Jadwal & Pertemuan', icon: <CalendarDays className="w-4 h-4" /> },
        { id: 'modul', label: 'Modul Praktikum', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'tugas', label: 'Tugas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'peserta', label: 'Peserta', icon: <Users className="w-4 h-4" /> },
        { id: 'sertifikat', label: 'Sertifikat', icon: <Award className="w-4 h-4" /> },
    ];

    return (
        <DashboardLayout>
            <Head title={`Dashboard - ${praktikum.mata_kuliah}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link 
                                    href={route('praktikum.index', {}, false) + (praktikum.kepengurusan_lab_id ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}` : '')}
                                    className="text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">{praktikum.mata_kuliah}</h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-7">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span>{praktikum.kepengurusan_lab?.laboratorium?.nama}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{praktikum.kepengurusan_lab?.tahun_kepengurusan?.tahun}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Status/Stats Cards could go here */}
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                {praktikum.kelas?.length || 0} Kelas
                            </div>
                            <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                                {pertemuanList?.length || 0} Pertemuan
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex overflow-x-auto border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daftar Kelas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {praktikum.kelas?.map((kelas) => (
                                            <div key={kelas.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900">{kelas.nama_kelas}</h4>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        kelas.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {kelas.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 mt-4">
                                                    {praktikum.jadwal_praktikum?.filter(j => j.kelas_id === kelas.id).map((jadwal, idx) => (
                                                        <div key={idx} className="flex items-center text-sm text-gray-600 gap-2">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{jadwal.hari}, {jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
                                                            <span className="text-gray-300">|</span>
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span>{jadwal.ruangan}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pertemuan' && (
                            <div>
                                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                                    <p className="font-medium">Manajemen Pertemuan & Absensi</p>
                                    <p>Silahkan klik tombol di bawah untuk mengelola pertemuan secara detail.</p>
                                </div>
                                <Link 
                                    href={route('praktikum.pertemuan.index', praktikum.id)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Kelola Pertemuan & Absensi
                                    {/* Note: Ideally we embed the PertemuanIndex logic here. 
                                        Since PertemuanIndex is a full page, for now I link to specific pages or 
                                        we need to refactor PertemuanIndex to be a component.
                                        
                                        For this MVP step, I will suggest to the user that I've created the dashboard 
                                        but full embedding requires refactoring PertemuanIndex. 
                                        
                                        ACTUALLY, I can iterate and just link them for now OR 
                                        Better: I will redirect `activeTab` specific actions to the existing pages temporarily until refactor.
                                    */}
                                </Link>
                                
                                <div className="mt-6">
                                    {/* Simple List View of Meetings */}
                                    <div className="grid gap-4">
                                        {pertemuanList.map((p, idx) => (
                                            <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center bg-white">
                                                <div>
                                                    <div className="font-medium text-gray-900">{p.judul}</div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {new Date(p.tanggal).toLocaleDateString('id-ID', {dateStyle: 'full'})} 
                                                        {p.kelas && <span className="ml-2">• {p.kelas.nama_kelas}</span>}
                                                    </div>
                                                </div>
                                                <Link 
                                                    href={route('praktikum.absensi.index', p.id)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-sm font-medium"
                                                >
                                                    Absensi
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'modul' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Daftar Modul</h3>
                                    <Link 
                                        href={route('praktikum.modul.index', praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Modul
                                    </Link>
                                </div>

                                {/* Module List */}
                                <div className="space-y-4">
                                    {modulList.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">Belum ada modul yang diupload.</p>
                                            <p className="text-sm text-gray-400 mt-1">Silahkan klik "Kelola Modul" untuk menambahkan.</p>
                                        </div>
                                    ) : (
                                        modulList.map((modul) => (
                                            <div key={modul.id} className="border rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{modul.judul}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <span>{modul.pertemuan?.judul}</span>
                                                            {modul.pertemuan?.kelas && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{modul.pertemuan.kelas.nama_kelas}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={`/storage/${modul.file_path}`} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 border rounded text-gray-600 hover:bg-gray-100 text-sm font-medium"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tugas' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Daftar Tugas</h3>
                                    <Link 
                                           href={route('praktikum.tugas.index', praktikum.id)}
                                           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                        >
                                            Kelola Semua Tugas
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    {tugasList && tugasList.length > 0 ? (
                                        tugasList.map((tugas) => (
                                        <div key={tugas.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900">{tugas.judul}</h4>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                            tugas.jenis === 'individu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {tugas.jenis}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{tugas.deskripsi}</p>
                                                    
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="w-3.5 h-3.5" />
                                                            <span>Deadline: {new Date(tugas.deadline).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span>Pertemuan: {tugas.pertemuan?.judul}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                     <Link 
                                                        href={route('praktikum.tugas.submissions', tugas.id)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-sm font-medium"
                                                    >
                                                        Lihat Pengumpulan
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Belum ada tugas yang diberikan.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'peserta' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Daftar Peserta</h3>
                                    <Link 
                                        href={route('praktikum.praktikan.index', praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Peserta
                                    </Link>
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Silahkan klik tombol "Kelola Peserta" untuk manajemen data praktikan secara lengkap.
                                </p>
                            </div>
                        )}

                        {activeTab === 'sertifikat' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Manajemen Sertifikat</h3>
                                    <Link 
                                        href={route('praktikum.sertifikat.index', praktikum.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Kelola Sertifikat
                                    </Link>
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Pengaturan template dan generate sertifikat untuk asisten dan praktikan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
