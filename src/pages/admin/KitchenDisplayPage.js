import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import AdminNavbar from '../../components/AdminNavbar';
import '../../assets/css/KitchenDisplayPage.css';

const KitchenDisplayPage = () => {
  const [orders, setOrders] = useState([]);
  const [timeElapsedMap, setTimeElapsedMap] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTable, setFilterTable] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsedMap(prev => {
        const updated = {};
        orders.forEach(order => {
          const ts = order.startedCookingAt || order.timestamp;
          if (ts) {
            const start = new Date(ts);
            const now = new Date();
            const diff = Math.floor((now - start) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            updated[order._id] = {
              formatted: `${mins}m ${secs}s`,
              seconds: diff
            };
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(prevOrders => {
        const prevOrderMap = {};
        prevOrders.forEach(order => {
          prevOrderMap[order._id] = order;
        });
        const sortedOrders = (response.data.orders || []).map(order => {
          const prevOrder = prevOrderMap[order._id];
          if (!prevOrder) return order;
          const itemMap = {};
          prevOrder.items.forEach(item => {
            itemMap[item.itemId?._id || item.itemId] = item;
          });
          const updatedItems = order.items.map(item => {
            const prevItem = itemMap[item.itemId?._id || item.itemId];
            return prevItem && prevItem.isReady ? { ...item, isReady: true } : item;
          });
          return { ...order, items: updatedItems };
        }).sort((a, b) => {
          const timeA = new Date(a.timestamp || a.startedCookingAt).getTime();
          const timeB = new Date(b.timestamp || b.startedCookingAt).getTime();
          return timeB - timeA;
        });
        return sortedOrders;
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const markItemReady = async (orderId, itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BASE_URL}/api/orders/${orderId}/item/${itemId}/status`,
        { status: 'ready' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? {
                ...order,
                items: order.items.map(item =>
                  item.itemId === itemId ? { ...item, isReady: true } : item
                )
              }
            : order
        )
      );
    } catch (error) {
      console.error('Error marking item ready:', error);
    }
  };

  const markOrderAsCompleted = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      await axios.patch(`${BASE_URL}/api/orders/${orderId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Order marked as completed!');
      fetchOrders();
    } catch (err) {
      console.error('Failed to complete order:', err);
      toast.error('Failed to complete order.');
    }
  };

  const startCooking = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BASE_URL}/api/orders/${orderId}/start-cooking`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchOrders();
    } catch (error) {
      console.error('Error starting cooking:', error);
    }
  };

  const getCommonItemsSummary = () => {
    const itemCount = {};
    const visibleOrders = orders
      .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
      .filter(order => !order.completedAt);
    visibleOrders.forEach(order => {
      const combinedItems = order.items || [];
      combinedItems.forEach(item => {
        if (item.status === 'removed') return;
        const itemName = item.name;
        itemCount[itemName] = (itemCount[itemName] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCount)
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ name, count }));
  };

  return (
    <div>
      <AdminNavbar />
      <div className="kitchen-container">
        <div className="filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="dine-in">Dine-In</option>
            <option value="online">Online</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
          {getCommonItemsSummary().map((item, index) => {
            const colors = ['#f94144', '#f3722c', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1'];
            const bgColor = colors[index % colors.length];
            return (
              <span
                key={item.name}
                className="common-badge"
                style={{
                  backgroundColor: bgColor,
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  margin: '0 8px'
                }}
              >
                {item.name} x{item.count}
              </span>
            );
          })}
        </div>
        <div className="order-grid">
          {orders
            .filter(order => {
              const matchesType = filterType === 'all' || order.orderType === filterType;
              const matchesTable = filterTable === '' || order.name.toLowerCase().includes(filterTable.toLowerCase());
              const status =
                !order.startedCookingAt
                  ? 'not-started'
                  : order.items.every(i => i.isReady)
                  ? 'ready'
                  : 'cooking';
              const matchesStatus = filterStatus === 'all' || filterStatus === status;
              return matchesType && matchesTable && matchesStatus;
            })
            .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
            .map(order => {
              const originalMap = {};
              (order.initialItems || []).forEach(item => {
                originalMap[item.itemId?._id || item.itemId] = item;
              });
              const updatedMap = {};
              (order.items || []).forEach(item => {
                updatedMap[item.itemId?._id || item.itemId] = item;
              });
              const allItemIds = new Set([...Object.keys(originalMap), ...Object.keys(updatedMap)]);
              const combinedItems = [];
              allItemIds.forEach(itemId => {
                const originalItem = originalMap[itemId];
                const updatedItem = updatedMap[itemId];
                if (originalItem && (!updatedItem || updatedItem.quantity === 0)) {
                  combinedItems.push({ ...originalItem, itemId, quantity: 0, status: 'removed', isReady: false });
                } else if (!originalItem && updatedItem) {
                  combinedItems.push({ ...updatedItem, itemId, status: 'new' });
                } else if (originalItem && updatedItem) {
                  if (originalItem.quantity !== updatedItem.quantity) {
                    combinedItems.push({
                      ...updatedItem,
                      itemId,
                      status: 'updated',
                      originalQuantity: originalItem.quantity
                    });
                  } else {
                    combinedItems.push({ ...updatedItem, itemId, status: 'unchanged' });
                  }
                }
              });
              const sortedItems = combinedItems.sort((a, b) => {
                if (a.isReady === b.isReady) return 0;
                return a.isReady ? 1 : -1;
              });
              const total = combinedItems.filter(item => item.status !== 'removed').length;
              const readyCount = combinedItems.filter(item => item.isReady && item.status !== 'removed').length;
              const isFullyReady = readyCount === total && order.startedCookingAt;
              const isModified = combinedItems.some(item => ['removed', 'new', 'updated'].includes(item.status));
              const elapsed = timeElapsedMap[order._id]?.seconds || 0;
              const timeColorClass = elapsed <= 1200 ? 'order-green' :
                                     elapsed <= 1800 ? 'order-yellow' : 'order-red';
              return (
                <div
                  className={`order-card ${isFullyReady ? 'order-ready' : ''} ${timeColorClass} ${
                    elapsed > 1800 ? 'order-sla-alert' : ''
                  }`}
                  key={order._id}
                >
                  <div className="order-header-bar">
                    <div className="header-left">{timeElapsedMap[order._id]?.formatted || '0m 0s'}</div>
                    <div className="header-center">
                      {{
                        'dine-in': `Dine-in (Table ${order.name.split('-')[1]})`,
                        'in-store': 'In-Store',
                        'togo': 'To-Go',
                        'callin': 'Call-In',
                        'walkin': 'Walk-In',
                        'online': 'Online'
                        }[(order.orderType || '').toLowerCase()] || 'Other'}
                      {isModified && (
                        <span className="modified-badge">Modified</span>
                      )}
                    </div>
                    <div className="header-right">{order.name}</div>
                  </div>
                  <div className="item-progress">
                    <strong>{readyCount} / {total} Items Ready</strong>
                  </div>
                  <ul className="item-list">
                    {sortedItems.map((item, index) => (
                      <li
                        key={item.itemId + '-' + index}
                        className={`item
                          ${item.status === 'removed' ? 'item-removed' : ''}
                          ${item.status === 'new' ? 'item-new' : ''}
                          ${item.status === 'updated' ? 'item-changed' : ''}
                          ${item.isReady ? 'item-ready' : ''}
                        `}
                        onClick={() => {
                          if (!item.isReady && order.startedCookingAt && item.status !== 'removed') {
                            markItemReady(order._id, item.itemId);
                          }
                        }}
                      >
                        <span>
                          {item.isReady && <span className="check-icon">✓ </span>}
                          <strong
                            className={`item-name ${
                              item.status === 'removed' ? 'text-red-700 line-through' :
                              item.status === 'updated' ? 'text-orange-500' :
                              item.status === 'new' ? 'text-blue-700' :
                              item.isReady ? 'text-green-700 font-semibold' :
                              'text-gray-800'
                            }`}
                          >
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
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                      <button className="start-btn" onClick={() => startCooking(order._id)}>Start Cooking</button>
                    </div>
                  ) : isFullyReady ? (
                    <button
                      className="ready-btn"
                      onClick={() => markOrderAsCompleted(order._id)}
                      style={{ marginTop: '8px', width: '100%' }}
                    >
                      ✅ Complete Order
                    </button>
                  ) : (
                    <p className="in-progress">In Progress...</p>
                  )}
                </div>
              );
            })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            style={{ marginRight: '10px' }}
          >
            ⬅️ Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage(prev =>
                (prev + 1) * ITEMS_PER_PAGE < orders.length ? prev + 1 : prev
              )
            }
            disabled={(currentPage + 1) * ITEMS_PER_PAGE >= orders.length}
          >
            Next ➡️
          </button>
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplayPage;