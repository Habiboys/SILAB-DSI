import Button from "../../Components/Button";
import ConfirmModal from "../../Components/ConfirmModal";
import { DataGrid } from "../../Components/DataTable";
import FormField from "../../Components/FormField";
import RowActions from "../../Components/RowActions";
import StatusBadge from "../../Components/StatusBadge";
import { router, useForm } from "@inertiajs/react";
import { Check, Info, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function PesertaManager({
    kegiatan,
    can,
    anggota = [],
    template = null,
    disabled = false,
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingPeserta, setDeletingPeserta] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showConfirmGen, setShowConfirmGen] = useState(false);
    const [genProcessing, setGenProcessing] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: "",
        peran: "peserta",
    });

    const availableAnggota = anggota.filter(
        (a) => !kegiatan.peserta?.some((p) => p.user_id === a.id),
    );

    const submitAdd = (e) => {
        e.preventDefault();
        post(route("kegiatan.peserta.store", kegiatan.id), {
            onSuccess: () => {
                toast.success("Peserta berhasil ditambahkan");
                reset();
                setShowAddForm(false);
            },
            onError: (errs) =>
                toast.error(errs.user_id ?? "Gagal menambahkan peserta"),
        });
    };

    const confirmDelete = () => {
        router.delete(
            route("kegiatan.peserta.destroy", {
                kegiatan: kegiatan.id,
                pesertaId: deletingPeserta.id,
            }),
            {
                onSuccess: () => {
                    toast.success("Peserta dihapus");
                    setDeletingPeserta(null);
                },
                onError: () => toast.error("Gagal menghapus peserta"),
            },
        );
    };

    const {
        data: tmpl,
        setData: setTmpl,
        post: postTmpl,
        processing: tmplProc,
        reset: resetTmpl,
    } = useForm({ template: null });
    const submitTemplate = (e) => {
        e.preventDefault();
        postTmpl(route("kegiatan.template.upload", kegiatan.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Template berhasil diunggah");
                resetTmpl();
            },
            onError: () => toast.error("Gagal upload template"),
        });
    };

    const pesertaList = kegiatan.peserta ?? [];
    const toggleUser = (userId) =>
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    const toggleAll = () =>
        setSelectedUsers(
            selectedUsers.length === pesertaList.length
                ? []
                : pesertaList.map((p) => p.user_id),
        );

    const handleGenerateSubmit = () => {
        setShowConfirmGen(false);
        setGenProcessing(true);
        router.post(
            route("kegiatan.sertifikat.generate", kegiatan.id),
            { user_ids: selectedUsers },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Sertifikat berhasil digenerate");
                    setSelectedUsers([]);
                    setGenProcessing(false);
                },
                onError: () => {
                    toast.error("Gagal generate sertifikat");
                    setGenProcessing(false);
                },
            },
        );
    };

    const allSelected =
        selectedUsers.length > 0 && selectedUsers.length === pesertaList.length;

    const columns = useMemo(() => {
        const cols = [];
        if (can.create && !disabled) {
            cols.push({
                key: "select",
                header: (
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        onChange={toggleAll}
                        checked={allSelected}
                        aria-label="Pilih semua peserta"
                    />
                ),
                sortable: false,
                searchable: false,
                cellClassName: "w-10",
                render: (p) => (
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedUsers.includes(p.user_id)}
                        onChange={() => toggleUser(p.user_id)}
                        aria-label={`Pilih ${p.user?.name ?? "peserta"}`}
                    />
                ),
            });
        }
        cols.push(
            {
                key: "user.name",
                header: "Nama",
                render: (p) => (
                    <span className="font-medium">{p.user?.name ?? "-"}</span>
                ),
            },
            {
                key: "peran",
                header: "Peran",
                render: (p) => (
                    <StatusBadge
                        tone={p.peran === "panitia" ? "info" : "neutral"}
                        label={p.peran.charAt(0).toUpperCase() + p.peran.slice(1)}
                    />
                ),
            },
            {
                header: "Sertifikat",
                sortable: false,
                searchable: false,
                render: (p) =>
                    p.file_sertifikat ? (
                        <a
                            href={`/storage/${p.file_sertifikat}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary text-xs"
                        >
                            Download{" "}
                            {p.no_sertifikat && (
                                <span className="text-base-content/60">
                                    ({p.no_sertifikat})
                                </span>
                            )}
                        </a>
                    ) : (
                        <span className="text-xs italic text-base-content/50">
                            Belum ada
                        </span>
                    ),
            },
        );
        if (can.create && !disabled) {
            cols.push({
                header: "Aksi",
                sortable: false,
                searchable: false,
                headerClassName: "text-right",
                render: (p) => (
                    <RowActions onDelete={() => setDeletingPeserta(p)} />
                ),
            });
        }
        return cols;
    }, [
        allSelected,
        can.create,
        disabled,
        selectedUsers,
        pesertaList,
    ]);

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {!disabled && can.create && (
                <div
                    role="status"
                    className={`alert items-start ${template ? "alert-success" : "alert-info"}`}
                >
                    <div className="w-full">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    {template ? (
                                        <Check
                                            className="h-4 w-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Info
                                            className="h-4 w-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Status Template Sertifikat
                                </h4>
                                <p className="mt-2 text-sm">
                                    {template
                                        ? `Template "${template.nama ?? template}" sudah diunggah. Anda dapat upload ulang untuk mengganti.`
                                        : "Belum ada template. Upload file .docx untuk mulai generate sertifikat."}
                                </p>
                                <div className="mt-2 rounded-md border border-base-content/10 bg-base-100/60 p-2 text-xs">
                                    <strong>Panduan Variabel (.docx):</strong>{" "}
                                    Gunakan format{" "}
                                    <code>{`\${nama_variabel}`}</code> pada
                                    dokumen Word Anda.
                                    <ul className="mt-1 ml-5 grid list-disc grid-cols-2 gap-x-4">
                                        <li>
                                            <code>{`\${nama}`}</code> : Nama
                                        </li>
                                        <li>
                                            <code>{`\${nim}`}</code> : NIM
                                            (Nomor Induk)
                                        </li>
                                        <li>
                                            <code>{`\${peran}`}</code> : Peran
                                        </li>
                                        <li>
                                            <code>{`\${kegiatan}`}</code> :
                                            Nama Kegiatan
                                        </li>
                                        <li>
                                            <code>{`\${tanggal}`}</code> :
                                            Tanggal Terbit
                                        </li>
                                        <li>
                                            <code>{`\${nomor}`}</code> : Nomor
                                            Sertifikat
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <form
                                onSubmit={submitTemplate}
                                className="flex flex-col gap-2 md:w-64 flex-shrink-0"
                            >
                                <input
                                    type="file"
                                    accept=".docx"
                                    onChange={(e) =>
                                        setTmpl("template", e.target.files[0])
                                    }
                                    className="file-input file-input-bordered w-full"
                                />
                                <Button
                                    type="submit"
                                    variant={template ? "success" : "primary"}
                                    loading={tmplProc}
                                >
                                    {template
                                        ? "Ganti Template"
                                        : "Upload Template"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {!disabled && can.create && (
                <div className="flex justify-end">
                    <Button
                        variant={showAddForm ? "ghost" : "primary"}
                        onClick={() => setShowAddForm((v) => !v)}
                    >
                        {showAddForm ? "Batal" : (
                            <>
                                <Plus className="h-4 w-4" /> Tambah Peserta
                            </>
                        )}
                    </Button>
                </div>
            )}

            {showAddForm && !disabled && (
                <form
                    onSubmit={submitAdd}
                    className="flex flex-wrap items-end gap-3 rounded-md border border-base-content/10 bg-base-200 p-4"
                >
                    <FormField
                        label="Anggota"
                        error={errors.user_id}
                        className="min-w-48 flex-1"
                    >
                        <select
                            value={data.user_id}
                            onChange={(e) =>
                                setData("user_id", e.target.value)
                            }
                            className="select select-bordered min-h-11 w-full focus:select-primary"
                            required
                        >
                            <option value="">Pilih anggota...</option>
                            {availableAnggota.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Peran" className="min-w-32">
                        <select
                            value={data.peran}
                            onChange={(e) => setData("peran", e.target.value)}
                            className="select select-bordered min-h-11 w-full focus:select-primary"
                        >
                            <option value="peserta">Peserta</option>
                            <option value="panitia">Panitia</option>
                        </select>
                    </FormField>
                    <Button
                        type="submit"
                        disabled={!data.user_id}
                        loading={processing}
                    >
                        Tambah
                    </Button>
                    {availableAnggota.length === 0 && (
                        <p className="w-full text-xs italic text-base-content/60">
                            Semua anggota sudah terdaftar.
                        </p>
                    )}
                </form>
            )}

            {can.create && !disabled && pesertaList.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-base-content/70">
                        {selectedUsers.length > 0
                            ? `${selectedUsers.length} dipilih`
                            : "Pilih peserta untuk generate sertifikat"}
                    </p>
                    <Button
                        variant="success"
                        loading={genProcessing}
                        disabled={selectedUsers.length === 0}
                        onClick={() => {
                            if (selectedUsers.length === 0) {
                                toast.error("Pilih minimal satu peserta");
                                return;
                            }
                            setShowConfirmGen(true);
                        }}
                    >
                        Generate Untuk {selectedUsers.length} Orang
                    </Button>
                </div>
            )}

            <DataGrid
                rows={pesertaList}
                columns={columns}
                rowKey="id"
                searchPlaceholder="Cari nama peserta..."
                emptyMessage="Belum ada peserta terdaftar."
            />

            <ConfirmModal
                show={!!deletingPeserta}
                onClose={() => setDeletingPeserta(null)}
                onConfirm={confirmDelete}
                title="Hapus Peserta"
                message={`Hapus ${deletingPeserta?.user?.name} dari daftar peserta?`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <ConfirmModal
                show={showConfirmGen}
                onClose={() => setShowConfirmGen(false)}
                onConfirm={handleGenerateSubmit}
                title="Konfirmasi Generate Sertifikat"
                message={`Sertifikat akan digenerate untuk ${selectedUsers.length} orang yang dipilih. Sertifikat yang sudah ada untuk peserta ini akan ditimpa.`}
                confirmText="Ya, Generate Sekarang"
                cancelText="Batal"
                type="info"
            />
        </div>
    );
}
