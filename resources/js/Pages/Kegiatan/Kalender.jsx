import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLab } from "../../Components/LabContext";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function KegiatanKalender() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { selectedLab, selectedKepengurusanLabId } = useLab();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    useEffect(() => {
        fetchEvents();
    }, [selectedLab?.id, selectedKepengurusanLabId]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = selectedKepengurusanLabId
                ? { kepengurusan_lab_id: selectedKepengurusanLabId }
                : { lab_id: selectedLab?.id };
            const response = await axios.get(route("kegiatan.calendar-data"), {
                params,
            });
            setEvents(response.data);
        } catch (error) {
            console.error("Gagal mengambil data kalender", error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

    // Adjust so Monday is first day if needed. Let's stick to Sunday first for simplicity or standard.
    // Standard ID calendar usually Monday first? Let's use Sunday first to match JS getDay() easily.
    // Or: If Sunday is 0.

    const prevMonthDays = [];
    for (let i = 0; i < firstDay; i++) {
        prevMonthDays.push(i);
    }

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getEventsForDay = (day) => {
        const checkDate = new Date(year, month, day);
        // Format checkDate to YYYY-MM-DD local
        // Simplified: check string matching because events.start is YYYY-MM-DD
        // Be careful with timezone. simpler to match specific parts.

        // Easier:
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        return events.filter((e) => {
            // Simple start date match. For multi-day, need range check.
            // API returns start 'Y-m-d'
            return (
                e.start === dateStr || (e.start <= dateStr && e.end > dateStr)
            );
            // Note: e.end in API (FullCalendar) is exclusive.
        });
    };

    return (
        <DashboardLayout>
            <Head title="Kalender Kegiatan" />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-120px)]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-200 rounded-full"
                        >
                            &larr;
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                            Hari Ini
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-200 rounded-full"
                        >
                            &rarr;
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 bg-gray-100 border-b text-center py-2 text-sm font-semibold text-gray-600">
                    <div>Minggu</div>
                    <div>Senin</div>
                    <div>Selasa</div>
                    <div>Rabu</div>
                    <div>Kamis</div>
                    <div>Jumat</div>
                    <div>Sabtu</div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {/* Empty cells for prev month */}
                    {prevMonthDays.map((_, index) => (
                        <div
                            key={`prev-${index}`}
                            className="border-b border-r bg-gray-50/50 min-h-[100px]"
                        ></div>
                    ))}

                    {/* Current month days */}
                    {days.map((day) => {
                        const dayEvents = getEventsForDay(day);
                        const isToday =
                            new Date().toDateString() ===
                            new Date(year, month, day).toDateString();

                        return (
                            <div
                                key={day}
                                className={`border-b border-r min-h-[100px] p-2 hover:bg-gray-50 transition-colors ${isToday ? "bg-blue-50" : ""}`}
                            >
                                <div
                                    className={`text-right text-sm mb-1 ${isToday ? "font-bold text-blue-600" : "text-gray-700"}`}
                                >
                                    {day}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={event.url}
                                            title={event.title}
                                            className="block px-2 py-1 text-xs text-white rounded truncate hover:opacity-80"
                                            style={{
                                                backgroundColor:
                                                    event.backgroundColor ||
                                                    "#3b82f6",
                                            }}
                                        >
                                            {event.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t flex justify-between items-center bg-gray-50 flex-wrap gap-2">
                    <Link
                        href={route("kegiatan.index")}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        &larr; Kembali ke Daftar Kegiatan
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                            <span
                                className="w-3 h-3 rounded-sm inline-block"
                                style={{ backgroundColor: "#f59e0b" }}
                            ></span>{" "}
                            Diajukan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                className="w-3 h-3 rounded-sm inline-block"
                                style={{ backgroundColor: "#3b82f6" }}
                            ></span>{" "}
                            Disetujui
                        </span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
