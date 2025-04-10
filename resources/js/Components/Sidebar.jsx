import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  Square3Stack3DIcon,
  UsersIcon,
  BookOpenIcon,
  ChevronRightIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import SidebarMenuItem from './SidebarMenuItem';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { url } = usePage();
  const user = usePage().props.auth.user;
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Helper function to check if user has any of the specified roles
  const hasRole = (roles) => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => roles.includes(role));
  };
  
  // Fetch unread count when component mounts
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/surat/count-unread');
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Set up polling to periodically check for new unread messages
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Add an event listener to refresh the unread count when needed
  useEffect(() => {
    // Function to refresh unread count
    const refreshUnreadCount = async () => {
      try {
        const response = await fetch('/surat/count-unread');
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Error refreshing unread count:', error);
      }
    };
    
    // Listen for custom event when a letter is read
    window.addEventListener('letterRead', refreshUnreadCount);
    
    return () => {
      window.removeEventListener('letterRead', refreshUnreadCount);
    };
  }, []);

  // Define menu items with role requirements
  const allMenuItems = [
    { 
      icon: <ChartBarIcon className="w-5 h-5" />, 
      label: 'Dashboard', 
      href: '/dashboard',
      roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'] // All roles can access dashboard
    },
    { 
      icon: <UsersIcon className="w-5 h-5" />, 
      label: 'Kepengurusan', 
      roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'],
      submenu: [
        { label: 'Tahun Kepengurusan', href: '/tahun-kepengurusan', roles: ['superadmin'] },
        { label: 'Periode Kepengurusan', href: '/kepengurusan-lab', roles: ['superadmin', 'kadep', 'admin', 'dosen', 'asisten'] },
        { label: 'Struktur', href: '/struktur', roles: ['superadmin', 'kadep', 'admin', 'asisten' ,'dosen'] },
        { label: 'Anggota', href: '/anggota', roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'] },
      ] 
    },
    { 
      icon: <BanknotesIcon className="w-5 h-5" />, 
      label: 'Keuangan', 
      href: '',
      roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'],
      submenu: [
        { label: 'Riwayat Keuangan', href: '/riwayat-keuangan', roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'] },
        { label: 'Catatan Kas', href: '/catatan-kas', roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'] },
        { label: 'Rekap Bulanan', href: '/rekap-keuangan', roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen'] }
      ] 
    },
    {
      icon: <EnvelopeIcon className="w-5 h-5" />,
      label: 'Surat',
      href: '',
      badge: unreadCount > 0 ? unreadCount : null,
      roles: [ 'kadep', 'asisten', 'dosen'],
      submenu: [
        {label: 'Kirim Surat', href: '/surat/kirim', roles: [ 'kadep', 'asisten', 'dosen']},
        {label: 'Surat Masuk', href: '/surat/masuk', badge: unreadCount > 0 ? unreadCount : null, roles: [ 'kadep', 'asisten', 'dosen']},
        {label: 'Surat Keluar', href: '/surat/keluar', roles: ['kadep', 'asisten', 'dosen']},
      ]
    },
    { 
      icon: <CalendarDaysIcon className="w-5 h-5" />, 
      label: 'Piket', 
      href: '',
      roles: ['superadmin', 'kadep', 'admin', 'asisten'],
      submenu: [
        { label: 'Periode Piket', href: '/piket/periode-piket', roles: ['superadmin', 'kadep', 'admin'] },
        { label: 'Jadwal Piket', href: '/piket/jadwal', roles: ['superadmin', 'kadep', 'admin', 'asisten'] },
        { label: 'Ambil Absen', href: '/piket/absensi', roles: ['asisten'] },
        { label: 'Riwayat Absen', href: '/piket/absensi/riwayat', roles: ['superadmin', 'kadep', 'admin', 'asisten'] },
        { label: 'Rekap Absen', href: '/piket/rekap-absen', roles: ['superadmin', 'kadep', 'admin'] },
      ] 
    },
    { 
      icon: <BookOpenIcon className="w-5 h-5" />, 
      label: 'Praktikum', 
      href: '/praktikum',
      roles: ['superadmin', 'kadep', 'admin', 'asisten', 'praktikan', 'dosen']
    },
    { 
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />, 
      label: 'Inventaris', 
      href: '/inventaris',
      roles: ['superadmin', 'kadep', 'admin', 'asisten', 'dosen']
    },
    // Add this to your allMenuItems array in the Sidebar.jsx file
    {
      icon: <UsersIcon className="w-5 h-5" />,
      label: 'Admin Management',
      href: '/admin-management',
      roles: ['superadmin'] // Only superadmin can access this
    }
  ];

  // Filter menu items based on user roles
  const menuItems = allMenuItems.filter(item => {
    // Check if user has any of the required roles for this menu item
    if (!hasRole(item.roles)) return false;
    
    // For items with submenu, filter the submenu items as well
    if (item.submenu) {
      item.submenu = item.submenu.filter(subItem => 
        !subItem.roles || hasRole(subItem.roles)
      );
      
      // Only include menu items that have at least one accessible submenu item
      return item.submenu.length > 0;
    }
    
    return true;
  });

  return (
    <div 
      className={`bg-white h-screen fixed left-0 top-0 border-r transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } z-40 shadow-md`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
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
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg group transition-all duration-200 ease-in-out"
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