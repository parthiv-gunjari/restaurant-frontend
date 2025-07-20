import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { cart = [] } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 d-none d-lg-flex fixed-top">
        <Link className="navbar-brand" to="/">Parthiv's Kitchen</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/menu">Menu</Link>
            </li>
           
            <li className="nav-item">
              <Link className="nav-link" to="/cart">
                Cart{' '}
                {totalItems > 0 && (
                  <span className="badge bg-warning text-dark ms-1">{totalItems}</span>
                )}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/checkout">Checkout</Link>
            </li>
             <li className="nav-item">
              <Link className="nav-link" to="/order-history">Order History</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="navbar navbar-dark bg-dark fixed-bottom d-flex d-lg-none justify-content-around p-0">
        <Link className="nav-link text-white text-center" to="/">
          <div style={{ fontSize: '1.4rem' }}>🏠</div>
          <small>Home</small>
        </Link>
        <Link className="nav-link text-white text-center" to="/menu">
          <div style={{ fontSize: '1.4rem' }}>🍽️</div>
          <small>Menu</small>
        </Link>
        
        <Link className="nav-link text-white text-center position-relative" to="/cart">
          <div style={{ fontSize: '1.4rem' }}>🛒</div>
          <small>Cart</small>
          {totalItems > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
              style={{ fontSize: '0.6rem' }}
            >
              {totalItems}
            </span>
          )}
        </Link>
        <Link className="nav-link text-white text-center" to="/checkout">
          <div style={{ fontSize: '1.4rem' }}>💳</div>
          <small>Checkout</small>
        </Link>
        <Link className="nav-link text-white text-center" to="/order-history">
          <div style={{ fontSize: '1.4rem' }}>📜</div>
          <small>Orders</small>
        </Link>
      </nav>
      <style>
        {`
          @media (max-width: 991.98px) {
            body {
              padding-bottom: 60px; /* approximate height of mobile navbar */
            }
          }
          @media (min-width: 992px) {
            body {
              padding-top: 56px; /* height of fixed-top navbar */
            }
          }
        `}
      </style>
    </>
  );
}

export default Navbar;