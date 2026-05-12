import {
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    BuildingOfficeIcon,
    ChevronDownIcon,
    InformationCircleIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { useLab } from "./LabContext";
import NotifBell from "./NotifBell";

const Navbar = ({ isCollapsed, onMobileMenuClick }) => {
    const { auth, laboratorium, kepengurusan_list, selected_kepengurusan } =
        usePage().props;
    const {
        laboratories,
        selectedLab,
        setSelectedLab,
        canSelectLab,
        setSelectedKepengurusanLabId,
    } = useLab();
    // Helper to check if current dropdown item is selected
    const currentKepengurusan =
        selected_kepengurusan ||
        (kepengurusan_list && kepengurusan_list.find((k) => k.is_active)) ||
        {};
    const is_read_only = selected_kepengurusan?.is_read_only;

    // Check if user has specific role
    const hasRole = (roles) => {
        return auth.user.roles.some((role) => roles.includes(role));
    };

    // Single declaration of state and refs
    const [labMenuOpen, setLabMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [kepengurusanMenuOpen, setKepengurusanMenuOpen] = useState(false); // NEW
    const labDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);
    const kepengurusanDropdownRef = useRef(null); // NEW

    // Single useEffect for lab selection with proper lab enforcement
    useEffect(() => {
        if (!hasRole(["superadmin", "kadep"])) {
            // For regular users, strictly enforce their assigned lab
            const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
            const userLab = laboratorium?.find((lab) => lab.id === labId);
            if (userLab) {
                setSelectedLab(userLab);
            }
        } else if (!selectedLab && laboratorium?.length > 0) {
            // For admin users, set their assigned lab if available, otherwise first lab
            const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
            const userLab = laboratorium.find((lab) => lab.id === labId);
            const labToSet = userLab || laboratorium[0];
            setSelectedLab(labToSet);
        }
    }, [auth.user.access_lab_id, auth.user.laboratory, laboratorium]);

    // Preload lab logos so dropdown is instant
    useEffect(() => {
        if (!laboratorium?.length) return;
        laboratorium.forEach((lab) => {
            if (lab?.logo) {
                const img = new Image();
                img.src = `/storage/${lab.logo}`;
            }
        });
    }, [laboratorium]);

    // Remove all other useEffects related to lab selection

    const handleLabSelect = (lab) => {
        if (hasRole(["superadmin", "kadep"])) {
            setSelectedLab(lab);
            setLabMenuOpen(false);

            // Smart Navigation Logic
            const currentRoute = route().current();
            let targetRoute = "dashboard";

            // Determine target based on current module
            if (currentRoute) {
                if (currentRoute.startsWith("praktikum.")) {
                    targetRoute = "praktikum.index";
                } else if (currentRoute.startsWith("kegiatan.")) {
                    targetRoute = "kegiatan.index"; // Assuming route exists
                } else if (currentRoute.startsWith("surat.")) {
                    targetRoute = "surat.index"; // needs verification if this exists, or fallback
                } else if (currentRoute.startsWith("inventaris.")) {
                    targetRoute = "inventaris.index";
                } else if (currentRoute.startsWith("kepengurusan.")) {
                    targetRoute = "kepengurusan-lab.index"; // Verify route name
                } else if (currentRoute === "dashboard") {
                    targetRoute = "dashboard";
                }
            }

            // Check if route exists to avoid errors (simplified check)
            try {
                // Navigate with new lab_id
                router.visit(route(targetRoute), {
                    data: { lab_id: lab.id },
                    preserveScroll: true,
                });
            } catch (e) {
                // Fallback to dashboard if route resolution fails
                router.visit(route("dashboard"), {
                    data: { lab_id: lab.id },
                });
            }
        } else if (
            lab.id === (auth.user.access_lab_id || auth.user.laboratory?.id)
        ) {
            setSelectedLab(lab);
            setLabMenuOpen(false);
        }
    };

    const handleKepengurusanSelect = (item) => {
        setKepengurusanMenuOpen(false);
        // Sync to LabContext so Sidebar buildUrlWithParams picks it up immediately
        setSelectedKepengurusanLabId(item.id);
        // Reload page with new kepengurusan_lab_id param.
        // Drop redundant legacy params (lab_id/tahun_id) but keep other query params (search, page, etc.).
        const url = new URL(window.location.href);
        url.searchParams.set("kepengurusan_lab_id", item.id);
        url.searchParams.delete("lab_id");
        url.searchParams.delete("tahun_id");

        const qs = url.searchParams.toString();
        router.visit(`${url.pathname}${qs ? `?${qs}` : ""}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Remove other duplicate useEffects
    // Update userMenuItems to remove settings
    const userMenuItems = [
        {
            label: "Profile",
            icon: <UserCircleIcon className="w-5 h-5 mr-2" />,
            href: route("profile.edit"),
        },
        {
            label: "Tentang Aplikasi",
            icon: <InformationCircleIcon className="w-5 h-5 mr-2" />,
            href: route("about"),
        },
        {
            label: "Logout",
            icon: <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />,
            href: route("logout"),
            method: "post",
            isRed: true,
        },
    ];

    // Remove these duplicate useEffects
    // useEffect(() => {
    //     if (laboratorium?.length > 0 && !selectedLab) {
    //         setSelectedLab(laboratorium[0]);
    //     }
    // }, [laboratorium]);

    // useEffect(() => {
    //     if (!selectedLab) {
    //         if (hasRole(['superadmin', 'kadep'])) {
    //             if (laboratorium?.length > 0) {
    //                 setSelectedLab(laboratorium[0]);
    //             }
    //         } else {
    //             const userLab = laboratorium?.find(lab => lab.id === auth.user.laboratory_id);
    //             if (userLab) {
    //                 setSelectedLab(userLab);
    //             }
    //         }
    //     }, [laboratorium]);
    // });

    return (
        <div
            className={`fixed top-0 bg-white border-b transition-all duration-300 z-30 ${
                isCollapsed ? "lg:left-20" : "lg:left-64"
            } left-0 right-0 h-16 shadow-sm`}
        >
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onMobileMenuClick}
                        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        aria-label="Open sidebar"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="relative" ref={labDropdownRef}>
                        {auth.user.can_select_lab &&
                            hasRole(["superadmin", "kadep"]) && (
                                <>
                                    <button
                                        className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                        onClick={() =>
                                            setLabMenuOpen(!labMenuOpen)
                                        }
                                    >
                                        {selectedLab && selectedLab.logo ? (
                                            <img
                                                src={`/storage/${selectedLab.logo}`}
                                                alt={`Logo ${selectedLab.nama}`}
                                                className="w-5 h-5 object-contain"
                                                width="20"
                                                height="20"
                                                loading="eager"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.target.style.display =
                                                        "none";
                                                    e.target.nextSibling.style.display =
                                                        "block";
                                                }}
                                            />
                                        ) : null}
                                        {(!selectedLab ||
                                            !selectedLab.logo) && (
                                            <BuildingOfficeIcon className="w-5 h-5" />
                                        )}
                                        <span className="hidden sm:inline-block">
                                            {selectedLab
                                                ? selectedLab.nama
                                                : "Pilih Laboratorium"}
                                        </span>
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </button>

                                    {labMenuOpen &&
                                        laboratorium?.length > 0 && (
                                            <div className="absolute left-0 mt-2 w-72 bg-white border rounded-lg shadow-lg py-1 z-50">
                                                {laboratorium.map((lab) => (
                                                    <button
                                                        key={lab.id}
                                                        onClick={() =>
                                                            handleLabSelect(lab)
                                                        }
                                                        className={`flex items-center px-4 py-3 text-sm hover:bg-gray-50 w-full ${
                                                            selectedLab?.id ===
                                                            lab.id
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {lab.logo ? (
                                                            <img
                                                                src={`/storage/${lab.logo}`}
                                                                alt={`Logo ${lab.nama}`}
                                                                className="w-5 h-5 mr-2 object-contain"
                                                                width="20"
                                                                height="20"
                                                                loading="lazy"
                                                                decoding="async"
                                                                fetchpriority="low"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    e.target.style.display =
                                                                        "none";
                                                                    e.target.nextSibling.style.display =
                                                                        "block";
                                                                }}
                                                            />
                                                        ) : null}
                                                        {!lab.logo && (
                                                            <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />
                                                        )}
                                                        {lab.nama}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                </>
                            )}
                        {(!auth.user.can_select_lab ||
                            !hasRole(["superadmin", "kadep"])) &&
                            (auth.user.laboratory || selectedLab) && (
                                <div className="flex items-center space-x-2 text-gray-700 px-3 py-2">
                                    {auth.user.laboratory?.logo ||
                                    selectedLab?.logo ? (
                                        <img
                                            src={`/storage/${auth.user.laboratory?.logo || selectedLab?.logo}`}
                                            alt={`Logo ${auth.user.laboratory?.nama || selectedLab?.nama}`}
                                            className="w-5 h-5 object-contain"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display =
                                                    "block";
                                            }}
                                        />
                                    ) : null}
                                    {!auth.user.laboratory?.logo &&
                                        !selectedLab?.logo && (
                                            <BuildingOfficeIcon className="w-5 h-5" />
                                        )}
                                    <span className="hidden sm:inline-block">
                                        {auth.user.laboratory?.nama ||
                                            selectedLab?.nama}
                                    </span>
                                </div>
                            )}
                    </div>

                    {/* Kepengurusan Dropdown (Visible only if list available) */}
                    {kepengurusan_list && kepengurusan_list.length > 0 && (
                        <div
                            className="relative ml-2 md:ml-4"
                            ref={kepengurusanDropdownRef}
                        >
                            <button
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 border ${
                                    is_read_only
                                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                    setKepengurusanMenuOpen(
                                        !kepengurusanMenuOpen,
                                    )
                                }
                            >
                                <span className="hidden sm:inline-block font-medium text-sm">
                                    {currentKepengurusan?.label ||
                                        "Pilih Periode"}
                                </span>
                                {is_read_only && (
                                    <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded ml-1">
                                        Read Only
                                    </span>
                                )}
                                <ChevronDownIcon className="w-4 h-4 ml-1" />
                            </button>

                            {kepengurusanMenuOpen && (
                                <div className="absolute left-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
                                    {kepengurusan_list.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() =>
                                                handleKepengurusanSelect(item)
                                            }
                                            className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 w-full ${
                                                currentKepengurusan?.id ===
                                                item.id
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                            {item.is_active === 1 && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                                                    Aktif
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                    <NotifBell />

                    <div className="relative" ref={userDropdownRef}>
                        <button
                            className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 px-2 py-1"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            {/* Profile Photo */}
                            <div className="flex-shrink-0">
                                {auth.user.profile?.foto_profile ? (
                                    <img
                                        className="h-8 w-8 rounded-full object-cover"
                                        src={auth.user.profile.foto_profile}
                                        alt="Profile photo"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <UserCircleIcon className="h-5 w-5 text-gray-600" />
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {auth.user.email}
                                </p>
                            </div>
                            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
                                <div className="p-4 border-b">
                                    <div className="flex items-center space-x-3">
                                        {/* Profile Photo in Dropdown */}
                                        <div className="flex-shrink-0">
                                            {auth.user.profile?.foto_profile ? (
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={
                                                        auth.user.profile
                                                            .foto_profile
                                                    }
                                                    alt="Profile photo"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <UserCircleIcon className="h-6 w-6 text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {auth.user.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {auth.user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {userMenuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        method={item.method || "get"}
                                        as="button"
                                        className={`flex items-center px-4 py-3 text-sm ${item.isRed ? "text-red-600 hover:text-red-700" : "text-gray-700"} hover:bg-gray-50 w-full`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
