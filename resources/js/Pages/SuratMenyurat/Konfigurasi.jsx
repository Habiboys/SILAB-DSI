import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";


const VARIABLES = [
    { token: "{nomor}", desc: "Nomor urut (misal: 1, 2, 3)" },
    { token: "{inisial_lab}", desc: "Inisial lab (misal: SI, TI)" },
    { token: "{bulan_romawi}", desc: "Bulan dalam angka romawi (I–XII)" },
    { token: "{tahun}", desc: "Tahun 4 digit (misal: 2025)" },
    { token: "{bulan}", desc: "Bulan 2 digit (01–12)" },
];

const Konfigurasi = ({ kepengurusanLab, konfigurasi }) => {
    const form = useForm({
        kepengurusan_lab_id:
            konfigurasi?.kepengurusan_lab_id || kepengurusanLab?.id || "",
        inisial_lab: konfigurasi?.inisial_lab || "LAB",
        format_nomor:
            konfigurasi?.format_nomor ||
            "{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}",
        reset_tiap_tahun: konfigurasi?.reset_tiap_tahun ?? true,
    });

    
    const generatePreview = () => {
        const bulanRomawi = [
            "I",
            "II",
            "III",
            "IV",
            "V",
            "VI",
            "VII",
            "VIII",
            "IX",
            "X",
            "XI",
            "XII",
        ];
        const now = new Date();
        return form.data.format_nomor
            .replace("{nomor}", "1")
            .replace("{inisial_lab}", form.data.inisial_lab)
            .replace("{bulan_romawi}", bulanRomawi[now.getMonth()])
            .replace("{tahun}", String(now.getFullYear()))
            .replace("{bulan}", String(now.getMonth() + 1).padStart(2, "0"));
    };

    const insertToken = (token) => {
        form.setData("format_nomor", form.data.format_nomor + token);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route("surat-menyurat.konfigurasi.upsert"), {
            onSuccess: () => toast.success("Konfigurasi berhasil disimpan"),
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                toast.error(msg || "Gagal menyimpan konfigurasi");
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Konfigurasi Surat" />

            <div className="max-w-2xl space-y-6">
                
                <button
                    onClick={() => history.back()}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                        Konfigurasi Format Nomor Surat
                    </h2>
                    {kepengurusanLab && (
                        <p className="text-sm text-gray-500 mb-5">
                            {kepengurusanLab.laboratorium?.nama} &mdash;{" "}
                            {kepengurusanLab.tahunKepengurusan?.tahun}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Inisial Laboratorium{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.data.inisial_lab}
                                onChange={(e) =>
                                    form.setData(
                                        "inisial_lab",
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                maxLength={20}
                                placeholder="Cth: SI, TI, RPL"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            />
                            {form.errors.inisial_lab && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.errors.inisial_lab}
                                </p>
                            )}
                        </div>

                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format Nomor Surat Keluar{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.data.format_nomor}
                                onChange={(e) =>
                                    form.setData("format_nomor", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {form.errors.format_nomor && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.errors.format_nomor}
                                </p>
                            )}

                            
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {VARIABLES.map((v) => (
                                    <button
                                        key={v.token}
                                        type="button"
                                        onClick={() => insertToken(v.token)}
                                        title={v.desc}
                                        className="px-2 py-0.5 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                                    >
                                        {v.token}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                Klik token di atas untuk menyisipkan ke format.
                            </p>
                        </div>

                        
                        <div className="bg-blue-50 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-1">
                                <Eye className="w-4 h-4" /> Preview
                            </div>
                            <p className="font-mono text-base text-blue-900">
                                {generatePreview()}
                            </p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                (contoh dengan nomor urut 1, bulan dan tahun
                                saat ini)
                            </p>
                        </div>

                        
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Token
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Keterangan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {VARIABLES.map((v) => (
                                        <tr key={v.token}>
                                            <td className="px-4 py-2 font-mono text-blue-700">
                                                {v.token}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {v.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.reset_tiap_tahun}
                                    onChange={(e) =>
                                        form.setData(
                                            "reset_tiap_tahun",
                                            e.target.checked,
                                        )
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                            </label>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    Reset nomor urut tiap tahun kepengurusan
                                </p>
                                <p className="text-xs text-gray-500">
                                    Jika aktif, nomor urut dimulai dari 1 setiap
                                    kepengurusan baru.
                                    {form.data.reset_tiap_tahun
                                        ? " Nomor surat sudah terisolasi per kepengurusan."
                                        : " Nomor urut akan terus lanjut lintas kepengurusan."}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => history.back()}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {form.processing
                                    ? "Menyimpan..."
                                    : "Simpan Konfigurasi"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Konfigurasi;
