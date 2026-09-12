import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Check, Eye, EyeOff, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_LABELS = {
    superadmin: "Superadmin",
    admin: "Admin",
    kadep: "Kadep",
    asisten: "Asisten",
    dosen: "Dosen",
    kalab: "Kalab",
    praktikan: "Praktikan",
};

const ROLE_TONES = {
    superadmin: "error",
    admin: "info",
    kadep: "warning",
    asisten: "success",
    dosen: "warning",
    kalab: "info",
    praktikan: "neutral",
};

export default function UserManagement({
    users,
    laboratories,
    roles,
    filters = {},
    flash,
    pendingCount = 0,
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [activeRole, setActiveRole] = useState(filters.role || "all");
    const [perPage, setPerPage] = useState(filters.perPage || 15);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailUser, setDetailUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveTarget, setApproveTarget] = useState(null);
    const approveForm = useForm({ role: "praktikan" });

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
        nomor_induk: "",
        nomor_anggota: "",
        jenis_kelamin: "",
        alamat: "",
        no_hp: "",
        tempat_lahir: "",
        tanggal_lahir: "",
    });

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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menambahkan user. Periksa form.");
            },
        });
    };

    const openEditModal = (user) => {
        const formatDate = (dateString) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().split("T")[0];
        };

        editForm.setData({
            _method: "PUT",
            id: user.id,
            name: user.name,
            email: user.email,
            password: "",
            password_confirmation: "",
            roles: user.roles || [],
            laboratory_id: user.access_lab_id || "",
            nomor_induk: user.profile?.nomor_induk || "",
            nomor_anggota: user.profile?.nomor_anggota || "",
            jenis_kelamin: user.profile?.jenis_kelamin || "",
            alamat: user.profile?.alamat || "",
            no_hp: user.profile?.no_hp || "",
            tempat_lahir: user.profile?.tempat_lahir || "",
            tanggal_lahir: formatDate(user.profile?.tanggal_lahir),
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
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal memperbarui user. Periksa form.");
            },
        });
    };

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

    const needsLab = (selectedRoles) => selectedRoles.includes("admin");

    useEffect(() => {
        if (flash?.message) toast.success(flash.message);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const openApproveModal = (user) => {
        setApproveTarget(user);
        approveForm.setData("role", "praktikan");
        approveForm.clearErrors();
        setShowApproveModal(true);
    };

    const submitApprove = (e) => {
        e.preventDefault();
        if (!approveTarget) return;
        approveForm.post(route("user-management.approve", approveTarget.id), {
            onSuccess: () => {
                setShowApproveModal(false);
                setApproveTarget(null);
                approveForm.reset();
                toast.success("User berhasil disetujui.");
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal menyetujui user.");
            },
        });
    };

    const roleTabs = [
        { key: "all", label: "Semua" },
        ...roles.map((r) => ({
            key: r.name,
            label: ROLE_LABELS[r.name] || r.name,
        })),
        { key: "no-role", label: `Pending (${pendingCount})` },
    ];

    const columns = [
        { key: "name", header: "Nama" },
        { key: "email", header: "Email" },
        {
            key: "roles",
            header: "Role",
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                        <StatusBadge status="pending" label="Belum ada role" />
                    ) : (
                        user.roles.map((role) => (
                            <StatusBadge
                                key={role}
                                tone={ROLE_TONES[role]}
                                label={ROLE_LABELS[role] || role}
                            />
                        ))
                    )}
                </div>
            ),
        },
        {
            key: "laboratory.name",
            header: "Laboratorium",
            render: (user) =>
                user.laboratory
                    ? `${user.laboratory.name} (${user.laboratory.source === "kepengurusan" ? "kepengurusan" : "langsung"})`
                    : "-",
        },
        { key: "created_at", header: "Dibuat", render: (user) => user.created_at || "-" },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            headerClassName: "text-right",
            render: (user) => (
                <RowActions
                    onDetail={() => openDetailModal(user)}
                    onEdit={() => openEditModal(user)}
                    onDelete={() => setDeleteTarget(user)}
                >
                    {user.roles.length === 0 && (
                        <IconAction
                            label="Setujui"
                            icon={Check}
                            tone="success"
                            onClick={() => openApproveModal(user)}
                        />
                    )}
                </RowActions>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title="Manajemen User" />
            <PageHeader
                title="Manajemen User"
                description={`Kelola semua pengguna sistem. ${users.total} user.`}
                actions={
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4" />
                        Tambah user
                    </Button>
                }
            />
            <PageSection
                actions={
                    <div
                        className="tabs tabs-border w-full overflow-x-auto sm:w-auto"
                        role="tablist"
                        aria-label="Filter role"
                    >
                        {roleTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={activeRole === tab.key}
                                onClick={() => handleRoleFilter(tab.key)}
                                className={`tab min-h-11 whitespace-nowrap ${activeRole === tab.key ? "tab-active" : ""}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                }
            >
                <ServerDataTable
                    paginator={users}
                    columns={columns}
                    search={searchTerm}
                    onSearchChange={handleSearch}
                    searchPlaceholder="Cari nama atau email..."
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    emptyMessage={
                        searchTerm || activeRole !== "all"
                            ? "Tidak ada user yang cocok dengan filter."
                            : "Belum ada user."
                    }
                />
            </PageSection>

            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="4xl">
                <ModalHeader title="Tambah user baru" onClose={() => setShowCreateModal(false)} />
                <form onSubmit={submitCreateForm} className="space-y-4 overflow-y-auto p-4 sm:p-5">
                    <UserFormFields
                        form={createForm}
                        roles={roles}
                        laboratories={laboratories}
                        toggleRole={toggleRole}
                        needsLab={needsLab}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                    />
                    <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Batal</Button>
                        <Button type="submit" loading={createForm.processing}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="6xl">
                <ModalHeader title="Edit user" onClose={() => setShowEditModal(false)} />
                <form onSubmit={submitEditForm} className="overflow-y-auto p-4 sm:p-5">
                    {editForm.data.roles.length > 0 && !editForm.data.roles.every((r) => r === "praktikan") ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <UserFormFields
                                    form={editForm}
                                    roles={roles}
                                    laboratories={laboratories}
                                    toggleRole={toggleRole}
                                    needsLab={needsLab}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                />
                            </div>
                            <div className="space-y-4 border-t border-base-300 pt-4 md:border-l md:border-t-0 md:pl-6">
                                <h4 className="font-semibold">Data profil</h4>
                                <FormField label="Nomor induk" error={editForm.errors.nomor_induk}>
                                    <input className="input input-bordered min-h-11 w-full" value={editForm.data.nomor_induk} onChange={(e) => editForm.setData("nomor_induk", e.target.value)} />
                                </FormField>
                                <FormField label="Nomor anggota" error={editForm.errors.nomor_anggota}>
                                    <input className="input input-bordered min-h-11 w-full" value={editForm.data.nomor_anggota} onChange={(e) => editForm.setData("nomor_anggota", e.target.value)} />
                                </FormField>
                                <FormField label="Jenis kelamin" error={editForm.errors.jenis_kelamin}>
                                    <select className="select select-bordered min-h-11 w-full" value={editForm.data.jenis_kelamin} onChange={(e) => editForm.setData("jenis_kelamin", e.target.value)}>
                                        <option value="">Pilih</option>
                                        <option value="laki-laki">Laki-laki</option>
                                        <option value="perempuan">Perempuan</option>
                                    </select>
                                </FormField>
                                <FormField label="No HP" error={editForm.errors.no_hp}>
                                    <input className="input input-bordered min-h-11 w-full" value={editForm.data.no_hp} onChange={(e) => editForm.setData("no_hp", e.target.value)} />
                                </FormField>
                                <FormField label="Tempat lahir" error={editForm.errors.tempat_lahir}>
                                    <input className="input input-bordered min-h-11 w-full" value={editForm.data.tempat_lahir} onChange={(e) => editForm.setData("tempat_lahir", e.target.value)} />
                                </FormField>
                                <FormField label="Tanggal lahir" error={editForm.errors.tanggal_lahir}>
                                    <input type="date" className="input input-bordered min-h-11 w-full" value={editForm.data.tanggal_lahir} onChange={(e) => editForm.setData("tanggal_lahir", e.target.value)} />
                                </FormField>
                                <FormField label="Alamat" error={editForm.errors.alamat}>
                                    <textarea rows={2} className="textarea textarea-bordered w-full" value={editForm.data.alamat} onChange={(e) => editForm.setData("alamat", e.target.value)} />
                                </FormField>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <UserFormFields
                                form={editForm}
                                roles={roles}
                                laboratories={laboratories}
                                toggleRole={toggleRole}
                                needsLab={needsLab}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                            />
                        </div>
                    )}
                    <div className="mt-4 flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="ghost" onClick={() => setShowEditModal(false)}>Batal</Button>
                        <Button type="submit" loading={editForm.processing}>Simpan perubahan</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Hapus user"
                message={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="4xl">
                <ModalHeader title="Detail user" onClose={() => setShowDetailModal(false)} />
                <div className="space-y-6 overflow-y-auto p-4 sm:p-5">
                    {!detailUser ? (
                        <p className="text-sm text-base-content/70">Data user tidak tersedia.</p>
                    ) : (
                        <>
                            <DetailSection title="Informasi akun">
                                <DetailItem label="Nama" value={detailUser.name || "-"} />
                                <DetailItem label="Email" value={detailUser.email || "-"} />
                                <DetailItem
                                    label="Role"
                                    value={
                                        (detailUser.roles || []).length === 0 ? (
                                            <span className="text-base-content/60">Belum ada role</span>
                                        ) : (
                                            <span className="flex flex-wrap gap-1">
                                                {detailUser.roles.map((role) => (
                                                    <StatusBadge key={role} tone={ROLE_TONES[role]} label={ROLE_LABELS[role] || role} />
                                                ))}
                                            </span>
                                        )
                                    }
                                />
                                <DetailItem
                                    label="Laboratorium"
                                    value={`${detailUser.laboratory?.name || "-"}${detailUser.laboratory?.source === "kepengurusan" ? " (kepengurusan)" : ""}`}
                                />
                                <DetailItem
                                    label="Akun Microsoft"
                                    value={
                                        detailUser.microsoft_email
                                            ? `Terhubung (${detailUser.microsoft_email})`
                                            : "Tidak terhubung"
                                    }
                                />
                                <DetailItem label="Dibuat" value={detailUser.created_at_full || "-"} />
                                <DetailItem label="Terakhir diperbarui" value={detailUser.updated_at_full || "-"} wide />
                            </DetailSection>

                            <DetailSection title="Data profil">
                                {detailUser.profile ? (
                                    <>
                                        <DetailItem label="Nomor induk" value={detailUser.profile.nomor_induk || "-"} />
                                        <DetailItem label="Nomor anggota" value={detailUser.profile.nomor_anggota || "-"} />
                                        <DetailItem label="Jenis kelamin" value={detailUser.profile.jenis_kelamin || "-"} />
                                        <DetailItem label="No HP" value={detailUser.profile.no_hp || "-"} />
                                        <DetailItem label="Tempat lahir" value={detailUser.profile.tempat_lahir || "-"} />
                                        <DetailItem label="Tanggal lahir" value={detailUser.profile.tanggal_lahir || "-"} />
                                        <DetailItem label="Alamat" value={detailUser.profile.alamat || "-"} wide />
                                    </>
                                ) : (
                                    <p className="text-sm text-base-content/60">User ini belum melengkapi profilnya.</p>
                                )}
                            </DetailSection>

                            <DetailSection title="Data praktikan">
                                {detailUser.praktikan_detail ? (
                                    <>
                                        <DetailItem label="NIM" value={detailUser.praktikan_detail.nim || "-"} />
                                        <DetailItem label="Nama praktikan" value={detailUser.praktikan_detail.nama || "-"} />
                                        <DetailItem label="No HP" value={detailUser.praktikan_detail.no_hp || "-"} />
                                        <div className="md:col-span-2">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">Enrollment praktikum</p>
                                            {(detailUser.praktikan_detail.enrollments || []).length === 0 ? (
                                                <p className="text-sm text-base-content/60">Belum ada enrollment praktikum.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {detailUser.praktikan_detail.enrollments.map((item, idx) => (
                                                        <li key={idx} className="flex flex-wrap items-center gap-2 rounded-md border border-base-300 px-3 py-2 text-sm">
                                                            <span className="font-medium">{item.praktikum || "-"}</span>
                                                            <span className="text-base-content/50">{item.kelas || "-"}</span>
                                                            <StatusBadge status={item.status} label={item.status || "-"} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-base-content/60">User ini bukan praktikan.</p>
                                )}
                            </DetailSection>
                        </>
                    )}
                </div>
                <div className="flex justify-end border-t border-base-300 p-4 sm:p-5">
                    <Button variant="ghost" onClick={() => setShowDetailModal(false)}>Tutup</Button>
                </div>
            </Modal>

            <Modal
                show={showApproveModal}
                onClose={() => {
                    setShowApproveModal(false);
                    setApproveTarget(null);
                }}
                maxWidth="md"
            >
                <ModalHeader
                    title="Setujui user"
                    onClose={() => {
                        setShowApproveModal(false);
                        setApproveTarget(null);
                    }}
                />
                <form onSubmit={submitApprove} className="space-y-4 p-4 sm:p-5">
                    <p className="text-sm text-base-content/80">
                        Berikan role untuk user <strong>{approveTarget?.name}</strong> ({approveTarget?.email}).
                    </p>
                    <FormField label="Role" error={approveForm.errors.role} required>
                        <select className="select select-bordered min-h-11 w-full" value={approveForm.data.role} onChange={(e) => approveForm.setData("role", e.target.value)}>
                            {roles.map((r) => (
                                <option key={r.id} value={r.name}>{ROLE_LABELS[r.name] || r.name}</option>
                            ))}
                        </select>
                    </FormField>
                    <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowApproveModal(false);
                                setApproveTarget(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={approveForm.processing}>Setujui</Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

function ModalHeader({ title, onClose }) {
    return (
        <div className="flex items-center justify-between border-b border-base-300 p-4 sm:p-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11" onClick={onClose} aria-label="Tutup">
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function DetailSection({ title, children }) {
    return (
        <section className="rounded-lg border border-base-300 bg-base-200/40 p-4">
            <h4 className="mb-3 font-semibold">{title}</h4>
            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">{children}</dl>
        </section>
    );
}

function DetailItem({ label, value, wide = false }) {
    return (
        <div className={wide ? "md:col-span-2" : undefined}>
            <dt className="text-base-content/60">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    );
}

function UserFormFields({
    form,
    roles,
    laboratories,
    toggleRole,
    needsLab,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
}) {
    const isEdit = form.data._method === "PUT";
    return (
        <>
            <FormField label="Nama" error={form.errors.name} required>
                <input className="input input-bordered min-h-11 w-full" value={form.data.name} onChange={(e) => form.setData("name", e.target.value)} required />
            </FormField>
            <FormField label="Email" error={form.errors.email} required>
                <input type="email" className="input input-bordered min-h-11 w-full" value={form.data.email} onChange={(e) => form.setData("email", e.target.value)} required />
            </FormField>
            <FormField
                label="Password"
                error={form.errors.password}
                hint={isEdit ? "Kosongkan jika tidak diubah." : undefined}
                required={!isEdit}
            >
                <div className="join w-full">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="input input-bordered join-item min-h-11 w-full"
                        value={form.data.password}
                        onChange={(e) => form.setData("password", e.target.value)}
                        required={!isEdit}
                    />
                    <button
                        type="button"
                        className="btn btn-ghost join-item min-h-11 border border-base-300"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormField>
            <FormField label="Konfirmasi password" required={!isEdit}>
                <div className="join w-full">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="input input-bordered join-item min-h-11 w-full"
                        value={form.data.password_confirmation}
                        onChange={(e) => form.setData("password_confirmation", e.target.value)}
                        required={!isEdit}
                    />
                    <button
                        type="button"
                        className="btn btn-ghost join-item min-h-11 border border-base-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormField>
            <FormField label="Role" error={form.errors.roles}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {roles.map((role) => (
                        <label
                            key={role.id}
                            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                                form.data.roles.includes(role.name)
                                    ? "border-primary bg-primary/10"
                                    : "border-base-300 hover:bg-base-200"
                            }`}
                        >
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-sm"
                                checked={form.data.roles.includes(role.name)}
                                onChange={() => toggleRole(form, role.name)}
                            />
                            <StatusBadge tone={ROLE_TONES[role.name]} label={ROLE_LABELS[role.name] || role.name} />
                        </label>
                    ))}
                </div>
            </FormField>
            {needsLab(form.data.roles) && (
                <FormField label="Laboratorium" error={form.errors.laboratory_id} hint="Lab ini akan ditetapkan sebagai akses langsung admin ke lab tersebut." required>
                    <select className="select select-bordered min-h-11 w-full" value={form.data.laboratory_id} onChange={(e) => form.setData("laboratory_id", e.target.value)}>
                        <option value="">Pilih laboratorium</option>
                        {laboratories.map((lab) => (
                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                        ))}
                    </select>
                </FormField>
            )}
            {(form.data.roles.includes("asisten") || form.data.roles.includes("dosen")) && !needsLab(form.data.roles) && (
                <div className="alert alert-info"><span>Asisten dan dosen mendapatkan akses laboratorium melalui kepengurusan yang aktif, bukan melalui pengaturan langsung di sini.</span></div>
            )}
        </>
    );
}
