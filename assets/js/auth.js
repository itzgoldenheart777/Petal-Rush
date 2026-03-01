/* ─────────────────────────────────────────────────────
   PETAL RUSH — Auth Utilities
───────────────────────────────────────────────────── */

async function getAuthUser() {
  if (!window.sb) return null;
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await window.sb.from('users').select('*').eq('id', session.user.id).single();
  if (error || !data) return null;
  return data;
}

/** Returns user or redirects away */
async function requireRole(requiredRole) {
  const sb = await tryInitFromStorage();
  if (!sb) { redirectToLogin('No database configured.'); return null; }
  const user = await getAuthUser();
  if (!user) { redirectToLogin(); return null; }
  if (user.is_banned) { alert('Your account has been suspended. Contact support.'); await sb.auth.signOut(); redirectToLogin(); return null; }
  if (user.role !== requiredRole) {
    const map = { buyer:'../buyer/', seller:'../seller/', delivery:'../delivery/', admin:'../admin/' };
    window.location.href = map[user.role] || '../index.html';
    return null;
  }
  return user;
}

async function logout() {
  if (window.sb) await window.sb.auth.signOut();
  redirectToLogin();
}

function redirectToLogin(msg) {
  if (msg) sessionStorage.setItem('pr_login_msg', msg);
  const d = location.pathname.split('/').length - 2;
  window.location.href = (d > 1 ? '../'.repeat(d-1) : '') + 'index.html';
}

/* ── Avatar upload to Supabase Storage ── */
async function uploadAvatar(file, userId) {
  if (!window.sb) { toast('Not connected to database', 'error'); return null; }
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['jpg','jpeg','png','webp'].includes(ext)) { toast('Please use JPG, PNG or WEBP image', 'error'); return null; }
  if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'error'); return null; }
  const path = `${userId}/avatar.${ext}`;
  // Remove old
  await window.sb.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.jpeg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);
  const { error } = await window.sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
  if (error) { toast('Upload failed: ' + error.message, 'error'); return null; }
  const { data } = window.sb.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl + '?v=' + Date.now();
}

async function handleAvatarUpload(file, containerEl, userId, onSuccess) {
  if (!file) return;
  // Instant preview
  const reader = new FileReader();
  reader.onload = e => {
    const img = containerEl.querySelector('img') || document.createElement('img');
    img.src = e.target.result;
    img.className = 'u-av-img';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    const initEl = containerEl.querySelector('.initials');
    if (initEl) initEl.style.display = 'none';
    if (!containerEl.querySelector('img')) containerEl.insertBefore(img, containerEl.firstChild);
  };
  reader.readAsDataURL(file);

  toast('Uploading…');
  const url = await uploadAvatar(file, userId);
  if (!url) return;

  const { error } = await window.sb.from('users').update({ avatar_url: url }).eq('id', userId);
  if (error) { toast('Failed to save: ' + error.message, 'error'); return; }

  // Refresh all avatar images on page
  document.querySelectorAll('.u-av-img').forEach(el => el.src = url);
  toast('Avatar saved ✅', 'success');
  if (onSuccess) onSuccess(url);
}

/* ── Render helpers ── */
function initials(name) { return (name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

function renderAvatar(user, sizeClass='av-md', extra='') {
  const ini = initials(user.name);
  if (user.avatar_url) {
    return `<div class="avatar ${sizeClass} ${extra}"><img src="${user.avatar_url}" class="u-av-img" alt="${user.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><span class="initials" style="display:none">${ini}</span></div>`;
  }
  return `<div class="avatar ${sizeClass} ${extra}"><span class="initials">${ini}</span></div>`;
}

function renderUploadableAvatar(user, sizeClass='av-xl', inputId='av-file') {
  const ini = initials(user.name);
  const inner = user.avatar_url
    ? `<img src="${user.avatar_url}" class="u-av-img" alt="${user.name}" style="width:100%;height:100%;object-fit:cover" />`
    : `<span class="initials">${ini}</span>`;
  return `<label class="avatar ${sizeClass} avatar-upload" for="${inputId}" title="Click to change photo">
    ${inner}
    <div class="avatar-upload-overlay">📷</div>
    <input type="file" id="${inputId}" accept="image/jpeg,image/png,image/webp" onchange="onAvatarChange(event)" />
  </label>`;
}
