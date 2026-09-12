import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Collapsible from './Collapsible';

const SidebarMenuItem = ({ icon, label, href, isCollapsed, submenu, badge = null, onItemClick }) => {
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

  // Badge component for consistent rendering
  const Badge = ({ count }) => {
    if (!count) return null;
    
    return (
      <span className="badge badge-error badge-sm ml-2">
        {count > 99 ? '99+' : count}
      </span>
    );
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
            <button
              type="button"
              className={`flex min-h-11 w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isSubmenuActive ? 'bg-primary/10 text-primary font-semibold' : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
              }`}
              onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
            >
              <div className="flex items-center flex-grow min-w-0">
                <div className="relative flex-shrink-0">
                  {icon}
                  {isCollapsed && badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-xs text-error-content">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                  {label}
                </span>
              </div>
              {!isCollapsed && badge && <Badge count={badge} />}
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2 ${isSubmenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          }
        >
          <div className="mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out">
            {submenu.map((subItem, index) => (
              <Link
                key={index}
                href={subItem.href}
                onClick={onItemClick}
                className={`mx-2 flex min-h-11 items-center justify-between rounded-md py-2 pl-10 pr-3 text-sm transition-colors ${
                  isUrlMatch(url, subItem.href) ? 'bg-primary text-primary-content font-semibold' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
              >
                <span>{subItem.label}</span>
                {subItem.badge && <Badge count={subItem.badge} />}
              </Link>
            ))}
          </div>
        </Collapsible>
      ) : (
        <Link
          href={href}
          onClick={onItemClick}
          className={`flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            isDirectlyActive ? 'bg-primary text-primary-content font-semibold' : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
          }`}
        >
          <div className="flex items-center flex-grow min-w-0">
            <div className="relative flex-shrink-0">
              {icon}
              {isCollapsed && badge && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-xs text-error-content">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className={`ml-3 transition-all duration-200 truncate ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              {label}
            </span>
          </div>
          {!isCollapsed && badge && <Badge count={badge} />}
        </Link>
      )}
      
      {/* Improved tooltip submenu for collapsed sidebar */}
      {hasSubmenu && isCollapsed && isSubmenuOpen && (
        <div 
          className="absolute left-full top-0 z-40 ml-2 w-48 rounded-box border border-base-content/10 bg-base-100 py-2 shadow-xl"
          onMouseEnter={() => clearTimeout(hoverTimeout)}
          onMouseLeave={() => setIsSubmenuOpen(false)}
        >
          <div className="flex justify-between border-b border-base-content/10 px-4 py-2 text-sm font-medium">
            <span>{label}</span>
            {badge && <Badge count={badge} />}
          </div>
          {submenu.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              onClick={onItemClick}
              className={`flex min-h-11 w-full items-center justify-between px-4 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content ${
                isUrlMatch(url, subItem.href) ? 'bg-base-200 font-semibold text-base-content' : ''
              }`}
            >
              <span>{subItem.label}</span>
              {subItem.badge && <Badge count={subItem.badge} />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarMenuItem;