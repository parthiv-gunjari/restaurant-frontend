import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import '../../../assets/css/AccountsPage.css';
import { FaClipboardList, FaClock, FaCheckCircle, FaDollarSign, FaCrown } from 'react-icons/fa';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';
import '../../../assets/css/Pos.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AccountsPage = () => {
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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStats = useCallback(async (range = selectedRange) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      const [analyticsRes, chartRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/orders/analytics`, {
          params: { from, to, includeDineIn: true },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/api/orders/revenue-chart`, {
          params: { range },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const chartData = chartRes.data;
      if (range === 'week' && Array.isArray(chartData.labels)) {
        chartData.labels = chartData.labels.map(dateStr => {
          const day = new Date(dateStr);
          return day.toLocaleDateString('en-US', { weekday: 'short' });
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
  }, [from, to, selectedRange, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div style={{ display: 'flex' }}>
      {!isMobile && <SideBar />}
      {isMobile && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '56px',
              background: '#0563bb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1rem',
              zIndex: 1100,
              color: 'white',
            }}
          >
            <button
              style={{
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={() => setShowDrawer(true)}
            >
              ☰
            </button>
            <strong>Parthiv’s Kitchen</strong>
            <div style={{ width: '1.5rem' }} />
          </div>
          {showDrawer && <MobileNavBar open={showDrawer} onClose={() => setShowDrawer(false)} />}
        </>
      )}
      <div className="accounts-page" style={{ flex: 1, marginTop: isMobile ? '56px' : 0 }}>
        <div>
          <h2 className="dashboard-title">📊 Accounts Dashboard</h2>

          <div className="filter-section">
            <label>
              From:
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              To:
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <button onClick={fetchStats}>🔁 Filter</button>
          </div>
        </div>

        <div className="stat-card-grid">
          <div className="stat-card green"><FaClipboardList /><p>Total Orders</p><h3>{stats.totalOrdersToday}</h3></div>
          <div className="stat-card yellow"><FaClock /><p>Pending</p><h3>{stats.pendingCount}</h3></div>
          <div className="stat-card blue"><FaCheckCircle /><p>Completed</p><h3>{stats.completedCount}</h3></div>
          <div className="stat-card dark"><FaDollarSign /><p>Revenue</p><h3>${Number(stats.totalRevenue || 0).toFixed(2)}</h3></div>
        </div>

        <div className="top-items-section">
          <h4>🍽️ Top 3 Most Ordered Items</h4>
          <ul>
            {stats.topItems.slice(0, 5).map((item, index) => (
              <li key={index}>
                {index === 0 && <FaCrown className="gold-crown" />} {item.name}
                <span>{item.quantity} orders</span>
              </li>
            ))}
          </ul>
        </div>
        <select
        className="range-select"
          value={selectedRange}
          onChange={(e) => {
            setSelectedRange(e.target.value);
            fetchStats(e.target.value);
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
         
          <option value="month">This Month</option>
         
        </select>
        {revenueData?.labels && (
          <div className="chart-container">
            <h4>📈 Revenue Overview</h4>
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    label: 'Revenue ($)',
                    data: revenueData.values,
                    backgroundColor: '#4e73df',
                    barThickness: 30,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;