import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { DataGrid } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { GitBranch, Plus, Trash2, TriangleAlert, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PraktikanIndex = ({
    praktikum,
    praktikan,
    praktikanByKelas,
    praktikanTanpaKelas,
    availableUsers,
    kelas,
    lab,
    filters = {},
    classContext = null,
}) => {
    const { can, hasRole } = usePermission();
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");
    const canManage = can("praktikan.create") || isAdmin || isKadep;

    const allKelas = kelas || [];
    const parentKelasList = allKelas
        .filter((item) => !item.parent_kelas_id)
        .map((parent) => ({ ...parent, subKelas: allKelas.filter((sub) => sub.parent_kelas_id === parent.id), hasSubKelas: allKelas.some((sub) => sub.parent_kelas_id === parent.id) }));
    const enrollmentKelas = allKelas.filter((item) => item.parent_kelas_id || !allKelas.some((sub) => sub.parent_kelas_id === item.id));
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem?.parent_kelas_id) return kelasItem?.nama_kelas || "";
        const parent = parentKelasList.find((item) => item.id === kelasItem.parent_kelas_id);
        return parent ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}` : kelasItem?.nama_kelas || "";
    };

    const contextKelasId = classContext?.id || filters.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId || "all";
    const initKelas = allKelas.find((item) => item.id === initKelasId);
    const [activeParentId, setActiveParentId] = useState(initKelasId === "all" ? "all" : initKelas?.parent_kelas_id || initKelasId);
    const [activeSubId, setActiveSubId] = useState(initKelas?.parent_kelas_id ? initKelas.id : null);
    const activeKelasId = activeParentId === "all" ? "all" : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((item) => item.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddExistingModalOpen, setIsAddExistingModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPraktikan, setSelectedPraktikan] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [distribusiModal, setDistribusiModal] = useState(false);
    const [distribusiSearch, setDistribusiSearch] = useState("");
    const [pindahMassalModal, setPindahMassalModal] = useState(false);
    const [pindahMassalSearch, setPindahMassalSearch] = useState("");

    const createForm = useForm({ nim: "", nama: "", no_hp: "", kelas_id: "", is_existing_user: false });
    const addExistingForm = useForm({ user_id: "", kelas_id: "" });
    const importForm = useForm({ file: null });
    const deleteForm = useForm({});
    const editForm = useForm({ nim: "", nama: "", no_hp: "", kelas_id: "", password: "", _method: "PUT" });
    const distribusiForm = useForm({ praktikan_ids: [], target_kelas_id: "" });
    const pindahMassalForm = useForm({ praktikan_ids: [], target_kelas_id: "" });

    const getCurrentPraktikanData = () => {
        if (activeParentId === "all") return praktikan || [];
        return (praktikanByKelas?.[activeKelasId] || [])
            .map((enrollment) => {
                const item = enrollment.praktikan;
                if (item) {
                    item.kelas = enrollment.kelas;
                    item.status = enrollment.status;
                    item.enrollment_id = enrollment.id;
                }
                return item;
            })
            .filter(Boolean);
    };
    const rows = getCurrentPraktikanData();
    const orphanedEnrollments = activeParentId !== "all" && showSubTabs ? praktikanByKelas?.[activeParentId] || [] : [];
    const allEnrollmentsForPindah = [...(praktikanTanpaKelas || []), ...allKelas.flatMap((item) => praktikanByKelas?.[item.id] || [])];

    const closeAll = () => {
        createForm.reset();
        addExistingForm.reset();
        importForm.reset();
        editForm.reset();
        setSearchQuery("");
        setSelectedPraktikan(null);
        setIsCreateModalOpen(false);
        setIsAddExistingModalOpen(false);
        setIsImportModalOpen(false);
        setIsEditModalOpen(false);
    };

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData("kelas_id", contextKelasId || (showSubTabs ? activeSubId || "" : activeParentId !== "all" ? activeParentId : ""));
        setIsCreateModalOpen(true);
    };
    const openEditModal = (item) => {
        setSelectedPraktikan(item);
        editForm.setData({ nim: item.nim, nama: item.nama, no_hp: item.no_hp || "", kelas_id: contextKelasId || item.kelas?.id || "", password: "", _method: "PUT" });
        setIsEditModalOpen(true);
    };
    const openDistribusiModal = () => {
        distribusiForm.setData({ target_kelas_id: currentSubKelas[0]?.id || "", praktikan_ids: orphanedEnrollments.map((enrollment) => enrollment.id) });
        setDistribusiSearch("");
        setDistribusiModal(true);
    };
    const openPindahMassalModal = () => {
        pindahMassalForm.setData({ praktikan_ids: [], target_kelas_id: "" });
        setPindahMassalSearch("");
        setPindahMassalModal(true);
    };

    const errorToast = (errors, fallback) => toast.error(Object.values(errors).find(Boolean) || fallback);

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("praktikum.praktikan.store", { praktikum: praktikum.id }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil ditambahkan"); closeAll(); }, onError: (errors) => errorToast(errors, "Gagal menambahkan praktikan") });
    };
    const handleAddExisting = (event) => {
        event.preventDefault();
        addExistingForm.post(route("praktikum.praktikan.add-existing", { praktikum: praktikum.id }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil ditambahkan"); closeAll(); }, onError: (errors) => errorToast(errors, "Gagal menambahkan praktikan") });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.post(route("praktikum.praktikan.update", { praktikum: praktikum.id, praktikan: selectedPraktikan.id }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil diperbarui"); closeAll(); }, onError: (errors) => errorToast(errors, "Gagal memperbarui praktikan") });
    };
    const handleImport = (event) => {
        event.preventDefault();
        importForm.post(route("praktikum.praktikan.import", { praktikum: praktikum.id }), { forceFormData: true, preserveScroll: true, onSuccess: () => { toast.success("Data praktikan berhasil diimport"); closeAll(); }, onError: (errors) => errorToast(errors, "Gagal mengimport data praktikan") });
    };
    const confirmRemoveFromKelas = () => deleteForm.put(route("praktikum.praktikan.remove-kelas", { praktikum: praktikum.id, praktikan: selectedPraktikan.id }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil dikeluarkan dari kelas"); closeAll(); }, onError: (errors) => errorToast(errors, "Gagal mengeluarkan praktikan dari kelas") });
    const handleDistribusi = (event) => {
        event.preventDefault();
        distribusiForm.post(route("kelas.pindah-praktikan", { kelas: activeParentId }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil dipindahkan"); setDistribusiModal(false); setDistribusiSearch(""); }, onError: (errors) => errorToast(errors, "Gagal memindahkan praktikan") });
    };
    const handlePindahMassal = (event) => {
        event.preventDefault();
        pindahMassalForm.post(route("praktikum.praktikan.pindah-kelas-massal", { praktikum: praktikum.id }), { preserveScroll: true, onSuccess: () => { toast.success("Praktikan berhasil dipindahkan"); setPindahMassalModal(false); setPindahMassalSearch(""); }, onError: (errors) => errorToast(errors, "Gagal memindahkan praktikan") });
    };

    const getParentTabCount = (parent) => parent.hasSubKelas ? parent.subKelas.reduce((sum, sub) => sum + (praktikanByKelas?.[sub.id]?.length || 0), 0) : praktikanByKelas?.[parent.id]?.length || 0;
    const getSubCount = (subId) => praktikanByKelas?.[subId]?.length || 0;

    const classContextLabel = classContext?.nama_kelas || null;
    const pageTitle = classContextLabel ? `Kelola Praktikan Kelas ${classContextLabel}` : "Kelola Praktikan";

    const filteredUsers = (availableUsers || []).filter((user) => [user.nama, user.nim, user.email].some((value) => (value || "").toLowerCase().includes(searchQuery.toLowerCase())));
    const filterEnrollments = (enrollments, term) => {
        const query = term.trim().toLowerCase();
        if (!query) return enrollments;
        return enrollments.filter((enrollment) => [enrollment.praktikan?.nama, enrollment.praktikan?.nim, enrollment.praktikan?.user?.email, enrollment.kelas?.nama_kelas].some((value) => (value || "").toLowerCase().includes(query)));
    };
    const distribusiFilteredEnrollments = filterEnrollments(orphanedEnrollments, distribusiSearch);
    const pindahMassalFiltered = filterEnrollments(allEnrollmentsForPindah, pindahMassalSearch);
    const kelasOptionsPindahMassal = [
        { id: "", label: "Tanpa kelas" },
        ...parentKelasList.filter((parent) => parent.hasSubKelas).map((parent) => ({ id: parent.id, label: `${parent.nama_kelas} (induk)` })),
        ...enrollmentKelas.map((item) => ({ id: item.id, label: getKelasLabel(item) })),
    ];

    const columns = [
        { header: "No", sortable: false, render: (_, index) => index + 1 },
        { key: "nim", header: "NIM", sortable: true },
        { key: "nama", header: "Nama", sortable: true },
        { key: "user.email", header: "Email", render: (item) => item.user?.email || "-" },
        { key: "no_hp", header: "No HP", render: (item) => item.no_hp || "-" },
        ...(!hasClassContext ? [{ key: "kelas.nama_kelas", header: "Kelas", render: (item) => item.kelas ? <StatusBadge status="info" tone="info" label={item.kelas.nama_kelas} /> : <StatusBadge status="neutral" tone="neutral" label="Belum Diassign" /> }] : []),
        ...(canManage ? [{
            header: "Aksi",
            sortable: false,
            searchable: false,
            render: (item) => (
                <RowActions onEdit={() => openEditModal(item)}>
                    <IconAction label="Keluarkan dari kelas" icon={UserMinus} tone="delete" onClick={() => { setSelectedPraktikan(item); setIsDeleteModalOpen(true); }} />
                </RowActions>
            ),
        }] : []),
    ];

    const enrollmentList = ({ enrollments, filtered, search, onSearch, onToggle, selectedIds, accent, emptyText }) => (
        <>
            <input type="search" className="input input-bordered min-h-11 w-full" placeholder="Cari nama, NIM, atau email..." value={search} onChange={(event) => onSearch(event.target.value)} />
            <div className="mt-2 max-h-64 divide-y divide-base-200 overflow-y-auto rounded-md border border-base-300">
                {enrollments.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-base-content/60">{emptyText}</p>
                ) : filtered.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-base-content/60">Tidak ada hasil untuk "{search}"</p>
                ) : (
                    filtered.map((enrollment) => {
                        const checked = selectedIds.includes(enrollment.id);
                        return (
                            <label key={enrollment.id} className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 ${checked ? accent : "hover:bg-base-200/50"}`}>
                                <input type="checkbox" className="checkbox checkbox-sm" checked={checked} onChange={() => onToggle(enrollment.id)} />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium">{enrollment.praktikan?.nama}</span>
                                        <span className="font-mono text-xs text-base-content/60">{enrollment.praktikan?.nim}</span>
                                    </span>
                                    <span className="block truncate text-xs text-base-content/60">{enrollment.praktikan?.user?.email}{enrollment.kelas ? ` → ${getKelasLabel(enrollment.kelas)}` : " (tanpa kelas)"}</span>
                                </span>
                            </label>
                        );
                    })
                )}
            </div>
        </>
    );

    return (
        <DashboardLayout>
            <Head title={pageTitle} />
            <PageHeader
                title={pageTitle}
                description={`Mata kuliah ${praktikum?.mata_kuliah || "-"}${lab?.nama_lab ? ` · Lab ${lab.nama_lab}` : ""}.`}
                actions={canManage && (
                    <>
                        <Button variant="ghost" onClick={() => window.open(route("praktikan.template.download", { praktikum_id: praktikum.id }), "_blank")}>Download Template</Button>
                        <Button variant="ghost" onClick={() => setIsImportModalOpen(true)}>Import Excel</Button>
                        <Button variant="secondary" onClick={() => { addExistingForm.reset(); addExistingForm.setData("kelas_id", contextKelasId || ""); setSearchQuery(""); setIsAddExistingModalOpen(true); }}>Tambah Existing User</Button>
                        <Button onClick={openCreateModal}><Plus className="h-4 w-4" /> Tambah Praktikan</Button>
                        <Button variant="ghost" onClick={openPindahMassalModal}>Pindah Kelas Massal</Button>
                    </>
                )}
            />

            {!hasClassContext && (
                <div className="tabs tabs-border mb-3 overflow-x-auto">
                    <button type="button" className={`tab whitespace-nowrap ${activeParentId === "all" ? "tab-active" : ""}`} onClick={() => { setActiveParentId("all"); setActiveSubId(null); }}>
                        Semua <span className="badge badge-sm badge-ghost ml-1">{praktikan?.length || 0}</span>
                    </button>
                    {parentKelasList.map((parent) => (
                        <button key={parent.id} type="button" className={`tab whitespace-nowrap ${activeParentId === parent.id ? "tab-active" : ""}`} onClick={() => { setActiveParentId(parent.id); setActiveSubId(parent.hasSubKelas ? parent.subKelas[0]?.id || null : null); }}>
                            {parent.nama_kelas}
                            {parent.hasSubKelas && <span className="badge badge-sm badge-ghost ml-1"><GitBranch className="h-3 w-3" aria-hidden="true" />{parent.subKelas.length}</span>}
                            <span className="badge badge-sm badge-ghost ml-1">{getParentTabCount(parent)}</span>
                        </button>
                    ))}
                </div>
            )}

            {!hasClassContext && showSubTabs && (
                <div className="mb-3 space-y-2 rounded-md border border-base-300 bg-base-200/60 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-medium text-base-content/70"><GitBranch className="h-3.5 w-3.5" aria-hidden="true" /> Sub-kelas {activeParent?.nama_kelas}:</span>
                        {currentSubKelas.map((sub) => (
                            <button key={sub.id} type="button" className={`btn btn-xs min-h-8 ${activeSubId === sub.id ? "btn-primary" : "btn-ghost border border-base-300"}`} onClick={() => setActiveSubId(sub.id)}>{sub.nama_kelas} ({getSubCount(sub.id)})</button>
                        ))}
                    </div>
                    <p className="text-xs text-warning">Kelas ini sudah dipecah menjadi sub-kelas, praktikan dikelola per sub-kelas.</p>
                </div>
            )}

            {!hasClassContext && showSubTabs && orphanedEnrollments.length > 0 && (
                <div className="mb-3 flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-2 text-sm">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <span><strong>{orphanedEnrollments.length} praktikan</strong> masih terdaftar di <strong>{activeParent?.nama_kelas}</strong> (kelas induk). Distribusikan ke sub-kelas agar bisa dikelola dengan benar.</span>
                    </p>
                    {canManage && <Button variant="ghost" onClick={openDistribusiModal}>Distribusikan ke Sub-Kelas</Button>}
                </div>
            )}

            <PageSection bodyClassName="p-4 sm:p-5">
                <DataGrid
                    rows={rows}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari NIM, nama, email, kelas..."
                    emptyMessage="Tidak ada data praktikan."
                    filters={!hasClassContext ? [{ key: "kelas.nama_kelas", label: "Kelas", options: allKelas.map((item) => ({ value: item.nama_kelas, label: getKelasLabel(item) })) }] : []}
                />
            </PageSection>

            <Modal show={isAddExistingModalOpen} onClose={closeAll} maxWidth="2xl">
                <form onSubmit={handleAddExisting} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">Tambah Existing User sebagai Praktikan</h2></header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Cari User"><input type="search" className="input input-bordered min-h-11 w-full" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari berdasarkan nama, NIM, atau email..." /></FormField>
                        <FormField label="Pilih User" error={addExistingForm.errors.user_id} required>
                            <div className="max-h-48 divide-y divide-base-200 overflow-y-auto rounded-md border border-base-300">
                                {filteredUsers.length === 0 ? <p className="p-3 text-center text-sm text-base-content/60">{searchQuery ? "Tidak ada user yang sesuai pencarian." : "Tidak ada user tersedia."}</p> : filteredUsers.map((user) => (
                                    <label key={user.id} className="flex min-h-11 cursor-pointer items-center gap-3 p-3 hover:bg-base-200/50">
                                        <input type="radio" name="user_id" className="radio radio-sm" value={user.id} checked={addExistingForm.data.user_id === user.id} onChange={(event) => addExistingForm.setData("user_id", event.target.value)} />
                                        <span><span className="block font-medium">{user.nama}</span><span className="block text-sm text-base-content/60">NIM: {user.nim || "-"} · {user.email}</span></span>
                                    </label>
                                ))}
                            </div>
                        </FormField>
                        {!hasClassContext && <FormField label="Assign ke Kelas" error={addExistingForm.errors.kelas_id} required><select className="select select-bordered min-h-11 w-full" value={addExistingForm.data.kelas_id} onChange={(event) => addExistingForm.setData("kelas_id", event.target.value)} required><option value="">Pilih Kelas</option>{enrollmentKelas.map((item) => <option key={item.id} value={item.id}>{getKelasLabel(item)}</option>)}</select></FormField>}
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeAll}>Batal</Button><Button type="submit" loading={addExistingForm.processing} disabled={!addExistingForm.data.user_id}>Tambah</Button></footer>
                </form>
            </Modal>

            <Modal show={isCreateModalOpen} onClose={closeAll} maxWidth="md">
                <form onSubmit={handleCreate} className="p-5">
                    <h2 className="text-lg font-semibold">Tambah Praktikan Baru</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="NIM" error={createForm.errors.nim} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.nim} onChange={(event) => createForm.setData("nim", event.target.value)} required /></FormField>
                        <FormField label="Nama" error={createForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.nama} onChange={(event) => createForm.setData("nama", event.target.value)} required /></FormField>
                        <FormField label="No HP" error={createForm.errors.no_hp}><input className="input input-bordered min-h-11 w-full" value={createForm.data.no_hp} onChange={(event) => createForm.setData("no_hp", event.target.value)} /></FormField>
                        {!hasClassContext && <FormField label="Pilih Kelas" error={createForm.errors.kelas_id} required><select className="select select-bordered min-h-11 w-full" value={createForm.data.kelas_id} onChange={(event) => createForm.setData("kelas_id", event.target.value)} required><option value="">Pilih Kelas</option>{enrollmentKelas.map((item) => <option key={item.id} value={item.id}>{getKelasLabel(item)}</option>)}</select></FormField>}
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeAll}>Batal</Button><Button type="submit" loading={createForm.processing}>Tambah</Button></div>
                </form>
            </Modal>

            <Modal show={isEditModalOpen && !!selectedPraktikan} onClose={closeAll} maxWidth="md">
                <form onSubmit={handleEdit} className="p-5">
                    <h2 className="text-lg font-semibold">Edit Praktikan</h2>
                    <div className="mt-4 space-y-3">
                        <FormField label="NIM" hint="NIM tidak dapat diubah."><input className="input input-bordered min-h-11 w-full" value={editForm.data.nim} readOnly /></FormField>
                        <FormField label="Nama" error={editForm.errors.nama} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.nama} onChange={(event) => editForm.setData("nama", event.target.value)} required /></FormField>
                        <FormField label="No HP" error={editForm.errors.no_hp}><input className="input input-bordered min-h-11 w-full" value={editForm.data.no_hp} onChange={(event) => editForm.setData("no_hp", event.target.value)} /></FormField>
                        {!hasClassContext && <FormField label="Pilih Kelas" error={editForm.errors.kelas_id} required><select className="select select-bordered min-h-11 w-full" value={editForm.data.kelas_id} onChange={(event) => editForm.setData("kelas_id", event.target.value)} required><option value="">Pilih Kelas</option>{enrollmentKelas.map((item) => <option key={item.id} value={item.id}>{getKelasLabel(item)}</option>)}</select></FormField>}
                        <FormField label="Password Baru" error={editForm.errors.password} hint="Kosongkan jika tidak ingin mengubah password."><input type="password" className="input input-bordered min-h-11 w-full" value={editForm.data.password} onChange={(event) => editForm.setData("password", event.target.value)} /></FormField>
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeAll}>Batal</Button><Button type="submit" loading={editForm.processing}>Simpan</Button></div>
                </form>
            </Modal>

            <Modal show={isImportModalOpen} onClose={closeAll} maxWidth="2xl">
                <form onSubmit={handleImport} className="p-5">
                    <h2 className="text-lg font-semibold">Import Data Praktikan</h2>
                    <div className="mt-4 rounded-md border border-info/40 bg-info/10 p-4">
                        <h3 className="text-sm font-semibold">Kelas yang tersedia untuk import</h3>
                        <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">{enrollmentKelas.map((item) => <p key={item.id} className="text-sm">{getKelasLabel(item)}</p>)}</div>
                        <p className="mt-2 text-xs text-base-content/70">Isi kolom "kelas" pada file Excel persis sesuai nama kelas di atas.</p>
                    </div>
                    <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
                        <h3 className="font-semibold">Format import</h3>
                        <p>Kolom wajib: <strong>nim</strong>, <strong>nama</strong>, <strong>kelas</strong>.</p>
                        <p>Kolom opsional: <strong>no_hp</strong>.</p>
                        <p>NIM yang sudah ada akan diperbarui, NIM baru akan membuat akun otomatis.</p>
                    </div>
                    <FormField label="File Excel (.xlsx atau .xls)" error={importForm.errors.file} className="mt-4" required><input type="file" accept=".xlsx,.xls" className="file-input file-input-bordered min-h-11 w-full" onChange={(event) => importForm.setData("file", event.target.files[0])} required /></FormField>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeAll}>Batal</Button><Button type="submit" loading={importForm.processing}>Import</Button></div>
                </form>
            </Modal>

            <Modal show={distribusiModal} onClose={() => setDistribusiModal(false)} maxWidth="2xl">
                <form onSubmit={handleDistribusi} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5">
                        <h2 className="text-base font-semibold">Distribusikan Praktikan ke Sub-Kelas</h2>
                        <p className="mt-1 text-xs text-base-content/70">Pilih praktikan dari <strong>{activeParent?.nama_kelas}</strong> dan tentukan sub-kelas tujuannya.</p>
                    </header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Pindahkan ke Sub-Kelas" required><select className="select select-bordered min-h-11 w-full" value={distribusiForm.data.target_kelas_id ?? ""} onChange={(event) => distribusiForm.setData("target_kelas_id", event.target.value)} required><option value="">Pilih Sub-Kelas</option>{currentSubKelas.map((sub) => <option key={sub.id} value={sub.id}>{sub.nama_kelas} ({getSubCount(sub.id)} praktikan)</option>)}</select></FormField>
                        <FormField label={`Pilih Praktikan (${distribusiForm.data.praktikan_ids?.length ?? 0} dipilih)`}>
                            <div className="mb-2 flex gap-2">
                                <Button variant="ghost" onClick={() => distribusiForm.setData("praktikan_ids", orphanedEnrollments.map((enrollment) => enrollment.id))}>Pilih Semua</Button>
                                <Button variant="ghost" onClick={() => distribusiForm.setData("praktikan_ids", [])}>Batal Semua</Button>
                            </div>
                            {enrollmentList({ enrollments: orphanedEnrollments, filtered: distribusiFilteredEnrollments, search: distribusiSearch, onSearch: setDistribusiSearch, onToggle: (id) => distribusiForm.setData("praktikan_ids", distribusiForm.data.praktikan_ids.includes(id) ? distribusiForm.data.praktikan_ids.filter((value) => value !== id) : [...distribusiForm.data.praktikan_ids, id]), selectedIds: distribusiForm.data.praktikan_ids ?? [], accent: "bg-primary/10", emptyText: "Tidak ada praktikan di kelas induk." })}
                        </FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setDistribusiModal(false)}>Batal</Button><Button type="submit" loading={distribusiForm.processing} disabled={(distribusiForm.data.praktikan_ids?.length ?? 0) === 0 || !distribusiForm.data.target_kelas_id}>Pindahkan {distribusiForm.data.praktikan_ids?.length ?? 0} Praktikan</Button></footer>
                </form>
            </Modal>

            <Modal show={pindahMassalModal} onClose={() => setPindahMassalModal(false)} maxWidth="2xl">
                <form onSubmit={handlePindahMassal} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5">
                        <h2 className="text-base font-semibold">Pindah Kelas Massal</h2>
                        <p className="mt-1 text-xs text-base-content/70">Pilih praktikan lalu pilih kelas tujuan. Boleh lintas kelas induk atau subkelas, termasuk "Tanpa kelas".</p>
                    </header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Kelas Tujuan" required><select className="select select-bordered min-h-11 w-full" value={pindahMassalForm.data.target_kelas_id ?? ""} onChange={(event) => pindahMassalForm.setData("target_kelas_id", event.target.value)} required>{kelasOptionsPindahMassal.map((option) => <option key={option.id || "none"} value={option.id}>{option.label}</option>)}</select></FormField>
                        <FormField label={`Pilih Praktikan (${(pindahMassalForm.data.praktikan_ids || []).length} dipilih)`}>
                            <div className="mb-2 flex gap-2">
                                <Button variant="ghost" onClick={() => pindahMassalForm.setData("praktikan_ids", allEnrollmentsForPindah.map((enrollment) => enrollment.id))}>Pilih Semua</Button>
                                <Button variant="ghost" onClick={() => pindahMassalForm.setData("praktikan_ids", [])}>Batal Semua</Button>
                            </div>
                            {enrollmentList({ enrollments: allEnrollmentsForPindah, filtered: pindahMassalFiltered, search: pindahMassalSearch, onSearch: setPindahMassalSearch, onToggle: (id) => pindahMassalForm.setData("praktikan_ids", (pindahMassalForm.data.praktikan_ids || []).includes(id) ? pindahMassalForm.data.praktikan_ids.filter((value) => value !== id) : [...(pindahMassalForm.data.praktikan_ids || []), id]), selectedIds: pindahMassalForm.data.praktikan_ids || [], accent: "bg-warning/10", emptyText: "Tidak ada praktikan di praktikum ini." })}
                        </FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setPindahMassalModal(false)}>Batal</Button><Button type="submit" loading={pindahMassalForm.processing} disabled={(pindahMassalForm.data.praktikan_ids || []).length === 0}>Pindahkan {(pindahMassalForm.data.praktikan_ids || []).length} Praktikan</Button></footer>
                </form>
            </Modal>

            <ConfirmModal
                show={isDeleteModalOpen && !!selectedPraktikan}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemoveFromKelas}
                title="Konfirmasi Keluarkan dari Kelas"
                message={selectedPraktikan ? `Yakin ingin mengeluarkan praktikan ${selectedPraktikan.nama} dari kelas?` : ""}
                confirmText={deleteForm.processing ? "Mengeluarkan..." : "Keluarkan"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default PraktikanIndex;
