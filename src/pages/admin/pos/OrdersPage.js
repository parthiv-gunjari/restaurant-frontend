import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../../../assets/css/OrdersPage.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const navigate = useNavigate();

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
    const ticketHtml = `
      <html><head><title>Order - ${order.orderCode}</title></head>
      <body><pre>${JSON.stringify(order, null, 2)}</pre>
      <script>window.print();</script></body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(ticketHtml);
    win.document.close();
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

  return (
    <div className="d-flex">
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
  style={{
    padding: '1rem 0.6rem 0.2rem 0.1rem',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.4rem',
    color: '#0563bb',
    whiteSpace: 'nowrap'  // ✅ Prevent line break
  }}
>
  Parthiv's Kitchen
</div>
        <ul>
          <li
            className={isActive('reservations') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/reservations')}
          >
            Reservations
          </li>
          <li
            className={isActive('tables') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/tables')}
          >
            Table Services
          </li>
          <li
            className={isActive('menu') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/menu')}
          >
            Menu
          </li>
          <li
            className={isActive('orders') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/orders')}
          >
            Orders
          </li>
          <li
            className={isActive('accounts') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/accounts')}
          >
            Accounts
          </li>
        </ul>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', color: '#333', fontWeight: 'bold' }}>
            <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
            {(() => {
              const fullName =
                localStorage.getItem('fullName') || localStorage.getItem('username') || 'Unknown';
              const role =
                localStorage.getItem('role') ||
                (localStorage.getItem('adminToken') && 'Admin') ||
                (localStorage.getItem('managerToken') && 'Manager') ||
                (localStorage.getItem('waiterToken') && 'Waiter') ||
                'Role Unknown';
              return (
                <>
                  Logged in as: {fullName} ({role})
                </>
              );
            })()}
          </div>
          <div style={{ padding: '1rem' }}>
            <button
              className="btn btn-danger logout-button"
              onClick={() => {
                localStorage.clear();
                navigate('/admin/login');
              }}
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
      <div className="container mt-4">
        <h3 className="mb-4"> All Orders</h3>
        <div className="mb-3 d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="statusFilter" className="form-label mb-0">Status:</label>
            <select
              id="statusFilter"
              className="form-select w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="orderTypeFilter" className="form-label mb-0">Order Type:</label>
            <select
              id="orderTypeFilter"
              className="form-select w-auto"
              value={orderTypeFilter}
              onChange={e => setOrderTypeFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="online">Online</option>
              <option value="dine-in">Dine-In</option>
              <option value="walk-in">Walk-In</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="paymentStatusFilter" className="form-label mb-0">Payment Status:</label>
            <select
              id="paymentStatusFilter"
              className="form-select w-auto"
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
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{shortId(order.orderCode || order._id)}</td>
                  <td>{order.name || order.tableId?.name || '—'}</td>
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
  );
}

export default OrdersPage;