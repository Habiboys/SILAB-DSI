import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../../Components/LabContext";

const Createanggota = ({ strukturs, tahunKepengurusan, lab }) => {
  // Use the lab context
  const { selectedLab } = useLab();
  const [selectedStruktur, setSelectedStruktur] = useState(null);
  const [filteredStrukturs, setFilteredStrukturs] = useState(strukturs);

  // Form for create
  const createForm = useForm({
    name: "",
    email: "",
    password: "",
    tipe: "asisten",
    nim: "",
    nip: "",
    jenis_kelamin: "laki-laki",
    no_hp: "",
    alamat: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    struktur_id: "",
    tahun_kepengurusan_id: "",
    jabatan: "anggota",
  });

  // Handle tipe pengguna change
  const handleTipeChange = (e) => {
    const newTipe = e.target.value;
    createForm.setData("tipe", newTipe);
    createForm.setData("struktur_id", ""); // Reset selected struktur
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
    createForm.setData("struktur_id", strukturId);
  
    const struktur = strukturs.find(s => s.id == strukturId);
    setSelectedStruktur(struktur);
  
    // Jika have_member adalah false, set jabatan ke koordinator
    if (struktur && !struktur.have_member) {
      createForm.setData("jabatan", "koordinator");
    } else {
      createForm.setData("jabatan", "anggota"); // Default ke anggota jika have_member true
    }
  };
  // Submission handlers
  const handleCreate = (e) => {
    e.preventDefault();
    createForm.post(route("anggota.store"), {
      onSuccess: () => {
        toast.success("anggota berhasil ditambahkan");
        createForm.reset();
        setSelectedStruktur(null);
      },
      onError: () => {
        toast.error("Gagal menambahkan data");
      },
    });
  };

  useEffect(() => {
    if (selectedLab) {
      router.visit("/anggota/create", {
        data: { lab_id: selectedLab.id },
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }
  }, [selectedLab]);

  // Initialize filtered strukturs when component mounts or when strukturs change
  useEffect(() => {
    updateFilteredStrukturs(createForm.data.tipe);
  }, [strukturs]);

  // Log the filtered strukturs whenever they change (for debugging)
  useEffect(() => {
    console.log("Filtered strukturs updated:", filteredStrukturs);
  }, [filteredStrukturs]);

  return (
    <DashboardLayout>
      <Head title="Tambah anggota Lab" />
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Tambah anggota {lab ? lab.nama : ""}
          </h2>
        </div>

        <div className="p-6">
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
                    checked={createForm.data.tipe === "asisten"}
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
                    checked={createForm.data.tipe === "dosen"}
                    onChange={handleTipeChange}
                  />
                  <span className="ml-2">Dosen</span>
                </label>
              </div>
            </div>

            {createForm.data.tipe === "asisten" ? (
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
                htmlFor="create-jenis_kelamin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jenis Kelamin
              </label>
              <select
                id="create-jenis_kelamin"
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
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
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
              <label htmlFor="struktur_id" className="block text-sm font-medium text-gray-700">
                Struktur
              </label>
              <select
                id="struktur_id"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={createForm.data.struktur_id || ''}
                onChange={handleStrukturChange}
              >
                <option value="">Pilih Struktur</option>
                {/* If we're in dosen mode but no struktur matches, show a message */}
                {createForm.data.tipe === "dosen" && filteredStrukturs.length === 0 ? (
                  <option value="" disabled>
                    Tidak ada struktur untuk Dosen
                  </option>
                ) : (
                  filteredStrukturs.map((struktur) => (
                    <option key={struktur.id} value={struktur.id}>
                      {struktur.struktur}
                    </option>
                  ))
                )}
              </select>
              {createForm.errors.struktur_id && (
                <div className="text-red-500 text-sm mt-1">
                  {createForm.errors.struktur_id}
                </div>
              )}
              {createForm.data.tipe === "dosen" && filteredStrukturs.length === 0 && (
                <div className="text-orange-500 text-sm mt-1">
                  Tidak ada struktur yang tersedia untuk tipe Dosen
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
                value={createForm.data.tahun_kepengurusan_id || ''}
                onChange={(e) => createForm.setData("tahun_kepengurusan_id", e.target.value)}
              >
                <option value="">Pilih Tahun Kepengurusan</option>
                {tahunKepengurusan.map((tahun) => (
                  <option key={tahun.id} value={tahun.id}>
                    {tahun.tahun}
                  </option>
                ))}
              </select>
              {createForm.errors.tahun_kepengurusan_id && (
                <div className="text-red-500 text-sm mt-1">
                  {createForm.errors.tahun_kepengurusan_id}
                </div>
              )}
            </div>
            
            {selectedStruktur && !selectedStruktur.have_member ? (
  <div className="mb-4">
    <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700">
      Jabatan
    </label>
    <div className="mt-1 block w-full py-2 px-3 border border-gray-200 bg-gray-100 text-gray-700 rounded-md">
      -
    </div>
    <div className="text-xs text-gray-500 mt-1">
      Struktur ini tidak memiliki anggota
    </div>
    {/* Input tersembunyi untuk mengirim nilai jabatan */}
    <input
      type="hidden"
      name="jabatan"
      value="koordinator"
    />
  </div>
) : (
  <div className="mb-4">
    <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700">
      Jabatan
    </label>
    <select
      id="jabatan"
      className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      value={createForm.data.jabatan || ''}
      onChange={(e) => createForm.setData("jabatan", e.target.value)}
    >
      <option value="">Pilih Jabatan</option>
      <option value="anggota">anggota</option>
      <option value="koordinator">koordinator</option>
    </select>
    {createForm.errors.jabatan && (
      <div className="text-red-500 text-sm mt-1">
        {createForm.errors.jabatan}
      </div>
    )}
  </div>
)}

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
                disabled={createForm.processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-75"
              >
                {createForm.processing ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Createanggota;