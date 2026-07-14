import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function PreviewPage({ kepengurusanLab, type }) {
    const isRangkuman = type === "rangkuman";

    const [form, setForm] = useState({
        dasar: "",
        judul_surat_keputusan: "",
        tanggal_sk: "",
        jadwal_kegiatan: "",
        kesimpulan: "",
        penutup: "",
        with_ttd: false,
    });
    const [previewUrl, setPreviewUrl] = useState("");
    const debounceRef = useRef(null);
    const pageNavPlugin = pageNavigationPlugin();

    const buildPreviewUrl = useCallback(
        (f) => {
            const params = {
                kepengurusan_lab_id: kepengurusanLab.id,
                type,
                ...(isRangkuman
                    ? {
                          dasar: f.dasar,
                          judul_surat_keputusan: f.judul_surat_keputusan,
                          tanggal_sk: f.tanggal_sk,
                          jadwal_kegiatan: f.jadwal_kegiatan,
                          kesimpulan: f.kesimpulan,
                          penutup: f.penutup,
                          with_ttd: f.with_ttd ? "true" : "false",
                      }
                    : {}),
            };
            return route("lpj-kepengurusan.preview", params);
        },
        [kepengurusanLab.id, type, isRangkuman],
    );

    useEffect(() => {
        setPreviewUrl(buildPreviewUrl(form));
    }, []);

    const handleChange = (field, value) => {
        const newForm = { ...form, [field]: value };
        setForm(newForm);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPreviewUrl(buildPreviewUrl(newForm));
        }, 700);
    };

    const handleDownload = () => {
        const params = {
            kepengurusan_lab_id: kepengurusanLab.id,
            type,
            ...(isRangkuman
                ? {
                      dasar: form.dasar,
                      judul_surat_keputusan: form.judul_surat_keputusan,
                      tanggal_sk: form.tanggal_sk,
                      jadwal_kegiatan: form.jadwal_kegiatan,
                      kesimpulan: form.kesimpulan,
                      penutup: form.penutup,
                      with_ttd: form.with_ttd ? "true" : "false",
                  }
                : {}),
        };
        const downloadUrl = route("lpj-kepengurusan.export-pdf", params);
        window.location.assign(downloadUrl);
    };

    const title = isRangkuman
        ? "Laporan Pertanggungjawaban Kepala Lab"
        : "Laporan Pertanggungjawaban Laboratorium";

    return (
        <DashboardLayout>
            <Head title={`Preview — ${title}`} />

            <div
                className="flex gap-4"
                style={{ height: "calc(100vh - 110px)" }}
            >
                
                <div className="w-72 shrink-0 flex flex-col gap-3">
                    <div className="bg-white rounded-lg shadow-sm border p-4 flex-1 overflow-y-auto">
                        <Link
                            href={route("proker.index", {
                                kepengurusan_lab_id: kepengurusanLab.id,
                            })}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm font-medium inline-flex items-center gap-1.5 mb-4"
                        >
                            &larr; Kembali ke Program Kerja
                        </Link>

                        <h2 className="font-semibold text-gray-800 text-sm mb-1">
                            {title}
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            {kepengurusanLab.laboratorium?.nama} ·{" "}
                            {kepengurusanLab.tahun_kepengurusan?.tahun}
                        </p>

                        {isRangkuman ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Dasar (Nomor SK)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.dasar}
                                        onChange={(e) =>
                                            handleChange(
                                                "dasar",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: SK No. 05/UN16.15.D/I/KPT/2025"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Judul Surat Keputusan
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.judul_surat_keputusan}
                                        onChange={(e) =>
                                            handleChange(
                                                "judul_surat_keputusan",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Penunjukan / Pengangkatan Kepala dan Anggota Laboratorium..."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tanggal SK
                                    </label>
                                    <input
                                        type="date"
                                        value={form.tanggal_sk}
                                        onChange={(e) =>
                                            handleChange(
                                                "tanggal_sk",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Jadwal Kegiatan
                                    </label>
                                    <input
                                        type="text"
                                        value={form.jadwal_kegiatan}
                                        onChange={(e) =>
                                            handleChange(
                                                "jadwal_kegiatan",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Januari - Desember 2025"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Kesimpulan
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.kesimpulan}
                                        onChange={(e) =>
                                            handleChange(
                                                "kesimpulan",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Kegiatan telah dilaksanakan dengan baik mencakup aspek manajerial, akademik, dan operasional laboratorium."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Penutup
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.penutup}
                                        onChange={(e) =>
                                            handleChange(
                                                "penutup",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Demikian laporan ini disampaikan, atas perhatian dan kesempatan yang diberikan diucapkan terima kasih."
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="with_ttd"
                                        checked={form.with_ttd}
                                        onChange={(e) =>
                                            handleChange(
                                                "with_ttd",
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="with_ttd"
                                        className="text-xs text-gray-700 cursor-pointer"
                                    >
                                        Sertakan tanda tangan digital
                                    </label>
                                </div>

                                <p className="text-xs text-gray-400 pt-1">
                                    Pratinjau diperbarui otomatis setelah
                                    selesai mengetik.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                                    Pratinjau menampilkan isi LPJ lengkap. Untuk
                                    mempercepat proses, foto dokumentasi tidak
                                    ditampilkan di pratinjau, tetapi tetap
                                    disertakan saat unduh PDF.
                                </div>
                            </div>
                        )}
                    </div>

                    
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download PDF
                    </button>
                </div>

                
                <div className="flex-1 rounded-lg overflow-hidden border bg-gray-100">
                    {previewUrl && (
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                            <div style={{ height: "100%" }}>
                                <Viewer
                                    key={previewUrl}
                                    fileUrl={previewUrl}
                                    plugins={[pageNavPlugin]}
                                    renderLoader={(percentages) => (
                                        <div className="flex flex-col items-center justify-center h-full gap-3">
                                            <svg
                                                className="animate-spin h-8 w-8 text-blue-500"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v8z"
                                                />
                                            </svg>
                                            <span className="text-sm text-gray-500">
                                                Memuat pratinjau…{" "}
                                                {Math.round(percentages)}%
                                            </span>
                                        </div>
                                    )}
                                    renderError={() => (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-sm text-red-500">
                                                Gagal memuat pratinjau.
                                            </p>
                                        </div>
                                    )}
                                />
                            </div>
                        </Worker>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
