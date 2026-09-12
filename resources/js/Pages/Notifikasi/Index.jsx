import Button from '@/Components/Button';
import PageHeader from '@/Components/PageHeader';
import PageSection from '@/Components/PageSection';
import StatusBadge from '@/Components/StatusBadge';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

function timeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
}

const BellIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

export default function NotifikasiIndex({ notifications }) {
    const { unread_notif_count } = usePage().props;
    const [items, setItems] = useState(notifications.data);
    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const markRead = async (id) => {
        await fetch(`/notifikasi/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' } });
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
        router.reload({ only: ['unread_notif_count'] });
    };

    const markAll = async () => {
        await fetch('/notifikasi/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' } });
        setItems((prev) => prev.map((item) => ({ ...item, read_at: new Date().toISOString() })));
        router.reload({ only: ['unread_notif_count'] });
    };

    const handleClick = (notification) => {
        if (!notification.read_at) markRead(notification.id);
        if (notification.data?.url) router.visit(notification.data.url);
    };

    return (
        <DashboardLayout>
            <Head title="Notifikasi" />
            <PageHeader
                title="Notifikasi"
                description={unread_notif_count > 0 ? `${unread_notif_count} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
                actions={unread_notif_count > 0 && <Button variant="ghost" onClick={markAll}>Tandai semua dibaca</Button>}
            />
            <PageSection bodyClassName="p-0">
                {items.length === 0 ? (
                    <div className="py-16 text-center text-base-content/60">
                        <BellIcon className="mx-auto mb-3 h-10 w-10" />
                        <p className="text-sm">Belum ada notifikasi.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-base-300">
                        {items.map((notification) => {
                            const isUnread = !notification.read_at;
                            return (
                                <button key={notification.id} type="button" onClick={() => handleClick(notification)} className={`flex min-h-11 w-full items-start gap-3 px-4 py-4 text-left hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:px-5 ${isUnread ? 'bg-primary/5' : ''}`}>
                                    <BellIcon className="mt-0.5 h-5 w-5 shrink-0 text-base-content/60" />
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>{notification.data?.title}</span>
                                        <span className="mt-1 block text-sm text-base-content/70">{notification.data?.body}</span>
                                        <span className="mt-1.5 block text-xs text-base-content/60">{timeAgo(notification.created_at)}</span>
                                    </span>
                                    {isUnread && <StatusBadge status="info" label="Baru" />}
                                </button>
                            );
                        })}
                    </div>
                )}
                {notifications.last_page > 1 && (
                    <nav className="flex flex-wrap justify-center gap-2 border-t border-base-300 p-4" aria-label="Paginasi notifikasi">
                        {notifications.links.map((link, index) => (
                            <button type="button" key={index} disabled={!link.url || link.active} onClick={() => link.url && router.visit(link.url, { preserveScroll: true })} className={`btn btn-sm min-h-11 ${link.active ? 'btn-primary' : 'btn-ghost'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </nav>
                )}
            </PageSection>
        </DashboardLayout>
    );
}
