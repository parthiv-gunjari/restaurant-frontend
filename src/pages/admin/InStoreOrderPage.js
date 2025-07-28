import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../utils/api';
import axios from 'axios';

import '../../assets/css/InStoreOrderPage.css';


const InStoreOrderPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('walkin');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [clickedItems, setClickedItems] = useState({});
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token used:', token);
      const response = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Menu response:', response.data);
      const items = response.data || [];
      setMenuItems(items);
      setCategories(['All', ...new Set(items.map(i => i.category))]);
      setSelectedCategory('All');
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const filteredItems = menuItems
    .filter(i => selectedCategory === 'All' || i.category === selectedCategory)
    .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Loading fallback
  const isLoading = menuItems.length === 0;

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
      const token = localStorage.getItem('token');
      // Capitalize paymentStatus and paymentMode for backend enum casing
      const formattedPaymentStatus = paymentStatus.toLowerCase();
      const formattedPaymentMode = paymentMode.toLowerCase();
      // Console log payload for debugging
      console.log('Placing in-store order with payload:', {
        name: customerName,
        email,
        phone,
        orderType,
        paymentStatus: formattedPaymentStatus,
        paymentMode: formattedPaymentMode,
        items: cart.map(item => ({
          itemId: item._id,
          quantity: item.quantity
        })),
        notes
      });
      const endpoint = orderType === 'walkin' ? 'walkin' : orderType;
      await axios.post(`${BASE_URL}/api/orders/${endpoint}`, {
        name: customerName,
        email,
        phone,
        orderType,
        paymentStatus: formattedPaymentStatus,
        paymentMode: formattedPaymentMode,
        items: cart.map(item => ({
          itemId: item._id,
          quantity: item.quantity
        })),
        notes
      }, {
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
    } catch (err) {
      console.error('Error placing order:', err.response?.data || err.message);
      alert('Failed to place order. ' + (err?.response?.data?.message || err?.message || 'Please try again.'));
    }
  };

  return (
    <>
      
      <div className="instore-layout" style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
        <div
          className="instore-left"
          style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
        >
          <div className="order-info">
            
            <div className="form-row">
              <div className="form-group">
                <label>Order Type:</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option value="walkin">Walk-In</option>
                  <option value="togo">To-Go</option>
                  <option value="callin">Call-In</option>
                </select>
              </div>
              <div className="form-group">
                <label>Customer Name *</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Search Items</label>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px', fontSize: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="menu-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              className="menu-scrollable"
              style={{ flex: 1, overflowY: 'auto' }}
            >
              {isLoading ? (
                <p style={{ padding: '1rem', color: '#888' }}>Loading menu...</p>
              ) : (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', width: '100%' }}>
                  
                  <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div className="category-list">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cat === selectedCategory ? 'active' : ''}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="menu-grid">
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                          <div
                            key={item._id}
                            className={`menu-item ${clickedItems[item._id] ? 'clicked' : ''} ${item.outOfStock ? 'disabled' : ''}`}
                            onClick={() => !item.outOfStock && addToCart(item)}
                          >
                            <div className="menu-item-name">{item.name}</div>
                            <div className="menu-item-price">${item.price.toFixed(2)}</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ padding: '1rem', color: '#888' }}>No items available for this category.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="instore-right" style={{ display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 0 }}>
          <div
            className="cart-scroll"
            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
          >
            <h2 style={{ textAlign: 'center' }}>🛒 Cart Summary</h2>
            <div className="form-group">
              <label>Notes:</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <p>{item.name}</p>
                <div className="qty-controls">
                  <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                </div>
                <button onClick={() => removeItem(item._id)}>🗑️</button>
              </div>
            ))}
          </div>
          <div
            className="fixed-bottom-actions"
            style={{
              position: 'sticky',
              bottom: 0,
              background: '#fff',
              padding: '1rem 0',
              borderTop: '1px solid #ccc',
              zIndex: 1
            }}
          >
            <div className="form-row payment-options-row">
  <div className="form-group">
    <label>Payment Status:</label>
    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
      <option value="Paid">Paid</option>
      <option value="Unpaid">Pay Later</option>
    </select>
  </div>
  <div className="form-group">
    <label>Payment Mode:</label>
    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
      <option value="Cash">Cash</option>
      <option value="Card">Card</option>
      <option value="UPI">UPI</option>
      <option value="Mixed">Mixed</option>
      <option value="Other">Other</option>
    </select>
  </div>
  <div className="form-group">
    <label>Discount (%)</label>
    <input
      type="number"
      className="form-control"
      value={discount}
      min="0"
      max="100"
      onChange={(e) => setDiscount(Number(e.target.value))}
    />
  </div>
</div>

<h3>Total: ${calculateTotal()}</h3>
<button className="place-order-btn" onClick={placeOrder}>
  ✅ Place Order
</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InStoreOrderPage;