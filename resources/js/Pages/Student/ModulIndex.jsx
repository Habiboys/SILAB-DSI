import { Head, Link } from "@inertiajs/react";
import { BookOpen, ChevronRight, Clock } from "lucide-react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function StudentModulIndex({ praktikumList }) {
    const normalizedList = (praktikumList || []).map((praktikum) => ({
        ...praktikum,
        modul_count: praktikum.modul_praktikum?.length || 0,
    }));

    return (
        <DashboardLayout>
            <Head title="Modul Praktikum Saya" />

            <div className="space-y-6">
                
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Modul Praktikum Saya
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Pilih praktikum terlebih dahulu, lalu lihat daftar modul
                        pada praktikum tersebut.
                    </p>
                </div>

                
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {normalizedList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Belum terdaftar di praktikum
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Anda belum terdaftar dalam praktikum apapun.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {normalizedList.map((praktikum) => (
                                <div
                                    key={praktikum.id}
                                    className="p-5 sm:p-6 hover:bg-slate-50/50 transition duration-150 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                                >
                                    <div className="flex-1 min-w-0 pr-4 flex items-start gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 flex-shrink-0">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                                                {praktikum.mata_kuliah}
                                            </h4>
                                            <div className="flex flex-wrap text-sm text-gray-500 gap-y-1 gap-x-2">
                                                {praktikum.semester && (
                                                    <span>
                                                        Semester{" "}
                                                        {praktikum.semester}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {praktikum.modul_count}{" "}
                                                    modul
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 flex items-center justify-end">
                                        <Link
                                            href={route(
                                                "praktikan.modul.praktikum",
                                                praktikum.id,
                                            )}
                                            className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm group-hover:shadow"
                                        >
                                            Lihat Modul
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
