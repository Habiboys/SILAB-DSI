import { Link } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

const destinations = [
    { label: 'Dashboard', href: '/dashboard', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Anggota', href: '/anggota', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Program Kerja', href: '/proker', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Kegiatan', href: '/kegiatan', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Keuangan', href: '/riwayat-keuangan', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Piket', href: '/piket/periode-piket', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Praktikum', href: '/praktikum', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Inventaris', href: '/inventaris', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Surat Masuk', href: '/surat-menyurat/surat-masuk', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Surat Keluar', href: '/surat-menyurat/surat-keluar', roles: ['kadep', 'admin', 'asisten', 'dosen', 'kalab'] },
    { label: 'Sertifikat', href: '/sertifikat', roles: ['kadep', 'admin'] },
    { label: 'Praktikum Saya', href: '/praktikan/daftar-tugas', roles: ['praktikan'] },
    { label: 'Sertifikat Saya', href: '/sertifikat-saya', roles: ['praktikan', 'asisten', 'dosen', 'kalab'] },
    { label: 'Mata Kuliah', href: '/data-master/mata-kuliah', roles: ['kadep', 'superadmin'] },
    { label: 'Tahun Kepengurusan', href: '/tahun-kepengurusan', roles: ['kadep', 'superadmin'] },
    { label: 'User Management', href: '/user-management', roles: ['kadep', 'admin'] },
];

export default function NavbarSearch({ roles = [], kepengurusanLabId }) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const results = query.trim()
        ? destinations.filter((item) => (!item.roles || item.roles.some((role) => roles.includes(role)) || roles.includes('superadmin')) && item.label.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID'))).slice(0, 6)
        : [];

    return (
        <div className="relative w-full min-w-0 sm:max-w-56 xl:max-w-72">
            <button type="button" className="btn btn-ghost btn-square min-h-11 min-w-11 sm:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Cari halaman" aria-expanded={mobileOpen}><Search className="h-5 w-5" /></button>
            <label className={`input min-h-11 items-center gap-2 bg-base-100 ${mobileOpen ? 'absolute right-0 top-[3.25rem] z-50 flex w-[min(90vw,22rem)] shadow-md' : 'hidden'} sm:static sm:flex sm:w-full sm:shadow-none`}>
                <Search className="h-4 w-4 shrink-0 text-base-content/50" aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onKeyDown={(event) => { if (event.key === 'Escape') { setQuery(''); setMobileOpen(false); event.currentTarget.blur(); } }} placeholder="Cari halaman..." aria-label="Cari halaman" className="min-w-0 grow" />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X className="h-4 w-4" /></button>}
            </label>
            {focused && query.trim() && (
                <div className="absolute right-0 top-[6.75rem] z-50 w-[min(90vw,22rem)] rounded-box border border-base-300 bg-base-100 p-1 shadow-md sm:left-0 sm:top-full sm:mt-2 sm:w-auto">
                    {results.length ? results.map((item) => (
                        <Link key={item.href} href={kepengurusanLabId && !item.href.startsWith('/data-master') ? `${item.href}?kepengurusan_lab_id=${kepengurusanLabId}` : item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-base-200" onClick={() => { setQuery(''); setFocused(false); setMobileOpen(false); }}>{item.label}</Link>
                    )) : <p className="px-3 py-2 text-sm text-base-content/60">Halaman tidak ditemukan</p>}
                </div>
            )}
        </div>
    );
}
