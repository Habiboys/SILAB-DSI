import React, { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "@/Components/LabContext";

const RekapAbsen = ({
    rekapAbsensi,
    jadwalByDay,
    periode,
    periodes,
    tahunKepengurusan,
    laboratorium,
    currentTahunId,
    currentLabId,
    flash,
}) => {
    // Get the authenticated user
    const { auth } = usePage().props;

    // Use the lab context to get the selected lab
    const { selectedLab } = useLab();

    // Penentuan akses hanya di frontend
    const canAccess =
        auth.user &&
        auth.user.roles.some((role) =>
            ["admin", "kalab", "superadmin", "kadep"].includes(role)
        );

    // State for filters
    const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || "");
    const [selectedTahun, setSelectedTahun] = useState(currentTahunId || "");
    const [activeTab, setActiveTab] = useState("jadwal"); // 'jadwal' or 'rekap'

    // Auto select tahun aktif jika belum ada tahun terpilih
    useEffect(() => {
        if (
            (!selectedTahun ||
                !tahunKepengurusan.find((t) => t.id == selectedTahun)) &&
            tahunKepengurusan &&
            tahunKepengurusan.length > 0
        ) {
            // Cari tahun aktif
            const tahunAktif = tahunKepengurusan.find((t) => t.isactive);
            if (tahunAktif) {
                setSelectedTahun(tahunAktif.id.toString());
            } else {
                setSelectedTahun(tahunKepengurusan[0].id.toString());
            }
        }
    }, [tahunKepengurusan]);

    // Handler untuk perubahan tahun
    const handleTahunChange = (e) => {
        setSelectedTahun(e.target.value);
    };

    // Handler untuk perubahan lab
    useEffect(() => {
        if (canAccess && selectedLab) {
            router.get(
                route("piket.rekap-absen"),
                {
                    lab_id: selectedLab.id,
                    tahun_id: selectedTahun,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }
    }, [selectedLab, selectedTahun]);

    // Handler untuk perubahan tahun (untuk admin/kalab)
    useEffect(() => {
        if (canAccess && selectedTahun) {
            router.get(
                route("piket.rekap-absen"),
                {
                    tahun_id: selectedTahun,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }
    }, [selectedTahun]);

    // Pastikan URL selalu mengandung lab_id dan tahun_id saat sudah ada selectedLab dan selectedTahun
    useEffect(() => {
        // Cek jika sudah ada selectedLab dan selectedTahun
        if (canAccess && selectedLab && selectedTahun) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLabId = urlParams.get("lab_id");
            const urlTahunId = urlParams.get("tahun_id");
            // Jika lab_id belum ada di URL, trigger router.get
            if (selectedLab.id && urlLabId !== String(selectedLab.id)) {
                router.get(
                    route("piket.rekap-absen"),
                    {
                        lab_id: selectedLab.id,
                        tahun_id: selectedTahun,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    }
                );
            }
        }
    }, [canAccess, selectedLab, selectedTahun]);

    // Handle period selection change
    const handlePeriodeChange = (e) => {
        const periodeId = e.target.value;
        setSelectedPeriode(periodeId);

        // Prepare query parameters
        const params = {
            periode_id: periodeId,
        };

        // Add lab_id filter for superadmin/kadep
        if (selectedLab) {
            params.lab_id = selectedLab.id;
        }

        // Add tahun_id filter
        if (selectedTahun) {
            params.tahun_id = selectedTahun;
        }

        // Navigate with filters
        router.get(route("piket.rekap-absen"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Format currency (for denda/fine)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case "hadir":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-blue-100 text-blue-800";
            case "tidak hadir":
            default:
                return "bg-red-100 text-red-800";
        }
    };

    // Get day name in Indonesian
    const getDayName = (day) => {
        const dayNames = {
            senin: "Senin",
            selasa: "Selasa",
            rabu: "Rabu",
            kamis: "Kamis",
            jumat: "Jumat",
        };
        return dayNames[day] || day;
    };

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.message) {
            toast.info(flash.message);
        }
    }, [flash]);

    // Determine max number of petugas columns dynamically (default to 5)
    const maxPetugas = React.useMemo(() => {
        if (!jadwalByDay || Object.keys(jadwalByDay).length === 0) return 5;
        const counts = Object.keys(jadwalByDay).map(
            (day) => jadwalByDay[day]?.length || 0
        );
        const maxCount = counts.length ? Math.max(...counts) : 0;
        return Math.max(5, maxCount);
    }, [jadwalByDay]);

    return (
        <DashboardLayout>
            <Head title="Rekap Absensi" />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Rekap Absensi
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            {/* Tahun selection (untuk user yang bisa akses) */}
                            {canAccess && (
                                <div className="w-full sm:w-auto">
                                    <select
                                        value={selectedTahun}
                                        onChange={handleTahunChange}
                                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Pilih Tahun</option>
                                        {tahunKepengurusan?.map((tahun) => (
                                            <option
                                                key={tahun.id}
                                                value={tahun.id}
                                            >
                                                {tahun.tahun}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Period selection - for all users */}
                            <div className="w-full sm:w-auto">
                                <select
                                    id="periode"
                                    value={selectedPeriode}
                                    onChange={handlePeriodeChange}
                                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {!periodes || periodes.length === 0 ? (
                                        <option value="">
                                            Tidak ada periode
                                        </option>
                                    ) : (
                                        <>
                                            <option value="">
                                                Pilih Periode
                                            </option>
                                            {periodes.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Info banner for filter selection */}
                    {canAccess && selectedLab && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center text-blue-700">
                                <svg
                                    className="h-5 w-5 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 000-2v-3a1 1 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    Menampilkan data untuk{" "}
                                    <strong>{selectedLab.nama}</strong>
                                    {selectedTahun && tahunKepengurusan && (
                                        <>
                                            {" "}
                                            pada tahun{" "}
                                            <strong>
                                                {tahunKepengurusan.find(
                                                    (t) => t.id == selectedTahun
                                                )?.tahun || "-"}
                                            </strong>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {!selectedLab && canAccess ? (
                    <div className="p-12 text-center">
                        <div className="mb-4 text-yellow-500">
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Pilih Laboratorium
                        </h3>
                        <p className="text-gray-600">
                            Silakan pilih laboratorium terlebih dahulu untuk
                            melihat rekap absensi.
                        </p>
                    </div>
                ) : !periode ? (
                    <div className="p-12 text-center">
                        <div className="mb-4 text-yellow-500">
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tidak Ada Periode Piket
                        </h3>
                        <p className="text-gray-600">
                            Silakan pilih periode piket untuk melihat rekap
                            absensi.
                        </p>
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Tabs */}
                        <div className="flex border-b mb-4">
                            <button
                                onClick={() => setActiveTab("jadwal")}
                                className={`px-4 py-2 font-medium text-sm ${
                                    activeTab === "jadwal"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                Jadwal Mingguan
                            </button>
                            <button
                                onClick={() => setActiveTab("rekap")}
                                className={`px-4 py-2 font-medium text-sm ${
                                    activeTab === "rekap"
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                Rekap Kehadiran
                            </button>
                        </div>

                        {/* Jadwal Mingguan Tab */}
                        {activeTab === "jadwal" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hari
                                            </th>
                                            {Array.from(
                                                { length: maxPetugas },
                                                (_, i) => (
                                                    <th
                                                        key={`petugas-header-${i}`}
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        {`Petugas ${i + 1}`}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.keys(jadwalByDay).length > 0 ? (
                                            Object.keys(jadwalByDay).map(
                                                (day) => (
                                                    <tr key={day}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {getDayName(day)}
                                                        </td>
                                                        {Array.from(
                                                            {
                                                                length: maxPetugas,
                                                            },
                                                            (_, index) => (
                                                                <td
                                                                    key={`${day}-${index}`}
                                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                >
                                                                    {jadwalByDay[
                                                                        day
                                                                    ][index] ? (
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center">
                                                                                <span
                                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusColor(
                                                                                        jadwalByDay[
                                                                                            day
                                                                                        ][
                                                                                            index
                                                                                        ]
                                                                                            .status
                                                                                    )}`}
                                                                                >
                                                                                    {jadwalByDay[
                                                                                        day
                                                                                    ][
                                                                                        index
                                                                                    ]
                                                                                        .status ===
                                                                                    "hadir"
                                                                                        ? "✓"
                                                                                        : jadwalByDay[
                                                                                              day
                                                                                          ][
                                                                                              index
                                                                                          ]
                                                                                              .status ===
                                                                                          "pending"
                                                                                        ? "⏳"
                                                                                        : "✗"}
                                                                                </span>
                                                                                {
                                                                                    jadwalByDay[
                                                                                        day
                                                                                    ][
                                                                                        index
                                                                                    ]
                                                                                        .name
                                                                                }
                                                                            </div>
                                                                            {jadwalByDay[
                                                                                day
                                                                            ][
                                                                                index
                                                                            ]
                                                                                .is_override && (
                                                                                <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                                    <div className="flex items-center">
                                                                                        <svg
                                                                                            className="w-3 h-3 mr-1"
                                                                                            fill="currentColor"
                                                                                            viewBox="0 0 20 20"
                                                                                        >
                                                                                            <path
                                                                                                fillRule="evenodd"
                                                                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                                                                clipRule="evenodd"
                                                                                            />
                                                                                        </svg>
                                                                                        Ganti:{" "}
                                                                                        {getDayName(
                                                                                            jadwalByDay[
                                                                                                day
                                                                                            ][
                                                                                                index
                                                                                            ]
                                                                                                .original_day
                                                                                        )}{" "}
                                                                                        →{" "}
                                                                                        {getDayName(
                                                                                            jadwalByDay[
                                                                                                day
                                                                                            ][
                                                                                                index
                                                                                            ]
                                                                                                .override_day
                                                                                        )}
                                                                                    </div>
                                                                                    <div
                                                                                        className="text-xs text-gray-500 mt-1 truncate"
                                                                                        title={
                                                                                            jadwalByDay[
                                                                                                day
                                                                                            ][
                                                                                                index
                                                                                            ]
                                                                                                .override_reason
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            jadwalByDay[
                                                                                                day
                                                                                            ][
                                                                                                index
                                                                                            ]
                                                                                                .override_reason
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        "-"
                                                                    )}
                                                                </td>
                                                            )
                                                        )}
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={1 + maxPetugas}
                                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                                >
                                                    Tidak ada data jadwal piket
                                                    untuk periode dan filter
                                                    yang dipilih.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Rekap Kehadiran Tab */}
                        {activeTab === "rekap" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Jadwal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hadir
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tidak Hadir
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ganti
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Denda
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rekapAbsensi.length > 0 ? (
                                            rekapAbsensi.map((item, index) => (
                                                <tr
                                                    key={item.user.id}
                                                    className={`hover:bg-gray-50 ${
                                                        item.user.id ===
                                                        auth.user.id
                                                            ? "bg-blue-50"
                                                            : ""
                                                    }`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.user
                                                                        .id ===
                                                                    auth.user.id
                                                                        ? `${item.user.name} (Anda)`
                                                                        : item
                                                                              .user
                                                                              .name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {
                                                                        item
                                                                            .user
                                                                            .email
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.total_jadwal}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {item.hadir}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            {item.tidak_hadir}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.ganti}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(
                                                            item.denda
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                                >
                                                    Tidak ada data rekap absensi
                                                    untuk periode dan filter
                                                    yang dipilih.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RekapAbsen;
