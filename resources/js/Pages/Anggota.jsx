import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import debounce from "lodash/debounce";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

    
    const applyServerQuery = debounce((state) => {
        setSearch(state.search);
        setPerPage(state.perPage);
        setSortBy(state.sort.key || "name");
        setSortDir(state.sort.direction);
        router.get(
            route(route().current()),
            {
                ...filters,
                search: state.search || undefined,
                perPage: state.perPage,
                sort: state.sort.key || undefined,
                dir: state.sort.direction,
                page: state.page,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);

    const tableColumns = useMemo(
        () => [
            {
                key: "name",
                header: "Nama",
                render: (item) => (
                    <span className="font-medium">{item.name}</span>
                ),
            },
            {
                key: "nomor_induk",
                header: "NIM/NIK",
                render: (item) => item.profile?.nomor_induk || "-",
            },
            {
                key: "struktur",
                header: "Jabatan",
                render: (item) => item.struktur?.struktur || "-",
            },
            {
                header: "Nomor Anggota",
                render: (item) => (
                    <span className="font-mono">
                        {item.profile?.nomor_anggota || "-"}
                    </span>
                ),
            },
            {
                header: "Foto",
                sortable: false,
                searchable: false,
                render: (item) =>
                    item.profile?.foto_profile ? (
                        <img
                            src={`/storage/${item.profile.foto_profile}`}
                            alt={`Foto ${item.name}`}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200">
                            <span className="text-xs text-base-content/50">
                                No Img
                            </span>
                        </div>
                    ),
            },
            ...(canAccess
                ? [
                      {
                          header: "Aksi",
                          sortable: false,
                          searchable: false,
                          headerClassName: "text-right",
                          render: (item) =>
                              isActiveYear ? (
                                  <RowActions
                                      onEdit={() => openEditModal(item)}
                                      onDelete={() => openDeleteModal(item)}
                                  />
                              ) : (
                                  <span className="text-xs italic text-base-content/40">
                                      Data historis
                                  </span>
                              ),
                      },
                  ]
                : []),
        ],
        [canAccess, isActiveYear],
    );

    
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

            <PageHeader
                title={`Keanggotaan ${selectedLab?.nama_lab || selectedLab?.nama || "Laboratorium"}`}
                description="Kelola anggota, jabatan, dan riwayat kepengurusan."
                actions={<>{canTransfer && <Button variant="secondary" onClick={() => setShowTransferModal(true)}>Transfer Anggota Lama</Button>}{canAccess && isActiveYear && <Button onClick={openCreateModal}>Tambah Anggota</Button>}</>}
            />
            <PageSection>
                {!isActiveYear && selected_kepengurusan && (
                    <div className="alert alert-warning rounded-none border-0 border-b border-warning/40">
                        <Info className="h-5 w-5 shrink-0" />
                        <p className="text-sm">
                            <strong>Data Historis:</strong> Anda melihat data
                            kepengurusan yang tidak aktif. Data ini hanya dapat
                            dilihat.
                        </p>
                    </div>
                )}

                <DataGrid
                    rows={anggota?.data ?? []}
                    columns={tableColumns}
                    rowKey="id"
                    searchPlaceholder="Cari nama, NIM, atau nomor anggota..."
                    emptyMessage="Tidak ada data anggota."
                    defaultPerPage={perPage}
                    server={{
                        search,
                        perPage,
                        page: anggota?.current_page ?? 1,
                        sort: { key: sortBy, direction: sortDir },
                        total: anggota?.total ?? 0,
                        from: anggota?.from ?? 0,
                        to: anggota?.to ?? 0,
                        lastPage: anggota?.last_page ?? 1,
                        onChange: applyServerQuery,
                    }}
                />
            </PageSection>

            

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
                            type="button"
                            onClick={closeCreateModal}
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleCreate} encType="multipart/form-data">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 mb-3">
                                <h4 className="font-medium text-base-content mb-2">
                                    Informasi Akun
                                </h4>
                                <div className="h-0.5 bg-base-200"></div>
                            </div>

                            <FormField label="Nama Lengkap" error={createForm.errors.name} required className="mb-4">
                                <input
                                    type="text"
                                    value={createForm.data.name ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                    required
                                />
                            </FormField>

                            <FormField label="Email" error={createForm.errors.email} required className="mb-4">
                                <input
                                    type="email"
                                    value={createForm.data.email ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                    required
                                />
                            </FormField>

                            <FormField label="NIM/NIDN/NIP" hint="Password akan otomatis menggunakan NIM/NIDN/NIP ini" error={createForm.errors.nomor_induk} required className="mb-4">
                                <input
                                    type="text"
                                    value={createForm.data.nomor_induk ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nomor_induk",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                    required
                                />
                            </FormField>

                            <FormField label="Jabatan" error={createForm.errors.struktur_id} required className="mb-4">
                                <select
                                    value={createForm.data.struktur_id ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "struktur_id",
                                            e.target.value,
                                        )
                                    }
                                    className="select select-bordered w-full min-h-11"
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
                            </FormField>

                            <div className="col-span-2 mb-3 mt-4">
                                <h4 className="font-medium text-base-content mb-2">
                                    Informasi Personal
                                </h4>
                                <div className="h-0.5 bg-base-200"></div>
                            </div>

                            <FormField label="Nomor Anggota" error={createForm.errors.nomor_anggota} className="mb-4">
                                <input
                                    type="text"
                                    value={createForm.data.nomor_anggota ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nomor_anggota",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                />
                            </FormField>

                            <FormField label="Jenis Kelamin" error={createForm.errors.jenis_kelamin} required className="mb-4">
                                <select
                                    value={createForm.data.jenis_kelamin ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "jenis_kelamin",
                                            e.target.value,
                                        )
                                    }
                                    className="select select-bordered w-full min-h-11"
                                    required
                                >
                                    <option value="">
                                        Pilih Jenis Kelamin
                                    </option>
                                    <option value="laki-laki">Laki-laki</option>
                                    <option value="perempuan">Perempuan</option>
                                </select>
                            </FormField>

                            <FormField label="Nomor HP" error={createForm.errors.no_hp} className="mb-4">
                                <input
                                    type="text"
                                    value={createForm.data.no_hp ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "no_hp",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                />
                            </FormField>

                            <FormField label="Tempat Lahir" error={createForm.errors.tempat_lahir} className="mb-4">
                                <input
                                    type="text"
                                    value={createForm.data.tempat_lahir ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tempat_lahir",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                />
                            </FormField>

                            <FormField label="Tanggal Lahir" error={createForm.errors.tanggal_lahir} className="mb-4">
                                <input
                                    type="date"
                                    value={createForm.data.tanggal_lahir ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tanggal_lahir",
                                            e.target.value,
                                        )
                                    }
                                    className="input input-bordered w-full min-h-11"
                                />
                            </FormField>

                            <FormField label="Alamat" error={createForm.errors.alamat} className="col-span-2 mb-4">
                                <textarea
                                    value={createForm.data.alamat ?? ""}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "alamat",
                                            e.target.value,
                                        )
                                    }
                                    className="textarea textarea-bordered w-full min-h-11"
                                    rows="3"
                                ></textarea>
                            </FormField>

                            <FormField label="Foto Profil (Opsional)" hint="Format: JPG, JPEG, PNG. Maksimal 2MB" error={createForm.errors.foto_profile} className="col-span-2 mb-4">
                                <div className="flex items-center gap-4">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Pratinjau foto profil"
                                            className="h-20 w-20 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-md bg-base-200">
                                            <span className="text-xs text-base-content/70">
                                                No Image
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        aria-label="Foto profil"
                                        onChange={(e) =>
                                            handleFileChange(e, "create")
                                        }
                                        className="file-input file-input-bordered w-full min-h-11"
                                        accept="image/*"
                                    />
                                </div>
                            </FormField>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={closeCreateModal}>Batal</Button>
                            <Button type="submit" loading={createForm.processing}>Simpan</Button>
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
                                type="button"
                                onClick={closeEditModal}
                                className="btn btn-ghost btn-square btn-sm"
                                aria-label="Tutup"
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
                                    <h4 className="font-medium text-base-content mb-2">
                                        Informasi Akun
                                    </h4>
                                    <div className="h-0.5 bg-base-200"></div>
                                </div>

                                <FormField label="Nama Lengkap" error={editForm.errors.name} required className="mb-4">
                                    <input
                                        type="text"
                                        value={editForm.data.name ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                        required
                                    />
                                </FormField>

                                <FormField label="Email" error={editForm.errors.email} required className="mb-4">
                                    <input
                                        type="email"
                                        value={editForm.data.email ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                        required
                                    />
                                </FormField>

                                <FormField label="Jabatan" error={editForm.errors.struktur_id} required className="mb-4">
                                    <select
                                        value={editForm.data.struktur_id ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "struktur_id",
                                                e.target.value,
                                            )
                                        }
                                        className="select select-bordered w-full min-h-11"
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
                                </FormField>

                                <div className="col-span-2 mb-3 mt-4">
                                    <h4 className="font-medium text-base-content mb-2">
                                        Informasi Personal
                                    </h4>
                                    <div className="h-0.5 bg-base-200"></div>
                                </div>

                                <FormField label="NIM/NIDN/NIP" hint="NIM/NIDN/NIP tidak dapat diubah" className="mb-4">
                                    <input
                                        type="text"
                                        value={editForm.data.nomor_induk ?? ""}
                                        className="input input-bordered w-full min-h-11 cursor-not-allowed bg-base-200"
                                        readOnly
                                    />
                                </FormField>

                                <FormField label="Password (Opsional)" hint="Kosongkan jika tidak ingin mengubah password." error={editForm.errors.password} className="mb-4">
                                    <input
                                        type="password"
                                        value={editForm.data.password}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "password",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                    />
                                </FormField>

                                <FormField label="Nomor Anggota" error={editForm.errors.nomor_anggota} className="mb-4">
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
                                        className="input input-bordered w-full min-h-11"
                                    />
                                </FormField>

                                <FormField label="Jenis Kelamin" error={editForm.errors.jenis_kelamin} required className="mb-4">
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
                                        className="select select-bordered w-full min-h-11"
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
                                </FormField>

                                <FormField label="Nomor HP" error={editForm.errors.no_hp} className="mb-4">
                                    <input
                                        type="text"
                                        value={editForm.data.no_hp ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "no_hp",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                    />
                                </FormField>

                                <FormField label="Tempat Lahir" error={editForm.errors.tempat_lahir} className="mb-4">
                                    <input
                                        type="text"
                                        value={editForm.data.tempat_lahir ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "tempat_lahir",
                                                e.target.value,
                                            )
                                        }
                                        className="input input-bordered w-full min-h-11"
                                    />
                                </FormField>

                                <FormField label="Tanggal Lahir" error={editForm.errors.tanggal_lahir} className="mb-4">
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
                                        className="input input-bordered w-full min-h-11"
                                    />
                                </FormField>

                                <FormField label="Alamat" error={editForm.errors.alamat} className="col-span-2 mb-4">
                                    <textarea
                                        value={editForm.data.alamat ?? ""}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "alamat",
                                                e.target.value,
                                            )
                                        }
                                        className="textarea textarea-bordered w-full min-h-11"
                                        rows="3"
                                    ></textarea>
                                </FormField>

                                <FormField label="Foto Profil (Opsional)" hint="Format: JPG, JPEG, PNG. Maksimal 2MB" error={editForm.errors.foto_profile} className="col-span-2 mb-4">
                                    <div className="flex items-center gap-4">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Pratinjau foto profil"
                                                className="h-20 w-20 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-20 w-20 items-center justify-center rounded-md bg-base-200">
                                                <span className="text-xs text-base-content/70">
                                                    No Image
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            aria-label="Foto profil"
                                            onChange={(e) =>
                                                handleFileChange(e, "edit")
                                            }
                                            className="file-input file-input-bordered w-full min-h-11"
                                            accept="image/*"
                                        />
                                    </div>
                                </FormField>
                            </div>
                        </form>
                    </div>
                    
                    <div className="flex justify-end gap-3 border-t border-base-300 bg-base-100 px-6 py-4">
                        <Button type="button" variant="ghost" onClick={closeEditModal}>Batal</Button>
                        <Button type="submit" form="form-edit-anggota" loading={editForm.processing}>Simpan</Button>
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
                            type="button"
                            onClick={() => setShowTransferModal(false)}
                            className="btn btn-ghost btn-square btn-sm"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleTransfer}>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <FormField label="Pilih Kepengurusan Sebelumnya">
                                <select
                                    value={
                                        transferForm.data.kepengurusan_lab_id ??
                                        ""
                                    }
                                    onChange={(e) =>
                                        handleKepengurusanChange(e.target.value)
                                    }
                                    className="select select-bordered w-full min-h-11"
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
                            </FormField>

                            <FormField label="Struktur untuk Anggota yang Ditransfer">
                                <select
                                    value={transferForm.data.struktur_id ?? ""}
                                    onChange={(e) =>
                                        transferForm.setData(
                                            "struktur_id",
                                            e.target.value,
                                        )
                                    }
                                    className="select select-bordered w-full min-h-11"
                                    required
                                >
                                    <option value="">Pilih struktur...</option>
                                    {struktur?.map((struk) => (
                                        <option key={struk.id} value={struk.id}>
                                            {struk.struktur}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        {transferForm.data.kepengurusan_lab_id && (
                            <div className="mb-6">
                                <h4 className="font-medium text-base-content mb-3">
                                    Pilih Anggota yang Akan Ditransfer:
                                </h4>
                                <div className="max-h-60 overflow-y-auto rounded-md border border-base-300 p-3">
                                    {anggotaSebelumnya &&
                                    anggotaSebelumnya.length > 0 ? (
                                        anggotaSebelumnya.map((item) => (
                                            <label
                                                key={item.id}
                                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded p-2 hover:bg-base-200"
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
                                                    className="checkbox checkbox-primary"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-base-content">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
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
                                        <p className="text-base-content/70 text-center py-4">
                                            {transferForm.data
                                                .kepengurusan_lab_id
                                                ? "Tidak ada anggota aktif di kepengurusan yang dipilih"
                                                : "Pilih kepengurusan terlebih dahulu"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setShowTransferModal(false)}>Batal</Button>
                            <Button type="submit" variant="secondary">Transfer Anggota</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default Anggota;
