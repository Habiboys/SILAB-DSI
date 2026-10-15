import { Head, usePage } from "@inertiajs/react";

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

const columns = [
    { key: "no", header: "No", cellClassName: "text-base-content/60", render: (_item, index) => (index ?? 0) + 1 },
    { key: "nama_bulan", header: "Bulan" },
    { key: "tahun", header: "Tahun" },
    { key: "pemasukan", header: "Pemasukan", cellClassName: "font-medium text-success", render: (item) => formatCurrency(item.pemasukan) },
    { key: "pengeluaran", header: "Pengeluaran", cellClassName: "font-medium text-error", render: (item) => formatCurrency(item.pengeluaran) },
    { key: "saldo", header: "Saldo", cellClassName: "font-medium", render: (item) => <span className={item.saldo >= 0 ? "text-primary" : "text-error"}>{formatCurrency(item.saldo)}</span> },
];

const RekapKeuangan = ({ rekapKeuangan, kepengurusanlab, keuanganSummary }) => {
    const { selectedLab } = useLab();
    const { selected_kepengurusan } = usePage().props;
    const selectedTahunId = selected_kepengurusan?.id;

    const totalPemasukan = keuanganSummary?.totalPemasukan || 0;
    const totalPengeluaran = keuanganSummary?.totalPengeluaran || 0;
    const totalSaldo = keuanganSummary?.saldoAkhir || 0;

    return (
        <DashboardLayout>
            <Head title="Rekap Keuangan Bulanan" />

            <PageHeader title="Rekap Keuangan Bulanan" description="Ringkasan pemasukan, pengeluaran, dan saldo per bulan." />

            {kepengurusanlab && (
                <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Ringkasan keuangan">
                    <div className="border-b-2 border-info bg-base-100 px-4 py-3">
                        <div className="text-sm text-base-content/70">Saldo</div>
                        <div className={`mt-1 text-2xl font-bold ${totalSaldo >= 0 ? "text-info" : "text-error"}`}>{formatCurrency(totalSaldo)}</div>
                    </div>
                    <div className="border-b-2 border-success bg-base-100 px-4 py-3">
                        <div className="text-sm text-base-content/70">Total Pemasukan</div>
                        <div className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalPemasukan)}</div>
                    </div>
                    <div className="border-b-2 border-error bg-base-100 px-4 py-3">
                        <div className="text-sm text-base-content/70">Total Pengeluaran</div>
                        <div className="mt-1 text-2xl font-bold text-error">{formatCurrency(totalPengeluaran)}</div>
                    </div>
                </section>
            )}

            <PageSection bodyClassName="p-0 sm:p-0">
                <DataTable>
                    <DataTableHead>
                        <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
                    </DataTableHead>
                    <tbody>
                        {rekapKeuangan.length > 0 ? (
                            rekapKeuangan.map((item, index) => (
                                <tr key={`${item.tahun}-${item.bulan}`} className="hover">
                                    {columns.map((column) => (
                                        <td key={column.key} className={column.cellClassName ?? ""}>
                                            {column.render ? column.render(item, index) : item[column.key]}
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
