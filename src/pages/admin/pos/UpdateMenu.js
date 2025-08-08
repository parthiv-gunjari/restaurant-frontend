import React, { useEffect, useState, useRef } from 'react';
import '../../../assets/css/UpdateMenu.css';
import axios from 'axios';
import { BASE_URL } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar';
import MobileNavBar from './MobileNavBar';

const UpdateMenu = () => {
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getToken = () =>
    localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

  const fetchMenuItems = async () => {
    try {
      const token = getToken();
      if (!token) return navigate('/admin/login');

      const res = await axios.get(`${BASE_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(res.data);
    } catch (err) {
      console.error('Error fetching POS menu:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('managerToken');
        navigate('/admin/login');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) return navigate('/admin/login');

      const formPayload = new FormData();
      for (const key in formData) {
        if (key === 'image' && !formData.image) continue;
        formPayload.append(key, formData[key]);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
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
      alert('Failed to save item.');
      console.error('Save error:', err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      image: null,
    });
    setEditingId(item._id);
    setIsFormOpen(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleForm = () => {
    if (isFormOpen && !editingId) {
      setIsFormOpen(false);
    } else {
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
      setIsFormOpen(true);
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = getToken();
      if (!token) return navigate('/admin/login');

      await axios.delete(`${BASE_URL}/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenuItems();
    } catch (err) {
      alert('Failed to delete item.');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="pos-layout-container update-menu-container" style={{ overflowX: 'hidden' }}>
      {/* Mobile NavBar for mobile screens */}
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
              color: 'white'
            }}
          >
            ☰
          </button>
          <MobileNavBar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      )}
      {/* Sidebar Navigation - only show on desktop */}
      {!isMobile && <SideBar />}
      <div className="pos-update-panel mt-4" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="update-menu-header">
          <h2 style={{ marginTop: '0.5rem' }}>Update Menu</h2>
          <button onClick={toggleForm} className="btn btn-outline-primary btn-toggle-form">
            {isFormOpen ? 'Close Form' : editingId ? 'Edit Item' : 'Add New Item'}
          </button>
        </div>

        <div ref={formRef} className="mb-4">
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="border p-4 rounded shadow-sm bg-light update-form"
            >
              <h4>{editingId ? 'Edit Item' : 'Add New Item'}</h4>
              <div className="form-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <textarea
                  className="form-control"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  name="category"
                  placeholder="Category"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group mb-2">
                <input
                  type="file"
                  className="form-control"
                  name="image"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image: e.target.files[0] }))
                  }
                />
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                />
                <label className="form-check-label">In Stock</label>
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                />
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
              <button className="btn btn-success w-100">
                {editingId ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          )}
        </div>

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
            <div key={category} className="mb-5 category-section">
              <h4 className="mb-3 ps-3 category-title">{category}</h4>
              <div className="menu-grid" style={{ width: '100%', maxWidth: '100%' ,padding:'10px'}}>
                {items.map((item) => (
                  <div key={item._id} className="menu-item-card">
                    <div className="menu-item-image-wrapper">
                      {(item.image || item.imageUrl) && (
                        <img
                          src={
                            item.image?.startsWith('http')
                              ? item.image
                              : `${BASE_URL}${item.image || item.imageUrl}`
                          }
                          alt={item.name}
                          className="menu-item-image"
                        />
                      )}
                    </div>
                    <div className="menu-item-details">
                      <div className="menu-item-header">
                        <span
                          className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}
                        ></span>
                        <small>{item.isVeg ? 'Veg' : 'Non-Veg'}</small>
                      </div>
                      <h5 className="menu-item-name">{item.name}</h5>
                      <p className="menu-item-desc">{item.description}</p>
                      <p className="menu-item-price">
                        <strong>Price:</strong> ${item.price.toFixed(2)}
                      </p>
                      <p className="menu-item-stock">
                        <strong>Stock:</strong> {item.inStock ? '✅' : '❌'}
                        <br />
                        <strong>Published:</strong> {item.isPublished ? '✅' : '❌'}
                      </p>
                      <div className="menu-actions">
                        <button
                          className="btn btn-warning"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpdateMenu;