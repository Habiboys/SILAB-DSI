import { Head } from "@inertiajs/react";
import StatusBadge from "@/Components/StatusBadge";

export default function PublicDetail({ aset, kategori, laboratorium }) {
    const kondisi = aset.keadaan || 'baik';
    const status = aset.status || 'tersedia';

    const tanggal = aset.created_at
        ? new Date(aset.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        })
        : '-';

    return (
        <>
            <Head title={`Detail Aset: ${aset.kode_barang}`} />

            <div className="min-h-screen bg-gradient-to-br from-neutral via-neutral to-neutral flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    
                    <div className="relative bg-base-100/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl">

                        
                        {aset.foto ? (
                            <div className="relative">
                                <img
                                    src={`/storage/${aset.foto}`}
                                    alt={aset.kode_barang}
                                    className="w-full h-52 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral/80 via-transparent to-transparent" />
                                
                                
                                <div className="absolute bottom-3 left-4 flex gap-2">
                                    <StatusBadge status={kondisi} />
                                    <StatusBadge status={status} />
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 bg-gradient-to-br from-primary to-primary flex items-center justify-center">
                                <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        )}

                        
                        <div className="p-5">
                            
                            <p className="text-xs text-info font-medium uppercase tracking-widest mb-1">
                                {laboratorium?.nama || 'Laboratorium'}
                            </p>

                            
                            <h1 className="text-xl font-bold text-white mb-1">
                                {kategori?.nama || 'Aset'}
                            </h1>

                            
                            <div className="inline-flex items-center gap-2 bg-base-100/10 rounded-lg px-3 py-1.5 mb-4">
                                <svg className="w-3.5 h-3.5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <span className="text-sm font-mono font-semibold text-white">{aset.kode_barang}</span>
                            </div>

                            
                            {!aset.foto && (
                                <div className="flex gap-2 mb-4">
                                    <StatusBadge status={kondisi} />
                                    <StatusBadge status={status} />
                                </div>
                            )}

                            {kategori?.deskripsi && (
                                <p className="text-sm text-white/50 mb-4">{kategori.deskripsi}</p>
                            )}

                            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                                <span className="text-xs text-white/30">{tanggal}</span>
                                <span className="text-[10px] text-white/20 font-medium tracking-wider">SILAB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
