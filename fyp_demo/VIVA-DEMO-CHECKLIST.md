# Capella FYP — Viva demo & deployment checklist

Use this tonight. Keep a **local backup** even if you deploy to the cloud.

---

## Recommended strategy (do both)

| Plan | When to use |
|------|-------------|
| **A — Local (primary safety net)** | Laptop + local MongoDB + seeded users. Works offline. |
| **B — Cloud (impressive for panel)** | MongoDB Atlas + Render backend + static frontend. |

Do **not** rely on cloud alone for tomorrow. Duplicate repo is optional; a **USB zip + MongoDB dump** is enough backup.

---

## Plan A — Local demo (30 min setup)

### 1. Prerequisites on demo laptop

- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)
- Same `.env` in `fyp_demo/backend/` as your dev machine

### 2. Backup data (run once tonight)

```powershell
mongodump --db=capellaDB --out=C:\capella-backup\viva-mongo
```

Copy entire `fyp_backup` folder to USB (exclude `node_modules` to save space, or include if no network).

### 3. Start order (every demo)

```powershell
# Terminal 1 — MongoDB (if not a Windows service)
# ensure MongoDB service is running

# Terminal 2 — Backend
cd fyp_demo\backend
npm install
node server.js
# expect: MongoDB Connected, Backend server running → http://localhost:5000

# Terminal 3 — Frontend
cd fyp_demo\frontend
npm install
npm run dev
# open http://localhost:5173
```

### 4. Health check

- Browser: `http://localhost:5000/health` → `{ "success": true }`
- Login with a seeded user (see seed script output / your usual test account)
- Quick path: Discover → like/match → Messages → send chat → share profile

### 5. Re-seed if DB empty

```powershell
cd fyp_demo\backend
node seedData.js
```

Default seed passwords are in `seedData.js` (typically `password123`).

---

## Plan B — Cloud deployment (step by step)

### Step 1 — MongoDB Atlas (15 min)

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → free cluster.
2. Database user + password.
3. Network Access → add `0.0.0.0/0` (demo only; tighten later).
4. Connect → Drivers → copy connection string.
5. Replace `<password>` and set DB name, e.g. `capellaDB`:
   `mongodb+srv://USER:PASS@cluster....mongodb.net/capellaDB?retryWrites=true&w=majority`

**Seed cloud DB (from your PC):**

```powershell
cd fyp_demo\backend
# Temporarily set MONGO_URI in .env to Atlas URI, then:
node seedData.js
# Restore local MONGO_URI after if you still demo locally
```

### Step 2 — Backend on Render (20 min)

1. Push code to GitHub (ensure `.env` is **not** committed).
2. [render.com](https://render.com) → New **Web Service** → connect repo.
3. Root directory: `fyp_demo/backend`
4. Build: `npm install`
5. Start: `node server.js`
6. Environment variables:

| Key | Value |
|-----|--------|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | frontend URL (set after step 3) |
| `FRONTEND_URL` | same as CLIENT_URL |
| `CLOUDINARY_*` | from your Cloudinary dashboard |

7. Deploy → note URL, e.g. `https://capella-api.onrender.com`
8. Test: `https://capella-api.onrender.com/health`

**Note:** Free Render spins down after idle; first request may take ~30s — mention this to examiners or keep service warm before viva.

### Step 3 — Frontend on Render Static Site or Vercel (15 min)

**Render static site** (keeps everything on one platform):

1. New **Static Site** → same repo.
2. Root: `fyp_demo/frontend`
3. Build: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment (build time):

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://capella-api.onrender.com` |
| `VITE_SOCKET_URL` | `https://capella-api.onrender.com` |

6. Redeploy backend with `CLIENT_URL` = your static site URL.

**F5 / refresh on `/discover` (white screen fix):**

Render must rewrite unknown paths to `index.html`. In **Redirects / Rewrites**:

1. **Delete all existing rules** (bad rules can create 0-byte responses for `/discover`, `/home`, etc.).
2. Add **one** rule only:

| Field | Value |
|-------|--------|
| Source | `/*` |
| Destination | `/index.html` |
| Action | **Rewrite** (not Redirect) |

3. **Publish directory** must be `dist` (not `fyp_demo/frontend` root).
4. **Manual Deploy** → **Clear build cache** → deploy.

**Verify:** open `https://YOUR-SITE.onrender.com/discover` → right-click → View page source. You should see `<script ... src="/assets/index-....js">`. If the page is empty or has `/src/main.tsx`, the deploy is wrong.

**If F5 opens “Save as” for a file named `home`:** an old build copied `index.html` to extensionless files (`home`, `discover`). Redeploy latest code — build now uses `home/index.html` folders so the browser renders HTML instead of downloading.

**If rewrite is set but F5 still white:** push latest code, **Manual Deploy → Clear build cache**, confirm `/discover` View Source shows `/assets/index-….js`.

**Vercel:** same env vars under Project → Settings → Environment Variables, build command `npm run build`, output `dist`.

### Step 4 — Post-deploy smoke test

- [ ] Register / login
- [ ] Discover loads profiles
- [ ] Like → mutual match → Messages
- [ ] Chat send + receive (two browsers / incognito)
- [ ] Upload image in chat (Cloudinary)
- [ ] Share profile from Discover
- [ ] View profile / block flow if you demo privacy

---

## Security before pushing to GitHub

- [ ] `backend/.env` must **not** be in git (`git status` clean)
- [ ] Rotate Cloudinary/JWT if `.env` was ever committed
- [ ] Use `.env.example` only in repo

---

## Demo script (5–8 min)

1. Problem: matchmaking + privacy + real-time chat.
2. Register/login → profile completeness.
3. Discover: filters, like/pass, mutual match modal.
4. Messages: live chat, typing, images, profile share card.
5. Privacy: block → profile unavailable / neutral chat copy.
6. (Optional) Mention cloud: Atlas + Render + Socket.IO + Cloudinary.

---

## If something breaks during viva

| Symptom | Fix |
|---------|-----|
| Blank discover | Mongo empty → `node seedData.js`; check backend logs |
| Network error on login | Backend not running or wrong `VITE_API_URL` after deploy |
| Chat not live | Socket URL wrong; check browser console; redeploy with `VITE_SOCKET_URL` |
| Images fail | Cloudinary env vars on backend |
| Render slow first load | Wait 30s; use local Plan A |

**Fallback:** “I'll run the local instance” → Plan A.

---

## Duplicate GitHub repo?

**Optional.** Simpler backups:

1. Git tag: `git tag viva-2026-05-30`
2. USB copy of project + `mongodump`
3. This checklist file

A second repo only helps if you want a frozen `main` for deploy while you keep developing locally.
