# Project structure

```
fyp_backup/
│
└── fyp_demo/
    │
    ├── backend/                          # Node.js/Express API
    │   ├── config/
    │   │   ├── cloudinary.js             # Cloudinary image upload config
    │   │   ├── db_connection.js          # MongoDB connection
    │   │   └── mailer.js                 # Email (e.g. password reset)
    │   │
    │   ├── controllers/
    │   │   ├── authController.js          # Auth: login, register, preferences
    │   │   ├── discoverController.js     # Discover feed & matching
    │   │   └── profileController.js      # Profile CRUD, posts
    │   │
    │   ├── middleware/
    │   │   └── auth.js                   # JWT auth middleware
    │   │
    │   ├── models/
    │   │   ├── Match.js                  # Match model (user pairs)
    │   │   └── User.js                   # User model, posts subdocument
    │   │
    │   ├── routes/
    │   │   ├── auth.js                   # /api/auth
    │   │   ├── discover.js               # /api/discover
    │   │   └── profile.js               # /api/profile
    │   │
    │   ├── Utils/
    │   │   └── matchingAlgorithm.js      # Discovery matching logic
    │   │
    │   ├── uploads/                      # Local uploads (if used)
    │   │
    │   ├── .env                          # Env vars (not in git)
    │   ├── changes.txt                   # Changelog/notes
    │   ├── debugDiscover.js              # Discover debugging
    │   ├── generate_tree.cjs             # Tree generator script
    │   ├── Migratediscoverysettings.js   # Discovery settings migration
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── seedData.js                   # DB seed script
    │   ├── server.js                     # Express entry point
    │   └── testReset.js                  # Test reset script
    │
    ├── frontend/                         # React + TypeScript (Vite)
    │   ├── public/
    │   │   └── vite.svg
    │   │
    │   ├── src/
    │   │   ├── assets/
    │   │   │   └── react.svg
    │   │   │
    │   │   ├── components/
    │   │   │   ├── Button.tsx
    │   │   │   ├── FilterModal.tsx       # Discover filters
    │   │   │   ├── ImageUpload.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── InterestTags.tsx
    │   │   │   ├── MatchModal.tsx
    │   │   │   ├── PhotoCarousel.tsx
    │   │   │   ├── PostCard.tsx
    │   │   │   ├── ProfileCompletion.tsx
    │   │   │   ├── SkeletonLoader.tsx
    │   │   │   └── UserCard.tsx          # Discover cards
    │   │   │
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts
    │   │   │
    │   │   ├── pages/
    │   │   │   ├── About.tsx
    │   │   │   ├── Discover.tsx          # Discovery feed
    │   │   │   ├── EnhancedPreferences.tsx
    │   │   │   ├── ForgotPassword.tsx
    │   │   │   ├── Home.tsx
    │   │   │   ├── Login.tsx
    │   │   │   ├── Matches.tsx
    │   │   │   ├── Preferences.tsx
    │   │   │   ├── profile.tsx
    │   │   │   └── ResetPassword.tsx
    │   │   │
    │   │   ├── services/
    │   │   │   ├── api.ts                # Axios instance
    │   │   │   ├── authService.ts
    │   │   │   ├── discoverService.ts
    │   │   │   └── userService.ts
    │   │   │
    │   │   ├── types/
    │   │   │   └── index.ts              # TS interfaces
    │   │   │
    │   │   ├── utils/
    │   │   │   └── validation.ts
    │   │   │
    │   │   ├── App.css
    │   │   ├── App.tsx
    │   │   ├── custom.d.ts
    │   │   ├── index.css
    │   │   └── main.tsx
    │   │
    │   ├── .gitignore
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── postcss.config.js
    │   ├── README.md
    │   ├── tailwind.config.js
    │   ├── tsconfig.json
    │   └── vite.config.ts
    │
    ├── BACKEND_DOCUMENTATION.md.pdf
    ├── project_structure_tmp.txt
    └── PROJECT_STRUCTURE.md              # (legacy Capella structure doc)
```

## Summary

| Layer   | Path           | Role |
|--------|----------------|------|
| Backend| `fyp_demo/backend/`  | Express API: auth, profile, discover; MongoDB; JWT; Cloudinary; mailer |
| Frontend | `fyp_demo/frontend/` | React + TS + Vite: login, profile, discover, matches, preferences |

*Generated from the current repo; `node_modules` and `.git` are omitted.*
