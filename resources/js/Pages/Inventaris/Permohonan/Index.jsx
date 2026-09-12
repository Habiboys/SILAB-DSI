import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_MAP = {
    draft: { label: "Draft", tone: "neutral" },
    diajukan: { label: "Menunggu Review", tone: "warning" },
    disetujui_kalab: { label: "Disetujui Kalab", tone: "info" },
    ditolak_kalab: { label: "Ditolak Kalab", tone: "error" },
    disetujui_kadep: { label: "Disetujui Kadep", tone: "success" },
    ditolak_kadep: { label: "Ditolak Kadep", tone: "error" },
};

const EMPTY_ITEM = { nama_barang: "", jenis_barang: "", spesifikasi_teknis: "", perkiraan_harga: "", jumlah_diminta: 1, satuan: "unit", urgensi: "sedang", referensi_url: "" };

export default function PermohonanIndex({ permohonan, filters }) {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [perPage, setPerPage] = useState(Number(filters.perPage || 10));
    const [selectedIds, setSelectedIds] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [editPermohonan, setEditPermohonan] = useState(null);

    const applyFilters = debounce((search, status, pageSize) => {
        router.get(route("inventaris.permohonan.index"), { search, status, perPage: pageSize, lab_id: filters.lab_id }, { preserveState: true, preserveScroll: true, replace: true });
    }, 300);

    const onSearchChange = (event) => {
        setSearchTerm(event.target.value);
        applyFilters(event.target.value, statusFilter, perPage);
    };
    const onStatusChange = (event) => {
        setStatusFilter(event.target.value);
        applyFilters(searchTerm, event.target.value, perPage);
    };
    const onPerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        applyFilters(searchTerm, statusFilter, event.target.value);
    };

    const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedIds(selectedIds.length === permohonan.data.length ? [] : permohonan.data.map((item) => item.id));

    const executeBulkDelete = () => router.post(route("inventaris.permohonan.bulk-delete"), { ids: selectedIds }, {
        onSuccess: () => { setSelectedIds([]); setIsBulkDeleteModalOpen(false); toast.success("Permohonan terpilih berhasil dihapus"); },
        preserveScroll: true,
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        laboratorium_id: filters.lab_id || auth.user.laboratory?.id || "",
        alasan_umum_pengadaan: "",
        items: [{ ...EMPTY_ITEM }],
    });

    const editForm = useForm({ alasan_umum_pengadaan: "", items: [] });
    const openEditModal = (item) => {
        setEditPermohonan(item);
        editForm.setData({
            alasan_umum_pengadaan: item.alasan_umum_pengadaan,
            items: (item.wishlist_aset || []).map((wishlist) => ({
                id: wishlist.id,
                nama_barang: wishlist.nama_barang,
                jenis_barang: wishlist.jenis_barang || "",
                spesifikasi_teknis: wishlist.spesifikasi_teknis || "",
                perkiraan_harga: wishlist.perkiraan_harga || "",
                jumlah_diminta: wishlist.jumlah_diminta,
                satuan: wishlist.satuan || "unit",
                urgensi: wishlist.urgensi || "sedang",
                referensi_url: wishlist.referensi_url || "",
            })),
        });
        setIsEditModalOpen(true);
    };
    const handleEditSubmit = (event) => {
        event.preventDefault();
        editForm.put(route("inventaris.permohonan.update", editPermohonan.id), {
            onSuccess: () => { toast.success("Draft permohonan berhasil diperbarui"); setIsEditModalOpen(false); setEditPermohonan(null); },
            onError: () => toast.error("Gagal memperbarui draft, periksa kembali inputan Anda."),
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        post(route("inventaris.permohonan.store"), {
            onSuccess: () => { toast.success("Draft permohonan berhasil disimpan. Buka detail untuk mengajukan."); setIsCreateModalOpen(false); reset(); },
            onError: () => toast.error("Gagal mengajukan permohonan, periksa kembali inputan Anda."),
        });
    };

    const columns = [
        {
            header: <input type="checkbox" className="checkbox checkbox-sm" checked={permohonan.data.length > 0 && selectedIds.length === permohonan.data.length} onChange={toggleSelectAll} aria-label="Pilih semua permohonan di halaman ini" />,
            headerClassName: "w-10",
            sortable: false,
            searchable: false,
            render: (item) => <input type="checkbox" className="checkbox checkbox-sm" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Pilih ${item.nomor_permohonan}`} />,
        },
        { key: "nomor_permohonan", header: "No Permohonan" },
        { key: "tanggal_permohonan", header: "Tanggal", render: (item) => new Date(item.tanggal_permohonan).toLocaleDateString("id-ID") },
        { key: "user_pemohon.name", header: "Pemohon", render: (item) => item.user_pemohon?.name || "-" },
        { key: "laboratorium.nama", header: "Laboratorium", render: (item) => item.laboratorium?.nama || "-" },
        { key: "status_permohonan", header: "Status", render: (item) => <StatusBadge status={item.status_permohonan} tone={STATUS_MAP[item.status_permohonan]?.tone} label={STATUS_MAP[item.status_permohonan]?.label ?? item.status_permohonan} /> },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            render: (item) => <RowActions detailHref={route("inventaris.permohonan.show", item.id)} onEdit={item.status_permohonan === "draft" ? () => openEditModal(item) : null} />,
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Permohonan Aset" />
            <PageHeader
                title="Permohonan Aset"
                description="Buat dan pantau permohonan pengadaan aset laboratorium."
                actions={<Button onClick={() => setIsCreateModalOpen(true)}><Plus className="h-4 w-4" /> Buat Draft Permohonan</Button>}
            />

            {selectedIds.length > 0 && (
                <div className="mb-4 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">{selectedIds.length} permohonan terpilih</span>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="danger" onClick={() => setIsBulkDeleteModalOpen(true)}><Trash2 className="h-4 w-4" /> Hapus</Button>
                        <Button variant="ghost" onClick={() => setSelectedIds([])}>Batal Pilih</Button>
                    </div>
                </div>
            )}

            <PageSection bodyClassName="p-4 sm:p-5">
                <ServerDataTable
                    paginator={permohonan}
                    columns={columns}
                    search={searchTerm}
                    onSearchChange={onSearchChange}
                    searchPlaceholder="Cari nomor permohonan..."
                    perPage={perPage}
                    onPerPageChange={onPerPageChange}
                    filters={[
                        {
                            key: "status",
                            label: "Status",
                            control: (
                                <select className="select select-bordered min-h-11" value={statusFilter} onChange={onStatusChange}>
                                    <option value="">Semua</option>
                                    {Object.entries(STATUS_MAP).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                                </select>
                            ),
                        },
                    ]}
                    emptyMessage={searchTerm || statusFilter ? "Tidak ada permohonan yang cocok dengan pencarian atau filter." : "Belum ada permohonan."}
                />
            </PageSection>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="2xl">
                <PermohonanForm
                    title="Buat Draft Permohonan Aset"
                    form={{ data, setData, errors, processing, addItem: () => setData("items", [...data.items, { ...EMPTY_ITEM }]), removeItem: (index) => setData("items", data.items.filter((_, itemIndex) => itemIndex !== index)) }}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsCreateModalOpen(false)}
                    submitLabel="Kirim Permohonan"
                />
            </Modal>

            <Modal show={isEditModalOpen && !!editPermohonan} onClose={() => setIsEditModalOpen(false)} maxWidth="2xl">
                <PermohonanForm
                    title="Edit Draft Permohonan Aset"
                    form={{ data: editForm.data, setData: editForm.setData, errors: editForm.errors, processing: editForm.processing, addItem: () => editForm.setData("items", [...(editForm.data.items || []), { ...EMPTY_ITEM }]), removeItem: (index) => editForm.setData("items", (editForm.data.items || []).filter((_, itemIndex) => itemIndex !== index)) }}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditModalOpen(false)}
                    submitLabel="Perbarui Draft"
                />
            </Modal>

            <ConfirmModal
                show={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={executeBulkDelete}
                title="Hapus Permohonan Massal"
                message={`Yakin ingin menghapus ${selectedIds.length} permohonan terpilih? Hanya permohonan berstatus draft yang dapat dihapus.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
}

function PermohonanForm({ title, form, onSubmit, onCancel, submitLabel }) {
    const { data, setData, errors, processing, addItem, removeItem } = form;
    const updateItem = (index, field, value) => setData("items", data.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    const items = data.items || [];

    return (
        <form onSubmit={onSubmit} className="flex max-h-[calc(100vh-5rem)] flex-col">
            <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">{title}</h2></header>
            <div className="space-y-4 overflow-y-auto p-5">
                <FormField label="Alasan Pengadaan (Umum)" error={errors.alasan_umum_pengadaan} required>
                    <textarea className="textarea textarea-bordered min-h-20 w-full" value={data.alasan_umum_pengadaan} onChange={(event) => setData("alasan_umum_pengadaan", event.target.value)} required placeholder="Jelaskan alasan umum kebutuhan pengadaan aset ini..." />
                </FormField>
                <div className="flex items-center justify-between"><h3 className="text-base font-medium">Daftar Barang</h3><Button variant="ghost" onClick={addItem}><Plus className="h-4 w-4" /> Tambah Barang</Button></div>
                {items.map((item, index) => (
                    <fieldset key={index} className="relative rounded-md border border-base-300 bg-base-200/40 p-4">
                        {items.length > 1 && <div className="absolute right-2 top-2"><Button variant="ghost" onClick={() => removeItem(index)} aria-label={`Hapus barang ${index + 1}`}><Trash2 className="h-4 w-4" /></Button></div>}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <FormField label="Nama Barang" error={errors[`items.${index}.nama_barang`]} required><input className="input input-bordered min-h-11 w-full" value={item.nama_barang} onChange={(event) => updateItem(index, "nama_barang", event.target.value)} required /></FormField>
                            <FormField label="Jenis Barang"><input className="input input-bordered min-h-11 w-full" value={item.jenis_barang} onChange={(event) => updateItem(index, "jenis_barang", event.target.value)} placeholder="Contoh: Elektronik" /></FormField>
                            <FormField label="Spesifikasi Teknis"><input className="input input-bordered min-h-11 w-full" value={item.spesifikasi_teknis} onChange={(event) => updateItem(index, "spesifikasi_teknis", event.target.value)} /></FormField>
                            <FormField label="Perkiraan Harga (Rp)"><input type="number" className="input input-bordered min-h-11 w-full" value={item.perkiraan_harga} onChange={(event) => updateItem(index, "perkiraan_harga", event.target.value)} /></FormField>
                            <div className="flex gap-2">
                                <FormField label="Jumlah" className="flex-1" required><input type="number" min="1" className="input input-bordered min-h-11 w-full" value={item.jumlah_diminta} onChange={(event) => updateItem(index, "jumlah_diminta", parseInt(event.target.value, 10))} required /></FormField>
                                <FormField label="Satuan"><input className="input input-bordered min-h-11 w-full" value={item.satuan} onChange={(event) => updateItem(index, "satuan", event.target.value)} /></FormField>
                            </div>
                            <FormField label="Urgensi"><select className="select select-bordered min-h-11 w-full" value={item.urgensi} onChange={(event) => updateItem(index, "urgensi", event.target.value)}><option value="rendah">Rendah</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option><option value="sangat_tinggi">Sangat Tinggi</option></select></FormField>
                            <FormField label="Link Referensi" className="md:col-span-2 lg:col-span-3"><input type="url" className="input input-bordered min-h-11 w-full" value={item.referensi_url} onChange={(event) => updateItem(index, "referensi_url", event.target.value)} placeholder="https://..." /></FormField>
                        </div>
                    </fieldset>
                ))}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onCancel}>Batal</Button><Button type="submit" loading={processing}>{submitLabel}</Button></footer>
        </form>
    );
}
