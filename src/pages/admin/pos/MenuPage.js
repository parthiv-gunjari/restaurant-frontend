import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BASE_URL } from '../../../utils/api';
import axios from 'axios';
import '../../../assets/css/Pos.css';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';


const POSPage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('walkin');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [clickedItems, setClickedItems] = useState({});
  const [discount, setDiscount] = useState(0);
  // const [selectedPanel, setSelectedPanel] = useState('menu'); // or 'tables'
  const [loadedOrder, setLoadedOrder] = useState(null);


  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Inject Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token =
        localStorage.getItem('waiterToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('token');
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

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      setClickedItems({});
    }
  };

  const placeOrder = async () => {
    if (!customerName || cart.length === 0) {
      alert('Please enter customer name and select items');
      return;
    }
    try {
      const isUpdate = !!loadedOrder;
      const token =
        localStorage.getItem('waiterToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('token');

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

      const response = await axios[isUpdate ? 'patch' : 'post'](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newOrderId = response?.data?.order?._id;

      alert('Order placed!');
      setCart([]);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setPaymentStatus('pending');
      setPaymentMode('Cash');
      setDiscount(0);
      setClickedItems({});
      setLoadedOrder(null);

      if (!isUpdate) {
        return response;
      }
    } catch (err) {
      alert('Failed to place order. ' + (err?.response?.data?.message || err?.message));
    }
  };

  const handlePayNow = async () => {
    const response = await placeOrder();
    const orderId = response?.data?.order?._id;
    if (!orderId) return;

    if (paymentMode === 'UPI') {
      try {
        const token =
          localStorage.getItem('waiterToken') ||
          localStorage.getItem('managerToken') ||
          localStorage.getItem('adminToken') ||
          localStorage.getItem('token');

        const res = await axios.post(
          `${BASE_URL}/api/razorpay/create-razorpay-order`,
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { razorOrderId, amount, currency } = res.data;
        const key = res.data.key || process.env.REACT_APP_RAZORPAY_KEY_ID;

        const options = {
          key,
          amount,
          currency,
          order_id: razorOrderId,
          name: 'Parthiv’s Kitchen',
          description: 'POS Payment',
          handler: async function (response) {
            await axios.post(
              `${BASE_URL}/api/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            navigate('/admin/pos/orders');
          },
          prefill: {
            name: customerName,
            email,
            contact: phone,
          },
          theme: {
            color: '#0f172a',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay error:', err);
        alert('Failed to initiate Razorpay payment');
      }
    } else {
      navigate(`/admin/pos/payment?orderId=${orderId}`);
    }
  };

  // MobileSidebarDrawer removed per new UX: use MobileNavBar as full-screen drawer.

  return (
    <>
    <div className="pos-container light-mode" style={{ position: 'relative' }}>
      {/* Top Navbar */}
      {isMobile ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '56px',

              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1rem',
              zIndex: 1400,
            }}
          >
            <button
              style={{
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Parthiv's Kitchen</h2>
            <div style={{ width: '1.5rem' }} /> {/* placeholder for spacing */}
          </div>
          <MobileNavBar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      ) : null}

      {/* Sidebar for desktop */}
      {!isMobile && <SideBar />}

      <main className="main-panel">
        <>
          <div className="search-bar-row">
            <div
              className="order-customer-row"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
                margin: '1rem 0',
              }}
            >
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                style={{ flex: '1 1 120px', minWidth: '120px' }}
              >
                <option value="walkin">Walk-In</option>
                <option value="togo">To-Go</option>
                <option value="callin">Call-In</option>
              </select>

              <input
                type="text"
                placeholder="Customer name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ flex: '2 1 160px', minWidth: '140px' }}
              />

              <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: '1 1 120px', minWidth: '120px' }}
              />

              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: '2 1 180px', minWidth: '150px' }}
              />
            </div>
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
                      <span className="quantity-badge">{inCart ? inCart.quantity : 0}</span>
                      <button onClick={() => addToCart(item)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      </main>

      <aside className="order-summary">
        <h2>🛒 Cart Summary</h2>
        <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
          {cart.length} items 
        </p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />

        <div className="cart-items-wrapper" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-danger" style={{ marginBottom: '0.5rem' }}>
              Clear Cart 🗑️
            </button>
          )}
          {cart.map(item => (
            <div key={item._id} className="cart-item">
              <p>{item.name}</p>
              <div className="qty-controls">
                <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                <span className="quantity-badge">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, 1)}>+</button>
              </div>
              <button onClick={() => removeItem(item._id)} className="delete-btn trash-icon">
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="payment-section">
          
<input
  type="number"
  placeholder="Enter discount"
  value={discount}
  onChange={(e) => setDiscount(Number(e.target.value))}
/>
        </div>

        <h3>Total: ${calculateTotal()}</h3>
        <button onClick={placeOrder}> Place Order</button>
        {paymentStatus === 'pending' && !loadedOrder && (
          <button className="btn btn-outline-primary mt-2" onClick={handlePayNow}>
            Pay Now 💳
          </button>
        )}
      </aside>
      {/* Fixed Bottom Bar for Mobile */}
      {isMobile && cart.length > 0 && (
        <div
          className="mobile-cart-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            background: '#0f172a',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            zIndex: 1500,
          }}
          onClick={() => setShowCartModal(true)}
        >
          <span>🛒 {cart.length} items</span>
          <button
            style={{
              background: 'white',
              color: '#0f172a',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              fontWeight: 'bold',
            }}
          >
            Pay Now ➡
          </button>
        </div>
      )}
    </div>
    {/* Cart Modal for Mobile */}
    {showCartModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(41, 85, 207, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 1600,
        }}
        onClick={() => setShowCartModal(false)}
      >
        <div
          style={{
            background: '#fff',
            width: '100%',
            maxHeight: '90vh',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            style={{ marginBottom: '0.75rem', minHeight: '60px' }}
          />
          <div style={{ overflowY: 'auto', flex: 1, marginBottom: '0.75rem' }}>
            {cart.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                  <button onClick={() => removeItem(item._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: '#fff',
              borderTop: '1px solid #ccc',
              paddingTop: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <button onClick={() => setShowCartModal(false)}>Close</button>
            <button onClick={handlePayNow}>Place Order</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default POSPage;