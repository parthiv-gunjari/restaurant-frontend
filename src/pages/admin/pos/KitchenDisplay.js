import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import '../../../assets/css/KitchenDisplayPage.css';
import { useNavigate, useLocation } from 'react-router-dom';


const POSKitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [timeElapsedMap, setTimeElapsedMap] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTable, setFilterTable] = useState('');
  const ITEMS_PER_PAGE = 8;
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsedMap(prev => {
        const updated = {};
        orders.forEach(order => {
          const ts = order.startedCookingAt || order.timestamp;
          if (ts) {
            const diff = Math.floor((new Date() - new Date(ts)) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            updated[order._id] = { formatted: `${mins}m ${secs}s`, seconds: diff };
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => {
        const prevMap = {};
        prev.forEach(order => { prevMap[order._id] = order; });
        return (response.data.orders || []).map(order => {
          const prevOrder = prevMap[order._id];
          const itemMap = {};
          prevOrder?.items?.forEach(item => {
            itemMap[item.itemId?._id || item.itemId] = item;
          });
          const updatedItems = order.items.map(item => {
            const prevItem = itemMap[item.itemId?._id || item.itemId];
            return prevItem?.isReady ? { ...item, isReady: true } : item;
          });
          return { ...order, items: updatedItems };
        }).sort((a, b) => new Date(b.timestamp || b.startedCookingAt) - new Date(a.timestamp || a.startedCookingAt));
      });
    } catch (err) {
      console.error('Fetch Orders Error:', err);
    }
  };

  const markItemReady = async (orderId, itemId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${BASE_URL}/api/orders/${orderId}/item/${itemId}/status`, { status: 'ready' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId
            ? { ...order, items: order.items.map(i => i.itemId === itemId ? { ...i, isReady: true } : i) }
            : order
        )
      );
    } catch (err) {
      console.error('Item Ready Error:', err);
    }
  };

  const markOrderAsCompleted = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${BASE_URL}/api/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order completed');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to complete order');
    }
  };

  const startCooking = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${BASE_URL}/api/orders/${orderId}/start-cooking`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      console.error('Start cooking error:', err);
    }
  };

  const getCommonItemsSummary = () => {
    const counts = {};
    orders
      .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
      .filter(o => !o.completedAt)
      .forEach(order => {
        order.items?.forEach(item => {
          if (item.status === 'removed') return;
          counts[item.name] = (counts[item.name] || 0) + item.quantity;
        });
      });
    return Object.entries(counts)
      .filter(([_, c]) => c > 1)
      .map(([n, c]) => ({ name: n, count: c }));
  };

  return (
    <div style={{ display: 'flex' }}>


      <div className="kitchen-container" style={{ flex: 1 }}>
    
            
        <div className="filter-bar">
             <button className="back-btn" onClick={() => navigate(-1)}>⬅️ Back</button>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="dine-in">Dine-In</option>
            <option value="online">Online</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="cooking">Cooking</option>
            <option value="ready">Ready</option>
          </select>
          <input
            type="text"
            placeholder="Search Table Name"
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
          />
        </div>

        <div className="common-items-bar">
          <strong>🍽️ Common Items:</strong>
          {getCommonItemsSummary().map((item, i) => {
            const colors = ['#f94144', '#f3722c', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1'];
            return (
              <span
                key={item.name}
                className="common-badge"
                style={{ backgroundColor: colors[i % colors.length] }}
              >
                {item.name} x{item.count}
              </span>
            );
          })}
        </div>

        <div className="order-grid">
          {orders
            .filter(order => {
              const status = !order.startedCookingAt ? 'not-started' :
                order.items.every(i => i.isReady) ? 'ready' : 'cooking';
              return (filterType === 'all' || order.orderType === filterType) &&
                (filterStatus === 'all' || filterStatus === status) &&
                (filterTable === '' || order.name.toLowerCase().includes(filterTable.toLowerCase()));
            })
            .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
            .map(order => {
              const original = {};
              (order.initialItems || []).forEach(i => original[i.itemId?._id || i.itemId] = i);
              const updated = {};
              (order.items || []).forEach(i => updated[i.itemId?._id || i.itemId] = i);

              const allIds = new Set([...Object.keys(original), ...Object.keys(updated)]);
              const items = Array.from(allIds).map(id => {
                const orig = original[id], upd = updated[id];
                if (orig && (!upd || upd.quantity === 0)) return { ...orig, itemId: id, quantity: 0, status: 'removed' };
                if (!orig && upd) return { ...upd, itemId: id, status: 'new' };
                if (orig && upd && orig.quantity !== upd.quantity)
                  return { ...upd, itemId: id, status: 'updated', originalQuantity: orig.quantity };
                return { ...upd, itemId: id, status: 'unchanged' };
              });

              const total = items.filter(i => i.status !== 'removed').length;
              const ready = items.filter(i => i.isReady && i.status !== 'removed').length;
              const elapsed = timeElapsedMap[order._id]?.seconds || 0;
              const isReady = ready === total && order.startedCookingAt;
              const timeClass = elapsed <= 1200 ? 'order-green' :
                elapsed <= 1800 ? 'order-yellow' : 'order-red';
              const isModified = items.some(i => ['new', 'removed', 'updated'].includes(i.status));

              return (
                <div
                  key={order._id}
                  className={`order-card ${timeClass} ${isReady ? 'order-ready' : ''} ${elapsed > 1800 ? 'order-sla-alert' : ''}`}
                >
                  <div className="order-header-bar">
                    <div>{timeElapsedMap[order._id]?.formatted || '0m 0s'}</div>
                    <div>
                      {{
                        'dine-in': `Dine-in (Table ${order.name.split('-')[1]})`,
                        'in-store': 'In-Store',
                        'togo': 'To-Go',
                        'callin': 'Call-In',
                        'walkin': 'Walk-In',
                        'online': 'Online'
                      }[order.orderType?.toLowerCase()] || 'Other'}
                      {isModified && <span className="modified-badge">Modified</span>}
                    </div>
                    <div>{order.name}</div>
                  </div>

                  <div className="item-progress"><strong>{ready}/{total} Items Ready</strong></div>

                  <ul className="item-list">
                    {items.map((item, index) => (
                      <li
                        key={item.itemId + '-' + index}
                        className={`item ${
                          item.status === 'removed' ? 'item-removed' :
                          item.status === 'new' ? 'item-new' :
                          item.status === 'updated' ? 'item-changed' :
                          item.isReady ? 'item-ready' : ''
                        }`}
                        onClick={() => {
                          if (!item.isReady && order.startedCookingAt && item.status !== 'removed') {
                            markItemReady(order._id, item.itemId);
                          }
                        }}
                      >
                        <span>
                          {item.isReady && <span className="check-icon">✓ </span>}
                          <strong className={`item-name ${
                            item.status === 'removed' ? 'text-red-700 line-through' :
                            item.status === 'new' ? 'text-blue-700' :
                            item.status === 'updated' ? 'text-orange-500' :
                            item.isReady ? 'text-green-700 font-semibold' : 'text-gray-800'
                          }`}>
                            {item.name}
                          </strong>{' '}
                          {item.status === 'removed' && <span>x 0</span>}
                          {item.status === 'new' && <span>x {item.quantity}</span>}
                          {item.status === 'updated' && (
                            <span>x {item.quantity} <span className="was-text">(was {item.originalQuantity})</span></span>
                          )}
                          {item.status === 'unchanged' && <span>x {item.quantity}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!order.startedCookingAt ? (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <button className="start-btn" onClick={() => startCooking(order._id)}>Start Cooking</button>
                    </div>
                  ) : isReady ? (
                    <button className="ready-btn" onClick={() => markOrderAsCompleted(order._id)} style={{ marginTop: '8px', width: '100%' }}>
                      ✅ Complete Order
                    </button>
                  ) : (
                    <p className="in-progress">In Progress...</p>
                  )}
                </div>
              );
            })}
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0}>⬅️ Prev</button>
          <button onClick={() => setCurrentPage(p => (p + 1) * ITEMS_PER_PAGE < orders.length ? p + 1 : p)} disabled={(currentPage + 1) * ITEMS_PER_PAGE >= orders.length}>Next ➡️</button>
        </div>
      </div>
    </div>
  );
};

export default POSKitchenDisplay;