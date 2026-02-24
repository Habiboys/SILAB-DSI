import { router, useForm } from "@inertiajs/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../Components/ConfirmModal";

export default function PesertaManager({
    kegiatan,
    can,
    anggota = [],
    template = null,
    disabled = false,
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingPeserta, setDeletingPeserta] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showConfirmGen, setShowConfirmGen] = useState(false);
    const [genProcessing, setGenProcessing] = useState(false);

    // Add peserta form
    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: "",
        peran: "peserta",
    });

    const availableAnggota = anggota.filter(
        (a) => !kegiatan.peserta?.some((p) => p.user_id === a.id),
    );

    const submitAdd = (e) => {
        e.preventDefault();
        post(route("kegiatan.peserta.store", kegiatan.id), {
            onSuccess: () => {
                toast.success("Peserta berhasil ditambahkan");
                reset();
                setShowAddForm(false);
            },
            onError: (errs) =>
                toast.error(errs.user_id ?? "Gagal menambahkan peserta"),
        });
    };

    // Delete peserta
    const confirmDelete = () => {
        router.delete(
            route("kegiatan.peserta.destroy", {
                kegiatan: kegiatan.id,
                pesertaId: deletingPeserta.id,
            }),
            {
                onSuccess: () => {
                    toast.success("Peserta dihapus");
                    setDeletingPeserta(null);
                },
                onError: () => toast.error("Gagal menghapus peserta"),
            },
        );
    };

    // Template upload
    const {
        data: tmpl,
        setData: setTmpl,
        post: postTmpl,
        processing: tmplProc,
        reset: resetTmpl,
    } = useForm({ template: null });
    const submitTemplate = (e) => {
        e.preventDefault();
        postTmpl(route("kegiatan.template.upload", kegiatan.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Template berhasil diunggah");
                resetTmpl();
            },
            onError: () => toast.error("Gagal upload template"),
        });
    };

    // Checkbox selection
    const pesertaList = kegiatan.peserta ?? [];
    const toggleUser = (userId) =>
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    const toggleAll = () =>
        setSelectedUsers(
            selectedUsers.length === pesertaList.length
                ? []
                : pesertaList.map((p) => p.user_id),
        );

    // Generate
    const handleGenerateSubmit = () => {
        setShowConfirmGen(false);
        setGenProcessing(true);
        router.post(
            route("kegiatan.sertifikat.generate", kegiatan.id),
            { user_ids: selectedUsers },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Sertifikat berhasil digenerate");
                    setSelectedUsers([]);
                    setGenProcessing(false);
                },
                onError: () => {
                    toast.error("Gagal generate sertifikat");
                    setGenProcessing(false);
                },
            },
        );
    };

    return (
        <div className="p-6">
            {/* ── TEMPLATE PANEL (selalu tampil, mirip Praktikum) ── */}
            {!disabled && can.create && (
                <div
                    className={`border rounded-lg p-4 mb-6 ${
                        template
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-100"
                    }`}
                >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {template ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 flex-shrink-0">
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-400 flex-shrink-0">
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </span>
                                )}
                                <h4
                                    className={`text-sm font-medium ${
                                        template
                                            ? "text-green-900"
                                            : "text-blue-900"
                                    }`}
                                >
                                    Status Template Sertifikat
                                </h4>
                            </div>
                            <p
                                className={`text-sm mb-2 ${
                                    template
                                        ? "text-green-700"
                                        : "text-blue-700"
                                }`}
                            >
                                {template
                                    ? `✓ Template "${template.nama ?? template}" sudah diunggah. Anda dapat upload ulang untuk mengganti.`
                                    : "Belum ada template. Upload file .docx untuk mulai generate sertifikat."}
                            </p>
                            <div
                                className={`mt-2 text-xs p-2 rounded border bg-white/60 ${
                                    template
                                        ? "text-green-800 border-green-200"
                                        : "text-blue-800 border-blue-200"
                                }`}
                            >
                                <strong>Panduan Variabel (.docx):</strong>{" "}
                                Gunakan format{" "}
                                <code>{`\${nama_variabel}`}</code> pada dokumen
                                Word Anda.
                                <ul className="list-disc ml-5 mt-1 grid grid-cols-2 gap-x-4">
                                    <li>
                                        <code>{`\${nama}`}</code> : Nama
                                    </li>
                                    <li>
                                        <code>{`\${nim}`}</code> : NIM (Nomor
                                        Induk)
                                    </li>
                                    <li>
                                        <code>{`\${peran}`}</code> : Peran
                                    </li>
                                    <li>
                                        <code>{`\${kegiatan}`}</code> : Nama
                                        Kegiatan
                                    </li>
                                    <li>
                                        <code>{`\${tanggal}`}</code> : Tanggal
                                        Terbit
                                    </li>
                                    <li>
                                        <code>{`\${nomor}`}</code> : Nomor
                                        Sertifikat
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <form
                            onSubmit={submitTemplate}
                            className="flex flex-col gap-2 md:w-64 flex-shrink-0"
                        >
                            <input
                                type="file"
                                accept=".docx"
                                onChange={(e) =>
                                    setTmpl("template", e.target.files[0])
                                }
                                className={`block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white ${
                                    template
                                        ? "file:text-green-700 hover:file:bg-green-50"
                                        : "file:text-blue-700 hover:file:bg-blue-50"
                                }`}
                            />
                            <button
                                type="submit"
                                disabled={tmplProc}
                                className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 ${
                                    template
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {tmplProc
                                    ? "Uploading..."
                                    : template
                                      ? "Ganti Template"
                                      : "Upload Template"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── TAMBAH PESERTA ─── */}
            {!disabled && can.create && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowAddForm((v) => !v)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                        {showAddForm ? "Batal" : "+ Tambah Peserta"}
                    </button>
                </div>
            )}

            {showAddForm && !disabled && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">
                        Tambah Peserta
                    </h4>
                    <form
                        onSubmit={submitAdd}
                        className="flex flex-wrap gap-3 items-end"
                    >
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Anggota
                            </label>
                            <select
                                value={data.user_id}
                                onChange={(e) =>
                                    setData("user_id", e.target.value)
                                }
                                className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            >
                                <option value="">Pilih anggota...</option>
                                {availableAnggota.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.user_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Peran
                            </label>
                            <select
                                value={data.peran}
                                onChange={(e) =>
                                    setData("peran", e.target.value)
                                }
                                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="peserta">Peserta</option>
                                <option value="panitia">Panitia</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={processing || !data.user_id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                        >
                            {processing ? "Menambahkan..." : "Tambah"}
                        </button>
                    </form>
                    {availableAnggota.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                            Semua anggota sudah terdaftar.
                        </p>
                    )}
                </div>
            )}

            {/* ── TABEL PESERTA ─── */}
            {pesertaList.length > 0 ? (
                <>
                    {/* Generate button */}
                    {can.create && !disabled && (
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm text-gray-500">
                                {selectedUsers.length > 0
                                    ? `${selectedUsers.length} dipilih`
                                    : "Pilih peserta untuk generate sertifikat"}
                            </p>
                            <button
                                onClick={() => {
                                    if (selectedUsers.length === 0) {
                                        toast.error(
                                            "Pilih minimal satu peserta",
                                        );
                                        return;
                                    }
                                    setShowConfirmGen(true);
                                }}
                                disabled={
                                    genProcessing || selectedUsers.length === 0
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                            >
                                {genProcessing
                                    ? "Generating..."
                                    : `Generate Untuk ${selectedUsers.length} Orang`}
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {can.create && !disabled && (
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={toggleAll}
                                                checked={
                                                    selectedUsers.length > 0 &&
                                                    selectedUsers.length ===
                                                        pesertaList.length
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Peran
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sertifikat
                                    </th>
                                    {can.create && !disabled && (
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pesertaList.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        {can.create && !disabled && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(
                                                        p.user_id,
                                                    )}
                                                    onChange={() =>
                                                        toggleUser(p.user_id)
                                                    }
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {p.user?.name ?? "-"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${p.peran === "panitia" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                                            >
                                                {p.peran
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    p.peran.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {p.file_sertifikat ? (
                                                <a
                                                    href={`/storage/${p.file_sertifikat}`}
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Download{" "}
                                                    {p.no_sertifikat && (
                                                        <span className="text-gray-400">
                                                            ({p.no_sertifikat})
                                                        </span>
                                                    )}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">
                                                    Belum ada
                                                </span>
                                            )}
                                        </td>
                                        {can.create && !disabled && (
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        setDeletingPeserta(p)
                                                    }
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500 italic py-2">
                    Belum ada peserta terdaftar.
                </p>
            )}

            {/* Delete confirm */}
            <ConfirmModal
                show={!!deletingPeserta}
                onClose={() => setDeletingPeserta(null)}
                onConfirm={confirmDelete}
                title="Hapus Peserta"
                message={`Hapus ${deletingPeserta?.user?.name} dari daftar peserta?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            {/* Generate confirm modal */}
            {showConfirmGen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Konfirmasi Generate Sertifikat
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Sertifikat akan digenerate untuk{" "}
                                    <strong>
                                        {selectedUsers.length} orang
                                    </strong>{" "}
                                    yang dipilih.
                                </p>
                                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                    ⚠️ Sertifikat yang sudah ada untuk peserta
                                    ini akan ditimpa.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmGen(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerateSubmit}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                                Ya, Generate Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
