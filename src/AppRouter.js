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
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const RoutesWrapper = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

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
        <Route path="/admin/home" element={<ProtectedRoute><AdminHomePage /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/completed" element={<ProtectedRoute><AdminCompletedOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute><AdminMenuPage /></ProtectedRoute>} />
      </Routes>
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