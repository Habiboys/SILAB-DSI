import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Award,
    BookOpen,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Clock,
    MapPin,
    Edit,
    Plus,
    Scissors,
    Trash2,
    UserCheck,
    Users,
    GitBranch,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ActionDropdown from "../../Components/ActionDropdown";
import Button from "../../Components/Button";
import ConfirmModal from "../../Components/ConfirmModal";
import FormField from "../../Components/FormField";
import Modal from "../../Components/Modal";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import { IconAction } from "../../Components/RowActions";
import StatusBadge from "../../Components/StatusBadge";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function PraktikumShowPage({
    praktikum,
    pertemuanList = [],
    modulList = [],
    tugasList = [],
    mataKuliah = [],
    praktikanCountByKelas = {},
    pertemuanCountByKelas = {},
    tugasCountByKelas = {},
}) {
    const allKelas = praktikum.kelas || [];
    const parentKelasList = allKelas.filter((kelas) => !kelas.parent_kelas_id);
    const getSubKelasList = (parentId) =>
        allKelas.filter((kelas) => kelas.parent_kelas_id === parentId);

    const getPraktikanCount = (id) => praktikanCountByKelas[id] || 0;
    const getPertemuanCount = (id) => pertemuanCountByKelas[id] || 0;
    const getTugasCount = (id) => tugasCountByKelas[id] || 0;

    const [addSubKelasModal, setAddSubKelasModal] = useState({
        open: false,
        parentKelas: null,
    });
    const [editKelasModal, setEditKelasModal] = useState({
        open: false,
        kelas: null,
    });
    const [deleteSubKelasModal, setDeleteSubKelasModal] = useState({
        open: false,
        subKelas: null,
    });
    const [deleteKelasModal, setDeleteKelasModal] = useState({
        open: false,
        kelas: null,
    });
    const [deletePraktikumModalOpen, setDeletePraktikumModalOpen] =
        useState(false);
    const [isEditPraktikumModalOpen, setIsEditPraktikumModalOpen] =
        useState(false);
    const [isAddKelasModalOpen, setIsAddKelasModalOpen] = useState(false);

    const editPraktikumForm = useForm({
        mata_kuliah_id: "",
    });
    const addKelasForm = useForm({
        nama_kelas: "",
        hari: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
    });

    const [subKelasForm, setSubKelasForm] = useState({
        nama_kelas: "",
        hari: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
    });

    const editKelasForm = useForm({
        id: "",
        nama_kelas: "",
        hari: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
        status: "aktif",
    });

    const openSubKelasModal = (parentKelas) => {
        setSubKelasForm({
            nama_kelas: "",
            hari: "",
            jam_mulai: "",
            jam_selesai: "",
            ruangan: "",
        });
        setAddSubKelasModal({ open: true, parentKelas });
    };

    const submitSubKelas = (event) => {
        event.preventDefault();
        router.post(
            route("praktikum.kelas.sub-kelas.store", {
                praktikum: praktikum.id,
                kelas: addSubKelasModal.parentKelas.id,
            }),
            subKelasForm,
            {
                onSuccess: () => {
                    toast.success("Sub-kelas berhasil ditambahkan");
                    setAddSubKelasModal({ open: false, parentKelas: null });
                },
            },
        );
    };

    const openEditKelasModal = (kelas) => {
        editKelasForm.setData({
            id: kelas.id,
            nama_kelas: kelas.nama_kelas || "",
            hari: kelas.hari || "",
            jam_mulai: kelas.jam_mulai || "",
            jam_selesai: kelas.jam_selesai || "",
            ruangan: kelas.ruangan || "",
            status: kelas.status || "aktif",
        });
        setEditKelasModal({ open: true, kelas });
    };

    const submitEditKelas = (event) => {
        event.preventDefault();
        editKelasForm.put(
            route("praktikum.kelas.update", {
                praktikum: praktikum.id,
                kelas: editKelasForm.data.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Kelas berhasil diperbarui");
                    setEditKelasModal({ open: false, kelas: null });
                },
            },
        );
    };

    const deleteSubKelas = () => {
        router.delete(
            route("praktikum.kelas.sub-kelas.destroy", {
                subKelas: deleteSubKelasModal.subKelas.id,
            }),
            {
                onSuccess: () => {
                    toast.success("Sub-kelas berhasil dihapus");
                    setDeleteSubKelasModal({ open: false, subKelas: null });
                },
            },
        );
    };

    const deleteKelas = () => {
        if (!deleteKelasModal.kelas) return;
        router.delete(
            route("praktikum.kelas.destroy", {
                praktikum: praktikum.id,
                kelas: deleteKelasModal.kelas.id,
            }),
            {
                onSuccess: () => {
                    toast.success("Kelas berhasil dihapus");
                    setDeleteKelasModal({ open: false, kelas: null });
                },
            },
        );
    };

    const handleDeletePraktikum = () => {
        router.delete(route("praktikum.destroy", { praktikum: praktikum.id }), {
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menghapus praktikum");
            },
        });
    };

    const openEditPraktikumModal = () => {
        const current = mataKuliah.find(
            (mk) => mk.nama === praktikum.mata_kuliah,
        );
        editPraktikumForm.setData("mata_kuliah_id", current?.id || "");
        setIsEditPraktikumModalOpen(true);
    };

    const submitEditPraktikum = (event) => {
        event.preventDefault();
        editPraktikumForm.put(
            route("praktikum.update-info", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Info praktikum berhasil diperbarui");
                    setIsEditPraktikumModalOpen(false);
                },
            },
        );
    };

    const submitAddKelas = (event) => {
        event.preventDefault();
        addKelasForm.post(
            route("praktikum.kelas.add", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Kelas berhasil ditambahkan");
                    addKelasForm.reset();
                    setIsAddKelasModalOpen(false);
                },
            },
        );
    };

    const praktikumActions = [
        {
            type: "view",
            label: "Kelola Aslab",
            icon: <UserCheck className="w-4 h-4" />,
            action: () =>
                router.get(
                    route("praktikum.aslab.index", {
                        praktikum: praktikum.id,
                    }),
                ),
        },
        {
            type: "view",
            label: "Kelola Sertifikat",
            icon: <Award className="w-4 h-4" />,
            action: () =>
                router.get(
                    route("praktikum.sertifikat.index", {
                        praktikum: praktikum.id,
                    }),
                ),
        },
    ];

    const featureActions = (kelas, isSub = false) => {
        const actions = [
            {
                type: "view",
                label: "Pertemuan",
                icon: <CalendarDays className="w-4 h-4" />,
                action: () =>
                    router.get(
                        route("praktikum.pertemuan.index", {
                            praktikum: praktikum.id,
                            kelas_id: kelas.id,
                            context_kelas_id: kelas.id,
                        }),
                    ),
            },
            {
                type: "view",
                label: "Modul",
                icon: <BookOpen className="w-4 h-4" />,
                action: () =>
                    router.get(
                        route("praktikum.modul.index", {
                            praktikum: praktikum.id,
                            kelas_id: kelas.id,
                            context_kelas_id: kelas.id,
                        }),
                    ),
            },
            {
                type: "view",
                label: "Tugas",
                icon: <ClipboardList className="w-4 h-4" />,
                action: () =>
                    router.get(
                        route("praktikum.tugas.index", {
                            praktikum: praktikum.id,
                            kelas_id: kelas.id,
                            context_kelas_id: kelas.id,
                        }),
                    ),
            },
            {
                type: "view",
                label: "Peserta",
                icon: <Users className="w-4 h-4" />,
                action: () =>
                    router.get(
                        route("praktikum.praktikan.index", {
                            praktikum: praktikum.id,
                            kelas_id: kelas.id,
                            context_kelas_id: kelas.id,
                        }),
                    ),
            },
            { type: "divider" },
        ];

        if (!isSub) {
            actions.push({
                type: "edit",
                label: "Pecah Kelas",
                icon: <Scissors className="w-4 h-4" />,
                action: () => openSubKelasModal(kelas),
            });
        }

        actions.push(
            {
                type: "edit",
                label: `Edit ${isSub ? 'Sub-kelas' : 'Kelas'}`,
                icon: <Edit className="w-4 h-4" />,
                action: () => openEditKelasModal(kelas),
            },
            {
                type: "delete",
                label: `Hapus ${isSub ? 'Sub-kelas' : 'Kelas'}`,
                icon: <Trash2 className="w-4 h-4" />,
                action: () => isSub ? setDeleteSubKelasModal({ open: true, subKelas: kelas }) : setDeleteKelasModal({ open: true, kelas }),
            }
        );

        return actions;
    };

    return (
        <DashboardLayout>
            <Head title={praktikum.mata_kuliah} />

            <div className="space-y-4">
                <PageHeader
                    title={praktikum.mata_kuliah}
                    description={`${praktikum.kepengurusan_lab?.laboratorium?.nama ?? ""} • ${praktikum.kepengurusan_lab?.tahun_kepengurusan?.tahun ?? ""}`}
                    actions={
                        <>
                            <ActionDropdown
                                actions={praktikumActions}
                                onAction={(action) => action.action?.()}
                            />
                            <IconAction label="Edit praktikum" icon={Edit} tone="edit" onClick={openEditPraktikumModal} />
                            <IconAction label="Hapus praktikum" icon={Trash2} tone="delete" onClick={() => setDeletePraktikumModalOpen(true)} />
                        </>
                    }
                />
                <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                    <Link href={route("praktikum.index", {}, false) + (praktikum.kepengurusan_lab_id ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}` : "")} className="link link-hover">Praktikum</Link>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    <span>{praktikum.mata_kuliah}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status="info" tone="info" label={`${parentKelasList.length} kelas`} />
                    <StatusBadge status="success" tone="success" label={`${allKelas.filter((item) => item.parent_kelas_id).length} sub-kelas`} />
                    <StatusBadge status="warning" tone="warning" label={`${Object.values(pertemuanCountByKelas).reduce((sum, count) => sum + Number(count || 0), 0)} pertemuan`} />
                </div>

                <PageSection
                    title="Daftar Kelas"
                    description="Masuk ke fitur dari masing-masing kelas."
                    actions={<Button variant="ghost" onClick={() => setIsAddKelasModalOpen(true)}><Plus className="h-4 w-4" /> Tambah Kelas</Button>}
                    bodyClassName="p-4 sm:p-6"
                >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {parentKelasList.map((kelas) => {
                            const subKelas = getSubKelasList(kelas.id);
                            return (
                                <div key={kelas.id} className="flex flex-col rounded-xl border border-base-300 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md">
                                    <div className="flex-1 p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-lg font-bold">{kelas.nama_kelas}</h3>
                                                    <StatusBadge status={kelas.status} tone={kelas.status} label={kelas.status} />
                                                </div>
                                                {!!kelas.hari && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-base-content/70">
                                                        <span className="inline-flex items-center gap-1.5 font-medium"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{kelas.hari}, {kelas.jam_mulai} sampai {kelas.jam_selesai}</span>
                                                        <span className="inline-flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{kelas.ruangan}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="-mr-2 -mt-2 shrink-0">
                                                <ActionDropdown actions={featureActions(kelas)} onAction={(action) => action.action?.()} />
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-base-300 pt-4">
                                            <div className="rounded-lg bg-base-200/60 p-2 text-center">
                                                <Users className="mx-auto mb-1 h-4 w-4 text-info" aria-hidden="true" />
                                                <div className="text-lg font-semibold leading-none">{getPraktikanCount(kelas.id)}</div>
                                                <div className="mt-1 text-[10px] uppercase tracking-wide text-base-content/60">Peserta</div>
                                            </div>
                                            <div className="rounded-lg bg-base-200/60 p-2 text-center">
                                                <CalendarDays className="mx-auto mb-1 h-4 w-4 text-success" aria-hidden="true" />
                                                <div className="text-lg font-semibold leading-none">{getPertemuanCount(kelas.id)}</div>
                                                <div className="mt-1 text-[10px] uppercase tracking-wide text-base-content/60">Pertemuan</div>
                                            </div>
                                            <div className="rounded-lg bg-base-200/60 p-2 text-center">
                                                <ClipboardList className="mx-auto mb-1 h-4 w-4 text-warning" aria-hidden="true" />
                                                <div className="text-lg font-semibold leading-none">{getTugasCount(kelas.id)}</div>
                                                <div className="mt-1 text-[10px] uppercase tracking-wide text-base-content/60">Tugas</div>
                                            </div>
                                        </div>
                                    </div>

                                    {subKelas.length > 0 && (
                                        <div className="rounded-b-xl border-t border-base-300 bg-base-200/50 px-5 py-4">
                                            <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-base-content/60">
                                                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                                                {subKelas.length} Sub-Kelas
                                            </h4>
                                            <div className="space-y-2.5">
                                                {subKelas.map((sub) => (
                                                    <div key={sub.id} className="group flex items-center justify-between rounded-lg border border-base-300/60 bg-base-100 px-3.5 py-3 shadow-sm transition-colors hover:border-primary/40">
                                                        <div className="min-w-0 pr-3">
                                                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                                                <span className="truncate text-sm font-semibold">{sub.nama_kelas}</span>
                                                            </div>
                                                            <div className="text-[11px] font-medium text-base-content/60">
                                                                {getPraktikanCount(sub.id)} peserta • {getPertemuanCount(sub.id)} pertemuan • {getTugasCount(sub.id)} tugas
                                                            </div>
                                                            {!!sub.hari && (
                                                                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-base-content/60">
                                                                    <span className="inline-flex items-center gap-1 rounded bg-base-200 px-1.5 py-0.5 font-medium"><Clock className="h-3 w-3" aria-hidden="true" />{sub.hari}, {sub.jam_mulai} sampai {sub.jam_selesai}</span>
                                                                    <span className="inline-flex items-center gap-1 rounded bg-base-200 px-1.5 py-0.5 font-medium"><MapPin className="h-3 w-3" aria-hidden="true" />{sub.ruangan}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                                            <ActionDropdown actions={featureActions(sub, true)} onAction={(action) => action.action?.()} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {!parentKelasList.length && <p className="col-span-full py-8 text-center text-base-content/70">Belum ada kelas. Tambahkan kelas untuk memulai.</p>}
                    </div>
                </PageSection>
            </div>

            <ConfirmModal
                show={deletePraktikumModalOpen}
                onClose={() => setDeletePraktikumModalOpen(false)}
                onConfirm={handleDeletePraktikum}
                title="Hapus Praktikum"
                message={`Yakin ingin menghapus praktikum ${praktikum.mata_kuliah}?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <ConfirmModal
                show={deleteKelasModal.open}
                onClose={() =>
                    setDeleteKelasModal({ open: false, kelas: null })
                }
                onConfirm={deleteKelas}
                title="Hapus Kelas"
                message={
                    deleteKelasModal.kelas
                        ? `Yakin ingin menghapus kelas ${deleteKelasModal.kelas.nama_kelas}?`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <ConfirmModal
                show={deleteSubKelasModal.open}
                onClose={() =>
                    setDeleteSubKelasModal({ open: false, subKelas: null })
                }
                onConfirm={deleteSubKelas}
                title="Hapus Sub-Kelas"
                message={
                    deleteSubKelasModal.subKelas
                        ? `Yakin ingin menghapus ${deleteSubKelasModal.subKelas.nama_kelas}?`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <Modal
                show={addSubKelasModal.open}
                onClose={() =>
                    setAddSubKelasModal({ open: false, parentKelas: null })
                }
                maxWidth="md"
            >
                <form onSubmit={submitSubKelas} className="p-5">
                    <h2 className="text-lg font-semibold">Tambah Sub-Kelas</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="Nama Sub-Kelas" required>
                            <input className="input input-bordered min-h-11 w-full" placeholder="Nama sub-kelas" value={subKelasForm.nama_kelas} onChange={(e) => setSubKelasForm({ ...subKelasForm, nama_kelas: e.target.value })} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" required>
                                <select className="select select-bordered min-h-11 w-full" value={subKelasForm.hari} onChange={(e) => setSubKelasForm({ ...subKelasForm, hari: e.target.value })} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" required>
                                <input className="input input-bordered min-h-11 w-full" placeholder="Contoh: Lab 1" value={subKelasForm.ruangan} onChange={(e) => setSubKelasForm({ ...subKelasForm, ruangan: e.target.value })} required />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Jam Mulai" required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={subKelasForm.jam_mulai} onChange={(e) => setSubKelasForm({ ...subKelasForm, jam_mulai: e.target.value })} required />
                            </FormField>
                            <FormField label="Jam Selesai" required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={subKelasForm.jam_selesai} onChange={(e) => setSubKelasForm({ ...subKelasForm, jam_selesai: e.target.value })} required />
                            </FormField>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setAddSubKelasModal({ open: false, parentKelas: null })}>Batal</Button>
                        <Button type="submit">Simpan</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={editKelasModal.open}
                onClose={() => setEditKelasModal({ open: false, kelas: null })}
                maxWidth="md"
            >
                <form onSubmit={submitEditKelas} className="p-5">
                    <h2 className="text-lg font-semibold">Edit Kelas dan Jadwal</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="Nama Kelas" required>
                            <input className="input input-bordered min-h-11 w-full" placeholder="Nama kelas" value={editKelasForm.data.nama_kelas} onChange={(e) => editKelasForm.setData("nama_kelas", e.target.value)} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" required>
                                <select className="select select-bordered min-h-11 w-full" value={editKelasForm.data.hari} onChange={(e) => editKelasForm.setData("hari", e.target.value)} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" required>
                                <input className="input input-bordered min-h-11 w-full" value={editKelasForm.data.ruangan} onChange={(e) => editKelasForm.setData("ruangan", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Mulai" required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={editKelasForm.data.jam_mulai} onChange={(e) => editKelasForm.setData("jam_mulai", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Selesai" required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={editKelasForm.data.jam_selesai} onChange={(e) => editKelasForm.setData("jam_selesai", e.target.value)} required />
                            </FormField>
                        </div>
                        <FormField label="Status">
                            <select className="select select-bordered min-h-11 w-full" value={editKelasForm.data.status} onChange={(e) => editKelasForm.setData("status", e.target.value)}>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>
                        </FormField>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setEditKelasModal({ open: false, kelas: null })}>Batal</Button>
                        <Button type="submit" loading={editKelasForm.processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={isEditPraktikumModalOpen}
                onClose={() => setIsEditPraktikumModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={submitEditPraktikum} className="p-5">
                    <h2 className="text-lg font-semibold">Edit Info Praktikum</h2>
                    <div className="mt-4">
                        <FormField label="Mata Kuliah" error={editPraktikumForm.errors.mata_kuliah_id} required>
                            <select className="select select-bordered min-h-11 w-full" value={editPraktikumForm.data.mata_kuliah_id} onChange={(e) => editPraktikumForm.setData("mata_kuliah_id", e.target.value)} required>
                                <option value="">Pilih mata kuliah</option>
                                {mataKuliah.map((mk) => <option key={mk.id} value={mk.id}>{mk.kode_mata_kuliah} - {mk.nama}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsEditPraktikumModalOpen(false)}>Batal</Button>
                        <Button type="submit" loading={editPraktikumForm.processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                show={isAddKelasModalOpen}
                onClose={() => setIsAddKelasModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={submitAddKelas} className="p-5">
                    <h2 className="text-lg font-semibold">Tambah Kelas</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="Nama Kelas" error={addKelasForm.errors.nama_kelas} required>
                            <input className="input input-bordered min-h-11 w-full" placeholder="Contoh: A" value={addKelasForm.data.nama_kelas} onChange={(e) => addKelasForm.setData("nama_kelas", e.target.value)} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" error={addKelasForm.errors.hari} required>
                                <select className="select select-bordered min-h-11 w-full" value={addKelasForm.data.hari} onChange={(e) => addKelasForm.setData("hari", e.target.value)} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" error={addKelasForm.errors.ruangan} required>
                                <input className="input input-bordered min-h-11 w-full" placeholder="Contoh: Lab 1" value={addKelasForm.data.ruangan} onChange={(e) => addKelasForm.setData("ruangan", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Mulai" error={addKelasForm.errors.jam_mulai} required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={addKelasForm.data.jam_mulai} onChange={(e) => addKelasForm.setData("jam_mulai", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Selesai" error={addKelasForm.errors.jam_selesai} required>
                                <input type="time" className="input input-bordered min-h-11 w-full" value={addKelasForm.data.jam_selesai} onChange={(e) => addKelasForm.setData("jam_selesai", e.target.value)} required />
                            </FormField>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setIsAddKelasModalOpen(false)}>Batal</Button>
                        <Button type="submit" loading={addKelasForm.processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
