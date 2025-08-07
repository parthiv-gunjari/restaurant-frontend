import React, { useEffect, useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { BASE_URL } from '../../../utils/api';
import '../../../assets/css/PaymentPage.css';
import axios from 'axios';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = new URLSearchParams(location.search).get('orderId');

  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const [order, setOrder] = useState(null);
  const [amountGiven, setAmountGiven] = useState('');
  const [changeToReturn, setChangeToReturn] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Fallback mechanism to fetch clientSecret if missing in URL
  useEffect(() => {
    const fetchClientSecretIfMissing = async () => {
      if (!clientSecret && order?._id) {
        try {
          const token =
            localStorage.getItem('waiterToken') ||
            localStorage.getItem('managerToken') ||
            localStorage.getItem('adminToken') ||
            localStorage.getItem('token');
          const res = await axios.post(`${BASE_URL}/api/stripe/create-payment-intent`, {
            orderId: order._id,
            customer: {
              name: order.name || '',
              email: order.email || '',
              notes: order.notes || ''
            }
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.clientSecret) {
            setClientSecret(res.data.clientSecret);
          }
        } catch (err) {
          console.error('⚠️ Failed to fetch clientSecret:', err);
          if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
            console.error('Response headers:', err.response.headers);
          }
        }
      }
    };
    fetchClientSecretIfMissing();
  }, [order]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOrder = async () => {
    try {
      const token =
        localStorage.getItem('waiterToken') ||
        localStorage.getItem('managerToken') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data.order);
      const paymentRes = await axios.post(`${BASE_URL}/api/stripe/create-payment-intent`, {
        orderId: res.data.order._id,
        customer: {
          name: res.data.order.name || '',
          email: res.data.order.email || '',
          notes: res.data.order.notes || ''
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (paymentRes.data?.clientSecret) {
        setClientSecret(paymentRes.data.clientSecret);
      }
    } catch (err) {
      console.error('Error loading order:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      }
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmountGiven(value);
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setChangeToReturn(Math.max(Number(value) - total, 0));
  };

const handlePayment = async () => {
  if (!order) return;

  const token =
    localStorage.getItem('waiterToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token');

  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    setLoading(true);

    if (paymentMode === 'card') {
      if (!stripe || !elements) {
        setMessage('Stripe not ready');
        setLoading(false);
        return;
      }

      if (!clientSecret) {
        setMessage("Stripe client secret not available.");
        setLoading(false);
        return;
      }

      console.log('[DEBUG] Calling stripe.confirmCardPayment with clientSecret:', clientSecret);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: order.name || 'Customer'
          }
        }
      });
      console.log('[DEBUG] Stripe confirm result:', result);

      if (result.error) {
        console.error(result.error.message);
        setMessage(`❌ ${result.error.message}`);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        setClientSecret('');
        const charges = result.paymentIntent?.charges?.data;
        const cardInfo = charges && charges.length > 0 ? charges[0].payment_method_details.card : {};

        await axios.patch(`${BASE_URL}/api/stripe/mark-paid/${order._id}`, {
          paymentIntentId: result.paymentIntent.id,
          paymentStatus: 'succeeded',
          cardBrand: cardInfo?.brand || '',
          last4: cardInfo?.last4 || ''
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (order.orderType === 'dinein' && order.tableId) {
          try {
            await axios.patch(`${BASE_URL}/api/tables/${order.tableId}/status`, {
              status: 'available'
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            console.error('⚠️ Failed to update table status:', err);
          }
        }

        setMessage('✅ Card payment successful via Stripe.');
        setTimeout(() => navigate('/admin/pos/orders'), 1000);
      }
    } else {
      // Cash logic
      if (Number(amountGiven) < total) {
        setMessage(`❌ Amount given ($${Number(amountGiven).toFixed(2)}) is less than total ($${total.toFixed(2)}).`);
        setLoading(false);
        return;
      }

      await axios.patch(`${BASE_URL}/api/orders/${order._id}/pay`, {
        paymentMode: 'cash',
        amountPaid: Number(amountGiven || total),
        changeReturned: changeToReturn,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (order.orderType === 'dinein' && order.tableId) {
        try {
          await axios.patch(`${BASE_URL}/api/tables/${order.tableId}/status`, {
            status: 'available'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('⚠️ Failed to update table status:', err);
        }
      }

      setMessage('✅ Cash payment recorded successfully.');
      setTimeout(() => navigate('/admin/pos/orders'), 1000);
    }
  } catch (err) {
    console.error('Payment error:', err);
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      console.error('Response headers:', err.response.headers);
    }
    setMessage('❌ Failed to record payment.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!clientSecret || !stripe || !elements) return;
    console.log('[DEBUG] PaymentPage loaded. clientSecret present:', clientSecret);
    // ⚠️ Just diagnostic — confirmCardPayment should NEVER be called here
  }, [clientSecret, stripe, elements]);

  if (!order) return <div className="p-4">Loading order...</div>;

  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="pos-layout-container">
      <div className="d-flex">
        {/* Mobile NavBar for mobile screens */}
        {isMobile && (
          <>
            <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 2000, display: 'flex', gap: '8px' }}>
              
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="btn btn-sm btn-light"
                style={{
                  background: '#0563bb',
                  color: 'white'
                }}
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
            <MobileNavBar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          </>
        )}
        {/* Sidebar Navigation - only show on desktop */}
        {!isMobile && <SideBar />}
        <div className="container p-4">
          <h3 className="mb-3 paymentHeader">🧾 Payment for Order #{order.orderCode}</h3>

          <ul className="list-group mb-3">
            {order.items.map((item, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between">
                <span>{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
            <li className="list-group-item d-flex justify-content-between fw-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </li>
          </ul>

          <div className="mb-4 d-flex gap-3">
            <div
              className={`p-3 rounded border text-center flex-fill ${paymentMode === 'cash' ? 'bg-success text-white' : 'bg-light'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setPaymentMode('cash')}
            >
              💵 <strong>Cash</strong>
            </div>
            <div
              className={`p-3 rounded border text-center flex-fill ${paymentMode === 'card' ? 'bg-primary text-white' : 'bg-light'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setPaymentMode('card')}
            >
              💳 <strong>Card</strong>
            </div>
          </div>

          {paymentMode === 'cash' && (
            <div className="mb-4">
              <label className="form-label fw-semibold">Amount Given</label>
              <input type="number" className="form-control fs-5" value={amountGiven} onChange={handleAmountChange} />
              <div className="mt-2 text-success fs-5 fw-bold">Change to return: ${changeToReturn.toFixed(2)}</div>
            </div>
          )}

          {paymentMode === 'card' && (
            <div className="mb-4">
              <label className="form-label fw-semibold">Card Number</label>
              <div className="p-2 border rounded">
                <CardNumberElement />
              </div>
              <label className="form-label fw-semibold mt-3">Expiry</label>
              <div className="p-2 border rounded">
                <CardExpiryElement />
              </div>
              <label className="form-label fw-semibold mt-3">CVC</label>
              <div className="p-2 border rounded">
                <CardCvcElement />
              </div>
            </div>
          )}

          {/* Stripe test card info for developer mode */}
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

          {message && <div className="alert alert-info">{message}</div>}

          <div className="text-center">
            <button className="btn btn-lg btn-success px-5" onClick={handlePayment} disabled={loading}>
              {loading ? 'Processing...' : 'Make Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;