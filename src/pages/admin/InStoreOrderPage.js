import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../utils/api';
import axios from 'axios';
import AdminNavbar from '../../components/AdminNavbar';
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
      const cats = [...new Set(items.map(i => i.category))];
      setCategories(cats);
      setSelectedCategory(cats[0] || '');
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const filteredItems = menuItems.filter(i => i.category === selectedCategory);

  // Loading fallback
  const isLoading = menuItems.length === 0 && categories.length === 0;

  const addToCart = (item) => {
    const existing = cart.find(i => i._id === item._id);
    if (existing) {
      setCart(cart.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart =>
      cart
        .map(item => item._id === itemId ? { ...item, quantity: item.quantity + delta } : item)
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2);
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
    } catch (err) {
      console.error('Error placing order:', err.response?.data || err.message);
      alert('Failed to place order. ' + (err?.response?.data?.message || err?.message || 'Please try again.'));
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="instore-layout">
        <div className="instore-left">
          <div className="order-info">
            <h2>Parthiv’s Kitchen</h2>
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
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="menu-section">
            {isLoading ? (
              <p style={{ padding: '1rem', color: '#888' }}>Loading menu...</p>
            ) : (
              <>
                <div className="category-list">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={cat === selectedCategory ? 'active' : ''}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="menu-grid">
                  {filteredItems.length > 0 ? (
                    <>
                      {filteredItems.map(item => (
                        <div
                          key={item._id}
                          className="menu-item"
                          onClick={() => addToCart(item)}
                        >
                          <div className="menu-item-name">{item.name}</div>
                          <div className="menu-item-price">${item.price.toFixed(2)}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ padding: '1rem', color: '#888' }}>No items available for this category.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="instore-right">
          <h2>🛒 Cart Summary</h2>
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

          <div className="form-group">
            <label>Notes:</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

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

          <h3>Total: ${calculateTotal()}</h3>

          <button className="place-order-btn" onClick={placeOrder}>✅ Place Order</button>
        </div>
      </div>
    </>
  );
};

export default InStoreOrderPage;