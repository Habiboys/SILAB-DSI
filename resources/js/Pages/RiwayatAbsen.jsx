import { useLab } from "@/Components/LabContext";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const RiwayatAbsen = ({
    riwayatAbsensi,
    periode,
    periodes,
    isAdmin,
    isSuperAdmin,
    tahunKepengurusan,
    laboratorium,
    currentTahunId,
    flash,
}) => {
    // Get the authenticated user
    const { auth } = usePage().props;
    const { can } = usePermission();

    // Use the lab context to get the selected lab
    const { selectedLab } = useLab();

    // Penentuan akses dengan permission-based
    const canAccess = can("absensi.view_riwayat");

    // State for filters
    const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || "");
    // const [selectedTahun, setSelectedTahun] = useState(currentTahunId || ''); // Removed
    const { selected_kepengurusan } = usePage().props;
    const selectedTahun = selected_kepengurusan
        ? String(selected_kepengurusan.id)
        : "";
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Handle period selection change
    const handlePeriodeChange = (e) => {
        const periodeId = e.target.value;
        setSelectedPeriode(periodeId);
        // Prepare query parameters
        const params = { periode_id: periodeId };
        if (selectedLab) {
            params.lab_id = selectedLab.id;
        }
        if (selectedTahun) {
            params.kepengurusan_lab_id = selectedTahun;
        }
        router.get(route("piket.absensi.show"), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Handle tahun selection change - REMOVED
    // const handleTahunChange = (e) => { ... }

    // Format date to Indonesian format
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // View attendance details
    const viewDetails = (item) => {
        setSelectedItem(item);
        setViewModalOpen(true);
    };

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Reset selectedPeriode when lab or year changes
    useEffect(() => {
        setSelectedPeriode("");
    }, [selectedLab, selectedTahun]);

    // Pastikan URL selalu mengandung lab_id saat lab berubah - tahun dihandle di Navbar
    useEffect(() => {
        if (canAccess && selectedLab) {
            // Navbar handles navigation
        }
    }, [canAccess, selectedLab]);

    // Render user name or you (for own records)
    const renderUserName = (user) => {
        if (!user) return "-";
        return user.id === auth.user.id ? `${user.name} (Anda)` : user.name;
    };

    return (
        <DashboardLayout>
            <Head title="Riwayat Absensi" />

            <div className="bg-white rounded-lg shadow-sm">
                {/* Header with filters */}
                <div className="p-6 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Riwayat Absensi
                            {canAccess &&
                                selectedLab &&
                                ` - ${selectedLab.nama}`}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Tahun selection (untuk user yang bisa akses) */}
                            {/* Tahun selection Removed - Handled by Navbar */}

                            {/* Period selection - for all users */}
                            <div>
                                <select
                                    id="periode"
                                    value={selectedPeriode}
                                    onChange={handlePeriodeChange}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
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
                                                {selected_kepengurusan?.tahun ||
                                                    "-"}
                                            </strong>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content */}
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
                            melihat riwayat absensi.
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
                            Silakan pilih periode piket untuk melihat riwayat
                            absensi.
                        </p>
                    </div>
                ) : riwayatAbsensi.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mb-4 text-blue-500">
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
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tidak Ada Data Absensi
                        </h3>
                        <p className="text-gray-600">
                            {canAccess
                                ? "Belum ada data absensi untuk periode piket yang dipilih."
                                : "Anda belum memiliki data absensi untuk periode piket yang dipilih."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tanggal
                                    </th>
                                    {/* Show Nama column for admins/superadmins or if viewing multiple users' data */}
                                    {canAccess && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jam Masuk
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jam Keluar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kegiatan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {riwayatAbsensi.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50 ${item.user?.id === auth.user.id ? "bg-blue-50" : ""}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(item.tanggal)}
                                        </td>
                                        {canAccess && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderUserName(item.user)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jam_masuk || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jam_keluar || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {item.kegiatan}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    viewDetails(item)
                                                }
                                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Detail Absensi
                            </h3>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal</p>
                                <p className="font-medium">
                                    {formatDate(selectedItem.tanggal)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Periode</p>
                                <p className="font-medium">
                                    {selectedItem.periode || "-"}
                                </p>
                            </div>
                            {canAccess && (
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Nama
                                    </p>
                                    <p className="font-medium">
                                        {renderUserName(selectedItem.user)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">
                                    Jam Masuk
                                </p>
                                <p className="font-medium">
                                    {selectedItem.jam_masuk || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Jam Keluar
                                </p>
                                <p className="font-medium">
                                    {selectedItem.jam_keluar || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">
                                Kegiatan
                            </p>
                            <p className="p-3 bg-gray-50 rounded-md">
                                {selectedItem.kegiatan}
                            </p>
                        </div>

                        {/* Format baru: ada foto_checkin → tampilkan dua foto terpisah */}
                        {/* Format lama: hanya ada foto (satu foto) → tampilkan sebagai "Foto Absensi" */}
                        {selectedItem.foto_checkin ? (
                            <>
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-2">
                                        Foto Check-in
                                    </p>
                                    <div className="flex justify-center">
                                        <img
                                            src={selectedItem.foto_checkin}
                                            alt="Foto Check-in"
                                            className="max-h-64 rounded-lg border"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                const canvas =
                                                    document.createElement(
                                                        "canvas",
                                                    );
                                                canvas.width = 300;
                                                canvas.height = 150;
                                                const ctx =
                                                    canvas.getContext("2d");
                                                ctx.fillStyle = "#f3f4f6";
                                                ctx.fillRect(0, 0, 300, 150);
                                                ctx.fillStyle = "#6b7280";
                                                ctx.font =
                                                    "14px Arial, sans-serif";
                                                ctx.textAlign = "center";
                                                ctx.textBaseline = "middle";
                                                ctx.fillText(
                                                    "Tidak dapat memuat gambar",
                                                    150,
                                                    75,
                                                );
                                                e.target.src =
                                                    canvas.toDataURL();
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        Foto Check-out
                                    </p>
                                    {selectedItem.foto ? (
                                        <div className="flex justify-center">
                                            <img
                                                src={selectedItem.foto}
                                                alt="Foto Check-out"
                                                className="max-h-64 rounded-lg border"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    const canvas =
                                                        document.createElement(
                                                            "canvas",
                                                        );
                                                    canvas.width = 300;
                                                    canvas.height = 150;
                                                    const ctx =
                                                        canvas.getContext("2d");
                                                    ctx.fillStyle = "#f3f4f6";
                                                    ctx.fillRect(
                                                        0,
                                                        0,
                                                        300,
                                                        150,
                                                    );
                                                    ctx.fillStyle = "#6b7280";
                                                    ctx.font =
                                                        "14px Arial, sans-serif";
                                                    ctx.textAlign = "center";
                                                    ctx.textBaseline = "middle";
                                                    ctx.fillText(
                                                        "Tidak dapat memuat gambar",
                                                        150,
                                                        75,
                                                    );
                                                    e.target.src =
                                                        canvas.toDataURL();
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 text-gray-400 text-center rounded-md">
                                            Belum check-out
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : selectedItem.foto ? (
                            /* Format lama: hanya satu foto */
                            <div>
                                <p className="text-sm text-gray-500 mb-2">
                                    Foto Absensi
                                </p>
                                <div className="flex justify-center">
                                    <img
                                        src={selectedItem.foto}
                                        alt="Foto Absensi"
                                        className="max-h-64 rounded-lg border"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            const canvas =
                                                document.createElement(
                                                    "canvas",
                                                );
                                            canvas.width = 300;
                                            canvas.height = 150;
                                            const ctx = canvas.getContext("2d");
                                            ctx.fillStyle = "#f3f4f6";
                                            ctx.fillRect(0, 0, 300, 150);
                                            ctx.fillStyle = "#6b7280";
                                            ctx.font = "14px Arial, sans-serif";
                                            ctx.textAlign = "center";
                                            ctx.textBaseline = "middle";
                                            ctx.fillText(
                                                "Tidak dapat memuat gambar",
                                                150,
                                                75,
                                            );
                                            e.target.src = canvas.toDataURL();
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 text-gray-400 text-center rounded-md">
                                Tidak ada foto
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default RiwayatAbsen;
