import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "../../Components/Button";
import ConfirmModal from "../../Components/ConfirmModal";
import { DataGrid } from "../../Components/DataTable";
import FormField from "../../Components/FormField";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import DashboardLayout from "../../Layouts/DashboardLayout";

const VARIABEL_GUIDE = [
    ["nama", "Nama Tercetak"],
    ["nim", "NIM / ID"],
    ["peran", "Praktikan / Aslab"],
    ["praktikum", "Nama Mata Kuliah"],
    ["tanggal", "Tanggal Terbit"],
    ["nomor", "Nomor Sertifikat"],
    ["lab", "Nama Laboratorium"],
    ["qr_code", "QR Code Verifikasi"],
];

export default function PraktikumSertifikat({ praktikum, templates }) {
    const [activeTab, setActiveTab] = useState("praktikum");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [genProcessing, setGenProcessing] = useState(false);

    const {
        data: tmplData,
        setData: setTmplData,
        post: postTmpl,
        processing: tmplProcessing,
        reset: resetTmpl,
    } = useForm({
        template: null,
        kategori: "praktikum",
    });

    const handleTemplateUpload = (e) => {
        e.preventDefault();
        tmplData.kategori = activeTab;
        postTmpl(route("praktikum.sertifikat.template", praktikum.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Template berhasil diunggah");
                resetTmpl();
            },
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal upload template");
            },
        });
    };

    const handleGenerateConfirm = () => {
        if (selectedUsers.length === 0) {
            toast.error("Pilih minimal satu user");
            return;
        }
        setShowConfirmModal(true);
    };

    const handleGenerateSubmit = () => {
        setShowConfirmModal(false);
        setGenProcessing(true);
        router.post(
            route("praktikum.sertifikat.generate", praktikum.id),
            {
                kategori: activeTab,
                user_ids: selectedUsers,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Sertifikat berhasil digenerate");
                    setSelectedUsers([]);
                    setGenProcessing(false);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors).find(Boolean);
                    toast.error(firstError || "Gagal generate sertifikat");
                    setGenProcessing(false);
                },
            },
        );
    };

    const toggleUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const usersList =
        activeTab === "praktikum" ? praktikum.praktikans : praktikum.aslab;

    const userRows =
        activeTab === "praktikum"
            ? usersList.map((item) => item.user).filter(Boolean)
            : usersList;

    const toggleAll = () => {
        if (selectedUsers.length === userRows.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(userRows.map((u) => u.id));
        }
    };

    const templatePraktikum = templates.find((t) => t.kategori === "praktikum");
    const templateAslab = templates.find((t) => t.kategori === "aslab");
    const currentTemplate =
        activeTab === "aslab"
            ? templateAslab || templatePraktikum
            : templatePraktikum;

    const columns = useMemo(
        () => [
            {
                header: (
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        aria-label="Pilih semua penerima"
                        onChange={toggleAll}
                        checked={
                            selectedUsers.length > 0 &&
                            selectedUsers.length === userRows.length
                        }
                    />
                ),
                sortable: false,
                searchable: false,
                headerClassName: "w-12",
                render: (user) => (
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        aria-label={`Pilih ${user.name}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                    />
                ),
            },
            {
                key: "name",
                header: "Nama",
                render: (user) => (
                    <span className="font-medium">{user.name}</span>
                ),
            },
            {
                key: "nim",
                header: "NIM / Email",
                render: (user) => user.nim || user.email || "-",
            },
        ],
        [selectedUsers, userRows],
    );

    const kembaliHref =
        route("praktikum.index", {}, false) +
        (praktikum.kepengurusan_lab_id
            ? `?kepengurusan_lab_id=${praktikum.kepengurusan_lab_id}`
            : "");

    return (
        <DashboardLayout>
            <Head title={`Sertifikat - ${praktikum.mata_kuliah}`} />

            <PageHeader
                title="Sertifikat Praktikum"
                description={praktikum.mata_kuliah}
                actions={
                    <Button variant="ghost" href={kembaliHref}>
                        Kembali
                    </Button>
                }
            />

            <PageSection
                bodyClassName="space-y-5"
                actions={
                    <div
                        role="tablist"
                        className="tabs tabs-boxed"
                        aria-label="Kategori sertifikat"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "praktikum"}
                            onClick={() => {
                                setActiveTab("praktikum");
                                setSelectedUsers([]);
                            }}
                            className={`tab min-h-11 ${activeTab === "praktikum" ? "tab-active" : ""}`}
                        >
                            Sertifikat Praktikan
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "aslab"}
                            onClick={() => {
                                setActiveTab("aslab");
                                setSelectedUsers([]);
                            }}
                            className={`tab min-h-11 ${activeTab === "aslab" ? "tab-active" : ""}`}
                        >
                            Sertifikat Asisten
                        </button>
                    </div>
                }
            >
                <div className="rounded-box border border-info/30 bg-info/10 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-info">
                                Status Template
                            </h4>
                            <p className="mb-2 text-sm text-base-content/70">
                                {currentTemplate
                                    ? `Template "${currentTemplate.nama}" sudah diunggah.`
                                    : "Belum ada template yang diunggah."}
                                {activeTab === "aslab" &&
                                    !templateAslab &&
                                    templatePraktikum && (
                                        <span className="mt-1 block text-xs">
                                            Menggunakan template praktikan untuk
                                            asisten.
                                        </span>
                                    )}
                            </p>
                            <div className="rounded-box border border-base-content/10 bg-base-100/60 p-3 text-xs">
                                <strong>Panduan Variabel (.docx):</strong>{" "}
                                Gunakan format <code>{`\${nama_variabel}`}</code>{" "}
                                pada dokumen Word Anda.
                                <ul className="mt-1 ml-5 grid list-disc grid-cols-1 gap-x-4 sm:grid-cols-2">
                                    {VARIABEL_GUIDE.map(([key, label]) => (
                                        <li key={key}>
                                            <code>{`\${${key}}`}</code> : {label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <form
                            onSubmit={handleTemplateUpload}
                            className="flex flex-col gap-2 md:w-64"
                        >
                            <FormField label="File Template">
                                <input
                                    type="file"
                                    accept=".docx"
                                    className="file-input file-input-bordered min-h-11 w-full"
                                    onChange={(e) =>
                                        setTmplData(
                                            "template",
                                            e.target.files[0],
                                        )
                                    }
                                />
                            </FormField>
                            <Button type="submit" loading={tmplProcessing}>
                                Upload Template
                            </Button>
                        </form>
                    </div>
                </div>

                {currentTemplate && (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-lg font-semibold">
                                Pilih Penerima
                            </h3>
                            <Button
                                variant="success"
                                onClick={handleGenerateConfirm}
                                loading={genProcessing}
                                disabled={
                                    genProcessing || selectedUsers.length === 0
                                }
                            >
                                {`Generate Untuk ${selectedUsers.length} Orang`}
                            </Button>
                        </div>

                        <DataGrid
                            rows={userRows}
                            columns={columns}
                            rowKey="id"
                            searchPlaceholder="Cari nama atau NIM..."
                            emptyMessage="Tidak ada data user."
                            defaultPerPage={10}
                        />
                    </div>
                )}
            </PageSection>

            <ConfirmModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleGenerateSubmit}
                title="Konfirmasi Generate Sertifikat"
                message={
                    <>
                        Anda akan men-generate sertifikat untuk{" "}
                        <strong>{selectedUsers.length} orang</strong> pada
                        kategori{" "}
                        <strong>
                            {activeTab === "praktikum" ? "Praktikan" : "Asisten"}
                        </strong>
                        . Sertifikat yang sudah ada untuk orang-orang ini akan
                        ditimpa.
                    </>
                }
                confirmText="Ya, Generate Sekarang"
                cancelText="Batal"
                type="warning"
            />
        </DashboardLayout>
    );
}
