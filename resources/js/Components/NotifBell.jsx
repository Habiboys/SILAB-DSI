import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

function timeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function NotifBell() {
    const { unread_notif_count } = usePage().props;
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [localExtra, setLocalExtra] = useState(0);
    const prevServerCount = useRef(unread_notif_count);
    const dropdownRef = useRef(null);

    // Reset extra saat server count berubah (navigasi baru)
    useEffect(() => {
        if (unread_notif_count !== prevServerCount.current) {
            prevServerCount.current = unread_notif_count;
            setLocalExtra(0);
        }
    }, [unread_notif_count]);

    // Tambah +1 ke badge saat notif FCM masuk (tanpa Inertia reload)
    useEffect(() => {
        const handler = () => setLocalExtra((c) => c + 1);
        window.addEventListener('silab:new-notif', handler);
        return () => window.removeEventListener('silab:new-notif', handler);
    }, []);

    const displayCount = unread_notif_count + localExtra;

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchRecent = async () => {
        setLoading(true);
        try {
            const res = await fetch('/notifikasi', {
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
            });
            const data = await res.json();
            setNotifs(data.data?.slice(0, 8) ?? []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!open) fetchRecent();
        setOpen((v) => !v);
    };

    const markRead = async (id) => {
        await axios.post(`/notifikasi/${id}/read`);
        setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        router.reload({ only: ['unread_notif_count'] });
    };

    const markAll = async () => {
        await axios.post('/notifikasi/read-all');
        setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        router.reload({ only: ['unread_notif_count'] });
    };

    const handleNotifClick = (notif) => {
        if (!notif.read_at) markRead(notif.id);
        setOpen(false);
        const url = notif.data?.url;
        if (url) router.visit(url);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                aria-label="Notifikasi"
            >
                <BellIcon className="w-6 h-6" />
                {displayCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {displayCount > 99 ? '99+' : displayCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
                        <span className="font-semibold text-base-content text-sm">Notifikasi</span>
                        {unread_notif_count > 0 && (
                            <button
                                onClick={markAll}
                                className="text-xs text-primary hover:text-primary font-medium"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-base-300">
                        {loading && (
                            <div className="py-8 text-center text-sm text-base-content/50">Memuat...</div>
                        )}
                        {!loading && notifs.length === 0 && (
                            <div className="py-8 text-center text-sm text-base-content/50">Tidak ada notifikasi</div>
                        )}
                        {!loading && notifs.map((notif) => {
                            const isUnread = !notif.read_at;
                            return (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotifClick(notif)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-base-200 transition-colors ${isUnread ? 'bg-primary/10/50' : ''}`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isUnread ? 'bg-primary/15' : 'bg-base-200'}`}>
                                        <BellIcon className={`w-4 h-4 ${isUnread ? 'text-primary' : 'text-base-content/50'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-base-content' : 'font-medium text-base-content'}`}>
                                            {notif.data?.title}
                                        </p>
                                        <p className="text-xs text-base-content/60 mt-0.5 line-clamp-2">{notif.data?.body}</p>
                                        <p className="text-[11px] text-base-content/50 mt-1">{timeAgo(notif.created_at)}</p>
                                    </div>
                                    {isUnread && (
                                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-base-300 px-4 py-2.5">
                        <Link
                            href={route('notifikasi.index')}
                            onClick={() => setOpen(false)}
                            className="block text-center text-xs font-medium text-primary hover:text-primary"
                        >
                            Lihat semua notifikasi →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
