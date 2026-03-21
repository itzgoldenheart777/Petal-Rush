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
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
}

// ── Sidebar mobile toggle ──
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const ham = document.querySelector('.hamburger');
  if (ham) ham.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('open'); });
  if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); });
}

// ── Nav page switcher ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  const ni = document.querySelector(`.nav-item[data-page="${id}"]`);
  if (ni) ni.classList.add('active');
  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
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
  const d = document.createElement('div');
  d.className = 'loader-overlay'; d.id = 'global-loader';
  d.innerHTML = `<div style="text-align:center"><div class="spinner"></div><p style="margin-top:12px;font-size:.88rem;color:var(--gray)">${msg}</p></div>`;
  document.body.appendChild(d);
}
function hideLoader() { document.getElementById('global-loader')?.remove(); }

// ── OTP helper (simulated — replace with Firebase Phone Auth for real SMS) ──
let _otpCode = '';
function generateOTP() { _otpCode = Math.floor(100000 + Math.random() * 900000).toString(); return _otpCode; }
function verifyOTP(entered) { return entered === _otpCode; }
