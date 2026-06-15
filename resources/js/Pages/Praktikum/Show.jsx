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
import ConfirmModal from "../../Components/ConfirmModal";
import Modal from "../../Components/Modal";
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
            onError: () => {
                toast.error("Gagal menghapus praktikum");
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
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Link
                                    href={
                                        route("praktikum.index", {}, false) +
                                        (praktikum.kepengurusan_lab_id
                                            ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}`
                                            : "")
                                    }
                                    className="hover:text-gray-700"
                                >
                                    Praktikum
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <span>{praktikum.mata_kuliah}</span>
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {praktikum.mata_kuliah}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {praktikum.kepengurusan_lab?.laboratorium?.nama}{" "}
                                •{" "}
                                {
                                    praktikum.kepengurusan_lab
                                        ?.tahun_kepengurusan?.tahun
                                }
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">
                                    {parentKelasList.length} kelas
                                </span>
                                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
                                    {
                                        allKelas.filter(
                                            (k) => k.parent_kelas_id,
                                        ).length
                                    }{" "}
                                    sub-kelas
                                </span>
                                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-medium">
                                    {Object.values(
                                        pertemuanCountByKelas,
                                    ).reduce(
                                        (sum, n) => sum + Number(n || 0),
                                        0,
                                    )}{" "}
                                    pertemuan
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ActionDropdown
                                actions={praktikumActions}
                                onAction={(action) => action.action?.()}
                            />
                            <button
                                type="button"
                                onClick={openEditPraktikumModal}
                                title="Edit praktikum"
                                aria-label="Edit praktikum"
                                className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors focus:outline-none"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setDeletePraktikumModalOpen(true)
                                }
                                title="Hapus praktikum"
                                aria-label="Hapus praktikum"
                                className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors focus:outline-none"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Daftar Kelas
                            </h2>
                            <p className="text-sm text-gray-500">
                                Masuk ke fitur dari masing-masing kelas.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddKelasModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Kelas
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-gray-50/50">
                        {parentKelasList.map((kelas) => {
                            const subKelas = getSubKelasList(kelas.id);
                            return (
                                <div key={kelas.id} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all duration-200 flex flex-col">
                                    <div className="p-5 flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate">
                                                        {kelas.nama_kelas}
                                                    </h3>
                                                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                        {kelas.status}
                                                    </span>
                                                </div>
                                                
                                                {!!kelas.hari && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            {kelas.hari}, {kelas.jam_mulai}–{kelas.jam_selesai}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-500">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            {kelas.ruangan}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 -mr-2 -mt-2">
                                                <ActionDropdown
                                                    actions={featureActions(kelas)}
                                                    onAction={(action) =>
                                                        action.action?.()
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                                            <div className="text-center p-2 rounded-lg bg-gray-50">
                                                <Users className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                                                <div className="text-lg font-semibold text-gray-900 leading-none">{getPraktikanCount(kelas.id)}</div>
                                                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Peserta</div>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-gray-50">
                                                <CalendarDays className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                                                <div className="text-lg font-semibold text-gray-900 leading-none">{getPertemuanCount(kelas.id)}</div>
                                                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Pertemuan</div>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-gray-50">
                                                <ClipboardList className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                                                <div className="text-lg font-semibold text-gray-900 leading-none">{getTugasCount(kelas.id)}</div>
                                                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Tugas</div>
                                            </div>
                                        </div>
                                    </div>

                                    {subKelas.length > 0 && (
                                        <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 rounded-b-xl">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <GitBranch className="w-3.5 h-3.5" />
                                                {subKelas.length} Sub-Kelas
                                            </h4>
                                            <div className="space-y-2.5">
                                                {subKelas.map((sub) => (
                                                    <div
                                                        key={sub.id}
                                                        className="group flex items-center justify-between rounded-lg bg-white border border-gray-200/60 shadow-sm px-3.5 py-3 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="min-w-0 pr-3">
                                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                <span className="font-semibold text-sm text-gray-900 truncate">
                                                                    {sub.nama_kelas}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 font-medium">
                                                                {getPraktikanCount(sub.id)} peserta • {getPertemuanCount(sub.id)} pertemuan • {getTugasCount(sub.id)} tugas
                                                            </div>
                                                            {!!sub.hari && (
                                                                <div className="mt-1.5 text-[10px] text-gray-500 flex flex-wrap gap-2">
                                                                    <span className="inline-flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">
                                                                        <Clock className="w-3 h-3" />
                                                                        {sub.hari}, {sub.jam_mulai}–{sub.jam_selesai}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {sub.ruangan}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <ActionDropdown
                                                                actions={featureActions(sub, true)}
                                                                onAction={(action) => action.action?.()}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
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
                <div className="p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900">
                        Tambah Sub-Kelas
                    </h2>
                    <form onSubmit={submitSubKelas} className="space-y-4">
                        <input
                            className="w-full rounded-lg border border-gray-200 px-3 py-2"
                            placeholder="Nama sub-kelas"
                            value={subKelasForm.nama_kelas}
                            onChange={(e) =>
                                setSubKelasForm({
                                    ...subKelasForm,
                                    nama_kelas: e.target.value,
                                })
                            }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={subKelasForm.hari}
                                    onChange={(e) =>
                                        setSubKelasForm({
                                            ...subKelasForm,
                                            hari: e.target.value,
                                        })
                                    }
                                    required
                                >
                                    <option value="">Pilih hari</option>
                                    {[
                                        "Senin",
                                        "Selasa",
                                        "Rabu",
                                        "Kamis",
                                        "Jumat",
                                        "Sabtu",
                                    ].map((hari) => (
                                        <option key={hari} value={hari}>
                                            {hari}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ruangan
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    placeholder="Contoh: Lab 1"
                                    value={subKelasForm.ruangan}
                                    onChange={(e) =>
                                        setSubKelasForm({
                                            ...subKelasForm,
                                            ruangan: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={subKelasForm.jam_mulai}
                                    onChange={(e) =>
                                        setSubKelasForm({
                                            ...subKelasForm,
                                            jam_mulai: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={subKelasForm.jam_selesai}
                                    onChange={(e) =>
                                        setSubKelasForm({
                                            ...subKelasForm,
                                            jam_selesai: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setAddSubKelasModal({
                                        open: false,
                                        parentKelas: null,
                                    })
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={editKelasModal.open}
                onClose={() => setEditKelasModal({ open: false, kelas: null })}
                maxWidth="md"
            >
                <div className="p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900">
                        Edit Kelas & Jadwal
                    </h2>
                    <form onSubmit={submitEditKelas} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Kelas
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    placeholder="Nama kelas"
                                    value={editKelasForm.data.nama_kelas}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "nama_kelas",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={editKelasForm.data.hari}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "hari",
                                            e.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Pilih hari</option>
                                    {[
                                        "Senin",
                                        "Selasa",
                                        "Rabu",
                                        "Kamis",
                                        "Jumat",
                                        "Sabtu",
                                    ].map((hari) => (
                                        <option key={hari} value={hari}>
                                            {hari}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ruangan
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={editKelasForm.data.ruangan}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "ruangan",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={editKelasForm.data.jam_mulai}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "jam_mulai",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={editKelasForm.data.jam_selesai}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "jam_selesai",
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    value={editKelasForm.data.status}
                                    onChange={(e) =>
                                        editKelasForm.setData(
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Nonaktif</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setEditKelasModal({
                                        open: false,
                                        kelas: null,
                                    })
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editKelasForm.processing}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                            >
                                {editKelasForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={isEditPraktikumModalOpen}
                onClose={() => setIsEditPraktikumModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Edit Info Praktikum
                    </h2>
                    <form onSubmit={submitEditPraktikum} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mata Kuliah
                            </label>
                            <select
                                value={editPraktikumForm.data.mata_kuliah_id}
                                onChange={(e) =>
                                    editPraktikumForm.setData(
                                        "mata_kuliah_id",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                required
                            >
                                <option value="">Pilih mata kuliah</option>
                                {mataKuliah.map((mk) => (
                                    <option key={mk.id} value={mk.id}>
                                        {mk.kode_mata_kuliah} - {mk.nama}
                                    </option>
                                ))}
                            </select>
                            {editPraktikumForm.errors.mata_kuliah_id && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editPraktikumForm.errors.mata_kuliah_id}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsEditPraktikumModalOpen(false)
                                }
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editPraktikumForm.processing}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {editPraktikumForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={isAddKelasModalOpen}
                onClose={() => setIsAddKelasModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Tambah Kelas
                    </h2>
                    <form onSubmit={submitAddKelas} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Kelas
                                </label>
                                <input
                                    type="text"
                                    value={addKelasForm.data.nama_kelas}
                                    onChange={(e) =>
                                        addKelasForm.setData(
                                            "nama_kelas",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    placeholder="Contoh: A"
                                    required
                                />
                                {addKelasForm.errors.nama_kelas && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {addKelasForm.errors.nama_kelas}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari
                                </label>
                                <select
                                    value={addKelasForm.data.hari}
                                    onChange={(e) =>
                                        addKelasForm.setData(
                                            "hari",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    required
                                >
                                    <option value="">Pilih hari</option>
                                    {[
                                        "Senin",
                                        "Selasa",
                                        "Rabu",
                                        "Kamis",
                                        "Jumat",
                                        "Sabtu",
                                    ].map((hari) => (
                                        <option key={hari} value={hari}>
                                            {hari}
                                        </option>
                                    ))}
                                </select>
                                {addKelasForm.errors.hari && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {addKelasForm.errors.hari}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ruangan
                                </label>
                                <input
                                    type="text"
                                    value={addKelasForm.data.ruangan}
                                    onChange={(e) =>
                                        addKelasForm.setData(
                                            "ruangan",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    placeholder="Contoh: Lab 1"
                                    required
                                />
                                {addKelasForm.errors.ruangan && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {addKelasForm.errors.ruangan}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    value={addKelasForm.data.jam_mulai}
                                    onChange={(e) =>
                                        addKelasForm.setData(
                                            "jam_mulai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    required
                                />
                                {addKelasForm.errors.jam_mulai && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {addKelasForm.errors.jam_mulai}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    value={addKelasForm.data.jam_selesai}
                                    onChange={(e) =>
                                        addKelasForm.setData(
                                            "jam_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                                    required
                                />
                                {addKelasForm.errors.jam_selesai && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {addKelasForm.errors.jam_selesai}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddKelasModalOpen(false)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={addKelasForm.processing}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {addKelasForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
