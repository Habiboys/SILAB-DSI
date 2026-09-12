import Button from "@/Components/Button";
import ConfirmModal from "@/Components/ConfirmModal";
import { ServerDataTable } from "@/Components/DataTable";
import FormField from "@/Components/FormField";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import { usePermission } from "@/Components/PermissionContext";
import RowActions, { IconAction } from "@/Components/RowActions";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { debounce } from "lodash";
import { Download, Eye, GitBranch, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const formatDate = (dateString) => {
    try {
        return new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
};

const formatForDatetimeLocal = (value) => {
    try {
        const date = new Date(value);
        const pad = (number) => String(number).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
        return "";
    }
};

const TugasPraktikumIndex = ({
    praktikum,
    tugas,
    pertemuanList,
    kelas,
    lab,
    filters = {},
    classContext = null,
}) => {
    const { can, user, hasRole } = usePermission();
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");
    const isAssignedAslab = user?.praktikumAslab?.some((item) => item.id === praktikum.id);
    const canManage = can("tugas.create") || isAdmin || isKadep || isAssignedAslab;
    const canExport = can("tugas.grade") || isAdmin || isKadep || isAssignedAslab;
    const canViewSubmissions = can("tugas.grade") || can("tugas.view") || isAdmin || isKadep || isAssignedAslab;

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
    const kelasOptionsForTugas = [
        { id: "", label: "Tugas Umum" },
        ...parentKelasList.filter((parent) => parent.hasSubKelas).map((parent) => ({ id: parent.id, label: `${parent.nama_kelas} (semua subkelas)` })),
        ...enrollmentKelas.map((item) => ({ id: item.id, label: getKelasLabel(item) })),
    ];

    const contextKelasId = classContext?.id || filters?.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId || "all";
    const initKelas = allKelas.find((item) => item.id === initKelasId);
    const [search, setSearch] = useState(filters.search || "");
    const [selectedPertemuan, setSelectedPertemuan] = useState(filters.pertemuan_id || "");
    const [perPage, setPerPage] = useState(Number(filters.per_page || 10));
    const [activeParentId, setActiveParentId] = useState(initKelasId === "all" ? "all" : initKelas?.parent_kelas_id || initKelasId);
    const [activeSubId, setActiveSubId] = useState(initKelas?.parent_kelas_id ? initKelas.id : null);
    const activeKelasId = activeParentId === "all" ? "all" : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((item) => item.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedTugas, setSelectedTugas] = useState(null);
    const [selectedTugasForExport, setSelectedTugasForExport] = useState([]);
    const [exportGroupBy, setExportGroupBy] = useState("kelas");

    const createForm = useForm({ judul_tugas: "", deskripsi: "", file_tugas: null, deadline: "", kelas_id: contextKelasId || "", pertemuan_id: "" });
    const editForm = useForm({ judul_tugas: "", deskripsi: "", file_tugas: null, deadline: "", kelas_id: "", pertemuan_id: "", status: "aktif", _method: "PUT" });
    const deleteForm = useForm({});

    const resolveScopeKelasIds = (kelasId) => {
        if (!kelasId || kelasId === "all" || kelasId === "umum") return [];
        const selected = allKelas.find((item) => item.id === kelasId);
        if (!selected) return [kelasId];
        if (selected.parent_kelas_id) return [selected.id, selected.parent_kelas_id];
        const scopeIds = [selected.id];
        const queue = [selected.id];
        while (queue.length > 0) {
            const current = queue.shift();
            const children = allKelas.filter((item) => item.parent_kelas_id === current).map((item) => item.id).filter((id) => !scopeIds.includes(id));
            scopeIds.push(...children);
            queue.push(...children);
        }
        return scopeIds;
    };

    const applyFilters = useCallback(debounce((overrides) => router.get(
        route(route().current(), [praktikum.id]),
        { search, pertemuan_id: selectedPertemuan, kelas_id: activeKelasId, per_page: perPage, ...overrides },
        { preserveState: true, preserveScroll: true, replace: true },
    ), 400), [search, selectedPertemuan, activeKelasId, perPage, praktikum.id]);

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        applyFilters({ search: event.target.value });
    };
    const handlePertemuanChange = (event) => applyRouter({ pertemuan_id: event.target.value });
    const handlePerPageChange = (event) => applyRouter({ per_page: Number(event.target.value) });

    function applyRouter(overrides = {}) {
        if (overrides.pertemuan_id !== undefined) setSelectedPertemuan(overrides.pertemuan_id);
        if (overrides.per_page !== undefined) setPerPage(overrides.per_page);
        router.get(
            route(route().current(), [praktikum.id]),
            { search, pertemuan_id: selectedPertemuan, kelas_id: activeKelasId, per_page: perPage, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    }

    const handleParentTab = (tabId) => {
        setActiveParentId(tabId);
        const parent = parentKelasList.find((item) => item.id === tabId);
        setActiveSubId(tabId === "all" ? null : parent?.hasSubKelas ? parent.subKelas[0]?.id || null : null);
        setSelectedPertemuan("");
        const nextKelasId = tabId === "all" ? "all" : parent?.hasSubKelas ? parent.subKelas[0]?.id : tabId;
        router.get(route(route().current(), [praktikum.id]), { search, pertemuan_id: "", kelas_id: nextKelasId, per_page: perPage }, { preserveState: true, preserveScroll: true });
    };

    const handleSubTab = (subId) => {
        setActiveSubId(subId);
        setSelectedPertemuan("");
        router.get(route(route().current(), [praktikum.id]), { search, pertemuan_id: "", kelas_id: subId, per_page: perPage }, { preserveState: true, preserveScroll: true });
    };

    const classContextLabel = classContext?.nama_kelas || null;
    const getActiveKelasLabel = () => {
        const selected = allKelas.find((item) => item.id === activeKelasId) || classContext;
        if (!selected || activeKelasId === "all") return "Semua kelas";
        if (activeKelasId === "umum") return "Tugas umum";
        if (selected.parent_kelas_id) {
            const parent = parentKelasList.find((item) => item.id === selected.parent_kelas_id);
            return parent ? `${parent.nama_kelas} → ${selected.nama_kelas}` : selected.nama_kelas;
        }
        return allKelas.some((item) => item.parent_kelas_id === selected.id) ? `${selected.nama_kelas} (semua subkelas)` : selected.nama_kelas;
    };
    const pageTitle = classContextLabel ? `Kelola Tugas Praktikum Kelas ${classContextLabel}` : "Kelola Tugas Praktikum";

    const pertemuanOptions = useMemo(() => {
        const scope = hasClassContext ? contextKelasId : null;
        return scope ? pertemuanList.filter((item) => resolveScopeKelasIds(scope).includes(item.kelas_id)) : pertemuanList;
    }, [hasClassContext, contextKelasId, pertemuanList]);

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData("kelas_id", contextKelasId || (activeKelasId !== "all" && activeKelasId !== "umum" ? activeKelasId : ""));
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => {
        createForm.reset();
        setIsCreateModalOpen(false);
    };
    const openEditModal = (item) => {
        setSelectedTugas(item);
        editForm.setData({
            judul_tugas: item.judul_tugas,
            deskripsi: item.deskripsi || "",
            file_tugas: null,
            deadline: formatForDatetimeLocal(item.deadline),
            kelas_id: contextKelasId || item.kelas_id || "",
            pertemuan_id: item.pertemuan_id || "",
            status: item.status,
            _method: "PUT",
        });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        editForm.reset();
        setSelectedTugas(null);
        setIsEditModalOpen(false);
    };

    const handleCreate = (event) => {
        event.preventDefault();
        createForm.post(route("praktikum.tugas.store", { praktikum: praktikum.id }), {
            preserveScroll: true,
            onSuccess: () => { toast.success("Tugas praktikum berhasil ditambahkan"); closeCreateModal(); },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menambahkan tugas praktikum"),
        });
    };
    const handleEdit = (event) => {
        event.preventDefault();
        editForm.post(route("praktikum.tugas.update", { tugas: selectedTugas.id }), {
            preserveScroll: true,
            onSuccess: () => { toast.success("Tugas praktikum berhasil diperbarui"); closeEditModal(); },
            onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal memperbarui tugas praktikum"),
        });
    };
    const confirmDelete = () => deleteForm.delete(route("praktikum.tugas.destroy", { tugas: selectedTugas.id }), {
        preserveScroll: true,
        onSuccess: () => { toast.success("Tugas praktikum berhasil dihapus"); setIsDeleteModalOpen(false); setSelectedTugas(null); },
        onError: (errors) => toast.error(Object.values(errors).find(Boolean) || "Gagal menghapus tugas praktikum"),
    });

    const viewSubmissions = (item) => {
        const params = {};
        if (activeKelasId && activeKelasId !== "all") params.kelas_id = activeKelasId;
        if (contextKelasId) params.context_kelas_id = contextKelasId;
        else if (activeKelasId && activeKelasId !== "all") params.context_kelas_id = activeKelasId;
        router.get(route("praktikum.tugas.submissions", { tugas: item.id, ...params }));
    };
    const downloadFile = (item) => window.open(route("praktikum.tugas.download", { tugas: item.id }), "_blank");

    const handleExport = () => {
        window.open(route("praktikum.export-grades", { praktikum: praktikum.id, tugas: selectedTugasForExport.join(","), group_by: exportGroupBy }), "_blank");
        setIsExportModalOpen(false);
        setSelectedTugasForExport([]);
    };

    const columns = [
        { header: "No", sortable: false, render: (_, index) => index + 1 },
        { key: "judul_tugas", header: "Judul Tugas" },
        { key: "deskripsi", header: "Deskripsi", render: (item) => <span className="line-clamp-2 max-w-xs">{item.deskripsi || "-"}</span> },
        { key: "kelas.nama_kelas", header: "Kelas", render: (item) => item.kelas ? <StatusBadge status="info" tone="info" label={getKelasLabel(item.kelas)} /> : <StatusBadge status="neutral" tone="neutral" label="Semua Kelas" /> },
        { key: "pertemuan.judul", header: "Pertemuan", render: (item) => item.pertemuan?.judul || "-" },
        { key: "deadline", header: "Deadline", render: (item) => formatDate(item.deadline) },
        {
            header: "File",
            sortable: false,
            searchable: false,
            render: (item) => item.file_tugas ? <IconAction label="Unduh file tugas" icon={Download} onClick={() => downloadFile(item)} /> : "-",
        },
        { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} label={item.status === "aktif" ? "Aktif" : "Nonaktif"} /> },
        {
            header: "Aksi",
            sortable: false,
            searchable: false,
            render: (item) => (
                <RowActions onEdit={canManage ? () => openEditModal(item) : null} onDelete={canManage ? () => { setSelectedTugas(item); setIsDeleteModalOpen(true); } : null}>
                    {(canManage || canViewSubmissions) && <IconAction label="Lihat pengumpulan" icon={Eye} tone="success" onClick={() => viewSubmissions(item)} />}
                </RowActions>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Head title={pageTitle} />
            <PageHeader
                title={pageTitle}
                description={`Mata kuliah ${praktikum?.mata_kuliah || "-"}. Kelas aktif: ${getActiveKelasLabel()}.`}
                actions={<>
                    {canExport && <Button variant="ghost" onClick={() => { setSelectedTugasForExport([]); setIsExportModalOpen(true); }}><Download className="h-4 w-4" /> Export Nilai</Button>}
                    {canManage && <Button onClick={openCreateModal}><Plus className="h-4 w-4" /> Tambah Tugas</Button>}
                </>}
            />

            {!hasClassContext && (
                <div className="tabs tabs-border mb-3 overflow-x-auto">
                    <button type="button" className={`tab whitespace-nowrap ${activeParentId === "all" ? "tab-active" : ""}`} onClick={() => handleParentTab("all")}>Semua Tugas</button>
                    <button type="button" className={`tab whitespace-nowrap ${activeParentId === "umum" ? "tab-active" : ""}`} onClick={() => handleParentTab("umum")}>Tugas Umum</button>
                    {parentKelasList.map((parent) => (
                        <button key={parent.id} type="button" className={`tab whitespace-nowrap ${activeParentId === parent.id ? "tab-active" : ""}`} onClick={() => handleParentTab(parent.id)}>
                            {parent.nama_kelas}
                            {parent.hasSubKelas && <span className="badge badge-sm badge-ghost ml-1"><GitBranch className="h-3 w-3" aria-hidden="true" />{parent.subKelas.length}</span>}
                        </button>
                    ))}
                </div>
            )}

            {!hasClassContext && showSubTabs && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-base-300 bg-base-200/60 p-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-base-content/70"><GitBranch className="h-3.5 w-3.5" aria-hidden="true" /> Sub-kelas {activeParent?.nama_kelas}:</span>
                    {currentSubKelas.map((sub) => (
                        <button key={sub.id} type="button" className={`btn btn-xs min-h-8 ${activeSubId === sub.id ? "btn-primary" : "btn-ghost border border-base-300"}`} onClick={() => handleSubTab(sub.id)}>{sub.nama_kelas}</button>
                    ))}
                    <span className="w-full text-xs text-warning">Kelas ini sudah dipecah menjadi sub-kelas, tugas dikelola per sub-kelas.</span>
                </div>
            )}

            <PageSection bodyClassName="p-4 sm:p-5">
                <ServerDataTable
                    paginator={tugas}
                    columns={columns}
                    search={search}
                    onSearchChange={handleSearchChange}
                    searchPlaceholder="Cari judul atau deskripsi tugas..."
                    perPage={perPage}
                    onPerPageChange={handlePerPageChange}
                    filters={[
                        {
                            key: "pertemuan_id",
                            label: "Pertemuan",
                            control: (
                                <select className="select select-bordered min-h-11" value={selectedPertemuan} onChange={handlePertemuanChange}>
                                    <option value="">Semua</option>
                                    {pertemuanOptions.map((item) => <option key={item.id} value={item.id}>{item.judul}</option>)}
                                </select>
                            ),
                        },
                    ]}
                    emptyMessage={search || selectedPertemuan ? "Tidak ada tugas yang cocok dengan pencarian atau filter." : "Belum ada tugas praktikum."}
                />
            </PageSection>

            <Modal show={isCreateModalOpen} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={handleCreate} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">Tambah Tugas Praktikum</h2></header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Judul Tugas" error={createForm.errors.judul_tugas} required><input className="input input-bordered min-h-11 w-full" value={createForm.data.judul_tugas} onChange={(event) => createForm.setData("judul_tugas", event.target.value)} required /></FormField>
                        {!hasClassContext && <FormField label="Target Kelas" error={createForm.errors.kelas_id}><select className="select select-bordered min-h-11 w-full" value={createForm.data.kelas_id} onChange={(event) => { createForm.setData("kelas_id", event.target.value); createForm.setData("pertemuan_id", ""); }}>{kelasOptionsForTugas.map((option) => <option key={option.id || "umum"} value={option.id}>{option.label}</option>)}</select></FormField>}
                        <PertemuanField form={createForm} pertemuanList={pertemuanList} resolveScopeKelasIds={resolveScopeKelasIds} contextKelasId={contextKelasId} hasClassContext={hasClassContext} />
                        <FormField label="Deskripsi" error={createForm.errors.deskripsi}><textarea className="textarea textarea-bordered min-h-20 w-full" value={createForm.data.deskripsi} onChange={(event) => createForm.setData("deskripsi", event.target.value)} /></FormField>
                        <FormField label="File Tugas" error={createForm.errors.file_tugas}><input type="file" accept=".pdf,.doc,.docx" className="file-input file-input-bordered min-h-11 w-full" onChange={(event) => createForm.setData("file_tugas", event.target.files[0])} /></FormField>
                        <FormField label="Deadline" error={createForm.errors.deadline} required><input type="datetime-local" className="input input-bordered min-h-11 w-full" value={createForm.data.deadline} onChange={(event) => createForm.setData("deadline", event.target.value)} required /></FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeCreateModal}>Batal</Button><Button type="submit" loading={createForm.processing}>Tambah</Button></footer>
                </form>
            </Modal>

            <Modal show={isEditModalOpen && !!selectedTugas} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={handleEdit} className="flex max-h-[calc(100vh-5rem)] flex-col">
                    <header className="border-b border-base-300 p-5"><h2 className="text-lg font-semibold">Edit Tugas Praktikum</h2></header>
                    <div className="space-y-4 overflow-y-auto p-5">
                        <FormField label="Judul Tugas" error={editForm.errors.judul_tugas} required><input className="input input-bordered min-h-11 w-full" value={editForm.data.judul_tugas ?? ""} onChange={(event) => editForm.setData("judul_tugas", event.target.value)} required /></FormField>
                        {!hasClassContext && <FormField label="Target Kelas" error={editForm.errors.kelas_id}><select className="select select-bordered min-h-11 w-full" value={editForm.data.kelas_id ?? ""} onChange={(event) => { editForm.setData("kelas_id", event.target.value); editForm.setData("pertemuan_id", ""); }}>{kelasOptionsForTugas.map((option) => <option key={option.id || "umum"} value={option.id}>{option.label}</option>)}</select></FormField>}
                        <PertemuanField form={editForm} pertemuanList={pertemuanList} resolveScopeKelasIds={resolveScopeKelasIds} contextKelasId={contextKelasId} hasClassContext={hasClassContext} />
                        <FormField label="Deskripsi" error={editForm.errors.deskripsi}><textarea className="textarea textarea-bordered min-h-20 w-full" value={editForm.data.deskripsi ?? ""} onChange={(event) => editForm.setData("deskripsi", event.target.value)} /></FormField>
                        <FormField label="File Tugas" error={editForm.errors.file_tugas} hint={selectedTugas?.file_tugas ? "Sudah ada file. Unggah file baru untuk mengganti." : undefined}><input type="file" accept=".pdf,.doc,.docx" className="file-input file-input-bordered min-h-11 w-full" onChange={(event) => editForm.setData("file_tugas", event.target.files[0])} /></FormField>
                        <FormField label="Deadline" error={editForm.errors.deadline} required><input type="datetime-local" className="input input-bordered min-h-11 w-full" value={editForm.data.deadline ?? ""} onChange={(event) => editForm.setData("deadline", event.target.value)} required /></FormField>
                        <FormField label="Status" error={editForm.errors.status} required><select className="select select-bordered min-h-11 w-full" value={editForm.data.status ?? ""} onChange={(event) => editForm.setData("status", event.target.value)} required><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></FormField>
                    </div>
                    <footer className="flex flex-col-reverse gap-2 border-t border-base-300 p-5 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={closeEditModal}>Batal</Button><Button type="submit" loading={editForm.processing}>Perbarui</Button></footer>
                </form>
            </Modal>

            <Modal show={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} maxWidth="2xl">
                <div className="p-5">
                    <h2 className="text-lg font-semibold">Pilih Tugas untuk Export Nilai</h2>
                    <p className="mt-1 text-sm text-base-content/70">Setiap tugas menjadi sheet terpisah dalam file Excel.</p>
                    <FormField label="Export nilai per" className="mt-4">
                        <div className="flex flex-wrap gap-4">
                            {[{ value: "kelas", label: "Kelas (induk dan subkelas digabung)" }, { value: "subkelas", label: "Per subkelas (satu sheet per subkelas)" }].map((option) => (
                                <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2">
                                    <input type="radio" name="export_group_by" className="radio radio-sm" value={option.value} checked={exportGroupBy === option.value} onChange={() => setExportGroupBy(option.value)} />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </FormField>
                    <div className="mt-4 max-h-96 overflow-y-auto rounded-md border border-base-300">
                        {(tugas.data || []).map((item) => (
                            <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-base-200 p-3 last:border-b-0 hover:bg-base-200/50">
                                <input type="checkbox" className="checkbox checkbox-sm" checked={selectedTugasForExport.includes(item.id)} onChange={() => setSelectedTugasForExport((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])} />
                                <span>
                                    <span className="block font-medium">{item.judul_tugas}</span>
                                    <span className="block text-sm text-base-content/70">{item.kelas ? `Kelas: ${getKelasLabel(item.kelas)}` : "Semua Kelas"} · Deadline: {formatDate(item.deadline)}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>Batal</Button><Button disabled={selectedTugasForExport.length === 0} onClick={handleExport}>Export ({selectedTugasForExport.length} tugas)</Button></div>
                </div>
            </Modal>

            <ConfirmModal
                show={isDeleteModalOpen && !!selectedTugas}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message={selectedTugas ? `Yakin ingin menghapus tugas ${selectedTugas.judul_tugas}?` : ""}
                confirmText={deleteForm.processing ? "Menghapus..." : "Hapus"}
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

function PertemuanField({ form, pertemuanList, resolveScopeKelasIds, contextKelasId, hasClassContext }) {
    const kelasId = hasClassContext ? contextKelasId : form.data.kelas_id;
    const scopeIds = kelasId ? resolveScopeKelasIds(kelasId) : [];
    const options = scopeIds.length ? pertemuanList.filter((item) => scopeIds.includes(item.kelas_id)) : pertemuanList;
    return (
        <FormField label="Pertemuan" error={form.errors.pertemuan_id} hint={kelasId && !options.length ? "Belum ada pertemuan untuk kelas ini." : options.length ? `Menampilkan ${options.length} pertemuan untuk kelas terpilih.` : undefined}>
            <select className="select select-bordered min-h-11 w-full" value={form.data.pertemuan_id ?? ""} onChange={(event) => form.setData("pertemuan_id", event.target.value)} disabled={Boolean(kelasId) && options.length === 0}>
                <option value="">Pilih Pertemuan</option>
                {options.map((item) => <option key={item.id} value={item.id}>{item.judul}{!kelasId && item.kelas ? ` (Kelas ${item.kelas.nama_kelas})` : ""}</option>)}
            </select>
        </FormField>
    );
}

export default TugasPraktikumIndex;
