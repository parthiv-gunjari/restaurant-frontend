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
          Parthiv&apos;s Kitchen is born out of a deep-rooted passion for preserving the culinary legacy of Telangana and Andhra Pradesh. Our goal is simple — to bring the warmth, flavor, and comfort of home-style Indian meals to your plate, no matter where you are. Each recipe is a tribute to the generations of mothers and grandmothers who’ve cooked with love, patience, and uncompromising attention to tradition. Whether it&apos;s the spicy punch of a Rayalaseema curry or the comforting richness of a Telugu thali, we aim to deliver authenticity in every bite.
          <br /><br />
          From sizzling street-style snacks to soulful homemade curries, our dishes are crafted with fresh ingredients and native spices that instantly transport you back to the bustling kitchens and vibrant food streets of South India. Dining at Parthiv’s Kitchen is not just about satisfying hunger — it’s about reliving memories, embracing heritage, and feeling the joy of comfort food served with heart.
        </p>
      </div>
    </div>
  );
}

export default HomePage;