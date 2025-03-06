import React, { useState, useEffect } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLab } from "../../Components/LabContext";

const Anggota = ({ anggota, strukturs, tahunKepengurusan, selectedTahun, lab }) => {
  // Use the lab context
  const { selectedLab } = useLab();

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form for delete
  const { delete: destroy } = useForm();

  // Form for filter by tahun
  const filterForm = useForm({
    tahun_id: selectedTahun || "",
  });

  // Delete modal handlers
  const openDeleteModal = (id) => {
    setSelectedId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedId(null);
  };

  // Handle delete submission
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

  return (
    <DashboardLayout>
      <Head title="Anggota Lab" />
      <ToastContainer />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Anggota 
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
            <Link
              href={route("anggota.create")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={!selectedLab || strukturs.length === 0}
            >
              Tambah Anggota
            </Link>
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
                    <Link
                      href={route("anggota.edit", item.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </Link>
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