import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import PesertaManager from "./PesertaManager";

const STATUS_BADGE = {
    diajukan: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    ditolak: "bg-red-100 text-red-800",
};

export default function KegiatanSertifikat({
    kegiatan,
    can,
    anggota = [],
    template = null,
}) {
    const isApproved = kegiatan.status_approval === "disetujui";

    return (
        <DashboardLayout>
            <Head title={`Peserta & Sertifikat: ${kegiatan.nama_kegiatan}`} />

            <div className="space-y-6">
                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Peserta &amp; Sertifikat
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {kegiatan.nama_kegiatan}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[kegiatan.status_approval] ?? "bg-gray-100 text-gray-800"}`}
                        >
                            {kegiatan.status_approval.charAt(0).toUpperCase() +
                                kegiatan.status_approval.slice(1)}
                        </span>
                        <Link
                            href={route("kegiatan.show", kegiatan.id)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm font-medium"
                        >
                            ← Kembali ke Detail
                        </Link>
                    </div>
                </div>

                {/* ── PESERTA MANAGER ──────────────────────────────────── */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">
                                Daftar Peserta &amp; Generate Sertifikat
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {kegiatan.peserta?.length ?? 0} peserta
                                terdaftar
                            </p>
                        </div>
                        {!isApproved && (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                                Tersedia setelah disetujui
                            </span>
                        )}
                    </div>
                    <PesertaManager
                        kegiatan={kegiatan}
                        can={can}
                        anggota={anggota}
                        template={template}
                        disabled={!isApproved}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
