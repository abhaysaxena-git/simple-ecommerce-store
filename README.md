## 🚀 Live Demo

[Visit ShopEase E-commerce Store](https://simple-ecommerce-store-po3s.onrender.com)



# Simple E-commerce Store# Simple E-commerce Store

A simple e-commerce web application where users can browse products, add items to their cart, create accounts, and manage their orders.

## 🚀 Live Demo

[Visit ShopEase E-commerce Store](https://simple-ecommerce-store-po3s.onrender.com)

## Features

- Browse products and view product details
- Add and remove items from the shopping cart
- Save cart items in browser localStorage
- User registration and login
- Secure password hashing and JWT authentication
- Checkout and place orders
- View order history
- SQLite database for users, products, and orders
- Responsive user interface

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Authentication:** JWT and bcrypt

## Project Structure

- `server.js` – Backend server, API routes, and database setup
- `public/index.html` – Main store page
- `public/styles.css` – Application styling
- `public/app.js` – Frontend functionality

## Future Improvements

- Product search and category filters
- Product reviews and ratings
- Improved mobile shopping experience
- Integration with a real payment gateway
- Better order and inventory management

## Note

This project was built for learning and practice. The checkout process saves orders in the database but does not process real payments.


A starter e-commerce project with:
- Product listings and product detail view
- Shopping cart (saved in browser localStorage)
- User registration and login
- SQLite database for users, products and orders
- Order checkout and order history
- Password hashing and JWT authentication

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract this folder and open it in VS Code.
2. Open a terminal in this folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000

The SQLite database (`store.db`) and sample products are created automatically on first run.

## Project structure
- `server.js` — Express server, API routes, SQLite setup
- `public/index.html` — store UI
- `public/styles.css` — styling
- `public/app.js` — frontend logic

## Notes
- This is a learning/demo project, not production-ready.
- For production, use environment variables for JWT secrets, HTTPS, validation/rate limiting, CSRF protection where relevant, and a real payment provider.
- Checkout creates an order record; it does not charge a real payment method.
