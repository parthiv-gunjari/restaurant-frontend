# Full-Stack Restaurant Ordering & Management App

A comprehensive restaurant application built with the **MERN stack (MongoDB, Express.js, React.js, Node.js)**. The project includes two distinct interfaces:

-  **Customer Interface** – Browse menu, add to cart, checkout, and view order history.
- **Admin Dashboard** – Manage menu, monitor orders, update statuses, and analyze performance.

---

##  Tech Stack

### Frontend (React.js)
- React.js with modular components
- React Router (`HashRouter`) for navigation (GitHub Pages support)
- Axios for REST API communication
- Bootstrap 5 + React Icons for responsive design

###  Backend (Node.js + Express.js)
- Express.js for building REST APIs
- MongoDB + Mongoose for database modeling
- JWT for secure admin login
- Nodemailer for sending order confirmation/completion emails
- dotenv for environment variable management

###  Deployment & CI/CD
- Frontend deployed on **GitHub Pages**
- Backend hosted on **Render**
- GitHub Actions used for **CI/CD pipelines**

---

##  Features

###  Customer Interface
- Browse menu items by category
- Add/remove items to cart, update quantities
- Place orders (dummy checkout)
- Retrieve order history using email
- Mobile responsive design
- Order details persisted in MongoDB

###  Admin Dashboard
- Secure login with JWT
- Dashboard with:
  - Total orders
  - Revenue breakdown
  - Top 3 ordered items
  - Order status (pending/completed)
- Date-filterable bar chart for revenue analytics
- Manage menu items (CRUD with image upload)
- Send confirmation/completion emails automatically

---

##  Architecture Overview

### Frontend
- Pages handled by `HashRouter`
- Cart managed via React Context API
- Token-based protected routes for admin
- Axios handles secure API communication

### Backend
- JWT-protected admin routes
- Separate controllers for menu, orders, and auth
- Mongoose schema-based validation
- Nodemailer uses Gmail SMTP (via environment config)
- CORS enabled for frontend-backend integration

---

##  Live Demo

- **Frontend:**  
  [https://parthiv-gunjari.github.io/restaurant-frontend](https://parthiv-gunjari.github.io/restaurant-frontend)

- **Backend:**  
  Hosted on Render (URL hidden via `.env`)

---

##  Highlights

- Real-time analytics with daily/weekly/monthly/custom filters
- Email notifications for order status updates
- Popular items ranked in admin dashboard
- Image upload for each menu item
- Veg/Non-Veg classification and stock status
- Fully mobile responsive UI

---


##  Developer Notes

This project was built entirely from scratch to demonstrate full-stack capabilities. It covers end-to-end functionality from UI to API to DB, including advanced topics like authentication, file upload, analytics, and email automation.

---

##  Author

**Parthiv Kumar Gunjari**  
🔗 [GitHub](https://github.com/parthiv-gunjari)
