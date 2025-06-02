// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  // If token doesn't exist, redirect to login
  if (!token) {
    return <Navigate to="/restaurant-frontend/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;