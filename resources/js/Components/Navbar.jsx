import { Building2, ChevronDown, CircleUserRound, Info, LogOut, Menu } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useLab } from './LabContext';
import AccessibilityMenu from './AccessibilityMenu';
import NotifBell from './NotifBell';

const LabLogo = ({ lab, className = 'h-5 w-5' }) => {
    const [failed, setFailed] = useState(false);

    if (!lab?.logo || failed) {
        return <Building2 className={`${className} shrink-0`} aria-hidden="true" />;
    }

    return (
        <img
            src={`/storage/${lab.logo}`}
            alt=""
            className={`${className} shrink-0 object-contain`}
            onError={() => setFailed(true)}
        />
    );
};

const Navbar = ({ onMobileMenuClick }) => {
    const { auth, laboratorium = [], kepengurusan_list = [], selected_kepengurusan } = usePage().props;
    const {
        selectedLab,
        setSelectedLab,
        setSelectedKepengurusanLabId,
    } = useLab();

    const [labMenuOpen, setLabMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [kepengurusanMenuOpen, setKepengurusanMenuOpen] = useState(false);
    const navRef = useRef(null);

    const hasRole = (roles) => auth.user.roles.some((role) => roles.includes(role));
    const canSwitchLab = auth.user.can_select_lab && hasRole(['superadmin', 'kadep']);
    const currentKepengurusan = selected_kepengurusan
        || kepengurusan_list.find((item) => item.is_active)
        || {};
    const isReadOnly = Boolean(selected_kepengurusan?.is_read_only);
    const displayLab = canSwitchLab ? selectedLab : (auth.user.laboratory || selectedLab);

    useEffect(() => {
        if (!hasRole(['superadmin', 'kadep'])) {
            const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
            const userLab = laboratorium.find((lab) => lab.id === labId);
            if (userLab) setSelectedLab(userLab);
        } else if (!selectedLab && laboratorium.length > 0) {
            const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
            setSelectedLab(laboratorium.find((lab) => lab.id === labId) || laboratorium[0]);
        }
    }, [auth.user.access_lab_id, auth.user.laboratory, laboratorium]);

    useEffect(() => {
        const closeMenus = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setLabMenuOpen(false);
                setKepengurusanMenuOpen(false);
                setUserMenuOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setLabMenuOpen(false);
                setKepengurusanMenuOpen(false);
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', closeMenus);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeMenus);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    const closeOtherMenus = (menu) => {
        setLabMenuOpen(menu === 'lab' ? !labMenuOpen : false);
        setKepengurusanMenuOpen(menu === 'period' ? !kepengurusanMenuOpen : false);
        setUserMenuOpen(menu === 'user' ? !userMenuOpen : false);
    };

    const handleLabSelect = (lab) => {
        if (!canSwitchLab) return;
        setSelectedLab(lab);
        setLabMenuOpen(false);

        const currentRoute = route().current();
        let targetRoute = 'dashboard';
        if (currentRoute?.startsWith('praktikum.')) targetRoute = 'praktikum.index';
        else if (currentRoute?.startsWith('kegiatan.')) targetRoute = 'kegiatan.index';
        else if (currentRoute?.startsWith('inventaris.')) targetRoute = 'inventaris.index';
        else if (currentRoute?.startsWith('kepengurusan.')) targetRoute = 'kepengurusan-lab.index';

        try {
            router.visit(route(targetRoute), {
                data: { lab_id: lab.id },
                preserveScroll: true,
            });
        } catch {
            router.visit(route('dashboard'), { data: { lab_id: lab.id } });
        }
    };

    const handleKepengurusanSelect = (item) => {
        setKepengurusanMenuOpen(false);
        setSelectedKepengurusanLabId(item.id);
        const url = new URL(window.location.href);
        url.searchParams.set('kepengurusan_lab_id', item.id);
        url.searchParams.delete('lab_id');
        url.searchParams.delete('tahun_id');
        router.visit(`${url.pathname}?${url.searchParams.toString()}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <header ref={navRef} className="sticky top-0 z-30 h-16 border-b border-base-content/10 bg-base-100">
            <div className="navbar mx-auto h-16 min-h-0 max-w-[1600px] flex-nowrap gap-2 px-3 sm:px-6 lg:px-8">
                <div className="navbar-start min-w-0 flex-1 gap-2">
                    <button
                        type="button"
                        onClick={onMobileMenuClick}
                        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11 shrink-0 lg:hidden"
                        aria-label="Buka menu navigasi"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>

                    <div className="dropdown min-w-0">
                        {canSwitchLab ? (
                            <button
                                type="button"
                                className="btn btn-ghost min-h-11 min-w-0 max-w-[11rem] flex-nowrap justify-start gap-2 px-2 sm:max-w-xs sm:px-3"
                                onClick={() => closeOtherMenus('lab')}
                                aria-expanded={labMenuOpen}
                            >
                                <LabLogo lab={selectedLab} />
                                <span className="truncate text-sm font-medium">
                                    {selectedLab?.nama || 'Pilih laboratorium'}
                                </span>
                                <ChevronDown size={16} className="shrink-0" aria-hidden="true" />
                            </button>
                        ) : displayLab ? (
                            <div className="flex min-h-11 min-w-0 max-w-[11rem] items-center gap-2 px-2 sm:max-w-xs sm:px-3">
                                <LabLogo lab={displayLab} />
                                <span className="truncate text-sm font-medium">{displayLab.nama}</span>
                            </div>
                        ) : null}

                        {labMenuOpen && (
                            <ul className="menu dropdown-content left-0 z-50 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-box border border-base-content/10 bg-base-100 p-2 shadow-xl">
                                <li className="menu-title px-3 py-2">Pilih laboratorium</li>
                                {laboratorium.map((lab) => (
                                    <li key={lab.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleLabSelect(lab)}
                                            className={`min-h-11 gap-3 ${selectedLab?.id === lab.id ? 'bg-primary text-primary-content hover:bg-primary hover:text-primary-content' : ''}`}
                                        >
                                            <LabLogo lab={lab} />
                                            <span className="truncate">{lab.nama}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {kepengurusan_list.length > 0 && (
                        <div className="dropdown hidden min-w-0 sm:block">
                            <button
                                type="button"
                                className={`btn min-h-11 min-w-0 max-w-56 flex-nowrap gap-2 px-3 ${isReadOnly ? 'btn-warning btn-outline' : 'btn-ghost'}`}
                                onClick={() => closeOtherMenus('period')}
                                aria-expanded={kepengurusanMenuOpen}
                            >
                                <span className="truncate text-sm">{currentKepengurusan.label || 'Pilih periode'}</span>
                                {isReadOnly && <span className="badge badge-warning badge-sm hidden lg:inline-flex">Arsip</span>}
                                <ChevronDown size={16} className="shrink-0" aria-hidden="true" />
                            </button>

                            {kepengurusanMenuOpen && (
                                <ul className="menu dropdown-content left-0 z-50 mt-2 w-64 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-xl">
                                    <li className="menu-title px-3 py-2">Periode kepengurusan</li>
                                    {kepengurusan_list.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleKepengurusanSelect(item)}
                                                className={currentKepengurusan.id === item.id ? 'bg-primary text-primary-content hover:bg-primary hover:text-primary-content' : ''}
                                            >
                                                <span className="flex-1 truncate">{item.label}</span>
                                                {item.is_active === 1 && <span className="badge badge-success badge-sm">Aktif</span>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="navbar-end w-auto shrink-0 gap-1">
                    <AccessibilityMenu />
                    <NotifBell />

                    <div className="dropdown dropdown-end">
                        <button
                            type="button"
                            className="btn btn-ghost min-h-11 flex-nowrap gap-2 px-1.5 sm:px-2"
                            onClick={() => closeOtherMenus('user')}
                            aria-expanded={userMenuOpen}
                        >
                            <div className="avatar placeholder">
                                {auth.user.profile?.foto_profile ? (
                                    <div className="w-8 rounded-full">
                                        <img src={auth.user.profile.foto_profile} alt="Foto profil" />
                                    </div>
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-content">
                                        <CircleUserRound size={20} aria-hidden="true" />
                                    </div>
                                )}
                            </div>
                            <div className="hidden max-w-44 text-left md:block">
                                <p className="truncate text-xs font-semibold leading-tight">{auth.user.name}</p>
                                <p className="truncate text-[11px] text-base-content/60">{auth.user.email}</p>
                            </div>
                            <ChevronDown size={16} className="hidden shrink-0 md:block" aria-hidden="true" />
                        </button>

                        {userMenuOpen && (
                            <ul className="menu dropdown-content right-0 z-50 mt-2 w-64 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-xl">
                                <li className="menu-title border-b border-base-content/10 px-3 py-3">
                                    <span className="truncate text-sm text-base-content">{auth.user.name}</span>
                                    <span className="truncate text-xs font-normal text-base-content/60">{auth.user.email}</span>
                                </li>
                                <li className="mt-1">
                                    <Link href={route('profile.edit')} className="min-h-11 gap-3">
                                        <CircleUserRound size={18} aria-hidden="true" /> Profil
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('about')} className="min-h-11 gap-3">
                                        <Info size={18} aria-hidden="true" /> Tentang aplikasi
                                    </Link>
                                </li>
                                <li className="mt-1 border-t border-base-content/10 pt-1">
                                    <Link href={route('logout')} method="post" as="button" className="min-h-11 gap-3 text-error hover:bg-error/10">
                                        <LogOut size={18} aria-hidden="true" /> Keluar
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
