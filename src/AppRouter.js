// src/AppRouter.js
import React from 'react';
import { Routes, Route, useLocation, HashRouter, BrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCompletedOrdersPage from './pages/admin/AdminCompletedOrdersPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import DineInOrderTables from './pages/admin/DineInOrderTables';
import DineInOrderPage from './pages/admin/DineInOrderPage';
import AdminOrderModificationsPage from './pages/admin/AdminOrderModificationsPage';
import InStoreOrderPage from './pages/admin/InStoreOrderPage';
import KitchenDisplayPage from './pages/admin/KitchenDisplayPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react";

const RoutesWrapper = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://vercel.com/analytics/script.js';
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-history" element={<OrderHistoryPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Protected */}
        <Route path="/admin/home" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminHomePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
            <AdminOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/completed" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
            <AdminCompletedOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/menu" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminMenuPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/dinein-tables" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
            <DineInOrderTables />
          </ProtectedRoute>
        } />
        <Route path="/admin/dinein-order/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
            <DineInOrderPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/modifications" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminOrderModificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/kitchen" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <KitchenDisplayPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/instore" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
            <InStoreOrderPage />
          </ProtectedRoute>
        } />
      </Routes>
      <Analytics />
    </>
  );
};

function AppRouter() {
  const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <RoutesWrapper />
    </Router>
  );
}

export default AppRouter;