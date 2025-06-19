import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CartPage() {
  const { cart = [], removeFromCart, incrementItem, decrementItem } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  const navigate = useNavigate();

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
            {cart.map(item => (
              <div className="col-md-6 mb-4" key={item._id}>
                <div className="card shadow-sm">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">{item.name}</h5>
                      <p className="card-text mb-1">Quantity: <strong>{item.quantity}</strong></p>
                      <div className="btn-group" role="group">
                        <button onClick={() => decrementItem(item._id)} className="btn btn-sm btn-outline-secondary">−</button>
                        <button onClick={() => incrementItem(item._id)} className="btn btn-sm btn-outline-secondary">+</button>
                        <button onClick={() => removeFromCart(item._id)} className="btn btn-sm btn-outline-danger">Remove</button>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-end mb-0">${(item.price * item.quantity).toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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