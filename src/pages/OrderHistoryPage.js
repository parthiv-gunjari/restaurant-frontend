import React, { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

function OrderHistoryPage() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/orders/history?email=${encodeURIComponent(email)}`);
      setOrders(res.data);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      setOrders([]);
      alert("No orders found or error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>📜 Order History</h2>

      <div className="mb-3 d-flex flex-column align-items-center">
        <input
          type="email"
          className="form-control mb-2"
          style={{ width: '100%', maxWidth: '400px' }}
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: '400px' }}
          onClick={fetchHistory}
        >
          {loading ? "Loading..." : "Fetch Order History"}
        </button>
      </div>

      <div className="mt-4">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order._id} className="card mb-3">
              <div className="card-header">
                <strong>Order ID:</strong> {order._id}<br />
                <strong>Status:</strong> {order.status} <br />
                <small>{new Date(order.timestamp).toLocaleString()}</small>
              </div>
              <ul className="list-group list-group-flush">
                {order.items.map((item, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
                <li className="list-group-item fw-bold d-flex justify-content-between">
                  <span>Total:</span>
                  <span>
                    $
                    {order.items
                      .reduce((total, item) => total + item.price * item.quantity, 0)
                      .toFixed(2)}
                  </span>
                </li>
              </ul>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No orders found.</p>
        )}
      </div>
    </div>
  );
}

export default OrderHistoryPage;