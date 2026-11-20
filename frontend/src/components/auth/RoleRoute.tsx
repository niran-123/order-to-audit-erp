import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, SystemRole } from '../../context/AuthContext';

interface RoleRouteProps {
  allowedRoles: SystemRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const isAuthorized = hasRole(allowedRoles);

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
