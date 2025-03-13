import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const RiwayatKeuangan = ({ riwayatKeuangan, kepengurusanlab, tahunKepengurusan, filters, flash, asisten }) => {
  const { selectedLab } = useLab();
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");
  
  // State manajemen modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUangKas, setIsUangKas] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState("");

// Form untuk create
const createForm = useForm({
  tanggal: new Date().toISOString().split('T')[0], // Set default ke tanggal hari ini
  nominal: "",
  jenis: "masuk",
  deskripsi: "",
  kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
  is_uang_kas: false,
  anggota_id: "",
});
  // Form untuk edit
  const editForm = useForm({
    tanggal: "",
    nominal: "",
    jenis: "",
    deskripsi: "",
    kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
  });

  // Form untuk delete
  const deleteForm = useForm({});

  // Handler untuk membuka modal
  const openCreateModal = () => {
    if (!kepengurusanlab) {
      toast.error("Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu");
      return;
    }
    createForm.reset();
    createForm.setData({
      tanggal: new Date().toISOString().split('T')[0], // Set default ke tanggal hari ini
      nominal: "",
      jenis: "masuk",
      deskripsi: "",
      bukti: "",
      kepengurusan_lab_id: kepengurusanlab.id,
      is_uang_kas: false,
      anggota_id: ""
    });
    setIsUangKas(false);
    setSelectedAnggota("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      tanggal: item.tanggal.split('T')[0], // Format tanggal untuk input date
      nominal: item.nominal,
      jenis: item.jenis,
      deskripsi: item.deskripsi,
      bukti: item.bukti,
      kepengurusan_lab_id: kepengurusanlab.id,
      _method: "PUT",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };


// Handler untuk perubahan tipe transaksi (uang kas atau bukan)
const handleUangKasChange = (e) => {
  const isChecked = e.target.checked;
  setIsUangKas(isChecked);
  createForm.setData("is_uang_kas", isChecked);
  
  // Reset anggota jika tidak lagi uang kas
  if (!isChecked) {
    setSelectedAnggota("");
    createForm.setData("anggota_id", "");
    createForm.setData("deskripsi", ""); // Reset deskripsi jika bukan uang kas
  } else if (isChecked && selectedAnggota) {
    // Jika uang kas dicentang dan anggota sudah dipilih, isi deskripsi otomatis
    const selectedAnggotaData = asisten.find(anggota => anggota.id.toString() === selectedAnggota.toString());
    if (selectedAnggotaData) {
      // Gunakan name bukan nama (sesuai dengan struktur data)
      createForm.setData("deskripsi", `Pembayaran uang kas (${selectedAnggotaData.name})`);
    }
  }
};

// Handler untuk perubahan anggota
const handleAnggotaChange = (e) => {
  const anggotaId = e.target.value;
  setSelectedAnggota(anggotaId);
  createForm.setData("anggota_id", anggotaId);
  
  // Update deskripsi otomatis jika ini uang kas
  if (isUangKas) {
    const selectedAnggotaData = asisten.find(anggota => anggota.id.toString() === anggotaId.toString());
    if (selectedAnggotaData) {
      // Gunakan name bukan nama (sesuai dengan struktur data)
      createForm.setData("deskripsi", `Pembayaran uang kas (${selectedAnggotaData.name})`);
    }
  }
};

  // Handler untuk submit form
  const handleCreate = (e) => {
    e.preventDefault();
    
    // Pastikan deskripsi terisi untuk uang kas sebelum mengirim form
    if (isUangKas && selectedAnggota) {
      const selectedAnggotaData = asisten.find(anggota => anggota.id.toString() === selectedAnggota.toString());
      if (selectedAnggotaData) {
        // Paksa isi nilai deskripsi untuk memastikannya terkirim
        createForm.setData("deskripsi", `Pembayaran uang kas (${selectedAnggotaData.name})`);
      }
    }
    
    // Validasi apakah deskripsi kosong
    if (!createForm.data.deskripsi) {
      toast.error("Deskripsi tidak boleh kosong");
      return;
    }
    
    // Log data sebelum dikirim
    console.log("Form data being sent:", createForm.data);
    
    createForm.post(route("riwayat-keuangan.store"), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        toast.success("Data keuangan berhasil ditambahkan");
      },
      onError: (errors) => {
        console.error("Create errors:", errors);
        if (errors.message) toast.error(errors.message);
        else toast.error("Gagal menambahkan data");
      },
    });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    
    // Debug info
    console.log("Form data being sent:", editForm.data);
    
    editForm.post(route("riwayat-keuangan.update", selectedItem.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast.success("Data keuangan berhasil diperbarui");
      },
      onError: (errors) => {
        console.error("Update errors:", errors);
        if (errors.message) toast.error(errors.message);
        else toast.error("Gagal memperbarui data");
      },
    });
  };

  const handleDelete = () => {
    deleteForm.delete(route("riwayat-keuangan.destroy", selectedItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        toast.success("Data keuangan berhasil dihapus");
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.error("Gagal menghapus data");
      },
    });
  };

  // Handler untuk perubahan jenis transaksi
  const handleJenisChange = (e) => {
    const jenis = e.target.value;
    createForm.setData("jenis", jenis);
    
    // Reset uang kas dan anggota jika bukan pemasukan
    if (jenis !== "masuk") {
      setIsUangKas(false);
      setSelectedAnggota("");
      createForm.setData("is_uang_kas", false);
      createForm.setData("anggota_id", "");
    }
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
      router.visit("/riwayat-keuangan", {
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Hitung total pemasukan dan pengeluaran
  const totalPemasukan = riwayatKeuangan
    .filter(item => item.jenis === 'masuk')
    .reduce((total, item) => total + parseInt(item.nominal), 0);
    
  const totalPengeluaran = riwayatKeuangan
    .filter(item => item.jenis === 'keluar')
    .reduce((total, item) => total + parseInt(item.nominal), 0);
    
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  return (
    <DashboardLayout>
      <Head title="Riwayat Keuangan" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Riwayat Keuangan Laboratorium
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
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              disabled={!kepengurusanlab}
            >
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Tambah
              </span>
            </button>
          </div>
        </div>

        {/* Ringkasan Keuangan */}
        {kepengurusanlab && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-sm text-gray-500 mb-1">Saldo</div>
              <div className={`text-xl font-bold ${saldoAkhir >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(saldoAkhir)}
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
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bukti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nominal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riwayatKeuangan.length > 0 ? (
                riwayatKeuangan.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.deskripsi}
                    </td>
                    <td className="px-6 py-4">
                      {item.bukti ? (
                        <img 
                          src={`/storage/${item.bukti}`} 
                          alt="Bukti" 
                          className="w-16 h-16 object-cover cursor-pointer border border-gray-300 rounded" 
                          
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.jenis === 'masuk' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors focus:outline-none"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="text-red-600 hover:text-red-900 transition-colors focus:outline-none"
                        title="Hapus"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                (!riwayatKeuangan.length && selectedLab && selectedTahun) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 ">
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

    {/* Modal Create */}
    {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Transaksi</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} encType="multipart/form-data">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              name="tanggal" 
              className="w-full px-3 py-2 border rounded-md"
              value={createForm.data.tanggal || new Date().toISOString().split('T')[0]}
              onChange={(e) => createForm.setData("tanggal", e.target.value)}
              required
            />
            {createForm.errors.tanggal && (
              <div className="text-red-500 text-sm mt-1">{createForm.errors.tanggal}</div>
            )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Transaksi
                </label>
                <select
                  name="jenis"
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.data.jenis}
                  onChange={handleJenisChange}
                  required
                >
                  <option value="masuk">Pemasukan</option>
                  <option value="keluar">Pengeluaran</option>
                </select>
                {createForm.errors.jenis && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.jenis}</div>
                )}
              </div>

              {/* Tampilkan opsi uang kas hanya jika jenis = masuk */}
              {createForm.data.jenis === "masuk" && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_uang_kas"
                      name="is_uang_kas"
                      checked={isUangKas}
                      onChange={handleUangKasChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_uang_kas" className="ml-2 block text-sm text-gray-700">
                      Uang Kas
                    </label>
                  </div>
                </div>
              )}

              {/* Tampilkan pilihan anggota jika uang kas */}
              {createForm.data.jenis === "masuk" && isUangKas && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Anggota
                  </label>
                  <select
                    name="anggota_id"
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedAnggota}
                    onChange={handleAnggotaChange}
                    required
                  >
                    <option value="">Pilih Anggota</option>
                    {asisten?.map((anggota) => (
                      <option key={anggota.id} value={anggota.id}>
                        {anggota.name} - {anggota.profile.nomor_anggota}
                      </option>
                    ))}
                  </select>
                  {createForm.errors.anggota_id && (
                    <div className="text-red-500 text-sm mt-1">{createForm.errors.anggota_id}</div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nominal
                </label>
                <input
                  type="number"
                  name="nominal" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.data.nominal}
                  onChange={(e) => createForm.setData("nominal", e.target.value)}
                  min="500"
                  step="500"
                  required
                />
                {createForm.errors.nominal && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.nominal}</div>
                )}
              </div>
              
              {/* Tampilkan deskripsi hanya jika BUKAN uang kas atau jenis bukan masuk */}
              {(!isUangKas || createForm.data.jenis !== "masuk") ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    name="deskripsi" 
                    className="w-full px-3 py-2 border rounded-md"
                    value={createForm.data.deskripsi}
                    onChange={(e) => createForm.setData("deskripsi", e.target.value)}
                    required
                    rows="3"
                  ></textarea>
                  {createForm.errors.deskripsi && (
                    <div className="text-red-500 text-sm mt-1">{createForm.errors.deskripsi}</div>
                  )}
                </div>
              ) : (
                // Input tersembunyi untuk memastikan deskripsi tetap terkirim saat uang kas dipilih
                <input 
                  type="hidden" 
                  name="deskripsi" 
                  value={createForm.data.deskripsi} 
                />
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Transaksi (Opsional)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    name="bukti"
                    id="bukti"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target && event.target.result) {
                            createForm.setData("bukti", event.target.result);
                          }
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                {createForm.errors.bukti && (
                  <div className="text-red-500 text-sm mt-1">{createForm.errors.bukti}</div>
                )}
                
                {/* Preview gambar jika sudah dipilih */}
                {createForm.data.bukti && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img 
                      src={createForm.data.bukti} 
                      alt="Preview bukti" 
                      className="h-24 w-auto object-contain border rounded"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  disabled={createForm.processing}
                >
                  {createForm.processing ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Transaksi</h3>
              <button onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="tanggal" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.tanggal}
                  onChange={(e) => editForm.setData("tanggal", e.target.value)}
                  required
                />
                {editForm.errors.tanggal && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.tanggal}</div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Transaksi
                </label>
                <select
                  name="jenis"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.jenis}
                  onChange={(e) => editForm.setData("jenis", e.target.value)}
                  required
                >
                  <option value="masuk">Pemasukan</option>
                  <option value="keluar">Pengeluaran</option>
                </select>
                {editForm.errors.jenis && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.jenis}</div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nominal
                </label>
                <input
                  type="number"
                  name="nominal" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.nominal}
                  onChange={(e) => editForm.setData("nominal", e.target.value)}
                  min="0"
                  required
                />
                {editForm.errors.nominal && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.nominal}</div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi" 
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.deskripsi}
                  onChange={(e) => editForm.setData("deskripsi", e.target.value)}
                  required
                  rows="3"
                ></textarea>
                {editForm.errors.deskripsi && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.deskripsi}</div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Transaksi (Opsional)
                </label>
                <div className="mt-1">
                  {/* Tampilkan bukti yang sudah ada jika ada */}
                  {editForm.data.bukti && !editForm.data.bukti.startsWith('data:image') && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Bukti saat ini:</p>
                      <img 
                        src={`/storage/${editForm.data.bukti}`}
                        alt="Bukti transaksi" 
                        className="h-24 w-auto object-contain border rounded mb-2" 
                      />
                    </div>
                  )}
                  
                  {/* Input untuk upload bukti baru */}
                  <input
                    type="file"
                    name="bukti"
                    id="edit_bukti"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target && event.target.result) {
                            editForm.setData("bukti", event.target.result);
                          }
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                
                {/* Preview gambar baru jika dipilih */}
                {editForm.data.bukti && editForm.data.bukti.startsWith('data:image') && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview bukti baru:</p>
                    <img 
                      src={editForm.data.bukti} 
                      alt="Preview bukti" 
                      className="h-24 w-auto object-contain border rounded"
                    />
                  </div>
                )}
                
                {editForm.errors.bukti && (
                  <div className="text-red-500 text-sm mt-1">{editForm.errors.bukti}</div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                  disabled={editForm.processing}
                >
                  {editForm.processing ? "Memperbarui..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              <button onClick={() => setIsDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Apakah Anda yakin ingin menghapus transaksi "{selectedItem.deskripsi}" pada tanggal {new Date(selectedItem.tanggal).toLocaleDateString('id-ID')}? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RiwayatKeuangan;