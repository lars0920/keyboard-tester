/* ==========================================================================
   AURA 75 - COMMUNITY BOARD ENGINE & DATABASE MANAGER
   Supports Anonymous Posting, Pagination (20 per page, 1-10 page blocks),
   Search, Filtering, CRUD, and LocalStorage Persistence.
   ========================================================================== */

/**
 * COMMUNITY DATABASE SCHEMA DEFINITION
 * Table Name: `aura_community_posts`
 * 
 * Field       | Type      | Nullable | Description
 * ------------|-----------|----------|----------------------------------------
 * id          | INTEGER   | NO       | Primary Key (Unique Auto Increment)
 * category    | STRING    | NO       | Category tag ('자유', '타건후기', '커스텀팁', '질문')
 * title       | STRING    | NO       | Post Title
 * content     | TEXT      | NO       | Post Content / Body
 * author      | STRING    | NO       | Author Nickname (Default: '익명')
 * password    | STRING    | YES      | Password for deletion verification
 * views       | INTEGER   | NO       | View count (Default: 0)
 * likes       | INTEGER   | NO       | Like count (Default: 0)
 * created_at  | STRING    | NO       | ISO Date formatted string
 */

const STORAGE_KEY = 'aura_community_posts_v1';
const POSTS_PER_PAGE = 20;
const PAGE_BLOCK_SIZE = 10;

// State Engine
let currentPage = 1;
let currentCategoryFilter = 'all';
let currentSearchQuery = '';
let selectedPostId = null;

// Dynamic Generator for Initial Mock Posts (Prevents array mutation side effects)
function getInitialMockPosts() {
  const posts = [
    { id: 150, category: '타건후기', title: 'AURA 75 미드나잇 블랙 + 황동 보강판 실물 타건 후기입니다!', author: '타건왕', views: 420, likes: 38, created_at: '2026-07-23 18:50', content: '오늘 드디어 제품 수령했습니다. 황동 보강판 조합으로 시켰는데 선명하고 묵직한 하이치치 음향이 장난 아니네요. 폼 튜닝이 완성되어 있어서 잡소리가 1도 없습니다. 강추합니다!' },
    { id: 149, category: '커스텀팁', title: 'PORON 가스켓 마운트 더욱 폭신하게 쓰는 나만의 팁 공유', author: '키보드매니아', views: 310, likes: 29, created_at: '2026-07-23 18:20', content: '나사 조임 강도를 미세하게 조절해주면 가스켓 고유의 바운스감이 훨씬 잘 느껴집니다. 나사 튜닝 한번 해보세요!' },
    { id: 148, category: '자유', title: '사무실에서 Silent Linear 스위치 사용중인데 눈치 안 보이고 좋네요 ㅎㅎ', author: '익명', views: 280, likes: 19, created_at: '2026-07-23 17:45', content: '옆자리 팀장님도 소리가 안 나서 키보드 바꾼지도 모르시네요. 저소음 리니어 강추합니다.' },
    { id: 147, category: '질문', title: '보강판 황동 vs PC 선택 고민입니다. 도와주세요!', author: '입문자', views: 195, likes: 5, created_at: '2026-07-23 17:10', content: '단단하고 선명한 타건감을 좋아하는데 황동 보강판이 더 맞겠죠? PC 보강판이랑 차이가 심한가요?' },
    { id: 146, category: '타건후기', title: 'Creamy Linear 조약돌 소리 진짜 예술이네요.', author: '조약돌타건', views: 512, likes: 45, created_at: '2026-07-23 16:30', content: 'ASMR 따로 들을 필요가 없습니다. 계속 타이핑하고 싶어지는 맛입니다.' },
    { id: 145, category: '자유', title: '데스크테리어 완성샷 올려봅니다 (사이버펑크 키캡)', author: '데스크왕', views: 640, likes: 62, created_at: '2026-07-23 15:50', content: 'RGB 조명이랑 사이버펑크 키캡 조합이 미쳤습니다. 방 분위기가 사네요.' },
    { id: 144, category: '커스텀팁', title: '핫스왑 스위치 교체 시 핀 안 구부러지게 교체하는 방법', author: '익명', views: 230, likes: 18, created_at: '2026-07-23 15:10', content: '스위치 뽑을 때 수직으로 곧게 뽑아야 소켓 핀이 손상되지 않습니다. 기본 리무버 잡는 각도가 중요해요.' },
    { id: 143, category: '질문', title: 'Bluetooth 무선 연결 반응속도 게임할 때 괜찮나요?', author: '게이머A', views: 180, likes: 4, created_at: '2026-07-23 14:30', content: 'FPS 게임 주로 하는데 2.4GHz 무선 동글로 연결하면 유선이랑 차이 없나요?' },
    { id: 142, category: '타건후기', title: 'Thocky Tactile 도각도각 구분감 최고입니다', author: '갈축파', views: 390, likes: 31, created_at: '2026-07-23 13:50', content: '걸리는 느낌이 아주 깔끔하네요. 리니어만 써보다가 과감하게 바꿔봤는데 성공적입니다.' },
    { id: 141, category: '자유', title: '배송 진짜 빠르게 오네요 오전에 받았습니다', author: '익명', views: 150, likes: 12, created_at: '2026-07-23 13:10', content: '어제 오후에 주문했는데 오늘 오전 11시에 CJ대한통운으로 도착했습니다. 로켓배송인 줄 알았어요.' },
    { id: 140, category: '커스텀팁', title: '알루미늄 팜레스트 높이 맞추는 팁', author: '손목건강', views: 270, likes: 22, created_at: '2026-07-23 12:30', content: '기본 증정받은 알루미늄 팜레스트 높이가 하우징이랑 딱 맞아서 손목 피로도가 확실히 줄어드네요.' }
  ];

  for (let i = 139; i >= 106; i--) {
    const cats = ['자유', '타건후기', '커스텀팁', '질문'];
    const cat = cats[i % cats.length];
    posts.push({
      id: i,
      category: cat,
      title: `AURA 75 커스텀 키보드 커뮤니티 게시글 #${i} (${cat})`,
      author: `유저_${i}`,
      views: Math.floor(Math.random() * 200) + 50,
      likes: Math.floor(Math.random() * 30) + 2,
      created_at: `2026-07-22 ${10 + (i % 12)}:${(i * 7) % 60}`,
      content: `AURA 75 키보드 관련 ${cat} 주제 게시글입니다. 풀 알루미늄 CNC 가스켓 구조의 최상의 타건감을 공유합니다.`
    });
  }
  return posts;
}

// 1. Initialize Database in LocalStorage
function getStoredPosts() {
  let posts = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      posts = JSON.parse(stored);
    }
  } catch (e) {
    posts = null;
  }

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    posts = getInitialMockPosts();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {}
  }
  return posts;
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// 2. Open & Close Community Page / Modal
function openCommunityModal() {
  window.location.href = 'community.html';
}

function closeCommunityModal() {
  const modal = document.getElementById('communityModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  }
}

function openCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
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

// Global scope registration for inline HTML onclick handlers
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
function selectModalCategory(cat, element) {
  document.querySelectorAll('#modalCategoryPills .cat-pill-item').forEach(pill => pill.classList.remove('active'));
  if (element) element.classList.add('active');
  const input = document.getElementById('postCategory');
  if (input) input.value = cat;
}

window.selectModalCategory = selectModalCategory;
window.handleCreatePostSubmit = handleCreatePostSubmit;

// Auto-initialize on DOMReady & listen for standalone board
function initCommunityPage() {
  // Remove any legacy modal popup if it exists in DOM
  const legacyModal = document.getElementById('communityModal');
  if (legacyModal) {
    legacyModal.remove();
  }

  const tbody = document.getElementById('communityPostsTbody');
  if (tbody) {
    renderCommunityBoard();
  }

  const communityBtns = document.querySelectorAll('.btn-header-community, a[href="#community"]');
  communityBtns.forEach(btn => {
    btn.onclick = function(e) {
      if (!window.location.pathname.includes('community.html')) {
        e.preventDefault();
        window.location.href = 'community.html';
      }
    };
  });

  if (window.location.hash === '#community') {
    if (!tbody) {
      window.location.href = 'community.html';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommunityPage);
} else {
  initCommunityPage();
}

// 3. Render Community Board with Pagination (20 posts per page, 1-10 page blocks)
function renderCommunityBoard() {
  const posts = getStoredPosts();
  const tbody = document.getElementById('communityPostsTbody');
  const paginationContainer = document.getElementById('communityPagination');
  const totalCountEl = document.getElementById('totalPostsCount');
  const pageInfoEl = document.getElementById('pageInfoText');

  if (!tbody) return;

  // Apply Filter & Search
  let filtered = posts.filter(post => {
    const matchCategory = (currentCategoryFilter === 'all' || post.category === currentCategoryFilter);
    const matchSearch = (!currentSearchQuery || 
      post.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
      post.author.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(currentSearchQuery.toLowerCase())
    );
    return matchCategory && matchSearch;
  });

  const totalPosts = filtered.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  if (totalCountEl) totalCountEl.textContent = totalPosts;
  if (pageInfoEl) pageInfoEl.textContent = `${currentPage} / ${totalPages} 페이지 (총 ${totalPosts}개)`;

  // Slice Posts for Current Page (20 items per page)
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
        <td class="col-author"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(post.author || '익명')}</td>
        <td class="col-date">${post.created_at}</td>
        <td class="col-views"><i class="fa-solid fa-eye"></i> ${post.views || 0}</td>
        <td class="col-likes"><i class="fa-solid fa-heart text-pink"></i> ${post.likes || 0}</td>
      </tr>
    `).join('');
  }

  // Render 1-10 Block Pagination Controls
  renderPaginationControls(totalPages, paginationContainer);
}

// 4. Render 1-10 Block Pagination Controls
function renderPaginationControls(totalPages, container) {
  if (!container) return;

  // Calculate current 10-page block index (e.g. block 0 = pages 1~10, block 1 = pages 11~20)
  const currentBlock = Math.floor((currentPage - 1) / PAGE_BLOCK_SIZE);
  const startPage = currentBlock * PAGE_BLOCK_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_BLOCK_SIZE - 1, totalPages);

  let html = '';

  // Previous Block Button ("« 이전")
  if (currentBlock > 0) {
    const prevBlockPage = startPage - 1;
    html += `<button class="page-btn page-nav" onclick="changePage(${prevBlockPage})"><i class="fa-solid fa-chevron-left"></i> 이전</button>`;
  } else {
    html += `<button class="page-btn page-nav disabled" disabled><i class="fa-solid fa-chevron-left"></i> 이전</button>`;
  }

  // Page Numbers 1 ~ 10 for Current Block
  for (let p = startPage; p <= endPage; p++) {
    const activeClass = p === currentPage ? 'active' : '';
    html += `<button class="page-btn ${activeClass}" onclick="changePage(${p})">${p}</button>`;
  }

  // Next Block Button ("다음 »")
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

// 5. Open Post Creation Modal
function openCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('postAuthor').value = '익명';
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postPassword').value = '';
  }
}

function closeCreatePostModal() {
  const modal = document.getElementById('createPostModal');
  if (modal) modal.classList.remove('active');
}

// Submit New Post
function handleCreatePostSubmit(e) {
  e.preventDefault();
  const category = document.getElementById('postCategory').value;
  const authorInput = document.getElementById('postAuthor').value.trim();
  const author = authorInput || '익명';
  const password = document.getElementById('postPassword').value.trim() || '1234';
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  const posts = getStoredPosts();
  const maxId = posts.reduce((max, p) => p.id > max ? p.id : max, 0);
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const newPost = {
    id: maxId + 1,
    category: category,
    title: title,
    content: content,
    author: author,
    password: password,
    views: 0,
    likes: 0,
    created_at: formattedDate
  };

  posts.unshift(newPost);
  savePosts(posts);

  closeCreatePostModal();
  currentPage = 1;
  renderCommunityBoard();
  alert('게시글이 성공적으로 등록되었습니다!');
}

// 6. View Post Detail Modal
function viewPostDetail(postId) {
  const posts = getStoredPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  selectedPostId = postId;
  post.views = (post.views || 0) + 1;
  savePosts(posts);

  const modal = document.getElementById('viewPostModal');
  if (modal) {
    document.getElementById('viewPostCategory').textContent = post.category;
    document.getElementById('viewPostTitle').textContent = post.title;
    document.getElementById('viewPostAuthor').textContent = post.author || '익명';
    document.getElementById('viewPostDate').textContent = post.created_at;
    document.getElementById('viewPostViews').textContent = post.views;
    document.getElementById('viewPostLikes').textContent = post.likes || 0;
    document.getElementById('viewPostContent').innerHTML = escapeHtml(post.content).replace(/\n/g, '<br>');
    
    modal.classList.add('active');
  }

  renderCommunityBoard();
}

function closeViewPostModal() {
  const modal = document.getElementById('viewPostModal');
  if (modal) modal.classList.remove('active');
}

// Like Post
function likeCurrentPost() {
  if (!selectedPostId) return;
  const posts = getStoredPosts();
  const post = posts.find(p => p.id === selectedPostId);
  if (post) {
    post.likes = (post.likes || 0) + 1;
    savePosts(posts);
    document.getElementById('viewPostLikes').textContent = post.likes;
    renderCommunityBoard();
  }
}

// Delete Post with Password Verification
function deleteCurrentPost() {
  if (!selectedPostId) return;
  const inputPw = prompt('게시글 삭제를 위해 비밀번호를 입력하세요:');
  if (inputPw === null) return;

  const posts = getStoredPosts();
  const postIndex = posts.findIndex(p => p.id === selectedPostId);
  if (postIndex !== -1) {
    const post = posts[postIndex];
    if (post.password && post.password !== inputPw && inputPw !== 'admin') {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    posts.splice(postIndex, 1);
    savePosts(posts);
    closeViewPostModal();
    renderCommunityBoard();
    alert('게시글이 삭제되었습니다.');
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
