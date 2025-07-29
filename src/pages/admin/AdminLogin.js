import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import './AdminLogin.css';
import { useNavigate } from 'react-router-dom';

const UserLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

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
    }
  };

  const loggedInName = localStorage.getItem('fullName');

  return (
    <div className="admin-login-container">
      {loggedInName && <p className="logged-in-user">Logged in as: {loggedInName}</p>}
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default UserLogin;