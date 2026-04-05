import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { toast } from "sonner";

const STATUS_BADGE = {
    draft: "bg-gray-100 text-gray-700",
    review: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    terkunci: "bg-indigo-100 text-indigo-800",
};

export default function LpjKepengurusanShow({ lpj, detail, can }) {
    const action = (routeName, confirmMessage, successMessage) => {
        if (!window.confirm(confirmMessage)) return;
        router.patch(
            route(routeName, lpj.id),
            {},
            {
                onSuccess: () => toast.success(successMessage),
                onError: () => toast.error("Aksi gagal diproses"),
            },
        );
    };

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <DashboardLayout>
            <Head title={`LPJ Final - ${lpj.judul}`} />

            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex flex-wrap justify-between gap-3">
                        <div>
                            <Link
                                href={route("lpj-kepengurusan.index")}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                ← Kembali ke daftar LPJ Final
                            </Link>
                            <h1 className="mt-2 text-xl font-semibold text-gray-900">
                                {lpj.judul}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {lpj.kepengurusan_lab?.laboratorium?.nama} ·
                                Tahun{" "}
                                {
                                    lpj.kepengurusan_lab?.tahun_kepengurusan
                                        ?.tahun
                                }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                No. Dokumen: {lpj.nomor_dokumen || "-"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[lpj.status] || "bg-gray-100 text-gray-700"}`}
                            >
                                {lpj.status}
                            </span>

                            <Link
                                href={route(
                                    "lpj-kepengurusan.export-pdf",
                                    lpj.id,
                                )}
                                className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                            >
                                Export PDF
                            </Link>

                            {can?.manage && lpj.status !== "terkunci" && (
                                <button
                                    onClick={() =>
                                        action(
                                            "lpj-kepengurusan.refresh",
                                            "Perbarui ringkasan LPJ dari data terbaru?",
                                            "Data LPJ berhasil diperbarui",
                                        )
                                    }
                                    className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                                >
                                    Refresh Data
                                </button>
                            )}

                            {can?.manage && lpj.status === "draft" && (
                                <button
                                    onClick={() =>
                                        action(
                                            "lpj-kepengurusan.submit",
                                            "Ajukan LPJ ini ke tahap review?",
                                            "LPJ diajukan untuk review",
                                        )
                                    }
                                    className="px-3 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                                >
                                    Ajukan Review
                                </button>
                            )}

                            {can?.approve &&
                                (lpj.status === "draft" ||
                                    lpj.status === "review") && (
                                    <button
                                        onClick={() =>
                                            action(
                                                "lpj-kepengurusan.approve",
                                                "Setujui LPJ final ini?",
                                                "LPJ final disetujui",
                                            )
                                        }
                                        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                    >
                                        Setujui
                                    </button>
                                )}

                            {can?.approve && lpj.status === "disetujui" && (
                                <button
                                    onClick={() =>
                                        action(
                                            "lpj-kepengurusan.lock",
                                            "Kunci LPJ ini? Setelah dikunci tidak bisa diubah.",
                                            "LPJ final terkunci",
                                        )
                                    }
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                                >
                                    Kunci Final
                                </button>
                            )}
                        </div>
                    </div>

                    {lpj.ringkasan && (
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Ringkasan Eksekutif
                            </h3>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                                {lpj.ringkasan}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card label="Total Proker" value={lpj.total_proker} />
                    <Card
                        label="Proker Disetujui"
                        value={lpj.proker_disetujui}
                    />
                    <Card label="Proker Selesai" value={lpj.proker_selesai} />
                    <Card label="Total Kegiatan" value={lpj.total_kegiatan} />
                    <Card
                        label="Kegiatan Disetujui"
                        value={lpj.kegiatan_disetujui}
                    />
                    <Card
                        label="Total LPJ Kegiatan"
                        value={lpj.total_laporan_kegiatan}
                    />
                    <Card
                        label="Total Dokumentasi"
                        value={lpj.total_dokumentasi_kegiatan}
                    />
                    <Card
                        label="Capaian Rata-rata"
                        value={
                            lpj.persentase_capaian_rata2 != null
                                ? `${lpj.persentase_capaian_rata2}%`
                                : "-"
                        }
                    />
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <div className="px-4 py-3 border-b">
                        <h2 className="text-sm font-semibold text-gray-800">
                            Rekap Proker & Kegiatan
                        </h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Program Kerja
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Capaian
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ringkasan Kegiatan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(detail?.prokers || []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-sm text-gray-500"
                                    >
                                        Tidak ada data proker.
                                    </td>
                                </tr>
                            ) : (
                                detail.prokers.map((proker) => (
                                    <tr key={proker.id}>
                                        <td className="px-4 py-3 align-top">
                                            <div className="text-sm font-medium text-gray-800">
                                                {proker.nama_proker}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {proker.struktur || "-"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-gray-600">
                                            <div>
                                                Pengajuan:{" "}
                                                {proker.status_pengajuan}
                                            </div>
                                            <div>
                                                Pelaksanaan: {proker.status}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top text-sm text-gray-600">
                                            {proker.persentase_capaian != null
                                                ? `${proker.persentase_capaian}%`
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="space-y-1">
                                                {(proker.kegiatan || [])
                                                    .length === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        Belum ada kegiatan.
                                                    </p>
                                                ) : (
                                                    proker.kegiatan.map(
                                                        (kegiatan) => (
                                                            <div
                                                                key={
                                                                    kegiatan.id
                                                                }
                                                                className="text-xs text-gray-700 bg-gray-50 rounded p-2 border"
                                                            >
                                                                <p className="font-medium text-gray-800">
                                                                    {
                                                                        kegiatan.nama_kegiatan
                                                                    }
                                                                </p>
                                                                <p>
                                                                    {formatDate(
                                                                        kegiatan.tanggal_mulai,
                                                                    )}{" "}
                                                                    -{" "}
                                                                    {formatDate(
                                                                        kegiatan.tanggal_selesai,
                                                                    )}{" "}
                                                                    ·{" "}
                                                                    {
                                                                        kegiatan.status_approval
                                                                    }
                                                                </p>
                                                                <p>
                                                                    Peserta:{" "}
                                                                    {
                                                                        kegiatan.jumlah_peserta
                                                                    }{" "}
                                                                    · LPJ:{" "}
                                                                    {
                                                                        kegiatan.jumlah_laporan
                                                                    }{" "}
                                                                    · Dok:{" "}
                                                                    {
                                                                        kegiatan.jumlah_dokumentasi
                                                                    }
                                                                </p>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

function Card({ label, value }) {
    return (
        <div className="bg-white border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
                {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
                {value ?? "-"}
            </p>
        </div>
    );
}
