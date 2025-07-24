// src/components/AdminNavbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // Clear token
    navigate('/admin/login'); // Redirect to login
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/admin/home">Admin Dashboard</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar" aria-controls="adminNavbar" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="adminNavbar">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item"><Link className="nav-link" to="/admin/home">Home</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/admin/orders">Orders</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/admin/completed">Completed</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/admin/menu">Update Menu</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/admin/dinein-tables">Dine-In Tables</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/admin/modifications">Modifications</Link></li>
        </ul>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavbar;