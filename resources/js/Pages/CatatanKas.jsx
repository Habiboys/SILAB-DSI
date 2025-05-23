import React, { useState, useEffect, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useLab } from "../Components/LabContext";

const CatatanKas = ({ 
  catatanKas, 
  anggota,
  tahunKepengurusan,
  laboratorium,
  bulanData,
  kepengurusanlab,
  filters, 
  flash
}) => {
  const { selectedLab} = useLab();
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");
  
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
      router.visit("/catatan-kas", {
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

  // Helper function to determine if a month and week has passed
  const hasDatePassed = (bulanStr, minggu) => {
    const currentDate = new Date();
    
    // Parse the month string (format: "Mar 2023")
    const [monthAbbr, yearStr] = bulanStr.split(' ');
    const year = parseInt(yearStr);
    
    // Convert month abbreviation to month number (0-indexed)
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const month = monthMap[monthAbbr];
    if (month === undefined) return false;
    
    // Get current month and year
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // If comparing different years
    if (year < currentYear) {
      return true; 
    } else if (year > currentYear) {
      return false; 
    }
    
    // Same year, check month
    if (month < currentMonth) {
      return true; // Past month always shows
    } else if (month > currentMonth) {
      return false; // Future month never shows
    }
    
    // Same month, check week
    // Assuming each week is roughly 7 days
    const currentWeek = Math.ceil(currentDay / 7);
    return minggu <= currentWeek;
  };
  
  // Memproses data pembayaran untuk efisiensi pemrosesan
  const processedData = useMemo(() => {
    // Buat object untuk menyimpan data pembayaran per user
    const userPayments = {};
    
    // Inisialisasi data untuk setiap user
    anggota.forEach(user => {
      userPayments[user.id] = {
        name: user.name,
        totalPayments: 0,
        payments: {}
      };
      
      // Inisialisasi data bulan dan minggu
      Object.keys(bulanData).forEach(bulan => {
        userPayments[user.id].payments[bulan] = {
          1: false,
          2: false,
          3: false,
          4: false
        };
      });
    });
    
    // Proses data pembayaran
    catatanKas.forEach(payment => {
      if (userPayments[payment.user_id]) {
        // Tandai pembayaran untuk bulan dan minggu ini
        if (userPayments[payment.user_id].payments[payment.bulan]) {
          userPayments[payment.user_id].payments[payment.bulan][payment.minggu] = true;
        }
        // Increment jumlah total pembayaran
        userPayments[payment.user_id].totalPayments++;
      }
    });
    
    return userPayments;
  }, [anggota, bulanData, catatanKas]);

  // Function to render payment status cell
  const renderStatusCell = (userId, bulan, minggu) => {
    const hasPaid = processedData[userId]?.payments[bulan]?.[minggu] || false;
    const isPastDate = hasDatePassed(bulan, minggu);
    
    // Jika sudah bayar (kapan pun tanggalnya): Tampilkan centang
    if (hasPaid) {
      return (
        <td key={`${userId}-${bulan}-${minggu}`} className="px-3 py-2 text-center">
          <div className="flex justify-center">
            <span className="bg-green-100 text-green-800 p-1 rounded-full">
              <FaCheck className="text-green-600" />
            </span>
          </div>
        </td>
      );
    }
    
    // Jika belum bayar tapi tanggalnya sudah lewat: Tampilkan silang
    if (isPastDate) {
      return (
        <td key={`${userId}-${bulan}-${minggu}`} className="px-3 py-2 text-center">
          <div className="flex justify-center">
            <span className="bg-red-100 text-red-800 p-1 rounded-full">
              <FaTimes className="text-red-600" />
            </span>
          </div>
        </td>
      );
    }
    
    // Jika belum bayar dan tanggalnya belum lewat: Tampilkan kosong
    return (
      <td key={`${userId}-${bulan}-${minggu}`} className="px-3 py-2 text-center">
        {/* Empty cell for future dates */}
      </td>
    );
  };

  return (
    <DashboardLayout>
      <Head title="Catatan Kas" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Catatan Uang Kas
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

        {/* Status Tampilan */}
        {!selectedLab && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih laboratorium terlebih dahulu
          </div>
        )}
        
        {selectedLab && !selectedTahun && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih tahun untuk melihat data
          </div>
        )}

        {selectedLab && selectedTahun && anggota.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data asisten untuk laboratorium dan tahun yang dipilih
          </div>
        )}

        {/* Tabel */}
        {selectedLab && selectedTahun && anggota.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Asisten
                  </th>
                  
                  {Object.keys(bulanData).map(bulan => (
                    <th 
                      key={bulan}
                      colSpan={4} 
                      className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                    >
                      {bulan}
                    </th>
                  ))}
                  
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                    Total
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    &nbsp;
                  </th>
                  
                  {Object.keys(bulanData).map(bulan => (
                    <React.Fragment key={`minggu-${bulan}`}>
                      {[1, 2, 3, 4].map(minggu => (
                        <th 
                          key={`${bulan}-${minggu}`} 
                          className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                        >
                          Ke-{minggu}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anggota.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    
                    {Object.keys(bulanData).map(bulan => (
                      <React.Fragment key={`${user.id}-${bulan}`}>
                        {[1, 2, 3, 4].map(minggu => 
                          renderStatusCell(user.id, bulan, minggu)
                        )}
                      </React.Fragment>
                    ))}
                    
                    <td className="px-4 py-3 text-center text-sm font-medium border-l border-gray-200 bg-gray-50">
                      {processedData[user.id]?.totalPayments || 0} ✓
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CatatanKas;