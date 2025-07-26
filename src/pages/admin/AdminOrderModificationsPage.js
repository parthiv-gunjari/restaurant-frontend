import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import AdminNavbar from '../../components/AdminNavbar';
import '../../assets/css/AdminOrderModificationsPage.css';

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
            <table className="table table-bordered mt-3">
              <tbody>
  {modifications.map((mod, index) => {
    const beforeItems = Array.isArray(mod.before) ? mod.before : [];
    const afterItems = Array.isArray(mod.after) ? mod.after : [];

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

    return (
      <React.Fragment key={mod._id || index}>
        <tr className="table-primary">
          <td colSpan="8">
            <strong>Order:</strong> {mod.orderCode || '-'} &nbsp;
            <strong>Table:</strong> {mod.tableId?.tableNumber || 'N/A'} &nbsp;
            <strong>Modified By:</strong> {mod.performedByName || 'Unknown'} &nbsp;
            <strong>Reason:</strong> {mod.reason || '-'} &nbsp;
            <strong>Date:</strong> {new Date(mod.createdAt).toLocaleString()}
          </td>
        </tr>
        <tr>
          <th colSpan="4" className="text-center text-success">Before</th>
          <th></th>
          <th colSpan="3" className="text-center text-danger">After</th>
        </tr>
        {Array.from(allIds).map(id => {
          const before = beforeMap[id];
          const after = afterMap[id];

          let beforeStyle = {};
          let afterStyle = {};

          if (before && !after) {
            beforeStyle = { textDecoration: 'line-through', color: 'red' };
          } else if (!before && after) {
            afterStyle = { color: 'green' };
          } else if (before.quantity !== after.quantity) {
            afterStyle = { color: 'orange' };
          }

          return (
            <tr key={id}>
              <td style={beforeStyle}>{mod.orderCode || '-'}</td>
              <td style={beforeStyle}>{mod.tableId?.tableNumber || 'N/A'}</td>
              <td style={beforeStyle}>{mod.performedByName || 'Unknown'}</td>
              <td style={beforeStyle}>{before?.name || '-'}</td>
              <td style={beforeStyle}>{before?.quantity ?? '-'}</td>
              <td className="text-center">➡</td>
              <td style={afterStyle}>{after?.name || '-'}</td>
              <td style={afterStyle}>{after?.quantity ?? '-'}</td>
            </tr>
          );
        })}
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