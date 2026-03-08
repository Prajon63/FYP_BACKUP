# Capella — 1‑Month Roadmap & Stand‑Out Guide

**Project:** Capella — Hybrid mutual matchmaking + social profile management (web + mobile-friendly)  
**Stack:** ES modules, TypeScript (frontend), MVC  
**Timeline:** ~1 month | **Progress:** ~50–60%  
**Remaining:** Matchmaking fine-tuning, chat system, and a few other items.

This doc is your single reference to prioritise work and make Capella stand out in your FYP.

---

## 1. Current state (what you have)

| Area | Status | Notes |
|------|--------|--------|
| **Auth** | Done | Login, register, JWT, forgot/reset password |
| **Profile** | Done | CRUD, posts, photos, cover, carousel, Cloudinary |
| **Preferences** | Done | Basic + Enhanced (age, gender, distance, discovery on/off) |
| **Discover** | In place | Feed, like/super-like/pass, filters, scoring algorithm |
| **Matches** | In place | List, unmatch, mutual match detection; Match model has `conversationStarted`, `lastMessageAt` |
| **Matching algorithm** | In place | Age, location, interests, lifestyle, profile completeness, activity; needs tuning |
| **Chat** | Not built | UI shows “Message feature coming soon!”; no Message model or chat API |

---

## 2. Priority order (next 4 weeks)

### Week 1: Matchmaking polish + “Capella story”

- **Goal:** Make discovery feel intentional and explainable; reduce bugs; document design.
- **Tasks:**
  1. **Remove or gate debug logs** in `discoverController.js` (e.g. `console.log('🔍 DEBUG - ...')`) for production; keep only in dev or behind a flag.
  2. **Tune weights** in `matchingAlgorithm.js` (e.g. `calculateCompatibilityScore`) so the feed order feels right (e.g. interests + distance a bit higher if that’s your design).
  3. **Add a short “Why we suggested this”** (e.g. “Shared interests: Music, Travel” or “Within 15 km”) on Discover cards or in MatchModal — this differentiates you and shows your algorithm is transparent.
  4. **One-page design doc** (in repo): “Capella matching: inputs (preferences, interests, location, lifestyle), weights, and how mutual match is determined.” Helps examiners and you.

### Week 2: Chat (MVP)

- **Goal:** Real 1‑to‑1 chat between mutual matches only; no need for typing indicators or read receipts in v1.
- **Backend (MVC):**
  - **Model:** `Message` (e.g. `sender`, `receiver`, `matchId` or pair `(userA, userB)`, `text`, `createdAt`). Optionally `Conversation` if you want a room per match.
  - **Controller:** `chatController.js` — send message, get messages for a match (paginated), mark `conversationStarted` / `lastMessageAt` on `Match` when first message is sent.
  - **Routes:** e.g. `POST /api/chat/send`, `GET /api/chat/:matchId/messages?limit=50&before=...`
  - **Auth:** Ensure only the two users in that match can read/write (validate `matchId` + `req.user.id`).
- **Frontend:**
  - **Route:** e.g. `/matches/:matchId/chat` or open a chat panel/drawer from Matches.
  - **Page/component:** Message list (scroll to bottom), input, send; call your new chat API. On first send, backend sets `conversationStarted` and `lastMessageAt`.
- **Stand out:** Simple “First message” suggestion when opening chat with a new match (e.g. “Ask about their last trip” based on interests).

### Week 3: UX + mobile + performance

- **Goal:** Feels polished on phone and fast enough for demo.
- **Tasks:**
  1. **Mobile:** Tap targets, font sizes, bottom nav or clear primary actions on Discover/Matches; test on real device or Chrome device toolbar.
  2. **Loading states:** Skeletons or spinners on Discover, Matches, and chat; you already have `SkeletonLoader` — use it everywhere that fetches.
  3. **Errors:** Friendly messages and one retry or “Go back” where it makes sense (e.g. “Couldn’t load matches” with a retry button).
  4. **Small wins:** Pull-to-refresh on Discover/Matches; “New match” toast when returning to Matches after a like that created a mutual match.

### Week 4: Demo readiness + documentation

- **Goal:** Smooth demo and clear written evidence of your work.
- **Tasks:**
  1. **Demo script:** 2–3 min path: Register → set preferences → Discover (like/super-like) → Matches → open chat → send message. Optional: show profile and one “why we suggested” tooltip.
  2. **README:** One README at repo root: what Capella is, how to run backend + frontend (with `.env.example`), main tech (Express, MongoDB, React, TypeScript, Vite). Link to `PROJECT_STRUCTURE.md` and this roadmap.
  3. **.env.example:** List required vars (e.g. `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `PORT`) without real values.
  4. **Short “Future work”:** 3–5 bullets (e.g. push notifications, report/block, video call, better recommendations). Shows vision.

---

## 3. How to make Capella stand out

- **Transparent matching:** “Why we suggested this” on cards or in modal (shared interests, distance, lifestyle) — shows algorithmic thinking.
- **Mutual-first design:** Only mutual matches can chat; clear “It’s a match!” moment. Emphasise this in your report and demo.
- **One strong differentiator:** Either (a) very clear matching explanation, or (b) a neat first-message helper, or (c) a simple “profile completeness” nudge in the app — pick one and do it well.
- **Clean repo:** README, PROJECT_STRUCTURE.md, this roadmap, and a one-page matching design doc. No stray `console.log` in production paths.
- **Demo:** One happy path that always works (seed 2–3 users if needed), and you know exactly what to click and say.

---

## 4. Quick reference (files to touch)

| Goal | Backend | Frontend |
|------|--------|----------|
| Matchmaking tune | `Utils/matchingAlgorithm.js`, `controllers/discoverController.js` | `pages/Discover.tsx`, `components/UserCard.tsx` / `MatchModal.tsx` |
| “Why we suggested” | Return top 1–2 reasons from scoring in discover API | Show in card or modal |
| Chat MVP | New: `models/Message.js`, `controllers/chatController.js`, `routes/chat.js`; update `server.js` | New: chat page/component; `services/chatService.ts`; link from Matches |
| Mobile/UX | — | All main pages + Matches + Discover + Chat |
| Docs | — | `README.md`, `.env.example`, this file, matching design doc |

---

## 5. Tech alignment (ES modules, TypeScript, MVC)

- **Backend:** You already use ES modules and MVC (models, controllers, routes). Keep new code (e.g. chat) in the same style; put business logic in controllers or small helpers, not in routes.
- **Frontend:** TypeScript is in the frontend; ensure new types (e.g. `Message`, chat API responses) live in `src/types/index.ts` and that API calls go through `services`.
- **Mobile:** “Mobile functional” = responsive + touch-friendly; no separate native app required for FYP unless you already committed to it.

---

You can treat this as your checklist: finish Week 1, then 2, then 3, then 4. If you tell me which week or task you’re on (e.g. “starting chat” or “adding why we suggested”), I can give step-by-step code changes next.
