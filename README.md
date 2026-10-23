# Simple E-commerce Store

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
