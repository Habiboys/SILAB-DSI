import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import Button from "../../Components/Button";
import FormField from "../../Components/FormField";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function KegiatanCreate({ proker }) {
    const { data, setData, post, processing, errors } = useForm({
        nama_kegiatan: "",
        proker_id: "",
        deskripsi_kegiatan: "",
        tipe_kegiatan: "offline",
        lokasi: "",
        link_meeting: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("kegiatan.store"), {
            onSuccess: () => toast.success("Kegiatan berhasil diajukan"),
            onError: (errors) => {
                const firstError = Object.values(errors).find(Boolean);
                toast.error(firstError || "Gagal mengajukan kegiatan");
            },
        });
    };

    return (
        <DashboardLayout>
            <Head title="Buat Kegiatan Baru" />

            <div className="max-w-3xl">
                <PageHeader
                    title="Buat Kegiatan Baru"
                    description="Ajukan kegiatan baru untuk program kerja Anda."
                />

                <PageSection>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField
                            label="Nama Kegiatan"
                            error={errors.nama_kegiatan}
                            required
                        >
                            <input
                                type="text"
                                value={data.nama_kegiatan}
                                onChange={(e) =>
                                    setData("nama_kegiatan", e.target.value)
                                }
                                className={`input input-bordered min-h-11 w-full ${errors.nama_kegiatan ? "input-error" : ""}`}
                                placeholder="Contoh: Pelatihan Dasar Android"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Program Kerja Terkait"
                            error={errors.proker_id}
                            required
                        >
                            {proker.length === 0 ? (
                                <div className="alert alert-warning" role="alert">
                                    <span>
                                        Belum ada program kerja yang sudah
                                        disetujui. Kegiatan hanya dapat
                                        ditambahkan untuk proker yang sudah
                                        disetujui.
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={data.proker_id}
                                        onChange={(e) =>
                                            setData("proker_id", e.target.value)
                                        }
                                        className={`select select-bordered min-h-11 w-full ${errors.proker_id ? "select-error" : ""}`}
                                        required
                                    >
                                        <option value="">
                                            Pilih Program Kerja
                                        </option>
                                        {proker.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_proker || p.deskripsi}
                                                {p.struktur
                                                    ? ` (${p.struktur.struktur})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-base-content/70">
                                        Hanya menampilkan program kerja yang
                                        sudah disetujui.
                                    </p>
                                </>
                            )}
                        </FormField>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                label="Tanggal Mulai"
                                error={errors.tanggal_mulai}
                                required
                            >
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) =>
                                        setData("tanggal_mulai", e.target.value)
                                    }
                                    className={`input input-bordered min-h-11 w-full ${errors.tanggal_mulai ? "input-error" : ""}`}
                                    required
                                />
                            </FormField>
                            <FormField
                                label="Tanggal Selesai"
                                error={errors.tanggal_selesai}
                                required
                            >
                                <input
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) =>
                                        setData(
                                            "tanggal_selesai",
                                            e.target.value,
                                        )
                                    }
                                    className={`input input-bordered min-h-11 w-full ${errors.tanggal_selesai ? "input-error" : ""}`}
                                    required
                                />
                            </FormField>
                        </div>

                        <FormField
                            label="Deskripsi Kegiatan"
                            error={errors.deskripsi_kegiatan}
                        >
                            <textarea
                                value={data.deskripsi_kegiatan}
                                onChange={(e) =>
                                    setData(
                                        "deskripsi_kegiatan",
                                        e.target.value,
                                    )
                                }
                                rows="4"
                                className={`textarea textarea-bordered min-h-24 w-full ${errors.deskripsi_kegiatan ? "textarea-error" : ""}`}
                                placeholder="Jelaskan detail detail kegiatan..."
                            ></textarea>
                        </FormField>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <FormField
                                label="Tipe Kegiatan"
                                error={errors.tipe_kegiatan}
                            >
                                <select
                                    value={data.tipe_kegiatan}
                                    onChange={(e) =>
                                        setData(
                                            "tipe_kegiatan",
                                            e.target.value,
                                        )
                                    }
                                    className={`select select-bordered min-h-11 w-full ${errors.tipe_kegiatan ? "select-error" : ""}`}
                                >
                                    <option value="offline">Offline</option>
                                    <option value="online">Online</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </FormField>
                            <FormField label="Lokasi / Tempat" error={errors.lokasi}>
                                <input
                                    type="text"
                                    value={data.lokasi}
                                    onChange={(e) =>
                                        setData("lokasi", e.target.value)
                                    }
                                    className={`input input-bordered min-h-11 w-full ${errors.lokasi ? "input-error" : ""}`}
                                    placeholder="Contoh: Aula Gedung A, Lantai 2"
                                />
                            </FormField>
                            {(data.tipe_kegiatan === "online" ||
                                data.tipe_kegiatan === "hybrid") && (
                                <FormField
                                    label="Link Meeting"
                                    error={errors.link_meeting}
                                >
                                    <input
                                        type="text"
                                        value={data.link_meeting}
                                        onChange={(e) =>
                                            setData(
                                                "link_meeting",
                                                e.target.value,
                                            )
                                        }
                                        className={`input input-bordered min-h-11 w-full ${errors.link_meeting ? "input-error" : ""}`}
                                        placeholder="https://meet.google.com/..."
                                    />
                                </FormField>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-base-content/10 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                variant="ghost"
                                href={route("kegiatan.index")}
                            >
                                Batal
                            </Button>
                            <Button type="submit" loading={processing}>
                                {processing
                                    ? "Mengirim..."
                                    : "Ajukan Kegiatan"}
                            </Button>
                        </div>
                    </form>
                </PageSection>
            </div>
        </DashboardLayout>
    );
}
