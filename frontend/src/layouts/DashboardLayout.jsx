import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

export const DashboardLayout = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="d-flex min-vh-100 bg-app">
      {/* Dynamic Role Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
        <Navbar toggleSidebar={toggleSidebar} title={title} />
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <div className="container-fluid p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
