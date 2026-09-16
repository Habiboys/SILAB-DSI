import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const GantiJadwalPiket = ({
    periodeAktif,
    jadwalAsisten,
    hariTersedia,
    labInfo,
    permintaan,
    allPeriode = [],
    filters = {},
    showForm,
    message,
    flash,
}) => {
    const { selected_kepengurusan } = usePage().props;
    const kepLabId = filters.kepengurusan_lab_id || selected_kepengurusan?.id;

    const queryParams = (overrides = {}) => {
        const p = {
            ...(kepLabId && { kepengurusan_lab_id: kepLabId }),
            ...(filters.periode_piket_id && {
                periode_piket_id: filters.periode_piket_id,
            }),
            perPage: filters.perPage ?? 10,
            ...overrides,
        };
        Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
        return p;
    };

    const [isFormOpen, setIsFormOpen] = useState(showForm);
    const [selectedJadwal, setSelectedJadwal] = useState(null);

    
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (message) toast.info(message);
    }, [flash, message]);

    const { data, setData, post, processing, errors, reset } = useForm({
        jadwal_piket_id: "",
        hari_baru: "",
        alasan: "",
    });

    const handleJadwalChange = (jadwalId) => {
        const jadwal = jadwalAsisten.find((j) => j.id === jadwalId);
        setSelectedJadwal(jadwal);
        setData("jadwal_piket_id", jadwalId);
        setData("hari_baru", "");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.jadwal_piket_id || !data.hari_baru || !data.alasan) {
            toast.warning("Harap lengkapi semua field!");
            return;
        }

        post(route("piket.ganti-jadwal.store"), {
            onSuccess: () => {
                toast.success("Permintaan ganti jadwal berhasil dikirim!");
                reset();
                setSelectedJadwal(null);
                setIsFormOpen(false);
            },
            onError: (errors) => {
                if (errors.alasan) toast.error(errors.alasan);
                else if (errors.hari_baru) toast.error(errors.hari_baru);
                else toast.error("Gagal mengirim permintaan ganti jadwal");
            },
        });
    };

    const dayNames = {
        senin: "Senin",
        selasa: "Selasa",
        rabu: "Rabu",
        kamis: "Kamis",
        jumat: "Jumat",
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-warning/20 text-warning";
            case "approved":
                return "bg-success/15 text-success";
            case "rejected":
                return "bg-error/15 text-error";
            default:
                return "bg-base-200 text-base-content";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "pending":
                return "Menunggu Persetujuan";
            case "approved":
                return "Disetujui";
            case "rejected":
                return "Ditolak";
            default:
                return "Tidak Diketahui";
        }
    };

    if (!periodeAktif) {
        return (
            <DashboardLayout>
                <Head title="Ganti Jadwal Piket" />

                <div className="bg-base-100 rounded-lg shadow-sm">
                    <div className="p-12 text-center">
                        <div className="mb-4 text-warning">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-base-content mb-2">
                            Tidak Ada Periode Aktif
                        </h3>
                        <p className="text-base-content/70">{message}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head title="Ganti Jadwal Piket" />

            <div className="space-y-6">
                
                <div className="bg-base-100 rounded-lg shadow-sm">
                    <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                        <div>
                            <h2 className="text-xl font-semibold text-base-content">
                                Ganti Jadwal Piket
                            </h2>
                            <p className="text-sm text-base-content/60 mt-1">
                                Periode: {periodeAktif.nama} - {labInfo?.nama}
                            </p>
                        </div>

                        <button
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition"
                        >
                            {isFormOpen ? "Tutup Form" : "Buat Permintaan Baru"}
                        </button>
                    </div>
                </div>

                
                {isFormOpen && (
                    <div className="bg-base-100 rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-base-content">
                                Form Permintaan Ganti Jadwal
                            </h3>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Jadwal Piket yang Akan Diganti
                                    </label>
                                    <select
                                        value={data.jadwal_piket_id}
                                        onChange={(e) =>
                                            handleJadwalChange(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    >
                                        <option value="">
                                            Pilih Jadwal Piket
                                        </option>
                                        {jadwalAsisten.map((jadwal) => (
                                            <option
                                                key={jadwal.id}
                                                value={jadwal.id}
                                            >
                                                {dayNames[jadwal.hari]} -{" "}
                                                {jadwal.user?.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.jadwal_piket_id && (
                                        <div className="text-error text-sm mt-1">
                                            {errors.jadwal_piket_id}
                                        </div>
                                    )}
                                </div>

                                
                                {selectedJadwal && (
                                    <div>
                                        <label className="block text-sm font-medium text-base-content mb-2">
                                            Ganti ke Hari
                                        </label>
                                        <select
                                            value={data.hari_baru}
                                            onChange={(e) =>
                                                setData(
                                                    "hari_baru",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        >
                                            <option value="">
                                                Pilih Hari Pengganti
                                            </option>
                                            {Array.isArray(hariTersedia)
                                                ? hariTersedia.map((hari) => (
                                                      <option
                                                          key={hari}
                                                          value={hari}
                                                      >
                                                          {dayNames[hari]}
                                                      </option>
                                                  ))
                                                : Object.values(
                                                      hariTersedia || {},
                                                  ).map((hari) => (
                                                      <option
                                                          key={hari}
                                                          value={hari}
                                                      >
                                                          {dayNames[hari]}
                                                      </option>
                                                  ))}
                                        </select>
                                        {(Array.isArray(hariTersedia)
                                            ? hariTersedia.length === 0
                                            : Object.keys(hariTersedia || {})
                                                  .length === 0) && (
                                            <p className="text-error text-sm mt-1">
                                                Tidak ada hari tersedia untuk
                                                ganti jadwal
                                                <br />
                                                <small>
                                                    Debug: Type=
                                                    {typeof hariTersedia},
                                                    Length=
                                                    {hariTersedia?.length},
                                                    IsArray=
                                                    {Array.isArray(
                                                        hariTersedia,
                                                    )}
                                                </small>
                                            </p>
                                        )}
                                        {errors.hari_baru && (
                                            <div className="text-error text-sm mt-1">
                                                {errors.hari_baru}
                                            </div>
                                        )}
                                    </div>
                                )}

                                
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Alasan Ganti Jadwal
                                    </label>
                                    <textarea
                                        value={data.alasan}
                                        onChange={(e) =>
                                            setData("alasan", e.target.value)
                                        }
                                        placeholder="Jelaskan alasan mengapa perlu ganti jadwal piket..."
                                        className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows="4"
                                        required
                                        minLength="10"
                                        maxLength="500"
                                    />
                                    <p className="text-xs text-base-content/60 mt-1">
                                        {data.alasan.length}/500 karakter
                                    </p>
                                    {errors.alasan && (
                                        <div className="text-error text-sm mt-1">
                                            {errors.alasan}
                                        </div>
                                    )}
                                </div>

                                
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFormOpen(false);
                                            reset();
                                            setSelectedJadwal(null);
                                        }}
                                        className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-content/30 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !data.jadwal_piket_id ||
                                            !data.hari_baru ||
                                            !data.alasan ||
                                            hariTersedia.length === 0
                                        }
                                        className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition ${
                                            processing ||
                                            !data.jadwal_piket_id ||
                                            !data.hari_baru ||
                                            !data.alasan ||
                                            hariTersedia.length === 0
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {processing
                                            ? "Mengirim..."
                                            : "Kirim Permintaan"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                
                <div className="bg-base-100 rounded-lg shadow-sm">
                    
                    <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h3 className="text-lg font-medium text-base-content">
                            Status dan Riwayat Permintaan
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">
                            
                            {allPeriode.length > 0 && (
                                <select
                                    value={filters.periode_piket_id ?? ""}
                                    onChange={(e) =>
                                        router.get(
                                            route("piket.ganti-jadwal.index"),
                                            queryParams({
                                                periode_piket_id:
                                                    e.target.value || undefined,
                                            }),
                                            {
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        )
                                    }
                                    className="text-sm border border-base-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Semua Periode</option>
                                    {allPeriode.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama}
                                            {p.isactive ? " ✓" : ""}
                                        </option>
                                    ))}
                                </select>
                            )}

                            
                            <select
                                value={filters.perPage ?? 10}
                                onChange={(e) =>
                                    router.get(
                                        route("piket.ganti-jadwal.index"),
                                        queryParams({
                                            perPage: e.target.value,
                                        }),
                                        { preserveScroll: true, replace: true },
                                    )
                                }
                                className="text-sm border border-base-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {[5, 10, 25, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n} per halaman
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-6">
                        {permintaan?.data?.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-base-content/50 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-12 w-12 mx-auto"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <p className="text-base-content/60">
                                    {filters.periode_piket_id
                                        ? "Tidak ada permintaan untuk periode ini"
                                        : "Belum ada permintaan ganti jadwal"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(permintaan?.data ?? []).map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-sm font-semibold text-base-content">
                                                        {
                                                            dayNames[
                                                                item.hari_lama
                                                            ]
                                                        }{" "}
                                                        →{" "}
                                                        {
                                                            dayNames[
                                                                item.hari_baru
                                                            ]
                                                        }
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                                                    >
                                                        {getStatusText(
                                                            item.status,
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-base-content/70 mt-1">
                                                    <span className="font-medium">
                                                        Periode:
                                                    </span>{" "}
                                                    {item.periodePiket
                                                        ?.nama ?? (
                                                        <span className="italic text-base-content/50">
                                                            —
                                                        </span>
                                                    )}
                                                </p>

                                                <p className="text-sm text-base-content/60 mt-1">
                                                    <span className="font-medium">
                                                        Alasan:
                                                    </span>{" "}
                                                    {item.alasan}
                                                </p>

                                                {item.catatan_admin && (
                                                    <p className="text-sm text-base-content/60 mt-1">
                                                        <span className="font-medium">
                                                            Catatan Admin:
                                                        </span>{" "}
                                                        {item.catatan_admin}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-base-content/60">
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </p>
                                                {item.approved_by && (
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        Diproses oleh:{" "}
                                                        {item.approvedBy
                                                            ?.name ?? "—"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        
                        {permintaan?.last_page > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-sm text-base-content/60">
                                    Menampilkan {permintaan.from}–
                                    {permintaan.to} dari {permintaan.total}{" "}
                                    permintaan
                                </p>
                                <div className="flex items-center gap-1">
                                    
                                    <button
                                        disabled={!permintaan.prev_page_url}
                                        onClick={() =>
                                            router.get(
                                                permintaan.prev_page_url,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="px-3 py-1.5 text-sm border border-base-300 rounded-md hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        ‹ Sebelumnya
                                    </button>

                                    
                                    {Array.from(
                                        { length: permintaan.last_page },
                                        (_, i) => i + 1,
                                    )
                                        .filter(
                                            (p) =>
                                                p === 1 ||
                                                p === permintaan.last_page ||
                                                Math.abs(
                                                    p - permintaan.current_page,
                                                ) <= 1,
                                        )
                                        .reduce((acc, p, idx, arr) => {
                                            if (
                                                idx > 0 &&
                                                arr[idx - 1] !== p - 1
                                            )
                                                acc.push("...");
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, idx) =>
                                            p === "..." ? (
                                                <span
                                                    key={`e-${idx}`}
                                                    className="px-2 py-1.5 text-sm text-base-content/50"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                "piket.ganti-jadwal.index",
                                                            ),
                                                            queryParams({
                                                                page: p,
                                                            }),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className={`px-3 py-1.5 text-sm border rounded-md ${
                                                        p ===
                                                        permintaan.current_page
                                                            ? "bg-primary text-white border-primary"
                                                            : "border-base-300 hover:bg-base-200"
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ),
                                        )}

                                    
                                    <button
                                        disabled={!permintaan.next_page_url}
                                        onClick={() =>
                                            router.get(
                                                permintaan.next_page_url,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="px-3 py-1.5 text-sm border border-base-300 rounded-md hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Selanjutnya ›
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GantiJadwalPiket;
