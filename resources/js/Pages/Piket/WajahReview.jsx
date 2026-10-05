import Button from "@/Components/Button";
import { DataGrid } from "@/Components/DataTable";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { confirmDialog } from "@/Components/confirmDialog";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";

export default function WajahReview({ enrollments }) {
    const decide = async (row, decision) => {
        if (!await confirmDialog({
            title: decision === "approve" ? "Setujui wajah" : "Tolak wajah",
            message: `${decision === "approve" ? "Aktifkan" : "Tolak"} data wajah ${row.name}?`,
            type: decision === "approve" ? "success" : "danger",
            confirmText: decision === "approve" ? "Setujui" : "Tolak",
        })) return;
        router.post(route("piket.wajah.decide", row.id), { decision });
    };

    const columns = [
        { header: "No", sortable: false, searchable: false, render: (_, index) => index + 1 },
        { key: "name", header: "Nama", sortable: true },
        { key: "email", header: "Email", sortable: true },
        { key: "created_at", header: "Diajukan", sortable: true, render: (row) => new Date(row.created_at).toLocaleString("id-ID") },
        { key: "photo", header: "Foto tinjauan", render: (row) => <img src={row.preview_url} alt={`Foto pendaftaran ${row.name}`} className="h-20 w-20 rounded-box object-cover" /> },
        { key: "actions", header: "Keputusan", render: (row) => <div className="flex flex-wrap gap-2"><Button type="button" variant="success" onClick={() => decide(row, "approve")}>Setujui</Button><Button type="button" variant="danger" onClick={() => decide(row, "reject")}>Tolak</Button></div> },
    ];

    return (
        <DashboardLayout>
            <Head title="Tinjauan Wajah" />
            <div className="space-y-6">
                <PageHeader title="Tinjauan Wajah" description="Pastikan wajah dan identitas pemohon sesuai sebelum menyetujui." />
                <PageSection>
                    <DataGrid rows={enrollments} columns={columns} searchPlaceholder="Cari nama atau email..." emptyMessage="Tidak ada pendaftaran yang menunggu." />
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
