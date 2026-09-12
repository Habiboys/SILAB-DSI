import { useLab } from "@/Components/LabContext";
import { usePermission } from "@/Components/PermissionContext";
import Modal from "@/Components/Modal";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Hourglass, X, Wallet } from "lucide-react";

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
    pengaturanPiket,
}) => {
    
    const { auth } = usePage().props;
    const { can } = usePermission();

    
    const { selectedLab } = useLab();

    
    const canAccess = can("absensi.view_rekap");

    
    const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || "");
    
    const { selected_kepengurusan } = usePage().props;
    const selectedTahun = selected_kepengurusan
        ? String(selected_kepengurusan.id)
        : "";
    const [activeTab, setActiveTab] = useState("jadwal");

    
    const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);
    const [selectedBayarItem, setSelectedBayarItem] = useState(null);
    const bayarForm = useForm({
        denda_piket_id: "",
        nominal: "",
        tanggal: new Date().toISOString().split("T")[0],
        keterangan: "",
        bukti: null,
    });

    const openBayarModal = (item) => {
        setSelectedBayarItem(item);
        bayarForm.setData({
            denda_piket_id: item.denda_piket?.id || "",
            nominal: item.denda_piket?.sisa || "",
            tanggal: new Date().toISOString().split("T")[0],
            keterangan: "",
            bukti: null,
        });
        setIsBayarModalOpen(true);
    };

    const closeBayarModal = () => {
        setIsBayarModalOpen(false);
        setSelectedBayarItem(null);
        bayarForm.reset();
    };

    const handleBayar = (e) => {
        e.preventDefault();
        bayarForm.post(route("piket.denda-piket.bayar"), {
            onSuccess: () => {
                closeBayarModal();
                toast.success("Pembayaran denda piket berhasil");
            },
            onError: (errors) => {
                const msg = Object.values(errors).find(Boolean);
                toast.error(msg || "Gagal membayar denda");
            },
            preserveState: true,
        });
    }; 

    
    
    

    
    

    
    useEffect(() => {
        
        if (canAccess && selectedLab) {
            
        }
    }, [canAccess, selectedLab]);

    
    const handlePeriodeChange = (e) => {
        const periodeId = e.target.value;
        setSelectedPeriode(periodeId);

        
        const params = {
            periode_id: periodeId,
        };

        
        if (selectedLab) {
            params.lab_id = selectedLab.id;
        }

        
        if (selectedTahun) {
            params.kepengurusan_lab_id = selectedTahun;
        }

        
        router.get(route("piket.rekap-absen"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    
    const getStatusColor = (status) => {
        switch (status) {
            case "hadir":
                return "text-green-600";
            case "pending":
                return "text-blue-600";
            case "tidak hadir":
            default:
                return "text-red-600";
        }
    };

    
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

    
    const maxPetugas = React.useMemo(() => {
        if (!jadwalByDay || Object.keys(jadwalByDay).length === 0) return 5;
        const counts = Object.keys(jadwalByDay).map(
            (day) => jadwalByDay[day]?.length || 0,
        );
        const maxCount = counts.length ? Math.max(...counts) : 0;
        return Math.max(5, maxCount);
    }, [jadwalByDay]);

    return (
        <DashboardLayout>
            <Head title="Rekap Absensi" />

            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Rekap Absensi
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            

                            
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

                        
                        {activeTab === "jadwal" && (
                            <div className="silab-table-wrap">
                                <table className="silab-table">
                                    <thead>
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                Hari
                                            </th>
                                            {Array.from(
                                                { length: maxPetugas },
                                                (_, i) => (
                                                    <th
                                                        key={`petugas-header-${i}`}
                                                        className="px-3 sm:px-6 py-3 text-left whitespace-nowrap"
                                                    >
                                                        {`Petugas ${i + 1}`}
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(jadwalByDay).length > 0 ? (
                                            Object.keys(jadwalByDay).map(
                                                (day) => (
                                                    <tr key={day}>
                                                        <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {getDayName(day)}
                                                        </td>
                                                        {Array.from(
                                                            {
                                                                length: maxPetugas,
                                                            },
                                                            (_, index) => (
                                                                <td
                                                                    key={`${day}-${index}`}
                                                                    className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500"
                                                                >
                                                                    {jadwalByDay[
                                                                        day
                                                                    ][index] ? (
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center">
                                                                                <span
                                                                                    className={`inline-flex items-center text-xs font-medium mr-2 ${getStatusColor(
                                                                                        jadwalByDay[
                                                                                            day
                                                                                        ][
                                                                                            index
                                                                                        ]
                                                                                            .status,
                                                                                    )}`}
                                                                                >
                                                                                    {jadwalByDay[day][index].status === "hadir" ? (
                                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    ) : jadwalByDay[day][index].status === "pending" ? (
                                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    )}
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
                                                                                                .original_day,
                                                                                        )}{" "}
                                                                                        →{" "}
                                                                                        {getDayName(
                                                                                            jadwalByDay[
                                                                                                day
                                                                                            ][
                                                                                                index
                                                                                            ]
                                                                                                .override_day,
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
                                                            ),
                                                        )}
                                                    </tr>
                                                ),
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

                        
                        {activeTab === "rekap" && (
                            <div className="silab-table-wrap">
                                <table className="silab-table">
                                    <thead>
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left">
                                                No
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left">
                                                Nama
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                Total Jadwal
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left">
                                                Hadir
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                Tidak Hadir
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left">
                                                Ganti
                                            </th>
                                            {pengaturanPiket?.ada_denda && (
                                                <>
                                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                        Total Denda
                                                    </th>
                                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                        Dibayar
                                                    </th>
                                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                        Sisa
                                                    </th>
                                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                        Status
                                                    </th>
                                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                                        Aksi
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.user
                                                                        .id ===
                                                                    auth.user.id
                                                                        ? `${item.user.name} (Anda)`
                                                                        : item
                                                                              .user
                                                                              .name}
                                                                </div>
                                                       
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        {item.total_jadwal}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                        <span className="badge badge-success badge-sm">{item.hadir}</span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                        <span className="badge badge-error badge-sm">{item.tidak_hadir}</span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                                        {item.ganti}
                                                    </td>
                                                    {pengaturanPiket?.ada_denda && (
                                                        <>
                                                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {item.denda > 0 ? (
                                                                    <span className="text-red-600 font-medium">
                                                                        {formatCurrency(
                                                                            item.denda,
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-base-content/40">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {item.denda_piket?.sudah_dibayar > 0 ? (
                                                                    <span className="text-green-600 font-medium">
                                                                        {formatCurrency(
                                                                            item.denda_piket.sudah_dibayar,
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-base-content/40">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {item.denda_piket?.sisa > 0 ? (
                                                                    <span className="text-orange-600 font-medium">
                                                                        {formatCurrency(
                                                                            item.denda_piket.sisa,
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-base-content/40">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                                {item.denda_piket ? (
                                                                    <span
                                                                        className={`badge badge-sm ${
                                                                            item.denda_piket.status === "lunas"
                                                                                ? "badge-success"
                                                                                : "badge-error"
                                                                        }`}
                                                                    >
                                                                        {item.denda_piket.status === "lunas"
                                                                            ? "Lunas"
                                                                            : "Belum Lunas"}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-base-content/40">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">
                                                                {item.denda_piket &&
                                                                    item.denda_piket.status === "belum_lunas" &&
                                                                    item.denda_piket.sisa > 0 && (
                                                                        <button
                                                                            onClick={() => openBayarModal(item)}
                                                                            className="btn btn-primary btn-xs gap-1"
                                                                        >
                                                                            <Wallet className="w-3.5 h-3.5" />
                                                                            Bayar
                                                                        </button>
                                                                    )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        pengaturanPiket?.ada_denda
                                                            ? 11
                                                            : 6
                                                    }
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

            
            <Modal
                show={isBayarModalOpen}
                onClose={closeBayarModal}
                maxWidth="sm"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Bayar Denda Piket</h3>
                        <button
                            onClick={closeBayarModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {selectedBayarItem && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm space-y-1">
                            <div className="font-medium text-gray-900">
                                {selectedBayarItem.user.name}
                            </div>
                            <div className="text-gray-600">
                                Total denda: {formatCurrency(selectedBayarItem.denda_piket?.total_denda || 0)}
                            </div>
                            <div className="text-gray-600">
                                Sudah dibayar: {formatCurrency(selectedBayarItem.denda_piket?.sudah_dibayar || 0)}
                            </div>
                            <div className="text-orange-600 font-medium">
                                Sisa: {formatCurrency(selectedBayarItem.denda_piket?.sisa || 0)}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleBayar}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nominal Bayar (Rp)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={selectedBayarItem?.denda_piket?.sisa || 0}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    bayarForm.errors.nominal
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={bayarForm.data.nominal}
                                onChange={(e) =>
                                    bayarForm.setData("nominal", e.target.value)
                                }
                                required
                            />
                            {bayarForm.errors.nominal && (
                                <p className="text-red-500 text-xs mt-1">
                                    {bayarForm.errors.nominal}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal
                            </label>
                            <input
                                type="date"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    bayarForm.errors.tanggal
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={bayarForm.data.tanggal}
                                onChange={(e) =>
                                    bayarForm.setData("tanggal", e.target.value)
                                }
                                required
                            />
                            {bayarForm.errors.tanggal && (
                                <p className="text-red-500 text-xs mt-1">
                                    {bayarForm.errors.tanggal}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan (opsional)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={bayarForm.data.keterangan}
                                onChange={(e) =>
                                    bayarForm.setData("keterangan", e.target.value)
                                }
                                placeholder="Contoh: Pembayaran denda periode 1"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bukti Pembayaran (opsional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                onChange={(e) =>
                                    bayarForm.setData("bukti", e.target.files[0] || null)
                                }
                            />
                            {bayarForm.errors.bukti && (
                                <p className="text-red-500 text-xs mt-1">
                                    {bayarForm.errors.bukti}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeBayarModal}
                                className="btn btn-ghost"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={bayarForm.processing}
                            >
                                {bayarForm.processing ? "Memproses..." : "Bayar"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default RekapAbsen;
