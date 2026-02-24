import { Head, Link, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function KegiatanEdit({ kegiatan, proker }) {
    const { data, setData, put, processing, errors } = useForm({
        nama_kegiatan: kegiatan.nama_kegiatan || "",
        proker_id: kegiatan.proker_id || "",
        deskripsi_kegiatan: kegiatan.deskripsi_kegiatan || "",
        tipe_kegiatan: kegiatan.tipe_kegiatan || "offline",
        lokasi: kegiatan.lokasi || "",
        link_meeting: kegiatan.link_meeting || "",
        tanggal_mulai: kegiatan.tanggal_mulai
            ? String(kegiatan.tanggal_mulai).substring(0, 10)
            : "",
        tanggal_selesai: kegiatan.tanggal_selesai
            ? String(kegiatan.tanggal_selesai).substring(0, 10)
            : "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("kegiatan.update", kegiatan.id), {
            onSuccess: () => toast.success("Kegiatan berhasil diperbarui"),
            onError: () => toast.error("Gagal memperbarui kegiatan"),
        });
    };

    return (
        <DashboardLayout>
            <Head title={`Edit Kegiatan: ${kegiatan.nama_kegiatan}`} />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <div className="border-b pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Edit Kegiatan
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Perbarui detail kegiatan yang belum disetujui.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama Kegiatan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Kegiatan
                        </label>
                        <input
                            type="text"
                            value={data.nama_kegiatan}
                            onChange={(e) =>
                                setData("nama_kegiatan", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contoh: Pelatihan Dasar Android"
                            required
                        />
                        {errors.nama_kegiatan && (
                            <div className="text-red-500 text-xs mt-1">
                                {errors.nama_kegiatan}
                            </div>
                        )}
                    </div>

                    {/* Proker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Program Kerja Terkait
                        </label>
                        <select
                            value={data.proker_id}
                            onChange={(e) =>
                                setData("proker_id", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Pilih Program Kerja</option>
                            {proker.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.deskripsi}
                                    {p.struktur
                                        ? ` (${p.struktur.struktur})`
                                        : ""}
                                </option>
                            ))}
                        </select>
                        {errors.proker_id && (
                            <div className="text-red-500 text-xs mt-1">
                                {errors.proker_id}
                            </div>
                        )}
                    </div>

                    {/* Tanggal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={data.tanggal_mulai}
                                onChange={(e) =>
                                    setData("tanggal_mulai", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {errors.tanggal_mulai && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.tanggal_mulai}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={data.tanggal_selesai}
                                onChange={(e) =>
                                    setData("tanggal_selesai", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {errors.tanggal_selesai && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.tanggal_selesai}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi Kegiatan
                        </label>
                        <textarea
                            value={data.deskripsi_kegiatan}
                            onChange={(e) =>
                                setData("deskripsi_kegiatan", e.target.value)
                            }
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Jelaskan detail kegiatan..."
                        ></textarea>
                        {errors.deskripsi_kegiatan && (
                            <div className="text-red-500 text-xs mt-1">
                                {errors.deskripsi_kegiatan}
                            </div>
                        )}
                    </div>

                    {/* Tipe + Lokasi + Link */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Kegiatan
                            </label>
                            <select
                                value={data.tipe_kegiatan}
                                onChange={(e) =>
                                    setData("tipe_kegiatan", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="offline">Offline</option>
                                <option value="online">Online</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lokasi / Tempat
                            </label>
                            <input
                                type="text"
                                value={data.lokasi}
                                onChange={(e) =>
                                    setData("lokasi", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Contoh: Aula Gedung A, Lantai 2"
                            />
                            {errors.lokasi && (
                                <div className="text-red-500 text-xs mt-1">
                                    {errors.lokasi}
                                </div>
                            )}
                        </div>
                        {(data.tipe_kegiatan === "online" ||
                            data.tipe_kegiatan === "hybrid") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Link Meeting
                                </label>
                                <input
                                    type="text"
                                    value={data.link_meeting}
                                    onChange={(e) =>
                                        setData("link_meeting", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://meet.google.com/..."
                                />
                                {errors.link_meeting && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.link_meeting}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 flex justify-end space-x-3">
                        <Link
                            href={route("kegiatan.show", kegiatan.id)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
