import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { Calendar, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLab } from "../../Components/LabContext";
import Modal from "../../Components/Modal";
import DashboardLayout from "../../Layouts/DashboardLayout";

const STATUS_LABEL = {
    diajukan: { label: "Diajukan", cls: "bg-yellow-100 text-yellow-800" },
    disetujui: { label: "Disetujui", cls: "bg-blue-100 text-blue-800" },
    ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
};

function formatDateID(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function KegiatanKalender() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
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
    const firstDay = new Date(year, month, 1).getDay(); 

    
    
    

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
        
        
        

        
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        return events.filter((e) => {
            
            
            return (
                e.start === dateStr || (e.start <= dateStr && e.end > dateStr)
            );
            
        });
    };

    return (
        <DashboardLayout>
            <Head title="Kalender Kegiatan" />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-120px)]">
                
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

                
                <div className="grid grid-cols-7 bg-gray-100 border-b text-center py-2 text-sm font-semibold text-gray-600">
                    <div>Minggu</div>
                    <div>Senin</div>
                    <div>Selasa</div>
                    <div>Rabu</div>
                    <div>Kamis</div>
                    <div>Jumat</div>
                    <div>Sabtu</div>
                </div>

                
                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    
                    {prevMonthDays.map((_, index) => (
                        <div
                            key={`prev-${index}`}
                            className="border-b border-r bg-gray-50/50 min-h-[100px]"
                        ></div>
                    ))}

                    
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
                                        <button
                                            key={event.id}
                                            onClick={() =>
                                                setSelectedEvent(event)
                                            }
                                            title={event.title}
                                            className="w-full text-left block px-2 py-1 text-xs text-white rounded truncate hover:opacity-80 focus:outline-none"
                                            style={{
                                                backgroundColor:
                                                    event.backgroundColor ||
                                                    "#3b82f6",
                                            }}
                                        >
                                            {event.title}
                                        </button>
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

            
            <Modal
                show={!!selectedEvent}
                maxWidth="md"
                onClose={() => setSelectedEvent(null)}
            >
                {selectedEvent && (
                    <div className="p-6">
                        
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
                                    style={{
                                        backgroundColor:
                                            selectedEvent.backgroundColor ||
                                            "#3b82f6",
                                    }}
                                />
                                <h3 className="text-base font-semibold text-gray-900 leading-snug">
                                    {selectedEvent.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        
                        <div className="space-y-3 mb-6">
                            
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        STATUS_LABEL[selectedEvent.status]
                                            ?.cls ?? "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {STATUS_LABEL[selectedEvent.status]
                                        ?.label ?? selectedEvent.status}
                                </span>
                            </div>

                            
                            <div className="flex items-start gap-2 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span>
                                        {formatDateID(selectedEvent.start)}
                                    </span>
                                    {selectedEvent.end &&
                                        selectedEvent.end !==
                                            selectedEvent.start && (
                                            <span className="text-gray-500">
                                                {" "}
                                                &mdash;{" "}
                                                
                                                {formatDateID(
                                                    new Date(
                                                        new Date(
                                                            selectedEvent.end,
                                                        ).getTime() - 86400000,
                                                    )
                                                        .toISOString()
                                                        .split("T")[0],
                                                )}
                                            </span>
                                        )}
                                </div>
                            </div>
                        </div>

                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                            <Link
                                href={selectedEvent.url}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Lihat Selengkapnya
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
