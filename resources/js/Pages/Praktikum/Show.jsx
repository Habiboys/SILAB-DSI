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
    const [reportWarningModal, setReportWarningModal] = useState({ open: false, warnings: [] });
    const [lecturerModal, setLecturerModal] = useState({ open: false, warnings: [], dosen_nama: "", dosen_nip: "", semester: "Genap", tahun_akademik: "2025 / 2026" });
    const [reportAction, setReportAction] = useState(null);

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
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const response = await fetch(route("praktikum.laporan.warnings", { praktikum: praktikum.id }), { headers: { Accept: "application/json" } });
                                    const data = await response.json();
                                    setReportWarningModal({ open: Boolean(data.warnings?.length), warnings: data.warnings || [] });
                                    setLecturerModal((current) => ({ ...current, open: true, warnings: data.warnings || [] }));
                                }}
                            >
                                <BookOpen className="h-4 w-4" /> Cetak laporan
                            </Button>
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
                {(reportWarningModal.open || lecturerModal.open) && <Modal show onClose={() => { setReportWarningModal({ open: false, warnings: [] }); setLecturerModal({ ...lecturerModal, open: false }); }} maxWidth="md"><form className="p-6" onSubmit={(event) => { event.preventDefault(); const url = route("praktikum.laporan.preview", { praktikum: praktikum.id }) + `?dosen_nama=${encodeURIComponent(lecturerModal.dosen_nama)}&dosen_nip=${encodeURIComponent(lecturerModal.dosen_nip)}&semester=${encodeURIComponent(lecturerModal.semester)}&tahun_akademik=${encodeURIComponent(lecturerModal.tahun_akademik)}`; window.open(url, "_blank", "noopener"); }}><h3 className="text-lg font-semibold">Data dosen penanggung jawab</h3><p className="mt-1 text-sm text-base-content/70">Isi data ini sebelum membuka preview laporan.</p><FormField label="Nama Dosen" required><input className="input min-h-11 w-full" value={lecturerModal.dosen_nama} onChange={(e) => setLecturerModal({ ...lecturerModal, dosen_nama: e.target.value })} required /></FormField><FormField label="Semester" required><select className="select min-h-11 w-full" value={lecturerModal.semester} onChange={(e) => setLecturerModal({ ...lecturerModal, semester: e.target.value })}><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select></FormField><FormField label="Tahun Akademik" required><input className="input min-h-11 w-full" value={lecturerModal.tahun_akademik} onChange={(e) => setLecturerModal({ ...lecturerModal, tahun_akademik: e.target.value })} required /></FormField><FormField label="NIP" required><input className="input min-h-11 w-full" value={lecturerModal.dosen_nip} onChange={(e) => setLecturerModal({ ...lecturerModal, dosen_nip: e.target.value })} required /></FormField>{reportWarningModal.warnings.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm">{reportWarningModal.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}<div className="mt-6 flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setLecturerModal({ ...lecturerModal, open: false })}>Batal</Button><Button type="submit">Buka preview</Button></div></form></Modal>}

                <div className="grid grid-cols-3 divide-x divide-base-300 border-y border-base-300 bg-base-100 py-3 text-center">
                    <div><strong className="block text-xl">{parentKelasList.length}</strong><span className="text-xs text-base-content/60">Kelas utama</span></div>
                    <div><strong className="block text-xl">{allKelas.filter((item) => item.parent_kelas_id).length}</strong><span className="text-xs text-base-content/60">Sub-kelas</span></div>
                    <div><strong className="block text-xl">{Object.values(pertemuanCountByKelas).reduce((sum, count) => sum + Number(count || 0), 0)}</strong><span className="text-xs text-base-content/60">Pertemuan</span></div>
                </div>

                <PageSection
                    title="Kelas Praktikum"
                    description="Pilih ruang kerja kelas untuk mengelola peserta, pertemuan, modul, dan tugas."
                    actions={<Button onClick={() => setIsAddKelasModalOpen(true)}><Plus className="h-4 w-4" /> Tambah Kelas</Button>}
                    bodyClassName="p-0 sm:p-0"
                >
                    <div className="divide-y divide-base-300">
                        {parentKelasList.map((kelas) => {
                            const subKelas = getSubKelasList(kelas.id);
                            return (
                                <section key={kelas.id} className="p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="truncate text-lg font-semibold">{kelas.nama_kelas}</h3>
                                                {kelas.status !== "aktif" && <StatusBadge status={kelas.status} tone={kelas.status} label={kelas.status} />}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-base-content/65">
                                                {!!kelas.hari && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{kelas.hari}, {kelas.jam_mulai}–{kelas.jam_selesai}</span>}
                                                {!!kelas.ruangan && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{kelas.ruangan}</span>}
                                                <span>{getPraktikanCount(kelas.id)} peserta · {getPertemuanCount(kelas.id)} pertemuan · {getTugasCount(kelas.id)} tugas</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Button variant="ghost" size="sm" href={route("praktikum.praktikan.index", { praktikum: praktikum.id, kelas_id: kelas.id, context_kelas_id: kelas.id })}><Users className="h-4 w-4" /> Peserta</Button>
                                            <Button variant="ghost" size="sm" href={route("praktikum.pertemuan.index", { praktikum: praktikum.id, kelas_id: kelas.id, context_kelas_id: kelas.id })}><CalendarDays className="h-4 w-4" /> Pertemuan</Button>
                                            <Button variant="ghost" size="sm" href={route("praktikum.modul.index", { praktikum: praktikum.id, kelas_id: kelas.id, context_kelas_id: kelas.id })}><BookOpen className="h-4 w-4" /> Modul</Button>
                                            <Button variant="ghost" size="sm" href={route("praktikum.tugas.index", { praktikum: praktikum.id, kelas_id: kelas.id, context_kelas_id: kelas.id })}><ClipboardList className="h-4 w-4" /> Tugas</Button>
                                            <ActionDropdown actions={featureActions(kelas).slice(5)} onAction={(action) => action.action?.()} />
                                        </div>
                                    </div>

                                    {subKelas.length > 0 && (
                                        <div className="mt-4 border-l-2 border-base-300 pl-3 sm:pl-5">
                                            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-base-content/60"><GitBranch className="h-3.5 w-3.5" /> Sub-kelas</p>
                                            <div className="divide-y divide-base-300">
                                                {subKelas.map((sub) => (
                                                    <div key={sub.id} className="flex flex-col gap-3 py-3 first:pt-1 lg:flex-row lg:items-center lg:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="font-medium">{sub.nama_kelas}</p>
                                                            <p className="mt-1 text-xs text-base-content/60">{getPraktikanCount(sub.id)} peserta · {getPertemuanCount(sub.id)} pertemuan · {getTugasCount(sub.id)} tugas{sub.hari ? ` · ${sub.hari}, ${sub.jam_mulai}–${sub.jam_selesai}` : ""}{sub.ruangan ? ` · ${sub.ruangan}` : ""}</p>
                                                        </div>
                                                        <ActionDropdown actions={featureActions(sub, true)} onAction={(action) => action.action?.()} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                        {!parentKelasList.length && <p className="py-10 text-center text-sm text-base-content/70">Belum ada kelas. Tambahkan kelas untuk memulai.</p>}
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
                            <input className="input min-h-11 w-full" placeholder="Nama sub-kelas" value={subKelasForm.nama_kelas} onChange={(e) => setSubKelasForm({ ...subKelasForm, nama_kelas: e.target.value })} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" required>
                                <select className="select min-h-11 w-full" value={subKelasForm.hari} onChange={(e) => setSubKelasForm({ ...subKelasForm, hari: e.target.value })} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" required>
                                <input className="input min-h-11 w-full" placeholder="Contoh: Lab 1" value={subKelasForm.ruangan} onChange={(e) => setSubKelasForm({ ...subKelasForm, ruangan: e.target.value })} required />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Jam Mulai" required>
                                <input type="time" className="input min-h-11 w-full" value={subKelasForm.jam_mulai} onChange={(e) => setSubKelasForm({ ...subKelasForm, jam_mulai: e.target.value })} required />
                            </FormField>
                            <FormField label="Jam Selesai" required>
                                <input type="time" className="input min-h-11 w-full" value={subKelasForm.jam_selesai} onChange={(e) => setSubKelasForm({ ...subKelasForm, jam_selesai: e.target.value })} required />
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
                            <input className="input min-h-11 w-full" placeholder="Nama kelas" value={editKelasForm.data.nama_kelas} onChange={(e) => editKelasForm.setData("nama_kelas", e.target.value)} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" required>
                                <select className="select min-h-11 w-full" value={editKelasForm.data.hari} onChange={(e) => editKelasForm.setData("hari", e.target.value)} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" required>
                                <input className="input min-h-11 w-full" value={editKelasForm.data.ruangan} onChange={(e) => editKelasForm.setData("ruangan", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Mulai" required>
                                <input type="time" className="input min-h-11 w-full" value={editKelasForm.data.jam_mulai} onChange={(e) => editKelasForm.setData("jam_mulai", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Selesai" required>
                                <input type="time" className="input min-h-11 w-full" value={editKelasForm.data.jam_selesai} onChange={(e) => editKelasForm.setData("jam_selesai", e.target.value)} required />
                            </FormField>
                        </div>
                        <FormField label="Status">
                            <select className="select min-h-11 w-full" value={editKelasForm.data.status} onChange={(e) => editKelasForm.setData("status", e.target.value)}>
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
                            <select className="select min-h-11 w-full" value={editPraktikumForm.data.mata_kuliah_id} onChange={(e) => editPraktikumForm.setData("mata_kuliah_id", e.target.value)} required>
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
                            <input className="input min-h-11 w-full" placeholder="Contoh: A" value={addKelasForm.data.nama_kelas} onChange={(e) => addKelasForm.setData("nama_kelas", e.target.value)} required />
                        </FormField>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField label="Hari" error={addKelasForm.errors.hari} required>
                                <select className="select min-h-11 w-full" value={addKelasForm.data.hari} onChange={(e) => addKelasForm.setData("hari", e.target.value)} required>
                                    <option value="">Pilih hari</option>
                                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ruangan" error={addKelasForm.errors.ruangan} required>
                                <input className="input min-h-11 w-full" placeholder="Contoh: Lab 1" value={addKelasForm.data.ruangan} onChange={(e) => addKelasForm.setData("ruangan", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Mulai" error={addKelasForm.errors.jam_mulai} required>
                                <input type="time" className="input min-h-11 w-full" value={addKelasForm.data.jam_mulai} onChange={(e) => addKelasForm.setData("jam_mulai", e.target.value)} required />
                            </FormField>
                            <FormField label="Jam Selesai" error={addKelasForm.errors.jam_selesai} required>
                                <input type="time" className="input min-h-11 w-full" value={addKelasForm.data.jam_selesai} onChange={(e) => addKelasForm.setData("jam_selesai", e.target.value)} required />
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
