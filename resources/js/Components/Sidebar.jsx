import {
    GraduationCap,
    LogOut,
    Banknote,
    Menu,
    BookOpen,
    CalendarDays,
    ChartBar,
    ChevronRight,
    ClipboardList,
    Cog,
    FileText,
    Info,
    Users,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useMemo } from "react";
import { useLab } from "./LabContext";
import { usePermission } from "./PermissionContext";
import SidebarMenuItem from "./SidebarMenuItem";

const Sidebar = ({
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
}) => {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const { can } = usePermission();

    // Get lab context for query params - now includes kepengurusan_lab_id
    const labContext = useLab();
    const selectedLab = labContext?.selectedLab;
    const selectedKepengurusanLabId = labContext?.selectedKepengurusanLabId;

    // Get kepengurusan_lab_id from context or localStorage
    const getKepengurusanLabId = () => {
        if (selectedKepengurusanLabId) {
            return selectedKepengurusanLabId;
        }
        if (typeof localStorage !== "undefined") {
            return localStorage.getItem("selectedKepengurusanLabId") || "";
        }
        return "";
    };

    const buildUrlWithParams = (baseUrl, needsKepengurusanLabId = false) => {
        if (!needsKepengurusanLabId) return baseUrl;

        const kepLabId = getKepengurusanLabId();
        if (kepLabId) {
            return `${baseUrl}?kepengurusan_lab_id=${kepLabId}`;
        }
        if (selectedLab?.id) {
            return `${baseUrl}?lab_id=${selectedLab.id}`;
        }
        return baseUrl;
    };

    const hasRole = (roles) => {
        if (!user || !user.roles) return false;
        if (user.roles.includes("superadmin")) return true;
        return user.roles.some((role) => roles.includes(role));
    };

    const allMenuItems = useMemo(
        () => [
            {
                icon: <ChartBar className="w-5 h-5" />,
                label: "Dashboard",
                href: buildUrlWithParams("/dashboard", true),
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            },
            {
                icon: <ClipboardList className="w-5 h-5" />,
                label: "Praktikum Saya",
                href: "",
                roles: ["praktikan"],
                excludeSuperadmin: true,
                submenu: [
                    { label: "Daftar Tugas", href: "/praktikan/daftar-tugas", roles: ["praktikan"] },
                    { label: "Riwayat Tugas", href: "/praktikan/riwayat-tugas", roles: ["praktikan"] },
                    { label: "Modul Praktikum", href: "/praktikan/modul", roles: ["praktikan"] },
                ],
            },
            {
                icon: <Users className="w-5 h-5" />,
                label: "Kepengurusan",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    { label: "Periode Kepengurusan", href: buildUrlWithParams("/kepengurusan-lab", true), roles: ["kadep", "admin", "kalab", "dosen", "asisten"] },
                    { label: "Program Kerja", href: buildUrlWithParams("/proker", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                    { label: "Anggota", href: buildUrlWithParams("/anggota", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                ],
            },
            {
                icon: <ClipboardList className="w-5 h-5" />,
                label: "Kegiatan",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                href: buildUrlWithParams("/kegiatan", true),
            },
            {
                icon: <FileText className="w-5 h-5" />,
                label: "Kuesioner",
                href: "/kuesioner",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab", "praktikan"],
                permission: "survey.view",
            },
            {
                icon: <Banknote className="w-5 h-5" />,
                label: "Keuangan",
                href: "",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    { label: "Riwayat Keuangan", href: buildUrlWithParams("/riwayat-keuangan", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                    { label: "Catatan Kas", href: buildUrlWithParams("/catatan-kas", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                    { label: "Rekap Bulanan", href: buildUrlWithParams("/rekap-keuangan", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                ],
            },
            {
                icon: <CalendarDays className="w-5 h-5" />,
                label: "Piket",
                href: "",
                roles: ["kadep", "admin", "asisten", "kalab", "dosen"],
                submenu: [
                    { label: "Periode Piket", href: buildUrlWithParams("/piket/periode-piket", true), roles: ["kadep", "admin", "kalab", "dosen"] },
                    { label: "Jadwal Piket", href: buildUrlWithParams("/piket/jadwal", true), roles: ["kadep", "admin", "asisten", "kalab", "dosen"] },
                    { label: "Ambil Absen", href: buildUrlWithParams("/piket/absensi", true), roles: ["asisten"] },
                    { label: "Ganti Jadwal", href: buildUrlWithParams("/piket/ganti-jadwal", true), roles: ["asisten"] },
                    { label: "Approve Ganti Jadwal", href: buildUrlWithParams("/piket/ganti-jadwal/admin", true), roles: ["admin", "kalab"] },
                    { label: "Riwayat Absen", href: buildUrlWithParams("/piket/absensi/riwayat", true), roles: ["kadep", "admin", "asisten", "kalab", "dosen"] },
                    { label: "Rekap Absen", href: buildUrlWithParams("/piket/rekap-absen", true), roles: ["kadep", "admin", "kalab", "dosen"] },
                ],
            },
            {
                icon: <BookOpen className="w-5 h-5" />,
                label: "Praktikum",
                href: buildUrlWithParams("/praktikum", true),
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            },
            {
                icon: <GraduationCap className="w-5 h-5" />,
                label: "Sertifikat",
                href: "/sertifikat",
                roles: ["kadep", "admin"],
            },
            {
                icon: <GraduationCap className="w-5 h-5" />,
                label: "Sertifikat Saya",
                href: "/sertifikat-saya",
                roles: ["praktikan", "asisten", "dosen", "kalab"],
            },
            {
                icon: <ClipboardList className="w-5 h-5" />,
                label: "Inventaris",
                href: "",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    { label: "Daftar Aset", href: buildUrlWithParams("/inventaris", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                    { label: "Permohonan Aset", href: buildUrlWithParams("/inventaris/permohonan", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                    { label: "Peminjaman Aset", href: buildUrlWithParams("/inventaris/peminjaman", true), roles: ["kadep", "admin", "asisten", "dosen", "kalab"] },
                ],
            },
            {
                icon: <Cog className="w-5 h-5" />,
                label: "Data Master",
                roles: ["kadep", "superadmin"],
                submenu: [
                    { label: "Struktur Jabatan", href: "/data-master/struktur", roles: ["kadep", "superadmin"] },
                    { label: "Mata Kuliah", href: "/data-master/mata-kuliah", roles: ["kadep", "superadmin"] },
                    { label: "Tahun Kepengurusan", href: "/tahun-kepengurusan", roles: ["kadep", "superadmin"] },
                    { label: "Data Laboratorium", href: "/laboratorium", roles: ["kadep", "superadmin"] },
                    { label: "Kategori Aset", href: "/data-master/kategori-aset", roles: ["superadmin"] },
                    { label: "Role & Permissions", href: "/admin/roles-permissions", roles: ["superadmin"] },
                    { label: "Struktur Permissions", href: "/struktur-permissions", roles: ["superadmin"] },
                ],
            },
            {
                icon: <Users className="w-5 h-5" />,
                label: "User Management",
                href: "/user-management",
                roles: ["kadep", "admin"],
            },
        ],
        [selectedKepengurusanLabId, selectedLab],
    );

    const menuItems = allMenuItems.filter((item) => {
        if (item.excludeSuperadmin && user?.roles?.includes("superadmin")) {
            return false;
        }
        if (!hasRole(item.roles)) return false;
        if (item.permission && !can(item.permission)) return false;
        if (item.submenu) {
            item.submenu = item.submenu.filter((subItem) => {
                if (subItem.roles && !hasRole(subItem.roles)) return false;
                if (subItem.permission && !can(subItem.permission)) return false;
                return true;
            });
            return item.submenu.length > 0;
        }
        return true;
    });

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden shrink-0 border-r border-base-content/10 bg-base-100 transition-[width] duration-300 lg:block ${
                    isCollapsed ? "w-20" : "w-64"
                }`}
            >
                <div className="sticky top-0 h-screen overflow-hidden">
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="flex h-16 items-center justify-between border-b border-base-content/10 px-3">
                    <div className="flex min-w-0 items-center">
                        <img
                            src="/images/silab.png"
                            alt="Logo SILAB"
                            className={`h-9 w-auto transition-all duration-300 ${
                                isCollapsed
                                    ? "opacity-0 w-0 overflow-hidden"
                                    : "opacity-100"
                            }`}
                        />
                        <h1
                            className={`font-bold ml-2 text-2xl transition-all duration-300 ${
                                isCollapsed
                                    ? "opacity-0 w-0 overflow-hidden"
                                    : "opacity-100"
                            }`}
                        >
                            SILAB
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        type="button"
                        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                        aria-label={
                            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                        }
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-64px)] justify-between">
                    <nav className="menu menu-sm flex-nowrap gap-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                        {menuItems.map((item, index) => (
                            <SidebarMenuItem
                                key={index}
                                {...item}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </nav>

                    <div className="px-2 mb-4">
                        <div className="border-t border-base-content/10 pt-4 mt-4">
                            <SidebarMenuItem
                                icon={<Info className="w-5 h-5" />}
                                label="Tentang Aplikasi"
                                href="/about"
                                isCollapsed={isCollapsed}
                            />
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
                            >
                                <LogOut className="w-5 h-5" />
                                <span
                                    className={`ml-3 transition-all duration-200 truncate ${
                                        isCollapsed
                                            ? "opacity-0 w-0 overflow-hidden"
                                            : "opacity-100"
                                    }`}
                                >
                                    Logout
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform border-r border-base-content/10 bg-base-100 shadow-2xl transition-transform duration-300 lg:hidden ${
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-base-content/10 px-3">
                    <div className="flex items-center">
                        <img
                            src="/images/silab.png"
                            alt="Logo SILAB"
                            className="h-8 w-auto mr-2"
                        />
                        <h1 className="font-bold text-2xl">SILAB</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        type="button"
                        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                        aria-label="Close sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-64px)] justify-between">
                    <nav className="menu menu-sm flex-nowrap gap-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                        {menuItems.map((item, index) => (
                            <SidebarMenuItem
                                key={index}
                                {...item}
                                isCollapsed={false}
                                onItemClick={() => setIsMobileOpen(false)}
                            />
                        ))}
                    </nav>

                    <div className="px-2 mb-4">
                        <div className="border-t border-base-content/10 pt-4 mt-4">
                            <SidebarMenuItem
                                icon={<Info className="w-5 h-5" />}
                                label="Tentang Aplikasi"
                                href="/about"
                                isCollapsed={false}
                                onItemClick={() => setIsMobileOpen(false)}
                            />
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="ml-3">Logout</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
