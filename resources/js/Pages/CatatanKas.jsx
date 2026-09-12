import { Head, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useLab } from "../Components/LabContext";
import DashboardLayout from "../Layouts/DashboardLayout";

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

    
    const allMonths =
        bulanData &&
        typeof bulanData === "object" &&
        Object.keys(bulanData).length > 0
            ? bulanData
            : {};

    
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

    
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    
    useEffect(() => {
        if (selectedLab) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLabId = urlParams.get("lab_id");

            if (urlLabId !== String(selectedLab.id)) {
                router.visit("/catatan-kas", {
                    data: { lab_id: selectedLab.id },
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }
    }, [selectedLab]);

    
    const hasDatePassed = (bulanStr, minggu) => {
        const currentDate = new Date();

        
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

        
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        
        const year = currentYear;

        
        if (year < currentYear) {
            return true;
        } else if (year > currentYear) {
            return false;
        }

        
        if (month < currentMonth) {
            return true; 
        } else if (month > currentMonth) {
            return false; 
        }

        
        
        const currentWeek = Math.ceil(currentDay / 7);
        return minggu <= currentWeek;
    };

    
    const processedData = useMemo(() => {
        
        const userPayments = {};

        
        const activeNominalKas =
            nominalKas?.find((nk) => nk.is_active) || nominalKas?.[0];
        const isWeekly = activeNominalKas?.periode === "mingguan";

        
        const generatePeriods = () => {
            const periods = [];

            if (
                activeNominalKas &&
                activeNominalKas.periode_mulai &&
                activeNominalKas.periode_berakhir
            ) {
                
                const startDate = new Date(activeNominalKas.periode_mulai);
                const endDate = new Date(activeNominalKas.periode_berakhir);

                if (isWeekly) {
                    
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
                            1,
                        );
                        const monthEnd = new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            0,
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
                
                
                const tahunKep = kepengurusanlab?.tahun_kepengurusan;
                const rangeStart = tahunKep?.mulai ? new Date(tahunKep.mulai) : null;
                const rangeEnd = tahunKep?.selesai ? new Date(tahunKep.selesai) : null;

                if (isWeekly && rangeStart && rangeEnd) {
                    
                    let currentWeek = new Date(rangeStart);
                    let weekNumber = 1;
                    while (currentWeek <= rangeEnd) {
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
                    
                    const monthKeys = Object.keys(allMonths);
                    if (monthKeys.length > 0) {
                        const monthNameToIndex = {
                            Januari: 0, Februari: 1, Maret: 2, April: 3,
                            Mei: 4, Juni: 5, Juli: 6, Agustus: 7,
                            September: 8, Oktober: 9, November: 10, Desember: 11,
                        };
                        monthKeys.forEach((monthName) => {
                            const monthIdx = monthNameToIndex[monthName];
                            if (monthIdx !== undefined) {
                                const currentDate = new Date();
                                const firstMonthIdx = monthNameToIndex[monthKeys[0]];
                                let year = currentDate.getFullYear();
                                if (monthIdx < firstMonthIdx) {
                                    year = currentDate.getFullYear() + 1;
                                }
                                const monthStart = new Date(year, monthIdx, 1);
                                const monthEnd = new Date(year, monthIdx + 1, 0);
                                periods.push({
                                    key: monthName,
                                    label: monthName,
                                    start: monthStart,
                                    end: monthEnd,
                                });
                            }
                        });
                    }
                }
            }

            return periods;
        };

        const periods = generatePeriods();

        
        anggota.forEach((user) => {
            userPayments[user.id] = {
                name: user.name,
                totalPayments: 0,
                payments: {},
                totalAmount: 0,
                periodsPaid: 0,
            };

            
            periods.forEach((period) => {
                userPayments[user.id].payments[period.key] = false;
            });
        });

        
        catatanKas.forEach((payment) => {
            if (userPayments[payment.user_id]) {
                userPayments[payment.user_id].totalAmount += parseFloat(
                    payment.nominal,
                );
            }
        });

        
        Object.keys(userPayments).forEach((userId) => {
            const userPayment = userPayments[userId];
            const userPaymentsList = catatanKas.filter(
                (p) => p.user_id === userId,
            );

            if (activeNominalKas && activeNominalKas.nominal > 0) {
                
                let totalNormalPayment = 0;
                let totalLebihPayment = 0;

                
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

                
                const normalPeriodsPaid = Math.floor(
                    totalNormalPayment / activeNominalKas.nominal,
                );

                
                console.log("Debug Payment Calculation:", {
                    userId: userId,
                    totalNormalPayment: totalNormalPayment,
                    nominalKas: activeNominalKas.nominal,
                    normalPeriodsPaid: normalPeriodsPaid,
                    totalLebihPayment: totalLebihPayment,
                });

                
                
                
                userPaymentsList.forEach((payment) => {
                    const jenisPembayaran =
                        payment.jenis_pembayaran_kas || "normal";

                    if (jenisPembayaran === "lebih") {
                        const paymentDate = new Date(payment.tanggal);

                        
                        periods.forEach((period) => {
                            if (
                                paymentDate >= period.start &&
                                paymentDate <= period.end
                            ) {
                                userPayment.payments[period.key] = true;
                                console.log(
                                    `Marked period from lebih payment: ${period.key}`,
                                );
                            }
                        });
                    }
                });

                
                
                
                const periodKeys = periods.map((p) => p.key);
                const paidNormalPeriods = Math.min(
                    normalPeriodsPaid,
                    periodKeys.length,
                );

                
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
                            `Marked period: ${periodKeys[i]} (${periodsMarked}/${paidNormalPeriods})`,
                        );
                    }
                }

                
                console.log("Final payment status:", {
                    userId: userId,
                    payments: userPayment.payments,
                    totalPayments: userPayment.totalPayments,
                });

                
                const paidPeriods = Object.values(userPayment.payments).filter(
                    Boolean,
                ).length;
                userPayment.totalPayments = paidPeriods;
            }
        });

        return { userPayments, periods };
    }, [anggota, catatanKas, kepengurusanlab, nominalKas, allMonths]);

    
    const [displayLimit, setDisplayLimit] = useState("12"); 
    const periods = processedData.periods || [];
    const totalPeriods = periods.length;
    const visiblePeriods =
        displayLimit === "all"
            ? periods
            : periods.slice(-Math.min(totalPeriods, parseInt(displayLimit, 10) || 12));
    const isTrimmed = totalPeriods > visiblePeriods.length;
    const displayLimitOptions = [
        { value: "6", label: "6 periode terakhir" },
        { value: "12", label: "12 periode terakhir" },
        { value: "24", label: "24 periode terakhir" },
        { value: "52", label: "52 periode terakhir" },
        { value: "all", label: "Semua periode" },
    ];

    
    const renderPeriodStatusCell = (userId, periodKey) => {
        const hasPaid =
            processedData.userPayments?.[userId]?.payments[periodKey] || false;

        if (hasPaid) {
            return (
                <td
                    key={`${userId}-${periodKey}`}
                    className="px-3 py-2 text-center"
                >
                    <div className="flex justify-center" title="Lunas">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                </td>
            );
        }

        return (
            <td
                key={`${userId}-${periodKey}`}
                className="px-3 py-2 text-center"
            >
                <div className="flex justify-center" title="Belum bayar">
                    <Circle className="w-5 h-5 text-base-300" />
                </div>
            </td>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Catatan Kas" />

            <div className="silab-panel">
                <div className="flex flex-col gap-4 border-b border-base-300 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-xl font-semibold text-base-content">
                        Catatan Uang Kas
                    </h2>
                    <div className="flex gap-4 items-center w-full lg:w-auto">
                        
                    </div>
                </div>

                
                {kepengurusanlab && (
                    <div className="alert alert-info mx-5 mt-5 rounded-box">
                        <div>
                            <h3 className="font-semibold">
                                Informasi Nominal Kas
                            </h3>

                            {nominalKas && nominalKas.length > 0 ? (
                                <div className="mt-2">
                                    <p>
                                        <strong>Nominal Aktif:</strong>{" "}
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            minimumFractionDigits: 0,
                                        }).format(
                                            nominalKas.find((nk) => nk.is_active)
                                                ?.nominal ||
                                                nominalKas[0]?.nominal ||
                                                0,
                                        )}
                                        (
                                        {(nominalKas.find((nk) => nk.is_active)
                                            ?.periode || nominalKas[0]?.periode) ===
                                        "mingguan"
                                            ? "Mingguan"
                                            : "Bulanan"}
                                        )
                                    </p>
                                    <p className="text-sm mt-1">
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
                                    <p className="font-medium text-error">
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
                                    <p className="text-sm mt-1">
                                        Silakan atur nominal kas di halaman Riwayat
                                        Keuangan.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                
                {!kepengurusanlab && (
                    <div className="p-8 text-center text-gray-500">
                        Silakan pilih laboratorium dan periode kepengurusan di
                        Navbar
                    </div>
                )}

                {kepengurusanlab && anggota.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Tidak ada data asisten untuk laboratorium dan tahun yang
                        dipilih
                    </div>
                )}

                
                {kepengurusanlab && anggota.length > 0 && (
                    <>
                        
                        {totalPeriods > 0 && (
                            <div className="flex flex-wrap items-center gap-3 border-b border-base-300 bg-base-200/50 px-5 py-3">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-4 w-4 text-base-content/60" />
                                    <span className="text-sm font-medium text-base-content/80">
                                        Tampilkan:
                                    </span>
                                </div>
                                <select
                                    value={displayLimit}
                                    onChange={(e) => setDisplayLimit(e.target.value)}
                                    className="select select-bordered select-sm min-h-9"
                                >
                                    {displayLimitOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-xs text-base-content/60">
                                    {isTrimmed
                                        ? `Menampilkan ${visiblePeriods.length} dari ${totalPeriods} periode`
                                        : `${totalPeriods} periode`}
                                </span>
                            </div>
                        )}

                        <div className="silab-table-wrap">
                        <table className="silab-table">
                            <thead>
                                <tr>
                                    <th className="text-left">
                                        Nama Asisten
                                    </th>
                                    {visiblePeriods.map((period) => (
                                        <th
                                            key={period.key}
                                            className="text-center border-l border-base-300"
                                        >
                                            {period.label}
                                        </th>
                                    ))}
                                    <th className="text-center border-l border-base-300">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {anggota.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-base-200"
                                    >
                                        <td className="whitespace-nowrap font-medium">
                                            {user.name}
                                        </td>
                                        {visiblePeriods.map((period) =>
                                            renderPeriodStatusCell(
                                                user.id,
                                                period.key,
                                            ),
                                        )}
                                        <td className="bg-base-200/50 border-l border-base-300 text-center">
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
                                                    <span className="text-xs text-base-content/60">
                                                        {new Intl.NumberFormat(
                                                            "id-ID",
                                                            {
                                                                style: "currency",
                                                                currency: "IDR",
                                                                minimumFractionDigits: 0,
                                                            },
                                                        ).format(
                                                            processedData
                                                                .userPayments?.[
                                                                user.id
                                                            ]?.totalAmount || 0,
                                                        )}
                                                    </span>
                                                )}
                                                {processedData.userPayments?.[
                                                    user.id
                                                ]?.periodsPaid > 0 && (
                                                    <span className="text-xs text-primary">
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CatatanKas;
