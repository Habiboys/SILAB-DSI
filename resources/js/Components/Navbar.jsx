import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    ChevronDownIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useLab } from './LabContext';

const Navbar = ({ isCollapsed }) => {
    const { auth, laboratorium } = usePage().props;
    const { laboratories, selectedLab, setSelectedLab, canSelectLab } = useLab();

    // Check if user has specific role
    const hasRole = (roles) => {
        return auth.user.roles.some(role => roles.includes(role));
    };

    // Single declaration of state and refs
    const [labMenuOpen, setLabMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const labDropdownRef = useRef(null);
    const userDropdownRef = useRef(null);

    // Single useEffect for lab selection with proper lab enforcement
    useEffect(() => {
        if (!hasRole(['superadmin', 'kadep'])) {
            // For regular users, strictly enforce their assigned lab
            const userLab = laboratorium?.find(lab => lab.id === auth.user.laboratory_id);
            if (userLab) {
                setSelectedLab(userLab);
            }
        } else if (!selectedLab && laboratorium?.length > 0) {
            // For admin users, set their assigned lab if available, otherwise first lab
            const userLab = laboratorium.find(lab => lab.id === auth.user.laboratory_id);
            setSelectedLab(userLab || laboratorium[0]);
        }
    }, [auth.user.laboratory_id, laboratorium]);

    // Remove all other useEffects related to lab selection
    
    const handleLabSelect = (lab) => {
        if (hasRole(['superadmin', 'kadep'])) {
            setSelectedLab(lab);
            setLabMenuOpen(false);
        } else if (lab.id === auth.user.laboratory_id) {
            setSelectedLab(lab);
            setLabMenuOpen(false);
        }
    };

    // Remove other duplicate useEffects
    // Update userMenuItems to remove settings
    const userMenuItems = [
        {
            label: 'Profile',
            icon: <UserCircleIcon className="w-5 h-5 mr-2" />,
            href: route('profile.edit'),
        },
        {
            label: 'Logout',
            icon: <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />,
            href: route('logout'),
            method: 'post',
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
        <div className={`fixed top-0 bg-white border-b transition-all duration-300 z-30 ${
            isCollapsed ? 'left-20' : 'left-64'
        } right-0 h-16 shadow-sm`}>
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    <div className="relative" ref={labDropdownRef}>
                        {auth.user.can_select_lab && hasRole(['superadmin', 'kadep']) && (
                            <>
                                <button 
                                    className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                    onClick={() => setLabMenuOpen(!labMenuOpen)}
                                >
                                    <BuildingOfficeIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline-block">
                                        {selectedLab ? selectedLab.nama : "Pilih Laboratorium"}
                                    </span>
                                    <ChevronDownIcon className="w-4 h-4" />
                                </button>

                                {labMenuOpen && laboratorium?.length > 0 && (
                                    <div className="absolute left-0 mt-2 w-72 bg-white border rounded-lg shadow-lg py-1 z-50">
                                        {laboratorium.map((lab) => (
                                            <button
                                                key={lab.id}
                                                onClick={() => handleLabSelect(lab)}
                                                className={`flex items-center px-4 py-3 text-sm hover:bg-gray-50 w-full ${
                                                    selectedLab?.id === lab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                }`}
                                            >
                                                <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />
                                                {lab.nama}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {(!auth.user.can_select_lab || !hasRole(['superadmin', 'kadep'])) && selectedLab && (
                            <div className="flex items-center space-x-2 text-gray-700 px-3 py-2">
                                <BuildingOfficeIcon className="w-5 h-5" />
                                <span className="hidden sm:inline-block">
                                    {selectedLab.nama}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                    
                    <div className="relative" ref={userDropdownRef}>
                        <button 
                            className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 px-2 py-1"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">{auth.user.name}</p>
                                <p className="text-xs text-gray-500">{auth.user.email}</p>
                            </div>
                            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
                                <div className="p-4 border-b">
                                    <p className="font-medium">{auth.user.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">{auth.user.email}</p>
                                </div>
                                {userMenuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        method={item.method || "get"}
                                        as="button"
                                        className={`flex items-center px-4 py-3 text-sm ${item.isRed ? 'text-red-600 hover:text-red-700' : 'text-gray-700'} hover:bg-gray-50 w-full`}
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