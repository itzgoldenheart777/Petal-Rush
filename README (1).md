# 🌸 Petal Rush — Multi-Role Marketplace

A production-ready, fully-separated multi-vendor flower marketplace with **Buyer, Seller, Delivery Partner and Admin** panels. Built with HTML + CSS + JS + Python, powered by **Supabase** and deployable to **GitHub Pages** in minutes.

---

## 📁 File Structure

```
petal-rush/
├── index.html              ← Login page (routes to all dashboards)
│
├── buyer/
│   └── index.html          ← Buyer dashboard
│
├── seller/
│   └── index.html          ← Seller dashboard
│
├── delivery/
│   └── index.html          ← Delivery partner dashboard
│
├── admin/
│   └── index.html          ← Admin control panel
│
├── assets/
│   ├── css/
│   │   └── styles.css      ← Shared design system
│   └── js/
│       ├── config.js       ← Supabase client initialization
│       ├── auth.js         ← Session, role guard, avatar upload
│       └── utils.js        ← Toast, helpers, badges
│
├── api/
│   └── server.py           ← Python backend (webhooks, cron)
│
├── supabase_schema.sql     ← Complete database + storage setup
└── README.md
```

---

## 🚀 Deployment in 3 Steps

### Step 1 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Navigate to **SQL Editor** → paste the entire content of `supabase_schema.sql` → **Run**
3. Navigate to **Settings → API** → copy your:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon / public** key

### Step 2 — Deploy to GitHub Pages

```bash
# 1. Create a new GitHub repository
gh repo create petal-rush --public

# 2. Push all files
git init
git add .
git commit -m "🌸 Initial Petal Rush deployment"
git remote add origin https://github.com/YOUR_USERNAME/petal-rush.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to: Settings → Pages → Source: Deploy from branch → Branch: main → / (root)
# Your site will be live at: https://YOUR_USERNAME.github.io/petal-rush/
```

### Step 3 — Configure the App

Open your GitHub Pages URL → Enter your **Supabase URL** and **anon key** → Click **Connect Database**

> **No database?** Click **Demo Mode** to explore all 4 panels without any setup.

---

## 🔐 Set Up Admin Account

After database setup:

1. Sign up via the app login page with any email
2. In **Supabase SQL Editor** run:
```sql
UPDATE public.users 
SET role = 'admin', is_verified = TRUE 
WHERE email = 'your-admin@email.com';
```
3. Sign in via the **Admin** tab on the login page

---

## 🖼️ Avatar Upload

All 4 user roles can upload and save their profile photo:

1. Navigate to **My Profile** in any dashboard
2. Click your avatar/photo area at the top
3. Select a JPG, PNG, or WEBP image (max 2MB)
4. Photo uploads instantly to **Supabase Storage** and saves to your profile
5. Avatar appears in the sidebar, topbar, and across the entire app

**Storage bucket:** `avatars` — automatically created by `supabase_schema.sql`

---

## 👥 User Roles

| Role | Login Tab | Dashboard URL | Features |
|------|-----------|---------------|----------|
| 🛍️ Buyer | Buyer | `/buyer/` | Browse shop, place orders, track, return, avatar |
| 🏪 Seller | Seller | `/seller/` | Add/edit products, sales analytics, payments, avatar |
| 🚚 Delivery | Delivery | `/delivery/` | Active deliveries, GPS nav, status updates, avatar |
| 🛠️ Admin | Admin | `/admin/` | Full control over users, orders, payments, avatar |

> Each dashboard is fully **role-protected** — accessing the wrong URL redirects automatically.

---

## 🗺️ GPS & Navigation

- **Auto-detect address** on signup and order forms using `navigator.geolocation`
- **OpenStreetMap Nominatim** for reverse geocoding (free, no API key)
- **Google Maps navigation** buttons open turn-by-turn directions:
  ```
  https://www.google.com/maps/dir/?api=1&destination=ADDRESS
  ```
- Works on mobile browser, desktop, and PWA

---

## 💰 Order & Payment Flow

```
Buyer places order
       ↓
Online: Money → Admin Wallet
COD:   Pending until delivered
       ↓
Admin assigns Delivery Partner
       ↓
Delivery: Assigned → Picked → Delivered
       ↓
Buyer accepted → Admin releases payment to Seller
Buyer returned → Admin holds payment → Investigation
```

---

## 🔒 Security (Row Level Security)

All Supabase tables have RLS enabled:

| Table | Who can read | Who can write |
|-------|--------------|---------------|
| `users` | Own record + Admin | Own record + Admin |
| `products` | Everyone (active) | Own seller + Admin |
| `orders` | Own buyer/seller/delivery | Buyer insert, Delivery update, Admin all |
| `payments` | Own seller/buyer | Buyer insert, Admin all |
| `notifications` | Own user | Own user |

---

## 🐍 Python Backend (Optional)

The `api/server.py` handles:
- Payment gateway webhooks (Razorpay/Stripe)
- Automated product expiry cron
- Admin notifications on key events

```bash
cd api
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export PORT=8000
# Run
python server.py
```

**Endpoints:**
- `GET  /health` — Health check
- `GET  /api/stats` — Platform statistics
- `GET  /api/expire-products` — Trigger product expiry
- `POST /api/payment/webhook` — Payment gateway callback
- `POST /api/release-payment` — Release seller payment
- `POST /api/assign-delivery` — Assign delivery partner

---

## 📱 PWA (Optional)

Add a `manifest.json` at root:
```json
{
  "name": "Petal Rush",
  "short_name": "PetalRush",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0e0e07",
  "theme_color": "#c9a84c",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Add to `<head>` of each HTML file:
```html
<link rel="manifest" href="/manifest.json">
```

---

## 🌐 Environment Variables (Python Server)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (has full DB access) |
| `PORT` | Server port (default: 8000) |

---

Built with ❤️ using HTML · CSS · JS · Python · Supabase
