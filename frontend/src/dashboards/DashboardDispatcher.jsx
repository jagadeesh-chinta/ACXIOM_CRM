import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { SalesExecutiveDashboard } from './SalesExecutiveDashboard';
import { CustomerDashboard } from './CustomerDashboard';
import { LoadingSpinner } from '../components/common/FeedbackStates';

export const DashboardDispatcher = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Resolving user profile and permissions..." />;
  }

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'SALES_EXECUTIVE':
      return <SalesExecutiveDashboard />;
    case 'CUSTOMER':
      return <CustomerDashboard />;
    default:
      return <SalesExecutiveDashboard />;
  }
};
