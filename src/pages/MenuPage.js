import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import '../assets/css/MenuPage.css'; // optional: for custom styling
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BASE_URL from '../utils/api';

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();

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

    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(items);
  }, [selectedCategory, searchTerm, menuItems]);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4 sticky-filter-bar bg-white " style={{ position: 'sticky', top: 0, zIndex: 1020 }}>Menu</h2>

      {/* Filters */}
      <div className="sticky-filter-bar bg-white py-3" style={{ position: 'sticky', top: 30, zIndex: 1020 }}>
        <div className="row mb-4 justify-content-center">
          <div className="col-md-4 mb-2">
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
          <div className="col-md-4 mb-2">
            <input
              className="form-control"
              type="text"
              placeholder="Search by item name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Items by Category */}
      {categories
        .filter(cat => selectedCategory === 'All' || cat === selectedCategory)
        .map(cat => {
          const items = filteredItems.filter(item => item.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="mb-5">
              <h4 className="mb-3">{cat} <span className="text-muted">({items.length})</span></h4>
              <div className="row gx-3 gy-4">
                {items.map(item => (
                  <div className="col-6 col-md-3 mb-4" key={item._id}>
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
                        <button
                          className="btn btn-outline-primary w-100"
                          onClick={() => {
                            addToCart(item);
                            toast.success(`${item.name} added to cart!`);
                          }}
                          disabled={!item.inStock}
                        >
                          {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default MenuPage;