import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './StatusBadge';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/customers', icon: 'bi-people-fill', label: 'Customers' },
          { to: '/leads', icon: 'bi-funnel-fill', label: 'Leads' },
          { to: '/opportunities', icon: 'bi-briefcase-fill', label: 'Opportunities' },
          { to: '/followups', icon: 'bi-calendar-check-fill', label: 'Follow-Ups' },
          { to: '/activities', icon: 'bi-activity', label: 'Activities' },
          { to: '/reports', icon: 'bi-file-earmark-bar-graph-fill', label: 'Reports' },
          { header: 'System Administration' },
          { to: '/admin/users', icon: 'bi-person-gear', label: 'Users & Roles' },
          { to: '/admin/audit', icon: 'bi-shield-check', label: 'Audit Logs' },
          { to: '/admin/settings', icon: 'bi-sliders', label: 'Health & Settings' }
        ];

      case 'MANAGER':
        return [
          { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/customers', icon: 'bi-people-fill', label: 'Team Customers' },
          { to: '/leads', icon: 'bi-funnel-fill', label: 'Team Leads' },
          { to: '/opportunities', icon: 'bi-briefcase-fill', label: 'Opportunities' },
          { to: '/followups', icon: 'bi-calendar-check-fill', label: 'Follow-Ups' },
          { to: '/activities', icon: 'bi-activity', label: 'Activities' },
          { to: '/reports', icon: 'bi-file-earmark-bar-graph-fill', label: 'Reports' }
        ];

      case 'SALES_EXECUTIVE':
        return [
          { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/customers', icon: 'bi-people-fill', label: 'My Customers' },
          { to: '/leads', icon: 'bi-funnel-fill', label: 'My Leads' },
          { to: '/opportunities', icon: 'bi-briefcase-fill', label: 'My Opportunities' },
          { to: '/followups', icon: 'bi-calendar-check-fill', label: 'My Follow-Ups' },
          { to: '/activities', icon: 'bi-activity', label: 'My Activities' }
        ];

      case 'CUSTOMER':
        return [
          { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Relationship Hub' },
          { to: '/customer/profile', icon: 'bi-person-badge-fill', label: 'My Profile' },
          { to: '/opportunities', icon: 'bi-briefcase-fill', label: 'My Deals' },
          { to: '/followups', icon: 'bi-calendar-event-fill', label: 'Upcoming Meetings' },
          { to: '/customer/requests', icon: 'bi-chat-left-text-fill', label: 'Support & Requests' }
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Sidebar */}
      <aside
        className={`d-flex flex-column flex-shrink-0 p-3 text-white transition-all ${
          isOpen ? 'd-flex' : 'd-none d-lg-flex'
        }`}
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          minHeight: '100vh',
          zIndex: 1045,
          position: isOpen ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Brand Header */}
        <div className="d-flex align-items-center justify-content-between px-2 py-3 mb-2 border-bottom border-secondary border-opacity-25">
          <NavLink to="/dashboard" className="d-flex align-items-center text-white text-decoration-none gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: '38px',
                height: '38px',
                background: 'var(--primary-gradient)',
                fontSize: '1.1rem'
              }}
            >
              A
            </div>
            <div>
              <span className="brand-font fs-5 fw-bold tracking-tight text-white">ACXIOM</span>
              <span className="text-info fw-bold fs-5">CRM</span>
            </div>
          </NavLink>
          <button className="btn btn-sm btn-link text-white-50 d-lg-none p-0" onClick={toggleSidebar}>
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Current User Quick Badge */}
        <div className="px-2 py-2 mb-3 rounded-3 bg-white bg-opacity-10 d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
            style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}
          >
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-grow-1" style={{ lineHeight: '1.2' }}>
            <div className="fw-semibold text-truncate small text-white">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="mt-1">
              <RoleBadge role={role} />
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow-1 overflow-auto pe-1">
          <ul className="nav nav-pills flex-column gap-1">
            {navLinks.map((item, idx) => {
              if (item.header) {
                return (
                  <li key={idx} className="nav-item mt-3 mb-1 px-3">
                    <span className="text-uppercase text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.08em', fontWeight: '700' }}>
                      {item.header}
                    </span>
                  </li>
                );
              }
              return (
                <li key={idx} className="nav-item">
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 992) toggleSidebar();
                    }}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <i className={`bi ${item.icon} fs-6`}></i>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Settings Navigation Section */}
        <div className="pt-2 border-top border-secondary border-opacity-25 mt-auto">
          <NavLink
            to="/settings"
            onClick={() => {
              if (window.innerWidth < 992) toggleSidebar();
            }}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-gear-fill fs-6 text-info"></i>
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
