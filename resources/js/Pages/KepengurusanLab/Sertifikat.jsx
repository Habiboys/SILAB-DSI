import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../Layouts/DashboardLayout";

const formatTanggal = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

export default function KepengurusanSertifikat({
    kepengurusanLab,
    template,
    anggota = [],
}) {
    const [selectedUsers, setSelectedUsers] = useState([]);

    const { data, setData, post, processing, reset } = useForm({
        template: null,
    });

    const activeAnggota = useMemo(
        () => anggota.filter((item) => item.is_active),
        [anggota],
    );

    const handleTemplateUpload = (e) => {
        e.preventDefault();
        if (!data.template) {
            toast.error("Pilih file template terlebih dahulu");
            return;
        }

        post(
            route("kepengurusan-lab.sertifikat.template", kepengurusanLab.id),
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Template berhasil diunggah");
                    reset();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal upload template");
                },
            },
        );
    };

    const toggleUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const toggleAll = () => {
        if (selectedUsers.length === activeAnggota.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(activeAnggota.map((item) => item.user_id));
        }
    };

    const handleGenerate = () => {
        if (!template) {
            toast.error("Template belum diunggah");
            return;
        }
        if (selectedUsers.length === 0) {
            toast.error("Pilih minimal satu anggota");
            return;
        }
        if (!confirm("Generate sertifikat untuk anggota terpilih?")) return;

        router.post(
            route("kepengurusan-lab.sertifikat.generate", kepengurusanLab.id),
            { user_ids: selectedUsers },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Sertifikat berhasil digenerate");
                    setSelectedUsers([]);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal generate sertifikat");
                },
            },
        );
    };

    const backUrl =
        route("kepengurusan-lab.index") +
        (kepengurusanLab?.laboratorium_id
            ? `?lab_id=${kepengurusanLab.laboratorium_id}`
            : "");

    return (
        <DashboardLayout>
            <Head title="Sertifikat Kepengurusan" />

            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Sertifikat Kepengurusan
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {kepengurusanLab?.laboratorium?.nama ||
                                "Laboratorium"}
                            {kepengurusanLab?.tahunKepengurusan?.tahun
                                ? ` • ${kepengurusanLab.tahunKepengurusan.tahun}`
                                : ""}
                        </p>
                    </div>
                    <Link
                        href={backUrl}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Kembali
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b">
                        <h3 className="text-base font-semibold text-gray-800">
                            Template Sertifikat
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {template
                                ? `Template "${template.nama}" sudah diunggah.`
                                : "Belum ada template yang diunggah."}
                        </p>
                        <div className="mt-3 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-md p-3">
                            <strong>Panduan Variabel (.docx):</strong> gunakan
                            format <code>{"${nama_variabel}"}</code>.
                            <ul className="list-disc ml-5 mt-2 grid grid-cols-2 gap-x-4">
                                <li>
                                    <code>{"${nama}"}</code> : Nama Tercetak
                                </li>
                                <li>
                                    <code>{"${nim}"}</code> : NIM / ID
                                </li>
                                <li>
                                    <code>{"${peran}"}</code> : Jabatan/Peran
                                </li>
                                <li>
                                    <code>{"${lab}"}</code> : Nama Laboratorium
                                </li>
                                <li>
                                    <code>{"${tahun}"}</code> : Tahun
                                    Kepengurusan
                                </li>
                                <li>
                                    <code>{"${tanggal}"}</code> : Tanggal Terbit
                                </li>
                                <li>
                                    <code>{"${nomor}"}</code> : Nomor Sertifikat
                                </li>
                                <li>
                                    <code>{"${qr_code}"}</code> : QR Verifikasi
                                </li>
                            </ul>
                        </div>
                    </div>
                    <form
                        onSubmit={handleTemplateUpload}
                        className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                        <input
                            type="file"
                            accept=".docx"
                            onChange={(e) =>
                                setData("template", e.target.files[0])
                            }
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50"
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                            {processing ? "Mengunggah..." : "Upload Template"}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-base font-semibold text-gray-800">
                                Daftar Anggota Kepengurusan
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {anggota.length} anggota terdaftar
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                        >
                            Generate Sertifikat
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedUsers.length > 0 &&
                                                selectedUsers.length ===
                                                    activeAnggota.length
                                            }
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        NIM
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Peran
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {anggota.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-6 text-center text-sm text-gray-500"
                                        >
                                            Tidak ada anggota
                                        </td>
                                    </tr>
                                )}
                                {anggota.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(
                                                    item.user_id,
                                                )}
                                                onChange={() =>
                                                    toggleUser(item.user_id)
                                                }
                                                disabled={!item.is_active}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.nama || "-"}
                                            {!item.is_active && (
                                                <span className="ml-2 text-xs text-gray-400">
                                                    (Nonaktif)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.nim || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.peran}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.sertifikat
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {item.sertifikat
                                                    ? "Sudah"
                                                    : "Belum"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {item.sertifikat ? (
                                                <Link
                                                    href={route(
                                                        "sertifikat.download",
                                                        item.sertifikat.id,
                                                    )}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Download
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
