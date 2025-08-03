import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../assets/css/Pos.css';
import '../../../assets/css/MobileNavBar.css';

const MobileNavBar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  const isActive = (path) => location.pathname.includes(path);

  const isAdmin = role === 'admin';
  const isManagerOrWaiter = role === 'manager' || role === 'waiter';

  // don't return null — we now always render the header

  return (
    <>
      <div
        className="mobile-nav-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: '#0563bb',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1100
        }}
      >
        <strong style={{ color: '#0563bb' }}>Parthiv's Kitchen</strong>
        
      </div>

      {open && (
        <div
          className="mobile-sidebar-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1200,
          }}
          onClick={onClose}
        >
          <div
            className="mobile-sidebar-drawer"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '70vw',
              maxWidth: 320,
              height: '100vh',
              background: '#fff',
              boxShadow: '2px 0 8px rgba(0,0,0,0.12)',
              zIndex: 1300,
              transform: open ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                alignSelf: 'flex-end',
                margin: '1rem',
                fontSize: '1.3rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              ✖
            </button>

            <div
              style={{
                padding: '1rem 0.6rem 0.2rem 1rem',
                fontWeight: 'bold',
                fontSize: '1.4rem',
                color: '#0563bb',
              }}
            >
              Parthiv's Kitchen
            </div>

            <ul style={{ listStyle: 'none', padding: '1rem' }}>
              <li className={isActive('reservations') ? 'active' : ''} onClick={() => { navigate('/admin/pos/reservations'); onClose(); }}>Reservations</li>
              <li className={isActive('tables') ? 'active' : ''} onClick={() => { navigate('/admin/pos/tables'); onClose(); }}>Table Services</li>
              <li className={isActive('menu') ? 'active' : ''} onClick={() => { navigate('/admin/pos/menu'); onClose(); }}>Menu</li>
              <li className={isActive('orders') ? 'active' : ''} onClick={() => { navigate('/admin/pos/orders'); onClose(); }}>Orders</li>

              {(isAdmin || isManagerOrWaiter) && (
                <li className={isActive('update-menu') ? 'active' : ''} onClick={() => { navigate('/admin/pos/update-menu'); onClose(); }}>Update Menu</li>
              )}

              {isAdmin && (
                <>
                  <li className={isActive('kitchen') ? 'active' : ''} onClick={() => { navigate('/admin/pos/kitchen'); onClose(); }}>Kitchen Display</li>
                  <li className={isActive('accounts') ? 'active' : ''} onClick={() => { navigate('/admin/pos/accounts'); onClose(); }}>Accounts</li>
                  <li className={isActive('audit-logs') ? 'active' : ''} onClick={() => { navigate('/admin/pos/audit-logs'); onClose(); }}>Audit Logs</li>
                </>
              )}
            </ul>

            <div style={{ marginTop: 'auto', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: '#333', fontWeight: 'bold', marginBottom: '1rem' }}>
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
        </div>
      )}
    </>
  );
};

export default MobileNavBar;