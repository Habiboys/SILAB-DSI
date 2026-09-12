import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { Calendar, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLab } from "../../Components/LabContext";
import Button from "../../Components/Button";
import Modal from "../../Components/Modal";
import PageHeader from "../../Components/PageHeader";
import PageSection from "../../Components/PageSection";
import StatusBadge from "../../Components/StatusBadge";
import DashboardLayout from "../../Layouts/DashboardLayout";

const STATUS_LABEL = {
    diajukan: "Diajukan",
    disetujui: "Disetujui",
    ditolak: "Ditolak",
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

            <PageHeader title="Kalender Kegiatan" description="Lihat jadwal dan status kegiatan laboratorium." />
            <PageSection className="overflow-hidden" bodyClassName="flex min-h-[32rem] flex-col p-0">
                <div className="flex flex-col gap-3 border-b border-base-content/10 bg-base-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-bold text-base-content">
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="btn btn-ghost btn-square min-h-11 min-w-11"
                            aria-label="Bulan sebelumnya"
                        >
                            &larr;
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="btn btn-ghost btn-sm min-h-11"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="btn btn-ghost btn-square min-h-11 min-w-11"
                            aria-label="Bulan berikutnya"
                        >
                            &rarr;
                        </button>
                    </div>
                </div>

                
                <div className="overflow-x-auto">
                <div className="grid min-w-[42rem] grid-cols-7 border-b border-base-content/10 bg-base-200 py-2 text-center text-sm font-semibold text-base-content/70">
                    <div>Minggu</div>
                    <div>Senin</div>
                    <div>Selasa</div>
                    <div>Rabu</div>
                    <div>Kamis</div>
                    <div>Jumat</div>
                    <div>Sabtu</div>
                </div>

                
                <div className="grid min-w-[42rem] flex-1 grid-cols-7 overflow-y-auto">
                    
                    {prevMonthDays.map((_, index) => (
                        <div
                            key={`prev-${index}`}
                            className="min-h-[100px] border-b border-r border-base-content/10 bg-base-200/50"
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
                                className={`min-h-[100px] border-b border-r border-base-content/10 p-2 transition-colors hover:bg-base-200 ${isToday ? "bg-primary/5" : ""}`}
                            >
                                <div
                                    className={`mb-1 text-right text-sm ${isToday ? "font-bold text-primary" : "text-base-content/70"}`}
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

                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 bg-base-200 p-4">
                    <Link
                        href={route("kegiatan.index")}
                        className="text-sm text-primary hover:underline"
                    >
                        &larr; Kembali ke Daftar Kegiatan
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-base-content/70">
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
            </PageSection>

            
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
                                <h3 className="text-base font-semibold leading-snug text-base-content">
                                    {selectedEvent.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        
                        <div className="space-y-3 mb-6">
                            
                            <div className="flex items-center gap-2">
                                <StatusBadge
                                    status={selectedEvent.status}
                                    label={STATUS_LABEL[selectedEvent.status] ?? selectedEvent.status}
                                />
                            </div>

                            
                            <div className="flex items-start gap-2 text-sm text-base-content/80">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
                                <div>
                                    <span>
                                        {formatDateID(selectedEvent.start)}
                                    </span>
                                    {selectedEvent.end &&
                                        selectedEvent.end !==
                                            selectedEvent.start && (
                                            <span className="text-base-content/60">
                                                {" "}
                                                sampai{" "}
                                                
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
                                className="btn btn-ghost min-h-11"
                            >
                                Tutup
                            </button>
                            <Link
                                href={selectedEvent.url}
                                className="btn btn-primary min-h-11 gap-1.5"
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
