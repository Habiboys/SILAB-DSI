import ConfirmModal from "@/Components/ConfirmModal";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_COLORS = {
    superadmin: "bg-red-100 text-red-800",
    admin: "bg-blue-100 text-blue-800",
    kadep: "bg-purple-100 text-purple-800",
    asisten: "bg-green-100 text-green-800",
    dosen: "bg-amber-100 text-amber-800",
    kalab: "bg-indigo-100 text-indigo-800",
    praktikan: "bg-gray-100 text-gray-700",
};

const ROLE_LABELS = {
    superadmin: "Superadmin",
    admin: "Admin",
    kadep: "Kadep",
    asisten: "Asisten",
    dosen: "Dosen",
    kalab: "Kalab",
    praktikan: "Praktikan",
};

export default function UserManagement({
    users,
    laboratories,
    roles,
    filters = {},
    flash,
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [activeRole, setActiveRole] = useState(filters.role || "all");
    const [perPage, setPerPage] = useState(filters.perPage || 15);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailUser, setDetailUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Forms
    const createForm = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        roles: [],
        laboratory_id: "",
    });

    const editForm = useForm({
        _method: "PUT",
        id: "",
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        roles: [],
        laboratory_id: "",
    });

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(
                route("user-management.index"),
                {
                    search: value || undefined,
                    role: activeRole !== "all" ? activeRole : undefined,
                    perPage,
                },
                { preserveState: true, preserveScroll: true },
            );
        }, 400),
        [activeRole, perPage],
    );

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleRoleFilter = (role) => {
        setActiveRole(role);
        router.get(
            route("user-management.index"),
            {
                search: searchTerm || undefined,
                role: role !== "all" ? role : undefined,
                perPage,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePerPageChange = (e) => {
        const val = parseInt(e.target.value);
        setPerPage(val);
        router.get(
            route("user-management.index"),
            {
                search: searchTerm || undefined,
                role: activeRole !== "all" ? activeRole : undefined,
                perPage: val,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Create modal
    const openCreateModal = () => {
        createForm.reset();
        createForm.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowCreateModal(true);
    };

    const submitCreateForm = (e) => {
        e.preventDefault();
        createForm.post(route("user-management.store"), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                toast.success("User berhasil ditambahkan.");
            },
            onError: () => toast.error("Gagal menambahkan user. Periksa form."),
        });
    };

    // Edit modal
    const openEditModal = (user) => {
        editForm.setData({
            _method: "PUT",
            id: user.id,
            name: user.name,
            email: user.email,
            password: "",
            password_confirmation: "",
            roles: user.roles || [],
            laboratory_id: user.access_lab_id || "",
        });
        editForm.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowEditModal(true);
    };

    const openDetailModal = (user) => {
        setDetailUser(user);
        setShowDetailModal(true);
    };

    const submitEditForm = (e) => {
        e.preventDefault();
        editForm.post(route("user-management.update", editForm.data.id), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                toast.success("User berhasil diperbarui.");
            },
            onError: () => toast.error("Gagal memperbarui user. Periksa form."),
        });
    };

    // Delete
    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(route("user-management.destroy", deleteTarget.id), {
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success("User berhasil dihapus.");
            },
            onError: (errors) => {
                setDeleteTarget(null);
                toast.error(errors.delete || "Gagal menghapus user.");
            },
        });
    };

    // Role checkbox toggle
    const toggleRole = (form, roleName) => {
        const currentRoles = form.data.roles || [];
        if (currentRoles.includes(roleName)) {
            form.setData(
                "roles",
                currentRoles.filter((r) => r !== roleName),
            );
        } else {
            form.setData("roles", [...currentRoles, roleName]);
        }
    };

    // Check if admin role is selected → show lab dropdown
    const needsLab = (selectedRoles) => selectedRoles.includes("admin");

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Role tabs for filtering
    const roleTabs = [
        { key: "all", label: "Semua" },
        ...roles.map((r) => ({
            key: r.name,
            label: ROLE_LABELS[r.name] || r.name,
        })),
    ];

    // Input class
    const inputClass =
        "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    // Render form fields (shared between create and edit)
    const renderFormFields = (form, isEdit = false) => (
        <>
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Nama
                </label>
                <input
                    type="text"
                    className={inputClass}
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                />
                {form.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.name}
                    </p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    className={inputClass}
                    value={form.data.email}
                    onChange={(e) => form.setData("email", e.target.value)}
                />
                {form.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.email}
                    </p>
                )}
            </div>

            {/* Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Password{" "}
                    {isEdit && (
                        <span className="text-gray-400">
                            (kosongkan jika tidak diubah)
                        </span>
                    )}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        className={inputClass + " pr-10"}
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData("password", e.target.value)
                        }
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {form.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.password}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={inputClass + " pr-10"}
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                "password_confirmation",
                                e.target.value,
                            )
                        }
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Roles */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                        <label
                            key={role.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                form.data.roles.includes(role.name)
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={form.data.roles.includes(role.name)}
                                onChange={() => toggleRole(form, role.name)}
                            />
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role.name] || "bg-gray-100 text-gray-700"}`}
                            >
                                {ROLE_LABELS[role.name] || role.name}
                            </span>
                        </label>
                    ))}
                </div>
                {form.errors.roles && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.roles}
                    </p>
                )}
            </div>

            {/* Laboratory - only shown when admin role is selected */}
            {needsLab(form.data.roles) && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Laboratorium <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={inputClass}
                        value={form.data.laboratory_id}
                        onChange={(e) =>
                            form.setData("laboratory_id", e.target.value)
                        }
                    >
                        <option value="">Pilih Laboratorium</option>
                        {laboratories.map((lab) => (
                            <option key={lab.id} value={lab.id}>
                                {lab.name}
                            </option>
                        ))}
                    </select>
                    {form.errors.laboratory_id && (
                        <p className="mt-1 text-sm text-red-600">
                            {form.errors.laboratory_id}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Lab ini akan ditetapkan sebagai akses langsung admin ke
                        lab tersebut.
                    </p>
                </div>
            )}

            {/* Info text for non-admin roles */}
            {(form.data.roles.includes("asisten") ||
                form.data.roles.includes("dosen")) &&
                !needsLab(form.data.roles) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Info:</strong> Asisten dan Dosen mendapatkan
                            akses laboratorium melalui kepengurusan yang aktif,
                            bukan melalui pengaturan langsung di sini.
                        </p>
                    </div>
                )}
        </>
    );

    return (
        <DashboardLayout>
            <Head title="User Management" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                User Management
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola semua pengguna sistem.
                                <span className="ml-1 font-medium text-gray-600">
                                    {users.total} user
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah User
                        </button>
                    </div>

                    {/* Search + PerPage row */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={perPage}
                            onChange={handlePerPageChange}
                        >
                            {[10, 15, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} per halaman
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Role filter tabs */}
                <div className="border-b px-6 overflow-x-auto">
                    <nav className="-mb-px flex space-x-4">
                        {roleTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleRoleFilter(tab.key)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    activeRole === tab.key
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Laboratorium
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dibuat
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        {searchTerm || activeRole !== "all"
                                            ? "Tidak ada user yang cocok dengan filter."
                                            : "Belum ada user."}
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] || "bg-gray-100 text-gray-700"}`}
                                                    >
                                                        {ROLE_LABELS[role] ||
                                                            role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.laboratory ? (
                                                <div>
                                                    <span className="text-sm text-gray-900">
                                                        {user.laboratory.name}
                                                    </span>
                                                    <span className="ml-1 text-xs text-gray-400">
                                                        (
                                                        {user.laboratory
                                                            .source ===
                                                        "kepengurusan"
                                                            ? "kepengurusan"
                                                            : "langsung"}
                                                        )
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.created_at || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() =>
                                                        openDetailModal(user)
                                                    }
                                                    className="text-sky-600 hover:text-sky-900 p-1.5 rounded-md hover:bg-sky-50 transition-colors"
                                                    title="Detail"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openEditModal(user)
                                                    }
                                                    className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget(user)
                                                    }
                                                    className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Menampilkan {users.from}–{users.to} dari{" "}
                            {users.total} user
                        </p>
                        <Pagination links={users.links} />
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                maxWidth="lg"
            >
                <div className="max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900">
                            Tambah User Baru
                        </h3>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form
                        onSubmit={submitCreateForm}
                        className="p-6 space-y-4 overflow-y-auto"
                    >
                        {renderFormFields(createForm, false)}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                            >
                                {createForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                maxWidth="lg"
            >
                <div className="max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900">
                            Edit User
                        </h3>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form
                        onSubmit={submitEditForm}
                        className="p-6 space-y-4 overflow-y-auto"
                    >
                        {renderFormFields(editForm, true)}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                            >
                                {editForm.processing
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus User"
                message={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            {/* Detail Modal */}
            <Modal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                maxWidth="2xl"
            >
                <div className="max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
                        <h3 className="text-lg font-medium text-gray-900">
                            Detail User
                        </h3>
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6">
                        {!detailUser ? (
                            <p className="text-sm text-gray-500">
                                Data user tidak tersedia.
                            </p>
                        ) : (
                            <>
                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                                        Informasi Akun
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">
                                                Nama:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {detailUser.name || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Email:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {detailUser.email || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Role:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {(detailUser.roles || []).join(
                                                    ", ",
                                                ) || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Laboratorium:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {detailUser.laboratory?.name ||
                                                    "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Dibuat:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {detailUser.created_at_full ||
                                                    "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Diupdate:
                                            </span>{" "}
                                            <span className="font-medium text-gray-900">
                                                {detailUser.updated_at_full ||
                                                    "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                                        Data Profile
                                    </h4>
                                    {detailUser.profile ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">
                                                    Nomor Induk:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .nomor_induk || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">
                                                    Nomor Anggota:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .nomor_anggota || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">
                                                    Jenis Kelamin:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .jenis_kelamin || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">
                                                    No HP:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile.no_hp ||
                                                        "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">
                                                    Tempat Lahir:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .tempat_lahir || "-"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">
                                                    Tanggal Lahir:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .tanggal_lahir || "-"}
                                                </span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="text-gray-500">
                                                    Alamat:
                                                </span>{" "}
                                                <span className="font-medium text-gray-900">
                                                    {detailUser.profile
                                                        .alamat || "-"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            Belum ada data profile.
                                        </p>
                                    )}
                                </div>

                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                                        Data Praktikan
                                    </h4>
                                    {detailUser.praktikan_detail ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">
                                                        NIM:
                                                    </span>{" "}
                                                    <span className="font-medium text-gray-900">
                                                        {detailUser
                                                            .praktikan_detail
                                                            .nim || "-"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">
                                                        Nama Praktikan:
                                                    </span>{" "}
                                                    <span className="font-medium text-gray-900">
                                                        {detailUser
                                                            .praktikan_detail
                                                            .nama || "-"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">
                                                        No HP:
                                                    </span>{" "}
                                                    <span className="font-medium text-gray-900">
                                                        {detailUser
                                                            .praktikan_detail
                                                            .no_hp || "-"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                                    Enrollment Praktikum
                                                </p>
                                                {(
                                                    detailUser.praktikan_detail
                                                        .enrollments || []
                                                ).length === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        Belum ada enrollment
                                                        praktikum.
                                                    </p>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {detailUser.praktikan_detail.enrollments.map(
                                                            (item, idx) => (
                                                                <li
                                                                    key={idx}
                                                                    className="text-sm text-gray-700"
                                                                >
                                                                    •{" "}
                                                                    {item.praktikum ||
                                                                        "-"}{" "}
                                                                    —{" "}
                                                                    {item.kelas ||
                                                                        "-"}{" "}
                                                                    (
                                                                    {item.status ||
                                                                        "-"}
                                                                    )
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            User ini bukan praktikan atau data
                                            praktikan belum ada.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowDetailModal(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
