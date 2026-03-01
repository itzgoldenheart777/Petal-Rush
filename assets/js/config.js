/* ─────────────────────────────────────────────────────
   PETAL RUSH — Config & Theme
───────────────────────────────────────────────────── */

const PR_URL_KEY   = 'pr_url';
const PR_ANON_KEY  = 'pr_anon';
const PR_THEME_KEY = 'pr_theme';
window.sb = null;

/* ── Theme ── */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t || 'dark');
  localStorage.setItem(PR_THEME_KEY, t);
  document.querySelectorAll('.theme-toggle').forEach(el => {
    el.textContent = t === 'light' ? '🌙' : '☀️';
    el.title = t === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
  });
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
// Apply stored theme immediately to avoid flash
(function() {
  const t = localStorage.getItem(PR_THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

/* ── Supabase SDK ── */
async function loadSdk() {
  if (window.supabase?.createClient) return window.supabase;
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload  = () => res(window.supabase);
    s.onerror = () => rej(new Error('Could not load Supabase SDK. Check your internet connection.'));
    document.head.appendChild(s);
  });
}

function getCredentials() {
  return { url: localStorage.getItem(PR_URL_KEY)||'', key: localStorage.getItem(PR_ANON_KEY)||'' };
}

async function initSupabase(url, key) {
  localStorage.setItem(PR_URL_KEY, url.trim());
  localStorage.setItem(PR_ANON_KEY, key.trim());
  const lib = await loadSdk();
  window.sb = lib.createClient(url.trim(), key.trim());
  return window.sb;
}

async function tryInitFromStorage() {
  const { url, key } = getCredentials();
  if (!url || !key) return null;
  try {
    const lib = await loadSdk();
    window.sb = lib.createClient(url, key);
    return window.sb;
  } catch(e) { return null; }
}

function clearSupabase() {
  localStorage.removeItem(PR_URL_KEY);
  localStorage.removeItem(PR_ANON_KEY);
  window.sb = null;
}

function updateStoredCredentials(url, key) {
  localStorage.setItem(PR_URL_KEY, url.trim());
  localStorage.setItem(PR_ANON_KEY, key.trim());
  // Reinit client with new creds
  if (window.supabase?.createClient) {
    window.sb = window.supabase.createClient(url.trim(), key.trim());
  }
}
