import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import './AdminLogin.css';
import { useNavigate } from 'react-router-dom';

const UserLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/admin/login`, {
        username,
        password
      });

      const { token, role, fullName } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('role', role);
      // Use fullName if available, otherwise fallback to username
      const displayName = fullName || username;
      localStorage.setItem('fullName', displayName);

      if (role === 'admin' || role === 'manager' || role === 'waiter') {
        navigate('/admin/pos/menu');
      } else {
        setError('Access denied: Invalid role');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loggedInName = localStorage.getItem('fullName');

  const rawUsers = [
    
    { username: 'admin', password: 'admin1234', role: 'admin', fullName: 'Admin User' },
    { username: 'parthiv', password: 'manager123', role: 'manager', fullName: 'Parthiv Kumar' },
    { username: 'divya', password: 'manager123', role: 'manager', fullName: 'Divya Sri' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter', fullName: 'Waiter One' },
    { username: 'waiter2', password: 'waiter123', role: 'waiter', fullName: 'Waiter Two' },
    { username: 'waiter3', password: 'waiter123', role: 'waiter', fullName: 'Waiter Three' },
   
  ];

  return (
    <div className="admin-login-container container mt-5" style={{ maxWidth: '500px' }}>
      {loggedInName && <p className="logged-in-user">Logged in as: {loggedInName}</p>}
      <p className="alert alert-info">Free-tier server may take a few seconds. Please wait after logging in.</p>
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" /> Please wait, logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
        {error && <p className="text-danger mt-2">{error}</p>}
      </form>

      <div className="credentials-booth mt-5">
        <h4>Test User Credentials</h4>
        <div className="table-responsive">
          <table className="table table-striped table-bordered mt-3">
            <thead className="table-dark">
              <tr>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th>Full Name</th>
              </tr>
            </thead>
            <tbody>
              {rawUsers.map((user) => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.password}</td>
                  <td>{user.role}</td>
                  <td>{user.fullName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;