/* ─────────────────────────────────────────────────────
   PETAL RUSH — Shared Utilities
───────────────────────────────────────────────────── */

/* ── Toast ── */
function toast(msg, type='info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 310); }, 3500);
}

/* ── Button loading ── */
function btnLoad(id, on, text='') {
  const b = document.getElementById(id); if (!b) return;
  if (on) { b._orig = b.innerHTML; b.disabled = true; if (text) b.innerHTML = text; }
  else { if (b._orig) b.innerHTML = b._orig; b.disabled = false; }
}

/* ── Status badges ── */
const ST = {
  placed:        ['badge-gold',  '🕐'],
  assigned:      ['badge-gold',  '📋'],
  picked:        ['badge-gold',  '📦'],
  delivered:     ['badge-green', '✅'],
  returned:      ['badge-rose',  '↩️'],
  cancelled:     ['badge-rose',  '✕'],
  pending:       ['badge-dim',   '⏳'],
  released:      ['badge-green', '💚'],
  admin_wallet:  ['badge-gold',  '🏦'],
  held:          ['badge-rose',  '⏸'],
  cod_collected: ['badge-green', '💵'],
  active:        ['badge-green', '●'],
  inactive:      ['badge-dim',   '○'],
  verified:      ['badge-green', '✓'],
  banned:        ['badge-rose',  '🚫'],
  unverified:    ['badge-dim',   '—'],
};
function statusBadge(s) {
  const [c, i] = ST[s] || ['badge-dim','—'];
  return `<span class="badge ${c}">${i} ${s||'—'}</span>`;
}
function payBadge(t) {
  if (t==='cod')    return `<span class="badge badge-gold">💵 COD</span>`;
  if (t==='online') return `<span class="badge badge-green">💳 Online</span>`;
  return `<span class="badge badge-dim">${t||'—'}</span>`;
}
function roleBadge(r) {
  const icons = {buyer:'🛍️',seller:'🏪',delivery:'🚚',admin:'🛠️'};
  const cls   = {buyer:'badge-dim',seller:'badge-gold',delivery:'badge-green',admin:'badge-rose'};
  return `<span class="badge ${cls[r]||'badge-dim'}">${icons[r]||''} ${r||'—'}</span>`;
}

/* ── Formatters ── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
}
function fmtCur(n) { return '₹' + Number(n||0).toLocaleString('en-IN'); }
function shortId(id) { return id ? '#' + String(id).replace(/-/g,'').slice(-8).toUpperCase() : '—'; }
const prodEmoji = cat => ({'flowers':'🌸','bouquets':'💐','plants':'🪴','gifts':'🎁'}[cat]||'🌼');

/* ── Sidebar ── */
function openSidebar()   { document.getElementById('sidebar')?.classList.add('open'); document.getElementById('sb-overlay')?.classList.add('visible'); }
function closeSidebar()  { document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('sb-overlay')?.classList.remove('visible'); }
function toggleSidebar() { document.getElementById('sidebar')?.classList.contains('open') ? closeSidebar() : openSidebar(); }

/* ── Nav active ── */
function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.panel === id));
}

/* ── GPS ── */
function detectGPS(inputId, btnId) {
  if (!navigator.geolocation) { toast('Geolocation not supported by your browser', 'error'); return; }
  btnLoad(btnId, true, '📍 Locating…');
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const el = document.getElementById(inputId);
        if (el) el.value = d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        toast('Location detected ✅', 'success');
      } catch {
        const el = document.getElementById(inputId);
        if (el) el.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
      btnLoad(btnId, false);
    },
    () => { toast('Location access denied. Please allow location.', 'error'); btnLoad(btnId, false); },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function mapsLink(addr) { return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`; }

/* ── Keyboard ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
    closeSidebar();
  }
});

/* ── Confirm ── */
const confirmAction = msg => window.confirm(msg);

/* ── Panel switcher (override per page) ── */
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${id}`);
    p.style.display = p.id === `panel-${id}` ? '' : 'none';
  });
  setActiveNav(id);
  closeSidebar();
}
