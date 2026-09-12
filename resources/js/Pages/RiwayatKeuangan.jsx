import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ActionButtons from "../Components/ActionButtons";
import Button from "../Components/Button";
import ConfirmModal from "../Components/ConfirmModal";
import PageHeader from "../Components/PageHeader";
import PageSection from "../Components/PageSection";
import FormField from "../Components/FormField";
import { useLab } from "../Components/LabContext";
import Modal from "../Components/Modal";
import StatusBadge from "../Components/StatusBadge";
import Pagination from "../Components/Pagination";
import { usePermission } from "../Components/PermissionContext";
import DashboardLayout from "../Layouts/DashboardLayout";


const RiwayatKeuangan = ({
    riwayatKeuangan,
    kepengurusanlab,
    tahunKepengurusan,
    filters,
    flash,
    asisten,
    nominalKas,
    totalPemasukan,
    totalPengeluaran,
    saldo,
}) => {
    const { selectedLab } = useLab();
    const { can } = usePermission();

    
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);

    
    const canCreate = can("keuangan.create-transaksi");
    const canUpdate = can("keuangan.update-transaksi");
    const canDelete = can("keuangan.delete-transaksi");

    
    const handleSearch = useCallback(
        debounce((query) => {
            router.get(
                route(route().current()),
                { ...filters, search: query, page: 1 },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300),
        [filters],
    );

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

    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNominalKasModalOpen, setIsNominalKasModalOpen] = useState(false);
    const [isEditingNominalKas, setIsEditingNominalKas] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isUangKas, setIsUangKas] = useState(false);
    const [selectedAnggota, setSelectedAnggota] = useState("");
    const [previewImage, setPreviewImage] = useState(null);

    
    const createForm = useForm({
        tanggal: new Date().toISOString().split("T")[0], 
        nominal: "",
        jenis: "masuk",
        deskripsi: "",
        lab_id: selectedLab ? selectedLab.id : null, 
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        nominal_kas_id: "",
        is_uang_kas: false,
        user_id: "",
        jenis_pembayaran_kas: "normal",
        catatan_pembayaran: "",
    });

    
    const editForm = useForm({
        tanggal: "",
        nominal: "",
        jenis: "",
        deskripsi: "",
        lab_id: selectedLab ? selectedLab.id : null, 
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        jenis_pembayaran_kas: "normal",
        catatan_pembayaran: "",
    });

    
    const deleteForm = useForm({});

    
    const nominalKasForm = useForm({
        kepengurusan_lab_id: kepengurusanlab?.id || "",
        nominal: "",
        periode: "bulanan",
        periode_mulai: "",
        periode_berakhir: "",
        deskripsi: "",
        is_active: true,
    });

    
    const currentNominalKas =
        nominalKas?.length > 0
            ? nominalKas.find((nk) => nk.is_active) || nominalKas[0]
            : null;

    
    const openCreateModal = () => {
        if (!kepengurusanlab) {
            toast.error(
                "Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu",
            );
            return;
        }
        createForm.reset();
        createForm.setData({
            tanggal: new Date().toISOString().split("T")[0], 
            nominal: "",
            jenis: "masuk",
            deskripsi: "",
            bukti: "",
            lab_id: selectedLab.id, 
            kepengurusan_lab_id: kepengurusanlab.id,
            nominal_kas_id: "",
            is_uang_kas: false,
            user_id: "",
            jenis_pembayaran_kas: "normal",
            catatan_pembayaran: "",
        });
        setIsUangKas(false);
        setSelectedAnggota("");
        setIsCreateModalOpen(true);
    };

    
    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            tanggal: item.tanggal.split("T")[0], 
            nominal: item.nominal,
            jenis: item.jenis,
            deskripsi: item.deskripsi,
            bukti: item.bukti,
            lab_id: selectedLab.id, 
            kepengurusan_lab_id: kepengurusanlab.id,
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };

    
    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    
    const handleUangKasChange = (e) => {
        const isChecked = e.target.checked;

        if (isChecked && !currentNominalKas) {
            toast.error(
                "Nominal kas aktif belum diatur untuk kepengurusan ini",
            );
            setIsUangKas(false);
            createForm.setData("is_uang_kas", 0);
            createForm.setData("nominal_kas_id", "");
            return;
        }

        setIsUangKas(isChecked);

        
        createForm.setData("is_uang_kas", isChecked ? 1 : 0);

        
        if (!isChecked) {
            setSelectedAnggota("");
            createForm.setData("user_id", "");
            createForm.setData("nominal_kas_id", "");
            createForm.setData("deskripsi", "");
        } else if (isChecked && selectedAnggota) {
            const defaultNominalKasId = currentNominalKas?.id || "";
            createForm.setData("nominal_kas_id", defaultNominalKasId);

            
            const selectedAnggotaData = asisten.find(
                (anggota) =>
                    anggota.id.toString() === selectedAnggota.toString(),
            );
            if (selectedAnggotaData) {
                createForm.setData(
                    "deskripsi",
                    `Pembayaran uang kas (${selectedAnggotaData.name})`,
                );
            } else {
                createForm.setData("deskripsi", "Pembayaran uang kas");
            }
        } else {
            const defaultNominalKasId = currentNominalKas?.id || "";
            createForm.setData("nominal_kas_id", defaultNominalKasId);
            createForm.setData("deskripsi", "Pembayaran uang kas");
        }

        console.log("is_uang_kas set to:", isChecked ? 1 : 0);
    };

    
    const handleAnggotaChange = (e) => {
        const anggotaId = e.target.value;
        setSelectedAnggota(anggotaId);
        createForm.setData("user_id", anggotaId);

        
        if (isUangKas) {
            const selectedAnggotaData = asisten.find(
                (anggota) => anggota.id.toString() === anggotaId.toString(),
            );
            if (selectedAnggotaData) {
                createForm.setData(
                    "deskripsi",
                    `Pembayaran uang kas (${selectedAnggotaData.name})`,
                );
            }
        }
    };

    
    const handleJenisChange = (e) => {
        const jenis = e.target.value;
        createForm.setData("jenis", jenis);

        
        if (jenis !== "masuk") {
            setIsUangKas(false);
            setSelectedAnggota("");
            createForm.setData("is_uang_kas", false);
            createForm.setData("user_id", "");
            createForm.setData("nominal_kas_id", "");
        }
    };

    
    
    
    

    const showImage = (imagePath) => {
        window.open(`/storage/${imagePath}`, "_blank");
    };

    
    const handleCreate = (e) => {
        e.preventDefault();

        
        if (isUangKas && selectedAnggota) {
            const selectedAnggotaData = asisten.find(
                (anggota) =>
                    anggota.id.toString() === selectedAnggota.toString(),
            );
            if (selectedAnggotaData) {
                createForm.setData(
                    "deskripsi",
                    `Pembayaran uang kas (${selectedAnggotaData.name})`,
                );
            }
        }

        if (!createForm.data.deskripsi) {
            toast.error("Deskripsi tidak boleh kosong");
            return;
        }

        if (
            createForm.data.jenis === "masuk" &&
            isUangKas &&
            !createForm.data.nominal_kas_id
        ) {
            toast.error("Nominal kas aktif belum tersedia");
            return;
        }

        console.log("Form data before submit:", createForm.data);
        console.log(
            "Jenis pembayaran kas:",
            createForm.data.jenis_pembayaran_kas,
        );

        createForm.post(route("riwayat-keuangan.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                toast.success("Data keuangan berhasil ditambahkan");
            },
            onError: (errors) => {
                console.error("Create errors:", errors);

                
                if (errors.is_uang_kas) {
                    toast.error(errors.is_uang_kas);
                } else if (errors.bukti) {
                    toast.error(errors.bukti);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    const errorMessages = Object.values(errors).flat();
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages[0]); 
                    } else {
                        toast.error("Gagal menambahkan data");
                    }
                }
            },
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();

        
        console.log("Form data being sent:", editForm.data);

        editForm.post(route("riwayat-keuangan.update", selectedItem.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success("Data keuangan berhasil diperbarui");
            },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    const firstError = Object.values(errors).find(Boolean);
                    if (firstError) toast.error(firstError);
                    else toast.error("Gagal memperbarui data");
                },
        });
    };

    const handleDelete = () => {
        deleteForm.delete(route("riwayat-keuangan.destroy", selectedItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success("Data keuangan berhasil dihapus");
            },
            onError: (errors) => {
                console.error("Delete error:", errors);
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus data");
            },
        });
    };

    const handleExport = () => {
        console.log("Inside handleExport function");

        if (!selectedLab || !kepengurusanlab) {
            console.log("Validation failed: missing lab or kepengurusan");
            toast.error("Silakan pilih Periode Kepengurusan terlebih dahulu");
            return;
        }

        
        const lab_id = selectedLab.id;
        
        const tahun_id = kepengurusanlab.tahun_kepengurusan_id;

        console.log("About to call check data endpoint");

        
        axios
            .get(route("riwayat-keuangan.check-data"), {
                params: {
                    lab_id: lab_id,
                    tahun_id: tahun_id,
                },
            })
            .then((response) => {
                if (response.data.hasData) {
                    
                    console.log("Data exists, opening export");
                    window.open(
                        `${route(
                            "riwayat-keuangan.export",
                        )}?lab_id=${lab_id}&tahun_id=${tahun_id}`,
                        "_blank",
                    );
                } else {
                    
                    console.log("No data found");
                    toast.error(
                        "Tidak ada riwayat keuangan untuk tahun yang dipilih",
                    );
                }
            })
            .catch((error) => {
                console.error("Error checking data:", error);
                toast.error("Terjadi kesalahan saat memeriksa data");
            });
    };

    
    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    
    useEffect(() => {
        if (selectedLab) {
            
            createForm.setData("lab_id", selectedLab.id);
            editForm.setData("lab_id", selectedLab.id);
        }
    }, [selectedLab]);

    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getNominalKasInfo = (item) => {
        if (!(item?.jenis === "masuk" && item?.is_uang_kas)) {
            return "-";
        }

        const nominalKasItem = item?.nominal_kas || item?.nominalKas || null;

        if (!nominalKasItem) {
            return "Tidak terhubung";
        }

        return `${formatCurrency(nominalKasItem.nominal)} / ${nominalKasItem.periode}`;
    };

    const tableColSpan = canUpdate || canDelete ? 9 : 8;

    return (
        <DashboardLayout>
            <Head title="Riwayat Keuangan" />

            <PageHeader title="Riwayat Keuangan" description="Kelola pemasukan, pengeluaran, dan kas laboratorium." />
            <PageSection>
                <div className="flex flex-col gap-3 border-b border-base-300 pb-4 lg:flex-row lg:items-center lg:justify-end">

                    <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
                        <div className="w-full sm:w-auto">
                            
                        </div>
                        <button
                            onClick={() => {
                                console.log("Button clicked");
                                try {
                                    handleExport();
                                    console.log(
                                        "handleExport executed successfully",
                                    );
                                } catch (error) {
                                    console.error(
                                        "Error in handleExport:",
                                        error,
                                    );
                                }
                            }}
                            className="btn btn-secondary min-h-11 w-full sm:w-auto"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-9.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Download</span>
                        </button>
                        {canCreate &&
                            kepengurusanlab?.is_active && (
                                <button
                                    onClick={openCreateModal}
                                    className="btn btn-primary min-h-11 w-full sm:w-auto"
                                    disabled={!kepengurusanlab}
                                >
                                    <span className="flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-1"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Tambah
                                    </span>
                                </button>
                            )}
                        {canCreate &&
                            kepengurusanlab?.is_active && (
                                <button
                                    onClick={() => {
                                        nominalKasForm.setData(
                                            "kepengurusan_lab_id",
                                            kepengurusanlab.id,
                                        );
                                        setIsEditingNominalKas(false);
                                        setIsNominalKasModalOpen(true);
                                    }}
                                    className="btn btn-secondary min-h-11 w-full sm:w-auto"
                                    disabled={!kepengurusanlab}
                                >
                                    <span className="flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-1"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0-3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Nominal Kas
                                    </span>
                                </button>
                            )}
                    </div>
                </div>

                
                {kepengurusanlab && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="card border border-base-300 bg-base-100">
                            <div className="card-body gap-1 p-4">
                                <div className="text-sm text-base-content/70">Saldo</div>
                                <div className={`text-xl font-bold ${(saldo || 0) >= 0 ? "text-info" : "text-error"}`}>{formatCurrency(saldo || 0)}</div>
                            </div>
                        </div>
                        <div className="card border border-base-300 bg-base-100">
                            <div className="card-body gap-1 p-4">
                                <div className="text-sm text-base-content/70">Total Pemasukan</div>
                                <div className="text-xl font-bold text-success">{formatCurrency(totalPemasukan)}</div>
                            </div>
                        </div>
                        <div className="card border border-base-300 bg-base-100">
                            <div className="card-body gap-1 p-4">
                                <div className="text-sm text-base-content/70">Total Pengeluaran</div>
                                <div className="text-xl font-bold text-error">{formatCurrency(totalPengeluaran)}</div>
                            </div>
                        </div>
                    </div>
                )}

                
                {kepengurusanlab && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-base-300 pt-4 sm:flex-row">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-base-content/70">
                                Tampilkan
                            </span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="select select-bordered min-h-11 text-sm"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span className="text-sm text-base-content/70">data</span>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-base-content/60" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari deskripsi..."
                                value={search}
                                onChange={onSearchChange}
                                className="input input-bordered min-h-11 w-full pl-10 text-sm"
                            />
                        </div>
                    </div>
                )}

                
                    <div className="silab-table-wrap">
                    <table className="silab-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Deskripsi</th>
                                <th>Bukti</th>
                                <th>Jenis</th>
                                <th>Sumber</th>
                                <th>Nominal Kas</th>
                                <th>Nominal</th>
                                {(canUpdate || canDelete) && (
                                    <th>Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {riwayatKeuangan?.data?.length > 0 ? (
                                riwayatKeuangan.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
                                            {(riwayatKeuangan?.from || 0) +
                                                index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                            {new Date(
                                                item.tanggal,
                                            ).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-base-content">
                                            {item.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.bukti ? (
                                                <img
                                                    src={`/storage/${item.bukti}`}
                                                    alt="Bukti"
                                                    className="h-16 w-16 cursor-pointer rounded border border-base-300 object-cover"
                                                    onClick={() =>
                                                        showImage(item.bukti)
                                                    }
                                                    title="Klik untuk melihat"
                                                />
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <StatusBadge tone={item.jenis === "masuk" ? "success" : "error"} label={item.jenis === "masuk" ? "Pemasukan" : "Pengeluaran"} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/80">
                                            {item.sumber || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/80">
                                            {getNominalKasInfo(item)}
                                        </td>
                                        <td
                                            className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${item.jenis === "masuk" ? "text-success" : "text-error"}`}
                                        >
                                            {formatCurrency(item.nominal)}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <ActionButtons
                                                    item={{
                                                        ...item,
                                                        kepengurusanlab:
                                                            kepengurusanlab,
                                                    }}
                                                    onEdit={openEditModal}
                                                    onDelete={openDeleteModal}
                                                    showEdit={canUpdate}
                                                    showDelete={canDelete}
                                                    editLabel="Edit"
                                                    deleteLabel="Hapus"
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={tableColSpan}
                                        className="px-6 py-4 text-center text-sm text-base-content/70"
                                    >
                                        <div className="flex flex-col items-center">
                                            <p>
                                                {kepengurusanlab
                                                    ? "Tidak ada data keuangan"
                                                    : "Silakan pilih laboratorium di Navbar"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {riwayatKeuangan?.links && (
                    <div className="border-t border-base-300 p-4">
                        <Pagination links={riwayatKeuangan.links} />
                    </div>
                )}
            </PageSection>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Tambah Transaksi
                        </h3>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="text-base-content/60 hover:text-base-content/80"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <form
                        onSubmit={handleCreate}
                        encType="multipart/form-data"
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Tanggal" error={createForm.errors.tanggal} required>
                                <input
                                    type="date"
                                    name="tanggal"
                                    className="input input-bordered min-h-11 w-full"
                                    value={
                                        createForm.data.tanggal ||
                                        new Date().toISOString().split("T")[0]
                                    }
                                    onChange={(e) =>
                                        createForm.setData(
                                            "tanggal",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </FormField>
                            <FormField label="Jenis Transaksi" error={createForm.errors.jenis} required>
                                <select
                                    name="jenis"
                                    className="select select-bordered min-h-11 w-full"
                                    value={createForm.data.jenis}
                                    onChange={handleJenisChange}
                                    required
                                >
                                    <option value="masuk">Pemasukan</option>
                                    <option value="keluar">Pengeluaran</option>
                                </select>
                            </FormField>
                        </div>

                        
                        {createForm.data.jenis === "masuk" && (
                            <label className="flex min-h-11 cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_uang_kas"
                                    name="is_uang_kas"
                                    checked={isUangKas}
                                    onChange={handleUangKasChange}
                                    className="checkbox checkbox-primary"
                                />
                                <span className="text-sm">Uang Kas</span>
                            </label>
                        )}

                        
                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Pilih Anggota" error={createForm.errors.user_id} required>
                                <select
                                    name="user_id"
                                    className="select select-bordered min-h-11 w-full"
                                    value={selectedAnggota}
                                    onChange={handleAnggotaChange}
                                    required
                                >
                                    <option value="">Pilih Anggota</option>
                                    {asisten?.map((anggota) => (
                                        <option
                                            key={anggota.id}
                                            value={anggota.id}
                                        >
                                            {anggota.name} -{" "}
                                            {anggota.profile.nomor_anggota}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        )}

                        
                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Nominal Kas Acuan (Otomatis)" error={createForm.errors.nominal_kas_id}>
                                <div className="w-full rounded-md border border-base-300 bg-base-200 px-3 py-2 text-sm text-base-content/80">
                                    {currentNominalKas
                                        ? `${formatCurrency(currentNominalKas.nominal)} • ${currentNominalKas.periode} (aktif)`
                                        : "Nominal kas aktif belum tersedia"}
                                </div>
                                <input
                                    type="hidden"
                                    name="nominal_kas_id"
                                    value={createForm.data.nominal_kas_id || ""}
                                />
                            </FormField>
                        )}

                        
                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Jenis Pembayaran" hint={'Pilih "Normal" jika pembayaran untuk periode selanjutnya, atau "Lebih" jika hanya bonus/tambahan'} error={createForm.errors.jenis_pembayaran_kas} required>
                                <select
                                    name="jenis_pembayaran_kas"
                                    className="select select-bordered min-h-11 w-full"
                                    value={createForm.data.jenis_pembayaran_kas}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "jenis_pembayaran_kas",
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">
                                        Pilih jenis pembayaran...
                                    </option>
                                    <option value="normal">
                                        Normal (untuk periode selanjutnya)
                                    </option>
                                    <option value="lebih">
                                        Lebih (bonus/tambahan)
                                    </option>
                                </select>
                            </FormField>
                        )}

                        
                        {createForm.data.jenis === "masuk" && isUangKas && (
                            <FormField label="Catatan Pembayaran (Opsional)" error={createForm.errors.catatan_pembayaran}>
                                <textarea
                                    name="catatan_pembayaran"
                                    className="textarea textarea-bordered w-full"
                                    value={createForm.data.catatan_pembayaran}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "catatan_pembayaran",
                                            e.target.value,
                                        )
                                    }
                                    rows="2"
                                    placeholder="Catatan tambahan untuk pembayaran ini..."
                                />
                            </FormField>
                        )}

                        <FormField label="Nominal" error={createForm.errors.nominal} required>
                            <input
                                type="number"
                                name="nominal"
                                className="input input-bordered min-h-11 w-full"
                                value={createForm.data.nominal}
                                onChange={(e) =>
                                    createForm.setData(
                                        "nominal",
                                        e.target.value,
                                    )
                                }
                                min="500"
                                step="500"
                                required
                            />
                        </FormField>

                        
                        {!isUangKas || createForm.data.jenis !== "masuk" ? (
                            <FormField label="Deskripsi" error={createForm.errors.deskripsi} required>
                                <textarea
                                    name="deskripsi"
                                    className="textarea textarea-bordered w-full"
                                    value={createForm.data.deskripsi}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "deskripsi",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    rows="2"
                                ></textarea>
                            </FormField>
                        ) : (
                            
                            <input
                                type="hidden"
                                name="deskripsi"
                                value={createForm.data.deskripsi}
                            />
                        )}

                        <FormField label="Bukti Transaksi (Opsional)" error={createForm.errors.bukti}>
                            <input
                                type="file"
                                name="bukti"
                                id="bukti"
                                accept="image/*"
                                onChange={(e) =>
                                    createForm.setData("bukti", e.target.files[0])
                                }
                                className="file-input file-input-bordered min-h-11 w-full"
                            />
                        </FormField>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                            <Button type="submit" loading={createForm.processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default RiwayatKeuangan;
