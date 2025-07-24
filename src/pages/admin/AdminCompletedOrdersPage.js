import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from '../../components/AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/api';

function AdminCompletedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', date: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const res = await axios.get(`${BASE_URL}/api/orders/completed`, {
        params: {
          page,
          name: filters.name || undefined,
          email: filters.email || undefined,
          date: filters.date || undefined,
          limit: 12 // 🔼 Increase the number of results per page
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
                  <p className="mb-1 fw-bold">🧾 Order ID: <span className="text-dark">{order.orderCode || order._id}</span></p>
                  <p className="mb-1">👤 <strong>{order.name}</strong></p>
                  <button
                    className="btn btn-outline-primary btn-sm mt-2"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Preview
                  </button>
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

        {selectedOrder && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Order Details</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Order ID:</strong> {selectedOrder.orderCode || selectedOrder._id}</p>
                  <p><strong>Name:</strong> {selectedOrder.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.timestamp).toLocaleString()}</p>
                  {selectedOrder.notes && <p><strong>Notes:</strong> {selectedOrder.notes}</p>}
                  {selectedOrder.cardBrand && selectedOrder.last4 && (
                    <p><strong>Payment:</strong> {selectedOrder.cardBrand.toUpperCase()} •••• {selectedOrder.last4}</p>
                  )}
                  {selectedOrder.paymentIntentId && (
                    <p><strong>Transaction ID:</strong> {selectedOrder.paymentIntentId}</p>
                  )}
                  <ul className="list-group mt-3">
                    {selectedOrder.items.map((item, idx) => {
                      const name = item.name || (item.itemId?.name) || 'Unnamed item';
                      const quantity = parseInt(item.quantity) || 1;
                      const price = parseFloat(item.price || item.itemId?.price || 0);
                      const total = (price * quantity).toFixed(2);

                      return (
                        <li key={idx} className="list-group-item d-flex justify-content-between">
                          <span>{name} × {quantity}</span>
                          <span className="fw-bold">${total}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminCompletedOrdersPage;