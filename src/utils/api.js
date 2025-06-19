// src/utils/api.js
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.REACT_APP_API_URL // from .env (http://localhost:5051)
    : 'https://restaurant-backend-wal6.onrender.com'; // production Render backend

export default BASE_URL;