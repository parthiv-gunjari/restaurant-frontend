import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import Spinner from 'react-bootstrap/Spinner';

const storeHours = {
  0: { open: '11:00', close: '22:00' }, // Sunday (11 AM – 10 PM)
  1: { open: '11:00', close: '23:00' }, // Monday
  2: { open: '11:00', close: '23:00' },
  3: { open: '11:00', close: '23:00' },
  4: { open: '11:00', close: '23:00' },
  5: { open: '00:00', close: '24:00' }, // Friday (24 hours)
  6: { open: '11:00', close: '24:00' }, // Saturday
};

function CheckoutPage() {
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    notes: '',
  });

  const [cartItems, setCartItems] = useState([]);
  const [storeClosed, setStoreClosed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state) {
      // Use default values to ensure controlled fields always have string values
      const {
        name = '',
        email = '',
        notes = '',
        items = [],
      } = location.state;
      setForm({ name, email, notes });
      setCartItems(items);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isStoreOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = storeHours[day].open.split(':').map(Number);
    const [closeH, closeM] = storeHours[day].close.split(':').map(Number);
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    return currentTime >= openTime && currentTime < closeTime;
  };

  const handlePlaceOrder = async () => {
    if (!isStoreOpen()) {
      setStoreClosed(true);
      return;
    }

    if (!form.name || !form.email) {
      alert("❗ Please fill in both name and email.");
      return;
    }

    // Defensive check: ensure cartItems is not empty before placing order
    if (!cartItems || cartItems.length === 0) {
      alert("❗ Your cart is empty.");
      return;
    }

    // Build email-style order summary
    const itemRows = cartItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

    const itemsHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h3 style="text-align:center;">🧾 Order Summary</h3>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid #ddd; text-align:left;">Item</th>
              <th style="border-bottom: 1px solid #ddd; text-align:left;">Qty</th>
              <th style="border-bottom: 1px solid #ddd; text-align:left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <td colspan="2" style="border-top: 1px solid #ccc;"><strong>Total</strong></td>
              <td style="border-top: 1px solid #ccc;"><strong>$${totalAmount}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 0.95rem; line-height: 1.5;">
          📍 We’ll notify you once your order is ready for pickup.<br />
          Instructions:<br />
          <em>"${form.notes || 'No special instructions'}"</em><br /><br />

          Thanks for choosing us!<br />
          
          – Team Parthiv’s Kitchen.
        </div>
      </div>
    `;

    const payload = {
      name: form.name,
      email: form.email,
      items: cartItems,
      notes: form.notes,
      itemsHtml // add this line
    };

    console.log('Submitting order payload:', payload);

    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '')}/api/orders`, payload);

      clearCart();
      setForm({ name: '', email: '', notes: '' });

      const msg = document.getElementById('success-msg');
      if (msg) {
        msg.style.display = 'block';
        setTimeout(() => {
          msg.style.display = 'none';
          navigate('/');
          setLoading(false);
        }, 2500);
      } else {
        setLoading(false);
      }
    } catch (err) {
      // Enhanced error logging: log err.response.data if present
      console.error("Checkout error:", err.response?.data || err.message);
      alert("❌ Failed to place order.");
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Finalize Your Order</h2>
      <div className="mt-4">
        <div className="mb-2">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="form-control"
            placeholder="Your Name"
            required
          />
        </div>
        <div className="mb-2">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="form-control"
            placeholder="Your Email"
            required
          />
        </div>
        <div className="mb-3">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="form-control"
            placeholder="Any special instructions?"
            rows={3}
          />
        </div>

        {loading && (
          <div className="text-center mb-3">
            {Spinner ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>
        )}

        <div className="d-flex justify-content-center">
          <button
            className="btn btn-success"
            onClick={handlePlaceOrder}
            disabled={storeClosed}
            style={storeClosed ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            Confirm Order
          </button>
        </div>

        <div
          id="success-msg"
          className="alert alert-success mt-3"
          style={{ display: 'none' }}
        >
          ✅ Order placed successfully!
        </div>
      </div>
      {storeClosed && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Store Closed</h5>
              </div>
              <div className="modal-body">
                <p>Sorry! Our kitchen is currently closed. Please try placing your order during store hours.</p>
                <p><strong>Store Hours:</strong><br />
                  Monday–Thursday: 11 AM – 11 PM<br />
                  Friday–Saturday: 11 AM – 12 AM (Midnight)<br />
                  Sunday: 11 AM – 10 PM
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setStoreClosed(false)}>
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;