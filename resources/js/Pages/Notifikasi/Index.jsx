import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function timeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
}

const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

export default function NotifikasiIndex({ notifications }) {
    const { unread_notif_count } = usePage().props;
    const [items, setItems] = useState(notifications.data);

    const csrfToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const markRead = async (id) => {
        await fetch(`/notifikasi/${id}/read`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
        });
        setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        router.reload({ only: ['unread_notif_count'] });
    };

    const markAll = async () => {
        await fetch('/notifikasi/read-all', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
        });
        setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        router.reload({ only: ['unread_notif_count'] });
    };

    const handleClick = (notif) => {
        if (!notif.read_at) markRead(notif.id);
        const url = notif.data?.url;
        if (url) router.visit(url);
    };

    return (
        <DashboardLayout>
            <Head title="Notifikasi" />

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Notifikasi</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {unread_notif_count > 0
                                ? `${unread_notif_count} notifikasi belum dibaca`
                                : 'Semua notifikasi sudah dibaca'}
                        </p>
                    </div>
                    {unread_notif_count > 0 && (
                        <button
                            onClick={markAll}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors"
                        >
                            Tandai semua dibaca
                        </button>
                    )}
                </div>

                
                {items.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                        <BellIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Belum ada notifikasi</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((notif) => {
                            const isUnread = !notif.read_at;
                            return (
                                <button
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className={`w-full text-left flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}
                                >
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${isUnread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        <BellIcon className={`w-4 h-4 ${isUnread ? 'text-blue-600' : 'text-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {notif.data?.title}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.data?.body}</p>
                                        <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                                    </div>
                                    {isUnread && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                
                {notifications.last_page > 1 && (
                    <div className="px-6 py-4 border-t flex justify-center gap-1.5">
                        {notifications.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url || link.active}
                                onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                    link.active
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : !link.url
                                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
