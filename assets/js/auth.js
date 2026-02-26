/* ═══════════════════════════════════════
   PETAL RUSH — Auth & Session Utilities
   ═══════════════════════════════════════ */

/**
 * Get current authenticated user + profile from DB
 * Returns null if not logged in
 */
async function getAuthUser() {
  if (!window.sb) return null;
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) return null;
  const { data } = await window.sb.from('users').select('*').eq('id', session.user.id).single();
  return data || null;
}

/**
 * Role guard — call on each dashboard page
 * requiredRole: 'buyer' | 'seller' | 'delivery' | 'admin'
 * Returns the user object or redirects to login
 */
async function requireRole(requiredRole) {
  const sb = await tryInitFromStorage();
  if (!sb) { redirectToLogin(); return null; }
  const user = await getAuthUser();
  if (!user) { redirectToLogin(); return null; }
  if (user.is_banned) {
    alert('Your account has been suspended. Contact support.');
    redirectToLogin(); return null;
  }
  if (user.role !== requiredRole) {
    // Redirect to correct dashboard
    const paths = { buyer: '../buyer/', seller: '../seller/', delivery: '../delivery/', admin: '../admin/' };
    window.location.href = paths[user.role] || '../index.html';
    return null;
  }
  return user;
}

/**
 * Logout current user
 */
async function logout() {
  if (window.sb) await window.sb.auth.signOut();
  redirectToLogin();
}

function redirectToLogin() {
  // Works from any subfolder (buyer/, seller/, etc.)
  const depth = location.pathname.split('/').length - 2;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
  window.location.href = prefix + 'index.html';
}

/**
 * Upload avatar to Supabase Storage
 * Stores in 'avatars' bucket at path: userId/avatar.ext
 * Returns public URL or null on failure
 */
async function uploadAvatar(file, userId) {
  if (!window.sb) return null;
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['jpg','jpeg','png','webp','gif'];
  if (!allowed.includes(ext)) { toast('Please upload an image file (JPG, PNG, WEBP)', 'error'); return null; }
  if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'error'); return null; }

  const path = `${userId}/avatar.${ext}`;

  // Delete old avatar if exists
  await window.sb.storage.from('avatars').remove([path]);

  const { error } = await window.sb.storage.from('avatars').upload(path, file, {
    cacheControl: '3600', upsert: true, contentType: file.type
  });
  if (error) { console.error('Storage upload error:', error); toast('Upload failed: ' + error.message, 'error'); return null; }

  const { data } = window.sb.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl + '?t=' + Date.now(); // cache-bust
}

/**
 * Save avatar URL to user profile
 */
async function saveAvatarUrl(userId, avatarUrl) {
  if (!window.sb) return false;
  const { error } = await window.sb.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
  if (error) { toast('Failed to save avatar: ' + error.message, 'error'); return false; }
  return true;
}

/**
 * Handle avatar file input change
 * avatarEl: the .avatar DOM element to update visually
 * userId: current user's ID
 * onSuccess: callback with new URL
 */
async function handleAvatarUpload(file, avatarEl, userId, onSuccess) {
  if (!file) return;
  // Show preview immediately
  const reader = new FileReader();
  reader.onload = e => {
    avatarEl.innerHTML = `<img src="${e.target.result}" alt="Avatar" />`;
  };
  reader.readAsDataURL(file);

  toast('Uploading avatar...', 'info');

  const url = await uploadAvatar(file, userId);
  if (!url) return;

  const saved = await saveAvatarUrl(userId, url);
  if (!saved) return;

  // Update all avatar elements on page
  document.querySelectorAll('.user-avatar-img').forEach(el => {
    el.src = url;
  });
  toast('Avatar updated ✅', 'success');
  if (onSuccess) onSuccess(url);
}

/**
 * Render avatar HTML — shows image if URL exists, else initials
 */
function renderAvatar(user, sizeClass = 'avatar-md', extraClasses = '') {
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const imgHtml = user.avatar_url
    ? `<img src="${user.avatar_url}" alt="${user.name}" class="user-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="initials" style="display:none">${initials}</span>`
    : `<span class="initials">${initials}</span>`;
  return `<div class="avatar ${sizeClass} ${extraClasses}">${imgHtml}</div>`;
}

/**
 * Build clickable avatar with upload overlay
 */
function renderUploadableAvatar(user, sizeClass = 'avatar-xl', inputId = 'avatar-file-input') {
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const inner = user.avatar_url
    ? `<img src="${user.avatar_url}" alt="${user.name}" class="user-avatar-img" style="width:100%;height:100%;object-fit:cover" />`
    : `<span class="initials">${initials}</span>`;
  return `
    <label class="avatar ${sizeClass} avatar-upload" for="${inputId}" title="Click to change photo">
      ${inner}
      <div class="avatar-upload-overlay">📷</div>
      <input type="file" id="${inputId}" accept="image/jpeg,image/png,image/webp,image/gif" onchange="onAvatarFileChange(event)" />
    </label>`;
}
