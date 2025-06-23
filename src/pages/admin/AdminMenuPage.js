import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminNavbar from '../../components/AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/api';

function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    inStock: true,
    isPublished: true,
    isVeg: true,
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      const res = await axios.get(`${BASE_URL}/api/menu`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error fetching admin menu:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('price', formData.price);
      formPayload.append('category', formData.category);
      formPayload.append('inStock', formData.inStock);
      formPayload.append('isPublished', formData.isPublished);
      formPayload.append('isVeg', formData.isVeg);
      if (formData.image) {
        formPayload.append('image', formData.image);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/api/menu/${editingId}`, formPayload, config);
      } else {
        await axios.post(`${BASE_URL}/api/menu`, formPayload, config);
      }
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: null,
        inStock: true,
        isPublished: true,
        isVeg: true,
      });
      setEditingId(null);
      fetchMenuItems();
    } catch (err) {
      alert("Failed to save item.");
      console.error("Save error:", err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      image: null, // Prevent file overwrite issue
    });
    setEditingId(item._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return navigate('/admin/login');

      await axios.delete(`${BASE_URL}/api/menu/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchMenuItems();
    } catch (err) {
      alert("Failed to delete item.");
      console.error("Delete error:", err);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="container mt-4">
        <h2>Admin – Manage Menu Items</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="border p-4 rounded shadow-sm mb-4 bg-light">
          <h4>{editingId ? 'Edit Item' : 'Add New Item'}</h4>
          <div className="form-group mb-2">
            <input type="text" className="form-control" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group mb-2">
            <textarea className="form-control" name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
          </div>
          <div className="form-group mb-2">
            <input type="number" step="0.01" className="form-control" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required />
          </div>
          <div className="form-group mb-2">
            <input type="text" className="form-control" name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
          </div>
          <div className="form-group mb-2">
            <input
              type="file"
              className="form-control"
              name="image"
              accept="image/*"
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
            />
          </div>
          <div className="form-check mb-2">
            <input type="checkbox" className="form-check-input" name="inStock" checked={formData.inStock} onChange={handleChange} />
            <label className="form-check-label">In Stock</label>
          </div>
          <div className="form-check mb-2">
            <input type="checkbox" className="form-check-input" name="isPublished" checked={formData.isPublished} onChange={handleChange} />
            <label className="form-check-label">Published</label>
          </div>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              name="isVeg"
              checked={formData.isVeg}
              onChange={handleChange}
            />
            <label className="form-check-label">
              Veg (unchecked = Non-Veg)
            </label>
          </div>
          <button className="btn btn-success w-100">{editingId ? 'Update Item' : 'Add Item'}</button>
        </form>

        {/* Category-wise display */}
        <div className="mt-4">
          {Object.entries(
            menuItems.reduce((acc, item) => {
              const category = item.category || 'Uncategorized';
              if (!acc[category]) acc[category] = [];
              acc[category].push(item);
              return acc;
            }, {})
          ).map(([category, items]) => (
            <div key={category} className="mb-5">
              <h4 className="mb-3">{category}</h4>
              <div className="row g-3">
                {items.map((item) => (
                  <div key={item._id} className="col-md-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <div className="text-end">
                          <span
                            style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: item.isVeg ? 'green' : 'red',
                              marginRight: '6px',
                            }}
                          ></span>
                          <small>{item.isVeg ? 'Veg' : 'Non-Veg'}</small>
                        </div>
                        {(item.image || item.imageUrl) && (
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image || item.imageUrl}`}
                            alt={item.name}
                            className="img-fluid mb-3 d-block mx-auto rounded"
                            style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                          />
                        )}
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text">{item.description}</p>
                        <p className="card-text"><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                        <p className="card-text">
                          <strong>Stock:</strong> {item.inStock ? '✅' : '❌'}<br />
                          <strong>Published:</strong> {item.isPublished ? '✅' : '❌'}
                        </p>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminMenuPage;