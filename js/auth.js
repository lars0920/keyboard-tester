/* ==========================================================================
   AURA 75 - AUTHENTICATION & USER SESSION ENGINE
   Handles Split-Layout Auth Modal (Login/Signup), LocalStorage Persistence,
   Social Auth Simulation, and Admin Role Management.
   ========================================================================== */

const USERS_STORAGE_KEY = 'aura_users_v1';
const SESSION_STORAGE_KEY = 'aura_current_user_v1';

// Initial Default Users (Includes Admin User)
function getInitialUsers() {
  return [
    {
      email: 'admin@aura75.com',
      password: 'admin1234',
      name: '최고관리자',
      role: 'admin',
      created_at: '2026-07-01'
    },
    {
      email: 'user@aura75.com',
      password: 'user1234',
      name: '김키보드',
      role: 'user',
      created_at: '2026-07-15'
    }
  ];
}

// 1. Storage Helpers
function getUsers() {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  const initial = getInitialUsers();
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// 2. Modal Open/Close & Tab Switching
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('active');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginFormView');
  const signupForm = document.getElementById('signupFormView');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabSignupBtn = document.getElementById('tabSignupBtn');

  if (tab === 'signup') {
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (tabSignupBtn) tabSignupBtn.classList.add('active');
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
    if (tabSignupBtn) tabSignupBtn.classList.remove('active');
  }
}

// 3. Login Submission
function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    if (window.showToast) window.showToast('이메일과 비밀번호를 입력해 주세요.', 'error');
    return;
  }

  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);

  if (!found) {
    if (window.showToast) window.showToast('이메일 또는 비밀번호가 일치하지 않습니다.', 'error');
    return;
  }

  setCurrentUser(found);
  closeAuthModal();
  updateHeaderAuthUI();

  if (window.showToast) {
    window.showToast(`${found.name}님, 반갑습니다! 로그인되었습니다.`, 'success');
  }

  if (found.role === 'admin' && window.location.pathname.includes('admin')) {
    window.location.reload();
  }
}

// 4. Signup Submission
function handleSignupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value.trim();
  const agree = document.getElementById('signupAgree').checked;

  if (!name || !email || !password) {
    if (window.showToast) window.showToast('모든 필수 입력 정보를 입력해 주세요.', 'error');
    return;
  }

  if (password !== passwordConfirm) {
    if (window.showToast) window.showToast('비밀번호가 서로 일치하지 않습니다.', 'error');
    return;
  }

  if (!agree) {
    if (window.showToast) window.showToast('이용약관 및 개인정보 동의가 필요합니다.', 'error');
    return;
  }

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    if (window.showToast) window.showToast('이미 등록된 이메일 주소입니다.', 'error');
    return;
  }

  const newUser = {
    name,
    email,
    password,
    role: 'user',
    created_at: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  saveUsers(users);

  // Auto Login
  setCurrentUser(newUser);
  closeAuthModal();
  updateHeaderAuthUI();

  if (window.showToast) {
    window.showToast(`회원가입이 완료되었습니다! 환영합니다, ${newUser.name}님.`, 'success');
  }
}

// 5. Social Login Simulation
function handleSocialLogin(provider) {
  const mockUser = {
    name: provider === 'google' ? '구글 사용자' : '카카오 사용자',
    email: provider === 'google' ? 'user@gmail.com' : 'user@kakao.com',
    password: 'social_login',
    role: 'user',
    created_at: new Date().toISOString().split('T')[0]
  };

  setCurrentUser(mockUser);
  closeAuthModal();
  updateHeaderAuthUI();

  if (window.showToast) {
    window.showToast(`${provider === 'google' ? 'Google' : 'Kakao'} 계정으로 시뮬레이션 로그인되었습니다!`, 'success');
  }
}

// 6. Logout
function handleLogout() {
  setCurrentUser(null);
  updateHeaderAuthUI();
  if (window.showToast) {
    window.showToast('로그아웃되었습니다.', 'info');
  }
  if (window.location.pathname.includes('admin')) {
    window.location.href = 'index.html';
  }
}

// 7. Update Header Auth UI State
function updateHeaderAuthUI() {
  const user = getCurrentUser();
  const authContainer = document.getElementById('headerAuthContainer');

  if (!authContainer) return;

  if (user) {
    let adminLink = '';
    if (user.role === 'admin') {
      adminLink = `<a href="admin.html" class="btn-header-admin"><i class="fa-solid fa-user-shield"></i> 관리자</a>`;
    }

    authContainer.innerHTML = `
      <div class="user-profile-badge">
        <div class="user-avatar">${user.name.charAt(0)}</div>
        <span class="user-name">${user.name} 님</span>
        ${adminLink}
        <button onclick="handleLogout()" class="btn-auth-logout" title="로그아웃"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <button onclick="openAuthModal('login')" class="btn-header-auth">
        <i class="fa-solid fa-user-check"></i> 로그인 / 회원가입
      </button>
    `;
  }
}

// Global Exports for Inline HTML Listeners
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignupSubmit = handleSignupSubmit;
window.handleSocialLogin = handleSocialLogin;
window.handleLogout = handleLogout;

document.addEventListener('DOMContentLoaded', () => {
  getUsers();
  updateHeaderAuthUI();
});
