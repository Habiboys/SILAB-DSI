import Button from "@/Components/Button";
import { DataTable, DataTableEmpty, DataTableHead } from "@/Components/DataTable";
import PageHeader from "@/Components/PageHeader";
import PageSection from "@/Components/PageSection";
import StatusBadge from "@/Components/StatusBadge";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function KepengurusanSertifikat({
    kepengurusanLab,
    template,
    anggota = [],
}) {
    const [selectedUsers, setSelectedUsers] = useState([]);

    const { data, setData, post, processing, reset } = useForm({
        template: null,
    });

    const activeAnggota = useMemo(
        () => anggota.filter((item) => item.is_active),
        [anggota],
    );

    const handleTemplateUpload = (event) => {
        event.preventDefault();
        if (!data.template) {
            toast.error("Pilih file template terlebih dahulu");
            return;
        }

        post(route("kepengurusan-lab.sertifikat.template", kepengurusanLab.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Template berhasil diunggah");
                reset();
            },
            onError: (errors) =>
                toast.error(
                    Object.values(errors).find(Boolean) ||
                        "Gagal upload template",
                ),
        });
    };

    const toggleUser = (id) =>
        setSelectedUsers((current) =>
            current.includes(id)
                ? current.filter((userId) => userId !== id)
                : [...current, id],
        );

    const allSelected =
        activeAnggota.length > 0 &&
        selectedUsers.length === activeAnggota.length;

    const handleGenerate = () => {
        if (!template) {
            toast.error("Template belum diunggah");
            return;
        }
        if (selectedUsers.length === 0) {
            toast.error("Pilih minimal satu anggota");
            return;
        }
        if (!confirm("Generate sertifikat untuk anggota terpilih?")) return;

        router.post(
            route("kepengurusan-lab.sertifikat.generate", kepengurusanLab.id),
            { user_ids: selectedUsers },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Sertifikat berhasil digenerate");
                    setSelectedUsers([]);
                },
                onError: (errors) =>
                    toast.error(
                        Object.values(errors).find(Boolean) ||
                            "Gagal generate sertifikat",
                    ),
            },
        );
    };

    const backUrl = `${route("kepengurusan-lab.index")}${
        kepengurusanLab?.laboratorium_id
            ? `?lab_id=${kepengurusanLab.laboratorium_id}`
            : ""
    }`;

    const tahun = kepengurusanLab?.tahunKepengurusan?.tahun;
    const namaLab = kepengurusanLab?.laboratorium?.nama || "Laboratorium";

    return (
        <DashboardLayout>
            <Head title="Sertifikat Kepengurusan" />
            <PageHeader
                title="Sertifikat Kepengurusan"
                description={`${namaLab}${tahun ? ` • ${tahun}` : ""}`}
                actions={
                    <Button href={backUrl} variant="ghost">
                        Kembali
                    </Button>
                }
            />

            <PageSection
                title="Template Sertifikat"
                description={
                    template
                        ? `Template "${template.nama}" sudah diunggah.`
                        : "Belum ada template yang diunggah."
                }
            >
                <div className="space-y-4">
                    <div className="alert alert-info items-start text-sm">
                        <div>
                            <p className="font-semibold">
                                Panduan variabel berkas .docx
                            </p>
                            <p>
                                Gunakan format <code>{"${nama_variabel}"}</code>{" "}
                                di dalam dokumen.
                            </p>
                            <ul className="mt-2 grid list-disc grid-cols-1 gap-x-4 pl-5 sm:grid-cols-2">
                                <li>
                                    <code>{"${nama}"}</code> — nama tercetak
                                </li>
                                <li>
                                    <code>{"${nim}"}</code> — NIM / ID
                                </li>
                                <li>
                                    <code>{"${peran}"}</code> — jabatan/peran
                                </li>
                                <li>
                                    <code>{"${lab}"}</code> — nama laboratorium
                                </li>
                                <li>
                                    <code>{"${tahun}"}</code> — tahun
                                    kepengurusan
                                </li>
                                <li>
                                    <code>{"${tanggal}"}</code> — tanggal
                                    terbit
                                </li>
                                <li>
                                    <code>{"${nomor}"}</code> — nomor sertifikat
                                </li>
                                <li>
                                    <code>{"${qr_code}"}</code> — QR verifikasi
                                </li>
                            </ul>
                        </div>
                    </div>
                    <form
                        onSubmit={handleTemplateUpload}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <input
                            type="file"
                            accept=".docx"
                            onChange={(event) =>
                                setData("template", event.target.files[0])
                            }
                            className="file-input file-input-bordered min-h-11 w-full sm:flex-1"
                        />
                        <Button type="submit" loading={processing}>
                            {processing ? "Mengunggah..." : "Upload Template"}
                        </Button>
                    </form>
                </div>
            </PageSection>

            <PageSection
                title="Daftar Anggota Kepengurusan"
                description={`${anggota.length} anggota terdaftar`}
                actions={
                    <Button variant="success" onClick={handleGenerate}>
                        Generate Sertifikat
                    </Button>
                }
                bodyClassName="p-0 sm:p-0"
            >
                <DataTable>
                    <DataTableHead>
                        <tr>
                            <th className="w-12">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={allSelected}
                                    onChange={() =>
                                        setSelectedUsers(
                                            allSelected
                                                ? []
                                                : activeAnggota.map(
                                                      (item) => item.user_id,
                                                  ),
                                        )
                                    }
                                    aria-label="Pilih semua anggota aktif"
                                />
                            </th>
                            <th>Nama</th>
                            <th>NIM</th>
                            <th>Peran</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </DataTableHead>
                    <tbody>
                        {anggota.map((item) => (
                            <tr key={item.id} className="hover">
                                <td>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedUsers.includes(
                                            item.user_id,
                                        )}
                                        onChange={() => toggleUser(item.user_id)}
                                        disabled={!item.is_active}
                                        aria-label={`Pilih ${item.nama || "anggota"}`}
                                    />
                                </td>
                                <td className="font-medium">
                                    {item.nama || "-"}
                                    {!item.is_active && (
                                        <span className="ml-2 text-xs text-base-content/50">
                                            (Nonaktif)
                                        </span>
                                    )}
                                </td>
                                <td>{item.nim || "-"}</td>
                                <td>{item.peran}</td>
                                <td>
                                    <StatusBadge
                                        status={
                                            item.sertifikat
                                                ? "selesai"
                                                : "belum"
                                        }
                                        label={
                                            item.sertifikat ? "Sudah" : "Belum"
                                        }
                                    />
                                </td>
                                <td className="text-right">
                                    {item.sertifikat ? (
                                        <Link
                                            href={route(
                                                "sertifikat.download",
                                                item.sertifikat.id,
                                            )}
                                            className="btn btn-ghost btn-sm text-info"
                                        >
                                            <Download className="h-4 w-4" />
                                            Unduh
                                        </Link>
                                    ) : (
                                        <span className="text-base-content/40">
                                            -
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!anggota.length && (
                            <DataTableEmpty
                                colSpan={6}
                                message="Tidak ada anggota kepengurusan."
                            />
                        )}
                    </tbody>
                </DataTable>
            </PageSection>
        </DashboardLayout>
    );
}
