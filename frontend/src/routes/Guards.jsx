import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/FeedbackStates';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying session security..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const RoleGuard = ({ allowedRoles = [] }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
