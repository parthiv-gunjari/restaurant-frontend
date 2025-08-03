import React, { useEffect, useState } from 'react';
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
    } catch (err) {
      console.error('Error loading order:', err);
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
        // Since CardElement and Stripe integration removed, simulate success for UI only.
        await axios.patch(`${BASE_URL}/api/orders/${order._id}/pay`, {
          paymentMode: 'card',
          amountPaid: total,
          changeReturned: 0,
          paymentIntentId: null,
          cardBrand: 'Unknown',
          last4: '****'
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Free up the table if this is a dine-in order
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

        setMessage('✅ Card payment recorded successfully!');
        setTimeout(() => navigate('/admin/pos/orders'), 1000);
      } else {
        await axios.patch(`${BASE_URL}/api/orders/${order._id}/pay`, {
          paymentMode,
          amountPaid: Number(amountGiven || total),
          changeReturned: paymentMode === 'cash' ? changeToReturn : 0,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Free up the table if this is a dine-in order
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

        setMessage('✅ Payment recorded successfully.');
        setTimeout(() => navigate('/admin/pos/orders'), 1000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('❌ Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="p-4">Loading order...</div>;

  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
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
      <div className="container p-4" style={{ marginTop: isMobile ? '56px' : 0 }}>
        <h3 className="mb-3">🧾 Payment for Order #{order.orderCode}</h3>

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
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Card Number"
              maxLength="19"
              onChange={(e) => {
                const input = e.target.value.replace(/\D/g, '').substring(0, 16);
                const formatted = input.match(/.{1,4}/g)?.join('-') || '';
                e.target.value = formatted;
              }}
            />

            <div className="d-flex gap-3">
              <div className="flex-fill">
                <label className="form-label fw-semibold">Expiry Date</label>
                <input type="text" className="form-control" placeholder="MM/YY" />
              </div>
              <div className="flex-fill">
                <label className="form-label fw-semibold">CVV</label>
                <input type="text" className="form-control" placeholder="CVV" />
              </div>
              <div className="flex-fill">
                <label className="form-label fw-semibold">ZIP Code</label>
                <input type="text" className="form-control" placeholder="ZIP Code" />
              </div>
            </div>
          </div>
        )}

        {message && <div className="alert alert-info">{message}</div>}

        <div className="text-center">
          <button className="btn btn-lg btn-success px-5" onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : 'Make Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;