import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from '../../components/AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', date: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`, {
        params: {
          page,
          name: filters.name,
          email: filters.email,
          date: filters.date
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
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

  const markAsCompleted = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      await axios.patch(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success("Order marked as completed and email sent!");
      fetchOrders();
    } catch (err) {
      console.error("❌ Failed to complete order:", err);
      toast.error("❌ Failed to complete order.");
    }
  };

  // Print handler for printable ticket
  const handlePrint = (order) => {
    // Construct printable HTML as a ticket
    const ticketHtml = `
      <html>
      <head>
        <title>Order Ticket - ${order._id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #fff; }
          .restaurant-title { font-size: 1.8rem; font-weight: bold; margin-bottom: 8px; text-align:center;}
          .ticket-box { border: 2px dashed #333; padding: 24px 18px; max-width: 400px; margin: 0 auto; }
          .ticket-label { font-weight: bold; }
          .order-items { margin: 18px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0;}
          .order-items-table { width: 100%; border-collapse: collapse; margin: 0 auto;}
          .order-items-table th, .order-items-table td { padding: 4px 8px; text-align: left; }
          .order-items-table th { border-bottom: 1px solid #ccc; }
          .total-row td { font-weight: bold; border-top: 1px solid #ccc; }
          .ticket-footer { font-size: 0.95rem; color: #888; text-align:center; margin-top: 18px;}
          @media print {
            body { background: #fff !important; }
            .ticket-box { box-shadow: none !important; border: none !important;}
          }
        </style>
      </head>
      <body>
        <div class="ticket-box">
          <div class="restaurant-title">🍴 Parthiv's Restaurant</div>
          <div>
            <span class="ticket-label">Order ID:</span> ${order._id}<br/>
            <span class="ticket-label">Customer:</span> ${order.name}<br/>
            <span class="ticket-label">Time:</span> ${new Date(order.timestamp).toLocaleString()}
          </div>
          <div class="order-items">
            <table class="order-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2">Total</td>
                  <td>
                    $${order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="ticket-footer">
            Thank you for your order!
          </div>
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `;
    // Open new window and write the ticket
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h2>📦 Pending Customer Orders</h2>

        {/* 🔍 Filter Form */}
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

        {/* 📄 Order List */}
        {orders.length === 0 ? (
          <p className="text-muted">No pending orders found.</p>
        ) : (
          <div className="row">
            {orders.map(order => (
              <div key={order._id} className="col-md-6 col-lg-4 mb-3">
                <div className="card h-100 shadow-sm border-primary">
                  <div style={{ backgroundColor: '  #ffebcc' }}>
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <div>
                        <div>
                          <span className="fw-bold">Order:</span> <span>{order._id}</span>
                        </div>
                        <div>
                          <span className="fw-bold">Name:</span> <span>{order.name}</span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        {/* Printer icon */}
                        <button
                          className="btn btn-light btn-sm mb-2"
                          title="Print Ticket"
                          onClick={() => handlePrint(order)}
                          style={{ fontSize: '1.2rem', border: 'none' }}
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        {/* Download as PDF (uses print as workaround) */}
                        
                      </div>
                    </div>
                    <div className="card-footer text-end bg-white border-0 text-center">
                      <button className="btn btn-success btn-sm" onClick={() => markAsCompleted(order._id)}>
                        Mark as Completed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 📄 Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
    </>
  );
}

export default AdminOrdersPage;