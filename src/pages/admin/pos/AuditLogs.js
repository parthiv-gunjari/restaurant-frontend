import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import '../../../assets/css/Pos.css';
import '../../../assets/css/AdminOrderModificationsPage.css';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';

const AuditLogs = () => {
  const [modifications, setModifications] = useState([]);
  const [filteredMods, setFilteredMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchModifications = async () => {
      const token =
        localStorage.getItem('managerToken') || localStorage.getItem('adminToken');
      if (!token) {
        alert('Unauthorized. Please login again.');
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/api/orders/modifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setModifications(sorted);
        setFilteredMods(sorted);
      } catch (err) {
        console.error('Error fetching modifications', err);
        alert('Failed to load modifications history.');
      } finally {
        setLoading(false);
      }
    };

    fetchModifications();
  }, []);

  const filterByDate = (range) => {
    const now = new Date();
    let filtered = [];

    if (range === 'today') {
      filtered = modifications.filter((mod) => {
        const modDate = new Date(mod.createdAt);
        return (
          modDate.getDate() === now.getDate() &&
          modDate.getMonth() === now.getMonth() &&
          modDate.getFullYear() === now.getFullYear()
        );
      });
    } else if (range === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      filtered = modifications.filter((mod) => {
        const modDate = new Date(mod.createdAt);
        return (
          modDate.getDate() === yesterday.getDate() &&
          modDate.getMonth() === yesterday.getMonth() &&
          modDate.getFullYear() === yesterday.getFullYear()
        );
      });
    } else if (range === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = modifications.filter((mod) => new Date(mod.createdAt) >= sevenDaysAgo);
    }

    setFilteredMods(filtered);
  };

  return (
    <div className="pos-layout-container">
      {/* Sidebar for Desktop */}
      {!isMobile && <SideBar />}

      {/* Mobile Navbar */}
      {isMobile && (
        <>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="btn btn-sm btn-light"
            style={{
              position: 'fixed',
              top: 10,
              left: 10,
              zIndex: 2000,
              background: '#0563bb',
              color: 'white',
            }}
          >
            ☰
          </button>
          <MobileNavBar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      )}

      {/* Main Panel */}
      <main className="audit-logs-page" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div
          className="px-2 mt-4"
          style={{
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100vw',
          }}
        >
          <h3 className='AuditLogs AuditLogsHeading'>Audit Logs – Order Modification History</h3>
          <div className="mb-3 d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-primary btn-sm" onClick={() => filterByDate('today')}>Today</button>
            <button className="btn btn-outline-primary btn-sm" onClick={() => filterByDate('yesterday')}>Yesterday</button>
            <button className="btn btn-outline-primary btn-sm" onClick={() => filterByDate('last7')}>Last 7 Days</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setFilteredMods(modifications)}>Clear</button>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : filteredMods.length === 0 ? (
            <p>No modifications found.</p>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-bordered mt-3"
                style={{
                  minWidth: '760px',
                  whiteSpace: 'nowrap',
                }}
              >
                <thead>
                  <tr>
                    <th className="text-center text-white" colSpan="4">Before</th>
                    <th></th>
                    <th className="text-center text-white" colSpan="3">After</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMods.map((mod, index) => {
                    const beforeItems = Array.isArray(mod.before) ? mod.before : [];
                    const afterItems = Array.isArray(mod.after) ? mod.after : [];

                    const beforeMap = {};
                    const afterMap = {};

                    beforeItems.forEach((item) => {
                      beforeMap[item.itemId || item._id] = item;
                    });

                    afterItems.forEach((item) => {
                      afterMap[item.itemId || item._id] = item;
                    });

                    const allIds = new Set([
                      ...Object.keys(beforeMap),
                      ...Object.keys(afterMap),
                    ]);

                    return (
                      <React.Fragment key={mod._id || index}>
                        <tr className="table-primary">
                          <td colSpan="8">
                            <div
                              style={{
                                background: '#e8f4fd',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                fontSize: '15px',
                                fontWeight: 500,
                                color: '#333',
                              }}
                            >
                              <span role="img" aria-label="table">🪑</span> Table: <strong>{mod.tableId?.tableNumber || 'N/A'}</strong>
                              <span>|</span>
                              <span role="img" aria-label="modified-by">👤</span> Modified By: <strong>{mod.performedByName || 'Unknown'}</strong>
                              <span>|</span>
                              <span role="img" aria-label="reason">✍️</span> Reason: <em>{mod.reason || '-'}</em>
                              <span>|</span>
                              <span role="img" aria-label="clock">🕒</span> {new Date(mod.createdAt).toLocaleString()}
                              <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#007bff' }}>
                                🧾 Order: <span style={{ textDecoration: 'underline' }}>{mod.orderCode || '-'}</span>
                              </span>
                            </div>
                          </td>
                        </tr>

                        {Array.from(allIds).map((id) => {
                          const before = beforeMap[id];
                          const after = afterMap[id];

                          let beforeStyle = {};
                          let afterStyle = {};

                          const isRemoved = before && !after;
                          const isNew = !before && after;
                          const isQtyChanged = before && after && before.quantity !== after.quantity;

                          if (isRemoved) {
                            beforeStyle = {
                              textDecoration: 'line-through',
                              color: '#721c24',
                              backgroundColor: '#f8d7da',
                              fontStyle: 'italic',
                              fontWeight: 'bold',
                            };
                          }

                          if (isNew) {
                            afterStyle = {
                              color: '#155724',
                              backgroundColor: '#d4edda',
                              fontWeight: 'bold',
                            };
                          }

                          if (isQtyChanged) {
                            afterStyle = {
                              color: '#856404',
                              backgroundColor: '#fff3cd',
                              fontWeight: 'bold',
                              fontStyle: 'italic',
                            };
                            beforeStyle = {
                              backgroundColor: '#fff3cd',
                              fontWeight: 'bold',
                              fontStyle: 'italic',
                            };
                          }

                          return (
                            <tr key={id}>
                              <td>{mod.orderCode || '-'}</td>
                              <td>{mod.tableId?.tableNumber || 'N/A'}</td>
                              <td>{mod.performedByName || 'Unknown'}</td>
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
      </main>
    </div>
  );
};

export default AuditLogs;