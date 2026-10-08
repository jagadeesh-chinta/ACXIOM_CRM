import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleGuard } from './Guards';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '../pages/auth/AuthPages';
import { AdminPortalPage } from '../pages/auth/AdminPortalPage';
import { ManagerPortalPage } from '../pages/auth/ManagerPortalPage';
import { SalesExecPortalPage } from '../pages/auth/SalesExecPortalPage';
import { ForbiddenPage, NotFoundPage } from '../pages/ErrorPages';

// Dynamic Dashboard
import { DashboardDispatcher } from '../dashboards/DashboardDispatcher';
import { SettingsPage } from '../pages/SettingsPage';

// CRM Pages
import { CustomersPage } from '../pages/customers/CustomersPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';
import { LeadsPage } from '../pages/leads/LeadsPage';
import { OpportunitiesPage } from '../pages/opportunities/OpportunitiesPage';
import { FollowupsPage } from '../pages/followups/FollowupsPage';
import { ActivitiesPage } from '../pages/activities/ActivitiesPage';
import { ReportsPage } from '../pages/reports/ReportsPage';

// Admin Pages
import { UsersPage } from '../pages/admin/UsersPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { SystemHealthPage } from '../pages/admin/SystemHealthPage';

// Customer Portal Pages
import { CustomerProfilePage, CustomerRequestsPage } from '../pages/customer/CustomerPages';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminPortalPage />} />
      <Route path="/manager" element={<ManagerPortalPage />} />
      <Route path="/sales-exec" element={<SalesExecPortalPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Protected CRM Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardDispatcher />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/followups" element={<FollowupsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />

          {/* Leads restricted from CUSTOMER */}
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']} />}>
            <Route path="/leads" element={<LeadsPage />} />
          </Route>

          {/* Reports restricted from CUSTOMER */}
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Admin User Management */}
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'MANAGER']} />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>

          {/* Audit Logs */}
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'MANAGER']} />}>
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>

          {/* Admin System Health & Settings */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/admin/settings" element={<SystemHealthPage />} />
          </Route>

          {/* Customer Self-Service Portal Pages */}
          <Route element={<RoleGuard allowedRoles={['CUSTOMER']} />}>
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
            <Route path="/customer/requests" element={<CustomerRequestsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
