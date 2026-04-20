import ConfirmModal from "@/Components/ConfirmModal";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Edit, Settings, Trash2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PeriodePiket = ({
    periodes,
    kepengurusanlab,
    laboratorium,
    filters,
    errors,
    flash,
    pengaturanPiket,
}) => {
    const { selectedLab, setSelectedLab } = useLab();
    const { auth } = usePage().props;
    const { can } = usePermission();

    // Permission-based access control
    const canManage = can("piket.manage-periode");

    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPeriode, setSelectedPeriode] = useState(null);
    const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] =
        useState(false);
    const [isPengaturanModalOpen, setIsPengaturanModalOpen] = useState(false);

    // Form untuk tambah periode
    const createForm = useForm({
        nama: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        isactive: false,
        lama_piket: 120,
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        lab_id: selectedLab ? selectedLab.id : "",
    });

    // Form untuk edit periode
    const editForm = useForm({
        nama: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        isactive: false,
        lama_piket: 120,
        lab_id: selectedLab ? selectedLab.id : "",
    });

    // Form untuk generate otomatis
    const autoGenerateForm = useForm({
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        tanggal_mulai: "",
        tanggal_akhir: "",
        lama_piket: 120,
        lab_id: selectedLab ? selectedLab.id : "",
        tahun_id: filters?.tahun_id || "",
    });

    // Form untuk pengaturan denda
    const pengaturanForm = useForm({
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        ada_denda: pengaturanPiket?.ada_denda ?? false,
        nominal_denda: pengaturanPiket?.nominal_denda ?? "",
    });

    // Update lab_id in forms when lab changes
    useEffect(() => {
        if (selectedLab) {
            createForm.setData("lab_id", selectedLab.id);
            editForm.setData("lab_id", selectedLab.id);
        }
    }, [selectedLab]);

    // Handle lab change via context - only reload if URL params don't match
    useEffect(() => {
        if (selectedLab) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLabId = urlParams.get("lab_id");

            if (urlLabId !== String(selectedLab.id)) {
                router.get(
                    "/piket/periode-piket",
                    {
                        lab_id: selectedLab.id,
                    },
                    {
                        preserveState: true,
                        replace: true,
                    },
                );
            }
        }
    }, [selectedLab]);

    // Debounced search handler
    const handleSearch = debounce((query) => {
        router.get(
            route(route().current()),
            { ...filters, search: query, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);

    const onSearchChange = (e) => {
        setSearch(e.target.value);
        handleSearch(e.target.value);
    };

    const handlePerPageChange = (e) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        router.get(
            route(route().current()),
            { ...filters, perPage: newPerPage, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    // Helper function to calculate Friday from a Monday date
    const calculateFriday = (mondayDate) => {
        if (!mondayDate) return "";

        // Parse the date
        const date = new Date(mondayDate);

        // Check if it's a Monday
        if (date.getDay() !== 1) {
            return ""; // Not a Monday, return empty
        }

        // Calculate the Friday (Monday + 4 days)
        const friday = new Date(date);
        friday.setDate(date.getDate() + 4);

        // Format as YYYY-MM-DD for input
        return friday.toISOString().split("T")[0];
    };

    // Function to check if a date is a Monday
    const isMonday = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getDay() === 1; // 1 = Monday
    };

    // Handle start date change in create form
    const handleStartDateChange = (e, formType = "create") => {
        const startDate = e.target.value;

        if (formType === "create") {
            createForm.setData("tanggal_mulai", startDate);

            // Only auto-calculate end date if start date is a Monday
            if (isMonday(startDate)) {
                const fridayDate = calculateFriday(startDate);
                createForm.setData("tanggal_selesai", fridayDate);
            } else if (startDate) {
                // Notify user if not a Monday
                toast.warning(
                    "Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.",
                );
            }
        } else {
            editForm.setData("tanggal_mulai", startDate);

            // Only auto-calculate end date if start date is a Monday
            if (isMonday(startDate)) {
                const fridayDate = calculateFriday(startDate);
                editForm.setData("tanggal_selesai", fridayDate);
            } else if (startDate) {
                // Notify user if not a Monday
                toast.warning(
                    "Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.",
                );
            }
        }
    };

    // Handlers for modals
    const openCreateModal = () => {
        if (!kepengurusanlab) {
            toast.error(
                "Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu",
            );
            return;
        }

        createForm.reset();
        createForm.setData({
            kepengurusan_lab_id: kepengurusanlab.id,
            lab_id: selectedLab ? selectedLab.id : "",
            isactive: false,
        });
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        createForm.reset();
    };

    const openEditModal = (periode) => {
        setSelectedPeriode(periode);

        // Better date formatting to handle timezone issues
        const formatDateForInput = (dateString) => {
            if (!dateString) return "";

            // If it's already in YYYY-MM-DD format, return as is
            if (
                typeof dateString === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(dateString)
            ) {
                return dateString;
            }

            // Otherwise, parse and format using local timezone
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";

            // Use local date to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const formattedStartDate = formatDateForInput(periode.tanggal_mulai);
        const formattedEndDate = formatDateForInput(periode.tanggal_selesai);

        editForm.setData({
            nama: periode.nama || "",
            tanggal_mulai: formattedStartDate,
            tanggal_selesai: formattedEndDate,
            isactive: periode.isactive || false,
            lama_piket: periode.lama_piket || 120,
            lab_id: selectedLab ? selectedLab.id : "",
        });

        console.log("Opening edit modal for periode:", periode);
        console.log("Formatted dates:", {
            tanggal_mulai: formattedStartDate,
            tanggal_selesai: formattedEndDate,
        });

        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPeriode(null);
        editForm.reset();
    };

    const openDeleteModal = (periode) => {
        setSelectedPeriode(periode);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPeriode(null);
    };

    // Handlers for form submission
    const handleCreate = (e) => {
        e.preventDefault();

        // Perform client-side validation before submitting
        const startDate = new Date(createForm.data.tanggal_mulai);
        const endDate = new Date(createForm.data.tanggal_selesai);

        // Check if start date is Monday and end date is Friday
        if (startDate.getDay() !== 1) {
            toast.error("Tanggal mulai harus hari Senin");
            return;
        }

        if (endDate.getDay() !== 5) {
            toast.error("Tanggal selesai harus hari Jumat");
            return;
        }

        // Check if end date is Friday of the same week (start date + 4 days)
        const expectedFriday = new Date(startDate);
        expectedFriday.setDate(startDate.getDate() + 4);

        if (endDate.toDateString() !== expectedFriday.toDateString()) {
            toast.error(
                "Tanggal selesai harus Jumat di minggu yang sama dengan tanggal mulai",
            );
            return;
        }

        createForm.post(route("piket.periode-piket.store"), {
            onSuccess: () => {
                closeCreateModal();
                toast.success("Periode piket berhasil ditambahkan");
            },
            onError: (errors) => {
                console.error("Create errors:", errors);
                if (errors.tanggal_mulai) {
                    toast.error(errors.tanggal_mulai);
                } else if (errors.tanggal_selesai) {
                    toast.error(errors.tanggal_selesai);
                } else {
                    toast.error("Gagal menambahkan periode piket");
                }
            },
            preserveState: true,
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        // Log the form data for debugging
        console.log("Edit form data:", editForm.data);

        // Let backend handle validation instead of client-side validation
        editForm.put(route("piket.periode-piket.update", selectedPeriode.id), {
            onSuccess: () => {
                closeEditModal();
                toast.success("Periode piket berhasil diperbarui");
            },
            onError: (errors) => {
                console.error("Edit errors:", errors);
                if (errors.tanggal_mulai) {
                    toast.error(errors.tanggal_mulai);
                } else if (errors.tanggal_selesai) {
                    toast.error(errors.tanggal_selesai);
                } else if (errors.nama) {
                    toast.error(errors.nama);
                } else {
                    toast.error("Gagal memperbarui periode piket");
                }
            },
            preserveState: true,
        });
    };

    const handleDelete = () => {
        router.delete(
            route("piket.periode-piket.destroy", selectedPeriode.id),
            {
                onSuccess: () => {
                    closeDeleteModal();
                    toast.success("Periode piket berhasil dihapus");
                },
                onError: (errors) => {
                    console.error("Delete error:", errors);
                    closeDeleteModal();
                    if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        toast.error("Gagal menghapus periode piket");
                    }
                },
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const openAutoGenerateModal = () => {
        if (!kepengurusanlab) {
            toast.error(
                "Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu",
            );
            return;
        }
        autoGenerateForm.reset();
        autoGenerateForm.setData({
            kepengurusan_lab_id: kepengurusanlab.id,
            tanggal_mulai: "",
            tanggal_akhir: "",
            lama_piket: 120,
            lab_id: selectedLab ? selectedLab.id : "",
            tahun_id: filters?.tahun_id || "",
        });
        setIsAutoGenerateModalOpen(true);
    };

    const closeAutoGenerateModal = () => {
        setIsAutoGenerateModalOpen(false);
        autoGenerateForm.reset();
    };

    const handleAutoGenerate = (e) => {
        e.preventDefault();
        if (!isMonday(autoGenerateForm.data.tanggal_mulai)) {
            toast.error("Tanggal mulai harus hari Senin");
            return;
        }
        autoGenerateForm.post(route("piket.periode-piket.generate"), {
            onSuccess: () => {
                closeAutoGenerateModal();
                toast.success("Periode piket berhasil di-generate");
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                toast.error(msg || "Gagal generate periode piket");
            },
            preserveState: false,
        });
    };

    const openPengaturanModal = () => {
        if (!kepengurusanlab) {
            toast.error("Silakan pilih laboratorium terlebih dahulu");
            return;
        }
        pengaturanForm.setData({
            kepengurusan_lab_id: kepengurusanlab.id,
            ada_denda: pengaturanPiket?.ada_denda ?? false,
            nominal_denda: pengaturanPiket?.nominal_denda ?? "",
        });
        setIsPengaturanModalOpen(true);
    };

    const closePengaturanModal = () => {
        setIsPengaturanModalOpen(false);
        pengaturanForm.reset();
    };

    const handlePengaturan = (e) => {
        e.preventDefault();
        pengaturanForm.post(route("piket.pengaturan-piket.upsert"), {
            onSuccess: () => {
                closePengaturanModal();
                toast.success("Pengaturan piket berhasil disimpan");
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                toast.error(msg || "Gagal menyimpan pengaturan");
            },
            preserveState: true,
        });
    };

    // Format lama_piket (menit) ke label jam+menit
    const formatLamaPiket = (minutes) => {
        if (!minutes) return "-";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours} jam ${mins} menit`;
        if (hours > 0) return `${hours} jam`;
        return `${mins} menit`;
    };

    const toggleActive = (periode) => {
        const data = {
            isactive: !periode.isactive,
            lab_id: selectedLab ? selectedLab.id : "",
        };

        router.put(route("piket.periode-piket.update", periode.id), data, {
            onSuccess: () => {
                toast.success(
                    periode.isactive
                        ? "Periode piket berhasil dinonaktifkan"
                        : "Periode piket berhasil diaktifkan",
                );
            },
            onError: (errors) => {
                console.error("Toggle active error:", errors);

                // Only show one error message rather than multiple validation errors
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error("Gagal mengubah status periode piket");
                }
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Format date to Indonesian format
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Get day name
    const getDayName = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", { weekday: "long" });
    };

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }

        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((error) => {
                toast.error(error);
            });
        }
    }, [flash, errors]);

    return (
        <DashboardLayout>
            <Head title="Periode Piket" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Periode Piket
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Cari periode..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                        />
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="10">10 / hal</option>
                            <option value="25">25 / hal</option>
                            <option value="50">50 / hal</option>
                            <option value="100">100 / hal</option>
                        </select>
                        {canManage && (
                            <>
                                <button
                                    onClick={openAutoGenerateModal}
                                    disabled={!kepengurusanlab}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                ${!kepengurusanlab ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-purple-600 text-white hover:bg-purple-700"}`}
                                    title="Generate periode per minggu secara otomatis"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Generate Otomatis
                                </button>
                                <button
                                    onClick={openPengaturanModal}
                                    disabled={!kepengurusanlab}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                ${!kepengurusanlab ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-gray-600 text-white hover:bg-gray-700"}`}
                                    title="Pengaturan denda piket"
                                >
                                    <Settings className="w-4 h-4" />
                                    Pengaturan
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    disabled={!kepengurusanlab}
                                    className={`px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${!kepengurusanlab ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                >
                                    + Tambah Periode
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="overflow-x-auto">
                    {!selectedLab ? (
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
                                melihat periode piket.
                            </p>
                        </div>
                    ) : !kepengurusanlab ? (
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
                                Kepengurusan Tidak Ditemukan
                            </h3>
                            <p className="text-gray-600">
                                Silakan pilih laboratorium dan tahun
                                kepengurusan di Navbar untuk melihat periode
                                piket.
                            </p>
                        </div>
                    ) : periodes?.data?.length === 0 ? (
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
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Belum Ada Periode Piket
                            </h3>
                            <p className="text-gray-600">
                                Belum ada periode piket yang ditambahkan untuk
                                laboratorium dan tahun kepengurusan ini. Silakan
                                tambahkan periode piket baru.
                            </p>
                        </div>
                    ) : (
                        <>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama Periode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal Mulai
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal Selesai
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lama Piket
                                        </th>
                                        {canManage && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {periodes.data?.map((periode, index) => (
                                        <tr
                                            key={periode.id}
                                            className={
                                                periode.isactive
                                                    ? "bg-blue-50"
                                                    : ""
                                            }
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(periodes.from || 0) + index}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {periode.nama}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(
                                                    periode.tanggal_mulai,
                                                )}{" "}
                                                (
                                                {getDayName(
                                                    periode.tanggal_mulai,
                                                )}
                                                )
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(
                                                    periode.tanggal_selesai,
                                                )}{" "}
                                                (
                                                {getDayName(
                                                    periode.tanggal_selesai,
                                                )}
                                                )
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${periode.isactive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                                                >
                                                    {periode.isactive
                                                        ? "Aktif"
                                                        : "Tidak Aktif"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatLamaPiket(
                                                    periode.lama_piket,
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={() =>
                                                                toggleActive(
                                                                    periode,
                                                                )
                                                            }
                                                            className={`text-sm px-3 py-1 rounded ${
                                                                periode.isactive
                                                                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                                            }`}
                                                        >
                                                            {periode.isactive
                                                                ? "Nonaktifkan"
                                                                : "Aktifkan"}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    periode,
                                                                )
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    periode,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {periodes?.links && (
                                <div className="p-4 border-t">
                                    <Pagination links={periodes.links} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Periode Piket
                        </h3>
                        <button
                            onClick={closeCreateModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label
                                htmlFor="nama"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nama Periode
                            </label>
                            <input
                                type="text"
                                id="nama"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.nama
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.nama ?? ""}
                                onChange={(e) =>
                                    createForm.setData("nama", e.target.value)
                                }
                                placeholder="Contoh: Minggu 1 Januari 2025"
                                required
                            />
                            {createForm.errors.nama && (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.nama}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="tanggal_mulai"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Tanggal Mulai (Senin)
                            </label>
                            <input
                                type="date"
                                id="tanggal_mulai"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.tanggal_mulai
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.tanggal_mulai ?? ""}
                                onChange={(e) =>
                                    handleStartDateChange(e, "create")
                                }
                                required
                            />
                            {createForm.errors.tanggal_mulai ? (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.tanggal_mulai}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs mt-1">
                                    {createForm.data.tanggal_mulai &&
                                    !isMonday(createForm.data.tanggal_mulai)
                                        ? "Tanggal yang dipilih bukan hari Senin"
                                        : createForm.data.tanggal_mulai
                                          ? getDayName(
                                                createForm.data.tanggal_mulai,
                                            )
                                          : "Pilih hari Senin untuk tanggal mulai"}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="tanggal_selesai"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Tanggal Selesai (Jumat)
                            </label>
                            <input
                                type="date"
                                id="tanggal_selesai"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.tanggal_selesai
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.tanggal_selesai ?? ""}
                                onChange={(e) =>
                                    createForm.setData(
                                        "tanggal_selesai",
                                        e.target.value,
                                    )
                                }
                                required
                                readOnly={isMonday(
                                    createForm.data.tanggal_mulai,
                                )} // Make read-only if start date is a Monday
                            />
                            {createForm.errors.tanggal_selesai ? (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.tanggal_selesai}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs mt-1">
                                    {createForm.data.tanggal_selesai
                                        ? getDayName(
                                              createForm.data.tanggal_selesai,
                                          )
                                        : "Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin"}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isactive"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={!!createForm.data.isactive}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "isactive",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <label
                                    htmlFor="isactive"
                                    className="ml-2 block text-sm text-gray-700"
                                >
                                    Aktifkan Periode
                                </label>
                            </div>
                            {createForm.errors.isactive && (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.isactive}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="lama_piket"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Lama Piket (menit)
                            </label>
                            <input
                                type="number"
                                id="lama_piket"
                                min={30}
                                max={480}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    createForm.errors.lama_piket
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={createForm.data.lama_piket ?? 120}
                                onChange={(e) =>
                                    createForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                = {formatLamaPiket(createForm.data.lama_piket)}
                            </p>
                            {createForm.errors.lama_piket && (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.lama_piket}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                show={isEditModalOpen && !!selectedPeriode}
                onClose={closeEditModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Edit Periode Piket
                        </h3>
                        <button
                            onClick={closeEditModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleEdit}>
                        <div className="mb-4">
                            <label
                                htmlFor="edit-nama"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nama Periode
                            </label>
                            <input
                                type="text"
                                id="edit-nama"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.nama
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={editForm.data.nama ?? ""}
                                onChange={(e) =>
                                    editForm.setData("nama", e.target.value)
                                }
                                required
                            />
                            {editForm.errors.nama && (
                                <div className="text-red-500 text-xs mt-1">
                                    {editForm.errors.nama}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="edit-tanggal_mulai"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Tanggal Mulai (Senin)
                            </label>
                            <input
                                type="date"
                                id="edit-tanggal_mulai"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.tanggal_mulai
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={editForm.data.tanggal_mulai ?? ""}
                                onChange={(e) =>
                                    handleStartDateChange(e, "edit")
                                }
                                required
                            />
                            {editForm.errors.tanggal_mulai ? (
                                <div className="text-red-500 text-xs mt-1">
                                    {editForm.errors.tanggal_mulai}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs mt-1">
                                    {editForm.data.tanggal_mulai &&
                                    !isMonday(editForm.data.tanggal_mulai)
                                        ? "Tanggal yang dipilih bukan hari Senin"
                                        : editForm.data.tanggal_mulai
                                          ? getDayName(
                                                editForm.data.tanggal_mulai,
                                            )
                                          : "Pilih hari Senin untuk tanggal mulai"}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="edit-tanggal_selesai"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Tanggal Selesai (Jumat)
                            </label>
                            <input
                                type="date"
                                id="edit-tanggal_selesai"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.tanggal_selesai
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={editForm.data.tanggal_selesai ?? ""}
                                onChange={(e) =>
                                    editForm.setData(
                                        "tanggal_selesai",
                                        e.target.value,
                                    )
                                }
                                required
                                readOnly={isMonday(editForm.data.tanggal_mulai)} // Make read-only if start date is a Monday
                            />
                            {editForm.errors.tanggal_selesai ? (
                                <div className="text-red-500 text-xs mt-1">
                                    {editForm.errors.tanggal_selesai}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs mt-1">
                                    {editForm.data.tanggal_selesai
                                        ? getDayName(
                                              editForm.data.tanggal_selesai,
                                          )
                                        : "Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin"}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="edit-isactive"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={!!editForm.data.isactive}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "isactive",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <label
                                    htmlFor="edit-isactive"
                                    className="ml-2 block text-sm text-gray-700"
                                >
                                    Aktifkan Periode
                                </label>
                            </div>
                            {editForm.errors.isactive && (
                                <div className="text-red-500 text-xs mt-1">
                                    {editForm.errors.isactive}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="edit-lama_piket"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Lama Piket (menit)
                            </label>
                            <input
                                type="number"
                                id="edit-lama_piket"
                                min={30}
                                max={480}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors.lama_piket
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                value={editForm.data.lama_piket ?? 120}
                                onChange={(e) =>
                                    editForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                = {formatLamaPiket(editForm.data.lama_piket)}
                            </p>
                            {editForm.errors.lama_piket && (
                                <div className="text-red-500 text-xs mt-1">
                                    {editForm.errors.lama_piket}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                show={isDeleteModalOpen && !!selectedPeriode}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title="Hapus Periode Piket"
                message={`Apakah Anda yakin ingin menghapus periode "${selectedPeriode?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            {/* Auto-Generate Modal */}
            <Modal
                show={isAutoGenerateModalOpen}
                onClose={closeAutoGenerateModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Generate Periode Otomatis
                        </h3>
                        <button
                            onClick={closeAutoGenerateModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Sistem akan membuat periode piket per minggu
                        (Senin–Jumat) secara otomatis dalam rentang tanggal yang
                        dipilih. Minggu yang sudah memiliki periode akan
                        dilewati.
                    </p>
                    <form onSubmit={handleAutoGenerate}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai (Senin pertama)
                            </label>
                            <input
                                type="date"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    autoGenerateForm.errors.tanggal_mulai
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                value={autoGenerateForm.data.tanggal_mulai}
                                onChange={(e) => {
                                    autoGenerateForm.setData(
                                        "tanggal_mulai",
                                        e.target.value,
                                    );
                                }}
                                required
                            />
                            {autoGenerateForm.errors.tanggal_mulai && (
                                <p className="text-red-500 text-xs mt-1">
                                    {autoGenerateForm.errors.tanggal_mulai}
                                </p>
                            )}
                            {autoGenerateForm.data.tanggal_mulai && (
                                <p className="text-gray-500 text-xs mt-1">
                                    {getDayName(
                                        autoGenerateForm.data.tanggal_mulai,
                                    )}
                                    {!isMonday(
                                        autoGenerateForm.data.tanggal_mulai,
                                    ) && (
                                        <span className="text-orange-500">
                                            {" "}
                                            — harus hari Senin
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Akhir (Jumat terakhir)
                            </label>
                            <input
                                type="date"
                                className={`w-full px-3 py-2 border rounded-md ${
                                    autoGenerateForm.errors.tanggal_akhir
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                value={autoGenerateForm.data.tanggal_akhir}
                                onChange={(e) =>
                                    autoGenerateForm.setData(
                                        "tanggal_akhir",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {autoGenerateForm.errors.tanggal_akhir && (
                                <p className="text-red-500 text-xs mt-1">
                                    {autoGenerateForm.errors.tanggal_akhir}
                                </p>
                            )}
                            {autoGenerateForm.data.tanggal_mulai &&
                                autoGenerateForm.data.tanggal_akhir && (
                                    <p className="text-gray-500 text-xs mt-1">
                                        {Math.ceil(
                                            (new Date(
                                                autoGenerateForm.data
                                                    .tanggal_akhir,
                                            ) -
                                                new Date(
                                                    autoGenerateForm.data
                                                        .tanggal_mulai,
                                                )) /
                                                (7 * 24 * 3600 * 1000) +
                                                1,
                                        )}{" "}
                                        minggu akan di-generate
                                    </p>
                                )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lama Piket (menit)
                            </label>
                            <input
                                type="number"
                                min={30}
                                max={480}
                                className={`w-full px-3 py-2 border rounded-md ${
                                    autoGenerateForm.errors.lama_piket
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                value={autoGenerateForm.data.lama_piket}
                                onChange={(e) =>
                                    autoGenerateForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                ={" "}
                                {formatLamaPiket(
                                    autoGenerateForm.data.lama_piket,
                                )}
                            </p>
                            {autoGenerateForm.errors.lama_piket && (
                                <p className="text-red-500 text-xs mt-1">
                                    {autoGenerateForm.errors.lama_piket}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeAutoGenerateModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                                disabled={autoGenerateForm.processing}
                            >
                                {autoGenerateForm.processing
                                    ? "Generating..."
                                    : "Generate"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Pengaturan Piket Modal */}
            <Modal
                show={isPengaturanModalOpen}
                onClose={closePengaturanModal}
                maxWidth="sm"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Pengaturan Piket
                        </h3>
                        <button
                            onClick={closePengaturanModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handlePengaturan}>
                        <div className="mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="ada_denda"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={!!pengaturanForm.data.ada_denda}
                                    onChange={(e) =>
                                        pengaturanForm.setData(
                                            "ada_denda",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <label
                                    htmlFor="ada_denda"
                                    className="ml-2 block text-sm text-gray-700"
                                >
                                    Ada denda keterlambatan / tidak hadir piket
                                </label>
                            </div>
                        </div>
                        {pengaturanForm.data.ada_denda && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nominal Denda (Rp)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        pengaturanForm.errors.nominal_denda
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    value={
                                        pengaturanForm.data.nominal_denda ?? ""
                                    }
                                    onChange={(e) =>
                                        pengaturanForm.setData(
                                            "nominal_denda",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 10000"
                                    required
                                />
                                {pengaturanForm.errors.nominal_denda && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {pengaturanForm.errors.nominal_denda}
                                    </p>
                                )}
                            </div>
                        )}
                        {pengaturanPiket && (
                            <p className="text-xs text-gray-500 mb-4">
                                Pengaturan saat ini:{" "}
                                {pengaturanPiket.ada_denda
                                    ? `Ada denda — Rp ${Number(pengaturanPiket.nominal_denda).toLocaleString("id-ID")}`
                                    : "Tidak ada denda"}
                            </p>
                        )}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closePengaturanModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                disabled={pengaturanForm.processing}
                            >
                                {pengaturanForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default PeriodePiket;
