import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  Square3Stack3DIcon,
  UsersIcon,
  BookOpenIcon,
  ChevronRightIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import SidebarMenuItem from './SidebarMenuItem';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { url } = usePage();
  const user = usePage().props.auth.user;

  const menuItems = [
    { 
      icon: <Square3Stack3DIcon className="w-5 h-5" />, 
      label: 'Dashboard', 
      href: '/dashboard', 
    },
    { 
      icon: <UsersIcon className="w-5 h-5" />, 
      label: 'Kepengurusan', 
      submenu: [
        { label: 'Tahun Kepengurusan', href: '/tahun-kepengurusan' },
        { label: 'Struktur', href: '/struktur' },
        { label: 'Anggota', href: '/anggota' },
       
      ] 
    },
    { 
      icon: <ChartBarIcon className="w-5 h-5" />, 
      label: 'Keuangan', 
      href: '', 
      submenu: [
        { label: 'Pemasukan', href: '/finance/income' },
        { label: 'Pengeluaran', href: '/finance/expenses' },
        { label: 'Laporan', href: '/finance/reports' }
      ] 
    },
    { 
      icon: <BookOpenIcon className="w-5 h-5" />, 
      label: 'Praktikum', 
      href: '',
      submenu: [
        { label: 'Jadwal', href: '/practicum/schedule' },
        { label: 'Materi', href: '/practicum/materials' },
        { label: 'Nilai', href: '/practicum/grades' }
      ] 
    },

  ];

  return (
    <div 
      className={`bg-white h-screen fixed left-0 top-0 border-r transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } z-40 shadow-md`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          {/* <div className="text-blue-600 font-bold text-xl w-6 h-6 flex items-center justify-center">
            S
          </div> */}
          <h1 className={`font-bold ml-2 text-2xl transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            SILAB
          </h1>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <Bars3Icon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex flex-col h-[calc(100%-64px)] justify-between">
        <nav className="mt-4 px-2 space-y-1 overflow-y-auto">
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
              icon={<Cog6ToothIcon className="w-5 h-5" />}
              label="Settings"
              href="/settings"
              isCollapsed={isCollapsed}
            />
            <Link
              href="/logout"
              method="post"
              as="button"
              className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg group transition-all duration-200 ease-in-out"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Logout
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;