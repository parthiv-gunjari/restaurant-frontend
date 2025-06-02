import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

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

  const handlePlaceOrder = async () => {
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
          
          – Team Parthiv’s and Divya's Restaurant
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

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '')}/api/orders`, payload);

      clearCart();
      setForm({ name: '', email: '', notes: '' });

      const msg = document.getElementById('success-msg');
      if (msg) {
        msg.style.display = 'block';
        setTimeout(() => {
          msg.style.display = 'none';
          navigate('/');
        }, 2500);
      }
    } catch (err) {
      // Enhanced error logging: log err.response.data if present
      console.error("Checkout error:", err.response?.data || err.message);
      alert("❌ Failed to place order.");
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

        <button className="btn btn-success" onClick={handlePlaceOrder}>
          Confirm Order
        </button>

        <div
          id="success-msg"
          className="alert alert-success mt-3"
          style={{ display: 'none' }}
        >
          ✅ Order placed successfully!
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;