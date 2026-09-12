import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import RowActions from "@/Components/RowActions";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { FileText, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Struktur = ({ struktur, kepengurusanlab, filters, flash }) => {
    const { selectedLab } = useLab();
    const { can } = usePermission();
    const canAccess = can("struktur.manage");

    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.perPage || 10);
    const [modal, setModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const createForm = useForm({
        struktur: "",
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        proker: null,
        tipe_jabatan: "asisten",
        jabatan_tunggal: true,
        jabatan_terkait: "",
    });

    const editForm = useForm({
        struktur: "",
        proker: null,
        tipe_jabatan: "",
        kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
        jabatan_tunggal: true,
        jabatan_terkait: "",
    });

    const deleteForm = useForm({});

    const navigate = (extra = {}) =>
        router.get(
            route(route().current()),
            { ...filters, search, perPage, page: 1, ...extra },
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const handleSearch = debounce((query) => navigate({ search: query }), 300);

    const onSearchChange = (event) => {
        setSearch(event.target.value);
        handleSearch(event.target.value);
    };

    const handlePerPageChange = (event) => {
        setPerPage(event.target.value);
        navigate({ perPage: event.target.value });
    };

    const openCreateModal = () => {
        if (!kepengurusanlab) {
            toast.error("Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu");
            return;
        }
        createForm.reset();
        createForm.setData("kepengurusan_lab_id", kepengurusanlab.id);
        createForm.clearErrors();
        setModal("create");
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            struktur: item.struktur,
            proker: null,
            tipe_jabatan: item.tipe_jabatan,
            kepengurusan_lab_id: kepengurusanlab.id,
            jabatan_tunggal: item.jabatan_tunggal ?? true,
            jabatan_terkait: item.jabatan_terkait || "",
            _method: "PUT",
        });
        editForm.clearErrors();
        setModal("edit");
    };

    const closeModal = () => {
        setModal(null);
        setSelectedItem(null);
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("struktur.store"), {
            forceFormData: true,
            onSuccess: () => {
                closeModal();
                createForm.reset();
                toast.success("Struktur berhasil ditambahkan");
            },
            onError: (errors) => toast.error(errors.message || Object.values(errors).find(Boolean) || "Gagal menambahkan data"),
        });
    };

    const handleEdit = (event) => {
        event.preventDefault();
        editForm.post(route("struktur.update", selectedItem.id), {
            forceFormData: true,
            onSuccess: () => {
                closeModal();
                editForm.reset();
                toast.success("Struktur berhasil diperbarui");
            },
            onError: (errors) => toast.error(errors.struktur || Object.values(errors).find(Boolean) || "Gagal memperbarui data"),
        });
    };

    const handleDelete = () => {
        deleteForm.delete(route("struktur.destroy", selectedItem.id), {
            onSuccess: () => {
                closeModal();
                toast.success("Struktur berhasil dihapus");
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus data"),
        });
    };

    useEffect(() => {
        if (selectedLab) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("lab_id") !== String(selectedLab.id)) {
                router.visit("/struktur", {
                    data: { lab_id: selectedLab.id },
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }
    }, [selectedLab]);

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const columns = [
        { header: "No", searchable: false, headerClassName: "w-16", render: (_, index) => index + 1 },
        { key: "struktur", header: "Jabatan", cellClassName: "font-medium" },
        {
            header: "Program kerja",
            searchable: false,
            render: (item) =>
                item.proker_path ? (
                    <a
                        href={item.proker_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary inline-flex items-center gap-1"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Lihat program kerja
                    </a>
                ) : (
                    <span className="text-base-content/60">Tidak ada program kerja</span>
                ),
        },
        ...(canAccess
            ? [
                  {
                      header: "Aksi",
                      sortable: false,
                      searchable: false,
                      headerClassName: "text-right",
                      render: (item) => (
                          <RowActions
                              onEdit={() => openEditModal(item)}
                              onDelete={() => {
                                  setSelectedItem(item);
                                  setModal("delete");
                              }}
                          />
                      ),
                  },
              ]
            : []),
    ];

    return (
        <DashboardLayout>
            <Head title="Struktur Organisasi" />
            <PageHeader
                title="Struktur Organisasi"
                description="Daftar jabatan dan program kerja laboratorium."
                actions={
                    canAccess && (
                        <Button onClick={openCreateModal} disabled={!kepengurusanlab}>
                            <Plus className="h-4 w-4" />
                            Tambah struktur
                        </Button>
                    )
                }
            />
            <PageSection>
                <ServerDataTable
                    paginator={struktur}
                    columns={columns}
                    search={search}
                    onSearchChange={onSearchChange}
                    searchPlaceholder="Cari jabatan..."
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    emptyMessage="Belum ada data struktur."
                />
            </PageSection>

            <Modal show={modal === "create"} onClose={closeModal} maxWidth="md">
                <ModalHeader title="Tambah struktur" onClose={closeModal} />
                <form onSubmit={handleCreate} className="space-y-4 p-4 sm:p-5">
                    <StrukturFields form={createForm} />
                    <ModalActions onCancel={closeModal} processing={createForm.processing} />
                </form>
            </Modal>

            <Modal show={modal === "edit" && !!selectedItem} onClose={closeModal} maxWidth="md">
                <ModalHeader title="Edit struktur" onClose={closeModal} />
                <form onSubmit={handleEdit} className="space-y-4 p-4 sm:p-5">
                    <StrukturFields form={editForm} currentFile={selectedItem?.proker_path} />
                    <ModalActions onCancel={closeModal} processing={editForm.processing} label="Simpan perubahan" />
                </form>
            </Modal>

            <ConfirmModal
                show={modal === "delete" && !!selectedItem}
                onClose={closeModal}
                onConfirm={handleDelete}
                title="Hapus struktur"
                message={`Apakah Anda yakin ingin menghapus struktur "${selectedItem?.struktur}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

function ModalHeader({ title, onClose }) {
    return (
        <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup">
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function ModalActions({ onCancel, processing, label = "Simpan" }) {
    return (
        <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onCancel}>Batal</Button>
            <Button type="submit" loading={processing}>{label}</Button>
        </div>
    );
}

function StrukturFields({ form, currentFile }) {
    return (
        <>
            <FormField label="Nama jabatan" error={form.errors.struktur} required>
                <input className="input input-bordered min-h-11 w-full" value={form.data.struktur} onChange={(e) => form.setData("struktur", e.target.value)} required />
            </FormField>
            <FormField label="Tipe jabatan" error={form.errors.tipe_jabatan} required>
                <select
                    className="select select-bordered min-h-11 w-full"
                    value={form.data.tipe_jabatan}
                    onChange={(e) => {
                        form.setData("tipe_jabatan", e.target.value);
                        if (e.target.value !== "dosen") form.setData("jabatan_terkait", "");
                    }}
                    required
                >
                    <option value="">Pilih tipe jabatan</option>
                    <option value="dosen">Dosen</option>
                    <option value="asisten">Asisten</option>
                </select>
            </FormField>
            {form.data.tipe_jabatan === "dosen" && (
                <FormField label="Jabatan terkait" error={form.errors.jabatan_terkait} required>
                    <select className="select select-bordered min-h-11 w-full" value={form.data.jabatan_terkait} onChange={(e) => form.setData("jabatan_terkait", e.target.value)} required>
                        <option value="">Pilih jabatan</option>
                        <option value="kalab">Kepala laboratorium</option>
                        <option value="dosen">Anggota</option>
                    </select>
                </FormField>
            )}
            <FormField label="Program kerja (PDF)" error={form.errors.proker} hint="Kosongkan jika tidak diubah.">
                <input type="file" accept=".pdf" className="file-input file-input-bordered min-h-11 w-full" onChange={(e) => form.setData("proker", e.target.files[0])} />
            </FormField>
            {currentFile && (
                <a href={currentFile} target="_blank" rel="noopener noreferrer" className="link link-primary inline-flex items-center gap-1 text-sm">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Lihat program kerja saat ini
                </a>
            )}
            <FormField label="Jabatan tunggal" error={form.errors.jabatan_tunggal} required>
                <select className="select select-bordered min-h-11 w-full" value={form.data.jabatan_tunggal ? "true" : "false"} onChange={(e) => form.setData("jabatan_tunggal", e.target.value === "true")} required>
                    <option value="true">Hanya satu orang</option>
                    <option value="false">Bisa diisi banyak orang</option>
                </select>
            </FormField>
        </>
    );
}

export default Struktur;
