import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from '../../components/AdminNavbar';
import { useNavigate } from 'react-router-dom';

function AdminCompletedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', date: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/completed`, {
        params: {
          page,
          name: filters.name || undefined,
          email: filters.email || undefined,
          date: filters.date || undefined
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching completed orders:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [page]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h2 className="mb-4"><span role="img" aria-label="check">✅</span> Completed Customer Orders</h2>

        {/* 🔍 Filters */}
        <form className="row g-3 mb-4" onSubmit={handleFilterSubmit}>
          <div className="col-md-3">
            <input type="text" className="form-control" name="name" placeholder="Search by Name" value={filters.name} onChange={handleFilterChange} />
          </div>
          <div className="col-md-3">
            <input type="email" className="form-control" name="email" placeholder="Search by Email" value={filters.email} onChange={handleFilterChange} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" name="date" value={filters.date} onChange={handleFilterChange} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" type="submit">Apply Filters</button>
          </div>
        </form>

        {/* 📦 Completed Order Cards */}
        {orders.length === 0 ? (
          <p className="text-muted">No completed orders found.</p>
        ) : (
          <div className="row g-3">
            {orders.map(order => (
              <div key={order._id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm p-3 h-100" style={{ backgroundColor: '#fff7ec' }}>
                  <div className="text-truncate">
                    <p className="mb-1 fw-bold">🧾 Order ID: <span className="text-dark">{order._id}</span></p>
                    <p className="mb-1">👤 <strong>{order.name}</strong></p>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                      ⏱️ {new Date(order.timestamp).toLocaleString()}
                    </p>
                    {order.notes && (
                      <p className="mb-1 text-muted"><em>📝 Notes: {order.notes}</em></p>
                    )}
                  </div>
                  <div className="d-flex flex-column align-items-end w-100 w-sm-auto">
                    <ul className="list-group mb-2">
                      {order.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="list-group-item d-flex justify-content-between align-items-center px-3 py-2"
                        >
                          <span>{item.name} × {item.quantity}</span>
                          <span className="fw-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 📄 Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      </div>
    </>
  );
}

export default AdminCompletedOrdersPage;