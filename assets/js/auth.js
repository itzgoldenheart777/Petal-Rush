/* ═══════════════════════════════════════
   PETAL RUSH — Production Auth Utilities
   (Phone OTP & Role-Based Access)
   ═══════════════════════════════════════ */

/**
 * Get current authenticated user + profile from DB
 * Returns null if not logged in
 */
async function getAuthUser() {
  if (!window.sb) return null;
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) return null;
  
  // Fetch profile from our public.users table
  const { data } = await window.sb.from('users').select('*').eq('id', session.user.id).single();
  return data || null;
}

/**
 * Role guard — call on each dashboard page
 * requiredRole: 'buyer' | 'seller' | 'delivery' | 'admin'
 */
async function requireRole(requiredRole) {
  const sb = await tryInitFromStorage();
  if (!sb) { redirectToLogin(); return null; }
  
  const user = await getAuthUser();
  if (!user) { redirectToLogin(); return null; }
  
  if (user.is_banned) {
    alert('Your account has been suspended. Contact support.');
    logout(); 
    return null;
  }

  if (user.role !== requiredRole) {
    // Redirect to the correct dashboard based on actual role
    const paths = { 
        buyer: '../buyer/', 
        seller: '../seller/', 
        delivery: '../delivery/', 
        admin: '../admin/' 
    };
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
  localStorage.removeItem('sb-access-token'); // Clean up any lingering session
  localStorage.removeItem('sb-refresh-token');
  redirectToLogin();
}

function redirectToLogin() {
  const depth = location.pathname.split('/').length - 2;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
  window.location.href = prefix + 'index.html';
}

/* ── PRODUCTION AUTH (Supabase Phone/OTP) ── */

/**
 * 1. Sign Up with Phone
 * metadata includes: name, role, address, phone
 */
async function signUpWithPhone(phone, password, metadata) {
  if (!window.sb) throw new Error("Database not connected");
  
  const { data, error } = await window.sb.auth.signUp({
    phone: phone,
    password: password,
    options: { 
        data: metadata // This data is saved in auth.users 'raw_user_meta_data'
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * 2. Login with Phone & Password
 */
async function loginWithPhone(phone, password) {
  if (!window.sb) throw new Error("Database not connected");
  
  const { data, error } = await window.sb.auth.signInWithPassword({
    phone: phone,
    password: password
  });
  
  if (error) throw error;
  return data;
}

/**
 * 3. Password Reset (via Phone)
 * Note: Requires SMS provider configuration in Supabase
 */
async function resetPasswordPhone(phone) {
  if (!window.sb) throw new Error("Database not connected");
  
  const { data, error } = await window.sb.auth.resetPasswordForEmail(phone); 
  if (error) throw error;
  return data;
}

/* ── AVATAR & STORAGE ── */

/**
 * Upload avatar to Supabase Storage
 */
async function uploadAvatar(file, userId) {
  if (!window.sb) return null;
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['jpg','jpeg','png','webp','gif'];
  
  if (!allowed.includes(ext)) { 
    toast('Please upload an image file (JPG, PNG, WEBP)', 'error'); 
    return null; 
  }
  if (file.size > 2 * 1024 * 1024) { 
    toast('Image must be under 2MB', 'error'); 
    return null; 
  }

  const path = `${userId}/avatar.${ext}`;

  // Remove old version
  await window.sb.storage.from('avatars').remove([path]);

  const { error } = await window.sb.storage.from('avatars').upload(path, file, {
    cacheControl: '3600', 
    upsert: true, 
    contentType: file.type
  });
  
  if (error) { 
    console.error('Storage upload error:', error); 
    toast('Upload failed: ' + error.message, 'error'); 
    return null; 
  }

  const { data } = window.sb.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl + '?t=' + Date.now(); 
}

/**
 * Save avatar URL to user profile
 */
async function saveAvatarUrl(userId, avatarUrl) {
  if (!window.sb) return false;
  const { error } = await window.sb.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
  if (error) { 
    toast('Failed to save avatar: ' + error.message, 'error'); 
    return false; 
  }
  return true;
}

/**
 * Handle avatar file input change
 */
async function handleAvatarUpload(file, avatarEl, userId, onSuccess) {
  if (!file) return;
  
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

  document.querySelectorAll('.user-avatar-img').forEach(el => {
    el.src = url;
  });
  
  toast('Avatar updated ✅', 'success');
  if (onSuccess) onSuccess(url);
}

/* ── UI RENDERING ── */

function renderAvatar(user, sizeClass = 'avatar-md', extraClasses = '') {
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const imgHtml = user.avatar_url
    ? `<img src="${user.avatar_url}" alt="${user.name}" class="user-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="initials" style="display:none">${initials}</span>`
    : `<span class="initials">${initials}</span>`;
  return `<div class="avatar ${sizeClass} ${extraClasses}">${imgHtml}</div>`;
}

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
