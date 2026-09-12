import AsetDrawer from "@/Components/AsetDrawer";
import Button from "@/Components/Button";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { FileDown, ImageOff, Printer, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const KEADAAN_TONE = { baik: "success", rusak: "error", hilang: "neutral" };
const KEADAAN_LABEL = { baik: "Baik", rusak: "Rusak", hilang: "Hilang" };

export default function InventarisIndex({
    kepengurusanlab,
    inventaris,
    categories,
    approvedWishlist = [],
    filters = {},
    flash = {},
}) {
    const { auth } = usePage().props;
    const { can } = usePermission();
    const canManageItems = can("inventaris.manage-items");
    const canManageKategori = can("inventaris.manage-kategori");
    const canDelete = canManageItems;

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(filters.kategori_id || "");
    const [perPage, setPerPage] = useState(Number(filters.perPage || 10));
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isLabelConfigModalOpen, setIsLabelConfigModalOpen] = useState(false);
    const [labelConfigMode, setLabelConfigMode] = useState("selected");
    const [labelConfig, setLabelConfig] = useState({ layout: "standard", show_qr: true });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAsetDrawerOpen, setIsAsetDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const applyFilters = debounce((search, category, pageLimit) => {
        router.get(
            route("inventaris.index"),
            { search, kategori_id: category, perPage: pageLimit, lab_id: filters.lab_id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, 300);

    const onSearchChange = (event) => {
        setSearchTerm(event.target.value);
        applyFilters(event.target.value, selectedCategory, perPage);
    };
    const onCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
        applyFilters(searchTerm, event.target.value, perPage);
    };
    const onPerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        applyFilters(searchTerm, selectedCategory, event.target.value);
    };

    const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedIds(selectedIds.length === inventaris.data.length ? [] : inventaris.data.map((item) => item.id));

    const executeBulkDelete = () => {
        router.post(route("detail-inventaris.bulk-delete"), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsBulkDeleteModalOpen(false);
                toast.success("Aset terpilih berhasil dihapus");
            },
            preserveScroll: true,
        });
    };

    const handleDownloadLabels = () => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("detail-inventaris.batch-labels");
        form.target = "_blank";
        const append = (name, value) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };
        append("_token", document.querySelector('meta[name="csrf-token"]').getAttribute("content"));
        append("scope", labelConfigMode);
        if (labelConfigMode === "selected") {
            selectedIds.forEach((id) => append("ids[]", id));
        } else {
            if (searchTerm) append("search", searchTerm);
            if (selectedCategory) append("kategori_id", selectedCategory);
            if (filters.lab_id) append("lab_id", filters.lab_id);
        }
        append("layout", labelConfig.layout);
        append("show_qr", labelConfig.show_qr ? "1" : "0");
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        setIsLabelConfigModalOpen(false);
        if (labelConfigMode === "selected") setSelectedIds([]);
    };

    const createForm = useForm({
        kategori_aset_id: "",
        laboratorium_id: filters.lab_id || "",
        nama: "",
        kode_barang: "",
        keadaan: "baik",
        status: "tersedia",
        keterangan: "",
        tanggal_perolehan: "",
        harga_perolehan: "",
        asal_barang: "",
        wishlist_aset_id: "",
        foto: null,
    });

    const handleCreateSubmit = (event) => {
        event.preventDefault();
        createForm.post(route("detail-inventaris.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
                toast.success("Aset berhasil ditambahkan");
            },
            onError: (formErrors) => toast.error(Object.values(formErrors).find(Boolean) || "Gagal menambahkan aset"),
        });
    };

    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={inventaris.data.length > 0 && selectedIds.length === inventaris.data.length}
                    onChange={toggleSelectAll}
                    aria-label="Pilih semua aset di halaman ini"
                />
            ),
            headerClassName: "w-10",
            sortable: false,
            searchable: false,
            render: (item) => (
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    aria-label={`Pilih ${item.nama || item.kode_barang}`}
                />
            ),
        },
        { header: "No", sortable: false, render: (_, index) => index + 1 },
        { key: "nama", header: "Nama Barang", render: (item) => item.nama || "-" },
        {
            header: "Foto",
            render: (item) => item.foto
                ? <img src={`/storage/${item.foto}`} alt={`Foto ${item.kode_barang}`} className="h-10 w-10 rounded object-cover" />
                : <span className="flex h-10 w-10 items-center justify-center rounded bg-base-200 text-base-content/50"><ImageOff className="h-5 w-5" aria-hidden="true" /></span>,
        },
        { key: "kode_barang", header: "Kode Barang" },
        { key: "kategori_aset.nama", header: "Kategori", render: (item) => item.kategori_aset?.nama || "-" },
        { key: "keadaan", header: "Kondisi", render: (item) => <StatusBadge status={item.keadaan} tone={KEADAAN_TONE[item.keadaan]} label={KEADAAN_LABEL[item.keadaan] ?? item.keadaan} /> },
        { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} tone={item.status === "tersedia" ? "info" : "warning"} label={item.status === "tersedia" ? "Tersedia" : "Dipinjam"} /> },
        {
            header: "QR Code",
            render: (item) => item.qr_code_path
                ? <img src={`/storage/${item.qr_code_path}`} alt={`QR ${item.kode_barang}`} className="h-10 w-10 rounded border border-base-300" />
                : <span className="text-xs text-base-content/60">Belum ada</span>,
        },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            render: (item) => <Button variant="ghost" onClick={() => { setSelectedItem(item); setIsAsetDrawerOpen(true); }}>Detail dan Aksi</Button>,
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Daftar Inventaris" />
            <PageHeader
                title="Daftar Aset Laboratorium"
                description={kepengurusanlab?.laboratorium?.nama ? `Laboratorium ${kepengurusanlab.laboratorium.nama}` : "Kelola aset laboratorium beserta label dan QR code."}
                actions={<>
                    {canManageItems && <Button onClick={() => setIsCreateModalOpen(true)}>Tambah Aset</Button>}
                    <Button variant="ghost" href={route("inventaris.export-excel", { lab_id: filters.lab_id })}><FileDown className="h-4 w-4" /> Export Excel</Button>
                    <Button variant="ghost" onClick={() => { setLabelConfigMode("all"); setIsLabelConfigModalOpen(true); }}><Printer className="h-4 w-4" /> Download Semua Label</Button>
                    {canManageKategori && <Button variant="ghost" href={route("data-master.kategori-aset.index")}>Kelola Kategori</Button>}
                </>}
            />

            {selectedIds.length > 0 && (
                <div className="mb-4 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">{selectedIds.length} aset terpilih</span>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" onClick={() => { setLabelConfigMode("selected"); setIsLabelConfigModalOpen(true); }}><Printer className="h-4 w-4" /> Download Label</Button>
                        {canDelete && <Button variant="danger" onClick={() => setIsBulkDeleteModalOpen(true)}><Trash2 className="h-4 w-4" /> Hapus</Button>}
                        <Button variant="ghost" onClick={() => setSelectedIds([])}>Batal Pilih</Button>
                    </div>
                </div>
            )}

            <PageSection bodyClassName="p-4 sm:p-5">
                <ServerDataTable
                    paginator={inventaris}
                    columns={columns}
                    search={searchTerm}
                    onSearchChange={onSearchChange}
                    searchPlaceholder="Cari kode barang atau nama kategori..."
                    perPage={perPage}
                    onPerPageChange={onPerPageChange}
                    filters={[
                        {
                            key: "kategori_id",
                            label: "Kategori",
                            control: (
                                <select className="select select-bordered min-h-11" value={selectedCategory} onChange={onCategoryChange}>
                                    <option value="">Semua</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.nama}</option>)}
                                </select>
                            ),
                        },
                    ]}
                    emptyMessage={searchTerm || selectedCategory ? "Tidak ada aset yang cocok dengan pencarian atau filter." : "Belum ada data aset."}
                />
            </PageSection>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleCreateSubmit} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">Tambah Aset Baru</h2></header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Kategori Aset" error={createForm.errors.kategori_aset_id} required><select className="select select-bordered min-h-11 w-full" value={createForm.data.kategori_aset_id} onChange={(event) => createForm.setData("kategori_aset_id", event.target.value)} required><option value="">Pilih Kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nama}</option>)}</select></FormField>
                        <FormField label="Nama Barang" error={createForm.errors.nama} hint="Opsional jika sama dengan kategori."><input className="input input-bordered min-h-11 w-full" value={createForm.data.nama} onChange={(event) => createForm.setData("nama", event.target.value)} /></FormField>
                        <FormField label="Kode Barang" error={createForm.errors.kode_barang} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.kode_barang} onChange={(event) => createForm.setData("kode_barang", event.target.value)} required /></FormField>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Tanggal Perolehan" error={createForm.errors.tanggal_perolehan}><input type="date" className="input input-bordered min-h-11 w-full" value={createForm.data.tanggal_perolehan} onChange={(event) => createForm.setData("tanggal_perolehan", event.target.value)} /></FormField>
                            <FormField label="Harga Perolehan (Rp)" error={createForm.errors.harga_perolehan}><input type="number" min="0" className="input input-bordered min-h-11 w-full" value={createForm.data.harga_perolehan} onChange={(event) => createForm.setData("harga_perolehan", event.target.value)} /></FormField>
                        </div>
                        <FormField label="Asal Barang" error={createForm.errors.asal_barang}><select className="select select-bordered min-h-11 w-full" value={createForm.data.asal_barang} onChange={(event) => createForm.setData("asal_barang", event.target.value)}><option value="">Pilih asal barang</option><option value="pengadaan">Pengadaan</option><option value="hibah">Hibah</option><option value="pembelian_mandiri">Pembelian Mandiri</option><option value="lainnya">Lainnya</option></select></FormField>
                        <FormField label="Dari Permohonan atau Wishlist" error={createForm.errors.wishlist_aset_id} hint="Pilih jika barang ini realisasi dari permohonan yang disetujui."><select className="select select-bordered min-h-11 w-full" value={createForm.data.wishlist_aset_id} onChange={(event) => createForm.setData("wishlist_aset_id", event.target.value)}><option value="">Tidak dari permohonan</option>{approvedWishlist.map((wishlist) => <option key={wishlist.id} value={wishlist.id}>{wishlist.nama_barang} {wishlist.permohonan_aset?.nomor_permohonan ? `(${wishlist.permohonan_aset.nomor_permohonan})` : ""}</option>)}</select></FormField>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField label="Kondisi" error={createForm.errors.keadaan}><select className="select select-bordered min-h-11 w-full" value={createForm.data.keadaan} onChange={(event) => createForm.setData("keadaan", event.target.value)}><option value="baik">Baik</option><option value="rusak">Rusak</option><option value="hilang">Hilang</option></select></FormField>
                            <FormField label="Status" error={createForm.errors.status}><select className="select select-bordered min-h-11 w-full" value={createForm.data.status} onChange={(event) => createForm.setData("status", event.target.value)}><option value="tersedia">Tersedia</option><option value="dipinjam">Dipinjam</option></select></FormField>
                        </div>
                        <FormField label="Keterangan" error={createForm.errors.keterangan}><textarea className="textarea textarea-bordered min-h-20 w-full" value={createForm.data.keterangan} onChange={(event) => createForm.setData("keterangan", event.target.value)} /></FormField>
                        <FormField label="Foto" error={createForm.errors.foto}><input type="file" accept="image/*" className="file-input file-input-bordered min-h-11 w-full" onChange={(event) => createForm.setData("foto", event.target.files[0])} /></FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Batal</Button><Button type="submit" loading={createForm.processing}>Simpan</Button></footer>
                </form>
            </Modal>

            <Modal show={isLabelConfigModalOpen} onClose={() => setIsLabelConfigModalOpen(false)} maxWidth="sm">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Konfigurasi Label ({labelConfigMode === "all" ? "Semua Data" : `${selectedIds.length} Item`})</h2>
                    <p className="mt-1 text-sm text-base-content/70">Atur tampilan label sebelum mengunduh.</p>
                    <FormField label="Ukuran atau Layout" className="mt-4">
                        <div className="space-y-2">
                            {[
                                { value: "standard", label: "Standar (3 kolom), sekitar 7 cm" },
                                { value: "medium", label: "Medium (4 kolom), sekitar 5 cm" },
                                { value: "small", label: "Kecil (5 kolom), sekitar 4 cm" },
                                { value: "mini", label: "Mini (6 kolom), sekitar 3,3 cm" },
                            ].map((option) => (
                                <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2">
                                    <input type="radio" name="layout" className="radio radio-sm" value={option.value} checked={labelConfig.layout === option.value} onChange={(event) => setLabelConfig({ ...labelConfig, layout: event.target.value })} />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FormField>
                    <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-2">
                        <input type="checkbox" className="checkbox checkbox-sm" checked={labelConfig.show_qr} onChange={(event) => setLabelConfig({ ...labelConfig, show_qr: event.target.checked })} />
                        <span className="text-sm">Tampilkan QR Code</span>
                    </label>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsLabelConfigModalOpen(false)}>Batal</Button><Button onClick={handleDownloadLabels}>Download PDF</Button></div>
                </div>
            </Modal>

            <Modal show={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} maxWidth="md">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Hapus Aset Massal</h2>
                    <p className="mt-2 text-sm text-base-content/70">Apakah Anda yakin ingin menghapus <strong>{selectedIds.length} aset</strong> terpilih? Semua data termasuk foto dan QR code akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsBulkDeleteModalOpen(false)}>Batal</Button><Button variant="danger" onClick={executeBulkDelete}>Hapus {selectedIds.length} Aset</Button></div>
                </div>
            </Modal>

            {isAsetDrawerOpen && selectedItem && (
                <AsetDrawer
                    item={selectedItem}
                    canUpdate={canManageItems}
                    canDelete={canDelete}
                    onClose={() => {
                        setIsAsetDrawerOpen(false);
                        setSelectedItem(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
}
