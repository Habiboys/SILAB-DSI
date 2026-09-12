import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye, Edit, Trash2 } from "lucide-react";

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
    canManageManualAbsensi,
    canDeleteManualAbsensi,
    canVerifyAbsensi,
    manualUsers,
    currentKepengurusanLabId,
}) => {
    
    const { auth } = usePage().props;
    const { can } = usePermission();

    
    const { selectedLab } = useLab();

    
    const canAccess = can("absensi.view_riwayat");

    
    const [selectedPeriode, setSelectedPeriode] = useState(periode?.id || "");
    
    const { selected_kepengurusan } = usePage().props;
    const selectedTahun = selected_kepengurusan
        ? String(selected_kepengurusan.id)
        : "";
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualMode, setManualMode] = useState("create");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [itemToReject, setItemToReject] = useState(null);

    const manualForm = useForm({
        kepengurusan_lab_id: currentKepengurusanLabId || selectedTahun || "",
        user_id: "",
        tanggal: "",
        jam_masuk: "",
        jam_keluar: "",
        kegiatan: "",
    });

    
    const handlePeriodeChange = (e) => {
        const periodeId = e.target.value;
        setSelectedPeriode(periodeId);
        
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

    
    

    
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    
    const viewDetails = (item) => {
        setSelectedItem(item);
        setViewModalOpen(true);
    };

    const normalizeTime = (value) => {
        if (!value) return "";
        return String(value).substring(0, 5);
    };

    const openCreateManualModal = () => {
        setManualMode("create");
        setSelectedItem(null);
        manualForm.reset();
        manualForm.setData({
            kepengurusan_lab_id:
                currentKepengurusanLabId || selectedTahun || "",
            user_id: "",
            tanggal: "",
            jam_masuk: "",
            jam_keluar: "",
            kegiatan: "",
        });
        setManualModalOpen(true);
    };

    const openEditManualModal = (item) => {
        setManualMode("edit");
        setSelectedItem(item);
        manualForm.clearErrors();
        manualForm.setData({
            kepengurusan_lab_id:
                currentKepengurusanLabId || selectedTahun || "",
            user_id: item.user_id || item.user?.id || "",
            tanggal: item.tanggal ? String(item.tanggal).substring(0, 10) : "",
            jam_masuk: normalizeTime(item.jam_masuk),
            jam_keluar: normalizeTime(item.jam_keluar),
            kegiatan: item.kegiatan || "",
        });
        setManualModalOpen(true);
    };

    const closeManualModal = () => {
        setManualModalOpen(false);
        setSelectedItem(null);
        manualForm.clearErrors();
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();

        if (!(currentKepengurusanLabId || selectedTahun)) {
            toast.error("Pilih tahun kepengurusan terlebih dahulu.");
            return;
        }

        if (manualMode === "create") {
            manualForm.post(route("piket.absensi.manual.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Absensi manual berhasil ditambahkan.");
                    closeManualModal();
                },
                onError: (errors) => {
                    const firstError =
                        Object.values(errors)[0] ||
                        "Gagal menyimpan absensi manual.";
                    toast.error(firstError);
                },
            });
            return;
        }

        manualForm.put(route("piket.absensi.manual.update", selectedItem?.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Absensi manual berhasil diperbarui.");
                closeManualModal();
            },
            onError: (errors) => {
                const firstError =
                    Object.values(errors)[0] ||
                    "Gagal memperbarui absensi manual.";
                toast.error(firstError);
            },
        });
    };

    const handleDeleteManual = (item) => {
        if (!item?.is_manual) {
            toast.error("Hanya data manual yang bisa dihapus.");
            return;
        }

        const ok = window.confirm(
            `Hapus absensi manual ${item.user?.name || "anggota"} pada ${formatDate(item.tanggal)}?`,
        );
        if (!ok) return;

        router.delete(route("piket.absensi.manual.destroy", item.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("Absensi manual berhasil dihapus."),
            onError: (errors) => {
                const firstError =
                    Object.values(errors || {})[0] ||
                    "Gagal menghapus absensi manual.";
                toast.error(firstError);
            },
        });
    };

    const openRejectModal = (item) => {
        setItemToReject(item);
        setRejectReason("");
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setItemToReject(null);
        setRejectReason("");
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) {
            toast.error("Alasan penolakan wajib diisi.");
            return;
        }

        router.patch(
            route("piket.absensi.verify", itemToReject.id),
            {
                status: "rejected",
                verification_note: rejectReason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Absensi ditolak.");
                    closeRejectModal();
                },
                onError: (errors) => {
                    const firstError =
                        Object.values(errors || {})[0] ||
                        "Gagal memverifikasi absensi.";
                    toast.error(firstError);
                },
            }
        );
    };

    const handleVerify = (item, status) => {
        if (status === "rejected") {
            openRejectModal(item);
            return;
        }

        router.patch(
            route("piket.absensi.verify", item.id),
            {
                status,
                verification_note: "",
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Absensi di-ACC."),
                onError: (errors) => {
                    const firstError =
                        Object.values(errors || {})[0] ||
                        "Gagal memverifikasi absensi.";
                    toast.error(firstError);
                },
            },
        );
    };

    const verificationBadge = (status) => {
        if (status === "rejected") {
            return "badge-error";
        }
        return "badge-success";
    };

    
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    
    useEffect(() => {
        setSelectedPeriode("");
    }, [selectedLab, selectedTahun]);

    useEffect(() => {
        manualForm.setData(
            "kepengurusan_lab_id",
            currentKepengurusanLabId || selectedTahun || "",
        );
    }, [currentKepengurusanLabId, selectedTahun]);

    
    useEffect(() => {
        if (canAccess && selectedLab) {
            
        }
    }, [canAccess, selectedLab]);

    
    const renderUserName = (user) => {
        if (!user) return "-";
        return user.id === auth.user.id ? `${user.name} (Anda)` : user.name;
    };

    return (
        <DashboardLayout>
            <Head title="Riwayat Absensi" />

            <div className="bg-white rounded-lg shadow-sm">
                
                <div className="p-6 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Riwayat Absensi
                            {canAccess &&
                                selectedLab &&
                                ` - ${selectedLab.nama}`}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4">
                            
                            

                            
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

                            {canManageManualAbsensi && (
                                <button
                                    type="button"
                                    onClick={openCreateManualModal}
                                    className="btn btn-primary btn-sm"
                                >
                                    Input Absen Manual
                                </button>
                            )}
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
                    <div className="silab-table-wrap">
                        <table className="silab-table">
                            <thead>
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left">
                                        No
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-left">
                                        Tanggal
                                    </th>
                                    
                                    {canAccess && (
                                        <th className="px-3 sm:px-6 py-3 text-left">
                                            Nama
                                        </th>
                                    )}
                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                        Jam Masuk
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-left whitespace-nowrap">
                                        Jam Keluar
                                    </th>
                                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left">
                                        Kegiatan
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-left">
                                        Verifikasi
                                    </th>
                                    <th className="px-3 sm:px-6 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {riwayatAbsensi.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50 ${item.user?.id === auth.user.id ? "bg-blue-50" : ""}`}
                                    >
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                                            <span className="hidden sm:inline">
                                                {formatDate(item.tanggal)}
                                            </span>
                                            <span className="sm:hidden">
                                                {item.tanggal
                                                    ? new Date(
                                                          item.tanggal,
                                                      ).toLocaleDateString(
                                                          "id-ID",
                                                          {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "2-digit",
                                                          },
                                                      )
                                                    : "-"}
                                            </span>
                                        </td>
                                        {canAccess && (
                                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {renderUserName(
                                                            item.user,
                                                        )}
                                                    </span>
                                                    {item.is_manual && (
                                                        <span className="badge badge-sm badge-neutral">Manual</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {item.jam_masuk
                                                ? item.jam_masuk.substring(0, 5)
                                                : "-"}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {item.jam_keluar
                                                ? item.jam_keluar.substring(
                                                      0,
                                                      5,
                                                  )
                                                : "-"}
                                        </td>
                                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {item.kegiatan}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`badge badge-sm ${verificationBadge(item.verification_status)}`}
                                            >
                                                {item.verification_status ===
                                                "rejected"
                                                    ? "Ditolak"
                                                    : "ACC"}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => viewDetails(item)}
                                                    className="btn btn-ghost btn-sm btn-square text-primary"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {canManageManualAbsensi && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditManualModal(item)}
                                                        className="btn btn-ghost btn-sm btn-square text-warning"
                                                        title="Edit Absensi"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDeleteManualAbsensi && item.is_manual && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteManual(item)}
                                                        className="btn btn-ghost btn-sm btn-square text-error"
                                                        title="Hapus Absensi Manual"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canVerifyAbsensi && (
                                                    <>
                                                        {item.verification_status !==
                                                            "approved" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerify(item, "approved")}
                                                                className="btn btn-ghost btn-sm btn-square text-success"
                                                                title="Terima Absensi"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {item.verification_status !== "rejected" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerify(item, "rejected")}
                                                                className="btn btn-ghost btn-sm btn-square text-warning"
                                                                title="Tolak Absensi"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
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

            
            <Modal
                show={viewModalOpen && !!selectedItem}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedItem(null);
                }}
                maxWidth="2xl"
            >
                {selectedItem && (
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Detail Absensi
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal</p>
                                <p className="font-medium">
                                    {formatDate(selectedItem?.tanggal)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Periode</p>
                                <p className="font-medium">
                                    {selectedItem?.periode || "-"}
                                </p>
                            </div>
                            {canAccess && (
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Nama
                                    </p>
                                    <p className="font-medium">
                                        {renderUserName(selectedItem?.user)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">
                                    Jam Masuk
                                </p>
                                <p className="font-medium">
                                    {selectedItem?.jam_masuk || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Jam Keluar
                                </p>
                                <p className="font-medium">
                                    {selectedItem?.jam_keluar || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Verifikasi
                                </p>
                                <p className="font-medium">
                                    {selectedItem?.verification_status ===
                                    "rejected"
                                        ? "Ditolak"
                                        : "ACC"}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">
                                Kegiatan
                            </p>
                            <p className="p-3 bg-gray-50 rounded-md">
                                {selectedItem?.kegiatan ?? "-"}
                            </p>
                        </div>

                        {selectedItem?.verification_status === "rejected" &&
                            selectedItem?.verification_note && (
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-1">
                                        Alasan Penolakan
                                    </p>
                                    <p className="p-3 bg-red-50 rounded-md text-red-700">
                                        {selectedItem?.verification_note}
                                    </p>
                                </div>
                            )}

                        
                        {selectedItem?.foto_checkin ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                        Foto Check-in
                                    </p>
                                    <div className="flex justify-center bg-gray-50 rounded-lg p-2">
                                        <img
                                            src={selectedItem?.foto_checkin}
                                            alt="Foto Check-in"
                                            className="max-h-56 w-full object-contain rounded-lg border"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display =
                                                    "flex";
                                            }}
                                        />
                                        <div className="hidden h-32 w-full items-center justify-center text-gray-400 text-sm">
                                            Gagal memuat foto
                                        </div>
                                    </div>
                                </div>

                                
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                                        Foto Check-out
                                    </p>
                                    {(selectedItem.foto_checkout ??
                                    selectedItem.foto) ? (
                                        <div className="flex justify-center bg-gray-50 rounded-lg p-2">
                                            <img
                                                src={
                                                    selectedItem?.foto_checkout ??
                                                    selectedItem?.foto
                                                }
                                                alt="Foto Check-out"
                                                className="max-h-56 w-full object-contain rounded-lg border"
                                                onError={(e) => {
                                                    e.target.style.display =
                                                        "none";
                                                    e.target.nextSibling.style.display =
                                                        "flex";
                                                }}
                                            />
                                            <div className="hidden h-32 w-full items-center justify-center text-gray-400 text-sm">
                                                Gagal memuat foto
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                            Belum check-out
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (selectedItem?.foto_checkout ??
                          selectedItem?.foto) ? (
                            
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Foto Absensi
                                </p>
                                <div className="flex justify-center bg-gray-50 rounded-lg p-2">
                                    <img
                                        src={
                                            selectedItem?.foto_checkout ??
                                            selectedItem?.foto
                                        }
                                        alt="Foto Absensi"
                                        className="max-h-56 w-full object-contain rounded-lg border"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display =
                                                "flex";
                                        }}
                                    />
                                    <div className="hidden h-32 w-full items-center justify-center text-gray-400 text-sm">
                                        Gagal memuat foto
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400 text-center text-sm">
                                Tidak ada foto
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedItem(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                show={manualModalOpen}
                onClose={closeManualModal}
                maxWidth="xl"
            >
                <form onSubmit={handleManualSubmit} className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {manualMode === "create"
                            ? "Input Absen Manual"
                            : "Edit Absensi Manual"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Anggota
                            </label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={manualForm.data.user_id}
                                onChange={(e) =>
                                    manualForm.setData(
                                        "user_id",
                                        e.target.value,
                                    )
                                }
                                disabled={manualMode === "edit"}
                                required
                            >
                                <option value="">Pilih anggota</option>
                                {(manualUsers || []).map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Tanggal
                            </label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={manualForm.data.tanggal}
                                onChange={(e) =>
                                    manualForm.setData(
                                        "tanggal",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Jam Masuk
                            </label>
                            <input
                                type="time"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={manualForm.data.jam_masuk}
                                onChange={(e) =>
                                    manualForm.setData(
                                        "jam_masuk",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Jam Keluar (opsional)
                            </label>
                            <input
                                type="time"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={manualForm.data.jam_keluar}
                                onChange={(e) =>
                                    manualForm.setData(
                                        "jam_keluar",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">
                                Kegiatan
                            </label>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                rows={3}
                                value={manualForm.data.kegiatan}
                                onChange={(e) =>
                                    manualForm.setData(
                                        "kegiatan",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={closeManualModal}
                            className="btn btn-ghost"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={manualForm.processing}
                            className="btn btn-primary"
                        >
                            {manualForm.processing
                                ? "Menyimpan..."
                                : manualMode === "create"
                                  ? "Simpan"
                                  : "Perbarui"}
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal
                show={rejectModalOpen}
                onClose={closeRejectModal}
                maxWidth="md"
            >
                <form onSubmit={handleConfirmReject} className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Tolak Absensi
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Masukkan alasan penolakan absensi ini. Alasan akan dapat dilihat oleh asisten terkait.
                    </p>
                    
                    <div className="mb-4">
                        <label className="block text-sm text-gray-700 mb-1">
                            Alasan Penolakan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm outline-none"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                            placeholder="Contoh: Bukti foto tidak valid..."
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={closeRejectModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!rejectReason.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-60"
                        >
                            Tolak Absensi
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default RiwayatAbsen;
