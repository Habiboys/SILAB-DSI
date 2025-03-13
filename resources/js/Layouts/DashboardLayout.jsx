import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';
import Breadcrumb from '../Components/Breadcrumb';
import { usePage } from '@inertiajs/react';

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { url } = usePage();
  
  const generateBreadcrumbItems = () => {
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Remove leading slash and split by slash
    const pathSegments = cleanUrl.substring(1).split('/');
    
    // Create breadcrumb items
    const items = [];
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      if (segment) {
        currentPath += `/${segment}`;
        
        // Format the label (capitalize first letter and replace hyphens with spaces)
        const label = segment
          .split('-')
          .map(word => {
            // Check if the word is a number (potential ID)
            // If it's a number, skip capitalization
            return isNaN(word) 
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word;
          })
          .join(' ');
        
        items.push({
          label,
          href: index === pathSegments.length - 1 ? null : currentPath,
        });
      }
    });
    
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Dashboard" />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <Navbar isCollapsed={isCollapsed} />
      <main className={`transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      } pt-16 pb-12 px-4 md:px-6`}>
        <div className="py-6">
   
          {children || (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Welcome to SILAB Dashboard</h2>
              <p>This is the main content area. Your dashboard content will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;