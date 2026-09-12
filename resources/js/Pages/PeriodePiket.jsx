import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataTable, DataTableEmpty, DataTableHead } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import { useLab } from "@/Components/LabContext";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Settings, ToggleLeft, ToggleRight, Wand2 } from "lucide-react";
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
    const { selectedLab, selectedKepengurusanLabId } = useLab();
    const { auth } = usePage().props;
    const { can } = usePermission();

    
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

    
    const createForm = useForm({
        nama: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        isactive: false,
        lama_piket: 120,
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        lab_id: selectedLab ? selectedLab.id : "",
    });

    
    const editForm = useForm({
        nama: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        isactive: false,
        lama_piket: 120,
        lab_id: selectedLab ? selectedLab.id : "",
    });

    
    const autoGenerateForm = useForm({
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        tanggal_mulai: "",
        tanggal_akhir: "",
        lama_piket: 120,
        lab_id: selectedLab ? selectedLab.id : "",
        tahun_id: filters?.tahun_id || "",
    });

    
    const pengaturanForm = useForm({
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : "",
        ada_denda: pengaturanPiket?.ada_denda ?? false,
        nominal_denda: pengaturanPiket?.nominal_denda ?? "",
    });

    
    useEffect(() => {
        if (selectedLab) {
            createForm.setData("lab_id", selectedLab.id);
            editForm.setData("lab_id", selectedLab.id);
        }
    }, [selectedLab]);

    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlKepId = urlParams.get("kepengurusan_lab_id");
        const urlLabId = urlParams.get("lab_id");

        
        if (selectedKepengurusanLabId) {
            if (urlKepId !== String(selectedKepengurusanLabId) || urlLabId) {
                router.get(
                    "/piket/periode-piket",
                    { kepengurusan_lab_id: selectedKepengurusanLabId },
                    { preserveState: true, replace: true },
                );
            }
            return;
        }

        
        if (selectedLab) {
            if (urlLabId !== String(selectedLab.id)) {
                router.get(
                    "/piket/periode-piket",
                    { lab_id: selectedLab.id },
                    { preserveState: true, replace: true },
                );
            }
        }
    }, [selectedKepengurusanLabId, selectedLab?.id]);

    
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

    
    const calculateFriday = (mondayDate) => {
        if (!mondayDate) return "";

        
        const date = new Date(mondayDate);

        
        if (date.getDay() !== 1) {
            return ""; 
        }

        
        const friday = new Date(date);
        friday.setDate(date.getDate() + 4);

        
        return friday.toISOString().split("T")[0];
    };

    
    const isMonday = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getDay() === 1; 
    };

    
    const handleStartDateChange = (e, formType = "create") => {
        const startDate = e.target.value;

        if (formType === "create") {
            createForm.setData("tanggal_mulai", startDate);

            
            if (isMonday(startDate)) {
                const fridayDate = calculateFriday(startDate);
                createForm.setData("tanggal_selesai", fridayDate);
            } else if (startDate) {
                
                toast.warning(
                    "Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.",
                );
            }
        } else {
            editForm.setData("tanggal_mulai", startDate);

            
            if (isMonday(startDate)) {
                const fridayDate = calculateFriday(startDate);
                editForm.setData("tanggal_selesai", fridayDate);
            } else if (startDate) {
                
                toast.warning(
                    "Tanggal mulai harus hari Senin. Silakan pilih tanggal yang lain.",
                );
            }
        }
    };

    
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

        
        const formatDateForInput = (dateString) => {
            if (!dateString) return "";

            
            if (
                typeof dateString === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(dateString)
            ) {
                return dateString;
            }

            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";

            
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

    
    const handleCreate = (e) => {
        e.preventDefault();

        
        const startDate = new Date(createForm.data.tanggal_mulai);
        const endDate = new Date(createForm.data.tanggal_selesai);

        
        if (startDate.getDay() !== 1) {
            toast.error("Tanggal mulai harus hari Senin");
            return;
        }

        if (endDate.getDay() !== 5) {
            toast.error("Tanggal selesai harus hari Jumat");
            return;
        }

        
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
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menambahkan periode piket");
            },
            preserveState: true,
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        
        console.log("Edit form data:", editForm.data);

        
        editForm.put(route("piket.periode-piket.update", selectedPeriode.id), {
            onSuccess: () => {
                closeEditModal();
                toast.success("Periode piket berhasil diperbarui");
            },
            onError: (errors) => {
                console.error("Edit errors:", errors);
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal memperbarui periode piket");
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
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menghapus periode piket");
                    closeDeleteModal();
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
                const firstError = Object.values(errors).find(Boolean);
                if (firstError) toast.error(firstError);
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    
    const getDayName = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", { weekday: "long" });
    };

    
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

            <PageHeader title="Periode Piket" description="Kelola rentang jadwal dan pengaturan piket." />
            <PageSection>
                <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-end sm:justify-between">

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Cari periode..."
                            className="input input-bordered min-h-11 w-full text-sm sm:w-48"
                        />
                        <select
                            value={perPage}
                            onChange={handlePerPageChange}
                            className="select select-bordered min-h-11 text-sm"
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
                                    className="btn btn-secondary min-h-11"
                                    title="Generate periode per minggu secara otomatis"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Generate Otomatis
                                </button>
                                <button
                                    onClick={openPengaturanModal}
                                    disabled={!kepengurusanlab}
                                    className="btn btn-ghost min-h-11 border border-base-300"
                                    title="Pengaturan denda piket"
                                >
                                    <Settings className="w-4 h-4" />
                                    Pengaturan
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    disabled={!kepengurusanlab}
                                    className="btn btn-primary min-h-11"
                                >
                                    + Tambah Periode
                                </button>
                            </>
                        )}
                    </div>
                </div>

                
                <div className="overflow-x-auto">
                    {!selectedLab ? (
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
                                Pilih Laboratorium
                            </h3>
                            <p className="text-base-content/70">
                                Silakan pilih laboratorium terlebih dahulu untuk
                                melihat periode piket.
                            </p>
                        </div>
                    ) : !kepengurusanlab ? (
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
                                Kepengurusan Tidak Ditemukan
                            </h3>
                            <p className="text-base-content/70">
                                Silakan pilih laboratorium dan tahun
                                kepengurusan di Navbar untuk melihat periode
                                piket.
                            </p>
                        </div>
                    ) : periodes?.data?.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="mb-4 text-base-content/50">
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
                            <h3 className="text-lg font-medium text-base-content mb-2">
                                Belum Ada Periode Piket
                            </h3>
                            <p className="text-base-content/70">
                                Belum ada periode piket yang ditambahkan untuk
                                laboratorium dan tahun kepengurusan ini. Silakan
                                tambahkan periode piket baru.
                            </p>
                        </div>
                    ) : (
                        <>
                            <DataTable>
                                <DataTableHead>
                                    <tr>
                                            <th>
                                                No
                                            </th>
                                            <th>
                                                Nama Periode
                                            </th>
                                            <th>
                                                Tanggal Mulai
                                            </th>
                                            <th>
                                                Tanggal Selesai
                                            </th>
                                            <th>
                                                Status
                                            </th>
                                            <th>
                                                Lama Piket
                                            </th>
                                            {canManage && (
                                                <th>
                                                    Aksi
                                                </th>
                                            )}
                                    </tr>
                                </DataTableHead>
                                <tbody>
                                    {periodes.data?.map((periode, index) => (
                                        <tr
                                            key={periode.id}
                                            className={
                                                periode.isactive
                                                    ? "bg-primary/5"
                                                    : ""
                                            }
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                                                {(periodes.from || 0) + index}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-base-content">
                                                {periode.nama}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                                                {formatDate(
                                                    periode.tanggal_mulai,
                                                )}{" "}
                                                (
                                                {getDayName(
                                                    periode.tanggal_mulai,
                                                )}
                                                )
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                                                {formatDate(
                                                    periode.tanggal_selesai,
                                                )}{" "}
                                                (
                                                {getDayName(
                                                    periode.tanggal_selesai,
                                                )}
                                                )
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <StatusBadge status={periode.isactive ? "aktif" : "nonaktif"} label={periode.isactive ? "Aktif" : "Tidak Aktif"} />
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                                                {formatLamaPiket(
                                                    periode.lama_piket,
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                    <RowActions onEdit={() => openEditModal(periode)} onDelete={() => openDeleteModal(periode)}>
                                                        <IconAction label={periode.isactive ? "Nonaktifkan (Sedang Aktif)" : "Aktifkan (Sedang Tidak Aktif)"} icon={periode.isactive ? ToggleRight : ToggleLeft} tone={periode.isactive ? "text-success hover:bg-success/10" : "text-base-content hover:bg-base-200"} onClick={() => toggleActive(periode)} />
                                                    </RowActions>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                            {periodes?.links && (
                                <div className="p-4 border-t">
                                    <Pagination links={periodes.links} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </PageSection>

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
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <FormField label="Nama Periode" error={createForm.errors.nama} required>
                            <input
                                type="text"
                                id="nama"
                                className={`input input-bordered min-h-11 w-full ${createForm.errors.nama ? "input-error" : ""}`}
                                value={createForm.data.nama ?? ""}
                                onChange={(e) =>
                                    createForm.setData("nama", e.target.value)
                                }
                                placeholder="Contoh: Minggu 1 Januari 2025"
                                required
                            />
                        </FormField>

                        <FormField label="Tanggal Mulai (Senin)" hint={createForm.data.tanggal_mulai && !isMonday(createForm.data.tanggal_mulai) ? "Tanggal yang dipilih bukan hari Senin" : createForm.data.tanggal_mulai ? getDayName(createForm.data.tanggal_mulai) : "Pilih hari Senin untuk tanggal mulai"} error={createForm.errors.tanggal_mulai} required>
                            <input
                                type="date"
                                id="tanggal_mulai"
                                className={`input input-bordered min-h-11 w-full ${createForm.errors.tanggal_mulai ? "input-error" : ""}`}
                                value={createForm.data.tanggal_mulai ?? ""}
                                onChange={(e) =>
                                    handleStartDateChange(e, "create")
                                }
                                required
                            />
                        </FormField>

                        <FormField label="Tanggal Selesai (Jumat)" hint={createForm.data.tanggal_selesai ? getDayName(createForm.data.tanggal_selesai) : "Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin"} error={createForm.errors.tanggal_selesai} required>
                            <input
                                type="date"
                                id="tanggal_selesai"
                                className={`input input-bordered min-h-11 w-full ${createForm.errors.tanggal_selesai ? "input-error" : ""}`}
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
                                )} 
                            />
                        </FormField>

                        <FormField label="Aktifkan Periode" error={createForm.errors.isactive}>
                            <div className="flex min-h-11 items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isactive"
                                    className="checkbox checkbox-primary"
                                    checked={!!createForm.data.isactive}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "isactive",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span className="text-sm">Aktifkan periode ini</span>
                            </div>
                        </FormField>

                        <FormField label="Lama Piket (menit)" hint={`= ${formatLamaPiket(createForm.data.lama_piket)}`} error={createForm.errors.lama_piket} required>
                            <input
                                type="number"
                                id="lama_piket"
                                min={30}
                                max={480}
                                className={`input input-bordered min-h-11 w-full ${createForm.errors.lama_piket ? "input-error" : ""}`}
                                value={createForm.data.lama_piket ?? 120}
                                onChange={(e) =>
                                    createForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                        </FormField>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closeCreateModal}>Batal</Button>
                            <Button type="submit" loading={createForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            
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
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleEdit}>
                        <FormField label="Nama Periode" error={editForm.errors.nama} required>
                            <input
                                type="text"
                                id="edit-nama"
                                className={`input input-bordered min-h-11 w-full ${editForm.errors.nama ? "input-error" : ""}`}
                                value={editForm.data.nama ?? ""}
                                onChange={(e) =>
                                    editForm.setData("nama", e.target.value)
                                }
                                required
                            />
                        </FormField>

                        <FormField label="Tanggal Mulai (Senin)" hint={editForm.data.tanggal_mulai && !isMonday(editForm.data.tanggal_mulai) ? "Tanggal yang dipilih bukan hari Senin" : editForm.data.tanggal_mulai ? getDayName(editForm.data.tanggal_mulai) : "Pilih hari Senin untuk tanggal mulai"} error={editForm.errors.tanggal_mulai} required>
                            <input
                                type="date"
                                id="edit-tanggal_mulai"
                                className={`input input-bordered min-h-11 w-full ${editForm.errors.tanggal_mulai ? "input-error" : ""}`}
                                value={editForm.data.tanggal_mulai ?? ""}
                                onChange={(e) =>
                                    handleStartDateChange(e, "edit")
                                }
                                required
                            />
                        </FormField>

                        <FormField label="Tanggal Selesai (Jumat)" hint={editForm.data.tanggal_selesai ? getDayName(editForm.data.tanggal_selesai) : "Tanggal selesai akan otomatis terisi hari Jumat ketika tanggal mulai dipilih hari Senin"} error={editForm.errors.tanggal_selesai} required>
                            <input
                                type="date"
                                id="edit-tanggal_selesai"
                                className={`input input-bordered min-h-11 w-full ${editForm.errors.tanggal_selesai ? "input-error" : ""}`}
                                value={editForm.data.tanggal_selesai ?? ""}
                                onChange={(e) =>
                                    editForm.setData(
                                        "tanggal_selesai",
                                        e.target.value,
                                    )
                                }
                                required
                                readOnly={isMonday(editForm.data.tanggal_mulai)} 
                            />
                        </FormField>

                        <FormField label="Aktifkan Periode" error={editForm.errors.isactive}>
                            <div className="flex min-h-11 items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="edit-isactive"
                                    className="checkbox checkbox-primary"
                                    checked={!!editForm.data.isactive}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "isactive",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span className="text-sm">Aktifkan periode ini</span>
                            </div>
                        </FormField>

                        <FormField label="Lama Piket (menit)" hint={`= ${formatLamaPiket(editForm.data.lama_piket)}`} error={editForm.errors.lama_piket} required>
                            <input
                                type="number"
                                id="edit-lama_piket"
                                min={30}
                                max={480}
                                className={`input input-bordered min-h-11 w-full ${editForm.errors.lama_piket ? "input-error" : ""}`}
                                value={editForm.data.lama_piket ?? 120}
                                onChange={(e) =>
                                    editForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                        </FormField>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closeEditModal}>Batal</Button>
                            <Button type="submit" loading={editForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            
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
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>
                    <p className="text-sm text-base-content/70 mb-4">
                        Sistem akan membuat periode piket per minggu
                        (Senin–Jumat) secara otomatis dalam rentang tanggal yang
                        dipilih. Minggu yang sudah memiliki periode akan
                        dilewati.
                    </p>
                    <form onSubmit={handleAutoGenerate}>
                        <FormField label="Tanggal Mulai (Senin pertama)" error={autoGenerateForm.errors.tanggal_mulai} required>
                            <input
                                type="date"
                                className={`input input-bordered min-h-11 w-full ${autoGenerateForm.errors.tanggal_mulai ? "input-error" : ""}`}
                                value={autoGenerateForm.data.tanggal_mulai}
                                onChange={(e) => {
                                    autoGenerateForm.setData(
                                        "tanggal_mulai",
                                        e.target.value,
                                    );
                                }}
                                required
                            />
                        </FormField>
                        {autoGenerateForm.data.tanggal_mulai && (
                            <p className="text-xs text-base-content/70">
                                {getDayName(
                                    autoGenerateForm.data.tanggal_mulai,
                                )}
                                {!isMonday(
                                    autoGenerateForm.data.tanggal_mulai,
                                ) && (
                                    <span className="text-warning">
                                        {" "}
                                        (harus hari Senin)
                                    </span>
                                )}
                            </p>
                        )}
                        <FormField label="Tanggal Akhir (Jumat terakhir)" error={autoGenerateForm.errors.tanggal_akhir} required>
                            <input
                                type="date"
                                className={`input input-bordered min-h-11 w-full ${autoGenerateForm.errors.tanggal_akhir ? "input-error" : ""}`}
                                value={autoGenerateForm.data.tanggal_akhir}
                                onChange={(e) =>
                                    autoGenerateForm.setData(
                                        "tanggal_akhir",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </FormField>
                        {autoGenerateForm.data.tanggal_mulai &&
                            autoGenerateForm.data.tanggal_akhir && (
                                <p className="text-xs text-base-content/70">
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
                        <FormField label="Lama Piket (menit)" hint={`= ${formatLamaPiket(autoGenerateForm.data.lama_piket)}`} error={autoGenerateForm.errors.lama_piket} required>
                            <input
                                type="number"
                                min={30}
                                max={480}
                                className={`input input-bordered min-h-11 w-full ${autoGenerateForm.errors.lama_piket ? "input-error" : ""}`}
                                value={autoGenerateForm.data.lama_piket}
                                onChange={(e) =>
                                    autoGenerateForm.setData(
                                        "lama_piket",
                                        parseInt(e.target.value) || 120,
                                    )
                                }
                                required
                            />
                        </FormField>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closeAutoGenerateModal}>Batal</Button>
                            <Button type="submit" variant="secondary" loading={autoGenerateForm.processing}>Generate</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            
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
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handlePengaturan}>
                        <FormField label="Ada denda keterlambatan / tidak hadir piket">
                            <div className="flex min-h-11 items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="ada_denda"
                                    className="checkbox checkbox-primary"
                                    checked={!!pengaturanForm.data.ada_denda}
                                    onChange={(e) =>
                                        pengaturanForm.setData(
                                            "ada_denda",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span className="text-sm">Terapkan denda</span>
                            </div>
                        </FormField>
                        {pengaturanForm.data.ada_denda && (
                            <FormField label="Nominal Denda (Rp)" error={pengaturanForm.errors.nominal_denda} required>
                                <input
                                    type="number"
                                    min={0}
                                    className={`input input-bordered min-h-11 w-full ${pengaturanForm.errors.nominal_denda ? "input-error" : ""}`}
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
                            </FormField>
                        )}
                        {pengaturanPiket && (
                            <p className="text-xs text-base-content/70 mb-4">
                                Pengaturan saat ini:{" "}
                                {pengaturanPiket.ada_denda
                                    ? `Ada denda: Rp ${Number(pengaturanPiket.nominal_denda).toLocaleString("id-ID")}`
                                    : "Tidak ada denda"}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closePengaturanModal}>Batal</Button>
                            <Button type="submit" loading={pengaturanForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default PeriodePiket;
