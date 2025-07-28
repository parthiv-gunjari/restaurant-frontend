// POSPage.js (Refactored from InStoreOrderPage.js)
// ✅ Uses existing logic with new layout and light theme styling

import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../utils/api';
import axios from 'axios';
import '../../assets/css/Pos.css';
import DineInOrderTables from './DineInOrderTables';

const POSPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('walkin');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [clickedItems, setClickedItems] = useState({});
  const [discount, setDiscount] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState('menu'); // or 'tables'
  const [loadedOrder, setLoadedOrder] = useState(null);

  // Loads an existing dine-in order for a table and injects it into the cart
  const loadDineInOrder = async (order) => {
    try {
      if (!order || !Array.isArray(order.items)) {
        throw new Error('Invalid order format: items missing');
      }

      const token = localStorage.getItem('token');
      const { data: allMenu } = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const enriched = order.items.map(orderedItem => {
        const full = allMenu.find(m => m._id === orderedItem.itemId || m._id === orderedItem.itemId?._id);
        if (!full) {
          console.warn('Menu item not found for:', orderedItem);
          return null;
        }
        return {
          _id: full._id,
          name: full.name,
          price: full.price,
          quantity: orderedItem.quantity
        };
      }).filter(Boolean);

      setCart(enriched);
      setCustomerName(order.name || '');
      setPhone(order.phone || '');
      setEmail(order.email || '');
      setNotes(order.notes || '');
      setPaymentStatus(order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid');
      setPaymentMode(order.paymentMode || 'Cash');
      setOrderType('dinein');
      setLoadedOrder(order);
    } catch (err) {
      console.error('Failed to load dine-in order', err);
      alert('Failed to load order for table');
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = response.data || [];
      setMenuItems(items);
      setCategories(['All', ...new Set(items.map(i => i.category))]);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const filteredItems = menuItems
    .filter(i => selectedCategory === 'All' || i.category === selectedCategory)
    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (item) => {
    setClickedItems(prev => ({ ...prev, [item._id]: true }));
    const existing = cart.find(i => i._id === item._id);
    if (existing) {
      setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    const updatedCart = cart
      .map(item => item._id === itemId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0);
    setCart(updatedCart);
    if (!updatedCart.some(item => item._id === itemId)) {
      setClickedItems(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };

  const removeItem = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
    setClickedItems(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const discountAmount = (subtotal * discount) / 100;
    return (subtotal - discountAmount).toFixed(2);
  };

  const placeOrder = async () => {
    if (!customerName || cart.length === 0) {
      alert('Please enter customer name and select items');
      return;
    }
    try {
      const isUpdate = !!loadedOrder;
      const token = localStorage.getItem('token');

      const url = isUpdate
        ? `${BASE_URL}/api/orders/${loadedOrder._id}/modify`
        : `${BASE_URL}/api/orders/${orderType}`;

      const payload = isUpdate
        ? {
            updatedItems: cart.map(item => ({ itemId: item._id, quantity: item.quantity })),
            reason: 'Modified via POS'
          }
        : {
            name: customerName,
            email,
            phone,
            orderType,
            paymentStatus: paymentStatus.toLowerCase(),
            paymentMode: paymentMode.toLowerCase(),
            items: cart.map(item => ({ itemId: item._id, quantity: item.quantity })),
            notes
          };

      await axios[isUpdate ? 'patch' : 'post'](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order placed!');
      setCart([]);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setPaymentStatus('Unpaid');
      setPaymentMode('Cash');
      setDiscount(0);
      setClickedItems({});
      setLoadedOrder(null);
    } catch (err) {
      alert('Failed to place order. ' + (err?.response?.data?.message || err?.message));
    }
  };

  return (
    <div className="pos-container light-mode">
      <aside className="sidebar">
        <ul>
          <li>Reservation</li>
          <li onClick={() => setSelectedPanel('tables')} className={selectedPanel === 'tables' ? 'active' : ''}>Table Services</li>
          <li onClick={() => setSelectedPanel('menu')} className={selectedPanel === 'menu' ? 'active' : ''}>Menu</li>
          <li>Orders</li>
          <li>Accounting</li>
        </ul>
      </aside>

      <main className="main-panel">
        {selectedPanel === 'menu' ? (
          <>
            <div className="search-bar-row">
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="walkin">Walk-In</option>
                <option value="togo">To-Go</option>
                <option value="callin">Call-In</option>
              </select>

              <input
                type="text"
                placeholder="Customer name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-carousel">
              {categories.map((cat, index) => {
                const count = cat === 'All'
                  ? menuItems.length
                  : menuItems.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    className={cat === selectedCategory ? 'active' : ''}
                    style={{ '--i': index, '--total': categories.length }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="count">{count} items</span>
                  </button>
                );
              })}
            </div>

            <div className="items-grid">
              {filteredItems.map(item => {
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
                        <span>{inCart ? inCart.quantity : 0}</span>
                        <button onClick={() => addToCart(item)}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="table-overview">
              <span>T4 - Leslie K. | 6 items | In Process</span>
              <span>T2 - Jacob J. | 4 items | Kitchen</span>
            </div>
          </>
        ) : (
          <DineInOrderTables onViewOrder={(order) => {
            loadDineInOrder(order);
            setSelectedPanel('menu');
          }} />
        )}
      </main>

      <aside className="order-summary">
        <h2>🛒 Cart Summary</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />

        {cart.map(item => (
          <div key={item._id} className="cart-item">
            <p>{item.name}</p>
            <div className="qty-controls">
              <button onClick={() => updateQuantity(item._id, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item._id, 1)}>+</button>
            </div>
            <button onClick={() => removeItem(item._id)} className="delete-btn">
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        ))}

        <div className="payment-section">
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Pay Later</option>
          </select>

          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Mixed">Mixed</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="number"
            placeholder="Discount %"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </div>

        <h3>Total: ${calculateTotal()}</h3>
        <button onClick={placeOrder}>✅ Place Order</button>
      </aside>
    </div>
  );
};

export default POSPage;