import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../Components/LabContext";

const Anggota = ({ anggota, strukturs, tahunKepengurusan, selectedTahun, lab }) => {
  // Use the lab context
  const { selectedLab } = useLab();

  // State for modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tipePengguna, setTipePengguna] = useState('asisten');
  const [editTipePengguna, setEditTipePengguna] = useState('asisten');

  // Form for delete
  const { delete: destroy } = useForm();

  // Form for create
  const createForm = useForm({
    name: "",
    email: "",
    password: "",
    tipe: "asisten",
    nim: "",
    nip: "",
    jenis_kelamin: "L",
    no_hp: "",
    alamat: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    kepengurusan_id: "",
    jabatan: "anggota",
  });

  // Form for edit
  const editForm = useForm({
    name: "",
    email: "",
    password: "",
    tipe: "asisten",
    nim: "",
    nip: "",
    jenis_kelamin: "L",
    no_hp: "",
    alamat: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    kepengurusan_id: "",
    jabatan: "anggota",
  });

  // Form for filter by tahun
  const filterForm = useForm({
    tahun_id: selectedTahun || "",
  });

  // Modal handlers
  const openDeleteModal = (id) => {
    setSelectedId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedId(null);
  };

  const openCreateModal = () => {
    createForm.reset();
    setTipePengguna('asisten');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditTipePengguna(item.nip ? 'dosen' : 'asisten');
    
    editForm.setData({
      name: item.name,
      email: item.email,
      password: "",
      tipe: item.nip ? 'dosen' : 'asisten',
      nim: item.nim || "",
      nip: item.nip || "",
      jenis_kelamin: item.jenis_kelamin || "L",
      no_hp: item.no_hp || "",
      alamat: item.alamat || "",
      tempat_lahir: item.tempat_lahir || "",
      tanggal_lahir: item.tanggal_lahir || "",
      kepengurusan_id: item.kepengurusan_id || "",
      jabatan: item.is_koordinator ? "koordinator" : "anggota",
    });
    
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    editForm.reset();
  };

  // Submission handlers
  const handleDelete = () => {
    destroy(route("anggota.destroy", selectedId), {
      onSuccess: () => {
        closeDeleteModal();
        toast.success("Anggota berhasil dihapus");
      },
      onError: () => {
        toast.error("Gagal menghapus data");
      },
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route("anggota.store"), {
      onSuccess: () => {
        closeCreateModal();
        toast.success("Anggota berhasil ditambahkan");
      },
      onError: () => {
        toast.error("Gagal menambahkan data");
      },
    });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    editForm.put(route("anggota.update", selectedItem.id), {
      onSuccess: () => {
        closeEditModal();
        toast.success("Anggota berhasil diperbarui");
      },
      onError: () => {
        toast.error("Gagal memperbarui data");
      },
    });
  };

  const handleTahunChange = (e) => {
    filterForm.setData("tahun_id", e.target.value);
    router.visit("/anggota", {
      data: { lab_id: selectedLab.id, tahun_id: e.target.value },
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  useEffect(() => {
    if (selectedLab) {
      router.visit("/anggota", {
        data: { 
          lab_id: selectedLab.id,
          tahun_id: filterForm.data.tahun_id
        },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab]);

  // Handle tipe pengguna change
  const handleTipeChange = (e) => {
    const newTipe = e.target.value;
    setTipePengguna(newTipe);
    createForm.setData("tipe", newTipe);
  };

  const handleEditTipeChange = (e) => {
    const newTipe = e.target.value;
    setEditTipePengguna(newTipe);
    editForm.setData("tipe", newTipe);
  };

  return (
    <DashboardLayout>
      <Head title="Anggota Lab" />
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Anggota {lab ? lab.nama : ""}
          </h2>
          <div className="flex space-x-4">
            {/* Tahun Filter */}
            <div className="flex items-center">
              <label className="mr-2 text-gray-700">Tahun:</label>
              <select
                value={filterForm.data.tahun_id}
                onChange={handleTahunChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tahunKepengurusan.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>
                    {tahun.tahun} {tahun.isactive ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Add button */}
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={!selectedLab || strukturs.length === 0}
            >
              Tambah Anggota
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIM/NIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {anggota.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.nim || item.nip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.jabatan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

              {anggota.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Anggota</h3>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama
                </label>
                <input
                  type="text"
                  id="create-name"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.name
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.name}
                  onChange={(e) =>
                    createForm.setData("name", e.target.value)
                  }
                />
                {createForm.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="create-email"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.email
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.email}
                  onChange={(e) =>
                    createForm.setData("email", e.target.value)
                  }
                />
                {createForm.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.email}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="create-password"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.password
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.password}
                  onChange={(e) =>
                    createForm.setData("password", e.target.value)
                  }
                />
                {createForm.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.password}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Pengguna
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="tipe-pengguna"
                      value="asisten"
                      checked={tipePengguna === "asisten"}
                      onChange={handleTipeChange}
                    />
                    <span className="ml-2">Asisten</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="tipe-pengguna"
                      value="dosen"
                      checked={tipePengguna === "dosen"}
                      onChange={handleTipeChange}
                    />
                    <span className="ml-2">Dosen</span>
                  </label>
                </div>
              </div>

              {tipePengguna === "asisten" ? (
                <div className="mb-4">
                  <label
                    htmlFor="create-nim"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    NIM
                  </label>
                  <input
                    type="text"
                    id="create-nim"
                    className={`w-full px-3 py-2 border rounded-md ${
                      createForm.errors.nim
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={createForm.data.nim}
                    onChange={(e) =>
                      createForm.setData("nim", e.target.value)
                    }
                  />
                  {createForm.errors.nim && (
                    <p className="mt-1 text-sm text-red-600">
                      {createForm.errors.nim}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <label
                    htmlFor="create-nip"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    NIP
                  </label>
                  <input
                    type="text"
                    id="create-nip"
                    className={`w-full px-3 py-2 border rounded-md ${
                      createForm.errors.nip
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    value={createForm.data.nip}
                    onChange={(e) =>
                      createForm.setData("nip", e.target.value)
                    }
                  />
                  {createForm.errors.nip && (
                    <p className="mt-1 text-sm text-red-600">
                      {createForm.errors.nip}
                    </p>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="create-gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Jenis Kelamin
                </label>
                <select
                  id="create-gender"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.jenis_kelamin
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.jenis_kelamin}
                  onChange={(e) =>
                    createForm.setData("jenis_kelamin", e.target.value)
                  }
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                {createForm.errors.jenis_kelamin && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.jenis_kelamin}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  No HP
                </label>
                <input
                  type="text"
                  id="create-phone"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.no_hp
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.no_hp}
                  onChange={(e) =>
                    createForm.setData("no_hp", e.target.value)
                  }
                />
                {createForm.errors.no_hp && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.no_hp}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-alamat"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Alamat
                </label>
                <textarea
                  id="create-alamat"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.alamat
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.alamat}
                  onChange={(e) =>
                    createForm.setData("alamat", e.target.value)
                  }
                  rows="3"
                ></textarea>
                {createForm.errors.alamat && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.alamat}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-tempat-lahir"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  id="create-tempat-lahir"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.tempat_lahir
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.tempat_lahir}
                  onChange={(e) =>
                    createForm.setData("tempat_lahir", e.target.value)
                  }
                />
                {createForm.errors.tempat_lahir && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.tempat_lahir}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-tanggal-lahir"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  id="create-tanggal-lahir"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.tanggal_lahir
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.tanggal_lahir}
                  onChange={(e) =>
                    createForm.setData("tanggal_lahir", e.target.value)
                  }
                />
                {createForm.errors.tanggal_lahir && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.tanggal_lahir}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-kepengurusan"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kepengurusan
                </label>
                <select
                  id="create-kepengurusan"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.kepengurusan_id
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.kepengurusan_id}
                  onChange={(e) =>
                    createForm.setData("kepengurusan_id", e.target.value)
                  }
                >
                  <option value="">Pilih Kepengurusan</option>
                  {strukturs.map((struktur) => (
                    <option key={struktur.id} value={struktur.id}>
                      {struktur.struktur}
                    </option>
                  ))}
                </select>
                {createForm.errors.kepengurusan_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.kepengurusan_id}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="create-jabatan"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Jabatan
                </label>
                <select
                  id="create-jabatan"
                  className={`w-full px-3 py-2 border rounded-md ${
                    createForm.errors.jabatan
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={createForm.data.jabatan}
                  onChange={(e) =>
                    createForm.setData("jabatan", e.target.value)
                  }
                >
                  <option value="anggota">Anggota</option>
                  <option value="koordinator">Koordinator</option>
                </select>
                {createForm.errors.jabatan && (
                  <p className="mt-1 text-sm text-red-600">
                    {createForm.errors.jabatan}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createForm.processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
                >
                  {createForm.processing ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Anggota</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama
                </label>
                <input
                  type="text"
                  id="edit-name"
                  className={`w-full px-3 py-2 border rounded-md ${
                    editForm.errors.name ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData("name", e.target.value)}
                />
                {editForm.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {editForm.errors.name}
                  </p>
                )}
              </div>
              <div className="mb-4">
  <label
    htmlFor="edit-email"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Email
  </label>
  <input
    type="email"
    id="edit-email"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.email ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.email}
    onChange={(e) => editForm.setData("email", e.target.value)}
  />
  {editForm.errors.email && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.email}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-password"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Password (Kosongkan jika tidak ingin mengubah)
  </label>
  <input
    type="password"
    id="edit-password"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.password ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.password}
    onChange={(e) => editForm.setData("password", e.target.value)}
  />
  {editForm.errors.password && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.password}
    </p>
  )}
</div>

<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Tipe Pengguna
  </label>
  <div className="flex space-x-4">
    <label className="inline-flex items-center">
      <input
        type="radio"
        className="form-radio"
        name="edit-tipe-pengguna"
        value="asisten"
        checked={editTipePengguna === "asisten"}
        onChange={handleEditTipeChange}
      />
      <span className="ml-2">Asisten</span>
    </label>
    <label className="inline-flex items-center">
      <input
        type="radio"
        className="form-radio"
        name="edit-tipe-pengguna"
        value="dosen"
        checked={editTipePengguna === "dosen"}
        onChange={handleEditTipeChange}
      />
      <span className="ml-2">Dosen</span>
    </label>
  </div>
</div>

{editTipePengguna === "asisten" ? (
  <div className="mb-4">
    <label
      htmlFor="edit-nim"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      NIM
    </label>
    <input
      type="text"
      id="edit-nim"
      className={`w-full px-3 py-2 border rounded-md ${
        editForm.errors.nim ? "border-red-500" : "border-gray-300"
      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      value={editForm.data.nim}
      onChange={(e) => editForm.setData("nim", e.target.value)}
    />
    {editForm.errors.nim && (
      <p className="mt-1 text-sm text-red-600">
        {editForm.errors.nim}
      </p>
    )}
  </div>
) : (
  <div className="mb-4">
    <label
      htmlFor="edit-nip"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      NIP
    </label>
    <input
      type="text"
      id="edit-nip"
      className={`w-full px-3 py-2 border rounded-md ${
        editForm.errors.nip ? "border-red-500" : "border-gray-300"
      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      value={editForm.data.nip}
      onChange={(e) => editForm.setData("nip", e.target.value)}
    />
    {editForm.errors.nip && (
      <p className="mt-1 text-sm text-red-600">
        {editForm.errors.nip}
      </p>
    )}
  </div>
)}

<div className="mb-4">
  <label
    htmlFor="edit-gender"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Jenis Kelamin
  </label>
  <select
    id="edit-gender"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.jenis_kelamin ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.jenis_kelamin}
    onChange={(e) => editForm.setData("jenis_kelamin", e.target.value)}
  >
    <option value="L">Laki-laki</option>
    <option value="P">Perempuan</option>
  </select>
  {editForm.errors.jenis_kelamin && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.jenis_kelamin}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-phone"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    No HP
  </label>
  <input
    type="text"
    id="edit-phone"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.no_hp ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.no_hp}
    onChange={(e) => editForm.setData("no_hp", e.target.value)}
  />
  {editForm.errors.no_hp && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.no_hp}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-alamat"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Alamat
  </label>
  <textarea
    id="edit-alamat"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.alamat ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.alamat}
    onChange={(e) => editForm.setData("alamat", e.target.value)}
    rows="3"
  ></textarea>
  {editForm.errors.alamat && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.alamat}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-tempat-lahir"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Tempat Lahir
  </label>
  <input
    type="text"
    id="edit-tempat-lahir"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.tempat_lahir ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.tempat_lahir}
    onChange={(e) => editForm.setData("tempat_lahir", e.target.value)}
  />
  {editForm.errors.tempat_lahir && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.tempat_lahir}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-tanggal-lahir"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Tanggal Lahir
  </label>
  <input
    type="date"
    id="edit-tanggal-lahir"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.tanggal_lahir ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.tanggal_lahir}
    onChange={(e) => editForm.setData("tanggal_lahir", e.target.value)}
  />
  {editForm.errors.tanggal_lahir && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.tanggal_lahir}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-kepengurusan"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Kepengurusan
  </label>
  <select
    id="edit-kepengurusan"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.kepengurusan_id ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.kepengurusan_id}
    onChange={(e) => editForm.setData("kepengurusan_id", e.target.value)}
  >
    <option value="">Pilih Kepengurusan</option>
    {strukturs.map((struktur) => (
      <option key={struktur.id} value={struktur.id}>
        {struktur.struktur}
      </option>
    ))}
  </select>
  {editForm.errors.kepengurusan_id && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.kepengurusan_id}
    </p>
  )}
</div>

<div className="mb-4">
  <label
    htmlFor="edit-jabatan"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Jabatan
  </label>
  <select
    id="edit-jabatan"
    className={`w-full px-3 py-2 border rounded-md ${
      editForm.errors.jabatan ? "border-red-500" : "border-gray-300"
    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    value={editForm.data.jabatan}
    onChange={(e) => editForm.setData("jabatan", e.target.value)}
  >
    <option value="anggota">Anggota</option>
    <option value="koordinator">Koordinator</option>
  </select>
  {editForm.errors.jabatan && (
    <p className="mt-1 text-sm text-red-600">
      {editForm.errors.jabatan}
    </p>
  )}
</div>

<div className="flex justify-end space-x-3 mt-6">
  <button
    type="button"
    onClick={closeEditModal}
    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
  >
    Batal
  </button>
  <button
    type="submit"
    disabled={editForm.processing}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
  >
    {editForm.processing ? "Menyimpan..." : "Simpan"}
  </button>
</div>
</form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <p className="mb-6">
              Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
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

export default Anggota;