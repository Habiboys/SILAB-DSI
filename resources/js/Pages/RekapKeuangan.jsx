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
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Rekap Keuangan Bulanan
          </h2>
          <div className="flex gap-4 items-center">
            <select
              value={selectedTahun}
              onChange={handleTahunChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tahun</option>
              {tahunKepengurusan?.map((tahun) => (
                <option key={tahun.id} value={tahun.id}>
                  {tahun.tahun}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ringkasan Keuangan */}
        {kepengurusanlab && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-sm text-gray-500 mb-1">Total Saldo</div>
              <div className={`text-xl font-bold ${totalSaldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalSaldo)}
              </div>
            </div>      
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-sm text-gray-500 mb-1">Total Pemasukan</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalPemasukan)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <div className="text-sm text-gray-500 mb-1">Total Pengeluaran</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(totalPengeluaran)}</div>
            </div>
          </div>
        )}

        {/* Tabel */}
        <div className="overflow-x-auto">
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
        
      </div>
    </DashboardLayout>
  );
};

export default RekapKeuangan;