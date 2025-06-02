// /client/src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage-container">
      {/* Carousel Section */}
      <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&h=400&q=80" className="d-block w-100" alt="Indian Curry" />
          </div>
          <div className="carousel-item">
            <img src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&h=400&q=80" className="d-block w-100" alt="Indian Thali" />
          </div>
          <div className="carousel-item">
            <img src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&h=400&q=80" className="d-block w-100" alt="Indian Biryani" />
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
          At Our Restaurant, we proudly serve traditional Telangana and Andhra-style cuisine that evokes the warmth and nostalgia of home-cooked meals. Our chefs prepare each dish with care using fresh, high-quality ingredients, ensuring rich, authentic flavors in every bite. Whether you're miles away from India or craving that signature spicy thali or biryani, one meal with us will take you back to the comfort of home.
        </p>
      </div>
    </div>
  );
}

export default HomePage;