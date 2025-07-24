import React, { useEffect, useState } from 'react';
import '../../assets/css/DineInTableMenu.css';
import '../../assets/css/DineInOrderTables.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../utils/api';
import AdminNavbar from '../../components/AdminNavbar';

const TABLE_ROWS = 5;
const TABLE_COLS = 4;

const DineInOrderTables = () => {
  const [tables, setTables] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(fetchTables, 5000);
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tables`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('managerToken')}`,
        },
      });
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/menu`);
      setMenu(res.data);
      const cats = [...new Set(res.data.map(item => item.category))];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setSelectedItems([]);
      setNotes('');
    } else {
      navigate('/admin/dinein-order/' + table._id, { state: { table } });
    }
  };

  const handleAddToOrder = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i._id === item._id);
      if (exists) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handlePlaceOrder = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken') || localStorage.getItem('token');
      const orderPayload = {
        tableId: selectedTable._id,
        items: selectedItems.map(item => ({
          itemId: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        notes
      };

      await axios.post(`${BASE_URL}/api/orders/dinein`, orderPayload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Order placed successfully!');
      setSelectedTable(null);
      setSelectedItems([]);
      setNotes('');
      setActiveCategory(null);
      fetchTables();
    } catch (err) {
      console.error('Failed to place order', err);
      alert('Error placing order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'green';
      case 'occupied': return 'orange';
      case 'completed': return 'gray';
      default: return 'lightgray';
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h2 className="mb-3">Dine-In Tables</h2>
        <div className="table-grid">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLabel) => (
            <div key={rowLabel} className="table-row d-flex flex-wrap mb-3">
              {tables
                .filter((table) => table.tableNumber.startsWith(rowLabel))
                .map((table) => (
                  <div
                    key={table._id}
                    className="table-card me-2 mb-2"
                    style={{ borderColor: getStatusColor(table.status), minWidth: '110px', flex: '1 0 18%' }}
                    onClick={() => handleTableClick(table)}
                  >
                    <h6>Table {table.tableNumber}</h6>
                    <p className="small">Status: <strong>{table.status}</strong></p>
                    {table.status === 'occupied' && (
                      <>
                        {(() => {
                          const { text, seconds } = formatTimer(table.startedAt, now);
                          let color = 'green';
                          if (seconds > 1800) color = 'red';
                          else if (seconds > 900) color = 'orange';
                          return <p className="small" style={{ color }}>⏱️ {text}</p>;
                        })()}
                        <p className="small">👤 {table.waiterUsername || 'N/A'}</p>
                      </>
                    )}
                    <button className="btn btn-sm btn-primary mt-1 w-100">
                      {table.status === 'available' ? 'Take' : 'View'}
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {selectedTable && (
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Take Order for Table {selectedTable.tableNumber}</h5>
                  <button type="button" className="close btn" onClick={() => setSelectedTable(null)}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <select
                      className="form-select"
                      value={activeCategory || ''}
                      onChange={(e) => setActiveCategory(e.target.value || null)}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="menu-items row">
                    {menu
                      .filter(item => !activeCategory || item.category === activeCategory)
                      .map(item => (
                        <div className="col-md-3 col-sm-6 col-12 mb-3" key={item._id}>
                          <div
                            className="card menu-card"
                            onClick={() => handleAddToOrder(item)}
                          >
                            <div className="d-flex justify-content-between w-100">
                              <span className="fw-semibold text-truncate">{item.name}</span>
                              <span className="text-muted ms-2">${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="modal-footer flex-column align-items-start">
                  <h6>Selected Items:</h6>
                  <ul className="list-unstyled">
                    {selectedItems.map(item => (
                      <li key={item._id} className="mb-2 d-flex align-items-center">
                        <span className="me-2">{item.name}</span>
                        <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => {
                          setSelectedItems(prev =>
                            prev.map(i => i._id === item._id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i)
                          );
                        }}>-</button>
                        <span className="mx-1">{item.quantity}</span>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => {
                          setSelectedItems(prev =>
                            prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i)
                          );
                        }}>+</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => {
                          setSelectedItems(prev => prev.filter(i => i._id !== item._id));
                        }}>Delete</button>
                      </li>
                    ))}
                  </ul>
                  <textarea
                    className="form-control mb-2"
                    placeholder="Special notes..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                  <div>
                    <button className="btn btn-primary me-2" onClick={handlePlaceOrder}>Confirm Dine-In Order</button>
                    <button className="btn btn-secondary" onClick={() => setSelectedTable(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function formatTimer(startedAt, now) {
  if (!startedAt) return { text: 'N/A', seconds: 0 };
  const diff = Math.floor((now - new Date(startedAt)) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const text = hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;

  return { text, seconds: diff };
}

export default DineInOrderTables;