import { Head, usePage } from '@inertiajs/react';
import { Award, Calendar, Download } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

export default function MyCertificates({ sertifikats }) {
    const { auth } = usePage().props;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <DashboardLayout>
            <Head title="Sertifikat Saya" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Sertifikat Saya</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Koleksi sertifikat dari kegiatan dan praktikum yang telah Anda selesaikan.
                        </p>
                    </div>
                </div>

                {sertifikats.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <Award className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Sertifikat</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Anda belum memiliki sertifikat yang diterbitkan. Sertifikat akan muncul di sini setelah Anda menyelesaikan kegiatan atau praktikum.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sertifikats.map((sertifikat) => (
                            <div 
                                key={sertifikat.id} 
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden flex flex-col"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Award className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                                            sertifikat.jenis_sertifikat === 'asisten' ? 'bg-purple-100 text-purple-800' :
                                            sertifikat.jenis_sertifikat === 'praktikan' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {sertifikat.jenis_sertifikat ? 
                                                sertifikat.jenis_sertifikat.charAt(0).toUpperCase() + sertifikat.jenis_sertifikat.slice(1) : 
                                                'Sertifikat'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                        {sertifikat.praktikum ? 
                                            `Praktikum ${sertifikat.praktikum.mata_kuliah}` : 
                                            sertifikat.kegiatan_name || 'Kegiatan SILAB'} 
                                            {/* Note: activity name might need to be joined in query or stored differently if not direct relation */}
                                    </h3>
                                    
                                    <div className="text-sm text-gray-500 mb-4">
                                        {sertifikat.nomor_sertifikat}
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>Diterbitkan: {formatDate(sertifikat.tanggal_terbit)}</span>
                                    </div>
                                    
                                    {sertifikat.kepengurusan_lab?.laboratorium && (
                                         <div className="text-xs text-gray-400 mt-2">
                                            {sertifikat.kepengurusan_lab.laboratorium.nama_laboratorium}
                                         </div>
                                    )}
                                </div>
                                
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                                    <a 
                                        href={route('sertifikat.download', sertifikat.id)}
                                        className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Docx
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
