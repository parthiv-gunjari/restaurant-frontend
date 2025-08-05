import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../../utils/api';
import axios from 'axios';
import '../../../assets/css/ReservationsPage.css';
import '../../../assets/css/Pos.css';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';

const ReservationsPage = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('today');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    guestCount: 2,
    date: '',
    notes: '',
    source: 'callin',
    tableId: ''
  });
  const [tables, setTables] = useState([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (page) => window.location.pathname.includes(page);

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  useEffect(() => {
    fetchTables();
  }, [formData.guestCount]);

  const fetchReservations = async () => {
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('waiterToken');
      const res = await axios.get(`${BASE_URL}/api/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allReservations = res.data;

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      let filtered;
      if (filter === 'today') {
        filtered = allReservations.filter(r => new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay);
      } else if (filter === 'upcoming') {
        filtered = allReservations.filter(r => new Date(r.date) > endOfDay);
      } else if (filter === 'past') {
        filtered = allReservations.filter(r => new Date(r.date) < startOfDay);
      } else {
        filtered = allReservations;
      }

      setReservations(filtered);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('waiterToken');

      await axios.patch(`${BASE_URL}/api/reservations/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchReservations();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const fetchTables = async () => {
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('waiterToken');
      const res = await axios.get(`${BASE_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const available = res.data.filter(
        (t) => t.status === 'available' && t.guestCapacity >= formData.guestCount
      );
      setTables(available);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('waiterToken');
      const dataToSend = { ...formData };
      if (!dataToSend.tableId) {
        delete dataToSend.tableId;
      }
      await axios.post(`${BASE_URL}/api/reservations`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Reservation added successfully');
      setFormData({ name: '', phone: '', email: '', guestCount: 2, date: '', notes: '', source: 'callin', tableId: '' });
      fetchReservations();
    } catch (err) {
      console.error('Error adding reservation', err);
    }
  };

  return (
  <div className="pos-container">
    {isMobile ? (
      <>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="btn btn-sm btn-light"
          style={{
            position: 'fixed',
            top: 10,
            left: 10,
            zIndex: 2000,
            background: '#0563bb',
            color: 'white'
          }}
        >
          ☰
        </button>
        <MobileNavBar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </>
    ) : (
      <SideBar />
    )}

    <main
      className="reservations-main"
    >
      <h2 className='reservations-header'>Reservations ({filter})</h2>
      <div className="filters">
        <button
          className={filter === 'today' ? 'active-filter' : ''}
          onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button
              className={filter === 'upcoming' ? 'active-filter' : ''}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={filter === 'past' ? 'active-filter' : ''}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
          </div>
        <div className="reservation-list" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Time</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.phone}</td>
                  <td>{new Date(r.date).toLocaleString()}</td>
                  <td>{r.tableId?.tableNumber || 'N/A'}</td>
                  <td>{r.guestCount}</td>
                  <td>
                    <span className={`reservation-status status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>{r.source}</td>
                  <td>
                    {r.status === 'reserved' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button onClick={() => updateStatus(r._id, 'completed')} className="action-btn complete-btn">Complete</button>
                        <button onClick={() => updateStatus(r._id, 'cancelled')} className="action-btn cancel-btn">Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="new-reservation-form">
          <h2>New Reservation</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <input type="text" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            <input type="email" placeholder="Email (optional)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            <input type="number" placeholder="Guest Count" value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })} min="1" required />
            <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}></textarea>
            <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
              <option value="callin">Call-in</option>
              <option value="online">Online</option>
            </select>
            <select value={formData.tableId} onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}>
              <option value="">Select Table</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>{t.tableNumber} (Capacity: {t.guestCapacity})</option>
              ))}
            </select>
            <button type="submit">Add Reservation</button>
          </form>
        </div>
    </main>
  </div>
);
};

export default ReservationsPage;