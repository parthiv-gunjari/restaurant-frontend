import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { BASE_URL } from '../utils/api';
import '../assets/css/CheckoutForm.css';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';

const CheckoutForm = ({ form, setForm, cartItems: propCartItems, clearCart, storeClosed, setStoreClosed, isStoreOpen }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cart: contextCartItems } = useCart();
  const cartItems = (propCartItems && propCartItems.length > 0) ? propCartItems : contextCartItems;

  const formattedCartItems = (cartItems || [])
    .filter(item => item && (item._id || item.itemId) && item.quantity !== undefined)
    .map(item => ({
      itemId: item._id || item.itemId,
      quantity: item.quantity
    }));

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!document.getElementById('test-card-container-style')) {
      const style = document.createElement('style');
      style.id = 'test-card-container-style';
      style.innerHTML = `
        .test-card-container {
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .test-card-container code {
          font-size: 1rem;
          font-weight: 600;
        }
        @media (min-width: 768px) {
          .test-card-container .alert {
            padding: 1.5rem;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (storeClosed || !isStoreOpen()) {
      setStoreClosed(true);
      return;
    }

    if (!form.name || !form.email) {
      setErrorMessage('Please fill in both name and email.');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!stripe || !elements) {
      setErrorMessage('Payment service is not ready. Please wait.');
      return;
    }

    setLoading(true);

    try {
      const paymentIntentRes = await axios.post(`${BASE_URL}/api/stripe/create-payment-intent`, {
        items: formattedCartItems,
        customer: {
          name: form.name,
          email: form.email
        }
      });

      const { clientSecret } = paymentIntentRes.data;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: form.name,
            email: form.email,
            address: {
              postal_code: form.zip || ''
            }
          }
        }
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        const cardDetailsRes = await axios.get(`${BASE_URL}/api/stripe/create-payment-intent/${result.paymentIntent.id}`);
        const cardDetails = cardDetailsRes.data || {};

        await axios.post(`${BASE_URL}/api/stripe/save-order`, {
          form,
          cartItems: formattedCartItems,
          paymentIntentId: result.paymentIntent.id,
          paymentStatus: result.paymentIntent.status,
          cardBrand: cardDetails?.cardBrand || 'Unknown',
          last4: cardDetails?.last4 || 'XXXX'
        });

        setPaymentSuccess(true);
        clearCart();
        setForm({ name: '', email: '', notes: '', zip: '' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Stripe error:', error);
      setErrorMessage(error.response?.data?.error || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status" />
        <p>Initializing payment service. Please wait...</p>
      </div>
    );
  }

  return (
    <div className="checkout-layout-wrapper">
      <div className="checkout-scrollable-content">
        <div className="checkout-form-wrapper">
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label">Your Name</label>
              <input type="text" name="name" className="form-control" placeholder="Your Name" value={form?.name ?? ''} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">Your Email</label>
              <input type="email" name="email" className="form-control" placeholder="Your Email" value={form?.email ?? ''} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label className="form-label">Any special instructions?</label>
              <textarea name="notes" className="form-control" rows="2" placeholder="Any special instructions?" value={form?.notes ?? ''} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>

            {/* Card Number */}
            <div className="mb-3">
              <label className="form-label">Card Number</label>
              <div className="form-control p-2">
                <CardNumberElement options={{ style: { base: { fontSize: '16px' } } }} />
              </div>
            </div>

            {/* Expiry + CVV */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Expiry</label>
                <div className="form-control p-2">
                  <CardExpiryElement options={{ style: { base: { fontSize: '16px' } } }} />
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">CVV</label>
                <div className="form-control p-2">
                  <CardCvcElement options={{ style: { base: { fontSize: '16px' } } }} />
                </div>
              </div>
            </div>

            {/* ZIP */}
            <div className="mb-3">
              <label className="form-label">ZIP Code</label>
              <input type="text" name="zip" className="form-control" placeholder="12345" value={form?.zip ?? ''} onChange={(e) => setForm(prev => ({ ...prev, zip: e.target.value }))} required />
            </div>

            {/* Error / Success */}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
            {paymentSuccess && <div className="alert alert-success">✅ Payment successful! Order confirmed.</div>}
          </form>
           <div className="checkout-sticky-footer d-flex justify-content-center">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || storeClosed || !isStoreOpen()}
          style={{
            opacity: storeClosed ? 0.6 : 1,
            cursor: storeClosed ? 'not-allowed' : 'pointer'
          }}
          onClick={handleSubmit}
        >
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>

          {/* Test Cards */}
          <div className="test-card-container">
            <div className="alert alert-info mt-3">
              <strong>Test Cards for Stripe (Developer Mode):</strong>
              <ul className="mb-0">
                <li>💳 <code>4242 4242 4242 4242</code> — Visa (always succeeds)</li>
                <li>💳 <code>4000 0566 5566 5556</code> — Visa (debit)</li>
                <li>💳 <code>5555 5555 5555 4444</code> — Mastercard</li>
                <li>💳 <code>3782 822463 10005</code> — Amex (4-digit CVV)</li>
                <li>💳 <code>6011 1111 1111 1117</code> — Discover</li>
              </ul>
              Use any future expiry date, CVV, and 5-digit ZIP code.
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Button */}
     
    </div>
  );
};

export default CheckoutForm;