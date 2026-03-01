# 🌸 Petal Rush v3 — Production-Ready Marketplace

Multi-role flower marketplace with **Light/Dark mode**, **Avatar uploads**, full **Supabase** backend.

## 📁 Files

```
petal-rush/
├── index.html              ← Login (routes to all dashboards)
├── buyer/index.html        ← Buyer dashboard
├── seller/index.html       ← Seller dashboard
├── delivery/index.html     ← Delivery partner dashboard
├── admin/index.html        ← Admin panel (+ Settings to edit DB config)
├── assets/
│   ├── css/styles.css      ← Full design system (light + dark)
│   └── js/
│       ├── config.js       ← Supabase client + theme manager
│       ├── auth.js         ← Role guard + avatar upload
│       └── utils.js        ← Toast, badges, GPS, helpers
├── supabase_schema.sql     ← DB + Storage setup
└── api/server.py           ← Optional Python webhook server
```

## 🚀 Deploy in 3 Steps

### 1. Supabase Setup
```
→ supabase.com → New Project
→ SQL Editor → paste supabase_schema.sql → Run All
→ Settings → API → copy URL + anon key
```

### 2. GitHub Pages
```bash
git init && git add . && git commit -m "🌸 Petal Rush v3"
gh repo create petal-rush --public --push
# Settings → Pages → main branch → /(root)
```

### 3. Connect App
```
Open your GitHub Pages URL
→ Enter Supabase URL + anon key → Connect
```

## 👑 Create Admin
After Supabase schema runs, sign up via the app then run:
```sql
UPDATE public.users SET role = 'admin', is_verified = TRUE
WHERE email = 'your@admin.com';
```

## ✨ Key Features

| Feature | Details |
|---------|---------|
| 🌙 Light/Dark | Toggle in sidebar or Settings panel |
| 🖼️ Avatars | All 4 roles can upload → stored in Supabase Storage |
| ⚙️ DB Settings | Admin can edit Supabase URL/key from Settings panel |
| 📱 Mobile | Fully responsive, sidebar collapses, tap targets sized for touch |
| 🗺️ GPS | Auto-detect address + Google Maps navigation for delivery |
| 🔒 RLS | Row-level security on all tables |

## 🎨 Light/Dark Mode
- Toggle persists in `localStorage`
- Theme applies instantly without flash on page load
- Available on every page via the `☀️` button in sidebar/topbar
