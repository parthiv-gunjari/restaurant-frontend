// /client/src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/HomePage.css';
import poster1 from '../assets/images/poster-1.jpg';
import poster2 from '../assets/images/poster-2.jpeg';
import poster3 from '../assets/images/poster-3.jpg';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage-container">
      {/* Branding Section */}
      <div className="branding text-center py-3 bg-warning-subtle">
        <h1 style={{ fontWeight: 'bold', fontFamily: 'serif' }}>Parthiv&apos;s Kitchen</h1>
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
    </div>
  );
}

export default HomePage;