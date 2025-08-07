import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { BASE_URL } from '../utils/api';

function CartPage() {
  const { cart = [], removeFromCart, incrementItem, decrementItem } = useCart();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item?.price) || 0;
    const qty = parseInt(item?.quantity) || 0;
    return sum + price * qty;
  }, 0).toFixed(2);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("🛒 Your cart is empty.");
      return;
    }
    navigate('/checkout', {
      state: {
        items: cart,
        name: '',
        email: '',
        notes: ''
      }
    });
  };

  return (
    <div className="pos-layout-container">
      <div className="cart-scroll-container container mt-5">
        <h2 className="mb-4 text-center">🛒 Your Cart</h2>

        {cart.length === 0 ? (
          <div className="alert alert-info text-center">Your cart is currently empty.</div>
        ) : (
          <>
            <div className="row">
              {cart.filter(item => item && item.name && item.price != null).map(item => {
                const qty = parseInt(item?.quantity) || 0;
                const price = parseFloat(item?.price) || 0;
                return (
                  <div className="col-md-6 col-12 mb-3" key={item._id}>
                    <div className="card shadow-sm p-2" style={{ maxWidth: '600px', margin: '0 auto' }}>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                          alt={item.name}
                          className="rounded"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-1">{item.name}</h5>
                            <h5 className="mb-1">${(price * qty).toFixed(2)}</h5>
                          </div>
                          <p className="mb-1">Price: ${price.toFixed(2)}</p>
                          <p className="mb-1">Qty: <strong>{qty}</strong></p>
                          <div className="btn-group" role="group">
                            <button onClick={() => decrementItem(item)} className="btn btn-sm btn-outline-secondary">−</button>
                            <button onClick={() => incrementItem(item)} className="btn btn-sm btn-outline-secondary">+</button>
                            <button onClick={() => removeFromCart(item._id)} className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-end">
              <h4 className="mb-3">Total: <span className="text-success">${total}</span></h4>
              <button className="btn btn-success btn-lg" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        .cart-scroll-container {
          max-height: calc(100vh - 180px);
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .cart-scroll-container .row {
            display: flex;
            flex-wrap: wrap;
          }

          .cart-scroll-container .col-md-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
      `}</style>
    </div>
  );
}

export default CartPage;