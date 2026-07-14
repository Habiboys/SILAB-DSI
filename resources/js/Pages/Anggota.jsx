import ConfirmModal from "@/Components/ConfirmModal";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import debounce from "lodash/debounce";
import { ChevronDown, ChevronUp, ChevronsUpDown, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLab } from "../Components/LabContext";
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const Anggota = ({
    anggota,
    struktur,
    flash,
    kepengurusanlab,
    tahunKepengurusan,
    filters,
}) => {
    const { selectedLab } = useLab();
    const { auth } = usePage().props;
    const { can, isKadep, hasRole } = usePermission();

    const canAccess =
        can("kepengurusan.manage-anggota") || hasRole(["admin", "superadmin"]);
    const canTransfer =
        can("kepengurusan.transfer-anggota") ||
        hasRole(["admin", "superadmin"]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [anggotaSebelumnya, setAnggotaSebelumnya] = useState([]);
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [sortBy, setSortBy] = useState(filters?.sort || "name");
    const [sortDir, setSortDir] = useState(filters?.dir || "asc");

    
    const { selected_kepengurusan } = usePage().props;
    const isActiveYear =
        selected_kepengurusan?.is_active == 1 ||
        selected_kepengurusan?.is_active === true;

    
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

    
    const handleSort = (column) => {
        const newDir = sortBy === column && sortDir === "asc" ? "desc" : "asc";
        setSortBy(column);
        setSortDir(newDir);
        router.get(
            route(route().current()),
            { ...filters, sort: column, dir: newDir, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    
    const SortIcon = ({ column }) => {
        if (sortBy !== column)
            return (
                <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-gray-400" />
            );
        return sortDir === "asc" ? (
            <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-blue-500" />
        ) : (
            <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-blue-500" />
        );
    };

    
    useEffect(() => {
        if (selectedLab) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLabId = urlParams.get("lab_id");
            if (urlLabId !== String(selectedLab.id)) {
                router.visit("/anggota", {
                    data: { lab_id: selectedLab.id },
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }
    }, [selectedLab]);

    const createForm = useForm({
        name: "",
        email: "",
        nomor_induk: "",
        nomor_anggota: "",
        jenis_kelamin: "",
        foto_profile: null,
        alamat: "",
        no_hp: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        struktur_id: "",
        lab_id: selectedLab?.id || "",
        tahun_id: filters?.tahun_id || "",
    });

    const editForm = useForm({
        name: "",
        email: "",
        nomor_induk: "",
        nomor_anggota: "",
        jenis_kelamin: "",
        foto_profile: null,
        alamat: "",
        no_hp: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        struktur_id: "",
        password: "",
        _method: "PUT",
    });

    const transferForm = useForm({
        kepengurusan_lab_id: "",
        struktur_id: "",
        anggota_dipilih: [],
    });

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData("lab_id", selectedLab?.id || "");
        createForm.setData("tahun_id", filters?.tahun_id || "");
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        createForm.reset();
        setPreviewImage(null);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.reset();
        editForm.setData({
            name: item.name ?? "",
            email: item.email ?? "",
            nomor_induk: item.profile?.nomor_induk ?? "",
            nomor_anggota: item.profile?.nomor_anggota ?? "",
            jenis_kelamin: item.profile?.jenis_kelamin ?? "",
            alamat: item.profile?.alamat ?? "",
            no_hp: item.profile?.no_hp ?? "",
            tempat_lahir: item.profile?.tempat_lahir ?? "",
            tanggal_lahir: item.profile?.tanggal_lahir ?? "",
            struktur_id: item.struktur_id ?? "",
            password: "",
            kepengurusan_lab_id:
                item.kepengurusan_lab_id ?? filters?.kepengurusan_lab_id ?? "",
            _method: "PUT",
        });

        if (item.profile.foto_profile) {
            setPreviewImage(`/storage/${item.profile.foto_profile}`);
        } else {
            setPreviewImage(null);
        }

        setIsEditModalOpen(true);
    };

    
    const fetchActiveMembersFromPrevious = async (kepengurusanLabId) => {
        try {
            const response = await fetch(
                `/anggota/active-members-from-previous?kepengurusan_lab_id=${kepengurusanLabId}`,
            );
            const data = await response.json();

            if (data.success) {
                setAnggotaSebelumnya(data.active_members);
            } else {
                toast.error(
                    "Gagal mengambil data anggota dari kepengurusan sebelumnya",
                );
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Terjadi kesalahan saat mengambil data");
        }
    };

    
    const handleTransfer = async (e) => {
        e.preventDefault();

        if (transferForm.data.anggota_dipilih.length === 0) {
            toast.warning("Pilih minimal satu anggota untuk ditransfer");
            return;
        }

        if (!transferForm.data.struktur_id) {
            toast.warning("Pilih struktur untuk anggota yang ditransfer");
            return;
        }

        transferForm.transform((data) => ({
            ...data,
            user_ids: data.anggota_dipilih,
            active_kepengurusan_id: filters?.kepengurusan_lab_id,
        }));

        transferForm.post(route("anggota.transfer-from-previous"), {
            onSuccess: () => {
                setShowTransferModal(false);
                transferForm.reset();
                setAnggotaSebelumnya([]);
                
                router.reload();
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                if (firstError) toast.error(firstError);
            },
        });
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedItem(null);
        editForm.reset();
        setPreviewImage(null);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route("anggota.store"), {
            onSuccess: () => {
                closeCreateModal();
                toast.success("Anggota berhasil ditambahkan");
                router.reload();
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                if (firstError) {
                    toast.error(firstError);
                } else {
                    toast.error("Gagal menambahkan anggota baru");
                }
            },
            forceFormData: true,
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.post(route("anggota.update", selectedItem.id), {
            onSuccess: () => {
                closeEditModal();
                toast.success("Anggota berhasil diperbarui");
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                if (firstError) {
                    toast.error(firstError);
                } else {
                    toast.error("Gagal memperbarui data anggota");
                }
            },
            forceFormData: true,
        });
    };

    const handleDelete = () => {
        router.delete(route("anggota.destroy", selectedItem.id), {
            data: {
                lab_id: selectedLab?.id,
                kepengurusan_lab_id: filters?.kepengurusan_lab_id,
            },
            onSuccess: () => {
                closeDeleteModal();
                toast.success("Anggota berhasil dihapus dari kepengurusan ini");
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus anggota");
            },
        });
    };

    const handleKepengurusanChange = (kepengurusanId) => {
        transferForm.setData("kepengurusan_lab_id", kepengurusanId);
        transferForm.setData("anggota_dipilih", []);

        if (kepengurusanId) {
            
            fetchActiveMembersFromPrevious(kepengurusanId);
        } else {
            setAnggotaSebelumnya([]);
        }
    };

    const handleFileChange = (e, form) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);

            if (form === "create") {
                createForm.setData("foto_profile", file);
            } else {
                editForm.setData("foto_profile", file);
            }
        }
    };

    useEffect(() => {
        if (flash && flash.message) toast.success(flash.message);
        if (flash && flash.error) toast.error(flash.error);
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Keanggotaan Lab" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                {!isActiveYear && selected_kepengurusan && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Data Historis:</strong> Anda melihat
                                    data kepengurusan yang tidak aktif. Data ini
                                    hanya dapat dilihat.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Keanggotaan {selectedLab?.nama_lab}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Cari Nama / NIM / No. Anggota..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
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
                        {canAccess && (
                            <div className="flex gap-2">
                                {canTransfer && (
                                    <button
                                        onClick={() =>
                                            setShowTransferModal(true)
                                        }
                                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                                    >
                                        Transfer Anggota Lama
                                    </button>
                                )}
                                {isActiveYear && (
                                    <button
                                        onClick={openCreateModal}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                                    >
                                        + Tambah Anggota
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort("name")}
                                >
                                    Nama <SortIcon column="name" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort("nomor_induk")}
                                >
                                    NIM/NIK <SortIcon column="nomor_induk" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort("struktur")}
                                >
                                    Jabatan <SortIcon column="struktur" />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort("nomor_anggota")}
                                >
                                    Nomor Anggota{" "}
                                    <SortIcon column="nomor_anggota" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Foto
                                </th>
                                {canAccess && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {anggota &&
                            anggota.data &&
                            anggota.data.length > 0 ? (
                                anggota.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {anggota.from + index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.profile?.nomor_induk}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.struktur
                                                ? item.struktur.struktur
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {item.profile?.nomor_anggota || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.profile?.foto_profile ? (
                                                <img
                                                    src={`/storage/${item.profile.foto_profile}`}
                                                    alt={`Foto ${item.name}`}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">
                                                        No Img
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        {canAccess && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {isActiveYear ? (
                                                    <div className="flex space-x-2">
                                                        <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    item,
                                                                )
                                                            }

                                                            title="Edit"
                                                        >
    <Edit className="w-4 h-4" />
</button>
                                                        <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    item,
                                                                )
                                                            }

                                                            title="Hapus"
                                                        >
    <Trash2 className="w-4 h-4" />
</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">
                                                        Data historis
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={canAccess ? "7" : "6"}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        Tidak ada data anggota
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-200">
                    <Pagination links={anggota.links} />
                </div>
            </div>

            

            <Modal
                show={isCreateModalOpen}
                maxWidth="2xl"
                onClose={closeCreateModal}
            >
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Anggota
                        </h3>
                        <button
                            onClick={closeCreateModal}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleCreate} encType="multipart/form-data">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 mb-3">
                                <h4 className="font-medium text-gray-700 mb-2">
                                    Informasi Akun
                                </h4>
                                <div className="h-0.5 bg-gray-100"></div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.name ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {createForm.errors.name && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.name}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={createForm.data.email ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {createForm.errors.email && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NIM/NIDN/NIP{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.nomor_induk ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nomor_induk",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                <div className="text-xs text-blue-600 mt-1">
                                    Password akan otomatis menggunakan
                                    NIM/NIDN/NIP ini
                                </div>
                                {createForm.errors.nomor_induk && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.nomor_induk}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jabatan{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.struktur_id ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "struktur_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Pilih Jabatan</option>
                                    {struktur &&
                                        struktur.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.struktur}
                                            </option>
                                        ))}
                                </select>
                                {createForm.errors.struktur_id && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.struktur_id}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2 mb-3 mt-4">
                                <h4 className="font-medium text-gray-700 mb-2">
                                    Informasi Personal
                                </h4>
                                <div className="h-0.5 bg-gray-100"></div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Anggota
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.nomor_anggota ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nomor_anggota",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jenis Kelamin{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.jenis_kelamin ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "jenis_kelamin",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">
                                        Pilih Jenis Kelamin
                                    </option>
                                    <option value="laki-laki">Laki-laki</option>
                                    <option value="perempuan">Perempuan</option>
                                </select>
                                {createForm.errors.jenis_kelamin && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.jenis_kelamin}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor HP
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.no_hp ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "no_hp",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tempat Lahir
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.tempat_lahir ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tempat_lahir",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Lahir
                                </label>
                                <input
                                    type="date"
                                    value={createForm.data.tanggal_lahir ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tanggal_lahir",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="col-span-2 mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat
                                </label>
                                <textarea
                                    value={createForm.data.alamat ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "alamat",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="col-span-2 mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Foto Profil (Opsional)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="h-20 w-20 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center">
                                                <span className="text-gray-500 text-xs">
                                                    No Image
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                handleFileChange(e, "create")
                                            }
                                            className="w-full"
                                            accept="image/*"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            Format: JPG, JPEG, PNG. Max: 2MB
                                        </div>
                                    </div>
                                </div>
                                {createForm.errors.foto_profile && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.foto_profile}
                                    </div>
                                )}
                            </div>
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
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
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
                show={isEditModalOpen && !!selectedItem}
                maxWidth="2xl"
                onClose={closeEditModal}
            >
                <div className="flex flex-col max-h-[90vh]">
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Edit Anggota
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            id="form-edit-anggota"
                            onSubmit={handleEdit}
                            encType="multipart/form-data"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 mb-3">
                                    <h4 className="font-medium text-gray-700 mb-2">
                                        Informasi Akun
                                    </h4>
                                    <div className="h-0.5 bg-gray-100"></div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.name ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    {editForm.errors.name && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.name}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.data.email ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    {editForm.errors.email && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.email}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jabatan{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editForm.data.struktur_id ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "struktur_id",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Pilih Jabatan</option>
                                        {struktur &&
                                            struktur.map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.struktur}
                                                </option>
                                            ))}
                                    </select>
                                    {editForm.errors.struktur_id && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.struktur_id}
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 mb-3 mt-4">
                                    <h4 className="font-medium text-gray-700 mb-2">
                                        Informasi Personal
                                    </h4>
                                    <div className="h-0.5 bg-gray-100"></div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NIM/NIDN/NIP
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.nomor_induk ?? ""}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                        readOnly
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        NIM/NIDN/NIP tidak dapat diubah
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password (Opsional)
                                    </label>
                                    <input
                                        type="password"
                                        value={editForm.data.password}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "password",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Kosongkan jika tidak ingin mengubah
                                        password.
                                    </div>
                                    {editForm.errors.password && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.password}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor Anggota
                                    </label>
                                    <input
                                        type="text"
                                        value={
                                            editForm.data.nomor_anggota ?? ""
                                        }
                                        onChange={(e) =>
                                            editForm.setData(
                                                "nomor_anggota",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jenis Kelamin{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={
                                            editForm.data.jenis_kelamin ?? ""
                                        }
                                        onChange={(e) =>
                                            editForm.setData(
                                                "jenis_kelamin",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">
                                            Pilih Jenis Kelamin
                                        </option>
                                        <option value="laki-laki">
                                            Laki-laki
                                        </option>
                                        <option value="perempuan">
                                            Perempuan
                                        </option>
                                    </select>
                                    {editForm.errors.jenis_kelamin && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.jenis_kelamin}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nomor HP
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.no_hp ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "no_hp",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tempat Lahir
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.tempat_lahir ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "tempat_lahir",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Lahir
                                    </label>
                                    <input
                                        type="date"
                                        value={
                                            editForm.data.tanggal_lahir ?? ""
                                        }
                                        onChange={(e) =>
                                            editForm.setData(
                                                "tanggal_lahir",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="col-span-2 mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alamat
                                    </label>
                                    <textarea
                                        value={editForm.data.alamat ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "alamat",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="col-span-2 mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Foto Profil (Opsional)
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {previewImage ? (
                                                <img
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="h-20 w-20 object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">
                                                        No Image
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                onChange={(e) =>
                                                    handleFileChange(e, "edit")
                                                }
                                                className="w-full"
                                                accept="image/*"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">
                                                Format: JPG, JPEG, PNG. Max: 2MB
                                            </div>
                                        </div>
                                    </div>
                                    {editForm.errors.foto_profile && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {editForm.errors.foto_profile}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeEditModal}
                            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="form-edit-anggota"
                            disabled={editForm.processing}
                            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:opacity-75"
                        >
                            {editForm.processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </div>
            </Modal>
            
            <ConfirmModal
                show={isDeleteModalOpen && !!selectedItem}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title="Hapus Anggota"
                message={`Apakah Anda yakin ingin menghapus anggota "${selectedItem?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            
            <Modal
                show={showTransferModal}
                maxWidth="2xl"
                onClose={() => setShowTransferModal(false)}
            >
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Transfer Anggota dari Kepengurusan Sebelumnya
                        </h3>
                        <button
                            onClick={() => setShowTransferModal(false)}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleTransfer}>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Kepengurusan Sebelumnya
                                </label>
                                <select
                                    value={
                                        transferForm.data.kepengurusan_lab_id ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleKepengurusanChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">
                                        Pilih kepengurusan...
                                    </option>
                                    {kepengurusanlab
                                        ?.filter(
                                            (kep) =>
                                                kep.tahun_kepengurusan &&
                                                !kep.is_active,
                                        )
                                        .filter(
                                            (kep, index, self) =>
                                                index ===
                                                self.findIndex(
                                                    (k) =>
                                                        k.tahun_kepengurusan_id ===
                                                            kep.tahun_kepengurusan_id &&
                                                        k.laboratorium_id ===
                                                            kep.laboratorium_id,
                                                ),
                                        )
                                        .map((kep) => (
                                            <option key={kep.id} value={kep.id}>
                                                {kep.tahun_kepengurusan.tahun}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Struktur untuk Anggota yang Ditransfer
                                </label>
                                <select
                                    value={transferForm.data.struktur_id ?? ""}
                                    onChange={(e) =>
                                        transferForm.setData(
                                            "struktur_id",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Pilih struktur...</option>
                                    {struktur?.map((struk) => (
                                        <option key={struk.id} value={struk.id}>
                                            {struk.struktur}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {transferForm.data.kepengurusan_lab_id && (
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">
                                    Pilih Anggota yang Akan Ditransfer:
                                </h4>
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                                    {anggotaSebelumnya &&
                                    anggotaSebelumnya.length > 0 ? (
                                        anggotaSebelumnya.map((item) => (
                                            <label
                                                key={item.id}
                                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={item.id}
                                                    onChange={(e) => {
                                                        const checked =
                                                            e.target.checked;
                                                        const currentSelected =
                                                            transferForm.data
                                                                .anggota_dipilih;

                                                        if (checked) {
                                                            transferForm.setData(
                                                                "anggota_dipilih",
                                                                [
                                                                    ...currentSelected,
                                                                    item.id,
                                                                ],
                                                            );
                                                        } else {
                                                            transferForm.setData(
                                                                "anggota_dipilih",
                                                                currentSelected.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        item.id,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.nomor_induk ||
                                                            item.email}{" "}
                                                        - {item.struktur}{" "}
                                                        (Kepengurusan{" "}
                                                        {
                                                            item.kepengurusan_tahun
                                                        }
                                                        )
                                                    </div>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">
                                            {transferForm.data
                                                .kepengurusan_lab_id
                                                ? "Tidak ada anggota aktif di kepengurusan yang dipilih"
                                                : "Pilih kepengurusan terlebih dahulu"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowTransferModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                                Transfer Anggota
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Anggota;
