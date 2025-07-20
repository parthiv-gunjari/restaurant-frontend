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
    <div className="container mt-5">
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
                <div className="col-md-6 mb-4" key={item._id}>
                  <div className="card shadow-sm">
                    <div className="card-body d-flex gap-3">
                      <img
                        src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                        alt={item.name}
                        className="rounded"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1 d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="card-title mb-1">{item.name}</h5>
                          <p className="mb-1">Price: ${price.toFixed(2)}</p>
                          <p className="mb-1">Qty: <strong>{qty}</strong></p>
                          <div className="btn-group" role="group">
                            <button
                              onClick={() => decrementItem(item)}
                              className="btn btn-sm btn-outline-secondary"
                            >
                              −
                            </button>
                            <button onClick={() => incrementItem(item)} className="btn btn-sm btn-outline-secondary">
                              +
                            </button>
                            <button onClick={() => removeFromCart(item._id)} className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-end mb-0">${(price * qty).toFixed(2)}</h5>
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
  );
}

export default CartPage;