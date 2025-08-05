import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/OrdersPage.css';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sidebar active page helper
  const isActive = (page) => window.location.pathname.includes(page);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      let fetchedOrders = [];

      if (statusFilter === 'Completed') {
        const res = await axios.get(`${BASE_URL}/api/orders/completed`, {
          params: { limit: 0 },
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedOrders = res.data.orders || [];
      } else if (statusFilter === 'Pending') {
        const res = await axios.get(`${BASE_URL}/api/orders`, {
          params: { limit: 0 },
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedOrders = (res.data.orders || []).filter(order => order.status === 'Pending');
      } else {
        // All: fetch both pending and completed
        const [pendingRes, completedRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/orders`, {
            params: { limit: 0 },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/api/orders/completed`, {
            params: { limit: 0 },
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        const pendingOrders = pendingRes.data.orders || [];
        const completedOrders = completedRes.data.orders || [];
        fetchedOrders = [...pendingOrders, ...completedOrders].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      }

      if (orderTypeFilter !== 'All') {
        fetchedOrders = fetchedOrders.filter(order => order.orderType === orderTypeFilter);
      }

      if (paymentStatusFilter !== 'All') {
        fetchedOrders = fetchedOrders.filter(order => (order.paymentStatus || 'unpaid') === paymentStatusFilter);
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    }
  };

  const handlePrint = (order) => {
    const totalAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    const ticketHtml = `
      <html>
      <head>
        <title>Order Receipt - ${order.orderCode || order._id}</title>
        <style>
          body { font-family: monospace; padding: 20px; font-size: 14px; color: #000; }
          .ticket { width: 300px; margin: 0 auto; border: 2px dashed #333; padding: 16px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header { font-size: 18px; margin-bottom: 5px; }
          .sub-header { font-size: 12px; color: #555; }
          hr { border: none; border-top: 1px dashed #888; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 4px 0; text-align: left; }
          th:nth-child(2), td:nth-child(2) { text-align: center; }
          th:nth-child(3), td:nth-child(3) { text-align: right; }
          .total-row td { border-top: 1px dashed #000; font-weight: bold; }
          .footer { margin-top: 12px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center header bold">🍽️ Parthiv's Kitchen</div>
          <div class="center sub-header">1216 Avenue A ,Denton</div>
          <div class="center sub-header">Phone: (940) 843-5294</div>
          <hr />
          <div><span class="bold">Order ID:</span> ${order.orderCode || order._id}</div>
          <div><span class="bold">Customer:</span> ${order.name || order.tableId?.name || '—'}</div>
<div><span class="bold">Date:</span> ${new Date(order.timestamp).toLocaleDateString()}</div>
<div><span class="bold">Time:</span> ${new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <hr />
          <table>
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
                <td colspan="2">TOTAL</td>
                <td>$${totalAmount}</td>
              </tr>
            </tbody>
          </table>
          <hr />
          <div class="footer">Thank you for dining with us!</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
    }
  };

  const markAsCompleted = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      await axios.patch(`${BASE_URL}/api/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('✅ Order marked as completed!');
      setOrders(prev => {
        return prev.map(order =>
          order._id === orderId ? { ...order, status: 'Completed' } : order
        );
      });
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to complete order.');
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  };

  const shortId = (id) => id?.slice(-6);

  const badgeColor = (status, type = 'status') => {
    const map = {
      status: {
        Pending: 'warning',
        Completed: 'success'
      },
      paymentStatus: {
        succeeded: 'success',
        paid: 'success',
        unpaid: 'secondary',
        pending: 'warning',
        failed: 'danger'
      }
    };
    return map[type][status] || 'secondary';
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, orderTypeFilter, paymentStatusFilter]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {isMobile && (
        <>
          {/* Hamburger button for mobile sidebar */}
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
      )}
      <div className="d-flex">
        {/* Sidebar Navigation - only show on desktop */}
        {!isMobile && <SideBar />}
        <div className="container mt-4 ">
          <h3 className="mb-4 allOrders"> All Orders</h3>
          <div className={`mb-3 ${isMobile ? '' : 'd-flex align-items-center gap-3 flex-wrap'}`}>
            <div className="filter-group mb-2">
              <label htmlFor="statusFilter" className="form-label">Status:</label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="filter-group mb-2">
              <label htmlFor="orderTypeFilter" className="form-label">Order Type:</label>
              <select
                id="orderTypeFilter"
                className="form-select"
                value={orderTypeFilter}
                onChange={e => setOrderTypeFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="online">Online</option>
                <option value="dine-in">Dine-In</option>
                <option value="walk-in">Walk-In</option>
              </select>
            </div>

            <div className="filter-group mb-2">
              <label htmlFor="paymentStatusFilter" className="form-label">Payment Status:</label>
              <select
                id="paymentStatusFilter"
                className="form-select"
                value={paymentStatusFilter}
                onChange={e => setPaymentStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="orders-table-container table-responsive" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Name</th>
                  <th>Order Type</th>
                  <th>Payment Status</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th>Actions</th>
                  <th>Pending Payments</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>{shortId(order.orderCode || order._id)}</td>
                    <td>{[order.name, order.tableId?.name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="text-capitalize">{order.orderType}</td>
                    <td>
                      <span className={`badge bg-${badgeColor(order.paymentStatus, 'paymentStatus')}`}>
                        {order.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="text-capitalize">{order.paymentMode || '—'}</td>
                    <td>
                      <span className={`badge bg-${badgeColor(order.status, 'status')}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.timestamp).toLocaleString()}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning" title="Preview" onClick={() => setPreviewOrder(order)}>
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-secondary" title="Print" onClick={() => handlePrint(order)}>
                        <i className="fas fa-print"></i>
                      </button>
                      {order.status !== 'Completed' ? (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => markAsCompleted(order._id)}
                        >
                          ✅
                        </button>
                      ) : null}
                    </td>
                    <td>
                      {(order.paymentStatus === 'unpaid' || order.paymentStatus === 'pending') && (
                        <button
                          className="btn btn-sm btn-primary btn-pay-now"
                          title="Pay Now"
                          onClick={() => navigate(`/admin/pos/payment?orderId=${order._id}`)}
                        >
                          💳 Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p className="text-muted text-center my-4">No orders found.</p>
            )}
          </div>

          {/* 🔍 Preview Modal */}
          {previewOrder && (
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <div className="modal-dialog">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">Order Preview - {previewOrder.orderCode || previewOrder._id}</h5>
                    <button className="btn-close" onClick={() => setPreviewOrder(null)}></button>
                  </div>
                  <div className="modal-body">
                    <ul className="list-group">
                      {previewOrder.items.map((item, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between">
                          <span>{item.name}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setPreviewOrder(null)}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OrdersPage;