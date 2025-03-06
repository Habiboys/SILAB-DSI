import React, { useEffect, useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../../Components/LabContext";

const EditAnggota = ({ anggota, strukturs, tahunKepengurusan, lab }) => {
  // Use the lab context
  const { selectedLab } = useLab();
  const [selectedStruktur, setSelectedStruktur] = useState(null);
  const [filteredStrukturs, setFilteredStrukturs] = useState(strukturs);

  // Determine the tipe based on the presence of nim or nip
  const initialTipe = anggota.nim ? "asisten" : "dosen";

  // Form for edit
  const editForm = useForm({
    name: anggota.name,
    email: anggota.email,
    tipe: initialTipe, // Set the initial tipe
    nim: anggota.nim,
    nip: anggota.nip,
    jenis_kelamin: anggota.jenis_kelamin,
    no_hp: anggota.no_hp,
    alamat: anggota.alamat,
    tempat_lahir: anggota.tempat_lahir,
    tanggal_lahir: anggota.tanggal_lahir,
    struktur_id: anggota.struktur_id,
    tahun_kepengurusan_id: anggota.tahun_kepengurusan_id,
    jabatan: anggota.jabatan,
  });

  // Handle tipe pengguna change
  const handleTipeChange = (e) => {
    const newTipe = e.target.value;
    editForm.setData("tipe", newTipe);
    editForm.setData("struktur_id", ""); // Reset selected struktur
    setSelectedStruktur(null);
    
    // Update filtered strukturs whenever tipe changes
    updateFilteredStrukturs(newTipe);
  };

  // Function to update filtered strukturs based on tipe
  const updateFilteredStrukturs = (tipe) => {
    console.log("Updating filtered strukturs for tipe:", tipe);
    console.log("Original strukturs:", strukturs);
    
    if (tipe === "dosen") {
      // For debugging - check if any structures have isdosen property
      const dosenStrukturs = strukturs.filter(s => s.isdosen == true);
      console.log("Dosen strukturs:", dosenStrukturs);
      setFilteredStrukturs(dosenStrukturs);
    } else {
      // For asisten, show all strukturs
      console.log("Setting all strukturs for asisten");
      const asistenStrukturs = strukturs.filter(s => s.isdosen == false);
      setFilteredStrukturs(asistenStrukturs);
    }
  };

  const handleStrukturChange = (e) => {
    const strukturId = e.target.value;
    editForm.setData("struktur_id", strukturId);
  
    const struktur = strukturs.find(s => s.id == strukturId);
    setSelectedStruktur(struktur);
  
    // Jika have_member adalah false, set jabatan ke koordinator
    if (struktur && !struktur.have_member) {
      editForm.setData("jabatan", "koordinator");
    } else {
      editForm.setData("jabatan", "anggota"); // Default ke anggota jika have_member true
    }
  };

  // Submission handlers
  const handleUpdate = (e) => {
    e.preventDefault();
    editForm.put(route("anggota.update", anggota.id), {
      onSuccess: () => {
        toast.success("Anggota berhasil diperbarui");
        editForm.reset();
        setSelectedStruktur(null);
      },
      onError: () => {
        toast.error("Gagal memperbarui data");
      },
    });
  };

  useEffect(() => {
    if (selectedLab && anggota?.id) {
      router.visit(`/anggota/${anggota.id}/edit`, {
        data: { lab_id: selectedLab.id },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab, anggota?.id]);

  // Initialize filtered strukturs when component mounts or when strukturs change
  useEffect(() => {
    updateFilteredStrukturs(editForm.data.tipe);
  }, [strukturs]);

  // Log the filtered strukturs whenever they change (for debugging)
  useEffect(() => {
    console.log("Filtered strukturs updated:", filteredStrukturs);
  }, [filteredStrukturs]);

  return (
    <DashboardLayout>
      <Head title="Edit Anggota Lab" />
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Anggota {lab ? lab.nama : ""}
          </h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleUpdate}>
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
                  editForm.errors.name
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.name}
                onChange={(e) =>
                  editForm.setData("name", e.target.value)
                }
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
                  editForm.errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.email}
                onChange={(e) =>
                  editForm.setData("email", e.target.value)
                }
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
                Password (biarkan kosong jika tidak ingin mengubah)
              </label>
              <input
                type="password"
                id="edit-password"
                className={`w-full px-3 py-2 border rounded-md ${
                  editForm.errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.password}
                onChange={(e) =>
                  editForm.setData("password", e.target.value)
                }
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
                    name="tipe-pengguna"
                    value="asisten"
                    checked={editForm.data.tipe === "asisten"}
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
                    checked={editForm.data.tipe === "dosen"}
                    onChange={handleTipeChange}
                  />
                  <span className="ml-2">Dosen</span>
                </label>
              </div>
            </div>

            {editForm.data.tipe === "asisten" ? (
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
                    editForm.errors.nim
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.nim}
                  onChange={(e) =>
                    editForm.setData("nim", e.target.value)
                  }
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
                    editForm.errors.nip
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={editForm.data.nip}
                  onChange={(e) =>
                    editForm.setData("nip", e.target.value)
                  }
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
                htmlFor="edit-jenis_kelamin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jenis Kelamin
              </label>
              <select
                id="edit-jenis_kelamin"
                className={`w-full px-3 py-2 border rounded-md ${
                  editForm.errors.jenis_kelamin
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.jenis_kelamin}
                onChange={(e) =>
                  editForm.setData("jenis_kelamin", e.target.value)
                }
              >
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
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
                  editForm.errors.no_hp
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.no_hp}
                onChange={(e) =>
                  editForm.setData("no_hp", e.target.value)
                }
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
                  editForm.errors.alamat
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.alamat}
                onChange={(e) =>
                  editForm.setData("alamat", e.target.value)
                }
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
                  editForm.errors.tempat_lahir
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.tempat_lahir}
                onChange={(e) =>
                  editForm.setData("tempat_lahir", e.target.value)
                }
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
                  editForm.errors.tanggal_lahir
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={editForm.data.tanggal_lahir}
                onChange={(e) =>
                  editForm.setData("tanggal_lahir", e.target.value)
                }
              />
              {editForm.errors.tanggal_lahir && (
                <p className="mt-1 text-sm text-red-600">
                  {editForm.errors.tanggal_lahir}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="struktur_id" className="block text-sm font-medium text-gray-700">
                Struktur
              </label>
              <select
                id="struktur_id"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={editForm.data.struktur_id || ''}
                onChange={handleStrukturChange}
              >
                <option value="">Pilih Struktur</option>
                {filteredStrukturs.map((struktur) => (
                  <option key={struktur.id} value={struktur.id}>
                    {struktur.struktur}
                  </option>
                ))}
              </select>
              {editForm.errors.struktur_id && (
                <div className="text-red-500 text-sm mt-1">
                  {editForm.errors.struktur_id}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="tahun_kepengurusan_id" className="block text-sm font-medium text-gray-700">
                Tahun Kepengurusan
              </label>
              <select
                id="tahun_kepengurusan_id"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={editForm.data.tahun_kepengurusan_id || ''}
                onChange={(e) => editForm.setData("tahun_kepengurusan_id", e.target.value)}
              >
                <option value="">Pilih Tahun Kepengurusan</option>
                {tahunKepengurusan.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>
                    {tahun.tahun}
                  </option>
                ))}
              </select>
              {editForm.errors.tahun_kepengurusan_id && (
                <div className="text-red-500 text-sm mt-1">
                  {editForm.errors.tahun_kepengurusan_id}
                </div>
              )}
            </div>
            
            {selectedStruktur && selectedStruktur.have_member ? (
  <div className="mb-4">
    <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700">
      Jabatan
    </label>
    <select
      id="jabatan"
      className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      value={editForm.data.jabatan || ''}
      onChange={(e) => editForm.setData("jabatan", e.target.value)}
    >
      <option value="">Pilih Jabatan</option>
      <option value="anggota">anggota</option>
      <option value="koordinator">koordinator</option>
    </select>
    {editForm.errors.jabatan && (
      <div className="text-red-500 text-sm mt-1">
        {editForm.errors.jabatan}
      </div>
    )}
  </div>
) : null}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => router.visit("/anggota")}
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
    </DashboardLayout>
  );
};

export default EditAnggota;