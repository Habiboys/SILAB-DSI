import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLab } from "../../Components/LabContext";
import Button from "../../Components/Button";
import EmptyState from "../../Components/EmptyState";
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

// Warna kegiatan memakai token tema (bukan hex mentah) agar ikut mode terang/gelap.
const STATUS_CHIP = {
    diajukan: "bg-warning text-warning-content",
    disetujui: "bg-primary text-primary-content",
    ditolak: "bg-error text-error-content",
};

const STATUS_DOT = {
    diajukan: "bg-warning",
    disetujui: "bg-primary",
    ditolak: "bg-error",
};

function formatDateID(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const WEEK_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function KegiatanKalender({ filters = {} }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const { selectedLab, selectedKepengurusanLabId, setSelectedKepengurusanLabId } = useLab();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Kepengurusan aktif: URL ?kepengurusan_lab_id= menang (sumber kebenaran saat
    // berpindah konteks), jika tidak ada pakai pilihan tersimpan di LabContext.
    useEffect(() => {
        if (!filters.kepengurusan_lab_id) return;
        if (String(filters.kepengurusan_lab_id) !== String(selectedKepengurusanLabId)) {
            setSelectedKepengurusanLabId(filters.kepengurusan_lab_id);
        }
    }, [filters.kepengurusan_lab_id]);

    const activeKepengurusanLabId = filters.kepengurusan_lab_id || selectedKepengurusanLabId;

    useEffect(() => {
        fetchEvents();
    }, [activeKepengurusanLabId, selectedLab?.id]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = activeKepengurusanLabId
                ? { kepengurusan_lab_id: activeKepengurusanLabId }
                : { lab_id: selectedLab?.id };
            const response = await axios.get(route("kegiatan.calendar-data"), { params });
            setEvents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Gagal mengambil data kalender", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getEventsForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter((e) => e.start === dateStr || (e.start <= dateStr && e.end > dateStr));
    };

    return (
        <DashboardLayout>
            <Head title="Kalender Kegiatan" />

            <PageHeader
                title="Kalender Kegiatan"
                description="Lihat jadwal dan status kegiatan laboratorium."
                actions={<Button href={route("kegiatan.index")}>Daftar Kegiatan</Button>}
            />

            <PageSection className="overflow-hidden" bodyClassName="flex min-h-[32rem] flex-col p-0">
                <div className="flex flex-col gap-3 border-b border-base-300 bg-base-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <div className="join">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="btn btn-ghost btn-square join-item min-h-11 min-w-11 border border-base-300"
                            aria-label="Bulan sebelumnya"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentDate(new Date())}
                            className="btn btn-ghost join-item min-h-11 border border-base-300 px-4 text-sm"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="btn btn-ghost btn-square join-item min-h-11 min-w-11 border border-base-300"
                            aria-label="Bulan berikutnya"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="grid min-w-[42rem] grid-cols-7 border-b border-base-300 bg-base-200 py-2 text-center text-sm font-semibold text-base-content/70">
                        {WEEK_DAYS.map((day) => <div key={day}>{day}</div>)}
                    </div>

                    <div className="grid min-w-[42rem] flex-1 grid-cols-7">
                        {Array.from({ length: firstDay }).map((_, index) => (
                            <div key={`prev-${index}`} className="min-h-[100px] border-b border-r border-base-300 bg-base-200/50" />
                        ))}

                        {days.map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <div
                                    key={day}
                                    className={`min-h-[100px] border-b border-r border-base-300 p-2 transition-colors hover:bg-base-200 ${isToday ? "bg-primary/5" : ""}`}
                                >
                                    <div className={`mb-1 text-right text-sm ${isToday ? "font-bold text-primary" : "text-base-content/70"}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.map((event) => (
                                            <button
                                                key={event.id}
                                                type="button"
                                                onClick={() => setSelectedEvent(event)}
                                                title={event.title}
                                                className={`block w-full truncate rounded px-2 py-1 text-left text-xs hover:opacity-80 focus:outline-none ${STATUS_CHIP[event.status] ?? "bg-neutral text-neutral-content"}`}
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
                    <div className="flex items-center gap-4 text-xs text-base-content/70">
                        <span className="flex items-center gap-1.5">
                            <span className={`inline-block h-3 w-3 rounded-sm ${STATUS_DOT.diajukan}`} /> Diajukan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className={`inline-block h-3 w-3 rounded-sm ${STATUS_DOT.disetujui}`} /> Disetujui
                        </span>
                    </div>
                    {loading && <span className="loading loading-spinner loading-sm text-primary" aria-label="Memuat kegiatan" />}
                </div>
            </PageSection>

            {!loading && events.length === 0 && (
                <PageSection className="mt-4">
                    <EmptyState
                        icon={CalendarDays}
                        title="Belum ada kegiatan pada periode ini."
                        description="Kegiatan dengan status Diajukan atau Disetujui akan tampil di kalender."
                        action={<Button href={route("kegiatan.index")}>Lihat Daftar Kegiatan</Button>}
                    />
                </PageSection>
            )}

            <Modal
                show={!!selectedEvent}
                maxWidth="md"
                onClose={() => setSelectedEvent(null)}
            >
                {selectedEvent && (
                    <>
                        <div className="flex items-start justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-sm ${STATUS_DOT[selectedEvent.status] ?? "bg-neutral"}`} />
                                <h3 className="truncate text-lg font-semibold">{selectedEvent.title}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11 shrink-0"
                                aria-label="Tutup"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3 p-4 sm:p-5">
                            <div className="flex items-center gap-2">
                                <StatusBadge
                                    status={selectedEvent.status}
                                    label={STATUS_LABEL[selectedEvent.status] ?? selectedEvent.status}
                                />
                            </div>

                            <div className="flex items-start gap-2 text-sm text-base-content/80">
                                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
                                <span>
                                    {formatDateID(selectedEvent.start)}
                                    {selectedEvent.end && selectedEvent.end !== selectedEvent.start && (
                                        <span className="text-base-content/60">
                                            {" "}sampai{" "}
                                            {formatDateID(
                                                new Date(new Date(selectedEvent.end).getTime() - 86400000)
                                                    .toISOString()
                                                    .split("T")[0],
                                            )}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-base-300 p-4 sm:flex-row sm:justify-end sm:p-5">
                            <Button variant="ghost" onClick={() => setSelectedEvent(null)}>Tutup</Button>
                            <Button href={selectedEvent.url}>
                                <ExternalLink className="h-3.5 w-3.5" />
                                Lihat Selengkapnya
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </DashboardLayout>
    );
}
