


import React, { useEffect, useState } from 'react';

import MobileNavBar from './MobileNavBar';
import SideBar from './SideBar';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/DineInTableMenu.css';
import '../../../assets/css/DineInOrderTables.css';
import '../../../assets/css/TableServicesPage.css';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import '../../../assets/css/Pos.css';

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
  const [showPinModal, setShowPinModal] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState(null);
  // Track reason for modification
  const [modificationReason, setModificationReason] = useState('');
  // PIN modal state
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [pinError, setPinError] = useState('');
  // Track if there is a modification to the order
  const [hasModification, setHasModification] = useState(false);

  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

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

  // Listen for window resize to update isMobile and close drawer on desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  if (isMobile) {
    const mode = table.status === 'available' ? 'take' : 'view';
    navigate(`/admin/pos/mobile-table-services?tableId=${table._id}&mode=${mode}`);
    return;
  }

  // Desktop fallback
  if (table.status === 'available') {
    setSelectedTable(table);
    setSelectedItems([]);
    setNotes('');
    setShowAddItemsModal(true);
    setHasModification(false);
  } else {
    if (table.currentOrderId) {
      try {
        const token =
          localStorage.getItem('waiterToken') ||
          localStorage.getItem('adminToken') ||
          localStorage.getItem('managerToken') ||
          localStorage.getItem('token');
        const response = await axios.get(
          `${BASE_URL}/api/orders/${table.currentOrderId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
          setHasModification(false);
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
  const hasNewItems = selectedItems.some(item => item.cartKey.endsWith('-new'));

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
      <div className="pos-layout-container light-mode" style={{ marginTop: isMobile ? '56px' : 0 }}>
        {/* Sidebar Navigation - only show on desktop */}
        {!isMobile && <SideBar />}

        {/* Center panel */}
       <main className="main-panel">
  <div className="container mt-4">
    <h2 className="mb-3 text-center">Dine-In Tables</h2>

    <div className="table-grid-wrapper">
      <div className="table-grid">
        {tables.map((table) => (
          <div
            key={table._id}
            className={`table-card border border-2 border-${getStatusColor(table.status)}`}
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
  <div className="cart-items-list">
    {selectedItems.map((item) => (
      <div key={item.cartKey} className="cart-item">
        <div className="cart-item-info">{item.name}</div>
        <div className="cart-item-controls">
          <div className="btn-group" role="group" aria-label="Quantity controls">
            <button
              onClick={() => {
                if (item.cartKey.endsWith('-initial')) {
                  setItemPendingDelete(item);
                  setShowPinModal(true);
                } else {
                  setSelectedItems((prev) =>
                    prev.flatMap((i) => {
                      if (i.cartKey !== item.cartKey) return [i];
                      if (i.quantity > 1) return [{ ...i, quantity: i.quantity - 1 }];
                      return [];
                    })
                  );
                  if (item.cartKey.endsWith('-initial')) {
                    setHasModification(true);
                  }
                }
              }}
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={() => {
                setSelectedItems((prev) =>
                  prev.map((i) =>
                    i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i
                  )
                );
                if (item.cartKey.endsWith('-initial')) {
                  setHasModification(true);
                }
              }}
            >
              +
            </button>
          </div>
          <button
            onClick={() => {
              if (item.cartKey.endsWith('-initial')) {
                setItemPendingDelete(item);
                setShowPinModal(true);
              } else {
                setSelectedItems((prev) => prev.filter((i) => i.cartKey !== item.cartKey));
                if (item.cartKey.endsWith('-initial')) {
                  setHasModification(true);
                }
              }
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    ))}
  </div>
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
                  disabled={!(hasModification || hasNewItems) || !selectedTable}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('waiterToken') || localStorage.getItem('managerToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');
                      if (!token) return alert('No auth token');

                      const updatedItems = selectedItems.map(item => ({
                        itemId: item.itemId || item._id,
                        quantity: item.quantity
                      }));

                      await axios.patch(`${BASE_URL}/api/orders/${selectedTable.currentOrderId}/modify`, {
                        updatedItems,
                        reason: modificationReason || 'Modified via POS Table View',
                      }, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });

                      alert('Order updated successfully!');
                      fetchTables();
                      setHasModification(false);
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
                  className="btn btn-success w-100 mb-2"
                  onClick={() => navigate(`/admin/pos/payment?orderId=${selectedTable.currentOrderId}`)}
                >
                  💳 Pay Now
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
                          className={`menu-item-card border ${
  selectedItems.find(i =>
    (i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) &&
    i.quantity > 0
  )
    ? 'selected-item'
    : ''
}`}
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
                                  onClick={() => {
                                    setSelectedItems(prev => prev.flatMap(i => {
                                      if (i.cartKey !== `${item._id}-new` && i.cartKey !== `${item._id}-initial`) return [i];
                                      if (i.quantity > 1) return [{ ...i, quantity: i.quantity - 1 }];
                                      return [];
                                    }));
                                    const found = selectedItems.find(i => i.cartKey === `${item._id}-initial`);
                                    if (found) {
                                      setHasModification(true);
                                    }
                                  }}
                                >-</button>
                                <span className="mx-2 fw-bold">{selectedItems.find(i => i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`)?.quantity}</span>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => {
                                    setSelectedItems(prev => prev.map(i => (i.cartKey === `${item._id}-new` || i.cartKey === `${item._id}-initial`) ? { ...i, quantity: i.quantity + 1 } : i));
                                    const found = selectedItems.find(i => i.cartKey === `${item._id}-initial`);
                                    if (found) {
                                      setHasModification(true);
                                    }
                                  }}
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
        {showPinModal && (
          <div className="modal-backdrop d-flex justify-content-center align-items-center">
            <div className="modal-content bg-white p-4 rounded shadow" style={{ maxWidth: 400, width: '100%' }}>
              <h5 className="mb-3 text-center">🔒 Enter PIN & Reason</h5>

              <div className="mb-3">
                <label className="form-label">PIN</label>
                <input
                  type="password"
                  className="form-control"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Reason</label>
                <select
                  className="form-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="Out of stock">Out of stock</option>
                  <option value="Replaced with another item">Replaced with another item</option>
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Wrong order placed">Wrong order placed</option>
                </select>
              </div>

              {pinError && <div className="text-danger mb-3">{pinError}</div>}

              <div className="d-flex justify-content-between">
                <button className="btn btn-secondary w-45" onClick={() => {
                  setShowPinModal(false);
                  setItemPendingDelete(null);
                  setPin('');
                  setReason('');
                  setPinError('');
                }}>Cancel</button>
                <button className="btn btn-primary w-45" onClick={() => {
                  if (pin.trim() !== '1234') {
                    setPinError('❌ Invalid PIN');
                    return;
                  }
                  if (!reason) {
                    setPinError('⚠️ Please select a reason');
                    return;
                  }
                  if (itemPendingDelete) {
                    let updatedItems;
                    const isSameItem = (i) => i.cartKey === itemPendingDelete.cartKey;

                    if (itemPendingDelete.quantity === 1) {
                      updatedItems = selectedItems.filter(i => !isSameItem(i));
                    } else {
                      updatedItems = selectedItems.map(i =>
                        isSameItem(i) ? { ...i, quantity: i.quantity - 1 } : i
                      );
                    }

                    setSelectedItems(updatedItems);
                    setHasModification(true);
                    setModificationReason(reason);
                    setShowPinModal(false);
                    setItemPendingDelete(null);
                    setPin('');
                    setReason('');
                    setPinError('');
                  }
                }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
        {/* Mobile fixed cart bar and cart modal */}
        {isMobile && selectedItems.length > 0 && (
          <div className="fixed-bottom-cart-bar">
            <button className="btn btn-light" onClick={() => setShowCartModal(true)}>🛒 {selectedItems.length} items</button>
            <button className="btn btn-success" onClick={() => {
              if (selectedTable?.status === 'occupied') {
                navigate(`/admin/pos/payment?orderId=${selectedTable.currentOrderId}`);
              } else {
                handlePlaceOrder();
              }
            }}>Pay Now ➡</button>
          </div>
        )}

        {showCartModal && (
          <div className="cart-modal-backdrop" onClick={() => setShowCartModal(false)}>
            <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
              <h5 className="mb-3">🛒 Cart Summary</h5>
              <textarea className="form-control mb-2" placeholder="Special notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="cart-items-scroll">
                {selectedItems.map((item) => (
                  <div key={item.cartKey} className="cart-item-row d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="btn-group ms-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                          if (item.cartKey.endsWith('-initial')) {
                            setItemPendingDelete(item);
                            setShowPinModal(true);
                          } else {
                            setSelectedItems(prev => prev.flatMap(i => {
                              if (i.cartKey !== item.cartKey) return [i];
                              if (i.quantity > 1) return [{ ...i, quantity: i.quantity - 1 }];
                              return [];
                            }));
                          }
                        }}>-</button>
                        <span className="mx-2">{item.quantity}</span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                          setSelectedItems(prev => prev.map(i => i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i));
                        }}>+</button>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => {
                      if (item.cartKey.endsWith('-initial')) {
                        setItemPendingDelete(item);
                        setShowPinModal(true);
                      } else {
                        setSelectedItems(prev => prev.filter(i => i.cartKey !== item.cartKey));
                      }
                    }}>🗑️</button>
                  </div>
                ))}
              </div>
              <div className="modal-cart-footer mt-3 d-flex justify-content-between">
                <button className="btn btn-secondary" onClick={() => setShowCartModal(false)}>Close</button>
                <button className="btn btn-success" onClick={() => {
                  setShowCartModal(false);
                  if (selectedTable?.status === 'occupied') {
                    navigate(`/admin/pos/payment?orderId=${selectedTable.currentOrderId}`);
                  } else {
                    handlePlaceOrder();
                  }
                }}>Place Order</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TableServicesPage;