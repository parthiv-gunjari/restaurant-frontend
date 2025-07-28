// src/pages/pos/TableServicesPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/DineInTableMenu.css';
import '../../../assets/css/DineInOrderTables.css';
import '../../../assets/css/TableServicesPage.css';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';

const TableServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path);
  const [tables, setTables] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  // Modal state for Add More Items
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(fetchTables, 5000);
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tables`, {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem('waiterToken') ||
            localStorage.getItem('adminToken') ||
            localStorage.getItem('managerToken') ||
            localStorage.getItem('token')
          }`,
        },
      });
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/menu`);
      setMenu(res.data);
      const cats = [...new Set(res.data.map(item => item.category))];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  const handleTableClick = async (table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setSelectedItems([]);
      setNotes('');
      setShowAddItemsModal(true); // open modal for new order
    } else {
      if (table.currentOrderId) {
        try {
          const token =
            localStorage.getItem('waiterToken') ||
            localStorage.getItem('adminToken') ||
            localStorage.getItem('managerToken') ||
            localStorage.getItem('token');
          const response = await axios.get(`${BASE_URL}/api/orders/${table.currentOrderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const order = response.data?.order;
          if (
            order &&
            Array.isArray(order.items) &&
            order.items.every(item => (item.itemId || item._id) && item.quantity)
          ) {
            setSelectedTable(table);
            setSelectedItems(order.items.map(i => ({
              ...i,
              _id: i.itemId || i._id,
              itemId: i.itemId || i._id,
              cartKey: `${i.itemId || i._id}-initial`
            })));
          } else {
            console.error('Invalid order format from server:', response.data);
            alert('Invalid order format received. Some items may be missing itemId or quantity.');
          }
        } catch (error) {
          console.error('Failed to fetch order:', error);
          alert('Failed to load order for table');
        }
      }
    }
  };

  const handleAddToOrder = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.cartKey === `${item._id}-new`);
      if (exists) {
        return prev.map(i => i.cartKey === `${item._id}-new` ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...item, _id: item.itemId || item._id, itemId: item.itemId || item._id, quantity: 1, cartKey: `${item._id}-new` }];
      }
    });
  };

  const handlePlaceOrder = async () => {
    try {
      const token =
        localStorage.getItem('waiterToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('token');
      if (!token) {
        alert('No auth token found. Please login again.');
        return;
      }
      const orderPayload = {
        tableId: selectedTable._id,
        items: selectedItems.map(item => ({
          itemId: item.itemId || item._id || item.id,
          quantity: item.quantity
        })),
        notes
      };

      await axios.post(`${BASE_URL}/api/orders/dinein`, orderPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Order placed successfully!');
      setSelectedTable(null);
      setSelectedItems([]);
      setNotes('');
      setActiveCategory(null);
      fetchTables();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Error placing order. Please check console for more details.');
    }
  };

const getStatusColor = (status) => {
  switch (status) {
    case 'available': return 'success';  // Bootstrap green
    case 'occupied': return 'warning';   // Bootstrap orange
    default: return 'secondary';
  }
};
  const formatTimer = (startedAt, now) => {
    if (!startedAt) return { text: 'N/A', seconds: 0 };
    const diff = Math.floor((now - new Date(startedAt)) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    const text = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
    return { text, seconds: diff };
  };

  return (
    <div className="pos-container light-mode">
      {/* Sidebar Navigation */}
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
      Logged in as: {localStorage.getItem('fullName') || localStorage.getItem('username') || 'Unknown'} ({localStorage.getItem('role') || 'Role Unknown'})
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

      {/* Center panel */}
      <main className="main-panel">
        <div className="container mt-4">
          <h2 className="mb-3 text-center">Dine-In Tables</h2>
          <div className="table-grid">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLabel) => (
              <div key={rowLabel} className="table-row d-flex flex-wrap mb-3">
                {tables
                  .filter((table) => table.tableNumber.startsWith(rowLabel))
                  .map((table) => (
                    <div
                      key={table._id}
                      className={`table-card me-2 mb-2 border border-2 border-${getStatusColor(table.status)}`}
                    >
                      <h6>Table {table.tableNumber}</h6>
                      <p className="small">Status: <strong>{table.status}</strong></p>
                      {table.status === 'occupied' && (() => {
                        const { text, seconds } = formatTimer(table.startedAt, now);
                        let color = 'green';
                        if (seconds > 1800) color = 'red';
                        else if (seconds > 900) color = 'orange';
                        return <p className="small" style={{ color }}>⏱️ {text}</p>;
                      })()}
                      {table.status === 'occupied' && (
                        <p className="small">👤 {table.waiterName || 'N/A'}</p>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-primary mt-1 w-100"
                        onClick={() => handleTableClick(table)}
                      >
                        {table.status === 'available' ? 'Take' : 'View'}
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right Cart Panel */}
      <aside className="order-summary p-3 border-start" style={{ minWidth: '300px' }}>
        {selectedTable && (
          <>
            <h5 className="mb-3">🪑 Table {selectedTable.tableNumber}</h5>
            {selectedItems.length === 0 ? (
              <p>No items added yet.</p>
            ) : (
              <ul className="list-unstyled">
        {selectedItems.map((item) => (
          <li key={item.cartKey} className="mb-2 d-flex align-items-center justify-content-between">
            <div>
              <span className="fw-semibold">{item.name}</span>
              <div className="btn-group ms-2" role="group" aria-label="Quantity controls">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                  setSelectedItems(prev => prev.flatMap(i => {
                    if (i.cartKey !== item.cartKey) return [i];
                    if (i.quantity > 1) return [{ ...i, quantity: i.quantity - 1 }];
                    return [];
                  }))
                }}>-</button>
                <span className="mx-2">{item.quantity}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                  setSelectedItems(prev => prev.map(i => i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i))
                }}>+</button>
              </div>
            </div>
            <button className="btn btn-sm btn-outline-danger" onClick={() => {
              setSelectedItems(prev => prev.filter(i => i.cartKey !== item.cartKey))
            }}>🗑️</button>
          </li>
        ))}
              </ul>
            )}
            {/* Add More Items button */}
            <button className="btn btn-warning w-100 mb-2" onClick={() => setShowAddItemsModal(true)}>
              ➕ Add More Items
            </button>
            <textarea
              className="form-control mb-2"
              placeholder="Special notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            {selectedTable?.status === 'occupied' ? (
              <button
                className="btn btn-primary w-100 mb-2 update-order-btn"
                disabled={selectedItems.length === 0}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('waiterToken') || localStorage.getItem('managerToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');
                    if (!token) return alert('No auth token');
                    await axios.patch(`${BASE_URL}/api/orders/${selectedTable.currentOrderId}/modify`, {
                      updatedItems: selectedItems.map(item => ({
                        itemId: item.itemId || item._id,
                        quantity: item.quantity
                      })),
                      reason: 'Updated via POS Table View',
                    }, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    alert('Order updated successfully!');
                    fetchTables();
                  } catch (err) {
                    console.error('Failed to update order:', err);
                    alert('Failed to update order');
                  }
                }}
              >
                🔄 Update Order
              </button>
            ) : (
              <button
                className="btn btn-success w-100 mb-2"
                disabled={selectedItems.length === 0}
                onClick={handlePlaceOrder}
              >
                ✅ Place Order
              </button>
            )}
            {selectedTable?.status === 'occupied' && (
              <button
                className="btn btn-outline-success w-100 mb-2"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('waiterToken') || localStorage.getItem('managerToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');
                    if (!token) return alert('No auth token');
                    await axios.patch(`${BASE_URL}/api/orders/${selectedTable.currentOrderId}/complete`, {}, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      }
                    });
                    alert('Order marked as paid');
                    setSelectedTable(null);
                    setSelectedItems([]);
                    fetchTables();
                  } catch (err) {
                    console.error('Failed to complete order:', err);
                    alert('Failed to complete order');
                  }
                }}
              >
                💰 Mark as Paid
              </button>
            )}
            <button className="btn btn-secondary w-100" onClick={() => setSelectedTable(null)}>Cancel</button>
          </>
        )}
        {/* Add More Items Modal */}
        {showAddItemsModal && (
          <div className="modal-backdrop">
            <div className="modal-content modal-scroll-wrapper p-4 bg-white rounded shadow">
              <h5 className="mb-3">Add More Items</h5>
              <div className="mb-3">
                <div className="mb-2">
                  <select
                    className="form-select"
                    value={activeCategory || 'all'}
                    onChange={(e) => setActiveCategory(e.target.value === 'all' ? null : e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="menu-items-grid modal-menu-grid">
                  {menu
                    .filter((item) => !activeCategory || item.category === activeCategory)
                    .map((item) => (
                      <div
                        key={item._id}
                        className={`menu-item-card border ${selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) ? 'bg-success text-white' : ''}`}
                      >
                        <div className="menu-item-info">
                          <div className="fw-semibold">
                            {item.name}
                            {selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) && (
                              <span className="badge bg-light text-dark ms-2">
                                Qty: {selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`)?.quantity}
                              </span>
                            )}
                          </div>
                          <small className="text-muted">${item.price.toFixed(2)}</small>
                        </div>
                        <div className="menu-item-actions">
                          {selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) ? (
                            <>
                              <button
                                className="btn btn-sm btn-light"
                                onClick={() =>
                                  setSelectedItems(prev => prev.flatMap(i => {
                                    if (i.cartKey !== `${item._id}-new` && i.cartKey !== `${item._id}-initial`) return [i];
                                    if (i.quantity > 1) return [{ ...i, quantity: i.quantity - 1 }];
                                    return [];
                                  }))
                                }
                              >-</button>
                              <span className="mx-2 fw-bold">{selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`)?.quantity}</span>
                              <button
                                className="btn btn-sm btn-light"
                                onClick={() =>
                                  setSelectedItems(prev => prev.map(i => (i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) ? { ...i, quantity: i.quantity + 1 } : i))
                                }
                              >+</button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleAddToOrder(item)}
                            >
                              ➕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <button className="btn btn-secondary" onClick={() => setShowAddItemsModal(false)}>Cancel</button>
                {selectedTable?.status === 'available' ? (
                  <button
                    className="btn btn-success"
                    onClick={() => setShowAddItemsModal(false)}
                  >
                    💾 Save Items
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      const token =
                        localStorage.getItem('waiterToken') ||
                        localStorage.getItem('managerToken') ||
                        localStorage.getItem('adminToken') ||
                        localStorage.getItem('token');
                      if (!token) return alert('No auth token. Please login.');
                      try {
                        await axios.patch(`${BASE_URL}/api/orders/${selectedTable.currentOrderId}/modify`, {
                          updatedItems: selectedItems.map(item => ({
                            itemId: item.itemId || item._id,
                            quantity: item.quantity
                          })),
                          reason: 'Updated from POS TableServices modal',
                        }, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        setShowAddItemsModal(false);
                      } catch (error) {
                        console.error('Error updating order:', error);
                        alert('Failed to update order');
                      }
                    }}
                  >
                    💾 Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default TableServicesPage;