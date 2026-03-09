import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    // Redirect to login if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Optional: redirect to unauthorized or home if role doesn't match
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/profile" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
