import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_BADGE = {
    draft: "bg-gray-100 text-gray-700",
    review: "bg-yellow-100 text-yellow-800",
    disetujui: "bg-green-100 text-green-800",
    terkunci: "bg-indigo-100 text-indigo-800",
};

export default function LpjKepengurusanIndex({
    items = [],
    kepengurusanLab,
    summary,
    can,
}) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        kepengurusan_lab_id: kepengurusanLab?.id || "",
        judul: kepengurusanLab
            ? `LPJ Final ${kepengurusanLab?.laboratorium?.nama ?? ""} ${kepengurusanLab?.tahun_kepengurusan?.tahun ?? ""}`.trim()
            : "",
        nomor_dokumen: "",
        ringkasan: "",
    });

    const submitGenerate = (e) => {
        e.preventDefault();
        post(route("lpj-kepengurusan.generate"), {
            onSuccess: () => {
                toast.success("LPJ final berhasil digenerate");
                setShowForm(false);
                reset("nomor_dokumen", "ringkasan");
            },
            onError: () => toast.error("Gagal generate LPJ final"),
        });
    };

    const formatDateTime = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <DashboardLayout>
            <Head title="LPJ Final Kepengurusan" />

            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                LPJ Final Kepengurusan
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Rekap akhir periode dari proker dan kegiatan.
                            </p>
                        </div>
                        {can?.generate && kepengurusanLab && (
                            <button
                                onClick={() => setShowForm((v) => !v)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                                {showForm ? "Tutup Form" : "Generate LPJ Final"}
                            </button>
                        )}
                    </div>

                    {!kepengurusanLab && (
                        <div className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            Konteks kepengurusan belum dipilih.
                        </div>
                    )}

                    {showForm && (
                        <form
                            onSubmit={submitGenerate}
                            className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50"
                        >
                            <input
                                type="hidden"
                                value={data.kepengurusan_lab_id}
                                onChange={() => {}}
                            />

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Judul LPJ
                                </label>
                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={(e) =>
                                        setData("judul", e.target.value)
                                    }
                                    className="w-full border-gray-300 rounded-md"
                                />
                                {errors.judul && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.judul}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Dokumen (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={data.nomor_dokumen}
                                    onChange={(e) =>
                                        setData("nomor_dokumen", e.target.value)
                                    }
                                    className="w-full border-gray-300 rounded-md"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ringkasan Eksekutif
                                </label>
                                <textarea
                                    rows={4}
                                    value={data.ringkasan}
                                    onChange={(e) =>
                                        setData("ringkasan", e.target.value)
                                    }
                                    className="w-full border-gray-300 rounded-md"
                                />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-3 py-2 border rounded-md text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
                                >
                                    {processing ? "Memproses..." : "Generate"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card
                            label="Total Proker"
                            value={summary.total_proker}
                        />
                        <Card
                            label="Proker Disetujui"
                            value={summary.proker_disetujui}
                        />
                        <Card
                            label="Total Kegiatan"
                            value={summary.total_kegiatan}
                        />
                        <Card
                            label="Kegiatan Disetujui"
                            value={summary.kegiatan_disetujui}
                        />
                        <Card
                            label="Total LPJ Kegiatan"
                            value={summary.total_laporan_kegiatan}
                        />
                        <Card
                            label="Total Dokumentasi"
                            value={summary.total_dokumentasi_kegiatan}
                        />
                        <Card
                            label="Capaian Rata-rata"
                            value={
                                summary.persentase_capaian_rata2 != null
                                    ? `${summary.persentase_capaian_rata2}%`
                                    : "-"
                            }
                        />
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Judul
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Generated
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Belum ada LPJ final.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-800">
                                                {item.judul}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.nomor_dokumen ||
                                                    "Tanpa nomor dokumen"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[item.status] || "bg-gray-100 text-gray-700"}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDateTime(item.generated_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route(
                                                    "lpj-kepengurusan.show",
                                                    item.id,
                                                )}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Detail
                                            </Link>
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
