import React, { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const RekapKeuangan = ({ 
  rekapKeuangan, 
  kepengurusanlab, 
  tahunKepengurusan, 
  filters, 
  flash,
  keuanganSummary 
}) => {
  const { selectedLab } = useLab();
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");

  // Ensure tahunKepengurusan is always an array
  const tahunKepengurusanArray = Array.isArray(tahunKepengurusan) ? tahunKepengurusan : [];

  const totalPemasukan = keuanganSummary?.totalPemasukan || 0;
  const totalPengeluaran = keuanganSummary?.totalPengeluaran || 0;
  const totalSaldo = keuanganSummary?.saldoAkhir || 0;

  // Format currency
  const formatCurrency = (amount) => {
    // Ensure amount is a number
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "Rp 0";
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Handler untuk perubahan tahun
  const handleTahunChange = (e) => {
    setSelectedTahun(e.target.value);
  };

  // Menampilkan flash message
  useEffect(() => {
    if (flash && flash.message) {
      toast.success(flash.message);
    }
    if (flash && flash.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Update data ketika laboratorium atau tahun diubah
  useEffect(() => {
    if (selectedLab) {
      router.visit("/rekap-keuangan", {
        data: {
          lab_id: selectedLab.id,
          tahun_id: selectedTahun,
        },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab, selectedTahun]);

  // Array nama bulan dalam bahasa Indonesia
  const bulanIndonesia = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <DashboardLayout>
      <Head title="Rekap Keuangan Bulanan" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center border-b space-y-4 lg:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">
            Rekap Keuangan Bulanan
          </h2>
          <div className="flex gap-4 items-center w-full lg:w-auto">
            <div className="w-full sm:w-auto">
              <select
                value={selectedTahun}
                onChange={handleTahunChange}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Tahun</option>
                {tahunKepengurusanArray.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>
                    {tahun.tahun}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ringkasan Keuangan */}
        {kepengurusanlab && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-sm text-gray-500 mb-1">Total Saldo</div>
              <div className={`text-lg lg:text-xl font-bold ${totalSaldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalSaldo)}
              </div>
            </div>      
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-sm text-gray-500 mb-1">Total Pemasukan</div>
              <div className="text-lg lg:text-xl font-bold text-green-600">{formatCurrency(totalPemasukan)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 sm:col-span-2 lg:col-span-1">
              <div className="text-sm text-gray-500 mb-1">Total Pengeluaran</div>
              <div className="text-lg lg:text-xl font-bold text-red-600">{formatCurrency(totalPengeluaran)}</div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pemasukan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengeluaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rekapKeuangan.length > 0 ? (
                rekapKeuangan.map((item, index) => (
                  <tr key={`${item.tahun}-${item.bulan}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.nama_bulan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.tahun}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(item.pemasukan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(item.pengeluaran)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.saldo >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.saldo)}
                    </td>
                  </tr>
                ))
              ) : (
                (!rekapKeuangan.length && selectedLab && selectedTahun) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center">
                        <p>Tidak ada data keuangan</p>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 p-4">
          {rekapKeuangan.length > 0 ? (
            rekapKeuangan.map((item, index) => (
              <div key={`${item.tahun}-${item.bulan}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {item.nama_bulan} {item.tahun}
                    </h3>
                    <div className="text-sm text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pemasukan:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(item.pemasukan)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pengeluaran:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(item.pengeluaran)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">Saldo:</span>
                    <span className={`text-sm font-bold ${
                      item.saldo >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.saldo)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            (!rekapKeuangan.length && selectedLab && selectedTahun) && (
              <div className="text-center py-8 text-gray-600 text-lg bg-white rounded-lg shadow-sm">
                Tidak ada data keuangan
              </div>
            )
          )}
        </div>
        
      </div>
    </DashboardLayout>
  );
};

export default RekapKeuangan;