import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "../Components/Button";
import ConfirmModal from "../Components/ConfirmModal";
import { DataGrid } from "../Components/DataTable";
import FormField from "../Components/FormField";
import { useLab } from "../Components/LabContext";
import Modal from "../Components/Modal";
import PageHeader from "../Components/PageHeader";
import PageSection from "../Components/PageSection";
import { usePermission } from "../Components/PermissionContext";
import RowActions from "../Components/RowActions";
import DashboardLayout from "../Layouts/DashboardLayout";

const Praktikum = ({
    praktikumData,
    kepengurusanlab,
    tahunKepengurusan,
    mataKuliah = [],
    filters,
    flash,
}) => {
    const page = usePage();
    const { auth, selected_kepengurusan } = page.props;
    const { selectedLab } = useLab();
    const { can, user, hasRole } = usePermission();

    const selectedTahun =
        filters?.tahun_id || kepengurusanlab?.tahun_kepengurusan_id || "";

    const isAslab = hasRole("asisten");

    const canCreate = can("praktikum.create");
    const canUpdate = can("praktikum.update");
    const canDelete = can("praktikum.delete");
    const canView = can("praktikum.view") || isAslab;
    const canManageStudents =
        can("praktikan.create") ||
        can("praktikan.update") ||
        can("praktikan.delete");

    const canManageAslab = can("praktikum.assign-aslab");
    const canManageSertifikat = (praktikumId) =>
        isAslab ||
        isAssignedAslab(praktikumId) ||
        can("sertifikat.view");

    const isAssignedAslab = (praktikumId) => {
        return (
            user?.praktikumAslab &&
            user.praktikumAslab.some((ap) => ap.id === praktikumId)
        );
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedPraktikum, setSelectedPraktikum] = useState(null);
    const hariOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    const createForm = useForm({
        lab_id: selectedLab?.id || "",
        kepengurusan_lab_id: kepengurusanlab?.id || "",
        mata_kuliah_id: "",
        jadwal: [],
        tahun_id: selectedTahun,
    });

    const editForm = useForm({
        id: "",
        lab_id: selectedLab?.id || "",
        kepengurusan_lab_id: "",
        mata_kuliah: "",
        tahun_id: selectedTahun,
        jadwal: [
            {
                id: "",
                praktikum_id: "",
                hari: "",
                kelas: "",
                jam_mulai: "",
                jam_selesai: "",
                ruangan: "",
            },
        ],
    });

    const deleteForm = useForm({});

    const [isSubKelasModalOpen, setIsSubKelasModalOpen] = useState(false);
    const [selectedParentKelas, setSelectedParentKelas] = useState(null);

    const subKelasForm = useForm({
        nama_kelas: "",
        hari: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
    });

    const [editSubKelasTarget, setEditSubKelasTarget] = useState(null);
    const editSubKelasForm = useForm({ nama_kelas: "" });

    const openSubKelasModal = (parentKelas, praktikumId) => {
        if (!canUpdate) return;
        setSelectedParentKelas({ ...parentKelas, praktikum_id: praktikumId });
        subKelasForm.reset();
        setIsSubKelasModalOpen(true);
    };

    const openEditSubKelasModal = (subKelas, parentKelas) => {
        if (!canUpdate) return;
        setEditSubKelasTarget({ subKelas, parentKelas });
        editSubKelasForm.setData("nama_kelas", subKelas.nama_kelas);
    };

    const handleEditSubKelasSubmit = (e) => {
        e.preventDefault();
        if (!editSubKelasTarget) return;
        editSubKelasForm.put(
            route("praktikum.kelas.sub-kelas.update", {
                subKelas: editSubKelasTarget.subKelas.id,
            }),
            {
                onSuccess: () => {
                    toast.success("Sub-kelas berhasil diperbarui");
                    setEditSubKelasTarget(null);
                    editSubKelasForm.reset();
                },
                onError: (errors) => {
                    Object.values(errors).forEach((msg) => toast.error(msg));
                },
                preserveScroll: true,
            },
        );
    };

    const handleSubKelasSubmit = (e) => {
        e.preventDefault();
        if (!selectedParentKelas) return;

        if (subKelasForm.data.hari) {
            if (
                !isValidTimeRange(
                    subKelasForm.data.jam_mulai,
                    subKelasForm.data.jam_selesai,
                )
            ) {
                toast.error("Jam mulai harus lebih awal dari jam selesai");
                return;
            }
        }

        subKelasForm.post(
            route("praktikum.kelas.sub-kelas.store", [
                selectedParentKelas.praktikum_id,
                selectedParentKelas.id,
            ]),
            {
                onSuccess: () => {
                    setIsSubKelasModalOpen(false);
                    subKelasForm.reset();
                    toast.success("Sub-kelas berhasil ditambahkan");
                },
                onError: (errors) => {
                    Object.values(errors).forEach((msg) => toast.error(msg));
                },
                preserveScroll: true,
            },
        );
    };

    const [deleteSubKelasTarget, setDeleteSubKelasTarget] = useState(null);

    const handleDeleteSubKelas = (subKelas) => {
        if (!canUpdate) return;
        setDeleteSubKelasTarget(subKelas);
    };

    const confirmDeleteSubKelas = () => {
        if (!deleteSubKelasTarget) return;
        router.delete(
            route("praktikum.kelas.sub-kelas.destroy", deleteSubKelasTarget.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Sub-kelas ${deleteSubKelasTarget.nama_kelas} berhasil dihapus`,
                    );
                    setDeleteSubKelasTarget(null);
                },
                onError: (errors) =>
                    toast.error(errors.message || "Gagal menghapus sub-kelas"),
            },
        );
    };

    useEffect(() => {
        if (selectedLab) {
            createForm.setData("lab_id", selectedLab.id);
            editForm.setData("lab_id", selectedLab.id);
        }
    }, [selectedLab]);

    useEffect(() => {
        if (flash?.message) {
            toast.success(flash.message);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const formatJam = (jamMulai, jamSelesai) => {
        const formatSingleTime = (timeString) => {
            if (timeString && timeString.includes(":")) {
                const timeParts = timeString.split(":");
                return timeParts.length >= 2
                    ? `${timeParts[0]}:${timeParts[1]}`
                    : timeString;
            }
            return timeString || "";
        };

        return `${formatSingleTime(jamMulai)} - ${formatSingleTime(jamSelesai)}`;
    };

    const addJadwal = () => {
        const newJadwal = {
            hari: "",
            kelas: "",
            jam_mulai: "",
            jam_selesai: "",
            ruangan: "",
        };

        createForm.setData("jadwal", [...createForm.data.jadwal, newJadwal]);
    };

    const removeJadwal = (index) => {
        const updatedJadwal = [...createForm.data.jadwal];
        updatedJadwal.splice(index, 1);
        createForm.setData("jadwal", updatedJadwal);
    };

    const openCreateModal = () => {
        if (!canCreate) return;

        createForm.reset();
        createForm.setData("lab_id", selectedLab?.id || "");
        createForm.setData("kepengurusan_lab_id", kepengurusanlab?.id || "");
        createForm.setData("tahun_id", selectedTahun);
        createForm.setData("jadwal", []);
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();

        if (!canCreate) return;

        if (!createForm.data.mata_kuliah_id) {
            toast.error("Pilih mata kuliah terlebih dahulu");
            return;
        }

        createForm.post(route("praktikum.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                if (firstError) toast.error(firstError);
            },
            preserveScroll: true,
        });
    };

    const isValidTimeRange = (startTime, endTime) => {
        if (!startTime || !endTime) return true;

        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        if (startHour > endHour) return false;
        if (startHour === endHour && startMinute >= endMinute) return false;

        return true;
    };

    const handleJadwalChange = (index, field, value) => {
        const updatedJadwal = [...createForm.data.jadwal];
        updatedJadwal[index] = {
            ...updatedJadwal[index],
            [field]: value,
        };

        if (field === "jam_mulai" || field === "jam_selesai") {
            const startTime =
                field === "jam_mulai" ? value : updatedJadwal[index].jam_mulai;
            const endTime =
                field === "jam_selesai"
                    ? value
                    : updatedJadwal[index].jam_selesai;

            if (startTime && endTime) {
                if (!isValidTimeRange(startTime, endTime)) {
                    toast.error(
                        `Jam mulai harus lebih awal dari jam selesai pada jadwal ke-${index + 1}`,
                    );
                }
            }
        }

        createForm.setData("jadwal", updatedJadwal);
    };

    const handleEditJadwalChange = (index, field, value) => {
        const updatedJadwal = [...editForm.data.jadwal];
        updatedJadwal[index] = {
            ...updatedJadwal[index],
            [field]: value,
        };

        if (field === "jam_mulai" || field === "jam_selesai") {
            const startTime =
                field === "jam_mulai" ? value : updatedJadwal[index].jam_mulai;
            const endTime =
                field === "jam_selesai"
                    ? value
                    : updatedJadwal[index].jam_selesai;

            if (startTime && endTime) {
                if (!isValidTimeRange(startTime, endTime)) {
                    toast.error(
                        `Jam mulai harus lebih awal dari jam selesai pada jadwal ke-${index + 1}`,
                    );
                }
            }
        }

        editForm.setData("jadwal", updatedJadwal);
    };

    const addJadwalToEdit = () => {
        const updatedJadwal = [...editForm.data.jadwal];
        updatedJadwal.push({
            kelas: "",
            hari: "",
            jam_mulai: "",
            jam_selesai: "",
            ruangan: "",
        });
        editForm.setData("jadwal", updatedJadwal);
    };

    const removeJadwalFromEdit = (index) => {
        const updatedJadwal = [...editForm.data.jadwal];
        updatedJadwal.splice(index, 1);
        editForm.setData("jadwal", updatedJadwal);
    };

    const openEditModal = (praktikum) => {
        if (!canUpdate) return;

        setSelectedPraktikum(praktikum);

        const jadwalData =
            praktikum.jadwal_praktikum &&
            Array.isArray(praktikum.jadwal_praktikum)
                ? [...praktikum.jadwal_praktikum]
                : [];

        if (jadwalData.length === 0) {
            jadwalData.push({
                kelas: "",
                hari: "",
                jam_mulai: "",
                jam_selesai: "",
                ruangan: "",
            });
        }

        editForm.setData({
            id: praktikum.id,
            lab_id: selectedLab?.id || "",
            kepengurusan_lab_id: praktikum.kepengurusan_lab_id,
            tahun_id: praktikum.tahun_id,
            mata_kuliah: praktikum.mata_kuliah,
            jadwal: jadwalData,
        });

        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPraktikum(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();

        if (!canUpdate) return;

        let hasTimeError = false;
        editForm.data.jadwal.forEach((jadwal, index) => {
            if (!isValidTimeRange(jadwal.jam_mulai, jadwal.jam_selesai)) {
                toast.error(
                    `Jadwal ke-${index + 1}: Jam mulai harus lebih awal dari jam selesai`,
                );
                hasTimeError = true;
            }
        });

        if (hasTimeError) {
            return;
        }

        editForm.put(route("praktikum.update", editForm.data.id), {
            onSuccess: () => {
                closeEditModal();
                toast.success("Praktikum berhasil diperbarui");
            },
            onError: (errors) => {
                Object.keys(errors).forEach((key) => {
                    if (key.startsWith("jadwal.")) {
                        const parts = key.split(".");
                        if (parts.length === 3) {
                            const index = parseInt(parts[1]);
                            toast.error(
                                `Jadwal ke-${index + 1}: ${errors[key]}`,
                            );
                        }
                    } else {
                        toast.error(errors[key]);
                    }
                });
            },
            preserveScroll: true,
        });
    };

    const openDeleteModal = (praktikum) => {
        if (!canDelete) return;

        setSelectedPraktikum(praktikum);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!canDelete) return;

        deleteForm.delete(route("praktikum.destroy", selectedPraktikum.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
            onError: (errors) => {
                console.error("Delete error:", errors);
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus data");
                setIsDeleteModalOpen(false);
            },
        });
    };

    const navigateToModul = (praktikumId) => {
        try {
            router.get(route("praktikum.modul.index", praktikumId));
        } catch {
            toast.error("Gagal membuka modul praktikum");
        }
    };

    const mkField = (praktikum, field) =>
        praktikum.mata_kuliah_rel?.[field] ??
        praktikum.mata_kuliah?.[field] ??
        null;

    const kelasCountOf = (praktikum) =>
        praktikum.parent_kelas?.length ||
        praktikum.kelas?.filter((k) => !k.parent_kelas_id)?.length ||
        0;

    const columns = useMemo(
        () => [
            {
                header: "No.",
                sortable: false,
                searchable: false,
                headerClassName: "w-16",
                render: (_item, rowIndex) => (
                    <span className="text-base-content/70">
                        {rowIndex + 1}
                    </span>
                ),
            },
            {
                key: "mata_kuliah_rel.kode_mata_kuliah",
                header: "Kode MK",
                headerClassName: "w-32",
                render: (item) => mkField(item, "kode_mata_kuliah") || "-",
            },
            {
                key: "mata_kuliah",
                header: "Mata Kuliah",
                render: (item) => (
                    <Link
                        href={route("praktikum.show", { praktikum: item.id })}
                        className="font-semibold text-base-content hover:text-primary"
                    >
                        {mkField(item, "nama") || item.mata_kuliah || "-"}
                    </Link>
                ),
            },
            {
                key: "mata_kuliah_rel.sks",
                header: "SKS",
                headerClassName: "w-24",
                render: (item) => mkField(item, "sks") || "-",
            },
            {
                key: "mata_kuliah_rel.semester",
                header: "Semester",
                headerClassName: "w-28",
                render: (item) => mkField(item, "semester") || "-",
            },
            {
                header: "Jumlah Kelas",
                sortable: false,
                searchable: false,
                headerClassName: "w-32",
                render: (item) => `${kelasCountOf(item)} Kelas`,
            },
            {
                key: "praktikans_count",
                header: "Total Peserta",
                headerClassName: "w-40",
                render: (item) => `${item.praktikans_count || 0} Mahasiswa`,
            },
            {
                header: "Aksi",
                sortable: false,
                searchable: false,
                headerClassName: "text-right",
                render: (item) => (
                    <RowActions
                        detailHref={route("praktikum.show", {
                            praktikum: item.id,
                        })}
                        onEdit={canUpdate ? () => openEditModal(item) : null}
                        onDelete={canDelete ? () => openDeleteModal(item) : null}
                    />
                ),
            },
        ],
        [canUpdate, canDelete],
    );

    return (
        <DashboardLayout>
            <Head title="Praktikum" />

            <PageHeader
                title="Praktikum"
                description="Kelola praktikum, kelas, dan peserta tiap mata kuliah."
                actions={
                    canCreate ? (
                        <Button
                            onClick={openCreateModal}
                            disabled={!selectedLab?.id || !selectedTahun}
                        >
                            Tambah
                        </Button>
                    ) : null
                }
            />

            <PageSection>
                {selectedLab?.id && !selectedTahun ? (
                    <div
                        role="status"
                        className="py-10 text-center text-base-content/70"
                    >
                        Silakan pilih tahun untuk melihat data
                    </div>
                ) : (
                    <DataGrid
                        rows={praktikumData || []}
                        columns={columns}
                        rowKey="id"
                        searchPlaceholder="Cari kode atau nama mata kuliah..."
                        emptyMessage="Tidak ada data praktikum"
                        defaultPerPage={10}
                    />
                )}
            </PageSection>

            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <header className="flex items-center justify-between border-b border-base-content/10 px-5 py-4">
                    <h3 className="text-lg font-semibold">Tambah Praktikum</h3>
                </header>

                <form onSubmit={handleCreateSubmit} className="flex flex-col">
                    <input
                        type="hidden"
                        name="kepengurusan_lab_id"
                        value={createForm.data.kepengurusan_lab_id}
                    />
                    <input
                        type="hidden"
                        name="tahun_id"
                        value={createForm.data.tahun_id}
                    />

                    <div className="overflow-y-auto px-5 py-4">
                        <FormField
                            label="Mata Kuliah"
                            required
                            error={createForm.errors?.mata_kuliah_id}
                            hint="Kelas dan jadwal ditambahkan di halaman detail praktikum."
                        >
                            <select
                                id="mata_kuliah_id"
                                value={createForm.data.mata_kuliah_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        "mata_kuliah_id",
                                        e.target.value,
                                    )
                                }
                                className="select select-bordered min-h-11 w-full focus:select-primary"
                                required
                            >
                                <option value="">Pilih mata kuliah</option>
                                {mataKuliah.map((mk) => (
                                    <option key={mk.id} value={mk.id}>
                                        {mk.kode_mata_kuliah} - {mk.nama} (
                                        {mk.sks} SKS, Sem {mk.semester})
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={createForm.processing}>
                            Simpan
                        </Button>
                    </footer>
                </form>
            </Modal>

            <Modal
                show={isEditModalOpen}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <header className="flex items-center justify-between border-b border-base-content/10 px-5 py-4">
                    <h3 className="text-lg font-semibold">Edit Praktikum</h3>
                </header>

                <form onSubmit={handleEditSubmit} className="flex flex-col">
                    <input type="hidden" name="id" value={editForm.data.id} />
                    <input
                        type="hidden"
                        name="kepengurusan_lab_id"
                        value={editForm.data.kepengurusan_lab_id}
                    />
                    <input
                        type="hidden"
                        name="tahun_id"
                        value={editForm.data.tahun_id}
                    />

                    <div className="overflow-y-auto px-5 py-4">
                        <FormField
                            label="Mata Kuliah"
                            error={editForm.errors?.mata_kuliah}
                        >
                            <input
                                type="text"
                                id="mata_kuliah"
                                name="mata_kuliah"
                                value={editForm.data.mata_kuliah}
                                onChange={(e) =>
                                    editForm.setData(
                                        "mata_kuliah",
                                        e.target.value,
                                    )
                                }
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                required
                            />
                        </FormField>

                        <div className="mt-4 flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                                Jadwal Praktikum
                            </h4>
                            <Button
                                variant="success"
                                size="sm"
                                onClick={addJadwalToEdit}
                            >
                                <Plus className="h-4 w-4" />
                                Tambah
                            </Button>
                        </div>

                        <div className="mt-3 space-y-3">
                            {editForm.data.jadwal.map((jadwal, index) => (
                                <div
                                    key={index}
                                    className="rounded-box border border-base-content/10 bg-base-200/40 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h5 className="text-sm font-medium text-base-content/70">
                                            Jadwal #{index + 1}
                                        </h5>
                                        {editForm.data.jadwal.length > 1 && (
                                            <button
                                                type="button"
                                                title="Hapus"
                                                aria-label={`Hapus jadwal ${index + 1}`}
                                                onClick={() =>
                                                    removeJadwalFromEdit(index)
                                                }
                                                className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11 text-error hover:bg-error/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {jadwal.id && (
                                        <input
                                            type="hidden"
                                            name={`jadwal[${index}][id]`}
                                            value={jadwal.id}
                                        />
                                    )}

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            label="Kelas"
                                            required
                                            error={
                                                editForm.errors?.jadwal?.[index]
                                                    ?.kelas
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={jadwal.kelas}
                                                onChange={(e) =>
                                                    handleEditJadwalChange(
                                                        index,
                                                        "kelas",
                                                        e.target.value,
                                                    )
                                                }
                                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                                required
                                            />
                                        </FormField>

                                        <FormField
                                            label="Hari"
                                            required
                                            error={
                                                editForm.errors?.jadwal?.[index]
                                                    ?.hari
                                            }
                                        >
                                            <select
                                                value={jadwal.hari}
                                                onChange={(e) =>
                                                    handleEditJadwalChange(
                                                        index,
                                                        "hari",
                                                        e.target.value,
                                                    )
                                                }
                                                className="select select-bordered min-h-11 w-full focus:select-primary"
                                                required
                                            >
                                                <option value="">
                                                    Pilih Hari
                                                </option>
                                                {hariOptions.map((hari) => (
                                                    <option
                                                        key={hari}
                                                        value={hari}
                                                    >
                                                        {hari}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>

                                        <FormField
                                            label="Jam Mulai"
                                            required
                                            error={
                                                editForm.errors?.jadwal?.[index]
                                                    ?.jam_mulai
                                            }
                                        >
                                            <input
                                                type="time"
                                                value={jadwal.jam_mulai}
                                                onChange={(e) =>
                                                    handleEditJadwalChange(
                                                        index,
                                                        "jam_mulai",
                                                        e.target.value,
                                                    )
                                                }
                                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                                required
                                            />
                                        </FormField>

                                        <FormField
                                            label="Jam Selesai"
                                            required
                                            error={
                                                editForm.errors?.jadwal?.[index]
                                                    ?.jam_selesai
                                            }
                                        >
                                            <input
                                                type="time"
                                                value={jadwal.jam_selesai}
                                                onChange={(e) =>
                                                    handleEditJadwalChange(
                                                        index,
                                                        "jam_selesai",
                                                        e.target.value,
                                                    )
                                                }
                                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                                required
                                            />
                                        </FormField>

                                        <FormField
                                            label="Ruangan"
                                            required
                                            error={
                                                editForm.errors?.jadwal?.[index]
                                                    ?.ruangan
                                            }
                                        >
                                            <input
                                                type="text"
                                                value={jadwal.ruangan}
                                                onChange={(e) =>
                                                    handleEditJadwalChange(
                                                        index,
                                                        "ruangan",
                                                        e.target.value,
                                                    )
                                                }
                                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                                required
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button variant="ghost" onClick={closeEditModal}>
                            Batal
                        </Button>
                        <Button type="submit" loading={editForm.processing}>
                            Simpan
                        </Button>
                    </footer>
                </form>
            </Modal>

            <Modal
                show={isSubKelasModalOpen && !!selectedParentKelas}
                onClose={() => setIsSubKelasModalOpen(false)}
                maxWidth="lg"
            >
                <header className="border-b border-base-content/10 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                            Pecah Kelas:{" "}
                            <span className="text-primary">
                                {selectedParentKelas?.nama_kelas}
                            </span>
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-base-content/70">
                        Tambah sub-kelas untuk pengelolaan per kelompok. Jadwal &
                        tugas per sub-kelas, penilaian tetap per kelas asli.
                    </p>
                </header>

                <form onSubmit={handleSubKelasSubmit}>
                    <div className="overflow-y-auto px-5 py-4">
                        <FormField
                            label="Nama Sub-Kelas"
                            required
                            error={subKelasForm.errors.nama_kelas}
                        >
                            <input
                                type="text"
                                value={subKelasForm.data.nama_kelas}
                                onChange={(e) =>
                                    subKelasForm.setData(
                                        "nama_kelas",
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: A1, A2, Reguler, Internasional"
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                required
                            />
                        </FormField>

                        <div className="mt-4 rounded-box bg-base-200/60 p-3">
                            <p className="mb-3 text-sm font-medium text-base-content/70">
                                Jadwal (opsional)
                            </p>

                            <FormField label="Hari">
                                <select
                                    value={subKelasForm.data.hari}
                                    onChange={(e) =>
                                        subKelasForm.setData(
                                            "hari",
                                            e.target.value,
                                        )
                                    }
                                    className="select select-bordered min-h-11 w-full focus:select-primary"
                                >
                                    <option value="">Pilih Hari</option>
                                    {hariOptions.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField
                                    label="Jam Mulai"
                                    error={subKelasForm.errors.jam_mulai}
                                >
                                    <input
                                        type="time"
                                        value={subKelasForm.data.jam_mulai}
                                        onChange={(e) =>
                                            subKelasForm.setData(
                                                "jam_mulai",
                                                e.target.value,
                                            )
                                        }
                                        disabled={!subKelasForm.data.hari}
                                        className="input input-bordered min-h-11 w-full focus:input-primary"
                                    />
                                </FormField>
                                <FormField
                                    label="Jam Selesai"
                                    error={subKelasForm.errors.jam_selesai}
                                >
                                    <input
                                        type="time"
                                        value={subKelasForm.data.jam_selesai}
                                        onChange={(e) =>
                                            subKelasForm.setData(
                                                "jam_selesai",
                                                e.target.value,
                                            )
                                        }
                                        disabled={!subKelasForm.data.hari}
                                        className="input input-bordered min-h-11 w-full focus:input-primary"
                                    />
                                </FormField>
                            </div>

                            <div className="mt-3">
                                <FormField label="Ruangan">
                                    <input
                                        type="text"
                                        value={subKelasForm.data.ruangan}
                                        onChange={(e) =>
                                            subKelasForm.setData(
                                                "ruangan",
                                                e.target.value,
                                            )
                                        }
                                        disabled={!subKelasForm.data.hari}
                                        placeholder="Contoh: Lab 1, Gedung B-201"
                                        className="input input-bordered min-h-11 w-full focus:input-primary"
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsSubKelasModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={subKelasForm.processing}>
                            Buat Sub-Kelas
                        </Button>
                    </footer>
                </form>
            </Modal>

            <ConfirmModal
                show={!!deleteSubKelasTarget}
                onClose={() => setDeleteSubKelasTarget(null)}
                onConfirm={confirmDeleteSubKelas}
                title="Hapus Sub-Kelas"
                message={
                    deleteSubKelasTarget
                        ? `Hapus sub-kelas "${deleteSubKelasTarget.nama_kelas}"? Semua data terkait (jadwal, pertemuan, tugas, absensi) akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
                type="danger"
            />

            <Modal
                show={!!editSubKelasTarget}
                onClose={() => setEditSubKelasTarget(null)}
                maxWidth="md"
            >
                <header className="border-b border-base-content/10 px-5 py-4">
                    <h3 className="text-lg font-semibold">Edit Sub-Kelas</h3>
                    <p className="mt-1 text-sm text-base-content/70">
                        Sub-kelas di bawah{" "}
                        <strong>{editSubKelasTarget?.parentKelas?.nama_kelas}</strong>
                    </p>
                </header>

                <form onSubmit={handleEditSubKelasSubmit}>
                    <div className="px-5 py-4">
                        <FormField
                            label="Nama Sub-Kelas"
                            required
                            error={editSubKelasForm.errors.nama_kelas}
                        >
                            <input
                                type="text"
                                value={editSubKelasForm.data.nama_kelas}
                                onChange={(e) =>
                                    editSubKelasForm.setData(
                                        "nama_kelas",
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: A1, A2"
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                required
                            />
                        </FormField>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button
                            variant="ghost"
                            onClick={() => setEditSubKelasTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            loading={editSubKelasForm.processing}
                        >
                            Simpan
                        </Button>
                    </footer>
                </form>
            </Modal>

            <ConfirmModal
                show={isDeleteModalOpen && !!selectedPraktikum}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={
                    selectedPraktikum
                        ? `Apakah Anda yakin ingin menghapus praktikum "${selectedPraktikum.mata_kuliah}"? Semua jadwal praktikum terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default Praktikum;
