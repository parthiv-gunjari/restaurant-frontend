import React, { useEffect, useState } from 'react';
import '../../assets/css/DineInOrderPage.css';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../utils/api'; // or adjust based on your path
import AdminNavbar from '../../components/AdminNavbar';

const DineInOrderPage = () => {
  const { id } = useParams(); // tableId
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [existingOrder, setExistingOrder] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItems, setEditItems] = useState([]);

useEffect(() => {
  fetchMenu();
  fetchTable();
}, []);

  useEffect(() => {
    console.log('existingOrder:', existingOrder);
    console.log('menu:', menu);
  }, [existingOrder, menu]);

  useEffect(() => {
    if (!menu.length) return;
    // Only initialize editItems if modal is NOT open
    if (existingOrder && existingOrder.items && !editModalOpen) {
      setEditItems(existingOrder.items.map(i => ({
        ...i,
        quantity: i.quantity,
        name: i.name || menu.find(m => m._id === (i.itemId?._id || i.itemId))?.name || 'Item',
        price: typeof i.price === 'number' ? i.price : menu.find(m => m._id === (i.itemId?._id || i.itemId))?.price || 0
      })));
    }
  }, [existingOrder, menu, editModalOpen]);

  const fetchTable = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Unauthorized. Please login again.');
      return navigate('/admin');
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = res.data.find(t => t._id === id);
      if (!found) {
        alert('Table not found');
        return;
      }
      setTable(found);

      if (found?.currentOrderId && found.currentOrderId.length === 24) {
        try {
          const orderRes = await axios.get(`${BASE_URL}/api/orders/${found.currentOrderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Assuming backend returns populated items with full details
          setExistingOrder({ ...orderRes.data, initialItems: orderRes.data.items });
          // Don't call setEditItems here; handled by useEffect([existingOrder, menu]) below
        } catch (err) {
          console.warn('Order not found or already completed:', err.response?.data?.error || err.message);
          setExistingOrder(null);
        }
      } else {
        console.warn('Invalid or missing order ID');
      }
    } catch (err) {
      console.error('Failed to fetch table data', err);
      alert(`Failed to fetch table data. ${err.response?.data?.error || 'Please check your authentication.'}`);
    }
  };

  const fetchMenu = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Unauthorized. Please login again.');
      return navigate('/admin');
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenu(res.data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
      alert(`Failed to fetch menu. ${err.response?.data?.error || 'Please check your authentication.'}`);
    }
  };

  const handleAddToOrder = (item) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Unauthorized. Please login again.');
      return navigate('/admin');
    }

    try {
      const formattedItems = selectedItems.map(item => ({
          itemId: item._id,
        quantity: item.quantity
      }));

      await axios.post(`${BASE_URL}/api/orders/dinein`, {
        tableId: id,
        items: formattedItems,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order placed!');
      navigate('/admin/dinein-tables');
    } catch (err) {
      console.error('Failed to place order', err);
      alert('Error placing order');
    }
  };

  const handlePayment = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Unauthorized. Please login again.');
      return navigate('/admin');
    }

    try {
      const orderId = existingOrder?._id;
      console.log("🧾 Order ID on payment:", orderId);
      if (!orderId || orderId.length !== 24) {
        alert('Invalid or missing Order ID.');
        return;
      }

      if (!existingOrder.items.every(i => i.itemId)) {
        alert("Invalid order items. Missing itemId in one or more items.");
        return;
      }

      const response = await axios.patch(`${BASE_URL}/api/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Payment completed. Table marked as available.');
      navigate('/admin/dinein-tables');
    } catch (err) {
      const serverMessage = err.response?.data?.error || err.message || 'Unknown error';
      console.error('❌ Payment failed:', serverMessage, err.stack || '');
      alert(`Error processing payment: ${serverMessage}`);
    }
  };

  if (!table) return <p>Loading table...</p>;

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <button
          className="btn btn-outline-dark mb-3"
          onClick={() => navigate('/admin/dinein-tables')}
        >
          ← Back to Tables
        </button>
      <h2>Table {table.tableNumber} — {table.status.toUpperCase()}</h2>

      {table.status === 'available' ? (
        <>
          <h4>Select Menu Items:</h4>
          <div className="row">
            {menu.map(item => (
              <div className="col-md-4 mb-3" key={item._id}>
                <div className="card">
                  <div className="card-body">
                    <h5>{item.name}</h5>
                    <p>${item.price.toFixed(2)}</p>
                    <button className="btn btn-sm btn-success" onClick={() => handleAddToOrder(item)}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h5 className="mt-4">Selected Items:</h5>
          {selectedItems.length === 0 ? <p>No items yet</p> : (
            <ul>
              {selectedItems.map((item, index) => (
                <li key={`${item._id}-${index}`}>{item.name} × {item.quantity}</li>
              ))}
            </ul>
          )}

          <textarea
            className="form-control my-3"
            placeholder="Any special notes?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button className="btn btn-dark" onClick={handlePlaceOrder}>Place Order</button>
        </>
      ) : (
        <>
          <h4>Current Order</h4>
          {existingOrder && menu.length > 0 ? (
            <>
              {/* Legend for item status */}
              <div className="mb-2 small text-muted">
                <span className="me-2"><span className="badge bg-primary">New</span></span>
                <span className="me-2"><span className="badge bg-warning text-dark">Increased Qty</span></span>
                <span><span className="badge bg-danger">Removed</span></span>
              </div>
             <div className="row">
  {/* Active / Updated Items */}
  {existingOrder.items.map((item, index) => {
    const initial = existingOrder.initialItems?.find(init => {
      const id1 = init.itemId?._id || init.itemId;
      const id2 = item.itemId?._id || item.itemId || item._id;
      return id1 === id2;
    });

    const isNew = !initial;
    const isIncreased = initial && item.quantity > initial.quantity;

    // Border color only, no background
    let cardClass = "card mb-3 ";
    if (isNew) cardClass += "border border-success";
    else if (isIncreased) cardClass += "border border-warning";
    else cardClass += "border";

    return (
      <div key={`${item.itemId?._id || item.itemId || item._id}-${index}`} className="col-md-6">
        <div className={cardClass}>
          <div className="card-body">
            <h6 className="mb-1">
              {item.name}
              {isNew && <span className="badge bg-success ms-2">New</span>}
              {isIncreased && <span className="badge bg-warning text-dark ms-2">Increased Qty</span>}
            </h6>
            <p className="mb-0">Qty: {item.quantity} × ${item.price.toFixed(2)} = ${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  })}

  {/* Removed Items */}
  {existingOrder.initialItems?.map((initial, idx) => {
    const stillExists = existingOrder.items.find(i => {
      const id1 = i.itemId?._id || i.itemId || i._id;
      const id2 = initial.itemId?._id || initial.itemId;
      return id1 === id2;
    });

    if (!stillExists) {
      return (
        <div key={`removed-${initial.itemId?._id || initial.itemId || idx}`} className="col-md-6 mb-3">
          <div className="card border border-danger text-danger">
            <div className="card-body">
              <h6 className="mb-1 text-decoration-line-through">
                {initial.name} <span className="badge bg-danger ms-2">Removed</span>
              </h6>
              <p className="mb-0 text-decoration-line-through">
                Qty: {initial.quantity} × ${initial.price.toFixed(2)} = ${(initial.price * initial.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  })}
</div>
              {/* Change card background for status card */}
              <div className="card mt-3 bg-info bg-opacity-25">
                <div className="card-body">
                  <p><strong>Status:</strong> {existingOrder.status}</p>
                  <p><strong>Started At:</strong> {
                    existingOrder.startedAt && !isNaN(new Date(existingOrder.startedAt).getTime())
                      ? new Date(existingOrder.startedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'Not Available'
                  }</p>
                  <p><strong>Total:</strong> ${existingOrder.items.reduce((acc, item) => {
                    const matchedItem = menu.find(m => {
                      const itemId = item.itemId?._id || item.itemId || item._id;
                      return m._id === itemId;
                    });
                    const itemPrice = typeof item.price === 'number' ? item.price : (matchedItem?.price ?? 0);
                    return acc + itemPrice * item.quantity;
                  }, 0).toFixed(2)}</p>
                </div>
              </div>
              {/* Change button colors for testing */}
              <div className="d-flex flex-wrap gap-2 mt-3">
  <button className="btn btn-danger" onClick={() => setEditModalOpen(true)}>
    Edit Order
  </button>
  <button className="btn btn-warning text-dark" onClick={handlePayment}>
    Mark as Paid
  </button>
</div>
            </>
          ) : <p>Loading order details...</p>}
        </>
      )}
      </div>
      {editModalOpen && (
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Order</h5>
              <button type="button" className="btn-close" onClick={() => setEditModalOpen(false)}></button>
            </div>
            <div className="modal-body">
              <ul className="list-unstyled">
                {editItems.map((item, index) => (
                  <li key={index} className="mb-2">
                    {item.name} - ${item.price.toFixed(2)}
                    <button className="btn btn-sm btn-outline-dark mx-2" onClick={() => {
                      setEditItems(prev =>
                        prev.map((it, i) => i === index && it.quantity > 1 ? { ...it, quantity: it.quantity - 1 } : it)
                      );
                    }}>-</button>
                    {item.quantity}
                    <button className="btn btn-sm btn-outline-dark mx-2" onClick={() => {
                      setEditItems(prev =>
                        prev.map((it, i) => i === index ? { ...it, quantity: it.quantity + 1 } : it)
                      );
                    }}>+</button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => {
                      setEditItems(prev => prev.filter((_, i) => i !== index));
                    }}>Remove</button>
                  </li>
                ))}
              </ul>
              <hr />
              <h6>Add New Items:</h6>
              <div className="row">
                {menu.map((item, index) => (
                  <div className="col-md-4 mb-2" key={`${item._id}-${index}`}>
                    <button
                      className="btn btn-outline-dark w-100"
                      onClick={() => {
                        const exists = editItems.find(i => i.itemId === item._id || i._id === item._id);
                        if (exists) {
                          setEditItems(prev =>
                            prev.map(i =>
                              (i.itemId === item._id || i._id === item._id)
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                            )
                          );
                        } else {
                          setEditItems(prev => [...prev, {
                            itemId: item._id,
                            name: item.name,
                            price: item.price,
                            quantity: 1
                          }]);
                        }
                      }}
                    >
                      {item.name} — ${item.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-success"
                onClick={async () => {
                  const token = localStorage.getItem('adminToken');
                  try {
                    const updatedItems = editItems
                      .map(i => {
                        const itemId = i.itemId?._id || i.itemId || i._id;
                        return {
                          itemId,
                          quantity: i.quantity
                        };
                      })
                      .filter(i => i.itemId && typeof i.quantity === 'number' && i.quantity >= 0);

                    const removedItems = existingOrder.initialItems
                      ? existingOrder.initialItems
                          .filter(init => {
                            const id = init.itemId?._id || init.itemId;
                            return id && !updatedItems.some(i => i.itemId === id);
                          })
                          .map(init => ({
                            itemId: init.itemId?._id || init.itemId,
                            quantity: 0
                          }))
                      : [];

                    const finalItems = [...updatedItems, ...removedItems];

                    await axios.patch(`${BASE_URL}/api/orders/${existingOrder._id}/modify`, {
                      updatedItems: finalItems,
                      reason: "Edited via Admin UI"
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });

                    alert("Order updated successfully!");
                    setEditModalOpen(false);
                    fetchTable();
                  } catch (err) {
                    console.error("Failed to update order", err);
                    alert("Failed to update order");
                  }
                }}
              >
                Save Changes
              </button>
              <button className="btn btn-outline-dark" onClick={() => setEditModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DineInOrderPage;