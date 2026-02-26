/* ═══════════════════════════════════════
   PETAL RUSH — Shared Utilities
   ═══════════════════════════════════════ */

// ── TOAST ──
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ── BUTTON LOADING STATE ──
function setBtn(id, loading, loadText = '⏳ Please wait...') {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (loading) {
    btn._orig = btn.innerHTML;
    btn.innerHTML = loadText;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._orig || btn.innerHTML;
    btn.disabled = false;
  }
}

// ── STATUS BADGES ──
const STATUS_MAP = {
  placed:        ['badge-gold',  '🕐'],
  assigned:      ['badge-gold',  '👤'],
  picked:        ['badge-gold',  '📦'],
  delivered:     ['badge-green', '✅'],
  returned:      ['badge-rose',  '↩️'],
  cancelled:     ['badge-rose',  '✕'],
  pending:       ['badge-dim',   '⏳'],
  released:      ['badge-green', '💚'],
  admin_wallet:  ['badge-gold',  '🏦'],
  held:          ['badge-rose',  '⏸️'],
  cod_collected: ['badge-green', '💵'],
  active:        ['badge-green', '●'],
  inactive:      ['badge-dim',   '○'],
  verified:      ['badge-green', '✓'],
  banned:        ['badge-rose',  '🚫'],
  unverified:    ['badge-dim',   '—'],
};
function statusBadge(status) {
  const [cls, icon] = STATUS_MAP[status] || ['badge-dim', '—'];
  return `<span class="badge ${cls}">${icon} ${status || '—'}</span>`;
}

function paymentBadge(type) {
  if (type === 'cod')    return `<span class="badge badge-gold">💵 COD</span>`;
  if (type === 'online') return `<span class="badge badge-green">💳 Online</span>`;
  return `<span class="badge badge-dim">${type || '—'}</span>`;
}

function roleBadge(role) {
  const icons = { buyer: '🛍️', seller: '🏪', delivery: '🚚', admin: '🛠️' };
  const cls   = { buyer: 'badge-dim', seller: 'badge-gold', delivery: 'badge-green', admin: 'badge-rose' };
  return `<span class="badge ${cls[role]||'badge-dim'}">${icons[role]||''} ${role}</span>`;
}

// ── DATE FORMAT ──
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// ── PRODUCT EMOJI ──
const PROD_EMOJI = { flowers:'🌸', bouquets:'💐', plants:'🪴', gifts:'🎁' };
function prodEmoji(cat) { return PROD_EMOJI[cat] || '🌼'; }

// ── SIDEBAR TOGGLE ──
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('visible');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb?.classList.contains('open') ? closeSidebar() : openSidebar();
}

// ── ACTIVE NAV ──
function setActiveNav(panelId) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.panel === panelId);
  });
}

// ── PANEL SWITCHER ──
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${id}`);
  if (target) target.classList.add('active');
  setActiveNav(id);
  closeSidebar();
  window._currentPanel = id;
}

// ── GPS / LOCATION ──
function detectGPS(targetInputId, btnId) {
  if (!navigator.geolocation) { toast('Geolocation not supported', 'error'); return; }
  setBtn(btnId, true, '📍 Detecting...');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await res.json();
        const el = document.getElementById(targetInputId);
        if (el) el.value = d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        toast('Location detected ✅', 'success');
      } catch {
        const el = document.getElementById(targetInputId);
        if (el) el.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
      setBtn(btnId, false);
    },
    () => { toast('Location access denied', 'error'); setBtn(btnId, false); }
  );
}

function mapsNavLink(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// ── SHORT ID ──
function shortId(id) {
  if (!id) return '—';
  return '#' + String(id).replace(/-/g,'').slice(-8).toUpperCase();
}

// ── NUMBER FORMAT ──
function fmtCurrency(n) {
  return '₹' + Number(n||0).toLocaleString('en-IN');
}

// ── CONFIRM DIALOG ──
function confirmAction(msg) { return window.confirm(msg); }

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    closeSidebar();
  }
});
