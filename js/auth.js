/* ==========================================================================
   AURA 75 - AUTHENTICATION & USER SESSION ENGINE (SUPABASE ENABLED)
   Handles Split-Layout Auth Modal (Login/Signup), Supabase Auth Integration,
   LocalStorage Fallback, Social OAuth, and Admin Role Management.
   ========================================================================== */

const USERS_STORAGE_KEY = 'aura_users_v1';
const SESSION_STORAGE_KEY = 'aura_current_user_v1';

// Initial Default Users (Includes Admin User Fallback)
function getInitialUsers() {
  return [
    {
      id: 'admin-id',
      email: 'admin@aura75.com',
      password: 'admin1234',
      name: '최고관리자',
      role: 'admin',
      created_at: '2026-07-01'
    },
    {
      id: 'user-id',
      email: 'user@aura75.com',
      password: 'user1234',
      name: '김키보드',
      role: 'user',
      created_at: '2026-07-15'
    }
  ];
}

// 1. Storage & Session Helpers
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

// Sync session with Supabase auth status on initialization
async function syncSupabaseSession() {
  if (!window.supabaseClient) return;

  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session && session.user) {
      const user = session.user;
      const userMeta = user.user_metadata || {};
      const nickname = userMeta.nickname || userMeta.full_name || user.email.split('@')[0];
      const role = user.email === 'admin@aura75.com' ? 'admin' : (userMeta.role || 'user');

      const appUser = {
        id: user.id,
        email: user.email,
        name: nickname,
        role: role,
        created_at: user.created_at ? user.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      };
      setCurrentUser(appUser);
      updateHeaderAuthUI();
    }
  } catch (err) {
    console.warn('Supabase session sync warning:', err);
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

// 3. Login Submission (Supabase + Local Fallback)
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    if (window.showToast) window.showToast('이메일과 비밀번호를 입력해 주세요.', 'error');
    return;
  }

  // Attempt Supabase Auth Login
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const user = data.user;
        const meta = user.user_metadata || {};
        const nickname = meta.nickname || meta.full_name || email.split('@')[0];
        const role = email === 'admin@aura75.com' ? 'admin' : (meta.role || 'user');

        const appUser = {
          id: user.id,
          email: user.email,
          name: nickname,
          role: role,
          created_at: user.created_at ? user.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        };

        setCurrentUser(appUser);
        closeAuthModal();
        updateHeaderAuthUI();

        if (window.showToast) window.showToast(`${appUser.name}님, 반갑습니다! Supabase 로그인 성공.`, 'success');
        if (role === 'admin' && window.location.pathname.includes('admin')) {
          window.location.reload();
        }
        return;
      }
    } catch (err) {
      console.warn('Supabase login attempt error:', err);
    }
  }

  // Fallback to Local Storage Users
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

// 4. Signup Submission (Supabase Auth + Local Fallback)
async function handleSignupSubmit(e) {
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

  const role = email === 'admin@aura75.com' ? 'admin' : 'user';

  // Supabase Signup Attempt
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { nickname: name, role: role }
        }
      });

      if (!error && data.user) {
        // Insert profile into public.profiles
        await window.supabaseClient.from('profiles').insert([{
          id: data.user.id,
          email: email,
          nickname: name,
          role: role
        }]);

        const appUser = {
          id: data.user.id,
          email: email,
          name: name,
          role: role,
          created_at: new Date().toISOString().split('T')[0]
        };

        setCurrentUser(appUser);
        closeAuthModal();
        updateHeaderAuthUI();

        if (window.showToast) window.showToast(`회원가입이 완료되었습니다! 환영합니다, ${name}님.`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Supabase signup attempt error:', err);
    }
  }

  // Local Storage Fallback
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    if (window.showToast) window.showToast('이미 등록된 이메일 주소입니다.', 'error');
    return;
  }

  const newUser = {
    id: 'user-' + Date.now(),
    name,
    email,
    password,
    role: role,
    created_at: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  saveUsers(users);

  setCurrentUser(newUser);
  closeAuthModal();
  updateHeaderAuthUI();

  if (window.showToast) {
    window.showToast(`회원가입이 완료되었습니다! 환영합니다, ${newUser.name}님.`, 'success');
  }
}

// 5. Social Login Simulation / OAuth Trigger
async function handleSocialLogin(provider) {
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: provider === 'google' ? 'google' : 'kakao',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (!error) return;
    } catch (err) {
      console.warn('Supabase OAuth error:', err);
    }
  }

  // Simulation Fallback
  const mockUser = {
    id: 'social-' + Date.now(),
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
async function handleLogout() {
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (err) {}
  }
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
        <div class="user-avatar">${(user.name || '유').charAt(0)}</div>
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
window.getCurrentUser = getCurrentUser;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.setCurrentUser = setCurrentUser;

document.addEventListener('DOMContentLoaded', () => {
  getUsers();
  syncSupabaseSession();
  updateHeaderAuthUI();
});
