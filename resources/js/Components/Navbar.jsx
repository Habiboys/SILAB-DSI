import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  ChevronDownIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useLab } from './LabContext'; // Import the context hook

const Navbar = ({ isCollapsed }) => {
  const { laboratorium } = usePage().props;
  const user = usePage().props.auth.user;
  const [labMenuOpen, setLabMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const labDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Use the lab context
  const { selectedLab, selectLab } = useLab();

  const userMenuItems = [
    { label: "My Profile", icon: <UserCircleIcon className="w-5 h-5 mr-3" />, href: "/profile" },
    { label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5 mr-3" />, href: "/settings" },
    { label: "Sign out", icon: <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />, href: "/logout", method: "post", isRed: true }
  ];

  // Automatically select the first lab if no lab is selected
  useEffect(() => {
    if (laboratorium.length > 0 && !selectedLab) {
      selectLab(laboratorium[0]);
    }
  }, [laboratorium, selectedLab, selectLab]);

  const handleLabSelect = (lab) => {
    selectLab(lab);
    setLabMenuOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (labDropdownRef.current && !labDropdownRef.current.contains(event.target)) {
        setLabMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`fixed top-0 bg-white border-b transition-all duration-300 z-30 ${
      isCollapsed ? 'left-20' : 'left-64'
    } right-0 h-16 shadow-sm`}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="relative" ref={labDropdownRef}>
            <button 
              className="flex items-center space-x-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setLabMenuOpen(!labMenuOpen)}
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              <span className="hidden sm:inline-block">
                {selectedLab ? selectedLab.nama : "Loading Lab..."}
              </span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            
            {labMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white border rounded-lg shadow-lg py-1 z-50">
                {laboratorium.map((option) => (
                  <a
                    key={option.id}
                    href="#"
                    onClick={() => handleLabSelect(option)}
                    className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 w-full ${
                      selectedLab && selectedLab.id === option.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                      {option.nama}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          
          {/* User Menu Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button 
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 px-2 py-1"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-1 z-50">
                <div className="p-4 border-b">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
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