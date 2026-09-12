import { router } from '@inertiajs/react';
import {
  Banknote,
  Beaker,
  CalendarDays,
  Box,
  Users,
} from 'lucide-react';
import Chart from 'react-apexcharts';
import React from 'react';
import { useLab } from '../Components/LabContext';
import Button from '../Components/Button';
import PageHeader from '../Components/PageHeader';
import PageSection from '../Components/PageSection';
import StatusBadge from '../Components/StatusBadge';
import DashboardLayout from '../Layouts/DashboardLayout';

const currency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const chartTheme = {
  chart: { toolbar: { show: false }, fontFamily: 'Figtree, sans-serif' },
  dataLabels: { enabled: false },
  grid: { borderColor: 'color-mix(in oklab, currentColor 14%, transparent)', strokeDashArray: 3 },
  legend: { position: 'top', horizontalAlign: 'left' },
  tooltip: { theme: 'light' },
};

const EmptyChart = ({ children }) => (
  <div className="flex h-64 items-center justify-center text-sm text-base-content/60">{children}</div>
);

const Panel = ({ title, subtitle, children, className = '' }) => (
  <PageSection title={title} description={subtitle} className={className} bodyClassName="space-y-4">
    {children}
  </PageSection>
);

const SummaryItem = ({ title, count, icon: Icon }) => (
  <div className="card border border-base-content/10 bg-base-100">
    <div className="card-body flex-row items-center gap-4 p-4 sm:p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-content">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-base-content/70">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-base-content">{count ?? 0}</p>
      </div>
    </div>
  </div>
);

const Dashboard = ({
  selectedLab,
  summaryData = {},
  inventarisPerLab = [],
  praktikumPerLab = [],
  jadwalPiketHariIni = [],
  ringkasanKeuangan = {},
  statistikAnggota = [],
  lastUpdate,
  kegiatanMendatang = [],
}) => {
  const { selectedLab: contextLab } = useLab();
  const currentSelectedLab = contextLab || selectedLab;

  React.useEffect(() => {
    if (!contextLab) return;

    const params = new URLSearchParams(window.location.search);
    const labId = params.get('lab_id');
    const kepengurusanLabId = params.get('kepengurusan_lab_id');

    if (
      (kepengurusanLabId && String(contextLab.kepengurusan_lab_id) === kepengurusanLabId) ||
      (!kepengurusanLabId && labId && String(contextLab.id) === labId)
    ) return;

    const query = contextLab.kepengurusan_lab_id
      ? { kepengurusan_lab_id: contextLab.kepengurusan_lab_id }
      : { lab_id: contextLab.id };

    router.get('/dashboard', query, { preserveState: true });
  }, [contextLab]);

  if (!currentSelectedLab) {
    return (
      <DashboardLayout>
        <div className="hero min-h-[55vh] rounded-box border border-base-content/10 bg-base-100">
          <div className="hero-content max-w-xl text-center">
            <div>
              <Beaker className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="mt-4 text-2xl font-bold text-base-content">Pilih laboratorium</h1>
              <p className="mt-2 text-base-content/70">Gunakan pemilih laboratorium pada bilah navigasi untuk membuka ringkasan operasional.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const financialLabels = ringkasanKeuangan.data_bulanan?.labels || [];
  const financialSeries = [
    { name: 'Pemasukan', data: ringkasanKeuangan.data_bulanan?.pemasukan || [] },
    { name: 'Pengeluaran', data: ringkasanKeuangan.data_bulanan?.pengeluaran || [] },
  ];
  const barOptions = (categories) => ({
    ...chartTheme,
    chart: { ...chartTheme.chart, stacked: false },
    colors: ['#1d4ed8', '#d97706'],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '48%' } },
    xaxis: { categories },
    yaxis: { min: 0, forceNiceScale: true },
  });
  const donutOptions = (labels) => ({
    ...chartTheme,
    labels,
    colors: ['#0f766e', '#b91c1c', '#1d4ed8', '#d97706'],
    legend: { position: 'bottom' },
    stroke: { colors: ['#ffffff'], width: 2 },
  });

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <PageHeader
          title={`Laboratorium ${currentSelectedLab.nama}`}
          description={lastUpdate ? `Diperbarui ${lastUpdate}` : undefined}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Ringkasan laboratorium">
          <SummaryItem title="Total aset" count={summaryData.total_aset} icon={Box} />
          <SummaryItem title="Total praktikum" count={summaryData.total_praktikum} icon={Beaker} />
          <SummaryItem title="Total anggota" count={summaryData.total_anggota} icon={Users} />
        </section>

        <Panel title="Arus kas enam bulan terakhir" subtitle="Perbandingan pemasukan dan pengeluaran per bulan">
          {financialLabels.length ? (
            <Chart
              type="area"
              height={320}
              series={financialSeries}
              options={{
                ...chartTheme,
                colors: ['#0f766e', '#b91c1c'],
                stroke: { curve: 'smooth', width: 3 },
                fill: { type: 'solid', opacity: 0.12 },
                xaxis: { categories: financialLabels },
                yaxis: { labels: { formatter: currency } },
              }}
            />
          ) : <EmptyChart>Belum ada transaksi untuk periode ini.</EmptyChart>}
        </Panel>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title={`Kondisi inventaris ${summaryData.nama_lab || ''}`} className="xl:col-span-2">
            {inventarisPerLab.length ? (
              <Chart
                type="bar"
                height={300}
                series={[
                  { name: 'Barang baik', data: inventarisPerLab.map((item) => item.barang_baik) },
                  { name: 'Barang rusak', data: inventarisPerLab.map((item) => item.barang_rusak) },
                ]}
                options={barOptions(inventarisPerLab.map((item) => item.nama_lab))}
              />
            ) : <EmptyChart>Belum ada data inventaris pada laboratorium ini.</EmptyChart>}
          </Panel>

          <Panel title="Ringkasan keuangan" subtitle={`Saldo saat ini ${currency(ringkasanKeuangan.saldo)}`}>
            {(ringkasanKeuangan.total_pemasukan || ringkasanKeuangan.total_pengeluaran) ? (
              <Chart
                type="donut"
                height={250}
                series={[ringkasanKeuangan.total_pemasukan || 0, ringkasanKeuangan.total_pengeluaran || 0]}
                options={donutOptions(['Pemasukan', 'Pengeluaran'])}
              />
            ) : <EmptyChart>Belum ada data keuangan.</EmptyChart>}
            <div className="stats stats-vertical border border-base-content/10 shadow-none">
              <div className="stat px-4 py-3"><div className="stat-title">Pemasukan</div><div className="stat-value text-lg text-success">{currency(ringkasanKeuangan.total_pemasukan)}</div></div>
              <div className="stat px-4 py-3"><div className="stat-title">Pengeluaran</div><div className="stat-value text-lg text-error">{currency(ringkasanKeuangan.total_pengeluaran)}</div></div>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title={`Aktivitas praktikum ${summaryData.nama_lab || ''}`} className="xl:col-span-2">
            {praktikumPerLab.length ? (
              <Chart
                type="bar"
                height={300}
                series={[
                  { name: 'Praktikum', data: praktikumPerLab.map((item) => item.total_praktikum) },
                  { name: 'Modul', data: praktikumPerLab.map((item) => item.total_modul) },
                ]}
                options={barOptions(praktikumPerLab.map((item) => item.nama_lab))}
              />
            ) : <EmptyChart>Belum ada data praktikum pada laboratorium ini.</EmptyChart>}
          </Panel>

          <Panel title="Komposisi anggota">
            {statistikAnggota.length ? (
              <Chart
                type="donut"
                height={300}
                series={statistikAnggota.map((item) => item.total)}
                options={donutOptions(statistikAnggota.map((item) => item.status))}
              />
            ) : <EmptyChart>Belum ada data anggota.</EmptyChart>}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Agenda terdekat" subtitle="Kegiatan yang sudah tercatat untuk periode mendatang">
            {kegiatanMendatang.length ? (
              <div className="divide-y divide-base-content/10">
                {kegiatanMendatang.map((kegiatan) => (
                  <article key={kegiatan.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base-content">{kegiatan.nama_kegiatan}</h3>
                      <p className="mt-1 text-sm text-base-content/70">{kegiatan.proker?.nama_proker}</p>
                      {kegiatan.deskripsi_kegiatan && <p className="mt-2 line-clamp-2 text-sm text-base-content/70">{kegiatan.deskripsi_kegiatan}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="badge badge-primary badge-outline gap-1">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        {new Date(kegiatan.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <StatusBadge status={kegiatan.status_approval} />
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyChart>Belum ada agenda kegiatan mendatang.</EmptyChart>}
            <Button href={route('kegiatan.index')} variant="ghost">Buka daftar kegiatan</Button>
          </Panel>

          <Panel title="Piket hari ini" subtitle="Anggota yang dijadwalkan bertugas">
            {jadwalPiketHariIni.length ? (
              <div className="max-h-96 divide-y divide-base-content/10 overflow-y-auto">
                {jadwalPiketHariIni.map((jadwal) => (
                  <div key={jadwal.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                    <div>
                      <p className="font-semibold text-base-content">{jadwal.anggota.nama}</p>
                      <p className="mt-1 text-sm text-base-content/70">{jadwal.anggota.jabatan} · {jadwal.lab}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="badge badge-primary badge-outline">{jadwal.shift}</span>
                      <StatusBadge status={jadwal.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyChart>Tidak ada jadwal piket hari ini.</EmptyChart>}
            <Button href="/piket/jadwal" variant="ghost">Buka jadwal piket</Button>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
