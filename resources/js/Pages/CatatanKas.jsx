import React, { useState, useEffect, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useLab } from "../Components/LabContext";

const CatatanKas = ({
    catatanKas,
    anggota,
    tahunKepengurusan,
    laboratorium,
    bulanData,
    kepengurusanlab,
    nominalKas,
    filters,
    flash,
    debug,
}) => {
    const { selectedLab } = useLab();
    const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");

    // Ensure bulanData is an object with all months - force all months to show
    const allMonths =
        bulanData &&
        typeof bulanData === "object" &&
        Object.keys(bulanData).length > 0
            ? bulanData
            : {
                  Agustus: 8,
                  September: 9,
                  Oktober: 10,
                  November: 11,
                  Desember: 12,
              };

    // Debug data from backend
    console.log("CatatanKas component loaded");
    console.log("debug prop:", debug);
    console.log("bulanData prop:", bulanData);
    console.log("allMonths:", allMonths);
    console.log("catatanKas data:", catatanKas);
    console.log("nominalKas data:", nominalKas);
    console.log("kepengurusanlab:", kepengurusanlab);

    if (debug) {
        console.log("=== CATATAN KAS DEBUG FROM BACKEND ===");
        console.log("Debug data:", debug);
        console.log("bulanData keys from backend:", debug.bulanData_keys);
        console.log("bulanData count from backend:", debug.bulanData_count);
        console.log("kepengurusanlab found:", debug.kepengurusanlab_found);
        console.log("bulanData full from backend:", debug.bulanData_full);
        console.log("allMonths used in frontend:", Object.keys(allMonths));
    } else {
        console.log("No debug data received from backend");
    }

    // Handler untuk perubahan tahun
    const handleTahunChange = (e) => {
        setSelectedTahun(e.target.value);
    };

    // Menampilkan flash message
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Update data ketika laboratorium atau tahun diubah
    useEffect(() => {
        if (selectedLab) {
            router.visit("/catatan-kas", {
                data: {
                    lab_id: selectedLab.id,
                    tahun_id: selectedTahun,
                },
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [selectedLab, selectedTahun]);

    // Helper function to determine if a month and week has passed
    const hasDatePassed = (bulanStr, minggu) => {
        const currentDate = new Date();

        // Convert Indonesian month to month number (0-indexed)
        const monthMap = {
            Januari: 0,
            Februari: 1,
            Maret: 2,
            April: 3,
            Mei: 4,
            Juni: 5,
            Juli: 6,
            Agustus: 7,
            September: 8,
            Oktober: 9,
            November: 10,
            Desember: 11,
        };

        const month = monthMap[bulanStr];
        if (month === undefined) return false;

        // Get current month and year
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        // Assume current year for comparison
        const year = currentYear;

        // If comparing different years
        if (year < currentYear) {
            return true;
        } else if (year > currentYear) {
            return false;
        }

        // Same year, check month
        if (month < currentMonth) {
            return true; // Past month always shows
        } else if (month > currentMonth) {
            return false; // Future month never shows
        }

        // Same month, check week
        // Assuming each week is roughly 7 days
        const currentWeek = Math.ceil(currentDay / 7);
        return minggu <= currentWeek;
    };

    // Memproses data pembayaran untuk efisiensi pemrosesan
    const processedData = useMemo(() => {
        // Buat object untuk menyimpan data pembayaran per user
        const userPayments = {};

        // Ambil nominal kas dan periode
        const activeNominalKas =
            nominalKas?.find((nk) => nk.is_active) || nominalKas?.[0];
        const isWeekly = activeNominalKas?.periode === "mingguan";

        // Generate periods berdasarkan periode nominal kas
        const generatePeriods = () => {
            const periods = [];

            if (
                activeNominalKas &&
                activeNominalKas.periode_mulai &&
                activeNominalKas.periode_berakhir
            ) {
                // Gunakan periode yang ditentukan di nominal kas
                const startDate = new Date(activeNominalKas.periode_mulai);
                const endDate = new Date(activeNominalKas.periode_berakhir);

                if (isWeekly) {
                    // Generate minggu berdasarkan periode yang ditentukan
                    let currentWeek = new Date(startDate);
                    let weekNumber = 1;

                    while (currentWeek <= endDate) {
                        const weekEnd = new Date(currentWeek);
                        weekEnd.setDate(weekEnd.getDate() + 6);

                        periods.push({
                            key: `Minggu ${weekNumber}`,
                            label: `Minggu ${weekNumber}`,
                            start: new Date(currentWeek),
                            end: new Date(weekEnd),
                        });

                        currentWeek.setDate(currentWeek.getDate() + 7);
                        weekNumber++;
                    }
                } else {
                    // Generate bulan berdasarkan periode yang ditentukan
                    let currentMonth = new Date(startDate);
                    const monthNames = [
                        "Januari",
                        "Februari",
                        "Maret",
                        "April",
                        "Mei",
                        "Juni",
                        "Juli",
                        "Agustus",
                        "September",
                        "Oktober",
                        "November",
                        "Desember",
                    ];

                    while (currentMonth <= endDate) {
                        const monthStart = new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            1
                        );
                        const monthEnd = new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            0
                        );

                        periods.push({
                            key: monthNames[currentMonth.getMonth()],
                            label: monthNames[currentMonth.getMonth()],
                            start: monthStart,
                            end: monthEnd,
                        });

                        currentMonth.setMonth(currentMonth.getMonth() + 1);
                    }
                }
            } else {
                // Fallback ke periode default jika tidak ada periode yang ditentukan
                const currentDate = new Date();
                const startDate = new Date(currentDate.getFullYear(), 7, 1); // Agustus
                const endDate = new Date(currentDate.getFullYear() + 1, 0, 31); // Januari tahun depan

                if (isWeekly) {
                    // Generate minggu
                    let currentWeek = new Date(startDate);
                    let weekNumber = 1;

                    while (currentWeek <= endDate) {
                        const weekEnd = new Date(currentWeek);
                        weekEnd.setDate(weekEnd.getDate() + 6);

                        periods.push({
                            key: `Minggu ${weekNumber}`,
                            label: `Minggu ${weekNumber}`,
                            start: new Date(currentWeek),
                            end: new Date(weekEnd),
                        });

                        currentWeek.setDate(currentWeek.getDate() + 7);
                        weekNumber++;
                    }
                } else {
                    // Generate bulan
                    const monthNames = [
                        "Agustus",
                        "September",
                        "Oktober",
                        "November",
                        "Desember",
                        "Januari",
                    ];
                    for (let i = 0; i < 6; i++) {
                        const monthDate = new Date(
                            currentDate.getFullYear(),
                            7 + i,
                            1
                        ); // Mulai dari Agustus
                        if (monthDate.getMonth() > 11) {
                            monthDate.setFullYear(monthDate.getFullYear() + 1);
                            monthDate.setMonth(monthDate.getMonth() - 12);
                        }

                        periods.push({
                            key: monthNames[i],
                            label: monthNames[i],
                            start: new Date(
                                monthDate.getFullYear(),
                                monthDate.getMonth(),
                                1
                            ),
                            end: new Date(
                                monthDate.getFullYear(),
                                monthDate.getMonth() + 1,
                                0
                            ),
                        });
                    }
                }
            }

            return periods;
        };

        const periods = generatePeriods();

        // Inisialisasi data untuk setiap user
        anggota.forEach((user) => {
            userPayments[user.id] = {
                name: user.name,
                totalPayments: 0,
                payments: {},
                totalAmount: 0,
                periodsPaid: 0,
            };

            // Inisialisasi data periode
            periods.forEach((period) => {
                userPayments[user.id].payments[period.key] = false;
            });
        });

        // Proses data pembayaran: hitung total pembayaran per user
        catatanKas.forEach((payment) => {
            if (userPayments[payment.user_id]) {
                userPayments[payment.user_id].totalAmount += parseFloat(
                    payment.nominal
                );
            }
        });

        // Hitung periode yang dibayar berdasarkan jenis pembayaran
        Object.keys(userPayments).forEach((userId) => {
            const userPayment = userPayments[userId];
            const userPaymentsList = catatanKas.filter(
                (p) => p.user_id === userId
            );

            if (activeNominalKas && activeNominalKas.nominal > 0) {
                // Hitung total pembayaran normal dan lebih
                let totalNormalPayment = 0;
                let totalLebihPayment = 0;

                // Pisahkan pembayaran normal dan lebih
                userPaymentsList.forEach((payment) => {
                    const paymentAmount = parseFloat(payment.nominal);
                    const jenisPembayaran =
                        payment.jenis_pembayaran_kas || "normal";

                    if (jenisPembayaran === "normal") {
                        totalNormalPayment += paymentAmount;
                    } else if (jenisPembayaran === "lebih") {
                        totalLebihPayment += paymentAmount;
                    }
                });

                // Hitung periode yang dibayar dari pembayaran normal
                const normalPeriodsPaid = Math.floor(
                    totalNormalPayment / activeNominalKas.nominal
                );

                // Debug: Log perhitungan
                console.log("Debug Payment Calculation:", {
                    userId: userId,
                    totalNormalPayment: totalNormalPayment,
                    nominalKas: activeNominalKas.nominal,
                    normalPeriodsPaid: normalPeriodsPaid,
                    totalLebihPayment: totalLebihPayment,
                });

                // PERTAMA: Tandai periode untuk pembayaran lebih (periode saat pembayaran)
                // Logika: Pembayaran "lebih" menandai periode sesuai tanggal pembayaran
                // Fleksibel: Bisa kapan saja, tidak mempengaruhi urutan periode normal
                userPaymentsList.forEach((payment) => {
                    const jenisPembayaran =
                        payment.jenis_pembayaran_kas || "normal";

                    if (jenisPembayaran === "lebih") {
                        const paymentDate = new Date(payment.tanggal);

                        // Cari periode yang sesuai dengan tanggal pembayaran
                        periods.forEach((period) => {
                            if (
                                paymentDate >= period.start &&
                                paymentDate <= period.end
                            ) {
                                userPayment.payments[period.key] = true;
                                console.log(
                                    `Marked period from lebih payment: ${period.key}`
                                );
                            }
                        });
                    }
                });

                // KEDUA: Tandai periode yang dibayar dari pembayaran normal
                // Logika: Pembayaran "normal" menandai periode secara berurutan
                // Fleksibel: Mulai dari periode pertama yang belum dibayar
                const periodKeys = periods.map((p) => p.key);
                const paidNormalPeriods = Math.min(
                    normalPeriodsPaid,
                    periodKeys.length
                );

                // Tandai periode secara berurutan mulai dari yang belum dibayar
                let periodsMarked = 0;
                for (
                    let i = 0;
                    i < periodKeys.length && periodsMarked < paidNormalPeriods;
                    i++
                ) {
                    if (!userPayment.payments[periodKeys[i]]) {
                        userPayment.payments[periodKeys[i]] = true;
                        periodsMarked++;
                        console.log(
                            `Marked period: ${periodKeys[i]} (${periodsMarked}/${paidNormalPeriods})`
                        );
                    }
                }

                // Debug: Log final payment status
                console.log("Final payment status:", {
                    userId: userId,
                    payments: userPayment.payments,
                    totalPayments: userPayment.totalPayments,
                });

                // Hitung total periode yang lunas per user
                const paidPeriods = Object.values(userPayment.payments).filter(
                    Boolean
                ).length;
                userPayment.totalPayments = paidPeriods;
            }
        });

        return { userPayments, periods };
    }, [anggota, catatanKas, kepengurusanlab]);

    // Function to render period payment status cell
    const renderPeriodStatusCell = (userId, periodKey) => {
        const hasPaid =
            processedData.userPayments?.[userId]?.payments[periodKey] || false;

        if (hasPaid) {
            return (
                <td
                    key={`${userId}-${periodKey}`}
                    className="px-3 py-2 text-center"
                >
                    <div className="flex justify-center">
                        <span
                            className="bg-green-100 text-green-800 p-1 rounded-full"
                            title="Lunas"
                        >
                            <FaCheck className="text-green-600" />
                        </span>
                    </div>
                </td>
            );
        }

        return (
            <td
                key={`${userId}-${periodKey}`}
                className="px-3 py-2 text-center"
            >
                <div className="flex justify-center">
                    <span
                        className="bg-gray-100 text-gray-800 p-1 rounded-full"
                        title="Belum bayar"
                    >
                        <FaTimes className="text-gray-600" />
                    </span>
                </div>
            </td>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Catatan Kas" />
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b space-y-4 lg:space-y-0">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Catatan Uang Kas
                    </h2>
                    <div className="flex gap-4 items-center w-full lg:w-auto">
                        <div className="w-full sm:w-auto">
                            <select
                                value={selectedTahun}
                                onChange={handleTahunChange}
                                className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Pilih Tahun</option>
                                {tahunKepengurusan?.map((tahun) => (
                                    <option key={tahun.id} value={tahun.id}>
                                        {tahun.tahun}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Informasi Nominal Kas dan Pembayaran Lebih */}
                {kepengurusanlab && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-2">
                            Informasi Nominal Kas
                        </h3>

                        {nominalKas && nominalKas.length > 0 ? (
                            <div className="mt-2">
                                <p className="text-blue-700">
                                    <strong>Nominal Aktif:</strong>{" "}
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        minimumFractionDigits: 0,
                                    }).format(
                                        nominalKas.find((nk) => nk.is_active)
                                            ?.nominal ||
                                            nominalKas[0]?.nominal ||
                                            0
                                    )}
                                    (
                                    {(nominalKas.find((nk) => nk.is_active)
                                        ?.periode || nominalKas[0]?.periode) ===
                                    "mingguan"
                                        ? "Mingguan"
                                        : "Bulanan"}
                                    )
                                </p>
                                <p className="text-blue-700 text-sm mt-1">
                                    <strong>Catatan:</strong>
                                    <br />• <strong>Normal:</strong> Pembayaran
                                    untuk periode selanjutnya (jika bayar 50k
                                    untuk 10k/minggu, maka 5 minggu ke depan
                                    ditandai lunas)
                                    <br />• <strong>Lebih:</strong> Pembayaran
                                    bonus/tambahan (hanya 1 periode yang
                                    ditandai lunas)
                                </p>
                            </div>
                        ) : (
                            <div className="mt-2">
                                <p className="text-red-700 font-medium">
                                    <strong>
                                        Belum ada nominal kas yang ditetapkan
                                        untuk periode{" "}
                                        {nominalKas && nominalKas.length > 0
                                            ? nominalKas[0]?.periode ===
                                              "mingguan"
                                                ? "Mingguan"
                                                : "Bulanan"
                                            : "Bulanan"}
                                        .
                                    </strong>
                                </p>
                                <p className="text-red-700 text-sm mt-1">
                                    Silakan atur nominal kas di halaman Riwayat
                                    Keuangan.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Status Tampilan */}
                {!selectedLab && (
                    <div className="p-8 text-center text-gray-500">
                        Silakan pilih laboratorium terlebih dahulu
                    </div>
                )}

                {selectedLab && !selectedTahun && (
                    <div className="p-8 text-center text-gray-500">
                        Silakan pilih tahun untuk melihat data
                    </div>
                )}

                {selectedLab && selectedTahun && anggota.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Tidak ada data asisten untuk laboratorium dan tahun yang
                        dipilih
                    </div>
                )}

                {/* Tabel */}
                {selectedLab && selectedTahun && anggota.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama Asisten
                                    </th>
                                    {processedData.periods?.map((period) => (
                                        <th
                                            key={period.key}
                                            className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                                        >
                                            {period.label}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {anggota.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        {processedData.periods?.map((period) =>
                                            renderPeriodStatusCell(
                                                user.id,
                                                period.key
                                            )
                                        )}
                                        <td className="px-4 py-3 text-center text-sm font-medium border-l border-gray-200 bg-gray-50">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">
                                                    {processedData
                                                        .userPayments?.[user.id]
                                                        ?.totalPayments ||
                                                        0}{" "}
                                                    ✓
                                                </span>
                                                {processedData.userPayments?.[
                                                    user.id
                                                ]?.totalAmount > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {new Intl.NumberFormat(
                                                            "id-ID",
                                                            {
                                                                style: "currency",
                                                                currency: "IDR",
                                                                minimumFractionDigits: 0,
                                                            }
                                                        ).format(
                                                            processedData
                                                                .userPayments?.[
                                                                user.id
                                                            ]?.totalAmount || 0
                                                        )}
                                                    </span>
                                                )}
                                                {processedData.userPayments?.[
                                                    user.id
                                                ]?.periodsPaid > 0 && (
                                                    <span className="text-xs text-blue-600">
                                                        {
                                                            processedData
                                                                .userPayments?.[
                                                                user.id
                                                            ]?.periodsPaid
                                                        }{" "}
                                                        periode
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CatatanKas;
