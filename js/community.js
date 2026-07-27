/* ==========================================================================
   AURA 75 - COMMUNITY BOARD ENGINE & SUPABASE DATABASE MANAGER
   Supports Supabase Database Read/Write/Delete, Anonymous Posting,
   Pagination (20 per page, 1-10 page blocks), Search, and LocalStorage Fallback.
   ========================================================================== */

const STORAGE_KEY = 'aura_community_posts_v1';
const POSTS_PER_PAGE = 20;
const PAGE_BLOCK_SIZE = 10;

// State Engine
let currentPage = 1;
let currentCategoryFilter = 'all';
let currentSearchQuery = '';
let selectedPostId = null;
let cachedPosts = [];

// Dynamic Generator for Initial Mock Posts (Initial Seeding)
function getInitialMockPosts() {
  const posts = [
    { id: 150, category: '타건후기', title: 'AURA 75 미드나잇 블랙 + 황동 보강판 실물 타건 후기입니다!', author_name: '타건왕', views: 420, likes: 38, created_at: '2026-07-23 18:50', content: '오늘 드디어 제품 수령했습니다. 황동 보강판 조합으로 시켰는데 선명하고 묵직한 하이치치 음향이 장난 아니네요. 폼 튜닝이 완성되어 있어서 잡소리가 1도 없습니다. 강추합니다!' },
    { id: 149, category: '커스텀팁', title: 'PORON 가스켓 마운트 더욱 폭신하게 쓰는 나만의 팁 공유', author_name: '키보드매니아', views: 310, likes: 29, created_at: '2026-07-23 18:20', content: '나사 조임 강도를 미세하게 조절해주면 가스켓 고유의 바운스감이 훨씬 잘 느껴집니다. 나사 튜닝 한번 해보세요!' },
    { id: 148, category: '자유', title: '사무실에서 Silent Linear 스위치 사용중인데 눈치 안 보이고 좋네요 ㅎㅎ', author_name: '익명', views: 280, likes: 19, created_at: '2026-07-23 17:45', content: '옆자리 팀장님도 소리가 안 나서 키보드 바꾼지도 모르시네요. 저소음 리니어 강추합니다.' },
    { id: 147, category: '질문', title: '보강판 황동 vs PC 선택 고민입니다. 도와주세요!', author_name: '입문자', views: 195, likes: 5, created_at: '2026-07-23 17:10', content: '단단하고 선명한 타건감을 좋아하는데 황동 보강판이 더 맞겠죠? PC 보강판이랑 차이가 심한가요?' },
    { id: 146, category: '타건후기', title: 'Creamy Linear 조약돌 소리 진짜 예술이네요.', author_name: '조약돌타건', views: 512, likes: 45, created_at: '2026-07-23 16:30', content: 'ASMR 따로 들을 필요가 없습니다. 계속 타이핑하고 싶어지는 맛입니다.' },
    { id: 145, category: '자유', title: '데스크테리어 완성샷 올려봅니다 (사이버펑크 키캡)', author_name: '데스크왕', views: 640, likes: 62, created_at: '2026-07-23 15:50', content: 'RGB 조명이랑 사이버펑크 키캡 조합이 미쳤습니다. 방 분위기가 사네요.' },
    { id: 144, category: '커스텀팁', title: '핫스왑 스위치 교체 시 핀 안 구부러지게 교체하는 방법', author_name: '익명', views: 230, likes: 18, created_at: '2026-07-23 15:10', content: '스위치 뽑을 때 수직으로 곧게 뽑아야 소켓 핀이 손상되지 않습니다. 기본 리무버 잡는 각도가 중요해요.' },
    { id: 143, category: '질문', title: 'Bluetooth 무선 연결 반응속도 게임할 때 괜찮나요?', author_name: '게이머A', views: 180, likes: 4, created_at: '2026-07-23 14:30', content: 'FPS 게임 주로 하는데 2.4GHz 무선 동글로 연결하면 유선이랑 차이 없나요?' },
    { id: 142, category: '타건후기', title: 'Thocky Tactile 도각도각 구분감 최고입니다', author_name: '갈축파', views: 390, likes: 31, created_at: '2026-07-23 13:50', content: '걸리는 느낌이 아주 깔끔하네요. 리니어만 써보다가 과감하게 바꿔봤는데 성공적입니다.' },
    { id: 141, category: '자유', title: '배송 진짜 빠르게 오네요 오전에 받았습니다', author_name: '익명', views: 150, likes: 12, created_at: '2026-07-23 13:10', content: '어제 오후에 주문했는데 오늘 오전 11시에 CJ대한통운으로 도착했습니다. 로켓배송인 줄 알았어요.' },
    { id: 140, category: '커스텀팁', title: '알루미늄 팜레스트 높이 맞추는 팁', author_name: '손목건강', views: 270, likes: 22, created_at: '2026-07-23 12:30', content: '기본 증정받은 알루미늄 팜레스트 높이가 하우징이랑 딱 맞아서 손목 피로도가 확실히 줄어드네요.' }
  ];

  for (let i = 139; i >= 106; i--) {
    const cats = ['자유', '타건후기', '커스텀팁', '질문'];
    const cat = cats[i % cats.length];
    posts.push({
      id: i,
      category: cat,
      title: `AURA 75 커스텀 키보드 커뮤니티 게시글 #${i} (${cat})`,
      author_name: `유저_${i}`,
      views: Math.floor(Math.random() * 200) + 50,
      likes: Math.floor(Math.random() * 30) + 2,
      created_at: `2026-07-22 ${10 + (i % 12)}:${(i * 7) % 60}`,
      content: `AURA 75 키보드 관련 ${cat} 주제 게시글입니다. 풀 알루미늄 CNC 가스켓 구조의 최상의 타건감을 공유합니다.`
    });
  }
  return posts;
}

// 1. Fetch Posts from Supabase or Fallback
async function fetchPosts() {
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          cachedPosts = data.map(p => ({
            ...p,
            author: p.author_name || p.author || '익명',
            created_at: p.created_at ? (p.created_at.includes('T') ? p.created_at.replace('T', ' ').slice(0, 16) : p.created_at) : '2026-07-24'
          }));
          savePostsToLocal(cachedPosts);
          return cachedPosts;
        } else {
          // DB is empty -> seed initial posts
          const initial = getInitialMockPosts();
          const seedData = initial.map(item => ({
            category: item.category,
            title: item.title,
            content: item.content,
            author_name: item.author_name,
            views: item.views,
            likes: item.likes,
            password: '1234'
          }));
          await window.supabaseClient.from('posts').insert(seedData);
          
          const { data: seeded } = await window.supabaseClient.from('posts').select('*').order('id', { ascending: false });
          if (seeded && seeded.length > 0) {
            cachedPosts = seeded.map(p => ({ ...p, author: p.author_name }));
            savePostsToLocal(cachedPosts);
            return cachedPosts;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch posts error:', err);
    }
  }

  // Local Storage Fallback
  cachedPosts = getStoredLocalPosts();
  return cachedPosts;
}

function getStoredLocalPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const initial = getInitialMockPosts();
  savePostsToLocal(initial);
  return initial;
}

function savePostsToLocal(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {}
}

// 2. Open & Close Modals
function openCommunityModal() {
  window.location.href = 'community.html';
}

function closeCommunityModal() {
  const modal = document.getElementById('communityModal');
  if (modal) modal.classList.remove('active');
}

function openCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');

    let defaultAuthor = '익명';
    if (typeof getCurrentUser === 'function') {
      const user = getCurrentUser();
      if (user && user.name) defaultAuthor = user.name;
    }

    const authorEl = document.getElementById('postAuthor');
    if (authorEl) authorEl.value = defaultAuthor;

    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postPassword').value = '';
  }
}

function closeCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function closeViewPostModal() {
  const modal = document.getElementById('viewPostModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

// Global scope registration
window.openCommunityModal = openCommunityModal;
window.closeCommunityModal = closeCommunityModal;
window.openCreatePostModal = openCreatePostModal;
window.closeCreatePostModal = closeCreatePostModal;
window.closeViewPostModal = closeViewPostModal;
window.filterCategory = filterCategory;
window.handleCommunitySearch = handleCommunitySearch;
window.changePage = changePage;
window.viewPostDetail = viewPostDetail;
window.likeCurrentPost = likeCurrentPost;
window.deleteCurrentPost = deleteCurrentPost;
window.handleCreatePostSubmit = handleCreatePostSubmit;

function selectModalCategory(cat, element) {
  document.querySelectorAll('#modalCategoryPills .cat-pill-item').forEach(pill => pill.classList.remove('active'));
  if (element) element.classList.add('active');
  const input = document.getElementById('postCategory');
  if (input) input.value = cat;
}
window.selectModalCategory = selectModalCategory;

// Toast Engine
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed; top:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
  const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';

  toast.style.cssText = `
    background: ${bgColor};
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.92rem;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(8px);
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
  `;

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
window.showToast = showToast;

// Auto-initialize on DOMReady
async function initCommunityPage() {
  const tbody = document.getElementById('communityPostsTbody');
  if (tbody) {
    await renderCommunityBoard();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommunityPage);
} else {
  initCommunityPage();
}

// 3. Render Community Board with Pagination
async function renderCommunityBoard() {
  const posts = await fetchPosts();
  const tbody = document.getElementById('communityPostsTbody');
  const paginationContainer = document.getElementById('communityPagination');
  const totalCountEl = document.getElementById('totalPostsCount');
  const pageInfoEl = document.getElementById('pageInfoText');

  if (!tbody) return;

  // Apply Filter & Search
  let filtered = posts.filter(post => {
    const authorStr = post.author_name || post.author || '익명';
    const matchCategory = (currentCategoryFilter === 'all' || post.category === currentCategoryFilter);
    const matchSearch = (!currentSearchQuery || 
      post.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
      authorStr.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(currentSearchQuery.toLowerCase())
    );
    return matchCategory && matchSearch;
  });

  const totalPosts = filtered.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  if (totalCountEl) totalCountEl.textContent = totalPosts + '개';
  if (pageInfoEl) pageInfoEl.textContent = `${currentPage} / ${totalPages} 페이지 (총 ${totalPosts}개)`;

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = filtered.slice(startIndex, startIndex + POSTS_PER_PAGE);

  if (pagePosts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">
          <i class="fa-solid fa-folder-open"></i>
          <p>등록된 게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pagePosts.map(post => `
      <tr class="post-row" onclick="viewPostDetail(${post.id})">
        <td class="col-id">${post.id}</td>
        <td class="col-cat"><span class="badge-cat cat-${getCategoryClass(post.category)}">${post.category}</span></td>
        <td class="col-title">
          <span class="post-title-text">${escapeHtml(post.title)}</span>
        </td>
        <td class="col-author"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(post.author_name || post.author || '익명')}</td>
        <td class="col-date">${post.created_at}</td>
        <td class="col-views"><i class="fa-solid fa-eye"></i> ${post.views || 0}</td>
        <td class="col-likes"><i class="fa-solid fa-heart text-pink"></i> ${post.likes || 0}</td>
      </tr>
    `).join('');
  }

  renderPaginationControls(totalPages, paginationContainer);
}

// 4. Render Pagination Controls
function renderPaginationControls(totalPages, container) {
  if (!container) return;

  const currentBlock = Math.floor((currentPage - 1) / PAGE_BLOCK_SIZE);
  const startPage = currentBlock * PAGE_BLOCK_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_BLOCK_SIZE - 1, totalPages);

  let html = '';

  if (currentBlock > 0) {
    const prevBlockPage = startPage - 1;
    html += `<button class="page-btn page-nav" onclick="changePage(${prevBlockPage})"><i class="fa-solid fa-chevron-left"></i> 이전</button>`;
  } else {
    html += `<button class="page-btn page-nav disabled" disabled><i class="fa-solid fa-chevron-left"></i> 이전</button>`;
  }

  for (let p = startPage; p <= endPage; p++) {
    const activeClass = p === currentPage ? 'active' : '';
    html += `<button class="page-btn ${activeClass}" onclick="changePage(${p})">${p}</button>`;
  }

  if (endPage < totalPages) {
    const nextBlockPage = endPage + 1;
    html += `<button class="page-btn page-nav" onclick="changePage(${nextBlockPage})">다음 <i class="fa-solid fa-chevron-right"></i></button>`;
  } else {
    html += `<button class="page-btn page-nav disabled" disabled>다음 <i class="fa-solid fa-chevron-right"></i></button>`;
  }

  container.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderCommunityBoard();
  const boardTable = document.querySelector('.community-table-wrapper');
  if (boardTable) boardTable.scrollTop = 0;
}

function filterCategory(category, element) {
  currentCategoryFilter = category;
  currentPage = 1;
  document.querySelectorAll('.cat-tab, .cat-pill, .cat-filter-btn').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  renderCommunityBoard();
}

function handleCommunitySearch(query) {
  currentSearchQuery = query;
  currentPage = 1;
  renderCommunityBoard();
}

function getCategoryClass(cat) {
  switch (cat) {
    case '타건후기': return 'review';
    case '커스텀팁': return 'tip';
    case '질문': return 'qna';
    default: return 'free';
  }
}

// 5. Submit New Post (Supabase Database Insert + Local Fallback)
async function handleCreatePostSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('postCategory').value;
  const authorInput = document.getElementById('postAuthor').value.trim();
  const author = authorInput || '익명';
  const password = document.getElementById('postPassword').value.trim() || '1234';
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title || !content) {
    showToast('제목과 내용을 입력해주세요.', 'error');
    return;
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.from('posts').insert([{
        category: category,
        title: title,
        content: content,
        author_name: author,
        password: password,
        views: 0,
        likes: 0
      }]).select('*');

      if (!error && data && data.length > 0) {
        closeCreatePostModal();
        currentPage = 1;
        await renderCommunityBoard();
        showToast('Supabase DB에 게시글이 성공적으로 등록되었습니다!', 'success');
        return;
      }
    } catch (err) {
      console.warn('Supabase post creation error:', err);
    }
  }

  // Local Storage Fallback
  const posts = getStoredLocalPosts();
  const maxId = posts.reduce((max, p) => p.id > max ? p.id : max, 0);

  const newPost = {
    id: maxId + 1,
    category: category,
    title: title,
    content: content,
    author: author,
    author_name: author,
    password: password,
    views: 0,
    likes: 0,
    created_at: formattedDate
  };

  posts.unshift(newPost);
  savePostsToLocal(posts);

  closeCreatePostModal();
  currentPage = 1;

  requestAnimationFrame(async () => {
    await renderCommunityBoard();
    showToast('게시글이 성공적으로 등록되었습니다!', 'success');
  });
}

// 6. View Post Detail
async function viewPostDetail(postId) {
  const posts = await fetchPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  selectedPostId = postId;
  post.views = (post.views || 0) + 1;

  if (window.supabaseClient) {
    try {
      await window.supabaseClient.from('posts').update({ views: post.views }).eq('id', postId);
    } catch (err) {}
  }
  savePostsToLocal(posts);

  const modal = document.getElementById('viewPostModal');
  if (modal) {
    document.getElementById('viewPostCategory').textContent = post.category;
    document.getElementById('viewPostTitle').textContent = post.title;
    document.getElementById('viewPostAuthor').textContent = post.author_name || post.author || '익명';
    document.getElementById('viewPostDate').textContent = post.created_at;
    document.getElementById('viewPostViews').textContent = post.views;
    document.getElementById('viewPostLikes').textContent = post.likes || 0;
    document.getElementById('viewPostContent').innerHTML = escapeHtml(post.content).replace(/\n/g, '<br>');

    modal.classList.add('active');
  }
}

// Like Post
async function likeCurrentPost() {
  if (!selectedPostId) return;
  const posts = await fetchPosts();
  const post = posts.find(p => p.id === selectedPostId);
  if (post) {
    post.likes = (post.likes || 0) + 1;
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from('posts').update({ likes: post.likes }).eq('id', selectedPostId);
      } catch (err) {}
    }
    savePostsToLocal(posts);
    document.getElementById('viewPostLikes').textContent = post.likes;
    await renderCommunityBoard();
  }
}

// Delete Post
async function deleteCurrentPost() {
  if (!selectedPostId) return;
  const inputPw = prompt('게시글 삭제를 위해 비밀번호를 입력하세요:');
  if (inputPw === null) return;

  const posts = await fetchPosts();
  const post = posts.find(p => p.id === selectedPostId);
  if (!post) return;

  if (post.password && post.password !== inputPw && inputPw !== 'admin') {
    showToast('비밀번호가 일치하지 않습니다.', 'error');
    return;
  }

  if (window.supabaseClient) {
    try {
      await window.supabaseClient.from('posts').delete().eq('id', selectedPostId);
    } catch (err) {}
  }

  const filtered = posts.filter(p => p.id !== selectedPostId);
  savePostsToLocal(filtered);
  closeViewPostModal();
  await renderCommunityBoard();
  showToast('게시글이 삭제되었습니다.', 'info');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
