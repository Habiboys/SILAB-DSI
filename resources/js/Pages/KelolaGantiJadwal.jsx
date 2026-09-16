import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from 'sonner';
import Modal from "../Components/Modal";

const KelolaGantiJadwal = ({ permintaan, periodeAktif, labInfo, flash }) => {
    const [selectedPermintaan, setSelectedPermintaan] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState(""); 

    const { data, setData, post, processing, errors, reset } = useForm({
        catatan_admin: "",
    });

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

    const openModal = (permintaan, actionType) => {
        setSelectedPermintaan(permintaan);
        setAction(actionType);
        setIsModalOpen(true);
        setData("catatan_admin", "");
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPermintaan(null);
        setAction("");
        reset();
    };

    const handleApproveReject = (e) => {
        e.preventDefault();

        if (!selectedPermintaan) return;

        const actionText = action === "approve" ? "menyetujui" : "menolak";

        post(route("piket.ganti-jadwal.approve", selectedPermintaan.id), {
            action,
            catatan_admin: data.catatan_admin,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Permintaan berhasil ${actionText}!`);
                closeModal();
            },
            onError: (err) => {
                const msg =
                    err?.message ||
                    "Anda tidak memiliki akses untuk memproses permintaan ini.";
                toast.error(msg);
            },
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    
    const pendingRequests = permintaan.filter((p) => p.status === "pending");
    const processedRequests = permintaan.filter((p) => p.status !== "pending");

    return (
        <DashboardLayout>
            <Head title="Kelola Ganti Jadwal Piket" />


            <div className="space-y-6">
                
                <div className="bg-base-100 rounded-lg shadow-sm">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-base-content">
                            Kelola Ganti Jadwal Piket
                        </h2>
                        <p className="text-sm text-base-content/60 mt-1">
                            Periode: {periodeAktif?.nama} - {labInfo?.nama}
                        </p>
                    </div>
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-base-100 rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-warning/20 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-warning"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-base-content/70">
                                    Menunggu Persetujuan
                                </p>
                                <p className="text-2xl font-semibold text-base-content">
                                    {pendingRequests.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-100 rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-success/15 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-success"
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
                            <div className="ml-4">
                                <p className="text-sm font-medium text-base-content/70">
                                    Disetujui
                                </p>
                                <p className="text-2xl font-semibold text-base-content">
                                    {
                                        permintaan.filter(
                                            (p) => p.status === "approved"
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-100 rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-error/15 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-error"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-base-content/70">
                                    Ditolak
                                </p>
                                <p className="text-2xl font-semibold text-base-content">
                                    {
                                        permintaan.filter(
                                            (p) => p.status === "rejected"
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                
                {pendingRequests.length > 0 && (
                    <div className="bg-base-100 rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-base-content">
                                Permintaan Menunggu Persetujuan (
                                {pendingRequests.length})
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {pendingRequests.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-sm font-medium text-base-content">
                                                        {item.user?.name}
                                                    </span>
                                                    <span className="text-sm text-base-content/60">
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
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {getStatusText(
                                                            item.status
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-base-content/70 mb-2">
                                                    Periode:{" "}
                                                    {item.periode_nama || item.periodePiket?.nama || "-"}
                                                </p>
                                                <p className="text-sm text-base-content/60">
                                                    <strong>Alasan:</strong>{" "}
                                                    {item.alasan}
                                                </p>
                                                <p className="text-xs text-base-content/50 mt-2">
                                                    Diajukan:{" "}
                                                    {formatDate(
                                                        item.created_at
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() =>
                                                        openModal(
                                                            item,
                                                            "approve"
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-success text-white text-sm rounded-md hover:bg-success transition"
                                                >
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openModal(
                                                            item,
                                                            "reject"
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-error text-white text-sm rounded-md hover:bg-error transition"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                
                {processedRequests.length > 0 && (
                    <div className="bg-base-100 rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-base-content">
                                Riwayat Permintaan ({processedRequests.length})
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {processedRequests.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm font-medium text-base-content">
                                                        {item.user?.name}
                                                    </span>
                                                    <span className="text-sm text-base-content/60">
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
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {getStatusText(
                                                            item.status
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-base-content/70 mt-1">
                                                    Periode:{" "}
                                                    {item.periode_nama || item.periodePiket?.nama || "-"}
                                                </p>
                                                <p className="text-sm text-base-content/60 mt-1">
                                                    <strong>Alasan:</strong>{" "}
                                                    {item.alasan}
                                                </p>
                                                {item.catatan_admin && (
                                                    <p className="text-sm text-base-content/60 mt-1">
                                                        <strong>
                                                            Catatan Admin:
                                                        </strong>{" "}
                                                        {item.catatan_admin}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-base-content/60">
                                                    {formatDate(
                                                        item.created_at
                                                    )}
                                                </p>
                                                {item.approved_by && (
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        Diproses oleh:{" "}
                                                        {item.approvedBy?.name}
                                                    </p>
                                                )}
                                                {item.approved_at && (
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        {formatDate(
                                                            item.approved_at
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                
                {permintaan.length === 0 && (
                    <div className="bg-base-100 rounded-lg shadow-sm">
                        <div className="p-12 text-center">
                            <div className="text-base-content/50 mb-4">
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
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-base-content mb-2">
                                Belum Ada Permintaan
                            </h3>
                            <p className="text-base-content/60">
                                Belum ada permintaan ganti jadwal piket untuk
                                periode ini.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            
            <Modal
                show={isModalOpen && !!selectedPermintaan}
                onClose={closeModal}
                maxWidth="md"
            >
                <div className="p-6">
                {selectedPermintaan && (
                <>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/15 rounded-full">
                                <svg
                                    className="w-6 h-6 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="mt-2 text-center">
                                <h3 className="text-lg font-medium text-base-content">
                                    {action === "approve" ? "Setujui" : "Tolak"}{" "}
                                    Permintaan
                                </h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-base-content/60">
                                        <strong>
                                            {selectedPermintaan.user?.name}
                                        </strong>{" "}
                                        ingin mengganti jadwal dari{" "}
                                        <strong>
                                            {
                                                dayNames[
                                                    selectedPermintaan.hari_lama
                                                ]
                                            }
                                        </strong>{" "}
                                        ke{" "}
                                        <strong>
                                            {
                                                dayNames[
                                                    selectedPermintaan.hari_baru
                                                ]
                                            }
                                        </strong>
                                    </p>
                                    <p className="text-sm text-base-content/60 mt-2">
                                        <strong>Alasan:</strong>{" "}
                                        {selectedPermintaan.alasan}
                                    </p>
                                </div>
                            </div>
                            <form
                                onSubmit={handleApproveReject}
                                className="mt-4"
                            >
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-base-content mb-2">
                                        Catatan Admin
                                        {action === "reject" && (
                                            <span className="text-error">
                                                {" "}
                                                *
                                            </span>
                                        )}
                                    </label>
                                    <textarea
                                        value={data.catatan_admin}
                                        onChange={(e) =>
                                            setData(
                                                "catatan_admin",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            action === "approve"
                                                ? "Catatan (opsional)..."
                                                : "Berikan alasan penolakan..."
                                        }
                                        className="w-full px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        rows="3"
                                        required={action === "reject"}
                                    />
                                    {errors.catatan_admin && (
                                        <div className="text-error text-sm mt-1">
                                            {errors.catatan_admin}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-content/30 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 text-white rounded-md transition ${
                                            action === "approve"
                                                ? "bg-success hover:bg-success"
                                                : "bg-error hover:bg-error"
                                        } ${
                                            processing
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {processing
                                            ? "Memproses..."
                                            : action === "approve"
                                            ? "Setujui"
                                            : "Tolak"}
                                    </button>
                                </div>
                            </form>
                </>
                )}
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default KelolaGantiJadwal;
