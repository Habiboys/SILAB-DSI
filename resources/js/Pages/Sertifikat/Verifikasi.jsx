import { Head } from '@inertiajs/react';
import { Award, BookOpen, Building2, Calendar, CheckCircle, Hash, User, XCircle } from 'lucide-react';

export default function Verifikasi({ valid, nomor, data }) {
    return (
        <>
            <Head title="Verifikasi Sertifikat" />

            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

                {/* Logo */}
                <div className="mb-6 text-center">
                    <img
                        src="/images/logo_unand.png"
                        alt="Logo Universitas Andalas"
                        className="h-16 mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-500">Sistem Informasi Laboratorium</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md overflow-hidden">

                    {/* Status Header */}
                    <div className={`px-6 py-4 border-b ${valid ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                        <div className="flex items-center gap-3">
                            {valid
                                ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                            }
                            <div>
                                <p className={`text-sm font-semibold ${valid ? 'text-green-800' : 'text-red-700'}`}>
                                    {valid ? 'Sertifikat Terverifikasi' : 'Sertifikat Tidak Ditemukan'}
                                </p>
                                <p className={`text-xs mt-0.5 ${valid ? 'text-green-600' : 'text-red-500'}`}>
                                    {valid
                                        ? 'Dokumen ini diakui dan diterbitkan oleh sistem.'
                                        : 'Nomor sertifikat ini tidak terdaftar dalam sistem.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-5">

                        {/* Nomor sertifikat */}
                        <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 leading-none mb-0.5">Nomor Sertifikat</p>
                                <p className="text-sm font-mono text-gray-700">{nomor}</p>
                            </div>
                        </div>

                        {valid && data ? (
                            <div className="space-y-3">
                                <InfoRow icon={<User className="w-4 h-4 text-gray-400" />} label="Nama" value={data.nama} />
                                {data.nim && (
                                    <InfoRow icon={<Hash className="w-4 h-4 text-gray-400" />} label="NIM" value={data.nim} />
                                )}
                                <InfoRow
                                    icon={<Award className="w-4 h-4 text-gray-400" />}
                                    label="Jenis Sertifikat"
                                    value={<JenisBadge jenis={data.jenis} />}
                                />
                                {data.praktikum && (
                                    <InfoRow icon={<BookOpen className="w-4 h-4 text-gray-400" />} label="Mata Kuliah / Kegiatan" value={data.praktikum} />
                                )}
                                {data.lab && (
                                    <InfoRow icon={<Building2 className="w-4 h-4 text-gray-400" />} label="Laboratorium" value={data.lab} />
                                )}
                                <InfoRow
                                    icon={<Calendar className="w-4 h-4 text-gray-400" />}
                                    label="Tanggal Terbit"
                                    value={data.tanggal_terbit}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Data sertifikat dengan nomor ini tidak ditemukan. Hubungi administrator laboratorium jika Anda merasa ada kesalahan.
                            </p>
                        )}
                    </div>

                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
                        Diverifikasi oleh SILAB &middot; {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <div className="text-sm text-gray-800 font-medium">{value ?? '-'}</div>
            </div>
        </div>
    );
}

function JenisBadge({ jenis }) {
    const map = {
        praktikan: { label: 'Sertifikat Praktikan', cls: 'bg-green-100 text-green-800' },
        asisten:   { label: 'Sertifikat Asisten',   cls: 'bg-purple-100 text-purple-800' },
        kepengurusan: { label: 'Sertifikat Kepengurusan', cls: 'bg-blue-100 text-blue-800' },
        kegiatan:  { label: 'Sertifikat Kegiatan',  cls: 'bg-orange-100 text-orange-800' },
    };
    const item = map[jenis] ?? { label: jenis, cls: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded ${item.cls}`}>
            {item.label}
        </span>
    );
}
