import { Head, router, useForm, usePage } from "@inertiajs/react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../Components/ConfirmModal";
import { useLab } from "../Components/LabContext";
import Modal from "../Components/Modal";
import { usePermission } from "../Components/PermissionContext";
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
    const canCreateMataKuliah = can("matakuliah.create");
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
    const [isCreateMataKuliahModalOpen, setIsCreateMataKuliahModalOpen] =
        useState(false);
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

    const mataKuliahForm = useForm({
        kode_mata_kuliah: "",
        nama: "",
        sks: "",
        semester: "",
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
        console.log(
            "Adding new jadwal. Current jadwal count:",
            createForm.data.jadwal.length,
        );

        const newJadwal = {
            hari: "",
            kelas: "",
            jam_mulai: "",
            jam_selesai: "",
            ruangan: "",
        };

        const updatedJadwal = [...createForm.data.jadwal, newJadwal];
        createForm.setData("jadwal", updatedJadwal);

        console.log("Jadwal added. New jadwal count:", updatedJadwal.length);
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
            onSuccess: (response) => {
                setIsCreateModalOpen(false);
                createForm.reset();
                
            },
            onError: (errors) => {
                
            },
            preserveScroll: true,
        });
    };

    const openCreateMataKuliahModal = () => {
        if (!canCreateMataKuliah) return;
        mataKuliahForm.reset();
        setIsCreateMataKuliahModalOpen(true);
    };

    const handleCreateMataKuliah = (e) => {
        e.preventDefault();
        if (!canCreateMataKuliah) return;
        mataKuliahForm.post(route("praktikum.mata-kuliah.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Mata kuliah berhasil ditambahkan");
                setIsCreateMataKuliahModalOpen(false);
                mataKuliahForm.reset();
            },
            onError: () => {
                toast.error("Gagal menambahkan mata kuliah");
            },
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
        console.log(`Updating jadwal[${index}].${field} to: "${value}"`);

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
                const isValid = isValidTimeRange(startTime, endTime);
                if (!isValid) {
                    
                    toast.error(
                        `Jam mulai harus lebih awal dari jam selesai pada jadwal ke-${index + 1}`,
                    );
                }
            }
        }

        createForm.setData("jadwal", updatedJadwal);

        console.log(`Updated jadwal[${index}]:`, updatedJadwal[index]);
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
                const isValid = isValidTimeRange(startTime, endTime);
                if (!isValid) {
                    
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

        console.log("Opening edit modal with praktikum:", praktikum);

        
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
                            const field = parts[2];
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

        console.log("Selected praktikum:", praktikum); 
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
            onError: (error) => {
                console.error("Delete error:", error);
                toast.error(
                    error.response?.data?.message || "Gagal menghapus data",
                );
                setIsDeleteModalOpen(false);
            },
        });
    };

    const navigateToModul = (praktikumId) => {
        console.log("Navigating to modul for praktikum:", praktikumId);
        try {
            router.get(route("praktikum.modul.index", praktikumId));
        } catch (error) {
            console.error("Error navigating to modul:", error);
            toast.error("Gagal membuka modul praktikum");
        }
    };

    return (
        <DashboardLayout>
            <Head title="Praktikum" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Praktikum
                    </h2>
                    <div className="flex gap-4 items-center">
                        

                        
                        {canCreate && (
                            <button
                                onClick={openCreateModal}
                                disabled={!selectedLab?.id || !selectedTahun}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tambah
                            </button>
                        )}
                    </div>
                </div>

                {selectedLab?.id && !selectedTahun && (
                    <div className="p-8 text-center text-gray-500">
                        Silakan pilih tahun untuk melihat data
                    </div>
                )}

                <div className="p-5 border-t border-gray-100 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Total Praktikum: {praktikumData?.length || 0}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                {praktikumData.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 text-lg bg-white rounded-lg shadow-sm border border-gray-200">
                        Tidak ada data praktikum
                    </div>
                ) : (
                    <div className="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
                                        >
                                            No.
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32"
                                        >
                                            Kode MK
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                        >
                                            Mata Kuliah
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24"
                                        >
                                            SKS
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28"
                                        >
                                            Semester
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32"
                                        >
                                            Jumlah Kelas
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40"
                                        >
                                            Total Peserta
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {praktikumData.map(
                                        (praktikum, praktikumIndex) => {
                                            const kelasCount =
                                                praktikum.parent_kelas
                                                    ?.length ||
                                                praktikum.kelas?.filter(
                                                    (k) => !k.parent_kelas_id,
                                                )?.length ||
                                                0;

                                            
                                            const totalPeserta =
                                                praktikum.praktikans_count || 0;

                                            const kodeMk =
                                                praktikum.mata_kuliah_rel
                                                    ?.kode_mata_kuliah ||
                                                praktikum.mata_kuliah
                                                    ?.kode_mata_kuliah ||
                                                "-";
                                            const sksMk =
                                                praktikum.mata_kuliah_rel
                                                    ?.sks ||
                                                praktikum.mata_kuliah?.sks ||
                                                "-";
                                            const semesterMk =
                                                praktikum.mata_kuliah_rel
                                                    ?.semester ||
                                                praktikum.mata_kuliah
                                                    ?.semester ||
                                                "-";
                                            const namaMk =
                                                praktikum.mata_kuliah_rel
                                                    ?.nama ||
                                                praktikum.mata_kuliah ||
                                                "-";

                                            return (
                                                <tr
                                                    key={praktikum.id}
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                "praktikum.show",
                                                                {
                                                                    praktikum:
                                                                        praktikum.id,
                                                                },
                                                            ),
                                                        )
                                                    }
                                                    className="hover:bg-gray-50/80 cursor-pointer transition-colors duration-150 group"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                        {praktikumIndex + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                        {kodeMk}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {namaMk}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {sksMk}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {semesterMk}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {kelasCount} Kelas
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {totalPeserta} Mahasiswa
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="2xl"
            >
                <div className="p-6 max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="text-xl font-semibold">
                            Tambah Praktikum
                        </h3>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateSubmit(e);
                        }}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        
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

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="mata_kuliah_id"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Mata Kuliah{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                {canCreateMataKuliah && (
                                    <button
                                        type="button"
                                        onClick={openCreateMataKuliahModal}
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tambah Mata Kuliah
                                    </button>
                                )}
                            </div>
                            <select
                                id="mata_kuliah_id"
                                value={createForm.data.mata_kuliah_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        "mata_kuliah_id",
                                        e.target.value,
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            {createForm.errors?.mata_kuliah_id && (
                                <div className="text-red-500 text-xs mt-1">
                                    {createForm.errors.mata_kuliah_id}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Kelas dan jadwal ditambahkan di halaman detail
                                praktikum.
                            </p>
                        </div>

                        
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 bg-white flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={isCreateMataKuliahModalOpen}
                onClose={() => setIsCreateMataKuliahModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tambah Mata Kuliah
                    </h3>
                    <form
                        onSubmit={handleCreateMataKuliah}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Mata Kuliah
                                </label>
                                <input
                                    type="text"
                                    value={mataKuliahForm.data.kode_mata_kuliah}
                                    onChange={(e) =>
                                        mataKuliahForm.setData(
                                            "kode_mata_kuliah",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                                {mataKuliahForm.errors.kode_mata_kuliah && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {mataKuliahForm.errors.kode_mata_kuliah}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Mata Kuliah
                                </label>
                                <input
                                    type="text"
                                    value={mataKuliahForm.data.nama}
                                    onChange={(e) =>
                                        mataKuliahForm.setData(
                                            "nama",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                                {mataKuliahForm.errors.nama && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {mataKuliahForm.errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKS
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={mataKuliahForm.data.sks}
                                    onChange={(e) =>
                                        mataKuliahForm.setData(
                                            "sks",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                                {mataKuliahForm.errors.sks && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {mataKuliahForm.errors.sks}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Semester
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="14"
                                    value={mataKuliahForm.data.semester}
                                    onChange={(e) =>
                                        mataKuliahForm.setData(
                                            "semester",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                                {mataKuliahForm.errors.semester && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {mataKuliahForm.errors.semester}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsCreateMataKuliahModalOpen(false)
                                }
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={mataKuliahForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                            >
                                {mataKuliahForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isEditModalOpen}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-6 max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="text-xl font-semibold">
                            Edit Praktikum
                        </h3>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSubmit(e);
                        }}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        
                        <input
                            type="hidden"
                            name="id"
                            value={editForm.data.id}
                        />
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

                        
                        <div className="mb-4 flex-shrink-0">
                            <label
                                htmlFor="mata_kuliah"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Mata Kuliah
                            </label>
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
                                className={`w-full px-3 py-2 border rounded-md ${
                                    editForm.errors?.mata_kuliah
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                required
                            />
                            {editForm.errors?.mata_kuliah && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editForm.errors.mata_kuliah}
                                </p>
                            )}
                        </div>

                        
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h3 className="text-sm font-medium text-gray-800">
                                    Jadwal Praktikum
                                </h3>
                                <button
                                    type="button"
                                    onClick={addJadwalToEdit}
                                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-1 focus:ring-green-500"
                                >
                                    + Tambah
                                </button>
                            </div>

                            
                            <div className="overflow-y-auto pr-1 flex-1">
                                {editForm.data.jadwal.map((jadwal, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border border-gray-200 rounded-lg mb-3"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-medium text-gray-700">
                                                Jadwal #{index + 1}
                                            </h4>
                                            {editForm.data.jadwal.length >
                                                1 && (
                                                <button
                                                    className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    title="Hapus"
                                                    type="button"
                                                    onClick={() =>
                                                        removeJadwalFromEdit(
                                                            index,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Kelas
                                                </label>
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
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    required
                                                />
                                                {editForm.errors?.jadwal?.[
                                                    index
                                                ]?.kelas && (
                                                    <div className="text-red-500 text-xs mt-1">
                                                        {
                                                            editForm.errors
                                                                .jadwal[index]
                                                                .kelas
                                                        }
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Hari
                                                </label>
                                                <select
                                                    value={jadwal.hari}
                                                    onChange={(e) =>
                                                        handleEditJadwalChange(
                                                            index,
                                                            "hari",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        editForm.errors
                                                            ?.jadwal?.[index]
                                                            ?.hari
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
                                                {editForm.errors?.jadwal?.[
                                                    index
                                                ]?.hari && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            editForm.errors
                                                                .jadwal[index]
                                                                .hari
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Jam Mulai
                                                </label>
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
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        editForm.errors
                                                            ?.jadwal?.[index]
                                                            ?.jam_mulai
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                                    required
                                                />
                                                {editForm.errors?.jadwal?.[
                                                    index
                                                ]?.jam_mulai && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            editForm.errors
                                                                .jadwal[index]
                                                                .jam_mulai
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Jam Selesai
                                                </label>
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
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        editForm.errors
                                                            ?.jadwal?.[index]
                                                            ?.jam_selesai
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                                    required
                                                />
                                                {editForm.errors?.jadwal?.[
                                                    index
                                                ]?.jam_selesai && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            editForm.errors
                                                                .jadwal[index]
                                                                .jam_selesai
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ruangan
                                                </label>
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
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        editForm.errors
                                                            ?.jadwal?.[index]
                                                            ?.ruangan
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                                    required
                                                />
                                                {editForm.errors?.jadwal?.[
                                                    index
                                                ]?.ruangan && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {
                                                            editForm.errors
                                                                .jadwal[index]
                                                                .ruangan
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        
                        <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isSubKelasModalOpen && !!selectedParentKelas}
                onClose={() => setIsSubKelasModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <GitBranch className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Pecah Kelas:{" "}
                                    <span className="text-indigo-600">
                                        {selectedParentKelas?.nama_kelas}
                                    </span>
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                Tambah sub-kelas untuk pengelolaan per kelompok.
                                Jadwal & tugas per sub-kelas, penilaian tetap
                                per kelas asli.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubKelasSubmit} className="space-y-4">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Sub-Kelas{" "}
                                <span className="text-red-500">*</span>
                            </label>
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                    subKelasForm.errors.nama_kelas
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                required
                            />
                            {subKelasForm.errors.nama_kelas && (
                                <p className="mt-1 text-xs text-red-600">
                                    {subKelasForm.errors.nama_kelas}
                                </p>
                            )}
                        </div>

                        
                        <div className="bg-gray-50 rounded-md p-3 space-y-3">
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Jadwal (opsional)
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari
                                </label>
                                <select
                                    value={subKelasForm.data.hari}
                                    onChange={(e) =>
                                        subKelasForm.setData(
                                            "hari",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Pilih Hari</option>
                                    {hariOptions.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jam Mulai
                                    </label>
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                    />
                                    {subKelasForm.errors.jam_mulai && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {subKelasForm.errors.jam_mulai}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jam Selesai
                                    </label>
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                    />
                                    {subKelasForm.errors.jam_selesai && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {subKelasForm.errors.jam_selesai}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ruangan
                                </label>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsSubKelasModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={subKelasForm.processing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {subKelasForm.processing
                                    ? "Menyimpan..."
                                    : "Buat Sub-Kelas"}
                            </button>
                        </div>
                    </form>
                </div>
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
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Edit Sub-Kelas
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Sub-kelas di bawah{" "}
                        <strong>
                            {editSubKelasTarget?.parentKelas?.nama_kelas}
                        </strong>
                    </p>
                    <form
                        onSubmit={handleEditSubKelasSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Sub-Kelas{" "}
                                <span className="text-red-500">*</span>
                            </label>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {editSubKelasForm.errors.nama_kelas && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editSubKelasForm.errors.nama_kelas}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditSubKelasTarget(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editSubKelasForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {editSubKelasForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
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
