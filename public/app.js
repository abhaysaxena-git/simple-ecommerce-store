const $ = (selector) => document.querySelector(selector);
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("shopease-cart") || "[]"),
  token: localStorage.getItem("shopease-token") || "",
  user: JSON.parse(localStorage.getItem("shopease-user") || "null"),
  toastTimer: null
};

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));

async function api(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token && !url.includes("/login")) logout(false);
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function saveCart() {
  localStorage.setItem("shopease-cart", JSON.stringify(state.cart));
  $("#cart-count").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateHeader() {
  $("#auth-btn").textContent = state.user ? `Hi, ${state.user.name.split(" ")[0]}` : "Log in";
  $("#cart-count").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

async function loadProducts() {
  try {
    const params = new URLSearchParams();
    const search = $("#search-input").value.trim();
    const category = $("#category-filter").value;
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    state.products = await api(`/api/products?${params.toString()}`);
    renderProducts();
    const categories = [...new Set(state.products.map(p => p.category))];
    const select = $("#category-filter");
    const previous = select.value;
    const allCategories = [...new Set([...categories, ...(state.allCategories || [])])].sort();
    state.allCategories = allCategories;
    select.innerHTML = '<option value="">All categories</option>' + allCategories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    select.value = allCategories.includes(previous) ? previous : "";
  } catch (err) {
    $("#product-grid").innerHTML = `<p class="muted">${escapeHTML(err.message)}</p>`;
  }
}

function renderProducts() {
  const grid = $("#product-grid");
  if (!state.products.length) {
    grid.innerHTML = '<div class="empty-state"><strong>No finds just yet</strong>Try another search or category.</div>';
    return;
  }
  grid.innerHTML = state.products.map(p => `
    <article class="product-card">
      <div class="product-image-wrap" data-detail="${p.id}" role="button" tabindex="0" aria-label="View ${escapeHTML(p.name)}">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x700/f0f1eb/315b42?text=ShopEase'">
        <span class="category-pill">${escapeHTML(p.category)}</span>
        <button class="quick-add" data-add="${p.id}" aria-label="Add ${escapeHTML(p.name)} to cart">+</button>
      </div>
      <div class="product-info"><div><h3 data-detail="${p.id}">${escapeHTML(p.name)}</h3><p>${p.stock > 0 ? "Ready to ship" : "Out of stock"}</p></div><span class="price">${money(p.price)}</span></div>
    </article>`).join("");
}

function addToCart(id) {
  const product = state.products.find(p => p.id === Number(id)) || null;
  if (!product) return;
  const item = state.cart.find(x => x.productId === product.id);
  if (item) {
    if (item.quantity >= product.stock) return showToast("You've reached the available stock for this item.");
    item.quantity += 1;
  } else {
    if (product.stock < 1) return showToast("This product is currently out of stock.");
    state.cart.push({ productId: product.id, quantity: 1, name: product.name, price: product.price, image: product.image });
  }
  saveCart();
  renderCart();
  showToast(`${product.name} added to your cart.`);
}

function renderCart() {
  const container = $("#cart-items");
  if (!state.cart.length) {
    container.innerHTML = '<div class="empty-state"><strong>Your bag is taking a break</strong>Add something you love to get started.</div>';
  } else {
    container.innerHTML = state.cart.map(item => `
      <div class="cart-row">
        <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.src='https://placehold.co/150x170/f0f1eb/315b42?text=Item'">
        <div><h4>${escapeHTML(item.name)}</h4><span class="muted">${money(item.price)}</span>
          <div class="qty-controls"><button data-qty="${item.productId}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item.productId}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove-btn" data-remove="${item.productId}">Remove</button></div>
        </div><span class="cart-price">${money(item.price * item.quantity)}</span>
      </div>`).join("");
  }
  $("#cart-total").textContent = money(state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  $("#checkout-btn").disabled = !state.cart.length;
  $("#checkout-btn").style.opacity = state.cart.length ? "1" : ".5";
}

function openCart() {
  renderCart();
  $("#overlay").classList.remove("hidden");
  $("#cart-drawer").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  $("#overlay").classList.add("hidden");
  $("#cart-drawer").classList.add("hidden");
  document.body.style.overflow = "";
}

function openModal(content) {
  $("#modal-content").innerHTML = content;
  $("#modal-backdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#modal-backdrop").classList.add("hidden");
  document.body.style.overflow = "";
}

function showAuth(mode = "login") {
  const register = mode === "register";
  openModal(`
    <p class="eyebrow">WELCOME TO SHOPEASE</p>
    <h2 id="modal-title">${register ? "Create your account" : "Welcome back"}</h2>
    <p class="modal-intro">${register ? "Create an account to place orders and keep track of your purchases." : "Log in to check out and view your orders."}</p>
    <form id="auth-form">
      ${register ? '<div class="form-field"><label for="auth-name">Full name</label><input id="auth-name" name="name" autocomplete="name" required maxlength="80" placeholder="Your name"></div>' : ""}
      <div class="form-field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
      <div class="form-field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="6" required placeholder="At least 6 characters"></div>
      <p class="form-error" id="auth-error"></p>
      <button class="primary-button full-width" type="submit">${register ? "Create account" : "Log in"} <span>→</span></button>
    </form>
    <button class="form-switch" id="auth-switch">${register ? "Already have an account? Log in" : "New here? Create an account"}</button>
  `);
  $("#auth-switch").addEventListener("click", () => showAuth(register ? "login" : "register"));
  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { email: form.get("email"), password: form.get("password") };
    if (register) payload.name = form.get("name");
    const submit = event.currentTarget.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const result = await api(`/api/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(payload) });
      state.token = result.token;
      state.user = result.user;
      localStorage.setItem("shopease-token", state.token);
      localStorage.setItem("shopease-user", JSON.stringify(state.user));
      updateHeader();
      closeModal();
      showToast(register ? "Your account is ready!" : "You're logged in.");
    } catch (err) {
      $("#auth-error").textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });
}

function logout(showMessage = true) {
  state.token = "";
  state.user = null;
  localStorage.removeItem("shopease-token");
  localStorage.removeItem("shopease-user");
  updateHeader();
  if (showMessage) showToast("You have been logged out.");
}

async function showProduct(id) {
  try {
    const p = await api(`/api/products/${id}`);
    openModal(`
      <div class="detail-layout">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" onerror="this.src='https://placehold.co/500x600/f0f1eb/315b42?text=ShopEase'">
        <div><p class="eyebrow">${escapeHTML(p.category)}</p><h2 id="modal-title">${escapeHTML(p.name)}</h2><div class="detail-price">${money(p.price)}</div><p class="detail-description">${escapeHTML(p.description)}</p><p class="stock-note">${p.stock > 0 ? `${p.stock} available` : "Currently out of stock"}</p><button class="primary-button" id="detail-add" ${p.stock < 1 ? "disabled" : ""}>Add to cart <span>→</span></button></div>
      </div>`);
    $("#detail-add").addEventListener("click", () => { addToCart(p.id); closeModal(); });
  } catch (err) { showToast(err.message); }
}

async function checkout() {
  if (!state.cart.length) return showToast("Your cart is empty.");
  if (!state.user) {
    closeCart();
    showAuth("login");
    return;
  }
  const button = $("#checkout-btn");
  button.disabled = true;
  button.textContent = "Placing your order…";
  try {
    const result = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items: state.cart.map(item => ({ productId: item.productId, quantity: item.quantity })) })
    });
    state.cart = [];
    saveCart();
    closeCart();
    showToast(`Order #${result.orderId} placed successfully!`);
    await loadProducts();
    showOrders();
  } catch (err) {
    showToast(err.message);
  } finally {
    button.innerHTML = 'Place order <span>→</span>';
    button.disabled = !state.cart.length;
  }
}

async function showOrders() {
  $("#hero").classList.add("hidden");
  $("#products").classList.add("hidden");
  const view = $("#orders-view");
  view.classList.remove("hidden");
  view.innerHTML = '<p class="muted">Loading your orders…</p>';
  view.scrollIntoView({ behavior: "smooth", block: "start" });
  if (!state.user) {
    view.innerHTML = '<div class="empty-state"><strong>Log in to view your orders</strong><button class="primary-button" id="orders-login">Log in <span>→</span></button></div>';
    $("#orders-login").addEventListener("click", () => showAuth("login"));
    return;
  }
  try {
    const orders = await api("/api/orders");
    view.innerHTML = `<div class="section-heading"><div><p class="eyebrow">YOUR ACCOUNT</p><h2>Your orders</h2></div><button class="nav-button" id="back-to-shop">← Back to shop</button></div>` +
      (orders.length ? orders.map(o => `<article class="order-card"><div><h3>Order #${o.id} · ${escapeHTML(o.status)}</h3><p>${new Date(o.created_at + "Z").toLocaleString()}</p><p>${o.items.map(i => `${escapeHTML(i.product_name)} × ${i.quantity}`).join(", ")}</p></div><div class="order-total">${money(o.total)}</div></article>`).join("") : '<div class="empty-state"><strong>No orders yet</strong>Your future favourites will show up here.</div>');
    $("#back-to-shop").addEventListener("click", backToShop);
  } catch (err) {
    view.innerHTML = `<p>${escapeHTML(err.message)}</p><button class="primary-button" id="back-to-shop">Back to shop</button>`;
    $("#back-to-shop").addEventListener("click", backToShop);
  }
}

function backToShop() {
  $("#hero").classList.remove("hidden");
  $("#products").classList.remove("hidden");
  $("#orders-view").classList.add("hidden");
  $("#products").scrollIntoView({ behavior: "smooth" });
}

$("#product-grid").addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  if (add) { event.stopPropagation(); addToCart(add.dataset.add); return; }
  const detail = event.target.closest("[data-detail]");
  if (detail) showProduct(detail.dataset.detail);
});
$("#product-grid").addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-detail]")) showProduct(event.target.dataset.detail);
});
$("#cart-items").addEventListener("click", event => {
  const qty = event.target.closest("[data-qty]");
  const remove = event.target.closest("[data-remove]");
  if (remove) state.cart = state.cart.filter(x => x.productId !== Number(remove.dataset.remove));
  if (qty) {
    const item = state.cart.find(x => x.productId === Number(qty.dataset.qty));
    if (item) {
      item.quantity += Number(qty.dataset.delta);
      if (item.quantity <= 0) state.cart = state.cart.filter(x => x.productId !== item.productId);
      const product = state.products.find(p => p.id === item.productId);
      if (product && item.quantity > product.stock) item.quantity = product.stock;
    }
  }
  saveCart(); renderCart();
});
$("#cart-btn").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#checkout-btn").addEventListener("click", checkout);
$("#auth-btn").addEventListener("click", () => state.user ? openModal(`<p class="eyebrow">YOUR ACCOUNT</p><h2 id="modal-title">Hi, ${escapeHTML(state.user.name.split(" ")[0])}</h2><p class="modal-intro">${escapeHTML(state.user.email)}</p><button class="primary-button full-width" id="view-orders">View my orders</button><button class="form-switch" id="logout-btn">Log out</button>`) : showAuth("login"));
$("#modal-content").addEventListener("click", event => {
  if (event.target.closest("#view-orders")) { closeModal(); showOrders(); }
  if (event.target.closest("#logout-btn")) { logout(); closeModal(); }
});
$("#orders-btn").addEventListener("click", showOrders);
$("#close-modal").addEventListener("click", closeModal);
$("#modal-backdrop").addEventListener("click", event => { if (event.target.id === "modal-backdrop") closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); closeCart(); } });
$("#search-input").addEventListener("input", () => { clearTimeout(state.searchTimer); state.searchTimer = setTimeout(loadProducts, 250); });
$("#category-filter").addEventListener("change", loadProducts);

updateHeader();
saveCart();
renderCart();
loadProducts();
