import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataTable, DataTableHead } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { IconAction } from "@/Components/RowActions";
import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LOCKED_ROLES = ["superadmin", "kadep", "admin", "asisten", "praktikan"];

export default function RolePermissionManager({ roles, permissions, allPermissions }) {
    const { isSuperAdmin } = usePermission();
    const [selectedRole, setSelectedRole] = useState(roles[0] || null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [editingPermissions, setEditingPermissions] = useState(() => {
        const initial = {};
        if (roles[0]) roles[0].permissions.forEach((permission) => (initial[permission] = true));
        return initial;
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("matrix");

    if (!isSuperAdmin()) {
        return (
            <DashboardLayout>
                <Head title="Akses Ditolak" />
                <div className="alert alert-error" role="alert">
                    <span>Anda tidak memiliki izin untuk mengakses halaman ini.</span>
                </div>
            </DashboardLayout>
        );
    }

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        const selected = {};
        role.permissions.forEach((permission) => (selected[permission] = true));
        setEditingPermissions(selected);
    };

    const togglePermission = (permissionName) => {
        setEditingPermissions((prev) => ({ ...prev, [permissionName]: !prev[permissionName] }));
    };

    const savePermissions = () => {
        const selectedPermissions = Object.keys(editingPermissions).filter((permission) => editingPermissions[permission]);
        router.post(route("admin.roles.permissions.update", selectedRole.id), { permissions: selectedPermissions }, {
            onSuccess: () => toast.success("Izin berhasil diperbarui"),
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui izin"),
        });
    };

    const handleCreateRole = (event) => {
        event.preventDefault();
        router.post(route("admin.roles.create"), { name: newRoleName, permissions: [] }, {
            onSuccess: () => {
                toast.success(`Role '${newRoleName}' berhasil dibuat`);
                setNewRoleName("");
                setIsCreateModalOpen(false);
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal membuat role"),
        });
    };

    const handleDeleteRole = (role, confirmed = false) => {
        if (!confirmed) return;
        router.delete(route("admin.roles.delete", role.id), {
            onSuccess: () => {
                toast.success(`Role '${role.name}' berhasil dihapus`);
                if (selectedRole?.id === role.id) setSelectedRole(roles[0] || null);
            },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus role"),
        });
    };

    const filteredPermissions = searchQuery
        ? Object.entries(permissions).reduce((acc, [module, perms]) => {
              const filtered = perms.filter((permission) => permission.name.toLowerCase().includes(searchQuery.toLowerCase()) || permission.label.toLowerCase().includes(searchQuery.toLowerCase()));
              if (filtered.length > 0) acc[module] = filtered;
              return acc;
          }, {})
        : permissions;

    const totalPermissions = Object.keys(permissions).reduce((total, module) => total + permissions[module].length, 0);

    return (
        <DashboardLayout>
            <Head title="Manajemen Role & Izin" />
            <PageHeader
                title="Manajemen Role & Izin"
                description={`Kelola role dan izin akses. ${roles.length} role, ${totalPermissions} izin.`}
                actions={<Button onClick={() => setIsCreateModalOpen(true)}><Plus className="h-4 w-4" />Buat role baru</Button>}
            />

            <div className="tabs tabs-border mb-4" role="tablist" aria-label="Mode pengaturan izin">
                <button type="button" role="tab" aria-selected={activeTab === "matrix"} onClick={() => setActiveTab("matrix")} className={`tab min-h-11 ${activeTab === "matrix" ? "tab-active" : ""}`}>Matriks izin</button>
                <button type="button" role="tab" aria-selected={activeTab === "assign"} onClick={() => setActiveTab("assign")} className={`tab min-h-11 ${activeTab === "assign" ? "tab-active" : ""}`}>Atur izin</button>
            </div>

            {activeTab === "matrix" && (
                <PageSection>
                    <label className="form-control mb-4 w-full sm:max-w-sm">
                        <span className="label"><span className="label-text">Pencarian</span></span>
                        <input type="search" className="input input-bordered min-h-11 w-full" placeholder="Cari izin..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </label>
                    <DataTable className="[&_td]:align-top">
                        <DataTableHead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-base-200">Izin</th>
                                {roles.map((role) => (
                                    <th key={role.id} className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{role.name}</span>
                                            <span className="font-normal normal-case text-base-content/60">({role.permissions_count} izin)</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </DataTableHead>
                        <tbody>
                            {Object.entries(filteredPermissions).map(([module, perms]) => (
                                <FragmentModule key={module} module={module} roles={roles} perms={perms} />
                            ))}
                        </tbody>
                    </DataTable>
                </PageSection>
            )}

            {activeTab === "assign" && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <PageSection title="Daftar role" bodyClassName="p-0">
                            <ul className="divide-y divide-base-300">
                                {roles.map((role) => (
                                    <li key={role.id}>
                                        <div className={`flex items-center justify-between gap-2 p-4 ${selectedRole?.id === role.id ? "border-l-4 border-primary bg-primary/10" : ""}`}>
                                            <button type="button" onClick={() => handleRoleChange(role)} className="min-h-11 flex-1 text-left" aria-pressed={selectedRole?.id === role.id}>
                                                <span className="block font-medium">{role.name}</span>
                                                <span className="text-sm text-base-content/60">{role.permissions_count} izin</span>
                                            </button>
                                            {!LOCKED_ROLES.includes(role.name) && <DeleteRoleButton role={role} onConfirm={handleDeleteRole} />}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </PageSection>
                    </div>

                    <div className="lg:col-span-8 xl:col-span-9">
                        {selectedRole ? (
                            <PageSection
                                title={`Atur izin untuk: ${selectedRole.name}`}
                                description={`${Object.keys(editingPermissions).filter((key) => editingPermissions[key]).length} izin dipilih`}
                                actions={<Button variant="success" onClick={savePermissions}>Simpan perubahan</Button>}
                                bodyClassName="max-h-[600px] overflow-y-auto"
                            >
                                {Object.entries(permissions).map(([module, perms]) => (
                                    <div key={module} className="mb-6 last:mb-0">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="font-semibold">{module}</h4>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    const next = { ...editingPermissions };
                                                    const allSelected = perms.every((permission) => editingPermissions[permission.name]);
                                                    perms.forEach((permission) => (next[permission.name] = !allSelected));
                                                    setEditingPermissions(next);
                                                }}
                                            >
                                                Pilih semua
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {perms.map((permission) => (
                                                <label key={permission.name} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-base-300 p-2 hover:bg-base-200">
                                                    <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={editingPermissions[permission.name] || false} onChange={() => togglePermission(permission.name)} />
                                                    <span>
                                                        <span className="block text-sm font-medium">{permission.label}</span>
                                                        <span className="block text-xs text-base-content/60">{permission.name}</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </PageSection>
                        ) : (
                            <PageSection><p className="py-8 text-center text-base-content/60">Pilih role untuk mengatur izin.</p></PageSection>
                        )}
                    </div>
                </div>
            )}

            <Modal
                show={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setNewRoleName("");
                }}
                maxWidth="md"
            >
                <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
                    <h2 className="text-lg font-semibold">Buat role baru</h2>
                    <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={() => { setIsCreateModalOpen(false); setNewRoleName(""); }} aria-label="Tutup"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleCreateRole} className="space-y-4 p-4 sm:p-5">
                    <FormField label="Nama role" required>
                        <input type="text" className="input input-bordered min-h-11 w-full" placeholder="contoh: keuangan" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} required />
                    </FormField>
                    <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => { setIsCreateModalOpen(false); setNewRoleName(""); }}>Batal</Button>
                        <Button type="submit">Buat</Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

function FragmentModule({ module, roles, perms }) {
    return (
        <>
            <tr className="bg-base-200">
                <td colSpan={roles.length + 1} className="font-semibold">{module}</td>
            </tr>
            {perms.map((permission) => (
                <tr key={permission.name} className="hover">
                    <td className="sticky left-0 z-10 bg-base-100">
                        <span className="block font-medium">{permission.label}</span>
                        <span className="block text-xs text-base-content/60">{permission.name}</span>
                    </td>
                    {roles.map((role) => (
                        <td key={role.id} className="text-center">
                            {role.permissions.includes(permission.name) ? (
                                <Check className="mx-auto h-5 w-5 text-success" aria-label="Diizinkan" />
                            ) : (
                                <X className="mx-auto h-5 w-5 text-base-content/30" aria-label="Tidak diizinkan" />
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function DeleteRoleButton({ role, onConfirm }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <IconAction label="Hapus role" icon={Trash2} tone="delete" onClick={() => setOpen(true)} />
            <ConfirmModal
                show={open}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                    setOpen(false);
                    onConfirm(role, true);
                }}
                title="Hapus role"
                message={`Yakin ingin menghapus role '${role.name}'? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </>
    );
}
