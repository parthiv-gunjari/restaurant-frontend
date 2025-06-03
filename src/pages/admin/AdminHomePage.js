import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import { FaClipboardList, FaClock, FaCheckCircle, FaDollarSign, FaCrown } from 'react-icons/fa';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function AdminHomePage() {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    pendingCount: 0,
    completedCount: 0,
    topItems: [],
    totalRevenue: 0,
  });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [revenueData, setRevenueData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('today');
  const navigate = useNavigate();

  const fetchStats = async (range = selectedRange) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const [analyticsRes, chartRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/orders/analytics`, {
          params: { from, to },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/orders/revenue-chart`, {
          params: { range },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const chartData = chartRes.data;

      // Format labels to show weekdays for 1-week range
      if (range === 'week' && Array.isArray(chartData.labels)) {
        chartData.labels = chartData.labels.map(dateStr => {
          const day = new Date(dateStr);
          return day.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue", etc.
        });
      }

      setStats(analyticsRes.data);
      setRevenueData(chartData);
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const StatCard = ({ icon, label, value, bg }) => (
    <div className="col-md-3">
      <div className={`card text-white ${bg} shadow`}>
        <div className="card-body text-center">
          <div className="mb-2" style={{ fontSize: '1.8rem' }}>{icon}</div>
          <h6>{label}</h6>
          <h3>{value}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h2 className="mb-4">📊 Admin Dashboard</h2>

        {/* 📅 Date Range Filter */}
        <div className="row mb-4 g-2">
          <div className="col-md-3">
            <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-outline-secondary ms-2" onClick={fetchStats}>🔁 Filter</button>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedRange}
              onChange={(e) => {
                setSelectedRange(e.target.value);
                fetchStats(e.target.value);
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* 📊 Stats Cards */}
        <div className="row g-4 mb-5">
          <StatCard icon={<FaClipboardList />} label="Orders" value={stats.totalOrdersToday} bg="bg-success" />
          <StatCard icon={<FaClock />} label="Pending" value={stats.pendingCount} bg="bg-warning" />
          <StatCard icon={<FaCheckCircle />} label="Completed" value={stats.completedCount} bg="bg-primary" />
          <StatCard icon={<FaDollarSign />} label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} bg="bg-dark" />
        </div>

        {/* 🥇 Top Items */}
        <div className="mt-4">
          <h4 className="mb-3">🍽️ Top 3 Most Ordered Items</h4>
          <ul className="list-group">
            {stats.topItems.map((item, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>
                  {index === 0 ? <FaCrown className="text-warning me-2" /> : null}
                  {item.name}
                </span>
                <span className="badge bg-secondary rounded-pill">{item.quantity} orders</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 📉 Revenue Chart */}
        {revenueData?.labels && (
          <div className="mt-5" style={{ height: '300px' }}>
            <h4 className="mb-3">📈 Revenue Overview</h4>
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    label: 'Revenue ($)',
                    data: revenueData.values,
                    backgroundColor: '#4e73df',
                    barThickness: 30
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default AdminHomePage;