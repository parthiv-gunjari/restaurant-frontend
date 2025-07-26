// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem('waiterToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token');

  // If token doesn't exist, redirect to login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;