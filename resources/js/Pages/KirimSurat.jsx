import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/* ─── Recipient Picker Modal ─────────────────────────────────────── */
function PenerimaPicker({
    penerima,
    laboratorium,
    tahunKepengurusan,
    value,
    onChange,
    error,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filterLab, setFilterLab] = useState("");
    const [filterTahun, setFilterTahun] = useState("");
    const [tempId, setTempId] = useState(value);
    const searchRef = useRef(null);

    const selected = penerima.find((u) => u.id === value) ?? null;

    const filtered = useMemo(() => {
        return penerima.filter((u) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                (u.name ?? "").toLowerCase().includes(q) ||
                (u.nomor_induk ?? "").toLowerCase().includes(q) ||
                (u.jabatan ?? "").toLowerCase().includes(q);
            // Use .labs / .tahuns arrays so users in multiple kepengurusan match any of them
            const matchLab = !filterLab || (u.labs ?? []).includes(filterLab);
            const matchTahun =
                !filterTahun || (u.tahuns ?? []).includes(String(filterTahun));
            return matchSearch && matchLab && matchTahun;
        });
    }, [penerima, search, filterLab, filterTahun]);

    const openModal = () => {
        setTempId(value);
        setSearch("");
        setFilterLab("");
        setFilterTahun("");
        setOpen(true);
        setTimeout(() => searchRef.current?.focus(), 80);
    };

    const confirm = () => {
        onChange(tempId);
        setOpen(false);
    };

    const clear = (e) => {
        e.stopPropagation();
        onChange("");
        setTempId("");
    };

    return (
        <>
            {/* Trigger */}
            <div
                onClick={openModal}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer transition-colors
                    ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-blue-400"}
                    focus-within:ring-2 focus-within:ring-blue-500`}
            >
                {selected ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {selected.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {selected.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {selected.jabatan} · {selected.nomor_induk}
                            </p>
                        </div>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">
                        Cari & pilih penerima...
                    </span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {selected && (
                        <button
                            type="button"
                            onClick={clear}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                        >
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                    <svg
                        className="w-4 h-4 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {/* Modal */}
            <Modal show={open} onClose={() => setOpen(false)} maxWidth="lg">
                <div className="flex flex-col max-h-[80vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
                        <h3 className="text-base font-semibold text-gray-800">
                            Pilih Penerima Surat
                        </h3>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg
                                className="w-5 h-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="px-5 py-3 border-b space-y-2 flex-shrink-0">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, NIM/NIP, atau jabatan..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterLab}
                                onChange={(e) => setFilterLab(e.target.value)}
                                className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Semua Lab</option>
                                {laboratorium.map((l) => (
                                    <option key={l.id} value={l.nama}>
                                        {l.nama}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterTahun}
                                onChange={(e) => setFilterTahun(e.target.value)}
                                className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Semua Tahun</option>
                                {tahunKepengurusan.map((t) => (
                                    <option key={t.id} value={String(t.tahun)}>
                                        {t.tahun}
                                        {t.isactive ? " (Aktif)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-sm text-gray-400">
                                <svg
                                    className="mx-auto w-8 h-8 mb-2 text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                Tidak ada pengguna ditemukan
                            </div>
                        ) : (
                            filtered.map((u) => {
                                const isSelected = tempId === u.id;
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => setTempId(u.id)}
                                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-gray-100 last:border-0
                                            ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                                            ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                                        >
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {u.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {u.jabatan} · {u.nomor_induk}
                                            </p>
                                        </div>
                                        {/* Check */}
                                        {isSelected && (
                                            <svg
                                                className="w-5 h-5 text-blue-600 flex-shrink-0"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
                        <p className="text-xs text-gray-500">
                            {filtered.length} dari {penerima.length} pengguna
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirm}
                                disabled={!tempId}
                                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40"
                            >
                                Pilih
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function KirimSurat({
    flash,
    penerima = [],
    laboratorium = [],
    tahunKepengurusan = [],
    canCreateResmi = false,
    myLabs = [],
}) {
    const [previewFile, setPreviewFile] = useState(null);
    // 'sistem' = user di sistem, 'luar' = nama bebas (hanya untuk resmi)
    const [penerimaMode, setPenerimaMode] = useState("sistem");

    const form = useForm({
        tipe_surat: "pribadi",
        nomor_surat: "",
        tanggal_surat: new Date().toISOString().split("T")[0],
        penerima_id: "",
        penerima_nama_luar: "",
        lab_id: "",
        perihal: "",
        file: null,
    });

    const isResmi = form.data.tipe_surat === "resmi";

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            form.setData("file", file);
            setPreviewFile(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.data.nomor_surat) {
            toast.error("Nomor surat harus diisi");
            return;
        }
        if (isResmi && !form.data.lab_id) {
            toast.error("Lab pengirim harus dipilih untuk surat resmi");
            return;
        }
        if (!isResmi && !form.data.penerima_id) {
            toast.error("Penerima harus dipilih");
            return;
        }
        if (isResmi && penerimaMode === "sistem" && !form.data.penerima_id) {
            toast.error("Penerima harus dipilih");
            return;
        }
        if (
            isResmi &&
            penerimaMode === "luar" &&
            !form.data.penerima_nama_luar.trim()
        ) {
            toast.error("Nama penerima luar harus diisi");
            return;
        }
        if (!form.data.perihal) {
            toast.error("Perihal surat harus diisi");
            return;
        }
        if (!form.data.file) {
            toast.error("File surat harus diunggah");
            return;
        }

        form.post(route("surat.store"), {
            onSuccess: () => {
                toast.success("Surat berhasil dikirim");
                form.reset();
                setPreviewFile(null);
            },
            onError: (errors) => {
                if (errors.message) toast.error(errors.message);
                else toast.error("Gagal mengirim surat");
            },
            forceFormData: true,
        });
    };

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Kirim Surat" />

            {/* Breadcrumb */}
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Kirim Surat
                    </h1>
                    <div className="flex text-sm text-gray-500 mt-1">
                        <a href="/dashboard" className="hover:text-blue-600">
                            Home
                        </a>
                        <span className="mx-2">/</span>
                        <a href="#" className="hover:text-blue-600">
                            Surat Menyurat
                        </a>
                        <span className="mx-2">/</span>
                        <span>Kirim Surat</span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-6 p-6">
                        {/* ── Tipe Surat Toggle (hanya tampil jika punya izin resmi) ── */}
                        {canCreateResmi && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipe Surat
                                </label>
                                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                                    {["pribadi", "resmi"].map((tipe) => (
                                        <button
                                            key={tipe}
                                            type="button"
                                            onClick={() => {
                                                form.setData(
                                                    "tipe_surat",
                                                    tipe,
                                                );
                                                form.clearErrors();
                                            }}
                                            className={`px-5 py-2 text-sm font-medium transition-colors capitalize
                                                ${
                                                    form.data.tipe_surat ===
                                                    tipe
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {tipe === "pribadi"
                                                ? "📧 Pribadi"
                                                : "🏛️ Resmi (Atas Nama Lab)"}
                                        </button>
                                    ))}
                                </div>
                                {isResmi && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Surat ini akan tercatat sebagai surat
                                        resmi laboratorium dan dapat dilihat
                                        oleh Admin &amp; Sekretaris lab.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Lab Pengirim (resmi only) ── */}
                        {isResmi && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lab Pengirim{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={form.data.lab_id}
                                    onChange={(e) =>
                                        form.setData("lab_id", e.target.value)
                                    }
                                >
                                    <option value="">
                                        -- Pilih Laboratorium --
                                    </option>
                                    {myLabs.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.nama}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.lab_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {form.errors.lab_id}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Kolom Kiri */}
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Surat{" "}
                                    {isResmi && (
                                        <span className="text-xs text-gray-400">
                                            (harus unik per lab)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={
                                        isResmi
                                            ? "Contoh: 001/SILAB/RPL/II/2026"
                                            : "Masukan Nomor Surat"
                                    }
                                    value={form.data.nomor_surat}
                                    onChange={(e) =>
                                        form.setData(
                                            "nomor_surat",
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.nomor_surat && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {form.errors.nomor_surat}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Surat
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.data.tanggal_surat}
                                    onChange={(e) =>
                                        form.setData(
                                            "tanggal_surat",
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.tanggal_surat && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {form.errors.tanggal_surat}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan */}
                        <div>
                            {/* Penerima: untuk resmi ada toggle sistem/luar */}
                            {isResmi ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Penerima
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        {[
                                            {
                                                val: "sistem",
                                                label: "Anggota Sistem",
                                            },
                                            {
                                                val: "luar",
                                                label: "Pihak Luar",
                                            },
                                        ].map((opt) => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => {
                                                    setPenerimaMode(opt.val);
                                                    form.setData(
                                                        "penerima_id",
                                                        "",
                                                    );
                                                    form.setData(
                                                        "penerima_nama_luar",
                                                        "",
                                                    );
                                                }}
                                                className={`px-3 py-1 text-xs rounded-full border transition-colors
                                                    ${
                                                        penerimaMode === opt.val
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {penerimaMode === "sistem" ? (
                                        <PenerimaPicker
                                            penerima={penerima}
                                            laboratorium={laboratorium}
                                            tahunKepengurusan={
                                                tahunKepengurusan
                                            }
                                            value={form.data.penerima_id}
                                            onChange={(id) =>
                                                form.setData("penerima_id", id)
                                            }
                                            error={form.errors.penerima_id}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nama instansi / penerima luar..."
                                            value={form.data.penerima_nama_luar}
                                            onChange={(e) =>
                                                form.setData(
                                                    "penerima_nama_luar",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    )}
                                    {form.errors.penerima_nama_luar && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {form.errors.penerima_nama_luar}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pilih Penerima
                                    </label>
                                    <PenerimaPicker
                                        penerima={penerima}
                                        laboratorium={laboratorium}
                                        tahunKepengurusan={tahunKepengurusan}
                                        value={form.data.penerima_id}
                                        onChange={(id) =>
                                            form.setData("penerima_id", id)
                                        }
                                        error={form.errors.penerima_id}
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Perihal
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Perihal Surat"
                                    value={form.data.perihal}
                                    onChange={(e) =>
                                        form.setData("perihal", e.target.value)
                                    }
                                />
                                {form.errors.perihal && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {form.errors.perihal}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload File Surat
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                {!previewFile ? (
                                    <div className="py-8 flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                        />
                                        <svg
                                            className="h-12 w-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Drag and drop file di sini, atau
                                        </p>
                                        <label
                                            htmlFor="file-upload"
                                            className="mt-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Pilih file
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            PDF hingga 5MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-[400px] overflow-hidden">
                                        <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
                                            <div className="flex items-center">
                                                <svg
                                                    className="h-5 w-5 text-gray-500 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700 truncate">
                                                    {form.data.file.name}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    form.setData("file", null);
                                                    setPreviewFile(null);
                                                }}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                        <iframe
                                            src={previewFile}
                                            className="w-full h-full"
                                            title="Preview Surat"
                                        />
                                    </div>
                                )}
                            </div>
                            {form.errors.file && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.errors.file}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end px-6 py-4 bg-gray-50 border-t">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={form.processing}
                        >
                            {form.processing ? "Mengirim..." : "Kirim"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
