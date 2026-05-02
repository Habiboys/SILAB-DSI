import {
    AcademicCapIcon,
    ArrowLeftOnRectangleIcon,
    BanknotesIcon,
    Bars3Icon,
    BookOpenIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
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
        // First try from context
        if (selectedKepengurusanLabId) {
            return selectedKepengurusanLabId;
        }
        // Fallback to localStorage
        if (typeof localStorage !== "undefined") {
            return localStorage.getItem("selectedKepengurusanLabId") || "";
        }
        return "";
    };

    // Helper to build URL with kepengurusan_lab_id (simplified from lab_id + tahun_id)
    const buildUrlWithParams = (baseUrl, needsKepengurusanLabId = false) => {
        if (!needsKepengurusanLabId) return baseUrl;

        const kepLabId = getKepengurusanLabId();
        if (kepLabId) {
            const labParam = selectedLab?.id ? `&lab_id=${selectedLab.id}` : "";
            return `${baseUrl}?kepengurusan_lab_id=${kepLabId}${labParam}`;
        }
        // Fallback: if no kepengurusan_lab_id, just use lab_id if available
        if (selectedLab?.id) {
            return `${baseUrl}?lab_id=${selectedLab.id}`;
        }
        return baseUrl;
    };

    // Helper function to check if user has any of the specified roles
    // Superadmin ALWAYS has access to everything
    const hasRole = (roles) => {
        if (!user || !user.roles) return false;

        // Superadmin bypasses all role checks
        if (user.roles.includes("superadmin")) return true;

        return user.roles.some((role) => roles.includes(role));
    };

    // Define menu items with role requirements - use useMemo to recompute when lab/tahun changes
    const allMenuItems = useMemo(
        () => [
            {
                icon: <ChartBarIcon className="w-5 h-5" />,
                label: "Dashboard",
                href: buildUrlWithParams("/dashboard", true),
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"], // All roles can access dashboard
            },

            {
                icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
                label: "Praktikum Saya",
                href: "",
                roles: ["praktikan"],
                excludeSuperadmin: true, // Hide from superadmin
                submenu: [
                    {
                        label: "Daftar Tugas",
                        href: "/praktikan/daftar-tugas",
                        roles: ["praktikan"],
                    },
                    {
                        label: "Riwayat Tugas",
                        href: "/praktikan/riwayat-tugas",
                        roles: ["praktikan"],
                    },
                    {
                        label: "Modul Praktikum",
                        href: "/praktikan/modul",
                        roles: ["praktikan"],
                    },
                ],
            },
            {
                icon: <UsersIcon className="w-5 h-5" />,
                label: "Kepengurusan",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    {
                        label: "Periode Kepengurusan",
                        href: buildUrlWithParams("/kepengurusan-lab", true),
                        roles: ["kadep", "admin", "kalab", "dosen", "asisten"],
                    },
                    {
                        label: "Program Kerja",
                        href: buildUrlWithParams("/proker", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                    {
                        label: "Anggota",
                        href: buildUrlWithParams("/anggota", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                ],
            },
            {
                icon: <ClipboardDocumentListIcon className="w-5 h-5" />, // Use appropriate icon
                label: "Kegiatan",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                href: buildUrlWithParams("/kegiatan", true),
                /* submenu: [
                 {
                     label: "Daftar Kegiatan",
                     href: "/kegiatan",
                     roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                 },
                 {
                     label: "Kalender",
                     href: "/kegiatan/calendar", // Assuming this route exists or we use query param
                     roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                 }
            ] */
                // For now single link
            },
            {
                icon: <DocumentTextIcon className="w-5 h-5" />,
                label: "Kuesioner",
                href: "/kuesioner",
                roles: [
                    "kadep",
                    "admin",
                    "asisten",
                    "dosen",
                    "kalab",
                    "praktikan",
                ], // Everyone can see the menu, controller filters list
                permission: "survey.view",
            },
            {
                icon: <BanknotesIcon className="w-5 h-5" />,
                label: "Keuangan",
                href: "",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    {
                        label: "Riwayat Keuangan",
                        href: buildUrlWithParams("/riwayat-keuangan", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                    {
                        label: "Catatan Kas",
                        href: buildUrlWithParams("/catatan-kas", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                    {
                        label: "Rekap Bulanan",
                        href: buildUrlWithParams("/rekap-keuangan", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                ],
            },
            // {
            //     icon: <EnvelopeIcon className="w-5 h-5" />,
            //     label: "Surat Menyurat",
            //     href: "",
            //     roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            //     submenu: [
            //         {
            //             label: "Surat Keluar",
            //             href: buildUrlWithParams(
            //                 "/surat-menyurat/surat-keluar",
            //                 true,
            //             ),
            //             roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            //             permission: "surat-keluar.viewAny",
            //         },
            //         {
            //             label: "Surat Masuk",
            //             href: buildUrlWithParams(
            //                 "/surat-menyurat/surat-masuk",
            //                 true,
            //             ),
            //             roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            //             permission: "surat-masuk.viewAny",
            //         },
            //         {
            //             label: "Konfigurasi Surat",
            //             href: buildUrlWithParams(
            //                 "/surat-menyurat/konfigurasi",
            //                 true,
            //             ),
            //             roles: ["kadep", "admin", "kalab"],
            //             permission: "konfigurasi-surat.view",
            //         },
            //     ],
            // },
            {
                icon: <CalendarDaysIcon className="w-5 h-5" />,
                label: "Piket",
                href: "",
                roles: ["kadep", "admin", "asisten", "kalab"],
                submenu: [
                    {
                        label: "Periode Piket",
                        href: buildUrlWithParams("/piket/periode-piket", true),
                        roles: ["kadep", "admin", "kalab"],
                    },
                    {
                        label: "Jadwal Piket",
                        href: buildUrlWithParams("/piket/jadwal", true),
                        roles: ["kadep", "admin", "asisten", "kalab"],
                    },
                    {
                        label: "Ambil Absen",
                        href: buildUrlWithParams("/piket/absensi", true),
                        roles: ["asisten"],
                    },
                    {
                        label: "Ganti Jadwal",
                        href: buildUrlWithParams("/piket/ganti-jadwal", true),
                        roles: ["asisten"],
                    },
                    {
                        label: "Approve Ganti Jadwal",
                        href: buildUrlWithParams(
                            "/piket/ganti-jadwal/admin",
                            true,
                        ),
                        roles: ["kadep", "admin", "kalab"],
                    },
                    {
                        label: "Riwayat Absen",
                        href: buildUrlWithParams(
                            "/piket/absensi/riwayat",
                            true,
                        ),
                        roles: ["kadep", "admin", "asisten", "kalab"],
                    },
                    {
                        label: "Rekap Absen",
                        href: buildUrlWithParams("/piket/rekap-absen", true),
                        roles: ["kadep", "admin", "kalab"],
                    },
                ],
            },
            {
                icon: <BookOpenIcon className="w-5 h-5" />,
                label: "Praktikum",
                href: buildUrlWithParams("/praktikum", true),
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
            },
            {
                icon: <AcademicCapIcon className="w-5 h-5" />,
                label: "Sertifikat Saya",
                href: "/sertifikat-saya",
                roles: [
                    "praktikan",
                    "asisten",
                    "kadep",
                    "admin",
                    "dosen",
                    "kalab",
                ],
            },
            {
                icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
                label: "Inventaris",
                href: "",
                roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                submenu: [
                    {
                        label: "Daftar Aset",
                        href: buildUrlWithParams("/inventaris", true),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                    {
                        label: "Permohonan Aset",
                        href: buildUrlWithParams(
                            "/inventaris/permohonan",
                            true,
                        ),
                        roles: ["kadep", "admin", "asisten", "dosen", "kalab"],
                    },
                ],
            },
            // Data Master menu
            {
                icon: <Cog6ToothIcon className="w-5 h-5" />,
                label: "Data Master",
                roles: ["kadep", "superadmin"],
                submenu: [
                    {
                        label: "Struktur Jabatan",
                        href: "/data-master/struktur",
                        roles: ["kadep", "superadmin"],
                    },
                    {
                        label: "Tahun Kepengurusan",
                        href: "/tahun-kepengurusan",
                        roles: ["kadep", "superadmin"],
                    },
                    {
                        label: "Data Laboratorium",
                        href: "/laboratorium",
                        roles: ["kadep", "superadmin"],
                    },
                    {
                        label: "Kategori Aset",
                        href: "/data-master/kategori-aset",
                        roles: ["superadmin"],
                    },
                    {
                        label: "Role & Permissions",
                        href: "/admin/roles-permissions",
                        roles: ["superadmin"],
                    },
                    {
                        label: "Struktur Permissions",
                        href: "/struktur-permissions",
                        roles: ["superadmin"],
                    },
                ],
            },
            // Add this to your allMenuItems array in the Sidebar.jsx file
            {
                icon: <UsersIcon className="w-5 h-5" />,
                label: "User Management",
                href: "/user-management",
                roles: ["kadep"], // Superadmin auto-included via hasRole check
            },
        ],
        [selectedKepengurusanLabId, selectedLab],
    );

    // Filter menu items based on user roles
    const menuItems = allMenuItems.filter((item) => {
        // If item should be hidden from superadmin and user is superadmin, exclude it
        if (item.excludeSuperadmin && user?.roles?.includes("superadmin")) {
            return false;
        }

        // Check if user has any of the required roles for this menu item
        if (!hasRole(item.roles)) return false;

        // Check permission if specified
        if (item.permission && !can(item.permission)) return false;

        // For items with submenu, filter the submenu items as well
        if (item.submenu) {
            item.submenu = item.submenu.filter((subItem) => {
                // Check role for subitem
                if (subItem.roles && !hasRole(subItem.roles)) return false;
                // Check permission for subitem
                if (subItem.permission && !can(subItem.permission))
                    return false;
                return true;
            });

            // Only include menu items that have at least one accessible submenu item
            return item.submenu.length > 0;
        }

        return true;
    });

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={`bg-white h-screen fixed left-0 top-0 border-r transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-20" : "w-64"
                } z-40 shadow-md hidden lg:block`}
            >
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src="/images/silab.png"
                            alt="Logo SILAB"
                            className={`h-8 w-auto transition-all duration-300 ${
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
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        aria-label={
                            isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                        }
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon className="w-5 h-5" />
                        ) : (
                            <Bars3Icon className="w-5 h-5" />
                        )}
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-64px)] justify-between">
                    <nav className="mt-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
                        {menuItems.map((item, index) => (
                            <SidebarMenuItem
                                key={index}
                                {...item}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </nav>

                    <div className="px-2 mb-4">
                        <div className="border-t pt-4 mt-4">
                            <SidebarMenuItem
                                icon={
                                    <InformationCircleIcon className="w-5 h-5" />
                                }
                                label="Tentang Aplikasi"
                                href="/about"
                                isCollapsed={isCollapsed}
                            />
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg group transition-all duration-200 ease-in-out"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
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

            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-4 border-b flex items-center justify-between">
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
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        aria-label="Close sidebar"
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-64px)] justify-between">
                    <nav className="mt-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
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
                        <div className="border-t pt-4 mt-4">
                            <SidebarMenuItem
                                icon={
                                    <InformationCircleIcon className="w-5 h-5" />
                                }
                                label="Tentang Aplikasi"
                                href="/about"
                                isCollapsed={false}
                                onItemClick={() => setIsMobileOpen(false)}
                            />
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg group transition-all duration-200 ease-in-out"
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
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
