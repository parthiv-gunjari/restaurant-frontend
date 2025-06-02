// src/App.js
import React from 'react';
import AppRouter from './AppRouter';
import { CartProvider } from './context/CartContext'; // ✅ Wrap everything

function App() {
  return (
    <CartProvider>
      <AppRouter />
    </CartProvider>
  );
}

export default App;