import Modal from "@/Components/Modal";
import { usePermission } from "@/Components/PermissionContext";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";

const KategoriAset = ({ inventaris, filters, flash }) => {
    const { auth } = usePage().props;
    const { can } = usePermission();

    
    const canCreate = true;
    const canUpdate = true;
    const canDelete = true;

    
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(filters.perPage || 10);

    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    
    const [selectedItem, setSelectedItem] = useState(null);

    
    const [selectedIds, setSelectedIds] = useState([]);
    const allSelected =
        inventaris.data.length > 0 &&
        selectedIds.length === inventaris.data.length;
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(inventaris.data.map((i) => i.id));
    };
    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const handleBulkDelete = () => setIsBulkDeleteModalOpen(true);
    const executeBulkDelete = () => {
        router.post(
            route("data-master.kategori-aset.bulk-delete"),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setIsBulkDeleteModalOpen(false);
                    toast.success("Kategori terpilih berhasil dihapus");
                },
                preserveScroll: true,
            },
        );
    };

    
    const createForm = useForm({
        nama: "",
        deskripsi: "",
    });

    
    const editForm = useForm({
        id: "",
        nama: "",
        deskripsi: "",
    });

    
    const deleteForm = useForm({});

    
    useEffect(() => {
        if (flash?.message) {
            toast.success(flash.message);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    
    const handleSearch = debounce((value) => {
        router.visit("/data-master/kategori-aset", {
            data: {
                search: value,
                perPage: perPage,
            },
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, 300);

    
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        handleSearch(value);
    };

    
    const handlePerPageChange = (e) => {
        const value = e.target.value;
        setPerPage(value);
        router.visit("/data-master/kategori-aset", {
            data: {
                search: searchTerm,
                perPage: value,
            },
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    
    const handlePageChange = (page) => {
        router.visit(page, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    
    const openCreateModal = () => {
        
        createForm.reset();
        createForm.setData({
            nama: "",
            deskripsi: "",
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();

        createForm.post(route("data-master.kategori-aset.store"), {
            onSuccess: (response) => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
            onError: (errors) => {
                console.error("Errors:", errors);
            },
            preserveScroll: true,
        });
    };

    
    const openEditModal = (item) => {
        setSelectedItem(item);
        editForm.setData({
            id: item.id,
            nama: item.nama,
            deskripsi: item.deskripsi || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();

        editForm.put(
            route("data-master.kategori-aset.update", editForm.data.id),
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                },
                preserveScroll: true,
            },
        );
    };

    
    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        deleteForm.delete(
            route("data-master.kategori-aset.destroy", selectedItem.id),
            {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setSelectedItem(null);
                },
                preserveScroll: true,
            },
        );
    };

    return (
        <DashboardLayout>
            <Head title="Kategori Aset" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Inventaris
                    </h2>
                    <div className="flex gap-4 items-center">
                        
                        {canCreate && (
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Tambah Kategori
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 border-b">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Cari inventaris..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        
                        <div className="flex items-center space-x-2">
                            <label
                                htmlFor="perPage"
                                className="text-sm text-gray-600"
                            >
                                Tampilkan:
                            </label>
                            <select
                                id="perPage"
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 min-w-[70px] text-left"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>

                
                {selectedIds.length > 0 && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedIds.length} item terpilih
                        </span>
                        <div className="flex items-center gap-2">
                            {canDelete && (
                                <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Hapus"
                                    onClick={handleBulkDelete}
                                    
                                >
    <Trash2 className="w-4 h-4" />
</button>
                            )}
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Batal Pilih
                            </button>
                        </div>
                    </div>
                )}

                
                {inventaris.data.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm
                            ? `Tidak ada hasil untuk "${searchTerm}"`
                            : "Belum ada data inventaris"}
                    </div>
                )}

                
                {inventaris.data && inventaris.data.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama aset
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inventaris.data.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${selectedIds.includes(item.id) ? "!bg-blue-50" : ""}`}
                                    >
                                        <td className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    item.id,
                                                )}
                                                onChange={() =>
                                                    toggleSelect(item.id)
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {inventaris.from + index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.nama}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.deskripsi}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jumlah || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {canUpdate || canDelete ? (
                                                <>
                                                    {canUpdate && (
                                                        <button className="p-1.5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    item,
                                                                )
                                                            }
                                                            
                                                            title="Edit"
                                                        >
    <Edit className="w-4 h-4" />
</button>
                                                    )}
                                                    {canDelete && (
                                                        <button className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    item,
                                                                )
                                                            }
                                                            
                                                            title="Hapus"
                                                        >
    <Trash2 className="w-4 h-4" />
</button>
                                                    )}
                                                </>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                
                {inventaris.data && inventaris.data.length > 0 && (
                    <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-t border-gray-200 gap-4">
                        <div className="text-sm text-gray-700">
                            Menampilkan {inventaris.from} sampai {inventaris.to}{" "}
                            dari {inventaris.total} data
                        </div>

                        <div className="flex items-center space-x-2">
                            {inventaris.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() =>
                                        link.url && handlePageChange(link.url)
                                    }
                                    className={`px-4 py-2 rounded-md text-sm ${
                                        link.active
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-100"
                                    } ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="md"
            >
                <div className="max-h-[95vh] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-3 flex-shrink-0">
                        <h3 className="text-lg font-semibold">
                            Tambah Inventaris
                        </h3>
                        <button
                            type="button"
                            onClick={() => {
                                console.log("Closing create inventaris modal");
                                setIsCreateModalOpen(false);
                            }}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                        >
                            &times;
                        </button>
                    </div>

                    <form
                        onSubmit={handleCreateSubmit}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        
                        <div className="overflow-y-auto flex-1 px-1">
                            <div className="mb-3">
                                <label
                                    htmlFor="nama"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Nama Aset
                                </label>
                                <input
                                    type="text"
                                    id="nama"
                                    value={createForm.data.nama}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "nama",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                                {createForm.errors.nama && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.nama}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label
                                    htmlFor="deskripsi"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Deskripsi
                                </label>
                                <textarea
                                    id="deskripsi"
                                    value={createForm.data.deskripsi}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "deskripsi",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    rows="3"
                                />
                                {createForm.errors.deskripsi && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {createForm.errors.deskripsi}
                                    </div>
                                )}
                            </div>
                        </div>

                        
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
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isEditModalOpen && !!selectedItem}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="md"
            >
                <div className="max-h-[95vh] flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-3 flex-shrink-0">
                        <h3 className="text-lg font-semibold">
                            Edit Inventaris
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 text-lg"
                        >
                            &times;
                        </button>
                    </div>

                    <form
                        onSubmit={handleEditSubmit}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        
                        <div className="overflow-y-auto flex-1 px-1">
                            <div className="mb-3">
                                <label
                                    htmlFor="edit-nama"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Nama Aset
                                </label>
                                <input
                                    type="text"
                                    id="edit-nama"
                                    value={editForm.data.nama}
                                    onChange={(e) =>
                                        editForm.setData("nama", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                                {editForm.errors.nama && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {editForm.errors.nama}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label
                                    htmlFor="edit-deskripsi"
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                    Deskripsi
                                </label>
                                <textarea
                                    id="edit-deskripsi"
                                    value={editForm.data.deskripsi}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "deskripsi",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    rows="3"
                                />
                                {editForm.errors.deskripsi && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {editForm.errors.deskripsi}
                                    </div>
                                )}
                            </div>
                        </div>

                        
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
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            
            <Modal
                show={isDeleteModalOpen && !!selectedItem}
                onClose={() => setIsDeleteModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Konfirmasi Hapus
                        </h3>
                        <button onClick={() => setIsDeleteModalOpen(false)}>
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
                                    Apakah Anda yakin ingin menghapus data aset
                                    "{selectedItem?.nama}" ? Semua detail aset
                                    terkait juga akan dihapus. Tindakan ini
                                    tidak dapat dibatalkan.
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
            </Modal>

            
            <Modal
                show={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Hapus Kategori Massal
                        </h3>
                        <button onClick={() => setIsBulkDeleteModalOpen(false)}>
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
                                    Apakah Anda yakin ingin menghapus{" "}
                                    <strong>
                                        {selectedIds.length} kategori
                                    </strong>{" "}
                                    terpilih? Semua detail aset terkait juga
                                    akan dihapus. Tindakan ini tidak dapat
                                    dibatalkan.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={executeBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default KategoriAset;
