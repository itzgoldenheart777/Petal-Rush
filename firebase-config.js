// ============================================================
//  PETAL RUSH v2 — Firebase Configuration
//  REPLACE ALL VALUES WITH YOUR FIREBASE PROJECT CREDENTIALS
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAKnTHcyCx_JN06nyukCHGkldWIJh_IU0Y",
  authDomain: "petal-rush.firebaseapp.com",
  projectId: "petal-rush",
  storageBucket: "petal-rush.firebasestorage.app",
  messagingSenderId: "752572979194",
  appId: "1:752572979194:web:9da69860122fa24930b643"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Payment split: 85% seller | 10% delivery | 5% admin
function calcSplit(total) {
  return {
    sellerShare:     Math.round(total * 0.85),
    deliveryShare:   Math.round(total * 0.10),
    adminCommission: Math.round(total * 0.05)
  };
}

async function getUserData(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? { ...snap.data(), uid } : null;
}

function redirectByRole(role) {
  const m = { admin:'admin.html', buyer:'buyer.html', seller:'seller.html', delivery:'delivery.html' };
  if (m[role]) window.location.href = m[role];
}

async function requireRole(role) {
  return new Promise((res, rej) => {
    auth.onAuthStateChanged(async user => {
      if (!user) { window.location.href = 'index.html'; return rej(); }
      const data = await getUserData(user.uid);
      if (!data || data.role !== role) { redirectByRole(data?.role); return rej(); }
      res(data);
    });
  });
}

function logout() { auth.signOut().then(() => window.location.href = 'index.html'); }

// ── Toast ──
function showToast(msg, type = 'success') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const icons = {success:'✅', error:'❌', info:'ℹ️', warn:'⚠️'};
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 320);
  }, 3200);
}

// ── Sidebar mobile toggle ──
function initSidebar() {
  // Nothing needed here — HTML onclick handlers call toggleSidebar()
  // This function is kept for backwards compatibility
}
// Global sidebar toggle — called from onclick in HTML
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('visible');
}
function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('visible');
}

// ── Nav page switcher ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  // Sidebar nav item
  const ni = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (ni) ni.classList.add('active');
  // Bottom nav item
  const bi = document.querySelector(`.bn-item[data-page="${id}"]`);
  if (bi) bi.classList.add('active');
  // Update topbar title
  const tt = document.getElementById('topTitle');
  if (tt && ni) tt.textContent = ni.textContent.replace(/^[^\w\s]+/, '').trim().replace(/^\w+/, s=>s);
  // Close mobile sidebar
  closeSidebar();
  // Scroll to top
  document.querySelector('.main-content')?.scrollTo(0,0);
  window.scrollTo(0,0);
  if (typeof window['onPageShow_' + id] === 'function') window['onPageShow_' + id]();
}

// ── Tab switcher ──
function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      container.querySelector('#' + btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ── QR Code generator (uses qrcode.js) ──
function renderQR(containerId, data, size = 160) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  new QRCode(el, { text: data, width: size, height: size, colorDark: '#0f172a', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
}

// ── Upload file to Firebase Storage ──
async function uploadFile(file, path) {
  const ref = storage.ref(path);
  await ref.put(file);
  return await ref.getDownloadURL();
}

// ── Capitalize ──
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ── Format currency ──
function fmtINR(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }

// ── Format date ──
function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Loader ──
function showLoader(msg = 'Loading…') {
  let d = document.getElementById('global-loader');
  if (!d) { d = document.createElement('div'); d.id='global-loader'; document.body.appendChild(d); }
  d.className = 'loader-overlay';
  d.innerHTML = `<div style="text-align:center"><div class="spinner"></div><p style="margin-top:12px;font-size:.86rem;color:var(--gray)">${msg}</p></div>`;
}
function hideLoader() { document.getElementById('global-loader')?.remove(); }

// ── OTP helper (simulated — replace with Firebase Phone Auth for real SMS) ──
let _otpCode = '';
function generateOTP() { _otpCode = Math.floor(100000 + Math.random() * 900000).toString(); return _otpCode; }
function verifyOTP(entered) { return entered === _otpCode; }


// ════════════════════════════════════
// DARK MODE — fully working
// ════════════════════════════════════
function initDarkMode() {
  const saved = localStorage.getItem('pr_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  } else if (saved === 'light') {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) {
    document.body.classList.add('dark');
  }
  updateThemeToggleIcons();
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains('dark') ||
    (!document.body.classList.contains('light') && window.matchMedia('(prefers-color-scheme:dark)').matches);
  if (isDark) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    localStorage.setItem('pr_theme', 'light');
  } else {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    localStorage.setItem('pr_theme', 'dark');
  }
  updateThemeToggleIcons();
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = document.body.classList.contains('dark') ? '#1A0F18' : '#E8196B';
}

function updateThemeToggleIcons() {
  const isDark = document.body.classList.contains('dark') ||
    (!document.body.classList.contains('light') && window.matchMedia('(prefers-color-scheme:dark)').matches);
  // Update all theme toggle icons
  document.querySelectorAll('.topbar-icon-btn[onclick*="toggleDarkMode"]').forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
  document.querySelectorAll('.theme-toggle-icon').forEach(el => {
    el.textContent = isDark ? '☀️' : '🌙';
  });
  document.querySelectorAll('.theme-toggle-text').forEach(el => {
    el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  });
}

// Run immediately (before page renders) to prevent flash
(function() {
  const saved = localStorage.getItem('pr_theme');
  if (saved === 'dark') document.documentElement.classList.add('dark-init');
  if (saved === 'light') document.documentElement.classList.add('light-init');
})();

// Run after DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}
