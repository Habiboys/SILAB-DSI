import React, { useState, useEffect, Fragment } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const Praktikum = ({ 
  praktikumData, 
  kepengurusanlab, 
  tahunKepengurusan, 
  filters, 
  flash 
}) => {
  const { auth } = usePage().props;
  const { selectedLab } = useLab(); 
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");

  // Role-based access control
  const isAdmin = auth.user && auth.user.roles.some(role => ['admin', 'superadmin'].includes(role));
  
  // State management for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected praktikum for edit/delete
  const [selectedPraktikum, setSelectedPraktikum] = useState(null);
  const hariOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  
  // Create form
  const createForm = useForm({
    kepengurusan_lab_id: kepengurusanlab?.id || "",
    mata_kuliah: "",
    jadwal: [
      {
        hari: "",
        kelas: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
      }
    ],
    tahun_id: selectedTahun,
  });

  // Edit form 
  const editForm = useForm({
    id: "",
    kepengurusan_lab_id: "",
    mata_kuliah: "",
    tahun_id: selectedTahun,
    jadwal: [{ 
      id: "",
      praktikum_id: "",
      hari: "",
      kelas: "",
      jam_mulai: "",
      jam_selesai: "",
      ruangan: ""
    }]
  });

  // Form untuk delete
  const deleteForm = useForm({});

  const handleTahunChange = (e) => {
    const tahunId = e.target.value;
    setSelectedTahun(tahunId);
    
    // Refresh the page with both filters
    router.get(
      route("praktikum.index"),
      { tahun_id: tahunId },
      { preserveState: true }
    );
  };

  // Update data when lab or year changes
  useEffect(() => {
    // console.log('Lab or year changed: Lab ID:', selectedLab?.id, 'Year ID:', selectedTahun);
    
    if (selectedLab) {
      console.log('Navigating with updated filters');
      router.visit("/praktikum", {
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

  // Flash messages
  useEffect(() => {
    if (flash?.message) {
      toast.success(flash.message);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Format time display (e.g., "08:00 - 10:30")
  const formatJam = (jamMulai, jamSelesai) => {
    // Function to format a single time value
    const formatSingleTime = (timeString) => {
      // Check if the time is in HH:MM:SS format
      if (timeString && timeString.includes(':')) {
        // Split the time string and take only hours and minutes
        const timeParts = timeString.split(':');
        return timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timeString;
      }
      return timeString || '';
    };

    return `${formatSingleTime(jamMulai)} - ${formatSingleTime(jamSelesai)}`;
  };

  // JADWAL MANAGEMENT
  const addJadwal = () => {
    console.log('Adding new jadwal. Current jadwal count:', createForm.data.jadwal.length);
    
    const newJadwal = {
      hari: "",
      kelas: "",
      jam_mulai: "",
      jam_selesai: "",
      ruangan: "",
    };

    const updatedJadwal = [...createForm.data.jadwal, newJadwal];
    createForm.setData("jadwal", updatedJadwal);
    
    console.log('Jadwal added. New jadwal count:', updatedJadwal.length);
  };
 
  const removeJadwal = (index) => {
    const updatedJadwal = [...createForm.data.jadwal];
    updatedJadwal.splice(index, 1);
    createForm.setData("jadwal", updatedJadwal);
  };
  // CREATE ACTIONS
  const openCreateModal = () => {
    // Only allow admin users to open create modal
    if (!isAdmin) return;
    
    console.log('Opening create modal');
    console.log('kepengurusanlab?.id:', kepengurusanlab?.id);
    console.log('selectedTahun:', selectedTahun);
    
    createForm.reset();
    createForm.setData("kepengurusan_lab_id", kepengurusanlab?.id || "");
    createForm.setData("tahun_id", selectedTahun);
    createForm.setData("jadwal", [
      {
        hari: "",
        kelas: "",
        jam_mulai: "",
        jam_selesai: "",
        ruangan: "",
      }
    ]);
    
    console.log('Create form initialized with:', JSON.stringify(createForm.data, null, 2));
    setIsCreateModalOpen(true);
  };

const handleCreateSubmit = (e) => {
  e.preventDefault();
  
  // Only allow admin users to submit create form
  if (!isAdmin) return;
  
  // Validasi semua jadwal sebelum submit
  let hasTimeError = false;
  createForm.data.jadwal.forEach((jadwal, index) => {
    if (!isValidTimeRange(jadwal.jam_mulai, jadwal.jam_selesai)) {
      toast.error(`Jadwal ke-${index + 1}: Jam mulai harus lebih awal dari jam selesai`);
      hasTimeError = true;
    }
  });
  
  // Jika ada error waktu, batalkan submit
  if (hasTimeError) {
    return;
  }
  
  createForm.post(route("praktikum.store"), {
    onSuccess: (response) => {
      setIsCreateModalOpen(false);
      createForm.reset();
      toast.success("Praktikum berhasil ditambahkan");
    },
    onError: (errors) => {
      // Error handling remains
    },
    preserveScroll: true,
  });
};
const isValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return true; // Biarkan validasi required menangani ini
  
  // Ubah string waktu menjadi objek Date untuk perbandingan
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Bandingkan waktu
  if (startHour > endHour) return false;
  if (startHour === endHour && startMinute >= endMinute) return false;
  
  return true;
};

// 2. Modifikasi handleJadwalChange untuk validasi waktu saat input berubah
const handleJadwalChange = (index, field, value) => {
  console.log(`Updating jadwal[${index}].${field} to: "${value}"`);
  
  const updatedJadwal = [...createForm.data.jadwal];
  updatedJadwal[index] = {
    ...updatedJadwal[index],
    [field]: value,
  };
  
  // Validasi ketika mengubah jam_mulai atau jam_selesai
  if (field === 'jam_mulai' || field === 'jam_selesai') {
    const startTime = field === 'jam_mulai' ? value : updatedJadwal[index].jam_mulai;
    const endTime = field === 'jam_selesai' ? value : updatedJadwal[index].jam_selesai;
    
    // Hanya lakukan validasi jika kedua nilai sudah ada
    if (startTime && endTime) {
      const isValid = isValidTimeRange(startTime, endTime);
      if (!isValid) {
        // Tampilkan toast notification
        toast.error(`Jam mulai harus lebih awal dari jam selesai pada jadwal ke-${index + 1}`);
      }
    }
  }
  
  createForm.setData("jadwal", updatedJadwal);
  
  console.log(`Updated jadwal[${index}]:`, updatedJadwal[index]);
};

// Fungsi untuk menangani perubahan pada jadwal di form edit
const handleEditJadwalChange = (index, field, value) => {
  const updatedJadwal = [...editForm.data.jadwal];
  updatedJadwal[index] = {
    ...updatedJadwal[index],
    [field]: value,
  };
  
  // Validasi ketika mengubah jam_mulai atau jam_selesai
  if (field === 'jam_mulai' || field === 'jam_selesai') {
    const startTime = field === 'jam_mulai' ? value : updatedJadwal[index].jam_mulai;
    const endTime = field === 'jam_selesai' ? value : updatedJadwal[index].jam_selesai;
    
    // Hanya lakukan validasi jika kedua nilai sudah ada
    if (startTime && endTime) {
      const isValid = isValidTimeRange(startTime, endTime);
      if (!isValid) {
        // Tampilkan toast notification
        toast.error(`Jam mulai harus lebih awal dari jam selesai pada jadwal ke-${index + 1}`);
      }
    }
  }
  
  editForm.setData("jadwal", updatedJadwal);
};

  // Function to add a new jadwal to the edit form
  const addJadwalToEdit = () => {
    const updatedJadwal = [...editForm.data.jadwal];
    updatedJadwal.push({
      kelas: '',
      hari: '',
      jam_mulai: '',
      jam_selesai: '',
      ruangan: ''
    });
    editForm.setData("jadwal", updatedJadwal);
  };

  // Function to remove a jadwal from the edit form
  const removeJadwalFromEdit = (index) => {
    const updatedJadwal = [...editForm.data.jadwal];
    updatedJadwal.splice(index, 1);
    editForm.setData("jadwal", updatedJadwal);
  };

  const openEditModal = (praktikum) => {
    // Only allow admin users to open edit modal
    if (!isAdmin) return;
    
    setSelectedPraktikum(praktikum);
    
    console.log("Opening edit modal with praktikum:", praktikum);
    
    // The key issue: Your data uses jadwal_praktikum, not jadwal
    const jadwalData = praktikum.jadwal_praktikum && Array.isArray(praktikum.jadwal_praktikum) 
      ? [...praktikum.jadwal_praktikum] 
      : [];
      
    if (jadwalData.length === 0) {
      jadwalData.push({ 
        kelas: '', 
        hari: '', 
        jam_mulai: '', 
        jam_selesai: '', 
        ruangan: '' 
      });
    }
    
    // Set the form data with the correct field name
    editForm.setData({
      id: praktikum.id,
      kepengurusan_lab_id: praktikum.kepengurusan_lab_id,
      tahun_id: praktikum.tahun_id,
      mata_kuliah: praktikum.mata_kuliah,
      jadwal: jadwalData  // We still use jadwal in the form
    });
    
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPraktikum(null);
    editForm.reset();
    editForm.clearErrors();
  };

// Fungsi untuk handle submit form edit
const handleEditSubmit = (e) => {
  e.preventDefault();
  
  // Only allow admin users to submit edit form
  if (!isAdmin) return;
  
  // Validasi semua jadwal sebelum submit
  let hasTimeError = false;
  editForm.data.jadwal.forEach((jadwal, index) => {
    if (!isValidTimeRange(jadwal.jam_mulai, jadwal.jam_selesai)) {
      toast.error(`Jadwal ke-${index + 1}: Jam mulai harus lebih awal dari jam selesai`);
      hasTimeError = true;
    }
  });
  
  // Jika ada error waktu, batalkan submit
  if (hasTimeError) {
    return;
  }
  
  editForm.put(route("praktikum.update", editForm.data.id), {
    onSuccess: () => {
      closeEditModal();
      toast.success("Praktikum berhasil diperbarui");
    },
    onError: (errors) => {
      // Handle errors
      Object.keys(errors).forEach(key => {
        // Check if error is for jadwal array
        if (key.startsWith('jadwal.')) {
          const parts = key.split('.');
          if (parts.length === 3) {
            const index = parseInt(parts[1]);
            const field = parts[2];
            toast.error(`Jadwal ke-${index + 1}: ${errors[key]}`);
          }
        } else {
          toast.error(errors[key]);
        }
      });
    },
    preserveScroll: true,
  });
};

  const openDeleteModal = (praktikum) => {
    // Only allow admin users to open delete modal
    if (!isAdmin) return;
    
    console.log("Selected praktikum:", praktikum); // Add this line for debugging
    setSelectedPraktikum(praktikum);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    // Only allow admin users to delete
    if (!isAdmin) return;
    
    deleteForm.delete(route("praktikum.destroy", selectedPraktikum.id), {
      preserveScroll: true, 
      onSuccess: () => {
        // Close the modal first
        setIsDeleteModalOpen(false);
        
        // Use Inertia's shared flash message instead of direct toast
        // This assumes you're setting flash messages in your Laravel controller
        toast.success("Praktikum dan jadwalnya berhasil dihapus");
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Gagal menghapus data");
        setIsDeleteModalOpen(false);
      },
    });
  };

  const navigateToModul = (praktikumId) => {
    router.get(route('praktikum.modul.index', praktikumId));
  };

  return (
    <DashboardLayout>
      <Head title="Praktikum" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Praktikum
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

            {/* Only show Add button for admin users */}
            {isAdmin && (
              <button
                onClick={openCreateModal}
                disabled={!selectedLab?.id || !selectedTahun}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah
              </button>
            )}
          </div>
        </div>

        {selectedLab?.id && !selectedTahun && (
          <div className="p-8 text-center text-gray-500">
            Silakan pilih tahun untuk melihat data
          </div>
        )}

        {/* Table Display */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Mata Kuliah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Jam 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Ruangan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {praktikumData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-600 text-lg">
                    Tidak ada data praktikum
                  </td>
                </tr>
              ) : (
                praktikumData.map((praktikum, praktikumIndex) => {
                  const jadwals = Array.isArray(praktikum.jadwal_praktikum) 
                    ? praktikum.jadwal_praktikum 
                    : praktikum.jadwal_praktikum ? [praktikum.jadwal_praktikum] : [];
                  
                  return (
                    <React.Fragment key={praktikum.id}>
                      {/* Jika tidak ada jadwal, tampilkan satu baris dengan tanda - */}
                      {jadwals.length === 0 ? (
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                            {praktikumIndex + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                            {praktikum.mata_kuliah}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {/* Action buttons for empty jadwal */}
                            <div className="flex justify-center space-x-2">
                              {/* Only show Edit/Delete buttons for admin */}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => openEditModal(praktikum)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Edit Praktikum dan Jadwal"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(praktikum)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Hapus"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {/* Always show Modul button for all users */}
                              <button
                                onClick={() => navigateToModul(praktikum.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Lihat Detail"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        jadwals.map((jadwal, jadwalIndex) => (
                          <tr 
                            key={`${praktikum.id}-${jadwal.id || jadwalIndex}`}
                            className={`border-b border-gray-200 hover:bg-gray-50 ${jadwalIndex === jadwals.length - 1 ? 'border-b-2 border-gray-300' : ''}`}
                          >
                            {/* Jika ini jadwal pertama, tampilkan nomor dan mata kuliah */}
                            {jadwalIndex === 0 ? (
                              <>
                                <td 
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200"
                                  rowSpan={jadwals.length}
                                >
                                  {praktikumIndex + 1}
                                </td>
                                <td 
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200"
                                  rowSpan={jadwals.length}
                                >
                                  {praktikum.mata_kuliah}
                                </td>
                              </>
                            ) : null}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                              {jadwal.kelas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                              {jadwal.hari}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                              {formatJam(jadwal.jam_mulai, jadwal.jam_selesai)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-200">
                              {jadwal.ruangan}
                            </td>
                            
                            {/* Kolom aksi hanya tampil di baris pertama dari setiap praktikum */}
                            {jadwalIndex === 0 ? (
                              <td 
                                className="px-6 py-4 whitespace-nowrap text-center"
                                rowSpan={jadwals.length}
                              >
                                <div className="flex justify-center space-x-2">
                                  {/* Only show Edit/Delete buttons for admin */}
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={() => openEditModal(praktikum)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Edit Praktikum dan Jadwal"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => openDeleteModal(praktikum)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Hapus"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                  {/* Always show Modul button for all users */}
                                  <button
                                    onClick={() => navigateToModul(praktikum.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Lihat Detail"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          
          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Total Praktikum: {praktikumData?.length || 0}</span>
      
              </div>
            
            </div>
          </div>
        </div>
      </div>

      {/* Create Praktikum Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold">Tambah Praktikum</h3>
              <button 
                type="button"
                onClick={() => {
                  console.log('Closing create praktikum modal');
                  setIsCreateModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form 
              onSubmit={e => {
                e.preventDefault();
                handleCreateSubmit(e);
              }} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Praktikum Data */}
              <div className="mb-3 flex-shrink-0">
                <label
                  htmlFor="mata_kuliah"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Mata Kuliah
                </label>
                <input
                  type="text"
                  id="mata_kuliah"
                  name="mata_kuliah"
                  value={createForm.data.mata_kuliah}
                  onChange={e => {
                    console.log('Mata kuliah changed:', e.target.value);
                    createForm.setData('mata_kuliah', e.target.value);
                  }}
                  className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                    createForm.errors?.mata_kuliah ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  required
                />
                {createForm.errors?.mata_kuliah && (
                  <p className="mt-1 text-[10px] text-red-600">{createForm.errors.mata_kuliah}</p>
                )}
              </div>

              {/* Jadwal Praktikum Section */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                  <h3 className="text-xs font-medium text-gray-800">
                    Jadwal Praktikum
                  </h3>
                  <button
                    type="button"
                    onClick={addJadwal}
                    className="px-1.5 py-0.5 text-[10px] bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    Tambah Jadwal
                  </button>
                </div>

                {/* Scrollable jadwal container */}
                <div className="overflow-y-auto pr-1 flex-1">
                  {createForm.data.jadwal.map((jadwal, index) => (
                    <div
                      key={index}
                      className="p-2 border border-gray-200 rounded-lg mb-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-medium text-gray-700">
                          Jadwal #{index + 1}
                        </h4>
                        {createForm.data.jadwal.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeJadwal(index)}
                            className="text-[10px] text-red-600 hover:text-red-800 transition"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Kelas
                          </label>
                          <input
                            type="text"
                            value={jadwal.kelas}
                            onChange={(e) =>
                              handleJadwalChange(index, "kelas", e.target.value)
                            }
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              createForm.errors?.jadwal?.[index]?.kelas ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {createForm.errors?.jadwal?.[index]?.kelas && (
                            <p className="mt-0.5 text-[10px] text-red-600">{createForm.errors.jadwal[index].kelas}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Hari
                          </label>
                          <select
                            value={jadwal.hari}
                            onChange={(e) =>
                              handleJadwalChange(index, "hari", e.target.value)
                            }
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              createForm.errors?.jadwal?.[index]?.hari ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          >
                            <option value="">Pilih Hari</option>
                            {hariOptions.map((hari) => (
                              <option key={hari} value={hari} className="text-xs">
                                {hari}
                              </option>
                            ))}
                          </select>
                          {createForm.errors?.jadwal?.[index]?.hari && (
                            <p className="mt-0.5 text-[10px] text-red-600">{createForm.errors.jadwal[index].hari}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Jam Mulai
                          </label>
                          <input
                            type="time"
                            value={jadwal.jam_mulai}
                            onChange={(e) =>
                              handleJadwalChange(index, "jam_mulai", e.target.value)
                            }
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              createForm.errors?.jadwal?.[index]?.jam_mulai ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {createForm.errors?.jadwal?.[index]?.jam_mulai && (
                            <p className="mt-0.5 text-[10px] text-red-600">{createForm.errors.jadwal[index].jam_mulai}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Jam Selesai
                          </label>
                          <input
                            type="time"
                            value={jadwal.jam_selesai}
                            onChange={(e) =>
                              handleJadwalChange(
                                index,
                                "jam_selesai",
                                e.target.value
                              )
                            }
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              createForm.errors?.jadwal?.[index]?.jam_selesai ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {createForm.errors?.jadwal?.[index]?.jam_selesai && (
                            <p className="mt-0.5 text-[10px] text-red-600">{createForm.errors.jadwal[index].jam_selesai}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Ruangan
                          </label>
                          <input
                            type="text"
                            value={jadwal.ruangan}
                            onChange={(e) =>
                              handleJadwalChange(index, "ruangan", e.target.value)
                            }
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              createForm.errors?.jadwal?.[index]?.ruangan ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {createForm.errors?.jadwal?.[index]?.ruangan && (
                            <p className="mt-0.5 text-[10px] text-red-600">{createForm.errors.jadwal[index].ruangan}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {createForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Praktikum */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold">Edit Praktikum</h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form 
              onSubmit={e => {
                e.preventDefault();
                handleEditSubmit(e);
              }} 
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Hidden inputs */}
              <input type="hidden" name="id" value={editForm.data.id} />
              <input type="hidden" name="kepengurusan_lab_id" value={editForm.data.kepengurusan_lab_id} />
              <input type="hidden" name="tahun_id" value={editForm.data.tahun_id} />

              {/* Praktikum Data */}
              <div className="mb-3 flex-shrink-0">
                <label
                  htmlFor="mata_kuliah"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Mata Kuliah
                </label>
                <input
                  type="text"
                  id="mata_kuliah"
                  name="mata_kuliah"
                  value={editForm.data.mata_kuliah}
                  onChange={e => editForm.setData('mata_kuliah', e.target.value)}
                  className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                    editForm.errors?.mata_kuliah ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  required
                />
                {editForm.errors?.mata_kuliah && (
                  <p className="mt-1 text-[10px] text-red-600">{editForm.errors.mata_kuliah}</p>
                )}
              </div>

              {/* Jadwal Praktikum Section */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                  <h3 className="text-xs font-medium text-gray-800">
                    Jadwal Praktikum
                  </h3>
                  <button
                    type="button"
                    onClick={addJadwalToEdit}
                    className="px-1.5 py-0.5 text-[10px] bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    + Tambah
                  </button>
                </div>

                {/* Scrollable container for jadwal items */}
                <div className="overflow-y-auto pr-1 flex-1">
                  {editForm.data.jadwal.map((jadwal, index) => (
                    <div
                      key={index}
                      className="p-2 border border-gray-200 rounded-lg mb-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-medium text-gray-700">
                          Jadwal #{index + 1}
                        </h4>
                        {editForm.data.jadwal.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeJadwalFromEdit(index)}
                            className="text-[10px] text-red-600 hover:text-red-800 transition"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Hidden input for jadwal ID if it exists */}
                      {jadwal.id && (
                        <input type="hidden" name={`jadwal[${index}][id]`} value={jadwal.id} />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Kelas
                          </label>
                          <input
                            type="text"
                            value={jadwal.kelas}
                            onChange={(e) => handleEditJadwalChange(index, "kelas", e.target.value)}
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              editForm.errors?.jadwal?.[index]?.kelas ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {editForm.errors?.jadwal?.[index]?.kelas && (
                            <p className="mt-0.5 text-[10px] text-red-600">{editForm.errors.jadwal[index].kelas}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Hari
                          </label>
                          <select
                            value={jadwal.hari}
                            onChange={(e) => handleEditJadwalChange(index, "hari", e.target.value)}
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              editForm.errors?.jadwal?.[index]?.hari ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          >
                            <option value="">Pilih Hari</option>
                            {hariOptions.map((hari) => (
                              <option key={hari} value={hari} className="text-xs">
                                {hari}
                              </option>
                            ))}
                          </select>
                          {editForm.errors?.jadwal?.[index]?.hari && (
                            <p className="mt-0.5 text-[10px] text-red-600">{editForm.errors.jadwal[index].hari}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Jam Mulai
                          </label>
                          <input
                            type="time"
                            value={jadwal.jam_mulai}
                            onChange={(e) => handleEditJadwalChange(index, "jam_mulai", e.target.value)}
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              editForm.errors?.jadwal?.[index]?.jam_mulai ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {editForm.errors?.jadwal?.[index]?.jam_mulai && (
                            <p className="mt-0.5 text-[10px] text-red-600">{editForm.errors.jadwal[index].jam_mulai}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Jam Selesai
                          </label>
                          <input
                            type="time"
                            value={jadwal.jam_selesai}
                            onChange={(e) => handleEditJadwalChange(index, "jam_selesai", e.target.value)}
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              editForm.errors?.jadwal?.[index]?.jam_selesai ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {editForm.errors?.jadwal?.[index]?.jam_selesai && (
                            <p className="mt-0.5 text-[10px] text-red-600">{editForm.errors.jadwal[index].jam_selesai}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                            Ruangan
                          </label>
                          <input
                            type="text"
                            value={jadwal.ruangan}
                            onChange={(e) => handleEditJadwalChange(index, "ruangan", e.target.value)}
                            className={`w-full px-1.5 py-1 text-xs border rounded-md ${
                              editForm.errors?.jadwal?.[index]?.ruangan ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            required
                          />
                          {editForm.errors?.jadwal?.[index]?.ruangan && (
                            <p className="mt-0.5 text-[10px] text-red-600">{editForm.errors.jadwal[index].ruangan}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {editForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedPraktikum && (
        
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {console.log("Inside modal rendering, selectedPraktikum:", selectedPraktikum)}
          {console.log("mata_kuliah value:", selectedPraktikum.mata_kuliah)}
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
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
                    Apakah Anda yakin ingin menghapus praktikum "{selectedPraktikum.mata_kuliah}"? 
                    Semua jadwal praktikum terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
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

export default Praktikum;
