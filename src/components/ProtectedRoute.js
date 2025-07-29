// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = ['admin'] }) => {
  const token =
    localStorage.getItem('adminToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('waiterToken');

  const role = localStorage.getItem('role');

  // If not logged in or token is missing
  if (!token || !role) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user's role is not in allowedRoles, redirect to login
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;