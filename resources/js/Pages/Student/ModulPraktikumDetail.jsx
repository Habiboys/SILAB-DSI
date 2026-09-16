import Button from "@/Components/Button";
import { DataGrid } from "@/Components/DataTable";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import { ArrowLeft, Eye, FileText } from "lucide-react";

export default function ModulPraktikumDetail({ praktikum, modulPraktikum = [] }) {
    const columns = [
        {
            key: "judul",
            header: "Judul Modul",
            filter: { type: "text" },
            render: (modul) => (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-medium">{modul.judul}</span>
                </div>
            ),
        },
        {
            key: "pertemuan.judul",
            header: "Pertemuan",
            filter: { type: "text" },
            render: (modul) => modul.pertemuan?.judul || `Pertemuan ${modul.pertemuan_id || "-"}`,
        },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            headerClassName: "text-right",
            cellClassName: "text-right",
            render: (modul) => (
                <Button
                    href={route("praktikum.modul.view", { praktikum: praktikum.id, modul: modul.id })}
                    variant="ghost"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Lihat Modul
                </Button>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title={`Modul ${praktikum?.mata_kuliah || "Praktikum"}`} />
            <PageHeader
                title={`Modul ${praktikum?.mata_kuliah || "Praktikum"}`}
                description="Materi praktikum yang tersedia untuk kelas Anda."
                actions={
                    <Button href={route("praktikan.daftar-tugas")} variant="ghost">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Kembali ke kelas
                    </Button>
                }
            />
            <PageSection bodyClassName="p-0 sm:p-0">
                <DataGrid
                    rows={modulPraktikum}
                    columns={columns}
                    searchPlaceholder="Cari judul modul atau pertemuan..."
                    emptyMessage="Belum ada modul untuk kelas praktikum ini."
                />
            </PageSection>
        </DashboardLayout>
    );
}
