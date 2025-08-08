import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/Pos.css'; // POS layout styles

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

const isActive = (path) => location.pathname === `/admin/pos/${path}`;

  const isAdmin = role === 'admin';
  const isManagerOrWaiter = role === 'manager' || role === 'waiter';

  return (
    <aside className="sidebar pos-layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          padding: '1rem 0.6rem 0.2rem 0.1rem',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.4rem',
          color: '#0563bb',
          whiteSpace: 'nowrap'
        }}
      >
        Parthiv's Kitchen
      </div>

      <ul>
        <li className={isActive('reservations') ? 'active' : ''} onClick={() => navigate('/admin/pos/reservations')}>
          Reservations
        </li>
        <li className={isActive('tables') ? 'active' : ''} onClick={() => navigate('/admin/pos/tables')}>
          Table Services
        </li>
        <li className={isActive('menu') ? 'active' : ''} onClick={() => navigate('/admin/pos/menu')}>
          Menu
        </li>
        <li className={isActive('orders') ? 'active' : ''} onClick={() => navigate('/admin/pos/orders')}>
          Orders
        </li>

        {(isAdmin || isManagerOrWaiter) && (
          <li className={isActive('update-menu') ? 'active' : ''} onClick={() => navigate('/admin/pos/update-menu')}>
            Update Menu
          </li>
        )}

        {isAdmin && (
          <>
            <li className={isActive('kitchen') ? 'active' : ''} onClick={() => navigate('/admin/pos/kitchen')}>
              Kitchen Display
            </li>
            <li className={isActive('accounts') ? 'active' : ''} onClick={() => navigate('/admin/pos/accounts')}>
              Accounts
            </li>
            <li className={isActive('audit-logs') ? 'active' : ''} onClick={() => navigate('/admin/pos/audit-logs')}>
              Audit Logs
            </li>
          </>
        )}
      </ul>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', color: '#333', fontWeight: 'bold' }}>
          <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
          {(() => {
            const fullName =
              localStorage.getItem('fullName') || localStorage.getItem('username') || 'Unknown';
            return (
              <>
                Logged in as: {fullName} ({role || 'Role Unknown'})
              </>
            );
          })()}
        </div>

        <div style={{ padding: '1rem' }}>
          <button
            className="btn btn-danger logout-button"
            onClick={() => {
              localStorage.clear();
              navigate('/admin/login');
            }}
            style={{ width: '100%' }}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
export default SideBar;