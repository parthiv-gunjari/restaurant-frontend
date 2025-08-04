// MobileTableServicesPage.js
import React, { useEffect, useState } from 'react';
import MobileNavBar from './MobileNavBar';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import '../../../assets/css/MobileTableServicesPage.css';

import PinReasonModal from './PinReasonModal';

const MobileTableServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tableId = queryParams.get('tableId');
  const mode = queryParams.get('mode'); // 'take' or 'view'

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [clickedItems, setClickedItems] = useState({});
  const [notes, setNotes] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalPreviouslyOpen, setCartModalPreviouslyOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [initialQuantities, setInitialQuantities] = useState({});

  const [showPinModal, setShowPinModal] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState(null);
  const [modificationReason, setModificationReason] = useState('');
  const [hasModification, setHasModification] = useState(false);
  const [pinAction, setPinAction] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

useEffect(() => {
  fetchMenu();
  if (mode === 'view' && tableId) {
    fetchExistingOrder();
  }
}, [mode, tableId]);



useEffect(() => {
  if (mode !== 'view') return;
  if (Object.keys(initialQuantities).length === 0) return; // ⛔ skip until loaded

  const addedItems = cart.filter(i => !i.cartKey?.endsWith('-initial'));
  const modifiedInitials = cart.filter(i =>
    i.cartKey?.endsWith('-initial') &&
    initialQuantities[i._id] !== undefined &&
    i.quantity !== initialQuantities[i._id]
  );
  const removedInitials = Object.keys(initialQuantities).filter(
    id => !cart.find(i => i._id === id)
  );

  const hasChanges = addedItems.length > 0 || modifiedInitials.length > 0 || removedInitials.length > 0;
  setHasModification(hasChanges);
}, [cart, initialQuantities, mode]);


  const getItemStatus = (item) => {
    const isInitial = item.cartKey?.endsWith('-initial');
    const initialQty = initialQuantities[item._id];

    if (!isInitial) return 'new';
    if (initialQty !== undefined && item.quantity < initialQty) return 'decreased';
    if (initialQty !== undefined && item.quantity > initialQty) return 'increased';
    if (initialQty !== undefined && item.quantity === 0) return 'deleted';
    return 'unchanged';
  };

  const fetchMenu = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(res.data || []);
      setCategories(['All', ...new Set(res.data.map(item => item.category))]);
    } catch (err) {
      console.error('Menu fetch error:', err);
    }
  };

  const fetchExistingOrder = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/api/orders/by-table/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = res.data?.order;
      setOrderId(order._id);
      const items = await Promise.all(order.items.map(async i => {
        const itemId = typeof i.itemId === 'object' ? i.itemId._id : i.itemId || i._id;
        try {
          const res = await axios.get(`${BASE_URL}/api/menu/${itemId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const menuItem = res.data;
          return {
            ...menuItem,
            quantity: i.quantity,
            _id: itemId,
            itemId: itemId,
            cartKey: `${itemId}-initial`,
          };
        } catch (err) {
          console.warn(`⚠️ Menu item ${itemId} not found. Skipping.`);
          return null;
        }
      }));
      const filteredItems = items.filter(Boolean);
      setCart(filteredItems);
      const clickMap = {};
      const qtyMap = {};
      filteredItems.forEach(i => {
        clickMap[i._id] = true;
        qtyMap[i._id] = i.quantity;
      });
      setClickedItems(clickMap);
      setInitialQuantities(qtyMap);
      setNotes(order.notes || '');
    } catch (err) {
      console.error('Failed to load existing order:', err);
    }
  };
// Restore initialQuantities if they were not set on remount
useEffect(() => {
  if (
    mode === 'view' &&
    Object.keys(initialQuantities).length === 0 &&
    cart.length > 0
  ) {
    const qtyMap = {};
    cart.forEach((item) => {
      if (item.cartKey?.endsWith('-initial')) {
        qtyMap[item._id] = item.quantity;
      }
    });
    setInitialQuantities(qtyMap);
  }
}, [cart, initialQuantities, mode]);
  const getToken = () =>
    localStorage.getItem('waiterToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token');

  const addToCart = (item) => {
    setClickedItems(prev => ({ ...prev, [item._id]: true }));
    const exists = cart.find(i => i._id === item._id);
    const isInitial = initialQuantities[item._id] !== undefined;

    if (exists) {
      setCart(cart.map(i =>
        i._id === item._id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, {
        ...item,
        quantity: 1,
        cartKey: isInitial ? `${item._id}-initial` : `${item._id}-new`,
      }]);
    }
  };

  const updateQuantity = (itemId, delta, actionType = 'decrement') => {
    const targetItem = cart.find(i => i._id === itemId);
    if (!targetItem) return;

    const newQty = targetItem.quantity + delta;

    if (
      targetItem.cartKey?.endsWith('-initial') &&
      initialQuantities[targetItem._id] !== undefined &&
      newQty < initialQuantities[targetItem._id]
    ) {
      setItemPendingDelete({ ...targetItem, newQty });
      setPinAction('decrement');
      setCartModalPreviouslyOpen(showCartModal);
      setShowPinModal(true);
      return;
    }

    const updated = cart
      .map(item => {
        if (item._id === itemId) {
          const isInitial = initialQuantities[itemId] !== undefined;
          return {
            ...item,
            quantity: newQty,
            cartKey: isInitial ? `${itemId}-initial` : `${itemId}-new`,
          };
        }
        return item;
      })
      .filter(item => item.quantity > 0);

    setCart(updated);
    if (!updated.some(item => item._id === itemId)) {
      setClickedItems(prev => {
        const updatedClicks = { ...prev };
        delete updatedClicks[itemId];
        return updatedClicks;
      });
    }
  };

  const removeItem = (itemId, actionType = 'delete') => {
    const targetItem = cart.find(i => i._id === itemId);
    if (!targetItem) return;

    if (targetItem.cartKey?.endsWith('-initial') && actionType === 'delete') {
      setItemPendingDelete({ ...targetItem, newQty: 0 });
      setPinAction('delete');
      setCartModalPreviouslyOpen(showCartModal);
      setShowPinModal(true);
      return;
    }

    setCart(cart.filter(i => i._id !== itemId));
    setClickedItems(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert('Add items first');
    try {
      const token = getToken();
      const payload = {
        tableId,
        items: cart.map(i => ({ itemId: i._id, quantity: i.quantity })),
        notes,
      };

      if (mode === 'view') {
        await axios.patch(
          `${BASE_URL}/api/orders/${orderId}/modify`,
          { updatedItems: payload.items, reason: 'Modified via mobile' },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert('Order updated');

        const qtyMap = {};
        const clickMap = {};
        const updatedCart = cart.map(i => {
          qtyMap[i._id] = i.quantity;
          clickMap[i._id] = true;
          return { ...i, cartKey: `${i._id}-initial` };
        });

        setInitialQuantities(qtyMap);
        setClickedItems(clickMap);
        setCart(updatedCart);
        setHasModification(false);
      } else {
        await axios.post(`${BASE_URL}/api/orders/dinein`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Order placed');
      }

      navigate('/admin/pos/tables');
    } catch (err) {
      console.error(err);
      alert('Failed to place/update order');
    }
  };

  const handlePayNow = () => {
    if (!orderId) return alert('Order not loaded');
    navigate(`/admin/pos/payment?orderId=${orderId}`);
  };
  // --- Custom top navbar ---
  // --- End custom top navbar ---
  return (
    <>
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
        zIndex: 1200,
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
       
        <button
          onClick={() => setMenuOpen(true)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'white' }}
        >
          ☰
        </button>
         <button
          onClick={() => navigate('/admin/pos/tables')}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'white' }}
        >
          ←
        </button>
      </div>
      <strong>Parthiv’s Kitchen</strong>
      <div style={{ width: '1.5rem' }} />
    </div>
          
          <MobileNavBar open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
      )}

     <div
  className="mobile-table-wrapper"
  style={{
    marginTop: isMobile ? '0px' : 0,
    paddingBottom: '60px', // To prevent overlap by cart bar
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 56px)', // subtract navbar height
  }}
>
      <div className="mobile-table-menu">
       <div className="category-scroll">
  {categories.map((cat, index) => (
    <button
      key={cat}
      className={cat === selectedCategory ? 'active' : ''}
      onClick={() => setSelectedCategory(cat)}
      style={{
        '--i': index,
        '--total': categories.length,
        flex: '0 0 auto',
        marginRight: '8px',
      }}
    >
      {cat}
    </button>
  ))}
</div>

        <div className="items-grid">
  {menuItems
    .filter(i => selectedCategory === 'All' || i.category === selectedCategory)
    .map(item => {
      const inCart = cart.find(ci => ci._id === item._id);
      return (
        <div
          key={item._id}
          className={`item-card ${clickedItems[item._id] ? 'clicked' : ''} ${item.outOfStock ? 'out-of-stock' : ''}`}
        >
          <div className="item-name">{item.name}</div>
          <div className="item-price">${item.price.toFixed(2)}</div>

          {item.outOfStock ? (
            <div className="item-status">Out of Stock</div>
          ) : (
            <div className="qty-controls">
              <button onClick={() => updateQuantity(item._id, -1)} disabled={!inCart}>-</button>
              <span className="quantity-badge">{inCart ? inCart.quantity : 0}</span>
              <button onClick={() => addToCart(item)}>+</button>
            </div>
          )}
        </div>
      );
    })}
</div>

   <div
  className="mobile-cart-bar d-flex justify-content-between align-items-center px-3 py-2 bg-primary text-white shadow"
  style={{
    visibility: cart.length > 0 ? 'visible' : 'hidden',
    opacity: cart.length > 0 ? 1 : 0,
    pointerEvents: cart.length > 0 ? 'auto' : 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1050,
    height: '48px',
  }}
>
  <div
    className="d-flex align-items-center gap-2"
    onClick={() => setShowCartModal(true)}
    style={{ cursor: 'pointer' }}
  >
    <i className="bi bi-cart-fill fs-5"></i>
    <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</strong>
  </div>
  <button
    className="btn btn-success fw-bold"
    style={{ padding: '0.4rem 1rem' }}
    onClick={handlePayNow}
  >
    Pay Now <i className="bi bi-arrow-right-circle-fill ms-1"></i>
  </button>
</div>

{showCartModal && (
  <div className="cart-modal" style={{ zIndex: 1000 }} onClick={() => setShowCartModal(false)}>
    <div
      className="cart-modal-content bg-white rounded-3 p-3 shadow"
      onClick={(e) => e.stopPropagation()}
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      <div className="mb-3">
        <textarea
          className="form-control"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special notes..."
          rows={2}
        />
      </div>

      {[...cart]
        .sort((a, b) => {
          const aStatus = getItemStatus(a);
          const bStatus = getItemStatus(b);
          if (aStatus === 'deleted' && bStatus !== 'deleted') return 1;
          if (aStatus !== 'deleted' && bStatus === 'deleted') return -1;
          return 0;
        })
        .map((item) => {
          const status = getItemStatus(item);
          const statusStyles = {
            new: 'text-primary',
            increased: 'text-warning',
            decreased: 'text-warning',
            deleted: 'text-danger text-decoration-line-through',
          };
          const statusSymbols = {
            new: '🔹',
            increased: '🔺',
            decreased: '🔻',
            deleted: '❌',
          };
          const styleClass = statusStyles[status] || '';
          const symbol = statusSymbols[status] || '';

          return (
            <div
              key={item._id}
              className={`d-flex justify-content-between align-items-center mb-2 p-2 border rounded ${styleClass}`}
            >
              <strong className={styleClass}>
                {item.name} {symbol}
              </strong>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => updateQuantity(item._id, -1, 'decrement')}
                  disabled={status === 'deleted'}
                >
                  -
                </button>
                <span className={styleClass}>{item.quantity}</span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => updateQuantity(item._id, 1)}
                  disabled={status === 'deleted'}
                >
                  +
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeItem(item._id, 'delete')}
                  disabled={status === 'deleted'}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            </div>
          );
        })}

      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-danger w-50 me-2" onClick={() => setShowCartModal(false)}>
          Close
        </button>

        {mode === 'view' ? (
          <button className="btn btn-warning w-50" disabled={!hasModification} onClick={handlePlaceOrder}>
            Update Order
          </button>
        ) : (
          <button className="btn btn-success w-50" onClick={handlePlaceOrder}>
            Place Order
          </button>
        )}
      </div>

      {mode === 'view' && (
        <button className="btn btn-primary w-100 mt-3" onClick={handlePayNow}>
          Pay Now
        </button>
      )}
    </div>
  </div>
)}
        {showPinModal && (
          <PinReasonModal
            show={showPinModal}
            style={{ zIndex: 1100 }}
            onClose={() => {
              setShowPinModal(false);
              setItemPendingDelete(null);
              setModificationReason('');
            }}
            onConfirm={({ pin, reason }) => {
              if (itemPendingDelete) {
                const isSameItem = (i) => i._id === itemPendingDelete._id;
                let updatedItems;

                if (pinAction === 'delete') {
                  updatedItems = cart.filter(i => !isSameItem(i));
                } else if (pinAction === 'decrement') {
                  updatedItems = cart.map(i =>
                    isSameItem(i) ? { ...i, quantity: itemPendingDelete.newQty } : i
                  ).filter(i => i.quantity > 0);
                }

                setCart(updatedItems);
                setClickedItems(prev => {
                  const updatedClicks = { ...prev };
                  delete updatedClicks[itemPendingDelete._id];
                  return updatedClicks;
                });
                setHasModification(true);
                setShowPinModal(false);
                setItemPendingDelete(null);
                setModificationReason('');
                if (cartModalPreviouslyOpen) {
                  setShowCartModal(true);
                  setCartModalPreviouslyOpen(false);
                }
                setPinAction(null);
              }
            }}
          />
        )}
        </div>
      </div>
    </>
  );
};

export default MobileTableServicesPage;