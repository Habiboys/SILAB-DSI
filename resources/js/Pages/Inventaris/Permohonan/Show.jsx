import Modal from "@/Components/Modal";
import { usePermission } from "@/Hooks/usePermission";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

export default function PermohonanAsetShow({ permohonan }) {
    const { can, isKalab, hasRole } = usePermission();

    // Check if user can approve (Kalab or Superadmin)
    const canApprove =
        can("inventaris.approve-permohonan") &&
        (isKalab() || hasRole("superadmin"));

    // Per-item decisions: { [itemId]: { status: 'disetujui'|'ditolak', jumlah_disetujui: '', catatan: '' } }
    const buildInitialDecisions = () => {
        const obj = {};
        (permohonan.wishlist_aset || []).forEach((item) => {
            obj[item.id] = {
                status:
                    item.status_item === "diajukan"
                        ? "disetujui"
                        : item.status_item,
                jumlah_disetujui: item.jumlah_disetujui ?? item.jumlah_diminta,
                catatan: item.catatan_item ?? "",
            };
        });
        return obj;
    };

    const [itemDecisions, setItemDecisions] = useState(buildInitialDecisions);
    const [catatanApproval, setCatatanApproval] = useState(
        permohonan.catatan_approval ?? "",
    );
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Approval Form
    const form = useForm({
        status_permohonan: "",
        catatan_approval: "",
        items: {},
    });

    const updateItemDecision = (itemId, field, value) => {
        setItemDecisions((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value },
        }));
    };

    const computeOverallStatus = () => {
        const statuses = Object.values(itemDecisions).map((d) => d.status);
        if (statuses.every((s) => s === "ditolak")) return "ditolak";
        return "disetujui"; // at least one approved = permohonan disetujui
    };

    const handleSaveDecisions = (e) => {
        e.preventDefault();
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSubmit = () => {
        const overall = computeOverallStatus();
        form.transform(() => ({
            status_permohonan: overall,
            catatan_approval: catatanApproval,
            items: itemDecisions,
        }));
        form.put(route("inventaris.permohonan.update", permohonan.id), {
            onSuccess: () => {
                setIsConfirmModalOpen(false);
                toast.success("Keputusan permohonan berhasil disimpan");
            },
            onError: () => toast.error("Gagal menyimpan keputusan"),
            preserveScroll: true,
        });
    };

    const allApproved = Object.values(itemDecisions).every(
        (d) => d.status === "disetujui",
    );
    const allRejected = Object.values(itemDecisions).every(
        (d) => d.status === "ditolak",
    );
    const mixedDecision = !allApproved && !allRejected;
    const overallStatus = computeOverallStatus();

    const isPending = permohonan.status_permohonan === "diajukan";

    return (
        <DashboardLayout>
            <Head title={`Detail Permohonan ${permohonan.nomor_permohonan}`} />

            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Detail Permohonan Aset
                        </h2>
                        <Link
                            href={route("inventaris.permohonan.index")}
                            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Kembali
                        </Link>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                Informasi Permohonan
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Nomor Permohonan
                                    </label>
                                    <p className="font-medium">
                                        {permohonan.nomor_permohonan}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Tanggal
                                    </label>
                                    <p>
                                        {new Date(
                                            permohonan.tanggal_permohonan,
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Status Permohonan
                                    </label>
                                    <div className="mt-1">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                permohonan.status_permohonan ===
                                                "disetujui"
                                                    ? "bg-green-100 text-green-800"
                                                    : permohonan.status_permohonan ===
                                                        "ditolak"
                                                      ? "bg-red-100 text-red-800"
                                                      : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {permohonan.status_permohonan.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                {permohonan.catatan_approval && (
                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                        <span className="font-semibold block mb-1">
                                            Catatan Approval:
                                        </span>
                                        {permohonan.catatan_approval}
                                    </div>
                                )}
                                {permohonan.approver && (
                                    <div>
                                        <label className="text-xs text-gray-500">
                                            Diproses oleh
                                        </label>
                                        <p className="text-sm">
                                            {permohonan.approver?.name} &bull;{" "}
                                            {permohonan.approved_at
                                                ? new Date(
                                                      permohonan.approved_at,
                                                  ).toLocaleDateString("id-ID")
                                                : ""}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                Informasi Pemohon
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Nama Pemohon
                                    </label>
                                    <p className="font-medium">
                                        {permohonan.user_pemohon?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Laboratorium
                                    </label>
                                    <p>
                                        {permohonan.laboratorium?.nama || "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">
                                        Alasan Pengadaan
                                    </label>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-1">
                                        {permohonan.alasan_umum_pengadaan}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                            Daftar Barang yang Diminta
                        </h3>
                        {canApprove && isPending && (
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>{" "}
                                    Setujui
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>{" "}
                                    Tolak
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama Barang
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Spesifikasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Est. Harga
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Urgensi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status Item
                                    </th>
                                    {canApprove && isPending && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Keputusan
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(permohonan.wishlist_aset || []).map(
                                    (item, index) => {
                                        const decision = itemDecisions[
                                            item.id
                                        ] ?? {
                                            status: "disetujui",
                                            jumlah_disetujui:
                                                item.jumlah_diminta,
                                            catatan: "",
                                        };
                                        const isApproving =
                                            decision.status === "disetujui";
                                        return (
                                            <tr
                                                key={item.id}
                                                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${canApprove && isPending ? (isApproving ? "border-l-4 border-l-green-400" : "border-l-4 border-l-red-400") : ""}`}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {item.nama_barang}
                                                    {item.referensi_url && (
                                                        <a
                                                            href={
                                                                item.referensi_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
                                                        >
                                                            (Link)
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                    <div
                                                        className="truncate max-w-[180px]"
                                                        title={
                                                            item.spesifikasi_teknis
                                                        }
                                                    >
                                                        {item.spesifikasi_teknis ||
                                                            "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>
                                                        <span>
                                                            {
                                                                item.jumlah_diminta
                                                            }{" "}
                                                            {item.satuan ||
                                                                "unit"}
                                                        </span>
                                                        {item.jumlah_disetujui !=
                                                            null &&
                                                            item.status_item !==
                                                                "diajukan" && (
                                                                <div
                                                                    className={`text-xs mt-0.5 font-medium ${item.status_item === "disetujui" ? "text-green-600" : "text-red-500"}`}
                                                                >
                                                                    {item.status_item ===
                                                                    "disetujui"
                                                                        ? `✓ Disetujui: ${item.jumlah_disetujui} ${item.satuan || "unit"}`
                                                                        : "✗ Ditolak"}
                                                                </div>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.perkiraan_harga
                                                        ? new Intl.NumberFormat(
                                                              "id-ID",
                                                              {
                                                                  style: "currency",
                                                                  currency:
                                                                      "IDR",
                                                              },
                                                          ).format(
                                                              item.perkiraan_harga,
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            item.urgensi ===
                                                            "sangat_tinggi"
                                                                ? "bg-red-100 text-red-800"
                                                                : item.urgensi ===
                                                                    "tinggi"
                                                                  ? "bg-orange-100 text-orange-800"
                                                                  : item.urgensi ===
                                                                      "sedang"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-green-100 text-green-800"
                                                        }`}
                                                    >
                                                        {item.urgensi?.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                            item.status_item ===
                                                            "disetujui"
                                                                ? "bg-green-100 text-green-800"
                                                                : item.status_item ===
                                                                    "ditolak"
                                                                  ? "bg-red-100 text-red-800"
                                                                  : item.status_item ===
                                                                      "dipesan"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {item.status_item?.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                    {item.jumlah_disetujui !=
                                                        null &&
                                                        item.status_item ===
                                                            "disetujui" && (
                                                            <span className="ml-1 text-xs text-gray-500">
                                                                (
                                                                {
                                                                    item.jumlah_disetujui
                                                                }{" "}
                                                                {item.satuan})
                                                            </span>
                                                        )}
                                                    {item.catatan_item && (
                                                        <p className="text-xs text-gray-400 mt-0.5 italic">
                                                            {item.catatan_item}
                                                        </p>
                                                    )}
                                                </td>
                                                {/* Per-item decision controls */}
                                                {canApprove && isPending && (
                                                    <td className="px-6 py-4 text-sm min-w-[250px]">
                                                        <div className="space-y-2">
                                                            <div className="flex gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateItemDecision(
                                                                            item.id,
                                                                            "status",
                                                                            "disetujui",
                                                                        )
                                                                    }
                                                                    className={`flex-1 py-1 px-2 text-xs rounded border transition-colors ${decision.status === "disetujui" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-green-50"}`}
                                                                >
                                                                    ✓ Setujui
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateItemDecision(
                                                                            item.id,
                                                                            "status",
                                                                            "ditolak",
                                                                        )
                                                                    }
                                                                    className={`flex-1 py-1 px-2 text-xs rounded border transition-colors ${decision.status === "ditolak" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-300 hover:bg-red-50"}`}
                                                                >
                                                                    ✗ Tolak
                                                                </button>
                                                            </div>
                                                            {decision.status ===
                                                                "disetujui" && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <label className="text-xs text-gray-500 whitespace-nowrap">
                                                                        Jml:
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            item.jumlah_diminta
                                                                        }
                                                                        value={
                                                                            decision.jumlah_disetujui
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItemDecision(
                                                                                item.id,
                                                                                "jumlah_disetujui",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-14 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                                                    />
                                                                    <span className="text-xs text-gray-400">
                                                                        /{" "}
                                                                        {
                                                                            item.jumlah_diminta
                                                                        }{" "}
                                                                        {
                                                                            item.satuan
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="text"
                                                                value={
                                                                    decision.catatan
                                                                }
                                                                onChange={(e) =>
                                                                    updateItemDecision(
                                                                        item.id,
                                                                        "catatan",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Catatan (opsional)"
                                                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Approval form for approvers */}
                {canApprove && isPending && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-800">
                                Keputusan Permohonan
                            </h3>
                            {mixedDecision && (
                                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                        />
                                    </svg>
                                    Ada barang disetujui dan ditolak —
                                    Permohonan akan berstatus Disetujui
                                    (sebagian)
                                </p>
                            )}
                            {allRejected && (
                                <p className="text-sm text-red-600 mt-1">
                                    Semua barang ditolak — Permohonan akan
                                    berstatus Ditolak
                                </p>
                            )}
                            {allApproved && (
                                <p className="text-sm text-green-600 mt-1">
                                    Semua barang disetujui — Permohonan akan
                                    berstatus Disetujui
                                </p>
                            )}
                        </div>
                        <form
                            onSubmit={handleSaveDecisions}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Catatan Umum (opsional)
                                </label>
                                <textarea
                                    value={catatanApproval}
                                    onChange={(e) =>
                                        setCatatanApproval(e.target.value)
                                    }
                                    rows="3"
                                    placeholder="Catatan keseluruhan permohonan..."
                                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Link
                                    href={route("inventaris.permohonan.index")}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className={`px-6 py-2 text-white rounded-md shadow-sm text-sm font-medium disabled:opacity-50 ${allRejected ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                                >
                                    {form.processing
                                        ? "Menyimpan..."
                                        : "Simpan Keputusan"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <Modal
                show={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Konfirmasi Keputusan
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">
                        Ringkasan keputusan per barang:
                    </p>
                    <div className="space-y-1 mb-4 max-h-48 overflow-y-auto border rounded-lg p-2">
                        {(permohonan.wishlist_aset || []).map((item) => {
                            const d = itemDecisions[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                                >
                                    <span className="text-gray-700 truncate max-w-[180px]">
                                        {item.nama_barang}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ml-2 flex-shrink-0 ${d?.status === "disetujui" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                    >
                                        {d?.status === "disetujui"
                                            ? `✓ ${d.jumlah_disetujui ?? item.jumlah_diminta} ${item.satuan || "unit"}`
                                            : "✗ Ditolak"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-sm mb-4 font-medium">
                        Status permohonan:{" "}
                        <span
                            className={
                                overallStatus === "disetujui"
                                    ? "text-green-700"
                                    : "text-red-700"
                            }
                        >
                            {overallStatus.toUpperCase()}
                        </span>
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={form.processing}
                            className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 ${overallStatus === "disetujui" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            {form.processing
                                ? "Memproses..."
                                : "Ya, Konfirmasi"}
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
