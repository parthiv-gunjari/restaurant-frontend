import React, { useState } from 'react';
import axios from 'axios';

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
      const res = await axios.get(`http://localhost:5051/api/orders/history?email=${encodeURIComponent(email)}`);
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

      <div className="mb-3">
        <input
          type="email"
          className="form-control mb-2"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="btn btn-primary" onClick={fetchHistory}>
          {loading ? "Loading..." : "Fetch Order History"}
        </button>
      </div>

      {orders.length > 0 && (
        <div className="mt-4">
          {orders.map(order => (
            <div key={order._id} className="card mb-3">
              <div className="card-header">
                <strong>Order ID:</strong> {order._id}<br />
                <strong>Status:</strong> {order.status} <br />
                <small>{new Date(order.timestamp).toLocaleString()}</small>
              </div>
              <ul className="list-group list-group-flush">
                {order.items.map((item, idx) => (
                  <li key={idx} className="list-group-item">
                    {item.name} × {item.quantity} — ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;