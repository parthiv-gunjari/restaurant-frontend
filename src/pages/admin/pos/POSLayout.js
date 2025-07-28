// pos/POSLayout.js
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/Pos.css'; // POS layout styles

const POSLayout = ({ cartPanel }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="pos-container light-mode">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <ul>
          <li
            className={isActive('reservations') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/reservations')}
          >
            Reservations
          </li>
          <li
            className={isActive('tables') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/tables')}
          >
            Table Services
          </li>
          <li
            className={isActive('menu') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/menu')}
          >
            Menu
          </li>
          <li
            className={isActive('orders') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/orders')}
          >
            Orders
          </li>
          <li
            className={isActive('accounts') ? 'active' : ''}
            onClick={() => navigate('/admin/pos/accounts')}
          >
            Accounts
          </li>
        </ul>
      </aside>

      {/* Center panel where page content renders */}
      <main className="main-panel">
        <Outlet />
      </main>

      {/* Reusable Cart Panel passed as a prop */}
      <aside className="order-summary">
        {cartPanel}
      </aside>
    </div>
  );
};

export default POSLayout;