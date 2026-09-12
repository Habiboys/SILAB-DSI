import { Head, Link, router, useForm } from "@inertiajs/react";
import { Copy, Eye, GitBranch, Link2, Link2Off } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "../Components/Button";
import ConfirmModal from "../Components/ConfirmModal";
import { DataGrid } from "../Components/DataTable";
import FormField from "../Components/FormField";
import Modal from "../Components/Modal";
import PageHeader from "../Components/PageHeader";
import PageSection from "../Components/PageSection";
import { usePermission } from "../Components/PermissionContext";
import { IconAction } from "../Components/RowActions";
import RowActions from "../Components/RowActions";
import DashboardLayout from "../Layouts/DashboardLayout";

const ModulPraktikum = ({
    praktikum,
    modulPraktikum,
    pertemuanList,
    kelas,
    filters,
    flash,
    classContext = null,
}) => {
    const { can, user, hasRole } = usePermission();

    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");

    const isAssignedAslab = () => {
        return user?.praktikumAslab?.some((ap) => ap.id === praktikum.id);
    };

    const canCreate =
        can("modul.create") || isAdmin || isKadep || isAssignedAslab();
    const canUpdate =
        can("modul.update") || isAdmin || isKadep || isAssignedAslab();
    const canDelete = can("modul.delete") || isAdmin || isKadep;

    const canManageModuleLinks =
        can("modul.publish") || isAdmin || isKadep || isAssignedAslab();

    const allKelas = kelas || [];
    const parentKelasList = allKelas
        .filter((k) => !k.parent_kelas_id)
        .map((parent) => ({
            ...parent,
            subKelas: allKelas.filter(
                (sub) => sub.parent_kelas_id === parent.id,
            ),
            hasSubKelas: allKelas.some(
                (sub) => sub.parent_kelas_id === parent.id,
            ),
        }));
    const enrollmentKelas = allKelas.filter((k) => {
        if (k.parent_kelas_id) return true;
        return !allKelas.some((sub) => sub.parent_kelas_id === k.id);
    });
    const getKelasLabel = (kelasItem) => {
        if (!kelasItem?.parent_kelas_id) return kelasItem?.nama_kelas || "";
        const parent = parentKelasList.find(
            (p) => p.id === kelasItem.parent_kelas_id,
        );
        return parent
            ? `${parent.nama_kelas} → ${kelasItem.nama_kelas}`
            : kelasItem?.nama_kelas || "";
    };

    const contextKelasId =
        classContext?.id || filters?.context_kelas_id || null;
    const hasClassContext = Boolean(contextKelasId);
    const initKelasId = filters.kelas_id || contextKelasId || "all";
    const initKelas = allKelas.find((k) => k.id === initKelasId);
    const initParentId =
        initKelasId === "all"
            ? "all"
            : initKelas?.parent_kelas_id
              ? initKelas.parent_kelas_id
              : initKelasId;
    const initSubId = initKelas?.parent_kelas_id ? initKelasId : null;

    const [activeParentId, setActiveParentId] = useState(initParentId);
    const [activeSubId, setActiveSubId] = useState(initSubId);
    const activeKelasId =
        activeParentId === "all" ? "all" : activeSubId || activeParentId;
    const activeParent = parentKelasList.find((p) => p.id === activeParentId);
    const showSubTabs = activeParent?.hasSubKelas;
    const currentSubKelas = showSubTabs ? activeParent.subKelas : [];

    const resolveScopeKelasIds = (kelasId) => {
        if (!kelasId || kelasId === "all") return [];
        const selected = allKelas.find((k) => k.id === kelasId);
        if (!selected) return [kelasId];

        if (selected.parent_kelas_id) {
            return [selected.id, selected.parent_kelas_id];
        }

        const scopeIds = [selected.id];
        const queue = [selected.id];
        while (queue.length > 0) {
            const current = queue.shift();
            const children = allKelas
                .filter((k) => k.parent_kelas_id === current)
                .map((k) => k.id)
                .filter((id) => !scopeIds.includes(id));
            scopeIds.push(...children);
            queue.push(...children);
        }
        return scopeIds;
    };

    const handleParentTab = (tabId) => {
        setActiveParentId(tabId);
        if (tabId === "all") {
            setActiveSubId(null);
        } else {
            const parent = parentKelasList.find((p) => p.id === tabId);
            setActiveSubId(
                parent?.hasSubKelas ? parent.subKelas[0]?.id || null : null,
            );
        }

        const newKelasId =
            tabId === "all"
                ? "all"
                : parentKelasList.find((p) => p.id === tabId)?.hasSubKelas
                  ? parentKelasList.find((p) => p.id === tabId).subKelas[0]?.id
                  : tabId;
        router.get(
            route(route().current(), [praktikum.id]),
            { kelas_id: newKelasId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSubTab = (subId) => {
        setActiveSubId(subId);
        router.get(
            route(route().current(), [praktikum.id]),
            { kelas_id: subId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [createSelectedKelas, setCreateSelectedKelas] = useState("");
    const [editSelectedKelas, setEditSelectedKelas] = useState("");

    const createForm = useForm({
        praktikum_id: praktikum?.id,
        pertemuan_id: "",
        judul: "",
        modul: null,
        is_public: false,
    });

    const editForm = useForm({
        pertemuan_id: "",
        judul: "",
        modul: null,
        is_public: false,
        _method: "PUT",
    });

    const deleteForm = useForm({});

    const openCreateModal = () => {
        if (!canCreate) return;
        createForm.reset();
        setCreateSelectedKelas(contextKelasId || "");
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        createForm.reset();
        setCreateSelectedKelas("");
        setIsCreateModalOpen(false);
    };

    const handleCreate = (e) => {
        e.preventDefault();

        createForm.post(
            route("praktikum.modul.store", { praktikum: praktikum.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeCreateModal();
                    toast.success("Modul praktikum berhasil ditambahkan");
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(
                        firstError || "Gagal menambahkan modul praktikum",
                    );
                },
            },
        );
    };

    const openEditModal = (modul) => {
        if (!canUpdate) return;
        setSelectedItem(modul);
        editForm.setData({
            praktikum_id: modul.praktikum_id,
            pertemuan_id: modul.pertemuan_id || "",
            judul: modul.judul,
            modul: null,
            is_public: modul.is_public || false,
            _method: "PUT",
        });
        setEditSelectedKelas(modul.pertemuan?.kelas_id || "");
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedItem(null);
        editForm.reset();
        setEditSelectedKelas("");
        setIsEditModalOpen(false);
    };

    const handleUpdate = (e) => {
        e.preventDefault();

        editForm.post(
            route("praktikum.modul.update", {
                praktikum: selectedItem.praktikum_id,
                modul: selectedItem.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeEditModal();
                    toast.success("Modul praktikum berhasil diperbarui");
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(
                        firstError || "Gagal memperbarui modul praktikum",
                    );
                },
            },
        );
    };

    const openDeleteModal = (item) => {
        if (!canDelete) return;
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        deleteForm.delete(
            route("praktikum.modul.destroy", {
                praktikum: praktikum.id,
                modul: selectedItem.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    toast.success("Modul praktikum berhasil dihapus");
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal menghapus modul praktikum");
                },
            },
        );
    };

    const viewModul = (modulId, modulFilename) => {
        if (!modulFilename) {
            window.open(
                route("praktikum.modul.view", {
                    praktikum: praktikum.id,
                    modul: modulId,
                }),
                "_blank",
            );
            return;
        }
        const filename = modulFilename.split("/").pop();
        window.open(
            route("praktikum.modul.view", {
                praktikum: praktikum.id,
                modul: modulId,
                filename: filename,
            }),
            "_blank",
        );
    };

    const toggleShareLink = (modul) => {
        router.post(
            route("praktikum.modul.toggle-share", {
                praktikum: praktikum.id,
                modul: modul.id,
            }),
            {},
            {
                onSuccess: () => {
                    router.reload();
                    const message = !modul.is_public
                        ? "Link berhasil dibuka"
                        : "Link berhasil ditutup";
                    toast.success(message);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(
                        firstError || "Gagal mengubah status share link",
                    );
                },
            },
        );
    };

    const copyShareLink = async (modul) => {
        if (!modul.hash) {
            toast.error("Hash tidak tersedia, silakan refresh halaman");
            return;
        }
        const shareUrl = route("modul.public.view", {
            hash: modul.hash,
        });
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link berhasil disalin ke clipboard!");
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            toast.success("Link berhasil disalin ke clipboard!");
        }
    };

    useEffect(() => {
        if (flash && flash.message) {
            toast.success(flash.message);
        }
        if (flash && flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const pertemuanOptions = useMemo(
        () =>
            pertemuanList
                .filter((p) => {
                    if (activeKelasId === "all") return true;
                    const scopeIds = resolveScopeKelasIds(activeKelasId);
                    return scopeIds.includes(p.kelas_id);
                })
                .map((p) => ({
                    value: String(p.id),
                    label: `${p.judul}${p.kelas ? ` (${getKelasLabel(p.kelas)})` : ""} - ${p.formatted_tanggal}`,
                })),
        [pertemuanList, activeKelasId],
    );

    const columns = useMemo(
        () => [
            {
                key: "pertemuan.judul",
                header: "Pertemuan/Kelas",
                render: (modul) => (
                    <div>
                        <div className="font-medium">
                            {modul.pertemuan
                                ? modul.pertemuan.judul
                                : `Pertemuan (ID: ${modul.pertemuan_id})`}
                        </div>
                        {modul.pertemuan?.kelas &&
                            !hasClassContext &&
                            activeKelasId === "all" && (
                                <span className="badge badge-ghost badge-sm mt-1">
                                    {getKelasLabel(modul.pertemuan.kelas)}
                                </span>
                            )}
                    </div>
                ),
            },
            {
                key: "judul",
                header: "Judul",
                render: (modul) => (
                    <span className="font-medium">{modul.judul}</span>
                ),
            },
            {
                header: "File Modul",
                sortable: false,
                searchable: false,
                render: (modul) => (
                    <IconAction
                        label="Lihat Modul"
                        icon={Eye}
                        tone="detail"
                        onClick={() => viewModul(modul.id, modul.modul)}
                    />
                ),
            },
            {
                header: "Share Link",
                sortable: false,
                searchable: false,
                render: (modul) => (
                    <div className="flex flex-wrap items-center gap-2">
                        {canManageModuleLinks ? (
                            modul.is_public ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => toggleShareLink(modul)}
                                    >
                                        <Link2Off className="h-4 w-4" />
                                        Tutup Link
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="info"
                                        onClick={() => copyShareLink(modul)}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy Link
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="info"
                                    onClick={() => toggleShareLink(modul)}
                                >
                                    <Link2 className="h-4 w-4" />
                                    Buka Link
                                </Button>
                            )
                        ) : modul.is_public ? (
                            <Button
                                size="sm"
                                variant="info"
                                onClick={() => copyShareLink(modul)}
                            >
                                <Copy className="h-4 w-4" />
                                Copy Link
                            </Button>
                        ) : (
                            <span className="text-sm text-base-content/40">
                                Link tidak tersedia
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: "Aksi",
                sortable: false,
                searchable: false,
                headerClassName: "text-right",
                render: (modul) => (
                    <RowActions
                        onEdit={canUpdate ? () => openEditModal(modul) : null}
                        onDelete={
                            canDelete ? () => openDeleteModal(modul) : null
                        }
                    />
                ),
            },
        ],
        [
            activeKelasId,
            canDelete,
            canManageModuleLinks,
            canUpdate,
            hasClassContext,
        ],
    );

    const classContextLabel = classContext?.nama_kelas || null;
    const pageTitle = classContextLabel
        ? `Kelola Modul Praktikum Kelas ${classContextLabel}`
        : "Kelola Modul Praktikum";

    return (
        <DashboardLayout>
            <Head title={pageTitle} />

            <nav className="breadcrumbs mb-4 text-sm" aria-label="Breadcrumb">
                <ul className="text-base-content/70">
                    <li>
                        <Link
                            href={route("praktikum.index")}
                            className="hover:text-primary"
                        >
                            Praktikum
                        </Link>
                    </li>
                    <li>
                        <Link
                            href={route("praktikum.show", {
                                praktikum: praktikum.id,
                            })}
                            className="hover:text-primary"
                        >
                            {praktikum?.mata_kuliah || "Detail"}
                        </Link>
                    </li>
                    <li className="font-medium text-base-content">Modul</li>
                </ul>
            </nav>

            <PageHeader
                title={pageTitle}
                description={`Mata Kuliah: ${praktikum?.mata_kuliah}`}
                actions={
                    canCreate ? (
                        <Button onClick={openCreateModal}>Tambah</Button>
                    ) : null
                }
            />

            <PageSection bodyClassName="space-y-4">
                {!hasClassContext && (
                    <div className="overflow-x-auto">
                        <div
                            role="tablist"
                            className="tabs tabs-boxed w-max"
                            aria-label="Filter kelas"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeParentId === "all"}
                                onClick={() => handleParentTab("all")}
                                className={`tab min-h-11 ${activeParentId === "all" ? "tab-active" : ""}`}
                            >
                                Semua Modul
                            </button>
                            {parentKelasList.map((parent) => (
                                <button
                                    key={parent.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeParentId === parent.id}
                                    onClick={() => handleParentTab(parent.id)}
                                    className={`tab min-h-11 gap-1.5 ${activeParentId === parent.id ? "tab-active" : ""}`}
                                >
                                    {parent.nama_kelas}
                                    {parent.hasSubKelas && (
                                        <span className="badge badge-sm">
                                            <GitBranch className="h-3 w-3" />
                                            {parent.subKelas.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!hasClassContext &&
                    activeParentId !== "all" &&
                    showSubTabs && (
                        <div className="flex flex-wrap items-center gap-2 rounded-box bg-base-200/60 p-2">
                            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-base-content/70">
                                <GitBranch className="h-3 w-3" />
                                Sub-kelas {activeParent?.nama_kelas}:
                            </span>
                            <div
                                role="tablist"
                                className="tabs tabs-boxed tabs-sm"
                                aria-label="Filter sub-kelas"
                            >
                                {currentSubKelas.map((sub) => (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeSubId === sub.id}
                                        onClick={() => handleSubTab(sub.id)}
                                        className={`tab min-h-9 ${activeSubId === sub.id ? "tab-active" : ""}`}
                                    >
                                        {sub.nama_kelas}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                {!hasClassContext &&
                    activeParentId !== "all" &&
                    showSubTabs && (
                        <div
                            role="note"
                            className="alert alert-warning text-sm"
                        >
                            <GitBranch className="h-4 w-4 shrink-0" />
                            <span>
                                Kelas <strong>{activeParent?.nama_kelas}</strong>{" "}
                                sudah dipecah menjadi sub-kelas. Modul dikelola
                                per sub-kelas.
                            </span>
                        </div>
                    )}

                <DataGrid
                    rows={modulPraktikum ?? []}
                    columns={columns}
                    rowKey="id"
                    searchPlaceholder="Cari judul modul..."
                    emptyMessage="Belum ada data modul praktikum"
                    defaultPerPage={10}
                    filters={[
                        {
                            key: "pertemuan.id",
                            label: "Pertemuan",
                            options: pertemuanOptions,
                        },
                    ]}
                />
            </PageSection>

            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="lg"
            >
                <header className="border-b border-base-content/10 px-5 py-4">
                    <h3 className="text-lg font-semibold">
                        Tambah Modul Praktikum
                    </h3>
                    <p className="mt-0.5 text-sm text-base-content/70">
                        {praktikum?.mata_kuliah}
                    </p>
                </header>

                <form id="create-modul-form" onSubmit={handleCreate}>
                    <div className="overflow-y-auto px-5 py-4">
                        {!hasClassContext && (
                            <FormField label="1. Kelas" className="mb-4">
                                <select
                                    id="create_kelas"
                                    className="select select-bordered min-h-11 w-full focus:select-primary"
                                    value={createSelectedKelas}
                                    onChange={(e) => {
                                        setCreateSelectedKelas(
                                            e.target.value,
                                        );
                                        createForm.setData("pertemuan_id", "");
                                    }}
                                >
                                    <option value="">— Semua Kelas —</option>
                                    {enrollmentKelas?.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {getKelasLabel(k)}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        )}

                        <FormField
                            label={
                                hasClassContext
                                    ? "1. Pilih Pertemuan"
                                    : "2. Pilih Pertemuan"
                            }
                            required
                            error={createForm.errors.pertemuan_id}
                            className="mb-4"
                        >
                            <select
                                id="pertemuan_id"
                                className="select select-bordered min-h-11 w-full focus:select-primary"
                                value={createForm.data.pertemuan_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        "pertemuan_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">— Pilih Pertemuan —</option>
                                {(() => {
                                    const selectedKelasId = hasClassContext
                                        ? contextKelasId
                                        : createSelectedKelas;
                                    const scopeIds = selectedKelasId
                                        ? resolveScopeKelasIds(selectedKelasId)
                                        : [];
                                    const filtered = scopeIds.length
                                        ? pertemuanList.filter((p) =>
                                              scopeIds.includes(p.kelas_id),
                                          )
                                        : pertemuanList;
                                    if (!filtered.length)
                                        return (
                                            <option disabled>
                                                Tidak ada pertemuan tersedia
                                            </option>
                                        );
                                    return filtered.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.judul}
                                            {!selectedKelasId && p.kelas
                                                ? ` (${getKelasLabel(p.kelas)})`
                                                : ""}{" "}
                                            — {p.formatted_tanggal || p.tanggal}
                                        </option>
                                    ));
                                })()}
                            </select>
                        </FormField>

                        <FormField
                            label="Judul Modul"
                            required
                            error={createForm.errors.judul}
                            className="mb-4"
                        >
                            <input
                                type="text"
                                id="judul"
                                placeholder="Contoh: Modul 1 - Pengenalan..."
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                value={createForm.data.judul}
                                onChange={(e) =>
                                    createForm.setData("judul", e.target.value)
                                }
                                required
                            />
                        </FormField>

                        <FormField
                            label="File Modul"
                            hint="PDF, maks. 10MB"
                            required
                            error={createForm.errors.modul}
                        >
                            <input
                                type="file"
                                id="modul"
                                className="file-input file-input-bordered min-h-11 w-full"
                                onChange={(e) =>
                                    createForm.setData(
                                        "modul",
                                        e.target.files[0],
                                    )
                                }
                                accept=".pdf"
                                required
                            />
                        </FormField>

                        <label className="mt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={createForm.data.is_public}
                                onChange={(e) =>
                                    createForm.setData(
                                        "is_public",
                                        e.target.checked,
                                    )
                                }
                            />
                            <span className="text-sm">
                                Buat link publik (dapat diakses tanpa login)
                            </span>
                        </label>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button variant="ghost" onClick={closeCreateModal}>
                            Batal
                        </Button>
                        <Button
                            form="create-modul-form"
                            type="submit"
                            loading={createForm.processing}
                        >
                            Simpan Modul
                        </Button>
                    </footer>
                </form>
            </Modal>

            <Modal
                show={isEditModalOpen && !!selectedItem}
                onClose={closeEditModal}
                maxWidth="lg"
            >
                <header className="border-b border-base-content/10 px-5 py-4">
                    <h3 className="text-lg font-semibold">
                        Edit Modul Praktikum
                    </h3>
                    <p className="mt-0.5 max-w-xs truncate text-sm text-base-content/70">
                        {selectedItem?.judul}
                    </p>
                </header>

                <form id="edit-modul-form" onSubmit={handleUpdate}>
                    <div className="overflow-y-auto px-5 py-4">
                        {!hasClassContext && (
                            <FormField label="1. Kelas" className="mb-4">
                                <select
                                    id="edit_kelas"
                                    className="select select-bordered min-h-11 w-full focus:select-primary"
                                    value={editSelectedKelas}
                                    onChange={(e) => {
                                        setEditSelectedKelas(
                                            e.target.value,
                                        );
                                        editForm.setData("pertemuan_id", "");
                                    }}
                                >
                                    <option value="">— Semua Kelas —</option>
                                    {enrollmentKelas?.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {getKelasLabel(k)}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        )}

                        <FormField
                            label={
                                hasClassContext
                                    ? "1. Pilih Pertemuan"
                                    : "2. Pilih Pertemuan"
                            }
                            required
                            error={editForm.errors.pertemuan_id}
                            className="mb-4"
                        >
                            <select
                                id="edit-pertemuan_id"
                                className="select select-bordered min-h-11 w-full focus:select-primary"
                                value={editForm.data.pertemuan_id}
                                onChange={(e) =>
                                    editForm.setData(
                                        "pertemuan_id",
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="">— Pilih Pertemuan —</option>
                                {(() => {
                                    const selectedKelasId = hasClassContext
                                        ? contextKelasId
                                        : editSelectedKelas;
                                    const scopeIds = selectedKelasId
                                        ? resolveScopeKelasIds(selectedKelasId)
                                        : [];
                                    const filtered = scopeIds.length
                                        ? pertemuanList.filter((p) =>
                                              scopeIds.includes(p.kelas_id),
                                          )
                                        : pertemuanList;
                                    if (!filtered.length)
                                        return (
                                            <option disabled>
                                                Tidak ada pertemuan tersedia
                                            </option>
                                        );
                                    return filtered.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.judul}
                                            {!selectedKelasId && p.kelas
                                                ? ` (${getKelasLabel(p.kelas)})`
                                                : ""}{" "}
                                            — {p.formatted_tanggal || p.tanggal}
                                        </option>
                                    ));
                                })()}
                            </select>
                        </FormField>

                        <FormField
                            label="Judul Modul"
                            required
                            error={editForm.errors.judul}
                            className="mb-4"
                        >
                            <input
                                type="text"
                                id="edit-judul"
                                className="input input-bordered min-h-11 w-full focus:input-primary"
                                value={editForm.data.judul}
                                onChange={(e) =>
                                    editForm.setData("judul", e.target.value)
                                }
                                required
                            />
                        </FormField>

                        <FormField
                            label="Ganti File Modul"
                            hint="PDF, opsional — kosongkan jika tidak diubah"
                        >
                            <input
                                type="file"
                                id="edit-modul"
                                className="file-input file-input-bordered min-h-11 w-full"
                                onChange={(e) =>
                                    editForm.setData(
                                        "modul",
                                        e.target.files[0],
                                    )
                                }
                                accept=".pdf"
                            />
                        </FormField>

                        <label className="mt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={editForm.data.is_public}
                                onChange={(e) =>
                                    editForm.setData(
                                        "is_public",
                                        e.target.checked,
                                    )
                                }
                            />
                            <span className="text-sm">
                                Buat link publik (dapat diakses tanpa login)
                            </span>
                        </label>
                    </div>

                    <footer className="flex justify-end gap-2 border-t border-base-content/10 px-5 py-4">
                        <Button variant="ghost" onClick={closeEditModal}>
                            Batal
                        </Button>
                        <Button
                            form="edit-modul-form"
                            type="submit"
                            loading={editForm.processing}
                        >
                            Perbarui Modul
                        </Button>
                    </footer>
                </form>
            </Modal>

            <ConfirmModal
                show={isDeleteModalOpen && !!selectedItem}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={
                    selectedItem
                        ? `Apakah Anda yakin ingin menghapus modul "${selectedItem.judul}"? Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </DashboardLayout>
    );
};

export default ModulPraktikum;
