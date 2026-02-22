import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Edit, ExternalLink, PlusCircle, Trash2 } from "lucide-react";

export default function Index({ kuesioner, can }) {
    const { auth } = usePage().props;

    return (
        <DashboardLayout>
            <Head title="Kuesioner" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Daftar Kuesioner
                    </h2>
                    {can.create && (
                        <Link
                            href={route("kuesioner.create")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Buat Kuesioner
                        </Link>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {kuesioner.data.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Belum ada kuesioner yang dibuat.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Judul
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipe
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Periode
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {kuesioner.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.judul}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {item.deskripsi}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.tipe === "internal" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                                            >
                                                {item.tipe === "internal"
                                                    ? "Internal"
                                                    : "Eksternal"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.tanggal_mulai ? (
                                                <>
                                                    {new Date(
                                                        item.tanggal_mulai,
                                                    ).toLocaleDateString()}{" "}
                                                    -
                                                    {item.tanggal_selesai
                                                        ? new Date(
                                                              item.tanggal_selesai,
                                                          ).toLocaleDateString()
                                                        : "Seterusnya"}
                                                </>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                            >
                                                {item.is_active
                                                    ? "Aktif"
                                                    : "Non-aktif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    href={route(
                                                        "kuesioner.show",
                                                        item.id,
                                                    )}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Lihat"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                {can.edit && (
                                                    <Link
                                                        href={route(
                                                            "kuesioner.edit",
                                                            item.id,
                                                        )}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {can.delete && (
                                                    <Link
                                                        as="button"
                                                        method="delete"
                                                        href={route(
                                                            "kuesioner.destroy",
                                                            item.id,
                                                        )}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Hapus"
                                                        preserveState
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
