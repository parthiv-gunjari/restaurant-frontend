import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import AdminNavbar from '../../components/AdminNavbar';

const AdminOrderModificationsPage = () => {
  const [modifications, setModifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModifications = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Unauthorized. Please login again.');
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/api/orders/modifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setModifications(sorted);
      } catch (err) {
        console.error('Error fetching modifications', err);
        alert('Failed to load modifications history.');
      } finally {
        setLoading(false);
      }
    };

    fetchModifications();
  }, []);

  const getBadge = (action) => {
    const map = {
      add: 'success',
      update: 'warning',
      remove: 'danger',
      cancel: 'secondary'
    };
    return map[action] || 'light';
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h3>Order Modification History</h3>
        {loading ? (
          <p>Loading...</p>
        ) : modifications.length === 0 ? (
          <p>No modifications found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped mt-3">
              <thead className="table-light">
                <tr>
                  <th>Order</th>
                  <th>Modified By</th>
                  <th>Action</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {modifications.map((mod, index) => {
                  const beforeItems = mod.before || [];
                  const afterItems = mod.after || [];

                  return (
                    <React.Fragment key={index}>
                      <tr className="table-primary">
                        <td colSpan="7">
                          <strong>Order:</strong> {mod.orderCode || (mod.orderId?.slice?.(0, 6) + '...')} &nbsp;
                          <strong>Modified By:</strong> {mod.performedBy?.name || mod.performedBy?.email || 'Unknown'} &nbsp;
                          <strong>Reason:</strong> {mod.reason || '-'} &nbsp;
                          <strong>Date:</strong> {new Date(mod.createdAt).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <th colSpan="3" className="text-center text-success">Before</th>
                        <th></th>
                        <th colSpan="3" className="text-center text-danger">After</th>
                      </tr>
                      {(() => {
                        const beforeMap = {};
                        const afterMap = {};
                        beforeItems.forEach(item => {
                          beforeMap[item.itemId || item._id] = item;
                        });
                        afterItems.forEach(item => {
                          afterMap[item.itemId || item._id] = item;
                        });

                        const allIds = new Set([
                          ...Object.keys(beforeMap),
                          ...Object.keys(afterMap)
                        ]);

                        return Array.from(allIds).map(id => {
                          const before = beforeMap[id];
                          const after = afterMap[id];
                          let rowStyle = {};

                          let beforeStyle = {};
                          let afterStyle = {};

                          if (before && !after) {
                            // Removed
                            beforeStyle = { textDecoration: 'line-through', color: 'red' };
                          } else if (!before && after) {
                            // Added
                            afterStyle = { color: 'green' };
                          } else if (before.quantity !== after.quantity) {
                            // Quantity changed
                            afterStyle = { color: 'orange' };
                          }

                          return (
                            <tr key={id}>
                              <td style={beforeStyle}>{before?.name || '-'}</td>
                              <td style={beforeStyle}>{before?.quantity ?? '-'}</td>
                              <td style={beforeStyle}>{before ? `₹${(before.price * before.quantity).toFixed(2)}` : '-'}</td>
                              <td className="text-center">➡</td>
                              <td style={afterStyle}>{after?.name || '-'}</td>
                              <td style={afterStyle}>{after?.quantity ?? '-'}</td>
                              <td style={afterStyle}>{after ? `₹${(after.price * after.quantity).toFixed(2)}` : '-'}</td>
                            </tr>
                          );
                        });
                      })()}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrderModificationsPage;