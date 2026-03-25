# 🍪 Daun Dulce

Daun Dulce is a full-stack MERN (MongoDB, Express, React, Node.js) web application built for a local cookie business. It provides a seamless experience for customers to browse the menu, submit pre-orders, and track their order history. It also features a comprehensive, secured Admin Dashboard for the business owners to manage orders, products, customers, and dynamic site content.

## ✨ Features

### Customer/Public Facing

- **Dynamic Menu:** Browse available cookies, including featured items, pricing, and tags.
- **Pre-Order System:** Easy-to-use form to specify quantities, flavors, pickup dates, and payment methods.
- **Customer Accounts:** Users can register, log in, and view their past and current pre-orders.
- **Contact Form:** Send inquiries directly to the business owners via email.
- **Responsive Design:** Fully responsive UI built with standard CSS modules for mobile and desktop.

---

### Admin Dashboard

- **Order Management:** View, search, and update the status of incoming orders (Pending, Confirmed, Completed, Cancelled).
- **Product Catalog:** Add, edit, delete, and toggle the visibility/featured status of cookies (includes image uploading).
- **Customer Directory:** View registered customers and their order history.
- **Content Management System (CMS):** Dynamically edit the text, images, and form options on the "About" and "Pre-Order" pages directly from the dashboard without touching the code.
- **Email Notifications:** Automated email alerts when new pre-orders or contact messages are submitted.

## 🛠️ Tech Stack

### Frontend

- React 19 (via Vite)
- React Router DOM v7
- Axios
- React Icons
- CSS Modules

### Backend

- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Customer/Admin Authentication
- Bcryptjs for password hashing
- Multer (Local Image Uploads)
- Nodemailer (Email Notifications)

## 📂 Project Structure

```plaintext
daun-dulce/
├── client/                 # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images and icons
│   │   ├── components/     # Reusable UI components & layouts
│   │   ├── context/        # React Context (AuthContext, CustomerContext)
│   │   ├── pages/          # Route components (Home, Menu, AdminDashboard, etc.)
│   │   ├── services/       # Axios API setup
│   │   └── styles/         # Global CSS
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Database connection setup
│   ├── middleware/         # Auth & Multer upload middlewares
│   ├── models/             # Mongoose schemas (Admin, Cookie, Customer, Order, SiteContent)
│   ├── routes/             # API endpoints
│   ├── utils/              # Helper functions (Nodemailer)
│   ├── server.js           # Server entry point
│   ├── seed.js             # Database seeding script
│   └── package.json
└── package.json            # Root package.json for concurrently running both servers
```

## 🚀 Getting Started

### Prerequisites

- ** Node.js (v18 or higher recommended)
- ** MongoDB (Local instance or MongoDB Atlas URI)

---

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/eanthonycarranza/daun-dulce.git
cd daun-dulce
```

#### 2. Install dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

#### 3. Set up Environment Variables

Create a `.env` file in the `/server` directory and add:

```env
PORT=5001
MONGO_URI=***
JWT_SECRET=***

# Nodemailer settings for order/contact notifications
EMAIL_USER=***
EMAIL_PASS=***

# Default Admin Credentials for seeding
ADMIN_USERNAME=***
ADMIN_PASSWORD=***
```

#### 4. Seed the Database

```bash
npm run seed
```

#### 5. Run the Application

```bash
npm run dev
```

- ** Client: http://localhost:5173
- ** Server: http://localhost:5001

## 🔐 Accessing the Admin Dashboard

1. Navigate to: http://localhost:5173/admin/login  
2. Log in using credentials from your `.env` file:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`  
3. Manage orders, products, and site content from the dashboard.

## 📝 License

This project is open-source and available under the ISC License.
