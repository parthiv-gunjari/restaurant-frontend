import React, { useState } from 'react';
import { useCart } from '../context/CartContext'; // Add this at the top
import { BASE_URL } from '../utils/api';
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
  const { cart: contextCartItems } = useCart(); // Get fallback cart from context
  const cartItems = (propCartItems && propCartItems.length > 0) ? propCartItems : contextCartItems;
  const formattedCartItems = cartItems.map(item => ({
    itemId: item._id || item.itemId,
    quantity: item.quantity
  }));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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
        setForm({ name: '', email: '', notes: '' });
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Card Number</label>
        <div className="form-control p-2">
          <CardNumberElement options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
      </div>

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

      <div className="mb-3">
        <label className="form-label">ZIP Code</label>
        <input
          type="text"
          name="zip"
          className="form-control"
          placeholder="12345"
          value={form.zip || ''}
          onChange={(e) => setForm(prev => ({ ...prev, zip: e.target.value }))}
          required
        />
      </div>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {paymentSuccess && <div className="alert alert-success">✅ Payment successful! Order confirmed.</div>}

      <div className="alert alert-info mt-3">
        <strong>Test Cards for Stripe (Developer Mode):</strong>
        <ul className="mb-0">
          <li>💳 <code>4242 4242 4242 4242</code> — Visa (always succeeds)</li>
          <li>💳 <code>4000 0566 5566 5556</code> — Visa (debit)</li>
          <li>💳 <code>5555 5555 5555 4444</code> — Mastercard</li>
          <li>💳 <code>3782 822463 10005</code> — American Express (4-digit CVV)</li>
          <li>💳 <code>6011 1111 1111 1117</code> — Discover</li>
        </ul>
        Use any future expiry date and any 3 or 4-digit CVV as required and any 5 digit Zipcode.
      </div>

      <div className="d-flex justify-content-center">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || loading || storeClosed}
          style={storeClosed ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
