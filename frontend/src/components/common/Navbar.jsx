import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from './StatusBadge';

export const Navbar = ({ toggleSidebar, title = 'Overview' }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Sample role notifications
  const getNotifications = () => {
    if (role === 'ADMIN') {
      return [
        { id: 1, text: 'System Health: 100% operational', time: '10m ago', icon: 'bi-check-circle text-success' },
        { id: 2, text: '3 Failed login attempts blocked by firewall', time: '1h ago', icon: 'bi-shield-exclamation text-warning' }
      ];
    } else if (role === 'MANAGER') {
      return [
        { id: 1, text: 'New enterprise deal in Negotiation ($150,000)', time: '30m ago', icon: 'bi-briefcase text-primary' },
        { id: 2, text: 'Team conversion rate reached 34.2%', time: '2h ago', icon: 'bi-graph-up-arrow text-success' }
      ];
    } else if (role === 'SALES_EXECUTIVE') {
      return [
        { id: 1, text: 'You have 2 scheduled client calls today', time: 'Today', icon: 'bi-calendar-check text-info' },
        { id: 2, text: 'Hot lead "Jordan Hayes" assigned to your queue', time: '1h ago', icon: 'bi-fire text-danger' }
      ];
    }
    return [
      { id: 1, text: 'Support request update from account manager', time: '3h ago', icon: 'bi-chat-dots text-primary' }
    ];
  };

  const notifications = getNotifications();

  return (
    <header className="sticky-top bg-white border-bottom border-light-subtle px-3 px-lg-4 py-2" style={{ zIndex: 1020 }}>
      <div className="d-flex align-items-center justify-content-between">
        {/* Left Side: Toggle button & Breadcrumb Title */}
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="btn btn-sm btn-light border-0 d-lg-none text-dark p-2"
            aria-label="Toggle Navigation"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
          <div>
            <h4 className="fw-bold text-dark mb-0 fs-5">{title}</h4>
            <span className="text-muted small d-none d-md-inline">AcxiomCRM Enterprise Intelligent Workspace</span>
          </div>
        </div>

        {/* Right Side: Quick Tools, Notifications, User Menu */}
        <div className="d-flex align-items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="position-relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-sm btn-light rounded-circle position-relative p-2"
              style={{ width: '40px', height: '40px' }}
              title="Notifications"
            >
              <i className="bi bi-bell fs-6 text-secondary"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.65rem' }}
              >
                {notifications.length}
              </span>
            </button>

            {showNotifications && (
              <div
                className="position-absolute end-0 mt-2 saas-card shadow-lg p-0 fade-in"
                style={{ width: '320px', zIndex: 1050 }}
              >
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top">
                  <span className="fw-bold small text-dark">Notifications</span>
                  <span className="badge bg-primary-subtle text-primary">{notifications.length} New</span>
                </div>
                <div className="list-group list-group-flush" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.id} className="list-group-item list-group-item-action p-3 d-flex gap-3 align-items-start">
                      <i className={`bi ${n.icon} fs-5`}></i>
                      <div>
                        <div className="small fw-semibold text-dark">{n.text}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center bg-light rounded-bottom border-top">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="btn btn-sm btn-link text-decoration-none small text-primary p-0"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="d-flex align-items-center gap-2 ps-2 border-start border-light-subtle">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{ width: '36px', height: '36px', background: 'var(--primary-gradient)', fontSize: '0.85rem' }}
            >
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="d-none d-sm-block text-start" style={{ lineHeight: '1.2' }}>
              <div className="fw-bold small text-dark">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-secondary border-0 ms-1 p-2 rounded-circle"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
