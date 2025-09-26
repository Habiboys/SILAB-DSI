import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KelolaGantiJadwal = ({ permintaan, periodeAktif, labInfo, flash }) => {
    const [selectedPermintaan, setSelectedPermintaan] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState(""); // 'approve' or 'reject'

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
                return "bg-yellow-100 text-yellow-800";
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
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

        // Use axios directly instead of Inertia.js post
        const formData = new FormData();
        formData.append("action", action);
        formData.append("catatan_admin", data.catatan_admin);
        formData.append(
            "_token",
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content")
        );

        // Get session cookie
        const sessionCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("silab_session="))
            ?.split("=")[1];

        // Get Laravel session cookie
        const laravelCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("laravel_session="))
            ?.split("=")[1];

        const cookies = [];
        if (sessionCookie) cookies.push(`silab_session=${sessionCookie}`);
        if (laravelCookie) cookies.push(`laravel_session=${laravelCookie}`);

        fetch(route("piket.ganti-jadwal.approve", selectedPermintaan.id), {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
                Cookie: cookies.join("; "),
            },
            credentials: "same-origin",
            body: new URLSearchParams({
                action: action,
                catatan_admin: data.catatan_admin,
                _token: document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
            }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else if (response.status === 419) {
                    throw new Error(
                        "CSRF token mismatch. Please refresh the page and try again."
                    );
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            })
            .then((data) => {
                toast.success(`Permintaan berhasil ${actionText}!`);
                closeModal();
                // Reload the page to update the data
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error:", error);
                toast.error(error.message || `Gagal ${actionText} permintaan`);
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

    // Group permintaan by status
    const pendingRequests = permintaan.filter((p) => p.status === "pending");
    const processedRequests = permintaan.filter((p) => p.status !== "pending");

    return (
        <DashboardLayout>
            <Head title="Kelola Ganti Jadwal Piket" />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Kelola Ganti Jadwal Piket
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Periode: {periodeAktif?.nama} - {labInfo?.nama}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-yellow-600"
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
                                <p className="text-sm font-medium text-gray-600">
                                    Menunggu Persetujuan
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {pendingRequests.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-green-600"
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
                                <p className="text-sm font-medium text-gray-600">
                                    Disetujui
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {
                                        permintaan.filter(
                                            (p) => p.status === "approved"
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg
                                    className="w-6 h-6 text-red-600"
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
                                <p className="text-sm font-medium text-gray-600">
                                    Ditolak
                                </p>
                                <p className="text-2xl font-semibold text-gray-900">
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

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Permintaan Menunggu Persetujuan (
                                {pendingRequests.length})
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {pendingRequests.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {item.user?.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
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
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Periode:{" "}
                                                    {item.periodePiket?.nama}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    <strong>Alasan:</strong>{" "}
                                                    {item.alasan}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
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
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
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
                                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
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

                {/* Processed Requests */}
                {processedRequests.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Riwayat Permintaan ({processedRequests.length})
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {processedRequests.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {item.user?.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
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
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Periode:{" "}
                                                    {item.periodePiket?.nama}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    <strong>Alasan:</strong>{" "}
                                                    {item.alasan}
                                                </p>
                                                {item.catatan_admin && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        <strong>
                                                            Catatan Admin:
                                                        </strong>{" "}
                                                        {item.catatan_admin}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(
                                                        item.created_at
                                                    )}
                                                </p>
                                                {item.approved_by && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Diproses oleh:{" "}
                                                        {item.approvedBy?.name}
                                                    </p>
                                                )}
                                                {item.approved_at && (
                                                    <p className="text-xs text-gray-500 mt-1">
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

                {/* Empty State */}
                {permintaan.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-12 text-center">
                            <div className="text-gray-400 mb-4">
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Belum Ada Permintaan
                            </h3>
                            <p className="text-gray-500">
                                Belum ada permintaan ganti jadwal piket untuk
                                periode ini.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Approve/Reject */}
            {isModalOpen && selectedPermintaan && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                                <svg
                                    className="w-6 h-6 text-blue-600"
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
                                <h3 className="text-lg font-medium text-gray-900">
                                    {action === "approve" ? "Setujui" : "Tolak"}{" "}
                                    Permintaan
                                </h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
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
                                    <p className="text-sm text-gray-500 mt-2">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catatan Admin
                                        {action === "reject" && (
                                            <span className="text-red-500">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required={action === "reject"}
                                    />
                                    {errors.catatan_admin && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {errors.catatan_admin}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 text-white rounded-md transition ${
                                            action === "approve"
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-red-600 hover:bg-red-700"
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
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default KelolaGantiJadwal;
