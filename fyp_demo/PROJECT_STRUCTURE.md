# Capella Project Structure

```
fyp_demo/
│
├── backend/                          # Node.js/Express Backend
│   ├── config/
│   │   └── db_connection.js         # MongoDB connection configuration
│   │
│   ├── controllers/                 # Business logic controllers
│   │   ├── authController.js        # Authentication (login, register, preferences)
│   │   └── profileController.js     # Profile CRUD operations
│   │
│   ├── models/                      # Database models (Mongoose schemas)
│   │   └── User.js                  # User model with posts subdocument
│   │
│   ├── routes/                      # API route definitions
│   │   ├── auth.js                  # Authentication routes
│   │   └── profile.js               # Profile routes
│   │
│   ├── node_modules/                # Backend dependencies
│   ├── changes.txt                  # Change log/documentation
│   ├── package.json                 # Backend dependencies & scripts
│   ├── package-lock.json            # Locked dependency versions
│   └── server.js                    # Express server entry point
│
└── frontend/                        # React/TypeScript Frontend
    ├── public/
    │   └── vite.svg                 # Vite logo
    │
    ├── src/
    │   ├── assets/                  # Static assets
    │   │   └── react.svg            # React logo
    │   │
    │   ├── components/              # Reusable React components
    │   │   ├── Button.tsx           # Button component with variants
    │   │   ├── Input.tsx            # Input field component
    │   │   └── PostCard.tsx         # Post card component (matches Home.tsx style)
    │   │
    │   ├── hooks/                    # Custom React hooks
    │   │   └── useAuth.ts           # Authentication hook (login, register, logout)
    │   │
    │   ├── pages/                    # Page components
    │   │   ├── Home.tsx             # Home page with user profiles feed
    │   │   ├── Login.tsx            # Login/Register page
    │   │   ├── Preferences.tsx      # User preferences page
    │   │   └── profile.tsx          # User profile page (CRUD for bio, username, posts)
    │   │
    │   ├── services/                 # API service layer
    │   │   ├── api.ts               # Axios instance with interceptors
    │   │   ├── authService.ts       # Authentication API calls
    │   │   └── userService.ts       # User/profile API calls
    │   │
    │   ├── types/                    # TypeScript type definitions
    │   │   └── index.ts             # All TypeScript interfaces
    │   │
    │   ├── utils/                    # Utility functions
    │   │   └── validation.ts        # Form validation utilities
    │   │
    │   ├── App.css                   # App-level styles
    │   ├── App.tsx                   # Main app component with routing
    │   ├── custom.d.ts              # Custom TypeScript declarations
    │   ├── index.css                 # Global styles
    │   └── main.tsx                  # React app entry point
    │
    ├── node_modules/                 # Frontend dependencies
    ├── eslint.config.js              # ESLint configuration
    ├── index.html                    # HTML entry point
    ├── package.json                  # Frontend dependencies & scripts
    ├── package-lock.json             # Locked dependency versions
    ├── postcss.config.js             # PostCSS configuration
    ├── README.md                     # Frontend documentation
    ├── tailwind.config.js            # Tailwind CSS configuration
    ├── tsconfig.json                 # TypeScript configuration
    └── vite.config.ts                # Vite build configuration
```

## Backend API Routes

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/preference` - Save user preferences

### Profile Routes (`/api/profile`)
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update profile (username, bio, profile picture, cover image)
- `GET /api/profile/:userId/posts` - Get all user posts
- `POST /api/profile/:userId/posts` - Add new post
- `PUT /api/profile/:userId/posts/:postId` - Update post
- `DELETE /api/profile/:userId/posts/:postId` - Delete post

## Frontend Routes

- `/` - Login/Register page
- `/preferences` - User preferences page
- `/home` - Home feed with user profiles
- `/profile` - User profile page with CRUD operations

## Key Technologies

### Backend
- Node.js with Express
- MongoDB with Mongoose
- bcryptjs for password hashing
- CORS enabled
- ES Modules

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API calls
- React Hot Toast for notifications

