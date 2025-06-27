import React, { useState, useEffect } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const Struktur = ({ struktur, kepengurusanlab, tahunKepengurusan, filters, flash }) => {
  const { selectedLab } = useLab();
  const { auth } = usePage().props; // Get auth user from page props
  const [selectedTahun, setSelectedTahun] = useState(filters.tahun_id || "");
  
  // Check if user has admin/kalab privileges
  const canAccess = auth.user && auth.user.roles.some(role => ['admin','kalab'].includes(role));
  // State manajemen modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form untuk create
  const createForm = useForm({
    struktur: "",
    kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
    proker: null,
    tipe_jabatan: "asisten",  // Changed from empty string to "asisten"
    jabatan_tunggal: true, // default true
    jabatan_terkait: "", // baru
  });

  // Form untuk edit
  const editForm = useForm({
    struktur: "",
    proker: null,
    tipe_jabatan: "",
    kepengurusan_lab_id: kepengurusanlab ? kepengurusanlab.id : null,
    jabatan_tunggal: true, // default true
    jabatan_terkait: "", // baru
  });

  // Form untuk delete
  const deleteForm = useForm({
    // _method: "DELETE",
  });

  // Handler untuk membuka modal
  const openCreateModal = () => {
    if (!kepengurusanlab) {
      toast.error("Silakan pilih laboratorium dan tahun kepengurusan terlebih dahulu");
      return;
    }
    createForm.reset();
    createForm.setData("kepengurusan_lab_id", kepengurusanlab.id);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    editForm.setData({
      struktur: item.struktur,
      proker: null,
      tipe_jabatan: item.tipe_jabatan, // Add this line
      kepengurusan_lab_id: kepengurusanlab.id,
      jabatan_tunggal: item.jabatan_tunggal ?? true, // set dari data
      jabatan_terkait: item.jabatan_terkait || "", // baru
      _method: "PUT",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Handler untuk submit form
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route("struktur.store"), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        toast.success("Struktur berhasil ditambahkan");
      },
      onError: (errors) => {
        console.error("Create errors:", errors);
        if (errors.message) toast.error(errors.message);
        else toast.error("Gagal menambahkan data");
      },
      forceFormData: true,
    });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    
    // Debug info
    console.log("Form data being sent:", editForm.data);
    
    editForm.post(route("struktur.update", selectedItem.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast.success("Struktur berhasil diperbarui");
      },
      onError: (errors) => {
        console.error("Update errors:", errors);
        if (errors.struktur) toast.error(errors.struktur);
        else toast.error("Gagal memperbarui data");
      },
      forceFormData: true,
    });
  };

  const handleDelete = () => {
    deleteForm.delete(route("struktur.destroy", selectedItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        toast.success("Struktur berhasil dihapus");
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.error("Gagal menghapus data");
      },
    });
  };

  // Handler untuk perubahan tahun
  const handleTahunChange = (e) => {
    setSelectedTahun(e.target.value);
  };

  

    useEffect(() => {
      if (flash && flash.message) {
        toast.success(flash.message);
      }
      if (flash && flash.error) {
        toast.error(flash.error);
      }
    }, [flash]);


  useEffect(() => {
    if (selectedLab) {
      router.visit("/struktur", {
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

  return (
    <DashboardLayout>
      <Head title="Struktur Organisasi" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Struktur / Jabatan Laboratorium
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
            {canAccess && (
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
                  Tambah Struktur
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Kerja
                </th>
                {/* Only show Action column for admin users */}
                {canAccess && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {struktur.length > 0 ? (
                struktur.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {item.struktur}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.proker_path ? (
                        <a
                          href={item.proker_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          Lihat Program Kerja
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada program kerja</span>
                      )}
                    </td>
                    {/* Only show Action buttons for admin users */}
                    {canAccess && (
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
                    )}
                  </tr>
                ))
              ) : (
                (!struktur.length && selectedLab && selectedTahun) && (
                  <tr>
                    <td colSpan={canAccess ? "4" : "3"} className="px-6 py-4 text-center text-sm text-gray-500 ">
                      <div className="flex flex-col items-center">
                        <p>Tidak ada data struktur</p>
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
              <h3 className="text-lg font-semibold">Tambah Struktur</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jabatan
                </label>
                <input
                  type="text"
                  name="struktur"
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.data.struktur}
                  onChange={(e) => createForm.setData("struktur", e.target.value)}
                  required
                />
                {createForm.errors.struktur && (
                  <div className="text-red-500 text-sm mt-1">
                    {createForm.errors.struktur}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Jabatan
                </label>
                <select
                  name="tipe_jabatan"
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.data.tipe_jabatan}
                  onChange={(e) => {
                    createForm.setData("tipe_jabatan", e.target.value);
                    if (e.target.value !== "dosen") createForm.setData("jabatan_terkait", "");
                  }}
                  required
                >
                  <option value="">Pilih Tipe Jabatan</option>
                  <option value="dosen">Dosen</option>
                  <option value="asisten">Asisten</option>
                </select>
                {createForm.errors.tipe_jabatan && (
                  <div className="text-red-500 text-sm mt-1">
                    {createForm.errors.tipe_jabatan}
                  </div>
                )}
              </div>
              {createForm.data.tipe_jabatan === "dosen" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jabatan Terkait
                  </label>
                  <select
                    name="jabatan_terkait"
                    className="w-full px-3 py-2 border rounded-md"
                    value={createForm.data.jabatan_terkait}
                    onChange={e => createForm.setData("jabatan_terkait", e.target.value)}
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    <option value="kalab">Kepala Laboratorium</option>
                    <option value="dosen">Anggota</option>
                  </select>
                  {createForm.errors.jabatan_terkait && (
                    <div className="text-red-500 text-sm mt-1">
                      {createForm.errors.jabatan_terkait}
                    </div>
                  )}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Kerja (PDF)
                </label>
                <input
                  type="file"
                  name="proker"
                  accept=".pdf"
                  onChange={(e) => createForm.setData("proker", e.target.files[0])}
                />
                {createForm.errors.proker && (
                  <div className="text-red-500 text-sm mt-1">
                    {createForm.errors.proker}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jabatan Tunggal?
                </label>
                <select
                  name="jabatan_tunggal"
                  className="w-full px-3 py-2 border rounded-md"
                  value={createForm.data.jabatan_tunggal ? "true" : "false"}
                  onChange={e => createForm.setData("jabatan_tunggal", e.target.value === "true")}
                  required
                >
                  <option value="true">Hanya satu orang</option>
                  <option value="false">Bisa diisi banyak orang</option>
                </select>
                {createForm.errors.jabatan_tunggal && (
                  <div className="text-red-500 text-sm mt-1">
                    {createForm.errors.jabatan_tunggal}
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
              <h3 className="text-lg font-semibold">Edit Struktur</h3>
              <button onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jabatan
                </label>
                <input
                  type="text"
                  name="struktur"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.struktur}
                  onChange={(e) => editForm.setData("struktur", e.target.value)}
                  required
                />
                {editForm.errors.struktur && (
                  <div className="text-red-500 text-sm mt-1">
                    {editForm.errors.struktur}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Jabatan
                </label>
                <select
                  name="tipe_jabatan"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.tipe_jabatan}
                  onChange={(e) => {
                    editForm.setData("tipe_jabatan", e.target.value);
                    if (e.target.value !== "dosen") editForm.setData("jabatan_terkait", "");
                  }}
                  required
                >
                  <option value="">Pilih Tipe Jabatan</option>
                  <option value="dosen">Dosen</option>
                  <option value="asisten">Asisten</option>
                </select>
                {editForm.errors.tipe_jabatan && (
                  <div className="text-red-500 text-sm mt-1">
                    {editForm.errors.tipe_jabatan}
                  </div>
                )}
              </div>
              {editForm.data.tipe_jabatan === "dosen" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jabatan Terkait
                  </label>
                  <select
                    name="jabatan_terkait"
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.data.jabatan_terkait}
                    onChange={e => editForm.setData("jabatan_terkait", e.target.value)}
                    required
                  >
                    <option value="">Pilih Jabatan</option>
                    <option value="kalab">Kepala Laboratorium</option>
                    <option value="dosen">Dosen</option>
                  </select>
                  {editForm.errors.jabatan_terkait && (
                    <div className="text-red-500 text-sm mt-1">
                      {editForm.errors.jabatan_terkait}
                    </div>
                  )}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Kerja Baru (PDF)
                </label>
                <input
                  type="file"
                  name="proker"
                  accept=".pdf"
                  onChange={(e) => editForm.setData("proker", e.target.files[0])}
                />
                {editForm.errors.proker && (
                  <div className="text-red-500 text-sm mt-1">
                    {editForm.errors.proker}
                  </div>
                )}
                {selectedItem.proker_path && (
                  <div className="mt-2 text-sm">
                    <span>Program kerja saat ini: </span>
                    <a 
                      href={selectedItem.proker_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat file
                    </a>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jabatan Tunggal?
                </label>
                <select
                  name="jabatan_tunggal"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editForm.data.jabatan_tunggal ? "true" : "false"}
                  onChange={e => editForm.setData("jabatan_tunggal", e.target.value === "true")}
                  required
                >
                  <option value="true">Hanya satu orang</option>
                  <option value="false">Bisa diisi banyak orang</option>
                </select>
                {editForm.errors.jabatan_tunggal && (
                  <div className="text-red-500 text-sm mt-1">
                    {editForm.errors.jabatan_tunggal}
                  </div>
                )}
              </div>
              <input 
                type="hidden" 
                name="kepengurusan_lab_id" 
                value={editForm.data.kepengurusan_lab_id} 
              />
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
                    Apakah Anda yakin ingin menghapus struktur "{selectedItem.struktur}"? Tindakan ini tidak dapat dibatalkan.
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

export default Struktur;