import Button from "@/Components/Button";
import FormField from "@/Components/FormField";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

export default function StrukturPermissionManager({ jabatans, permissions, jabatanPermissions }) {
    const { isSuperAdmin } = usePermission();
    const [selectedJabatan, setSelectedJabatan] = useState(jabatans[0]?.jabatan || null);
    const [editingPermissions, setEditingPermissions] = useState(() => {
        const initial = {};
        const firstJabatan = jabatans[0]?.jabatan;
        if (firstJabatan) (jabatanPermissions[firstJabatan] || []).forEach((permission) => (initial[permission] = true));
        return initial;
    });
    const [searchQuery, setSearchQuery] = useState("");

    if (!isSuperAdmin()) {
        return (
            <DashboardLayout>
                <Head title="Akses Ditolak" />
                <div className="alert alert-error" role="alert">
                    <span>Hanya superadmin yang dapat mengakses halaman ini.</span>
                </div>
            </DashboardLayout>
        );
    }

    const handleJabatanChange = (jabatan) => {
        setSelectedJabatan(jabatan);
        const selected = {};
        (jabatanPermissions[jabatan] || []).forEach((permission) => (selected[permission] = true));
        setEditingPermissions(selected);
    };

    const togglePermission = (permissionName) => {
        setEditingPermissions((prev) => ({ ...prev, [permissionName]: !prev[permissionName] }));
    };

    const savePermissions = () => {
        const selectedPermissions = Object.keys(editingPermissions).filter((permission) => editingPermissions[permission]);
        router.put(route("struktur-permissions.update", selectedJabatan), { permissions: selectedPermissions }, {
            onSuccess: () => toast.success("Izin berhasil diperbarui"),
            onError: () => toast.error("Gagal memperbarui izin"),
        });
    };

    const currentJabatanData = jabatans.find((item) => item.jabatan === selectedJabatan);
    const inherited = currentJabatanData?.inherited_permissions || [];

    const filteredPermissions = searchQuery
        ? Object.entries(permissions).reduce((acc, [module, perms]) => {
              const filtered = perms.filter((permission) => permission.name.toLowerCase().includes(searchQuery.toLowerCase()) || permission.label.toLowerCase().includes(searchQuery.toLowerCase()));
              if (filtered.length > 0) acc[module] = filtered;
              return acc;
          }, {})
        : permissions;

    return (
        <DashboardLayout>
            <Head title="Manajemen Izin Struktur" />
            <PageHeader
                title="Manajemen Izin Struktur"
                description={`Tetapkan izin tambahan per jabatan. Jabatan diambil otomatis dari Data Master Struktur. ${jabatans.length} jabatan.`}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-4 xl:col-span-3">
                    <PageSection title="Jabatan" bodyClassName="p-0">
                        <ul className="max-h-[600px] divide-y divide-base-300 overflow-y-auto">
                            {jabatans.map((jab) => (
                                <li key={jab.jabatan}>
                                    <button
                                        type="button"
                                        onClick={() => handleJabatanChange(jab.jabatan)}
                                        aria-pressed={selectedJabatan === jab.jabatan}
                                        className={`min-h-11 w-full p-4 text-left ${selectedJabatan === jab.jabatan ? "border-l-4 border-primary bg-primary/10" : ""}`}
                                    >
                                        <span className="block font-medium">{jab.jabatan}</span>
                                        <span className="mt-1 flex flex-wrap items-center gap-2">
                                            <StatusBadge status="neutral" label={jab.base_role} className="uppercase" />
                                            <span className="text-sm text-base-content/60">{jab.permissions_count} izin tambahan</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </PageSection>
                </div>

                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedJabatan ? (
                        <PageSection
                            title={`Izin untuk: ${selectedJabatan}`}
                            description={`${Object.keys(editingPermissions).filter((key) => editingPermissions[key]).length} izin dipilih`}
                            actions={<Button variant="success" onClick={savePermissions}>Simpan perubahan</Button>}
                            bodyClassName="max-h-[600px] overflow-y-auto"
                        >
                            <div className="mb-4 max-w-sm">
                                <FormField label="Pencarian">
                                    <input type="search" className="input input-bordered min-h-11 w-full" placeholder="Cari izin..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </FormField>
                            </div>
                            <div className="alert alert-info mb-4">
                                <span>
                                    <strong>Izin bawaan</strong> berasal dari role dasar <strong className="uppercase">{currentJabatanData?.base_role}</strong> dan tidak dapat diubah di sini.
                                </span>
                            </div>

                            {Object.entries(filteredPermissions).map(([module, perms]) => {
                                const assignable = perms.filter((permission) => !inherited.includes(permission.name));
                                return (
                                    <div key={module} className="mb-6 last:mb-0">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="font-semibold">{module}</h4>
                                            {assignable.length > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const next = { ...editingPermissions };
                                                        const allSelected = assignable.every((permission) => editingPermissions[permission.name]);
                                                        assignable.forEach((permission) => (next[permission.name] = !allSelected));
                                                        setEditingPermissions(next);
                                                    }}
                                                >
                                                    Pilih semua
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {perms.map((permission) => {
                                                const isInherited = inherited.includes(permission.name);
                                                return (
                                                    <label
                                                        key={permission.name}
                                                        className={`flex min-h-11 items-center gap-3 rounded-md border border-base-300 p-2 ${isInherited ? "cursor-not-allowed bg-base-200 opacity-75" : "cursor-pointer hover:bg-base-200"}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-primary checkbox-sm"
                                                            checked={isInherited || editingPermissions[permission.name] || false}
                                                            onChange={() => !isInherited && togglePermission(permission.name)}
                                                            disabled={isInherited}
                                                        />
                                                        <span>
                                                            <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                                                {permission.label}
                                                                {isInherited && <StatusBadge status="neutral" label={currentJabatanData?.base_role} className="uppercase" />}
                                                            </span>
                                                            <span className="block text-xs text-base-content/60">{permission.name}</span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </PageSection>
                    ) : (
                        <PageSection><p className="py-8 text-center text-base-content/60">Pilih jabatan untuk mengatur izin.</p></PageSection>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
