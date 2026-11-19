// ===== Cart Management =====
let cart = [];

try {
  const saved = localStorage.getItem('toolstore_cart');
  if (saved) {
    cart = JSON.parse(saved).map(item => ({
      id: Number(item.id),
      qty: Number(item.qty) || 1
    }));
  }
} catch (e) {
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('toolstore_cart', JSON.stringify(cart));
  } catch (e) {}
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId) {
  productId = Number(productId);
  if (!window.products) return;

  const product = products.find(p => Number(p.id) === productId);
  if (!product || !product.inStock) return;

  const existing = cart.find(item => Number(item.id) === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart();
  showToast('«' + product.name + '» добавлен в корзину');
}

function removeFromCart(productId) {
  productId = Number(productId);
  cart = cart.filter(item => Number(item.id) !== productId);
  saveCart();
  renderCart();
}

function changeQty(productId, delta) {
  productId = Number(productId);
  const item = cart.find(i => Number(i.id) === productId);
  if (!item) return;
  item.qty = (item.qty || 1) + delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
    renderCart();
  }
}

function getCartTotal() {
  if (!window.products) return 0;
  return cart.reduce((sum, item) => {
    const product = products.find(p => Number(p.id) === Number(item.id));
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// ===== Toast =====
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

// ===== Product Card =====
function createProductCard(product) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return '<article class="product-card">' +
    '<div class="product-image">' +
      '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy">' +
      '<div class="product-badges">' +
        (product.isNew ? '<span class="badge badge-new">Новинка</span>' : '') +
        (discount > 0 ? '<span class="badge badge-sale">−' + discount + '%</span>' : '') +
        (!product.inStock ? '<span class="badge badge-out">Нет в наличии</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="product-info">' +
      '<div class="product-category">' + product.category + '</div>' +
      '<h3 class="product-name">' + product.name + '</h3>' +
      '<div class="product-rating">' +
        '<span class="stars">' + '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating)) + '</span>' +
        '<span>' + product.rating + ' (' + product.reviews + ')</span>' +
      '</div>' +
      '<div class="product-price-row">' +
        '<span class="product-price">' + formatPrice(product.price) + '</span>' +
        (product.oldPrice ? '<span class="product-old-price">' + formatPrice(product.oldPrice) + '</span>' : '') +
      '</div>' +
      '<button class="btn-add" onclick="addToCart(' + product.id + ')" ' + (!product.inStock ? 'disabled' : '') + '>' +
        (product.inStock ? 'В корзину' : 'Нет в наличии') +
      '</button>' +
    '</div>' +
  '</article>';
}

// ===== Home =====
function renderHomeProducts() {
  if (!window.products) return;
  const popular = products.filter(function(p) { return p.isPopular; }).slice(0, 8);
  const grid = document.getElementById('popular-products');
  if (grid) {
    grid.innerHTML = popular.map(createProductCard).join('');
  }
}

// ===== Catalog =====
let currentCategory = 'all';
let currentSort = 'popular';
let maxPrice = 300000;

function renderCatalog() {
  if (!window.products) return;
  let filtered = products.filter(function(p) {
    if (currentCategory !== 'all' && p.category !== currentCategory) return false;
    if (p.price > maxPrice) return false;
    return true;
  });

  if (currentSort === 'price-asc') {
    filtered.sort(function(a, b) { return a.price - b.price; });
  } else if (currentSort === 'price-desc') {
    filtered.sort(function(a, b) { return b.price - a.price; });
  } else if (currentSort === 'rating') {
    filtered.sort(function(a, b) { return b.rating - a.rating; });
  } else {
    filtered.sort(function(a, b) { return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0); });
  }

  const grid = document.getElementById('catalog-products');
  const countEl = document.getElementById('catalog-count');
  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map(createProductCard).join('')
      : '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:40px 0;">Товары не найдены</p>';
  }
  if (countEl) {
    countEl.textContent = 'Найдено: ' + filtered.length;
  }
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.filter-option input[name="category"]').forEach(function(input) {
    input.checked = input.value === cat;
  });
  renderCatalog();
}

function setSort(sort) {
  currentSort = sort;
  renderCatalog();
}

function setMaxPrice(value) {
  maxPrice = Number(value) || 300000;
  renderCatalog();
}

// ===== Cart Page =====
function renderCart() {
  const container = document.getElementById('cart-content');
  if (!container) return;

  if (!window.products) {
    container.innerHTML = '<div class="cart-empty"><p>Ошибка загрузки данных</p></div>';
    return;
  }

  if (cart.length === 0) {
    container.innerHTML = 
      '<div class="cart-empty">' +
        '<p>Корзина пока пуста</p>' +
        '<a href="catalog.html" class="btn btn-primary" style="background:var(--primary);color:white;">Перейти в каталог</a>' +
      '</div>';
    return;
  }

  let itemsHtml = '';
  cart.forEach(function(item) {
    const product = products.find(function(p) { return Number(p.id) === Number(item.id); });
    if (!product) return;
    itemsHtml += 
      '<div class="cart-item">' +
        '<img src="' + product.image + '" alt="' + product.name + '">' +
        '<div class="cart-item-info">' +
          '<h3>' + product.name + '</h3>' +
          '<p>' + product.category + '</p>' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" onclick="changeQty(' + product.id + ', -1)">−</button>' +
            '<span class="qty-value">' + item.qty + '</span>' +
            '<button class="qty-btn" onclick="changeQty(' + product.id + ', 1)">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item-price">' +
          '<div class="price">' + formatPrice(product.price * item.qty) + '</div>' +
          '<button class="remove-btn" onclick="removeFromCart(' + product.id + ')">Удалить</button>' +
        '</div>' +
      '</div>';
  });

  const total = getCartTotal();
  const totalQty = cart.reduce(function(s, i) { return s + i.qty; }, 0);

  container.innerHTML = 
    '<div class="cart-layout">' +
      '<div class="cart-items">' + itemsHtml + '</div>' +
      '<div class="cart-summary">' +
        '<h3>Итого</h3>' +
        '<div class="summary-row">' +
          '<span>Товары (' + totalQty + ')</span>' +
          '<span>' + formatPrice(total) + '</span>' +
        '</div>' +
        '<div class="summary-row">' +
          '<span>Доставка</span>' +
          '<span>Бесплатно</span>' +
        '</div>' +
        '<div class="summary-row total">' +
          '<span>К оплате</span>' +
          '<span>' + formatPrice(total) + '</span>' +
        '</div>' +
        '<button class="btn-checkout" onclick="checkout()">Оформить заказ</button>' +
      '</div>' +
    '</div>';
}

function checkout() {
  if (cart.length === 0) return;
  alert('Спасибо за заказ! Это демонстрационный сайт для курсового проекта.\n\nВ реальном магазине здесь был бы переход к оплате.');
  cart = [];
  saveCart();
  renderCart();
}

// ===== Search =====
function handleSearch(query) {
  query = query.trim().toLowerCase();
  if (!query) {
    if (document.getElementById('catalog-products')) renderCatalog();
    return;
  }
  if (!window.products) return;
  const results = products.filter(function(p) {
    return p.name.toLowerCase().indexOf(query) !== -1 || p.category.toLowerCase().indexOf(query) !== -1;
  });
  const grid = document.getElementById('catalog-products') || document.getElementById('popular-products');
  if (grid) {
    grid.innerHTML = results.length
      ? results.map(createProductCard).join('')
      : '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:40px 0;">Ничего не найдено</p>';
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();

  if (document.getElementById('popular-products')) {
    renderHomeProducts();
  }

  if (document.getElementById('catalog-products')) {
    renderCatalog();
  }

  if (document.getElementById('cart-content')) {
    renderCart();
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      handleSearch(e.target.value);
    });
  }
});
