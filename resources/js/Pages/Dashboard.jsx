import React from 'react';
import DashboardLayout from '../Layouts/DashboardLayout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Bar, Doughnut, Line } from 'react-chartjs-2';
import { useLab } from '../Components/LabContext';
import { router } from '@inertiajs/react';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = ({ selectedLab, summaryData, inventarisPerLab, praktikumPerLab, jadwalPiketHariIni, ringkasanKeuangan, statistikAnggota, lastUpdate }) => {
  
  // Gunakan Lab Context yang sudah ada
  const { selectedLab: contextLab } = useLab();
  
  // Jika lab berubah dari navbar, reload dashboard dengan lab baru
  React.useEffect(() => {
    if (contextLab && (!selectedLab || contextLab.id !== selectedLab.id)) {
      router.get('/dashboard', { lab_id: contextLab.id }, { preserveState: true });
    }
  }, [contextLab]);
  
  // Summary Item Component
  const SummaryItem = ({ title, count, iconClass }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-gray-800 text-2xl font-bold">{count}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-full">
        <i className={`${iconClass} text-gray-600 text-xl`}></i>
      </div>
    </div>
  );

  // Prepare data for Inventaris chart
  const inventarisData = {
    labels: inventarisPerLab.map(lab => lab.nama_lab),
    datasets: [
      {
        label: 'Barang Baik',
        data: inventarisPerLab.map(lab => lab.barang_baik),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Barang Rusak',
        data: inventarisPerLab.map(lab => lab.barang_rusak),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ]
  };

  // Prepare data for Praktikum chart
  const praktikumData = {
    labels: praktikumPerLab.map(lab => lab.nama_lab),
    datasets: [
      {
        label: 'Total Praktikum',
        data: praktikumPerLab.map(lab => lab.total_praktikum),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Total Modul',
        data: praktikumPerLab.map(lab => lab.total_modul),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      }
    ]
  };

  // Prepare data for Keuangan doughnut chart
  const keuanganDonutData = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [
      {
        data: [
          ringkasanKeuangan.total_pemasukan || 0,
          ringkasanKeuangan.total_pengeluaran || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Keuangan line chart
  const keuanganLineData = {
    labels: ringkasanKeuangan.data_bulanan?.labels || [],
    datasets: [
      {
        label: 'Pemasukan',
        data: ringkasanKeuangan.data_bulanan?.pemasukan || [],
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
      {
        label: 'Pengeluaran',
        data: ringkasanKeuangan.data_bulanan?.pengeluaran || [],
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.4,
      }
    ]
  };

  // Prepare data for Anggota chart
  const anggotaData = {
    labels: statistikAnggota.map(stat => stat.status),
    datasets: [
      {
        data: statistikAnggota.map(stat => stat.total),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 10
        }
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Rp ' + value.toLocaleString();
          }
        }
      }
    }
  };

  const renderContent = () => {
    if (!selectedLab) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Silakan Pilih Laboratorium</h2>
          <p className="text-gray-600 mb-4">Pilih laboratorium dari dropdown di navbar untuk melihat data dashboard</p>
        </div>
      );
    }

    return (
      <>
        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <SummaryItem 
            title="Total Aset" 
            count={summaryData.total_aset}
            iconClass="fas fa-boxes"
          />
          <SummaryItem 
            title="Total Praktikum" 
            count={summaryData.total_praktikum}
            iconClass="fas fa-microscope"
          />
          <SummaryItem 
            title="Total Anggota" 
            count={summaryData.total_anggota}
            iconClass="fas fa-users"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {/* Keuangan Line Chart - 6 bulan terakhir */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-6">
            <h2 className="text-lg font-semibold mb-4">Laporan Keuangan - 6 Bulan Terakhir</h2>
            <div className="h-80">
              {ringkasanKeuangan.data_bulanan?.labels?.length > 0 ? (
                <Line data={keuanganLineData} options={lineOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">Belum ada data keuangan</p>
              )}
            </div>
          </div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Inventaris Per Lab */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Inventaris Lab {summaryData.nama_lab}</h2>
            <div className="h-72">
              {inventarisPerLab.length > 0 ? (
                <Bar data={inventarisData} options={barOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">Belum ada data inventaris</p>
              )}
            </div>
          </div>

          {/* Ringkasan Keuangan */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Ringkasan Keuangan</h2>
            <div className="h-72 flex flex-col">
              <div className="h-3/4">
                <Doughnut data={keuanganDonutData} options={pieOptions} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm">Pemasukan: <span className="font-semibold text-green-600">Rp {ringkasanKeuangan.total_pemasukan?.toLocaleString() || 0}</span></p>
                <p className="text-sm">Pengeluaran: <span className="font-semibold text-red-600">Rp {ringkasanKeuangan.total_pengeluaran?.toLocaleString() || 0}</span></p>
                <p className="text-sm">Saldo: <span className="font-semibold text-blue-600">Rp {ringkasanKeuangan.saldo?.toLocaleString() || 0}</span></p>
                <p className="text-sm mt-2">Total Transaksi: <span className="font-semibold">{ringkasanKeuangan.total_transaksi || 0}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Praktikum Per Lab */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Praktikum Lab {summaryData.nama_lab}</h2>
            <div className="h-72">
              {praktikumPerLab.length > 0 ? (
                <Bar data={praktikumData} options={barOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">Belum ada data praktikum</p>
              )}
            </div>
          </div>

          {/* Statistik Anggota */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Statistik Anggota</h2>
            <div className="h-72">
              {statistikAnggota.length > 0 ? (
                <Pie data={anggotaData} options={pieOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">Belum ada data anggota</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          {/* Jadwal Piket Hari Ini */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Jadwal Piket Hari Ini</h2>
              <a href="#" className="text-blue-500 text-sm hover:underline">Lihat Jadwal</a>
            </div>
            <div className="overflow-hidden">
              <div className="max-h-96 overflow-y-auto pr-2">
                {jadwalPiketHariIni.length > 0 ? (
                  jadwalPiketHariIni.map((jadwal) => (
                    <div key={jadwal.id} className="p-3 mb-2 hover:bg-gray-50 border-b border-gray-100 transition duration-150">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{jadwal.anggota.nama}</p>
                          <p className="text-xs text-gray-600 mt-1">Jabatan: {jadwal.anggota.jabatan}</p>
                          <p className="text-xs text-gray-600">Lab: {jadwal.lab}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mb-1">{jadwal.shift}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{jadwal.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Tidak ada jadwal piket hari ini</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mt-4 text-right">
          Terakhir diperbarui: {lastUpdate}
        </div>
      </>
    );
  };

  return (
    <DashboardLayout>
      {/* Judul Dashboard */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard {selectedLab ? `Laboratorium ${selectedLab.nama}` : ''}
        </h1>
      </div>
      
      {renderContent()}
      
      {/* Add Font Awesome for icons */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
        integrity="sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0v4LLanw2qksYuRlEzO+tcaEPQogQ0KaoGN26/zrn20ImR1DfuLWnOo7aBA==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />
    </DashboardLayout>
  );
};

export default Dashboard;