// /client/src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
// Add the following in your public/index.html <head> for better font styling:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap" rel="stylesheet">
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/css/HomePage.css';
import muttonBiryaniPoster from '../assets/images/muttondumbiryani.jpg';
import jeeraRicePoster from '../assets/images/jeerarice.jpg';
import paneerButterMasalaPoster from '../assets/images/pannerbuttermasala.jpg';
import curdRicePoster from '../assets/images/curdrice.jpg';
import dosaVadaPoster from '../assets/images/dosavada.jpg';
import eggPoster from '../assets/images/egg.jpg';
import plainDosaPoster from '../assets/images/plaindosa.jpg';
import biryaniImg from '../assets/images/65-biryani.jpg';
import vadaImg from '../assets/images/sambar-vada.jpg';
import pulusuImg from '../assets/images/Royyala-pulusu.jpg';
import ankpurChickenImg from '../assets/images/chickencurry.jpg';
import chilliFishImg from '../assets/images/chillifish.jpg';
import eggFryImg from '../assets/images/eggfry.jpg';
import { BASE_URL } from '../utils/api';
import { isStoreOpen } from '../utils/storeStatus';

function HomePage() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [showScroll, setShowScroll] = useState(false);
  const [ordersPaused, setOrdersPaused] = useState(false);

  const storeOpen = isStoreOpen();

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const firstVisit = sessionStorage.getItem("hasVisited");
    if (!firstVisit) {
      toast.info("Waking up our kitchen... please wait a moment while we load our items 🍽️", {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      sessionStorage.setItem("hasVisited", "true");
    }
    // Check ordersPaused status from localStorage
    const paused = localStorage.getItem('ordersPaused') === 'true';
    setOrdersPaused(paused);

    axios.get(`${BASE_URL}/api/menu`)
      .then(res => {
        const data = res.data;
        const topOrdered = [...data]
          .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
          .slice(0, 3);
        setMenuItems(topOrdered);
      })
      .catch(err => console.error("Error fetching popular picks:", err));
  }, []);

  // Listen for changes to ordersPaused in localStorage (cross-tab/programmatic)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ordersPaused') {
        setOrdersPaused(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="homepage-container">
      {/* Thin Top Bar for Mobile */}
      <div className="mobile-topbar d-lg-none text-white text-center py-1 px-2">
        🔥 Order Now & Taste the Spice of Telangana!
      </div>
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
        {!storeOpen && (
          <div className="alert alert-danger text-center my-3" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
            ⏳ We're currently <strong>closed</strong>. Please check back during our store hours.
          </div>
        )}
        {ordersPaused && (
  <div className="d-flex justify-content-center my-3">
    <div
      className="alert alert-warning d-flex align-items-center shadow-sm border-start border-5 border-warning-subtle p-3"
      style={{
        backgroundColor: '#fff8e1',
        maxWidth: '700px',
        width: '100%',
      }}
    >
      <i className="bi bi-exclamation-triangle-fill text-warning me-3 fs-4"></i>
      <div>
        <h6 className="mb-1 fw-bold text-dark">Orders Paused</h6>
        <p className="mb-0 text-muted">We're temporarily not accepting orders at the moment. Please check back soon.</p>
      </div>
    </div>
  </div>
)}
      </div>
      {/* Carousel Section */}
     <div id="carouselExampleIndicators" className="carousel slide full-width-carousel" data-bs-ride="carousel" data-bs-interval="2000">
        <div className="carousel-indicators">
          {[...Array(7)].map((_, index) => (
            <button
              key={index}
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide-to={index}
              className={index === 0 ? 'active' : ''}
            ></button>
          ))}
        </div>
        <div className="carousel-inner">
          {[muttonBiryaniPoster, jeeraRicePoster, paneerButterMasalaPoster, curdRicePoster, dosaVadaPoster, eggPoster, plainDosaPoster].map((img, index) => (
            <div key={index} className={`carousel-item${index === 0 ? ' active' : ''}`}>
              <img
                loading="lazy"
                src={img}
                className="d-block w-100"
                alt={`Poster ${index + 1}`}
                style={{
                  height: '450px',
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            </div>
          ))}
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
  At Parthiv’s Kitchen, we celebrate the bold, comforting flavors of Telangana and Andhra cuisine. Our mission is to bring the warmth of South Indian home-cooked meals right to your plate — the kind that reminds you of your mom’s kitchen, the aroma of fresh spices, and the love poured into every dish.
  <br /><br />
  Every recipe is rooted in tradition, inspired by family, and passed down through generations. From the spicy punch of Telangana-style curries to the soul-soothing comfort of pappu and pachadi, we stay true to authentic Telugu flavors in every bite.
  <br /><br />
  But we don’t just serve food — we serve memories. Our menu reflects everyday meals from Andhra and Telangana homes, street-side favorites, and festive specialties. We use fresh ingredients, grind our spices the traditional way, and cook with the same care you’d expect in your own home.
  <br /><br />
  Whether you’re dining with us or ordering online, Parthiv’s Kitchen is your destination for real, heartwarming South Indian food — wherever you are.
</p>
      </div>

      {/* Today's Specials Section */}
      <div className="container my-5">
        <h3 className="text-center mb-4">🍽️ Today’s Specials</h3>
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img loading="lazy" src={ankpurChickenImg} alt="Ankpur Chicken" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Ankapur Chicken <span className="badge bg-danger ms-2">🔥 Hot</span>
                </h5>
                <p className="card-text text-muted">Fiery chicken curry bursting with village-style flavors.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img loading="lazy" src={chilliFishImg} alt="Chilli Fish" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Chilli Fish <span className="badge bg-warning text-dark ms-2">🆕 New</span>
                </h5>
                <p className="card-text text-muted">Crispy fried fish tossed in spicy Indo-Chinese sauce.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <img loading="lazy" src={eggFryImg} alt="Egg Fry" className="card-img-top rounded-top-4" style={{ height: '220px', objectFit: 'cover' }} />
              <div className="card-body">
                <h5 className="card-title fw-bold">
                  Egg Fry <span className="badge bg-success ms-2">⭐ Chef’s Pick</span>
                </h5>
                <p className="card-text text-muted">Simple yet bold — masala-coated egg fry perfection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catering Section */}
      <div className="container my-5" style={{ maxWidth: '900px' }}>
        <h3 className="text-center mb-4">🍱 Catering Services</h3>
        <p className="text-center text-muted">
          Planning a party, event, or family gathering? Parthiv’s Kitchen offers delicious, homestyle South Indian catering tailored for every occasion.
        </p>
        <div className="row text-center mt-4">
          <div className="col-md-4 mb-3">
            <i className="bi bi-people-fill fs-1 text-primary"></i>
            <h5 className="mt-2 fw-bold">Events We Serve</h5>
            <p className="text-muted small">House parties, birthdays, pujas, corporate events & more.</p>
          </div>
          <div className="col-md-4 mb-3">
            <i className="bi bi-box-seam fs-1 text-success"></i>
            <h5 className="mt-2 fw-bold">Flexible Menu</h5>
            <p className="text-muted small">Choose from biryanis, curries, snacks, sweets — all freshly made.</p>
          </div>
          <div className="col-md-4 mb-3">
            <i className="bi bi-telephone-forward-fill fs-1 text-warning"></i>
            <h5 className="mt-2 fw-bold">Book Now</h5>
            <p className="text-muted small">Call <strong>+1 9408435294</strong> or email <strong>parthivskitchen7@gmail.com</strong></p>
          </div>
        </div>
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary px-4 py-2"
            onClick={() =>
              window.location.href =
                'mailto:parthivskitchen7@gmail.com?subject=Catering%20Quote%20Request'
            }
          >
            Get a Catering Quote
          </button>
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

      {/* Contact Section */}
      <div className="container my-5" style={{ maxWidth: '900px' }}>
        <h3 className="text-center mb-3">📞 Contact Us</h3>
        <div className="row justify-content-center text-center">
          <div className="col-12 col-md-6 col-lg-3 mb-3">
            <a href="mailto:parthivskitchen7@gmail.com" className="text-decoration-none text-dark">
              <div className="d-flex flex-column align-items-center">
                <i className="bi bi-envelope-fill fs-3 mb-2"></i>
                <div>Email</div>
                <small>parthivskitchen7@gmail.com</small>
              </div>
            </a>
          </div>
          <div className="col-12 col-md-6 col-lg-3 mb-3">
            <a href="tel:+919876543210" className="text-decoration-none text-dark">
              <div className="d-flex flex-column align-items-center">
                <i className="bi bi-telephone-fill fs-3 mb-2"></i>
                <div>Phone</div>
                <small>+1 9408435294</small>
              </div>
            </a>
          </div>
          <div className="col-12 col-md-6 col-lg-3 mb-3">
            <a href="https://wa.me/19408435294" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-dark">
              <div className="d-flex flex-column align-items-center">
                <i className="bi bi-whatsapp fs-3 mb-2" style={{ color: "#25D366" }}></i>
                <div>WhatsApp</div>
                <small>Chat Now</small>
              </div>
            </a>
          </div>
          <div className="col-12 col-md-6 col-lg-3 mb-3">
            <a href="https://instagram.com/parthivskitchen" target="_blank" rel="noopener noreferrer" className="text-decoration-none text-dark">
              <div className="d-flex flex-column align-items-center">
                <i className="bi bi-instagram fs-3 mb-2" style={{ color: "#C13584" }}></i>
                <div>Instagram</div>
                <small>@parthivskitchen</small>
              </div>
            </a>
          </div>
        </div>
      </div>
      {showScroll && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn btn-dark position-fixed"
          style={{ bottom: '80px', right: '20px', zIndex: 1000, borderRadius: '50%', width: '40px', height: '40px' }}
        >
          ↑
        </button>
      )}
      {/* Floating Start Order Button (Mobile Only) */}
      <button
        className="btn btn-warning d-lg-none position-fixed"
        style={{
          bottom: '170px',
          left: '10px',
          zIndex: 1000,
          borderRadius: '50px',
          padding: '10px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          opacity: 0.92,
        }}
        onClick={() => navigate('/menu')}
      >
        🍽️ Start Order
      </button>
      {/* Floating Start Order Button (Large Screens) */}
      <button
        className="btn btn-warning d-none d-lg-inline-block position-fixed"
        style={{
          bottom: '140px',
          left: '20px',
          zIndex: 1000,
          borderRadius: '50px',
          padding: '10px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          opacity: 0.92,
        }}
        onClick={() => navigate('/menu')}
      >
        🍽️ Start Order
      </button>
    {/* Footer */}
    <footer className="text-center text-muted py-4 bg-light mt-5" style={{ fontSize: '0.9rem' }}>
      © 2025 Parthiv's Kitchen | All rights reserved | Designed by Parthiv Kumar
    </footer>
    <ToastContainer />
    </div>
  );
}

export default HomePage;
