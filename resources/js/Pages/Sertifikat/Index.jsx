import Button from "@/Components/Button";
import { ServerDataTable } from "@/Components/DataTable";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const JENIS_LABELS = {
    praktikan: "Praktikan",
    asisten: "Asisten",
    kepengurusan: "Kepengurusan",
    kegiatan: "Kegiatan",
};

export default function SertifikatIndex({ sertifikats, laboratories, praktikums, filters, flash }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [jenisFilter, setJenisFilter] = useState(filters.jenis_sertifikat || "");
    const [labFilter, setLabFilter] = useState(filters.laboratory_id || "");
    const [praktikumFilter, setPraktikumFilter] = useState(filters.praktikum_id || "");
    const [tglAwal, setTglAwal] = useState(filters.tanggal_awal || "");
    const [tglAkhir, setTglAkhir] = useState(filters.tanggal_akhir || "");
    const [perPage, setPerPage] = useState(filters.perPage || 15);

    const applyFilters = useCallback(
        debounce((overrides = {}) => {
            const params = {
                search: (overrides.search ?? searchTerm) || undefined,
                jenis_sertifikat: (overrides.jenis ?? jenisFilter) || undefined,
                laboratory_id: (overrides.lab ?? labFilter) || undefined,
                praktikum_id: (overrides.praktikum ?? praktikumFilter) || undefined,
                tanggal_awal: (overrides.tglAwal ?? tglAwal) || undefined,
                tanggal_akhir: (overrides.tglAkhir ?? tglAkhir) || undefined,
                perPage: overrides.perPage ?? perPage,
            };
            router.get(route("sertifikat.all"), params, { preserveState: true, preserveScroll: true });
        }, 400),
        [searchTerm, jenisFilter, labFilter, praktikumFilter, tglAwal, tglAkhir, perPage],
    );

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        applyFilters({ search: event.target.value });
    };

    const handleFilterChange = (key, setter) => (event) => {
        setter(event.target.value);
        applyFilters({ [key]: event.target.value });
    };

    const handlePerPageChange = (event) => {
        const value = parseInt(event.target.value);
        setPerPage(value);
        applyFilters({ perPage: value });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setJenisFilter("");
        setLabFilter("");
        setPraktikumFilter("");
        setTglAwal("");
        setTglAkhir("");
        router.get(route("sertifikat.all"), {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = ["search", "jenis_sertifikat", "laboratory_id", "praktikum_id", "tanggal_awal", "tanggal_akhir"].some((key) => filters[key]);

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const formatDate = (date) => (date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-");

    const columns = [
        { key: "nomor_sertifikat", header: "Nomor sertifikat", cellClassName: "font-mono" },
        { key: "user.name", header: "User", render: (s) => <div><div className="font-medium">{s.user?.name || "-"}</div><div className="text-xs text-base-content/60">{s.user?.email || ""}</div></div> },
        { key: "jenis_sertifikat", header: "Jenis", render: (s) => <StatusBadge status={s.jenis_sertifikat} label={JENIS_LABELS[s.jenis_sertifikat] || s.jenis_sertifikat} /> },
        {
            header: "Praktikum / lab",
            searchable: false,
            render: (s) => s.praktikum ? s.praktikum.mata_kuliah : s.kepengurusan_lab?.laboratorium ? `${s.kepengurusan_lab.laboratorium.nama} (kepengurusan)` : "-",
        },
        { key: "tanggal_terbit", header: "Tanggal terbit", render: (s) => formatDate(s.tanggal_terbit) },
        { header: "Aksi", sortable: false, searchable: false, headerClassName: "text-right", render: (s) => <Button href={route("sertifikat.download", s.id)} variant="ghost" size="sm"><Download className="h-4 w-4" />Unduh</Button> },
    ];

    return (
        <DashboardLayout>
            <Head title="Manajemen Sertifikat" />
            <PageHeader
                title="Manajemen Sertifikat"
                description={`Semua sertifikat yang diterbitkan di sistem. ${sertifikats.total} sertifikat.`}
                actions={hasActiveFilters && <Button variant="ghost" onClick={clearFilters}>Hapus filter</Button>}
            />
            <PageSection>
                <ServerDataTable
                    paginator={sertifikats}
                    columns={columns}
                    search={searchTerm}
                    onSearchChange={handleSearch}
                    searchPlaceholder="Cari nama atau email..."
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    filters={[
                        {
                            key: "jenis",
                            label: "Jenis",
                            control: (
                                <select className="select select-bordered min-h-11" value={jenisFilter} onChange={handleFilterChange("jenis", setJenisFilter)}>
                                    <option value="">Semua</option>
                                    {Object.entries(JENIS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            ),
                        },
                        {
                            key: "lab",
                            label: "Laboratorium",
                            control: (
                                <select className="select select-bordered min-h-11" value={labFilter} onChange={handleFilterChange("lab", setLabFilter)}>
                                    <option value="">Semua</option>
                                    {laboratories.map((lab) => <option key={lab.id} value={lab.id}>{lab.nama}</option>)}
                                </select>
                            ),
                        },
                        {
                            key: "praktikum",
                            label: "Praktikum",
                            control: (
                                <select className="select select-bordered min-h-11" value={praktikumFilter} onChange={handleFilterChange("praktikum", setPraktikumFilter)}>
                                    <option value="">Semua</option>
                                    {praktikums.map((praktikum) => <option key={praktikum.id} value={praktikum.id}>{praktikum.mata_kuliah}</option>)}
                                </select>
                            ),
                        },
                        {
                            key: "tglAwal",
                            label: "Tanggal awal",
                            control: <input type="date" className="input input-bordered min-h-11" value={tglAwal} onChange={handleFilterChange("tglAwal", setTglAwal)} />,
                        },
                        {
                            key: "tglAkhir",
                            label: "Tanggal akhir",
                            control: <input type="date" className="input input-bordered min-h-11" value={tglAkhir} onChange={handleFilterChange("tglAkhir", setTglAkhir)} />,
                        },
                    ]}
                    emptyMessage="Tidak ada sertifikat ditemukan."
                />
            </PageSection>
        </DashboardLayout>
    );
}
