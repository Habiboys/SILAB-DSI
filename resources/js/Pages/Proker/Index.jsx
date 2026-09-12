import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import { useLab } from "@/Components/LabContext";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Archive, Check, FileText, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function SummaryCard({ label, value, color = "blue" }) {
    const valueColors = {
        blue: "text-primary",
        yellow: "text-warning",
        green: "text-success",
        red: "text-error",
        gray: "text-base-content",
    };
    return (
        <div className="rounded-md border border-base-300 bg-base-100 p-4">
            <div className={`text-2xl font-bold ${valueColors[color]}`}>{value}</div>
            <div className="mt-0.5 text-xs font-medium text-base-content/70">{label}</div>
        </div>
    );
}

const Proker = ({
    prokerData,
    kepengurusanlab,
    strukturList,
    tahunKepengurusan,
    selectedTahun: initialSelectedTahun,
    laboratorium,
    summary,
    can = {},
    filters = {},
}) => {
    const { selectedLab } = useLab();
    const [showModal, setShowModal] = useState(false);
    const [editingProker, setEditingProker] = useState(null);
    const [deletingProker, setDeletingProker] = useState(null);
    const [approvingItem, setApprovingItem] = useState(null);
    const [approveAction, setApproveAction] = useState("approve");
    const [approveCatatan, setApproveCatatan] = useState("");
    const [approving, setApproving] = useState(false);
    const searchTimer = useRef(null);
    const [search, setSearch] = useState(filters?.search ?? "");
    const [filterStruktur, setFilterStruktur] = useState(filters?.filter_struktur ?? "");
    const [filterSP, setFilterSP] = useState(filters?.filter_status_pengajuan ?? "");
    const [filterStatus, setFilterStatus] = useState(filters?.filter_status ?? "");
    const [perPage, setPerPage] = useState(filters?.per_page ?? 10);
    const kepLabId = filters?.kepengurusan_lab_id ?? kepengurusanlab?.id;

    const applyFilters = (overrides = {}) => router.get(route("proker.index"), {
        kepengurusan_lab_id: kepLabId,
        search,
        filter_struktur: filterStruktur,
        filter_status_pengajuan: filterSP,
        filter_status: filterStatus,
        per_page: perPage,
        ...overrides,
    }, { preserveScroll: true, preserveState: true });

    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search }), 450);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    const handleSearchChange = (event) => setSearch(event.target.value);

    const handleFilterChange = (key, value) => {
        if (key === "filter_struktur") setFilterStruktur(value);
        if (key === "filter_status_pengajuan") setFilterSP(value);
        if (key === "filter_status") setFilterStatus(value);
        if (key === "per_page") setPerPage(value);
        applyFilters({ [key]: value, search });
    };

    const clearFilters = () => {
        setSearch("");
        setFilterStruktur("");
        setFilterSP("");
        setFilterStatus("");
        setPerPage(10);
        router.get(route("proker.index"), { kepengurusan_lab_id: kepLabId, per_page: 10 }, { preserveScroll: true, preserveState: true });
    };

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        lab_id: selectedLab?.id || "",
        kepengurusan_lab_id: kepengurusanlab?.id || "",
        struktur_id: "",
        nama_proker: "",
        deskripsi: "",
        tujuan: "",
        sasaran: "",
        output_kegiatan: "",
        status: "belum_mulai",
        tanggal_mulai: "",
        tanggal_selesai: "",
        keterangan: "",
        file_proker: null,
    });

    useEffect(() => {
        if (selectedLab) setData("lab_id", selectedLab.id);
    }, [selectedLab]);

    const openModal = (prokerItem = null) => {
        if (prokerItem) {
            setEditingProker(prokerItem);
            setData({
                _method: "put",
                lab_id: selectedLab?.id || "",
                kepengurusan_lab_id: prokerItem.kepengurusan_lab_id,
                struktur_id: prokerItem.struktur_id,
                nama_proker: prokerItem.nama_proker || prokerItem.deskripsi || "",
                deskripsi: prokerItem.deskripsi || "",
                tujuan: prokerItem.tujuan || "",
                sasaran: prokerItem.sasaran || "",
                output_kegiatan: prokerItem.output_kegiatan || "",
                status: prokerItem.status,
                tanggal_mulai: prokerItem.tanggal_mulai || "",
                tanggal_selesai: prokerItem.tanggal_selesai || "",
                keterangan: prokerItem.keterangan || "",
                file_proker: null,
            });
        } else {
            setEditingProker(null);
            reset();
            setData((prev) => ({ ...prev, lab_id: selectedLab?.id || "", kepengurusan_lab_id: kepengurusanlab?.id || "" }));
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProker(null);
        reset();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                toast.success(editingProker ? "Program kerja berhasil diperbarui" : "Program kerja berhasil ditambahkan");
            },
            onError: (formErrors) => toast.error(Object.values(formErrors).find(Boolean) || "Gagal menyimpan program kerja"),
        };
        editingProker ? post(route("proker.update", editingProker.id), options) : post(route("proker.store"), options);
    };

    const handleDelete = () => destroy(route("proker.destroy", deletingProker.id), {
        preserveScroll: true,
        onSuccess: () => {
            setDeletingProker(null);
            toast.success("Program kerja berhasil dihapus");
        },
        onError: (formErrors) => toast.error(Object.values(formErrors).find(Boolean) || "Gagal menghapus program kerja"),
    });

    const openApprove = (item, action) => {
        setApprovingItem(item);
        setApproveAction(action);
        setApproveCatatan("");
    };

    const handleApprove = () => {
        setApproving(true);
        router.post(route("proker.approve", approvingItem.id), { action: approveAction, catatan: approveCatatan }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(approveAction === "approve" ? "Proker disetujui" : "Proker ditolak");
                setApprovingItem(null);
            },
            onError: (formErrors) => toast.error(Object.values(formErrors).find(Boolean) || "Gagal memproses persetujuan"),
            onFinish: () => setApproving(false),
        });
    };

    const from = prokerData?.meta?.from ?? prokerData?.from ?? 1;
    const columns = [
        { header: "No", render: (_, index) => from + index },
        {
            key: "nama_proker",
            header: "Program Kerja",
            render: (item) => (
                <div>
                    <Link href={route("proker.show", item.id)} className="link link-primary text-sm font-medium">
                        {item.nama_display || item.nama_proker || item.deskripsi}
                    </Link>
                    {item.tanggal_mulai && item.tanggal_selesai && (
                        <div className="mt-0.5 text-xs text-base-content/60">
                            {new Date(item.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            {" sampai "}
                            {new Date(item.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "struktur.struktur",
            header: "Divisi / PJ",
            render: (item) => (
                <div>
                    <div className="text-sm font-medium">{item.struktur?.struktur}</div>
                    {(item.pjs || []).filter((pj) => pj.user?.name).length > 0 && (
                        <div className="mt-0.5 text-xs text-base-content/60">{(item.pjs || []).map((pj) => pj.user?.name).filter(Boolean).join(", ")}</div>
                    )}
                </div>
            ),
        },
        {
            key: "status_pengajuan",
            header: "Status",
            render: (item) => (
                <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={item.status_pengajuan} label={item.status_pengajuan_text} />
                    <StatusBadge status={item.status} label={item.status_text} />
                </div>
            ),
        },
        {
            header: "Parameter",
            render: (item) => item.parameter?.length > 0 ? `${item.parameter.length} ind. (${item.total_bobot}%)` : "-",
        },
        {
            key: "persentase_capaian",
            header: "Capaian",
            render: (item) => item.persentase_capaian === null || item.persentase_capaian === undefined
                ? "-"
                : <span className={`font-semibold ${item.persentase_capaian >= 80 ? "text-success" : item.persentase_capaian >= 50 ? "text-warning" : "text-error"}`}>{item.persentase_capaian}%</span>,
        },
        {
            header: "Aksi",
            render: (item) => (
                <RowActions detailHref={route("proker.show", item.id)} onEdit={kepengurusanlab?.is_active ? () => openModal(item) : null} onDelete={kepengurusanlab?.is_active ? () => setDeletingProker(item) : null}>
                    {can.approve && item.status_pengajuan === "diajukan" && (
                        <>
                            <IconAction label="Setujui" icon={Check} tone="success" onClick={() => openApprove(item, "approve")} />
                            <IconAction label="Tolak" icon={X} tone="delete" onClick={() => openApprove(item, "reject")} />
                        </>
                    )}
                </RowActions>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Program Kerja" />
            <PageHeader
                title="Program Kerja Laboratorium"
                description="Kelola dan pantau program kerja berdasarkan divisi dan periode kepengurusan."
                actions={kepengurusanlab && (
                    <>
                        <Button variant="ghost" href={route("lpj-kepengurusan.preview-page", { kepengurusan_lab_id: kepengurusanlab.id, type: "rangkuman" })}><FileText className="h-4 w-4" /> Laporan Kalab</Button>
                        <Button variant="secondary" href={route("lpj-kepengurusan.preview-page", { kepengurusan_lab_id: kepengurusanlab.id, type: "lengkap" })}><Archive className="h-4 w-4" /> Laporan LPJ Labor</Button>
                        {kepengurusanlab?.is_active && can.create && <Button onClick={() => openModal()}><Plus className="h-4 w-4" /> Tambah Proker</Button>}
                    </>
                )}
            />

            {!selectedLab && <PageSection><p className="py-8 text-center text-base-content/70">Pilih laboratorium dari navbar terlebih dahulu.</p></PageSection>}
            {selectedLab && !kepengurusanlab && <PageSection><p className="py-8 text-center text-base-content/70">Belum ada kepengurusan yang dipilih atau aktif.</p></PageSection>}

            {kepengurusanlab && (
                <>
                    {summary && (
                        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                            <SummaryCard label="Total Proker" value={summary.total} color="blue" />
                            <SummaryCard label="Menunggu Persetujuan" value={summary.diajukan} color="yellow" />
                            <SummaryCard label="Disetujui" value={summary.disetujui} color="green" />
                            <SummaryCard label="Selesai" value={summary.selesai} color="green" />
                            <SummaryCard label="Ditolak" value={summary.ditolak} color="red" />
                        </div>
                    )}

                    <PageSection bodyClassName="p-4 sm:p-5">
                        <ServerDataTable
                            paginator={{
                                data: prokerData?.data ?? [],
                                links: prokerData?.links,
                                from: prokerData?.meta?.from ?? prokerData?.from,
                                to: prokerData?.meta?.to ?? prokerData?.to,
                                total: prokerData?.meta?.total ?? prokerData?.total,
                            }}
                            columns={columns}
                            search={search}
                            onSearchChange={handleSearchChange}
                            searchPlaceholder="Cari nama program kerja..."
                            perPage={perPage}
                            onPerPageChange={(event) => handleFilterChange("per_page", Number(event.target.value))}
                            filters={[
                                { key: "filter_struktur", label: "Divisi", control: <select className="select select-bordered min-h-11" value={filterStruktur} onChange={(event) => handleFilterChange("filter_struktur", event.target.value)}><option value="">Semua</option>{(strukturList || []).map((item) => <option key={item.id} value={item.id}>{item.struktur}</option>)}</select> },
                                { key: "filter_status_pengajuan", label: "Status Pengajuan", control: <select className="select select-bordered min-h-11" value={filterSP} onChange={(event) => handleFilterChange("filter_status_pengajuan", event.target.value)}><option value="">Semua</option><option value="draft">Draft</option><option value="diajukan">Diajukan</option><option value="disetujui">Disetujui</option><option value="ditolak">Ditolak</option></select> },
                                { key: "filter_status", label: "Status Pelaksanaan", control: <select className="select select-bordered min-h-11" value={filterStatus} onChange={(event) => handleFilterChange("filter_status", event.target.value)}><option value="">Semua</option><option value="belum_mulai">Belum Mulai</option><option value="sedang_berjalan">Sedang Berjalan</option><option value="selesai">Selesai</option><option value="ditunda">Ditunda</option></select> },
                            ]}
                            emptyMessage={search || filterStruktur || filterSP || filterStatus ? "Tidak ada program kerja yang sesuai filter." : "Belum ada program kerja untuk periode ini."}
                        />
                        {(search || filterStruktur || filterSP || filterStatus) && <div className="mt-3 flex justify-end"><Button variant="ghost" onClick={clearFilters}>Reset Filter</Button></div>}
                    </PageSection>
                </>
            )}

            <Modal show={showModal} maxWidth="2xl" onClose={closeModal}>
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">{editingProker ? "Edit Program Kerja" : "Tambah Program Kerja"}</h2></header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Divisi / Struktur" error={errors.struktur_id} required><select className="select select-bordered min-h-11 w-full" value={data.struktur_id} onChange={(event) => setData("struktur_id", event.target.value)} required><option value="">Pilih Divisi / Struktur</option>{(strukturList || []).map((item) => <option key={item.id} value={item.id}>{item.struktur}</option>)}</select></FormField>
                        <FormField label="Nama Program Kerja" error={errors.nama_proker} required><input className="input input-bordered min-h-11 w-full" value={data.nama_proker} onChange={(event) => setData("nama_proker", event.target.value)} placeholder="Contoh: Neo Portofolio x Marketing" required /></FormField>
                        <FormField label="Deskripsi Kegiatan" error={errors.deskripsi} required><textarea className="textarea textarea-bordered min-h-20 w-full" value={data.deskripsi} onChange={(event) => setData("deskripsi", event.target.value)} placeholder="Penjelasan singkat kegiatan..." required /></FormField>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Tujuan" error={errors.tujuan}><textarea className="textarea textarea-bordered min-h-20 w-full" value={data.tujuan} onChange={(event) => setData("tujuan", event.target.value)} placeholder="Apa yang ingin dicapai..." /></FormField>
                            <FormField label="Sasaran" error={errors.sasaran}><textarea className="textarea textarea-bordered min-h-20 w-full" value={data.sasaran} onChange={(event) => setData("sasaran", event.target.value)} placeholder="Target peserta atau pihak terdampak..." /></FormField>
                        </div>
                        <FormField label="Output Kegiatan" error={errors.output_kegiatan}><textarea className="textarea textarea-bordered min-h-20 w-full" value={data.output_kegiatan} onChange={(event) => setData("output_kegiatan", event.target.value)} placeholder="Hasil nyata yang dihasilkan..." /></FormField>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Tanggal Mulai" error={errors.tanggal_mulai}><input type="date" className="input input-bordered min-h-11 w-full" value={data.tanggal_mulai} onChange={(event) => setData("tanggal_mulai", event.target.value)} /></FormField>
                            <FormField label="Tanggal Selesai" error={errors.tanggal_selesai}><input type="date" className="input input-bordered min-h-11 w-full" value={data.tanggal_selesai} onChange={(event) => setData("tanggal_selesai", event.target.value)} /></FormField>
                        </div>
                        <FormField label="Status Pelaksanaan" error={errors.status} required><select className="select select-bordered min-h-11 w-full" value={data.status} onChange={(event) => setData("status", event.target.value)} required><option value="belum_mulai">Belum Mulai</option><option value="sedang_berjalan">Sedang Berjalan</option><option value="selesai">Selesai</option><option value="ditunda">Ditunda</option></select></FormField>
                        <FormField label="Keterangan" error={errors.keterangan}><textarea className="textarea textarea-bordered min-h-20 w-full" value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} /></FormField>
                        <FormField label="File Dokumen Proker" error={errors.file_proker} hint="PDF, DOC, DOCX. Maksimal 10 MB. Foto dan galeri diunggah di halaman detail setelah proker dibuat."><input type="file" accept=".pdf,.doc,.docx" className="file-input file-input-bordered min-h-11 w-full" onChange={(event) => setData("file_proker", event.target.files[0])} /></FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeModal}>Batal</Button><Button type="submit" loading={processing}>{editingProker ? "Perbarui" : "Simpan"}</Button></footer>
                </form>
            </Modal>

            <Modal show={!!approvingItem} onClose={() => setApprovingItem(null)} maxWidth="md">
                <div className="p-5">
                    <h3 className="text-base font-semibold">{approveAction === "approve" ? "Setujui Program Kerja" : "Tolak Program Kerja"}</h3>
                    {approvingItem && <p className="mt-1 text-sm text-base-content/70">{approvingItem.nama_display || approvingItem.nama_proker}</p>}
                    <FormField label="Catatan" error={approveAction === "reject" && !approveCatatan.trim() ? "Catatan penolakan wajib diisi." : undefined} required={approveAction === "reject"} className="mt-4"><textarea className="textarea textarea-bordered min-h-20 w-full" value={approveCatatan} onChange={(event) => setApproveCatatan(event.target.value)} placeholder={approveAction === "approve" ? "Opsional: catatan persetujuan..." : "Jelaskan alasan penolakan..."} /></FormField>
                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setApprovingItem(null)}>Batal</Button><Button variant={approveAction === "approve" ? "primary" : "danger"} loading={approving} disabled={approveAction === "reject" && !approveCatatan.trim()} onClick={handleApprove}>{approveAction === "approve" ? "Setujui" : "Tolak"}</Button></div>
                </div>
            </Modal>

            <ConfirmModal
                show={!!deletingProker}
                onClose={() => setDeletingProker(null)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message="Apakah Anda yakin ingin menghapus program kerja ini? Semua parameter dan dokumentasi terkait juga akan dihapus."
                confirmText={processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default Proker;
