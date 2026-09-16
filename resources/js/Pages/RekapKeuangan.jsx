import { Head, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { DataTable, DataTableEmpty, DataTableHead } from "@/Components/DataTable";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { useLab } from "../Components/LabContext";
import DashboardLayout from "../Layouts/DashboardLayout";

const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numAmount);
};

const SummaryCard = ({ label, value, tone = "text-primary", border = "border-primary" }) => (
    <div className={`rounded-lg border-l-4 bg-base-100 p-4 shadow-sm ${border}`}>
        <div className="mb-1 text-sm text-base-content/60">{label}</div>
        <div className={`text-lg font-bold lg:text-xl ${tone}`}>{value}</div>
    </div>
);

const columns = [
    { key: "no", header: "No", cellClassName: "text-base-content/60", render: (_item, index) => index + 1 },
    { key: "nama_bulan", header: "Bulan" },
    { key: "tahun", header: "Tahun" },
    { key: "pemasukan", header: "Pemasukan", cellClassName: "font-medium text-success", render: (item) => formatCurrency(item.pemasukan) },
    { key: "pengeluaran", header: "Pengeluaran", cellClassName: "font-medium text-error", render: (item) => formatCurrency(item.pengeluaran) },
    { key: "saldo", header: "Saldo", cellClassName: "font-medium", render: (item) => <span className={item.saldo >= 0 ? "text-primary" : "text-error"}>{formatCurrency(item.saldo)}</span> },
];

const RekapKeuangan = ({ rekapKeuangan, kepengurusanlab, flash, keuanganSummary }) => {
    const { selectedLab } = useLab();
    const { selected_kepengurusan } = usePage().props;
    const selectedTahunId = selected_kepengurusan?.id;

    const totalPemasukan = keuanganSummary?.totalPemasukan || 0;
    const totalPengeluaran = keuanganSummary?.totalPengeluaran || 0;
    const totalSaldo = keuanganSummary?.saldoAkhir || 0;

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <DashboardLayout>
            <Head title="Rekap Keuangan Bulanan" />

            <PageHeader title="Rekap Keuangan Bulanan" />

            {kepengurusanlab && (
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <SummaryCard label="Total Saldo" value={formatCurrency(totalSaldo)} tone={totalSaldo >= 0 ? "text-primary" : "text-error"} />
                    <SummaryCard label="Total Pemasukan" value={formatCurrency(totalPemasukan)} tone="text-success" border="border-success" />
                    <SummaryCard label="Total Pengeluaran" value={formatCurrency(totalPengeluaran)} tone="text-error" border="border-error" />
                </div>
            )}

            <PageSection bodyClassName="p-0 sm:p-0">
                <DataTable>
                    <DataTableHead>
                        <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
                    </DataTableHead>
                    <tbody>
                        {rekapKeuangan.length > 0 ? (
                            rekapKeuangan.map((item) => (
                                <tr key={`${item.tahun}-${item.bulan}`} className="hover">
                                    {columns.map((column) => (
                                        <td key={column.key} className={column.cellClassName ?? ""}>
                                            {column.render ? column.render(item) : item[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <DataTableEmpty colSpan={columns.length} message="Tidak ada data keuangan." />
                        )}
                    </tbody>
                </DataTable>
            </PageSection>

            {!rekapKeuangan.length && selectedLab && selectedTahunId && (
                <p className="mt-4 text-center text-base-content/70">
                    Pilih periode kepengurusan lain untuk melihat rekap keuangan.
                </p>
            )}
        </DashboardLayout>
    );
};

export default RekapKeuangan;
