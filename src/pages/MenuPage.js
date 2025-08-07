import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import '../assets/css/MenuPage.css'; // optional: for custom styling
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL } from '../utils/api';

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart, incrementItem, decrementItem, getQuantity } = useCart();

  useEffect(() => {
    axios.get(`${BASE_URL}/api/menu`)
      .then(res => {
        const data = res.data;
        const uniqueCategories = [...new Set(data.map(item => item.category))];

        // Calculate badges
        const topOrdered = [...data]
          .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
          .slice(0, 3)
          .map(item => item._id);

        const now = new Date();
        const withBadges = data.map(item => {
          const addedDate = new Date(item.updatedAt || item.createdAt || now);
          const isNew = (now - addedDate) / (1000 * 60 * 60 * 24) <= 3;

          const badges = [];
          if (topOrdered.includes(item._id)) badges.push('🥇 Most Ordered');
          if (isNew) badges.push('🆕 New Arrival');
          return { ...item, badges };
        });

        setMenuItems(withBadges);
        setCategories(uniqueCategories);
        setFilteredItems(withBadges);
      })
      .catch(err => console.error("Error fetching menu:", err));
  }, []);

  useEffect(() => {
    let items = [...menuItems];

    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(items);
  }, [searchTerm, menuItems]);

  return (
    <div className="pos-layout-container">
      <div className="sticky-top bg-white py-2 d-lg-none" style={{ zIndex: 1050 }}>
      <div className="sticky-top bg-white py-2 d-lg-none border-bottom shadow-sm" style={{ zIndex: 1050 }}>
          <div className="menu-header-row d-flex justify-content-between align-items-center px-3">
            <h2 className="mb-0 fw-bold text-black">Menu</h2>
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-2 py-1"
              onClick={() => setShowFilters(prev => !prev)}
            >
              <i className="bi bi-funnel"></i>
              <span className="fw-medium">Filters</span>
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="p-3 border-top">
            <div className="mb-2">
              <label className="form-label fw-bold">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label fw-bold">Search</label>
              <input
                className="form-control"
                type="text"
                placeholder="Search by item name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="d-none d-lg-block">
     

        <button
          className="btn btn-outline-dark position-fixed"
          style={{ top: '80px', right: '20px', zIndex: 1050 }}
          onClick={() => setShowFilters(prev => !prev)}
        >
          <i className="bi bi-funnel"></i> Filters
        </button>

        {showFilters && (
          <div className="card p-3 shadow position-fixed bg-white d-none d-lg-block" style={{ top: '130px', right: '20px', zIndex: 1040, width: '300px' }}>
            <div className="mb-3">
              <label className="form-label fw-bold">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label fw-bold">Search</label>
              <input
                className="form-control"
                type="text"
                placeholder="Search by item name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items by Category */}
      <div className="category-list">
        {categories.map(cat => {
          const items = filteredItems.filter(item =>
            selectedCategory === 'All' ? item.category === cat : item.category === selectedCategory
          );
          if (items.length === 0) return null;

          return (
            <div key={cat} className="category-section">
              <h4 className="category-heading">{cat} <span className="text-muted">({items.length})</span></h4>
              <div className="menu-grid" style={{ paddingLeft: 0 }}>
                {items.map(item => (
                  <div className="menu-card" key={item._id}>
                    <div className={`card h-100 shadow-sm ${!item.inStock ? 'bg-light text-muted' : ''}`}>
                      <img
                        loading="lazy"
                        src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image || ''}`}
                        className="card-img-top"
                        alt={item.name}
                        style={{
                            filter: item.inStock ? 'none' : 'grayscale(100%)',
                            height: '200px',
                            objectFit: 'cover'
                        }}
                      />
                      <div className="card-body">
                        <h5 className="card-title d-flex justify-content-between align-items-center">
                          {item.name}
                          <div>
                            {item.badges?.includes('🥇 Most Ordered') && (
                              <span className="badge  text-dark me-1">🔥</span>
                            )}
                            {item.badges?.includes('🆕 New Arrival') && (
                             <span className="custom-badge badge-new">New</span>
                            )}
                          </div>
                        </h5>
                        <p className="card-text">{item.description}</p>
                        <p><strong>${item.price.toFixed(2)}</strong></p>
                        {item.inStock ? (
                          <div className="d-flex justify-content-center align-items-center gap-2">
                            <button
                              className={`btn ${getQuantity(item._id) === 1 ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                              onClick={() => {
                                decrementItem(item);
                              }}
                            >
                              <i className={`bi ${getQuantity(item._id) === 1 ? 'bi-trash-fill' : 'bi-dash'}`}></i>
                            </button>
                            <span>{getQuantity(item._id)}</span>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                incrementItem(item);
                                toast.success(`${item.name} added to cart!`);
                              }}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-outline-secondary w-100" disabled>Out of Stock</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default MenuPage;