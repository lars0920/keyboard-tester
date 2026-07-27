/* ==========================================================================
   AURA 75 - E-COMMERCE STORE ENGINE & PRODUCT DATABASE MANAGER
   Supports Supabase `public.products` Table Fetching, Filter & Search,
   Auth-Guarded Checkout Flow (Toast for Guest, Modal for Logged-In User).
   ========================================================================== */

const STORE_STORAGE_KEY = 'aura_store_products_v1';
let currentStoreCategory = 'all';
let currentStoreSearch = '';
let cachedStoreProducts = [];
let selectedCheckoutProduct = null;

// Initial Default Seed Products
function getInitialSeedProducts() {
  return [
    {
      id: 1,
      name: 'AURA 75 미드나잇 블랙 (풀 알루미늄 CNC)',
      category: '키보드',
      price: 285000,
      original_price: 349000,
      description: '풀 알루미늄 CNC 하우징, 3중 가스켓 가공, 핫스왑 지원. 정갈하고 묵직한 하이엔드 타건감.',
      thumbnail_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      stock: 35,
      rating: 5.0,
      badge: 'BEST HIT'
    },
    {
      id: 2,
      name: 'AURA 75 스노우 화이트 (3중 흡음 가스켓)',
      category: '키보드',
      price: 295000,
      original_price: 359000,
      description: '순백의 아노다이징 코팅 하우징. 미세 흡음재 튜닝으로 잡소리가 전혀 없는 깨끗한 타건음.',
      thumbnail_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
      stock: 22,
      rating: 4.9,
      badge: 'HOT'
    },
    {
      id: 3,
      name: 'AURA 75 사이버 핑크 (리미티드 에디션)',
      category: '키보드',
      price: 315000,
      original_price: 379000,
      description: '사이버펑크 테마 한정판 라인업. 프리미엄 PBT 이중사출 키캡 및 RGB 백라이트 완성.',
      thumbnail_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
      stock: 8,
      rating: 5.0,
      badge: 'LIMITED'
    },
    {
      id: 4,
      name: 'Deep & Thocky 커스텀 리니어 스위치 (100개입)',
      category: '스위치',
      price: 45000,
      original_price: 55000,
      description: '공장 윤활 완료. 낮고 정갈한 도각거리는 딥 사운드를 선사하는 커스텀 리니어 스위치.',
      thumbnail_url: 'https://images.unsplash.com/photo-1541140532154-b024d715b909?auto=format&fit=crop&w=800&q=80',
      stock: 150,
      rating: 4.9,
      badge: 'POPULAR'
    },
    {
      id: 5,
      name: '황동 CNC 하이엔드 보강판 (AURA 75 전용)',
      category: '보강판/흡음재',
      price: 38000,
      original_price: 48000,
      description: '단단하고 선명한 피치 타건음을 완성하는 precision CNC 황동 보강판.',
      thumbnail_url: 'https://images.unsplash.com/photo-1563191911-e65f8655fe42?auto=format&fit=crop&w=800&q=80',
      stock: 40,
      rating: 4.8,
      badge: 'CUSTOM'
    },
    {
      id: 6,
      name: 'PORON 5중 흡음재 풀패키지 튜닝키트',
      category: '보강판/흡음재',
      price: 29000,
      original_price: 35000,
      description: '기판 하부 폼, 웰터 폼, 스위치 패드 등 하우징 내부 울림을 완벽 제어하는 풀패키지.',
      thumbnail_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
      stock: 65,
      rating: 5.0,
      badge: 'RECOMMEND'
    }
  ];
}

// 1. Fetch Products from Supabase `public.products` or Local Fallback
async function fetchStoreProducts() {
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          cachedStoreProducts = data;
          saveStoreLocal(cachedStoreProducts);
          return cachedStoreProducts;
        } else {
          // Table empty -> Seed initial products
          const seeds = getInitialSeedProducts().map(p => ({
            name: p.name,
            category: p.category,
            price: p.price,
            original_price: p.original_price,
            description: p.description,
            thumbnail_url: p.thumbnail_url,
            stock: p.stock,
            rating: p.rating,
            badge: p.badge
          }));
          await window.supabaseClient.from('products').insert(seeds);
          
          const { data: seeded } = await window.supabaseClient.from('products').select('*').order('id', { ascending: true });
          if (seeded && seeded.length > 0) {
            cachedStoreProducts = seeded;
            saveStoreLocal(cachedStoreProducts);
            return cachedStoreProducts;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch products error:', err);
    }
  }

  // Local Storage Fallback
  cachedStoreProducts = getStoreLocalProducts();
  return cachedStoreProducts;
}

function getStoreLocalProducts() {
  try {
    const stored = localStorage.getItem(STORE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const initial = getInitialSeedProducts();
  saveStoreLocal(initial);
  return initial;
}

function saveStoreLocal(products) {
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {}
}

// 2. Render Product Cards Grid with Skeleton Support
async function renderStoreProducts() {
  const container = document.getElementById('storeProductGrid');
  if (!container) return;

  // Show Skeleton UI placeholder if loading
  if (!cachedStoreProducts || cachedStoreProducts.length === 0) {
    container.innerHTML = Array(6).fill(0).map(() => `
      <div class="product-card-skeleton" style="background: rgba(17, 21, 32, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; padding: 16px;">
        <div class="skeleton-shimmer" style="height: 220px; width: 100%; border-radius: 14px; margin-bottom: 16px;"></div>
        <div class="skeleton-shimmer" style="height: 20px; width: 40%; border-radius: 4px; margin-bottom: 10px;"></div>
        <div class="skeleton-shimmer" style="height: 24px; width: 85%; border-radius: 6px; margin-bottom: 12px;"></div>
        <div class="skeleton-shimmer" style="height: 16px; width: 100%; border-radius: 4px; margin-bottom: 18px;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="skeleton-shimmer" style="height: 28px; width: 110px; border-radius: 6px;"></div>
          <div class="skeleton-shimmer" style="height: 38px; width: 100px; border-radius: 12px;"></div>
        </div>
      </div>
    `).join('');
  }

  const products = await fetchStoreProducts();

  // Apply Filter & Search
  const filtered = products.filter(p => {
    const matchCat = (currentStoreCategory === 'all' || p.category === currentStoreCategory);
    const matchSearch = (!currentStoreSearch || 
      p.name.toLowerCase().includes(currentStoreSearch.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(currentStoreSearch.toLowerCase()))
    );
    return matchCat && matchSearch;
  });

  const totalCountEl = document.getElementById('storeTotalCount');
  if (totalCountEl) totalCountEl.textContent = `${filtered.length}개 상품`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8;">
        <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 16px; color: #64748b;"></i>
        <h3 style="color: #ffffff; margin-bottom: 8px;">해당 조건의 상품이 없습니다.</h3>
        <p style="font-size: 0.9rem;">다른 카테고리나 검색어로 조회해 보세요.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-thumb-wrap">
        <img src="${p.thumbnail_url}" alt="${escapeHtml(p.name)}" class="product-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <div class="product-thumb-overlay">
          <button class="btn-quick-buy" onclick="handleBuyProduct(${p.id})">
            <i class="fa-solid fa-bolt"></i> 바로 구매
          </button>
        </div>
      </div>

      <div class="product-body">
        <div class="product-meta">
          <span class="product-category-tag">${p.category}</span>
          <span class="product-rating"><i class="fa-solid fa-star text-gold"></i> ${p.rating || 5.0}</span>
        </div>

        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description || '')}</p>

        <div class="product-footer">
          <div class="product-price-box">
            ${p.original_price ? `<span class="product-original-price">₩${p.original_price.toLocaleString('ko-KR')}</span>` : ''}
            <span class="product-price">₩${p.price.toLocaleString('ko-KR')}</span>
          </div>

          <button class="btn-cart-buy" onclick="handleBuyProduct(${p.id})">
            <i class="fa-solid fa-bag-shopping"></i> 구매하기
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 3. Category Filter & Search Handlers
function filterStoreCategory(cat, element) {
  currentStoreCategory = cat;
  document.querySelectorAll('.store-cat-tab').forEach(tab => tab.classList.remove('active'));
  if (element) element.classList.add('active');
  renderStoreProducts();
}

function handleStoreSearch(query) {
  currentStoreSearch = query;
  renderStoreProducts();
}

// 4. Auth-Guarded Product Purchase & Checkout Handler
function handleBuyProduct(productId) {
  // Check if user is logged in
  let currentUser = null;
  if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
  }

  // Guest -> Show Non-blocking Toast notification & Open Auth Modal
  if (!currentUser) {
    if (window.showToast) {
      window.showToast('🔒 로그인이 필요한 서비스입니다. 로그인 후 구매를 진행해 주세요.', 'error');
    }
    if (typeof openAuthModal === 'function') {
      openAuthModal('login');
    }
    return;
  }

  // Logged-in user -> Open Frontend Checkout Payment Modal
  const products = cachedStoreProducts.length > 0 ? cachedStoreProducts : getStoreLocalProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  selectedCheckoutProduct = product;
  openCheckoutModal(product, currentUser);
}

// 5. Frontend Checkout Modal Setup
function openCheckoutModal(product, user) {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  // Pre-fill user info & order details
  const nameEl = document.getElementById('checkoutName');
  const emailEl = document.getElementById('checkoutEmail');
  const itemTitleEl = document.getElementById('checkoutItemTitle');
  const itemPriceEl = document.getElementById('checkoutItemPrice');
  const itemTotalEl = document.getElementById('checkoutItemTotal');

  if (nameEl) nameEl.value = user.name || '유저';
  if (emailEl) emailEl.value = user.email || 'user@company.com';
  if (itemTitleEl) itemTitleEl.textContent = product.name;
  if (itemPriceEl) itemPriceEl.textContent = `₩${product.price.toLocaleString('ko-KR')}`;
  if (itemTotalEl) itemTotalEl.textContent = `₩${product.price.toLocaleString('ko-KR')}`;

  modal.classList.add('active');
  modal.style.display = 'flex';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

// Handle Order Submit (Simulated Frontend Checkout)
function handleCheckoutSubmit(e) {
  e.preventDefault();
  const address = document.getElementById('checkoutAddress').value.trim();

  if (!address) {
    if (window.showToast) window.showToast('배송받으실 주소를 입력해 주세요.', 'error');
    return;
  }

  closeCheckoutModal();

  if (window.showToast) {
    window.showToast(`🎉 주문이 정상 접수되었습니다! ${selectedCheckoutProduct ? selectedCheckoutProduct.name : '상품'} 배송 준비가 시작됩니다.`, 'success');
  }
}

// Utility HTML Escape
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global scope registration
window.filterStoreCategory = filterStoreCategory;
window.handleStoreSearch = handleStoreSearch;
window.handleBuyProduct = handleBuyProduct;
window.closeCheckoutModal = closeCheckoutModal;
window.handleCheckoutSubmit = handleCheckoutSubmit;

document.addEventListener('DOMContentLoaded', () => {
  renderStoreProducts();
});
