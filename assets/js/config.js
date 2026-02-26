/* ═══════════════════════════════════════
   PETAL RUSH — Supabase Configuration
   ═══════════════════════════════════════ */

const STORAGE_KEY_URL = 'pr_supabase_url';
const STORAGE_KEY_KEY = 'pr_supabase_key';

// Loaded Supabase client (set after init)
window.sb = null;

/**
 * Load and initialize Supabase JS client from CDN
 */
async function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase && window.supabase.createClient) { resolve(window.supabase); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload  = () => resolve(window.supabase);
    script.onerror = () => reject(new Error('Failed to load Supabase SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Get stored credentials
 */
function getCredentials() {
  return {
    url: localStorage.getItem(STORAGE_KEY_URL) || '',
    key: localStorage.getItem(STORAGE_KEY_KEY) || ''
  };
}

/**
 * Save credentials and initialize client
 */
async function initSupabase(url, key) {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  const lib = await loadSupabase();
  window.sb = lib.createClient(url.trim(), key.trim());
  return window.sb;
}

/**
 * Try to init from stored credentials
 * Returns null if not configured
 */
async function tryInitFromStorage() {
  const { url, key } = getCredentials();
  if (!url || !key) return null;
  try {
    const lib = await loadSupabase();
    window.sb = lib.createClient(url, key);
    return window.sb;
  } catch(e) {
    console.error('Supabase init failed:', e);
    return null;
  }
}

/**
 * Clear stored credentials
 */
function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  window.sb = null;
}
