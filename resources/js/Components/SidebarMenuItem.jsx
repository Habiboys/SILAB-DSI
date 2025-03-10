import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Collapsible from './Collapsible';

const SidebarMenuItem = ({ icon, label, href, isCollapsed, submenu }) => {
  const { url } = usePage();
  const hasSubmenu = submenu && submenu.length > 0;
  const submenuRef = useRef(null);
  
  // Enhanced active state checking with query parameter support
  const isDirectlyActive = href && isUrlMatch(url, href);
  const isSubmenuActive = hasSubmenu && submenu.some(item => isUrlMatch(url, item.href));
  
  // Initialize submenu open state based on whether any submenu item is active
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(isSubmenuActive);
  
  // Fix hover issues with collapsed sidebar tooltip
  const [hoverTimeout, setHoverTimeout] = useState(null);
  
  // Update submenu state when URL changes or when submenu items change
  useEffect(() => {
    if (hasSubmenu) {
      setIsSubmenuOpen(submenu.some(item => isUrlMatch(url, item.href)));
    }
  }, [url, submenu, hasSubmenu]);

  // Close submenu when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setIsSubmenuOpen(false);
    }
  }, [isCollapsed]);
  
  // Enhanced URL matching function to handle query parameters
  function isUrlMatch(currentUrl, matchUrl) {
    if (!currentUrl || !matchUrl) return false;
    
    // Parse URLs
    const currentUrlObj = new URL(currentUrl, 'http://example.com');
    const matchUrlObj = new URL(matchUrl, 'http://example.com');
    
    // Compare paths
    if (currentUrlObj.pathname !== matchUrlObj.pathname) return false;
    
    // For specific pages like 'struktur', match even with different query parameters
    const specificPages = ['/struktur']; // Add more specific pages as needed
    if (specificPages.some(page => currentUrlObj.pathname.endsWith(page))) {
      return true;
    }
    
    return true;
  }

  const handleMouseEnter = () => {
    if (isCollapsed && hasSubmenu) {
      const timeout = setTimeout(() => {
        setIsSubmenuOpen(true);
      }, 200);
      setHoverTimeout(timeout);
    }
  };
  
  const handleMouseLeave = () => {
    if (isCollapsed && hasSubmenu) {
      clearTimeout(hoverTimeout);
      const timeout = setTimeout(() => {
        setIsSubmenuOpen(false);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  return (
    <div 
      className="relative" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasSubmenu && !isCollapsed ? (
        <Collapsible 
          open={isSubmenuOpen} 
          onOpenChange={setIsSubmenuOpen}
          trigger={
            href ? (
              <Link
                href={href}
                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg group relative transition-all duration-200 ease-in-out ${
                  isDirectlyActive ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                <div className="flex items-center flex-grow min-w-0">
                  <div className="relative flex-shrink-0">
                    {icon}
                  </div>
                  <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    {label}
                  </span>
                </div>
                <ChevronDownIcon 
                  className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isSubmenuOpen ? 'rotate-180' : ''}`} 
                />
              </Link>
            ) : (
              <button
                className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg group relative transition-all duration-200 ease-in-out`}
              >
                <div className="flex items-center flex-grow min-w-0">
                  <div className="relative flex-shrink-0">
                    {icon}
                  </div>
                  <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    {label}
                  </span>
                </div>
                <ChevronDownIcon 
                  className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isSubmenuOpen ? 'rotate-180' : ''}`} 
                />
              </button>
            )
          }
        >
          <div className="mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out">
            {submenu.map((subItem, index) => (
              <Link
                key={index}
                href={subItem.href}
                className={`block py-2 px-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 mx-2 pl-11 ${
                  isUrlMatch(url, subItem.href) ? 'bg-gray-100 font-semibold' : ''
                }`}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </Collapsible>
      ) : (
        <Link
          href={href}
          className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg group relative transition-all duration-200 ease-in-out ${
            isDirectlyActive ? 'bg-gray-100 font-semibold' : ''
          }`}
        >
          <div className="flex items-center flex-grow min-w-0">
            <div className="relative flex-shrink-0">
              {icon}
            </div>
            <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              {label}
            </span>
          </div>
          {/* Removed the ChevronRightIcon for items without submenu */}
        </Link>
      )}
      
      {/* Improved tooltip submenu for collapsed sidebar */}
      {hasSubmenu && isCollapsed && isSubmenuOpen && (
        <div 
          className="absolute left-full top-0 ml-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-40"
          onMouseEnter={() => clearTimeout(hoverTimeout)}
          onMouseLeave={() => setIsSubmenuOpen(false)}
        >
          <div className="py-2 px-4 border-b font-medium text-sm">{label}</div>
          {submenu.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              className={`block py-2 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200 w-full ${
                isUrlMatch(url, subItem.href) ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarMenuItem;