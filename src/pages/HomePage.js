// /client/src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
// Add the following in your public/index.html <head> for better font styling:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap" rel="stylesheet">
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/css/HomePage.css';
import poster1 from '../assets/images/poster-1.jpg';
import poster2 from '../assets/images/poster-2.jpeg';
import poster3 from '../assets/images/poster-3.jpg';
import biryaniImg from '../assets/images/65-biryani.jpg';
import vadaImg from '../assets/images/sambar-vada.jpg';
import pulusuImg from '../assets/images/Royyala-pulusu.jpg';

function HomePage() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/menu`)
      .then(res => {
        const data = res.data;
        const topOrdered = [...data]
          .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
          .slice(0, 3);
        setMenuItems(topOrdered);
      })
      .catch(err => console.error("Error fetching popular picks:", err));
  }, []);

  return (
    <div className="homepage-container">
      {/* Branding Section */}
      <div className="branding text-center py-3 bg-warning-subtle">
        <h1 style={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 800,
          fontSize: '3rem',
          letterSpacing: '1px',
          color: '#1f1f1f',
          display: 'inline-block'
        }}>
          <span role="img" aria-label="chef" style={{ marginRight: '8px' }}>👨‍🍳</span>
          Parthiv&apos;s{' '}
          <span style={{
            background: 'linear-gradient(45deg, #d35400, #e67e22)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginLeft: '28px'
          }}>
            Kitchen
          </span>
        </h1>
        <p className="text-muted">Authentic Telangana & Andhra Flavors</p>
      </div>
      {/* Carousel Section */}
      <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src={poster1} className="d-block w-100" alt="Poster 1" style={{ height: '350px', objectFit: 'cover' }} />
          </div>
          <div className="carousel-item">
            <img src={poster2} className="d-block w-100" alt="Poster 2" style={{ height: '350px', objectFit: 'cover' }} />
          </div>
          <div className="carousel-item">
            <img src={poster3} className="d-block w-100" alt="Poster 3" style={{ height: '350px', objectFit: 'cover' }} />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>

      {/* Start Order CTA */}
      <div className="text-center my-4">
        <h2>Craving Something Delicious?</h2>
        <p>Order now and enjoy our freshly made dishes delivered to your door.</p>
        <button className="btn btn-primary px-4 py-2" onClick={() => navigate('/menu')}>Start Order</button>
      </div>

      {/* About Section */}
      <div className="container my-5" style={{ maxWidth: '900px' }}>
        <h3 className="text-center mb-3">About</h3>
        <p className="text-center">
          Parthiv’s Kitchen is all about celebrating the true taste of Telangana and Andhra food. Our goal is to bring the comforting flavors of South Indian home-cooked meals right to your plate — the kind of food that reminds you of your mom’s kitchen, the smell of fresh spices, and the love that goes into every meal at home. Every recipe we use is inspired by family traditions and passed down through generations. From the spicy kick of Rayalaseema curries to the warm, simple comfort of pappu and pachadi, we stay true to authentic Telugu flavors in every dish.
          <br /><br />
          We don’t just serve food — we bring back memories. Our menu is full of dishes you’d find in everyday Andhra and Telangana homes, as well as on the streets — from crispy snacks to tasty rice bowls and full thali meals. We choose only fresh ingredients, grind our spices the traditional way, and cook each dish with the same care you’d expect at home. Whether you visit us in person or order online, Parthiv’s Kitchen is your way to enjoy real, heartwarming South Indian food, wherever you are.
        </p>
      </div>

      {/* Today's Specials Section */}
      <div className="container my-5">
        <h3 className="text-center mb-4">🍽️ Today’s Specials</h3>
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img src={biryaniImg} alt="Boneless Biryani" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Boneless Chicken Biryani <span className="badge bg-danger ms-2">🔥 Hot</span>
                </h5>
                <p className="card-text text-muted">Spicy and flavorful biryani served with raita and salan.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img src={vadaImg} alt="Garelu Sambar" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Medu Vada with Sambar <span className="badge bg-warning text-dark ms-2">🆕 New</span>
                </h5>
                <p className="card-text text-muted">Crispy lentil fritters served with hot sambar and chutneys.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img src={pulusuImg} alt="Royyala Pulusu" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Royyala Pulusu <span className="badge bg-success ms-2">⭐ Chef’s Pick</span>
                </h5>
                <p className="card-text text-muted">A tangy prawn curry cooked the Andhra way.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Dishes Section */}
      <div className="container my-5">
        <h3 className="text-center mb-4">🌟 Popular Picks</h3>
        <div className="row justify-content-center">
          {menuItems.slice(0, 3).map((item) => (
            <div className="col-12 col-sm-6 col-md-4 mb-4" key={item._id}>
              <div className="card shadow-sm h-100 border-0 rounded-4">
                <img
                  src={item.image?.startsWith('http') ? item.image : `${process.env.REACT_APP_API_URL}${item.image || ''}`}
                  alt={item.name}
                  className="card-img-top rounded-top-4"
                  style={{ height: '220px', objectFit: 'cover' }}
                />
                <div className="card-body text-center">
                  <h5 className="card-title fw-bold">{item.name}</h5>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Hours Section */}
      <div className="container my-5" style={{ maxWidth: '900px' }}>
        <h3 className="text-center mb-3">Store Hours</h3>
        <ul className="list-unstyled text-center">
          <li><strong>Monday - Thursday:</strong> 11 AM to 11 PM</li>
          <li><strong>Friday - Saturday:</strong> 11 AM to 12 AM (Midnight)</li>
          <li><strong>Sunday:</strong> 11 AM to 10 PM</li>
        </ul>
      </div>
    </div>
  );
}

export default HomePage;