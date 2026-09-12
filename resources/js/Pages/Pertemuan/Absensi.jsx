import { Head, Link, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "../../Components/Button";
import { DataGrid } from "../../Components/DataTable";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import DashboardLayout from "../../Layouts/DashboardLayout";

const STATUS_OPTIONS = ["hadir", "izin", "sakit", "alpha"];

const STATUS_TONE = {
    hadir: "btn-success",
    izin: "btn-info",
    sakit: "btn-warning",
    alpha: "btn-error",
};

const formatKelasLabel = (kelas) => {
    if (!kelas) return "N/A";
    if (kelas.parent) return `${kelas.parent.nama_kelas} → ${kelas.nama_kelas}`;
    return kelas.nama_kelas || "N/A";
};

export default function PertemuanAbsensi({
    pertemuan,
    praktikans = [],
    aslabs = [],
    existingAbsensiPraktikan = {},
    existingAbsensiAslab = {},
}) {
    const [activeTab, setActiveTab] = useState("praktikan");

    const mataKuliah =
        pertemuan?.praktikum?.mata_kuliah ||
        pertemuan?.kelas?.praktikum?.mata_kuliah ||
        "Praktikum";

    const {
        data: pData,
        setData: setPData,
        post: postP,
        processing: pProcessing,
    } = useForm({
        absensi: praktikans.map((p) => ({
            praktikan_praktikum_id: p.id,
            status: existingAbsensiPraktikan[p.id]?.status || "hadir",
            keterangan: existingAbsensiPraktikan[p.id]?.keterangan || "",
        })),
    });

    const handlePChange = (index, field, value) => {
        const newAbsensi = [...pData.absensi];
        newAbsensi[index][field] = value;
        setPData("absensi", newAbsensi);
    };

    const submitPraktikan = (e) => {
        e.preventDefault();
        postP(route("praktikum.absensi.praktikan.store", pertemuan.id), {
            onSuccess: () =>
                toast.success("Absensi praktikan berhasil disimpan"),
            onError: () => toast.error("Gagal menyimpan absensi"),
        });
    };

    const {
        data: aData,
        setData: setAData,
        post: postA,
        processing: aProcessing,
    } = useForm({
        absensi: aslabs.map((a) => ({
            aslab_praktikum_id: a.id,
            status: existingAbsensiAslab[a.id]?.status || "hadir",
            keterangan: existingAbsensiAslab[a.id]?.keterangan || "",
        })),
    });

    const handleAChange = (index, field, value) => {
        const newAbsensi = [...aData.absensi];
        newAbsensi[index][field] = value;
        setAData("absensi", newAbsensi);
    };

    const submitAslab = (e) => {
        e.preventDefault();
        postA(route("praktikum.absensi.aslab.store", pertemuan.id), {
            onSuccess: () => toast.success("Absensi aslab berhasil disimpan"),
            onError: () => toast.error("Gagal menyimpan absensi"),
        });
    };

    const praktikanRows = useMemo(
        () =>
            praktikans.map((p, idx) => {
                const name = p.praktikan?.user?.name || p.user?.name || "";
                const nim = p.praktikan?.user?.nim || p.user?.nim || "";
                return {
                    id: p.id,
                    idx,
                    search: `${name} ${nim}`,
                    name,
                    nim,
                    kelas: formatKelasLabel(p.kelas),
                };
            }),
        [praktikans],
    );

    const aslabRows = useMemo(
        () =>
            aslabs.map((a, idx) => ({
                id: a.id,
                idx,
                search: `${a.user?.name || a.name || ""} ${a.user?.email || a.email || ""}`,
                name: a.user?.name || a.name || "",
                email: a.user?.email || a.email || "",
            })),
        [aslabs],
    );

    const praktikanColumns = useMemo(
        () => [
            {
                key: "search",
                header: "Nama / NIM",
                render: (row) => (
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-sm text-base-content/70">
                            {row.nim}
                        </div>
                    </div>
                ),
            },
            {
                key: "kelas",
                header: "Kelas",
                sortable: false,
                searchable: false,
                render: (row) => row.kelas,
            },
            {
                key: "status",
                header: "Status",
                sortable: false,
                searchable: false,
                render: (row) => (
                    <div
                        className="join"
                        role="radiogroup"
                        aria-label={`Status kehadiran ${row.name}`}
                    >
                        {STATUS_OPTIONS.map((status) => {
                            const checked =
                                (pData.absensi[row.idx]?.status || "hadir") ===
                                status;
                            return (
                                <label
                                    key={status}
                                    className={`btn btn-sm join-item min-h-11 ${checked ? STATUS_TONE[status] : "btn-ghost border-base-300"}`}
                                >
                                    <input
                                        type="radio"
                                        name={`status_p_${row.id}`}
                                        value={status}
                                        checked={checked}
                                        onChange={(e) =>
                                            handlePChange(
                                                row.idx,
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="sr-only"
                                    />
                                    {status.toUpperCase()}
                                </label>
                            );
                        })}
                    </div>
                ),
            },
            {
                key: "keterangan",
                header: "Keterangan",
                sortable: false,
                searchable: false,
                render: (row) => (
                    <input
                        type="text"
                        value={pData.absensi[row.idx]?.keterangan || ""}
                        onChange={(e) =>
                            handlePChange(row.idx, "keterangan", e.target.value)
                        }
                        className="input input-bordered input-sm min-h-11 w-full focus:input-primary"
                        placeholder="Catatan..."
                    />
                ),
            },
        ],
        [pData.absensi],
    );

    const aslabColumns = useMemo(
        () => [
            {
                key: "search",
                header: "Nama Asisten",
                render: (row) => (
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-sm text-base-content/70">
                            {row.email}
                        </div>
                    </div>
                ),
            },
            {
                key: "status",
                header: "Status",
                sortable: false,
                searchable: false,
                render: (row) => (
                    <div
                        className="join"
                        role="radiogroup"
                        aria-label={`Status kehadiran ${row.name}`}
                    >
                        {STATUS_OPTIONS.map((status) => {
                            const checked =
                                (aData.absensi[row.idx]?.status || "hadir") ===
                                status;
                            return (
                                <label
                                    key={status}
                                    className={`btn btn-sm join-item min-h-11 ${checked ? STATUS_TONE[status] : "btn-ghost border-base-300"}`}
                                >
                                    <input
                                        type="radio"
                                        name={`status_a_${row.id}`}
                                        value={status}
                                        checked={checked}
                                        onChange={(e) =>
                                            handleAChange(
                                                row.idx,
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                        className="sr-only"
                                    />
                                    {status.toUpperCase()}
                                </label>
                            );
                        })}
                    </div>
                ),
            },
            {
                key: "keterangan",
                header: "Keterangan",
                sortable: false,
                searchable: false,
                render: (row) => (
                    <input
                        type="text"
                        value={aData.absensi[row.idx]?.keterangan || ""}
                        onChange={(e) =>
                            handleAChange(row.idx, "keterangan", e.target.value)
                        }
                        className="input input-bordered input-sm min-h-11 w-full focus:input-primary"
                        placeholder="Catatan..."
                    />
                ),
            },
        ],
        [aData.absensi],
    );

    return (
        <DashboardLayout>
            <Head title={`Absensi - ${pertemuan?.judul || "Pertemuan"}`} />

            <nav
                className="mb-4 flex text-sm text-base-content/70"
                aria-label="Breadcrumb"
            >
                <ol className="inline-flex items-center space-x-1">
                    <li>
                        <Link
                            href={route("praktikum.index")}
                            className="hover:text-primary"
                        >
                            Praktikum
                        </Link>
                    </li>
                    <li>
                        <span className="mx-1">/</span>
                    </li>
                    <li>
                        <Link
                            href={route("praktikum.show", {
                                praktikum:
                                    pertemuan?.kelas?.praktikum_id ||
                                    pertemuan?.praktikum?.id,
                            })}
                            className="hover:text-primary"
                        >
                            {mataKuliah}
                        </Link>
                    </li>
                    <li>
                        <span className="mx-1">/</span>
                    </li>
                    <li>
                        <Link
                            href={route("praktikum.pertemuan.index", {
                                praktikum:
                                    pertemuan?.kelas?.praktikum_id ||
                                    pertemuan?.praktikum?.id,
                            })}
                            className="hover:text-primary"
                        >
                            Pertemuan
                        </Link>
                    </li>
                    <li>
                        <span className="mx-1">/</span>
                    </li>
                    <li className="font-medium text-primary">
                        <span>{pertemuan?.judul || "Pertemuan"}</span>
                        <span className="mx-1">/</span>
                        <span>Absensi</span>
                    </li>
                </ol>
            </nav>

            <PageHeader
                title="Absensi Pertemuan"
                description={`${mataKuliah} - ${pertemuan?.judul || "-"}`}
            />

            <PageSection
                bodyClassName="p-0"
                actions={
                    <div
                        role="tablist"
                        className="tabs tabs-boxed"
                        aria-label="Pilih daftar absensi"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "praktikan"}
                            onClick={() => setActiveTab("praktikan")}
                            className={`tab min-h-11 ${activeTab === "praktikan" ? "tab-active" : ""}`}
                        >
                            Absensi Praktikan
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "aslab"}
                            onClick={() => setActiveTab("aslab")}
                            className={`tab min-h-11 ${activeTab === "aslab" ? "tab-active" : ""}`}
                        >
                            Absensi Asisten
                        </button>
                    </div>
                }
            >
                {activeTab === "praktikan" && (
                    <form onSubmit={submitPraktikan} className="space-y-4 p-4 sm:p-5">
                        <DataGrid
                            rows={praktikanRows}
                            columns={praktikanColumns}
                            rowKey="id"
                            searchPlaceholder="Cari praktikan (nama / NIM)..."
                            emptyMessage="Belum ada praktikan terdaftar."
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                loading={pProcessing}
                            >
                                Simpan Absensi Praktikan
                            </Button>
                        </div>
                    </form>
                )}

                {activeTab === "aslab" && (
                    <form onSubmit={submitAslab} className="space-y-4 p-4 sm:p-5">
                        <DataGrid
                            rows={aslabRows}
                            columns={aslabColumns}
                            rowKey="id"
                            searchPlaceholder="Cari asisten (nama / email)..."
                            emptyMessage="Belum ada asisten terdaftar."
                        />
                        <div className="flex justify-end">
                            <Button type="submit" loading={aProcessing}>
                                Simpan Absensi Asisten
                            </Button>
                        </div>
                    </form>
                )}
            </PageSection>
        </DashboardLayout>
    );
}
