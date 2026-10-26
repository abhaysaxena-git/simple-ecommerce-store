const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "replace-this-secret-before-deployment";
const db = new Database(path.join(__dirname, "store.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 20
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Placed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (count === 0) {
  const insert = db.prepare("INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
  const seed = [
    ["Everyday Headphones", "Comfortable over-ear headphones with clear sound and a long-lasting battery.", 1499, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700", "Electronics", 18],
    ["Classic Wristwatch", "A clean, versatile watch design for everyday wear.", 2299, "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=700", "Accessories", 12],
    ["Minimal Backpack", "A practical everyday backpack with a spacious main compartment.", 1899, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700", "Accessories", 15],
    ["Running Sneakers", "Lightweight sneakers designed for daily walks and workouts.", 2799, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700", "Footwear", 10],
    ["Ceramic Coffee Mug", "A simple ceramic mug for your morning coffee or tea.", 399, "https://images.unsplash.com/photo-1510987836583-e3fb9586c7b3?w=700", "Home", 30],
    ["Desk Lamp", "A modern desk lamp for focused work and study sessions.", 999, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700", "Home", 20],
    ["Classic Cotton T-Shirt", "A soft, breathable cotton T-shirt for everyday comfort.", 599, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700", "Men's Clothing", 35],
    ["Essential White Shirt", "A smart, versatile button-down shirt for work or casual outings.", 999, "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?w=700", "Men's Clothing", 20],
    ["Slim Fit Blue Jeans", "Everyday blue denim jeans with a comfortable slim fit.", 1599, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700", "Men's Clothing", 24],
    ["Printed Casual Shirt", "A relaxed printed shirt that adds colour to your daily wardrobe.", 1099, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700", "Men's Clothing", 18],
    ["Kurta Pajama Set", "A classic kurta pajama set for celebrations and family occasions.", 1799, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700", "Ethnic Wear", 16],
    ["Women's Floral Dress", "A light floral dress with an easy, graceful everyday fit.", 1499, "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700", "Women's Clothing", 18],
    ["Women's Casual Top", "An easy-to-style top for everyday looks and weekend plans.", 799, "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=700", "Women's Clothing", 22],
    ["Women's Denim Jeans", "Classic denim jeans designed for versatile everyday outfits.", 1399, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700", "Women's Clothing", 20],
    ["Women's Kurta", "A comfortable printed kurta for casual and festive occasions.", 1199, "https://images.unsplash.com/photo-1583391733958-d2c3b6f7c1a8?w=700", "Women's Ethnic Wear", 15],
    ["Wireless Bluetooth Speaker", "A compact wireless speaker for music at home or on the go.", 1899, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700", "Electronics", 14],
    ["Smart Watch", "A modern smartwatch-style wearable for everyday activity tracking.", 2499, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700", "Electronics", 12],
    ["Wireless Mouse", "A comfortable wireless mouse for study, work, and browsing.", 699, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700", "Electronics", 25],
    ["Mechanical Keyboard", "A sturdy keyboard for typing, coding, and gaming setups.", 2299, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700", "Electronics", 10],
    ["Phone Charging Cable", "A durable everyday charging cable. Check device compatibility before use.", 299, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700", "Electronics", 40],
    ["Laptop Sleeve", "A padded sleeve to help protect your laptop while travelling.", 899, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700", "Electronics", 17],
    ["Women's Handbag", "A simple everyday handbag with room for daily essentials.", 1699, "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700", "Accessories", 13],
    ["Everyday Sandals", "Comfortable everyday sandals with a simple, versatile design.", 799, "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=700", "Footwear", 20],
    ["Cotton Pajama Set", "A soft, comfortable pajama set for relaxing at home.", 999, "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700", "Women's Clothing", 14]
  ];
  const insertMany = db.transaction(items => items.forEach(p => insert.run(...p)));
  insertMany(seed);
}

// Keep the original starter products, and add any missing catalogue items on every startup.
// This also updates an existing store.db without deleting users, orders, or cart data.
const extraProducts = [
  ["Classic Cotton T-Shirt", "A soft, breathable cotton T-shirt for everyday comfort.", 599, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700", "Men's Clothing", 35],
  ["Essential White Shirt", "A smart, versatile button-down shirt for work or casual outings.", 999, "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?w=700", "Men's Clothing", 20],
  ["Slim Fit Blue Jeans", "Everyday blue denim jeans with a comfortable slim fit.", 1599, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=700", "Men's Clothing", 24],
  ["Printed Casual Shirt", "A relaxed printed shirt that adds colour to your daily wardrobe.", 1099, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700", "Men's Clothing", 18],
  ["Kurta Pajama Set", "A classic kurta pajama set for celebrations and family occasions.", 1799, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700", "Ethnic Wear", 16],
  ["Women's Floral Dress", "A light floral dress with an easy, graceful everyday fit.", 1499, "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700", "Women's Clothing", 18],
  ["Women's Casual Top", "An easy-to-style top for everyday looks and weekend plans.", 799, "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=700", "Women's Clothing", 22],
  ["Women's Denim Jeans", "Classic denim jeans designed for versatile everyday outfits.", 1399, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700", "Women's Clothing", 20],
  ["Women's Kurta", "A comfortable printed kurta for casual and festive occasions.", 1199, "https://images.unsplash.com/photo-1583391733958-d2c3b6f7c1a8?w=700", "Women's Ethnic Wear", 15],
  ["Wireless Bluetooth Speaker", "A compact wireless speaker for music at home or on the go.", 1899, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700", "Electronics", 14],
  ["Smart Watch", "A modern smartwatch-style wearable for everyday activity tracking.", 2499, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700", "Electronics", 12],
  ["Wireless Mouse", "A comfortable wireless mouse for study, work, and browsing.", 699, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700", "Electronics", 25],
  ["Mechanical Keyboard", "A sturdy keyboard for typing, coding, and gaming setups.", 2299, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700", "Electronics", 10],
  ["Phone Charging Cable", "A durable everyday charging cable. Check device compatibility before use.", 299, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=700", "Electronics", 40],
  ["Laptop Sleeve", "A padded sleeve to help protect your laptop while travelling.", 899, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700", "Electronics", 17],
  ["Women's Handbag", "A simple everyday handbag with room for daily essentials.", 1699, "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700", "Accessories", 13],
  ["Everyday Sandals", "Comfortable everyday sandals with a simple, versatile design.", 799, "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=700", "Footwear", 20],
  ["Cotton Pajama Set", "A soft, comfortable pajama set for relaxing at home.", 999, "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700", "Women's Clothing", 14]
];
const addMissingProduct = db.prepare("INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
const existingProduct = db.prepare("SELECT id FROM products WHERE name = ?");
const addMissingProducts = db.transaction(items => {
  for (const product of items) {
    if (!existingProduct.get(product[0])) addMissingProduct.run(...product);
  }
});
addMissingProducts(extraProducts);

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Please log in to continue." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Your session expired. Please log in again." });
  }
}

app.get("/api/products", (req, res) => {
  const { search = "", category = "" } = req.query;
  const products = db.prepare(`
    SELECT * FROM products
    WHERE (name LIKE ? OR description LIKE ?)
      AND (? = '' OR category = ?)
    ORDER BY id DESC
  `).all(`%${search}%`, `%${search}%`, category, category);
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product);
});

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: "Enter your name, a valid email, and a password with at least 6 characters." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name.trim(), normalizedEmail, hash);
    const user = { id: Number(result.lastInsertRowid), name: name.trim(), email: normalizedEmail };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user, token });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) return res.status(409).json({ error: "An account with this email already exists." });
    res.status(500).json({ error: "Could not create your account." });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Enter your email and password." });
  const userRow = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!userRow || !bcrypt.compareSync(password, userRow.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  const user = { id: userRow.id, name: userRow.name, email: userRow.email };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  res.json({ user, token });
});

app.get("/api/me", auth, (req, res) => res.json({ user: req.user }));

app.post("/api/orders", auth, (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Your cart is empty." });

  const normalized = [];
  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: "One or more cart items are invalid." });
    }
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    if (!product) return res.status(400).json({ error: "A product in your cart no longer exists." });
    if (product.stock < quantity) return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
    normalized.push({ product, quantity });
  }

  try {
    const createOrder = db.transaction(() => {
      const total = normalized.reduce((sum, x) => sum + x.product.price * x.quantity, 0);
      const orderResult = db.prepare("INSERT INTO orders (user_id, total) VALUES (?, ?)").run(req.user.id, total);
      const orderId = Number(orderResult.lastInsertRowid);
      const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
      for (const x of normalized) {
        insertItem.run(orderId, x.product.id, x.product.name, x.quantity, x.product.price);
        const result = updateStock.run(x.quantity, x.product.id, x.quantity);
        if (result.changes !== 1) throw new Error(`Stock changed for ${x.product.name}. Please try again.`);
      }
      return { orderId, total };
    });
    res.status(201).json({ message: "Order placed successfully!", ...createOrder() });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not place order." });
  }
});

app.get("/api/orders", auth, (req, res) => {
  const orders = db.prepare("SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  const items = db.prepare("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = ?");
  res.json(orders.map(order => ({ ...order, items: items.all(order.id) })));
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Store running at http://localhost:${PORT}`));
