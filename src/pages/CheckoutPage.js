import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import Spinner from 'react-bootstrap/Spinner';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm'; // you'll create this component next

const storeHours = {
  0: { open: '00:00', close: '24:00' }, // Sunday
  1: { open: '00:00', close: '24:00' }, // Monday
  2: { open: '00:00', close: '24:00' },
  3: { open: '00:00', close: '24:00' },
  4: { open: '00:00', close: '24:00' },
  5: { open: '00:00', close: '24:00' }, // Friday
  6: { open: '00:00', close: '24:00' }, // Saturday
};

const stripePromise = loadStripe('pk_test_51RbF2F01yFGmy84L80DwTLIfKq8xEDCFG95g8Fh5v6VXUFlEpfieY7sna1jmIdx5gwAV8Xf6LuVAX1VZ9sgRE0o100wa7inwJh');

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

        <Elements stripe={stripePromise}>
          <CheckoutForm
            form={form}
            setForm={setForm}
            cartItems={cartItems}
            clearCart={clearCart}
            storeClosed={storeClosed}
            setStoreClosed={setStoreClosed}
            isStoreOpen={isStoreOpen}
          />
        </Elements>

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
      {(() => {
        const ordersPaused = localStorage.getItem('ordersPaused') === 'true';
        return ordersPaused ? (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title"><i className="fas fa-exclamation-triangle me-2"></i> Incoming Orders Paused</h5>
                </div>
                <div className="modal-body text-center">
                  <h5 className="text-danger fw-bold">Orders are currently paused for all customers.</h5>
                  <p className="mt-3"><i className="fas fa-stopwatch me-2"></i> Orders will resume once admin lifts the pause.</p>
                </div>
                <div className="modal-footer justify-content-center">
                  <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                    Okay
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}

export default CheckoutPage;