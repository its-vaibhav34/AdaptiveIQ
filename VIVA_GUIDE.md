# 🎓 AdaptiveIQ Backend - Complete VIVA Guide

**Date**: April 2026  
**Project**: AdaptiveIQ - Real-time Multiplayer Quiz Platform  
**Tech Stack**: Express.js, MongoDB, Socket.IO, React

---

## 📋 Table of Contents

1. [Middleware Lifecycle](#1-middleware-lifecycle)
2. [Body Parser & Blocking Operations](#2-body-parser--blocking-operations)
3. [Sessions & Cookies](#3-sessions--cookies)
4. [Authentication: JWT + Bcrypt](#4-authentication-jwt--bcrypt)
5. [Passport.js Status](#5-passportjs-status)
6. [Databases: MongoDB + Mongoose](#6-databases-mongodb--mongoose)
7. [Socket.IO: Full-Duplex Communication](#7-socketio-full-duplex-communication)
8. [SSR vs CSR](#8-ssr-vs-csr)
9. [JWT + Sessions: Why Both?](#9-why-jwt-and-sessions-together)
10. [Unused Code Cleanup](#10-unused-code-cleanup)

---

## 1. Middleware Lifecycle

### How Request Travels in Express

Every HTTP request follows this path in your application:

```
HTTP Request
    ↓
CORS Middleware (Check origin)
    ↓
Body Parser (Parse JSON/form data) - BLOCKING OPERATION
    ↓
Cookie Parser (Parse cookies into req.cookies)
    ↓
Session Middleware (Load/save session data)
    ↓
Request Logger (Log the request details)
    ↓
Authentication Middleware (Verify JWT token)
    ↓
Route Handler (Your business logic)
    ↓
Error Handler (Catch any errors) - MUST BE LAST
    ↓
HTTP Response
```

### Order Matters ⚠️

**Critical Rule**: Error handler MUST be the last middleware (4 parameters).

**Location**: `backend/app.js` (lines 24-60)

```javascript
export function createApp() {
  const app = express();

  // ═════════════════════════════════════════════════════════════
  // APPLICATION-LEVEL MIDDLEWARE (applied to ALL routes)
  // ═════════════════════════════════════════════════════════════

  // 1. CORS - Allow cross-origin requests
  app.use(corsMiddleware);

  // 2. Body Parsing - Parse request bodies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 3. Cookie Parsing - Convert cookies to req.cookies object
  app.use(cookieParser());

  // 4. Session Management - Persistent sessions with MongoDB
  app.use(createSessionMiddleware());

  // 5. Request Logging - HTTP request logging
  app.use(requestLogger);

  // 6. Authentication - Optional JWT verification
  app.use(authenticate);

  // ═════════════════════════════════════════════════════════════
  // ROUTER-LEVEL MIDDLEWARE (specific to routes)
  // ═════════════════════════════════════════════════════════════
  app.use('/api', apiRouter);

  // ═════════════════════════════════════════════════════════════
  // ERROR HANDLING MIDDLEWARE (MUST come LAST - 4 params)
  // ═════════════════════════════════════════════════════════════
  app.use(notFound);      // 404 handler
  app.use(errorHandler);  // Global error handler

  return app;
}
```

### Three Types of Middleware

| Type | Scope | Example in Your Project |
|------|-------|------------------------|
| **Application-level** | All routes | CORS, body parser, session |
| **Router-level** | Specific routes | Auth middleware on protected routes |
| **Error-handling** | Error catching | `errorHandler` middleware |

**Router-level example** (`backend/routes/auth.routes.js`):
```javascript
router.post('/logout', authenticate, requireAuth, authController.logout);
//                       ↑ router-level middleware applied to this route only
```

---

## 2. Body Parser & Blocking Operations

### What is Body Parser?

Body parser is **middleware that converts the raw HTTP body stream into usable JavaScript objects**.

```javascript
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
```

### Blocking vs Non-Blocking

**Body parsing is BLOCKING** - the request waits until the entire body is read and parsed.

```
Request with 500KB body arrives
    ↓ (BLOCKED - waiting)
Body parser reads entire 500KB from stream
    ↓
Parse JSON/form data
    ↓
Attach req.body to request object
    ↓
next() called - unblocking continues
    ↓
Route handler receives request with req.body ready
```

### Why Set a Limit?

```javascript
app.use(express.json({ limit: '2mb' }));  // ← Protect against DoS attacks
```

Without limit, malicious user could send 1GB body → server crashes.

### Your Project Usage

**POST /api/auth/signup** - Body parsed automatically:
```javascript
// Request body (blocked until parsed):
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "avatar": "avatar-1"
}
// After parsing, available as req.body in controller
```

---

## 3. Sessions & Cookies

### Understanding Cookies

**What**: Small data files stored on CLIENT side  
**Size**: Limited to 4KB  
**Sent**: With every HTTP request to same domain  
**Security**: User can modify (read but not if httpOnly=true)

```
Client Browser                    Server
┌─────────────┐                ┌─────────┐
│ Cookie Jar  │ ←─ Set-Cookie ─┤ Express │
│ sessionId=x │ ─────────────→ │ Server  │
└─────────────┘                └─────────┘
```

### Understanding Sessions

**What**: Server-side data storage  
**Location**: In your case, MongoDB database  
**Session ID**: Small identifier sent as cookie  
**Persistence**: Survives server restarts

```javascript
// backend/config/session.js
export function createSessionMiddleware() {
  return session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      collection: 'sessions',     // ← Stored in MongoDB!
      ttl: 24 * 60 * 60,          // ← Auto-delete after 24 hours
      autoRemove: 'interval',
      autoRemoveInterval: 10,     // ← Check every 10 minutes
    }),
    cookie: {
      httpOnly: true,             // ← JavaScript CANNOT access
      secure: process.env.NODE_ENV === 'production', // ← HTTPS only
      sameSite: 'lax',            // ← CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // ← 24 hour expiry
    },
  });
}
```

### Session Data Flow

```javascript
// User logs in
req.session.userId = user._id;
req.session.username = user.username;

// Behind the scenes:
// 1. Session object serialized → MongoDB
// 2. sessionId generated
// 3. Set-Cookie header: sessionId=abc123 (httpOnly, secure)
// 4. Browser receives cookie
// 5. Every subsequent request includes Cookie: sessionId=abc123
// 6. Server looks up session in MongoDB using sessionId
// 7. req.session populated with user data
```

### Cookie Security Flags

```javascript
httpOnly: true           // Prevents JavaScript access (XSS protection)
secure: true             // HTTPS only (prevents MITM attacks)
sameSite: 'lax'          // CSRF protection
```

---

## 4. Authentication: JWT + Bcrypt

### What is JWT (JSON Web Token)?

**Structure**: `Header.Payload.Signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY1YTFiMmMzZDRlNWY2YTdiOGM5ZDAiLCJpYXQiOjE3MDU0NDAwMDB9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Decoded Payload**:
```json
{
  "id": "65a1b2c3d4e5f6a7b8c9d0",
  "iat": 1705440000,
  "exp": 1708032000
}
```

### JWT vs Sessions

| Aspect | JWT | Sessions |
|--------|-----|----------|
| **Storage** | Client-side | Server-side |
| **Stateless** | Yes (no DB lookup) | No (DB lookup needed) |
| **Scalable** | Better (horizontal) | Harder (share DB) |
| **Token Size** | Larger | Small (just ID) |
| **Your Use** | API/Mobile | Web browser |

### Bcrypt - Secure Password Hashing

**Problem**: Never store plain passwords!

```javascript
// backend/models/User.js
UserSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);  // 10 rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
```

**Why 10 rounds?**
- Each round = 2^rounds iterations
- 10 rounds = 1024 iterations
- Brute-force attack takes exponentially longer
- Slower but secure (0.5 seconds per hash)

**Password Comparison During Login**:
```javascript
UserSchema.methods.matchPassword = async function (plaintextPassword) {
  return bcrypt.compare(plaintextPassword, this.password);
  // bcrypt.compare() does the hashing work, never stores plain text
};
```

### JWT Implementation in Your Project

**Generate Token** (`backend/controllers/authController.js`):
```javascript
function generateToken(userId) {
  return jwt.sign(
    { id: userId },                                    // Payload
    process.env.JWT_SECRET || 'adaptiveiq-secret-key', // Secret key
    { expiresIn: '30d' }                              // Options
  );
}
```

**Verify Token** (`backend/middleware/authMiddleware.js`):
```javascript
export function authenticate(req, res, next) {
  try {
    let token = null;

    // Priority 1: Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove "Bearer " prefix
    }

    // Priority 2: Fallback to cookies
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    // No token - continue (auth is optional at app level)
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach user to request
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('⚠️ Token expired');
    } else if (err.name === 'JsonWebTokenError') {
      console.warn('⚠️ Invalid token');
    }
    req.user = null;
    next();
  }
}
```

**Usage in Protected Routes**:
```javascript
// backend/routes/auth.routes.js
router.post('/logout', authenticate, requireAuth, authController.logout);
//             ↑ Verify token exists (optional)  ↑ Must have user (required)
```

---

## 5. Passport.js Status

### Status: ❌ INSTALLED BUT NOT USED

**Location**: `backend/config/passport.js`

```javascript
// This code EXISTS but is NEVER CALLED in your application
passport.use(
  'jwt',
  new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req) => req?.cookies?.authToken,
    ]),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: false,
  },
  async (jwtPayload, done) => {
    // ... verification logic
  }
);
```

### Why Not Used?

**You implemented a custom JWT middleware instead**:
```javascript
// Custom authenticate middleware is simpler and sufficient
export function authenticate(req, res, next) { ... }
```

### When to Use Passport

Passport is useful when you need:
- Multiple authentication strategies (Google OAuth, Facebook, GitHub, SAML, etc.)
- Social login integration
- Complex enterprise authentication

Since your project only needs JWT, the custom middleware is cleaner.

---

## 6. Databases: MongoDB + Mongoose

### SQL vs NoSQL

| Feature | SQL (PostgreSQL) | NoSQL (MongoDB) |
|---------|---|---|
| **Schema** | Fixed (defined upfront) | Flexible (can change) |
| **Data Structure** | Tables & rows | Collections & documents |
| **Relationships** | Joins across tables | Embedded documents |
| **ACID** | Guaranteed | Eventually consistent |
| **Your Project** | ❌ | ✅ **MongoDB** |

### MongoDB Connection

**Location**: `backend/config/database.js`

```javascript
import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adaptiveiq';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log('🗄️ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed');
    process.exit(1);
  }

  // Auto-reconnect on disconnection
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected — retrying...');
  });
}
```

### Mongoose ODM (Object Document Mapper)

**What**: Bridge between Node.js and MongoDB

**Benefits**:
- Schema validation
- Type casting
- Pre/post hooks
- Virtual fields
- Cleaner syntax than raw MongoDB driver

### User Model Example

**Location**: `backend/models/User.js`

```javascript
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,  // ← Don't return password by default
    },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,  // ← Auto-adds createdAt, updatedAt
    collection: 'users',
  }
);

// Pre-save middleware - hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method - compare passwords
UserSchema.methods.matchPassword = async function (plaintextPassword) {
  return bcrypt.compare(plaintextPassword, this.password);
};

export default mongoose.model('User', UserSchema);
```

### Sample User Document in MongoDB

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6a7b8c9d0"),
  "username": "john_doe",
  "email": "john@example.com",
  "password": "$2a$10$EIXfp2/Z1Hnk2JPQNr8OCe8RQv3g5WrzZwV67TUkr3jCR.mz5vhEe",
  "fullName": "John Doe",
  "avatar": "avatar-5",
  "role": "player",
  "isActive": true,
  "lastLogin": ISODate("2024-01-15T10:30:00Z"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z"),
  "__v": 0
}
```

---

## 7. Socket.IO: Full-Duplex Communication

### What is Full-Duplex?

**Full-Duplex** = Simultaneous bidirectional communication

```
Client ←→ Server (at the same time)
```

### HTTP vs WebSocket

| HTTP | WebSocket (Socket.IO) |
|-----|---|
| Request-Response model | Persistent connection |
| Unidirectional (client initiates) | Bidirectional |
| Polling needed for updates | Real-time push |
| Stateless | Stateful connection |

### Your Game Implementation

**Location**: `backend/socket/gameHandlers.js`

**Flow Diagram**:
```
Player 1: 'join_room' ──────────────→ Server
                              Server processes
                         Broadcasts to all players
Player 1,2,3: 'room_update' ←────────── Server
                              (instant update)
```

**Code Example**:
```javascript
export function registerGameHandlers(io, socket) {
  // Server listens for client event
  socket.on('join_room', ({ roomCode, player }) => {
    if (!roomCode || !player?.id) return;

    socket.join(roomCode);  // ← Add socket to room

    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, createRoom(roomCode));
    }

    const room = rooms.get(roomCode);
    const existing = room.players.find((p) => p.id === player.id);

    if (existing) {
      existing.socketId = socket.id;  // ← Reconnect support
    } else {
      room.players.push({ ...player, socketId: socket.id, score: 0, isReady: false });
    }

    // Broadcast to all players in this room
    io.to(roomCode).emit('room_update', room);
    console.log(`📥 ${player.username} joined room ${roomCode}`);
  });

  // Start game
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.status = 'starting';
    room.currentQuestionIndex = 0;
    room.players.forEach((p) => {
      p.score = 0;
      p.lastAnswerCorrect = undefined;
    });

    // Broadcast to all players
    io.to(roomCode).emit('room_update', room);

    // 3-second countdown
    setTimeout(() => {
      io.to(roomCode).emit('show_question', room.currentQuiz.questions[0]);
    }, 3000);
  });
}
```

### Events Available

```javascript
// Emit to specific socket
socket.emit('event', data);

// Broadcast to specific room
io.to(roomCode).emit('event', data);

// Broadcast to all connected clients
io.emit('event', data);

// Emit to all except sender
socket.broadcast.emit('event', data);
```

---

## 8. SSR vs CSR

### CSR (Client-Side Rendering) ✅ YOUR PROJECT

**Process**:
```
1. Browser requests HTML
2. Server sends: <div id="root"></div>
3. Browser downloads React bundle (JavaScript)
4. React renders components in browser
5. JavaScript makes API calls as needed
```

**Your Stack**:
- Vite as development server & bundler
- React as UI framework
- API calls via fetch/axios
- Real-time updates via Socket.IO

**Benefits**:
- Fast subsequent page loads (cached JS)
- Rich, interactive UI
- Better user experience
- Easier scaling (no server rendering overhead)

**Location**: `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
      },
    },
  },
});
```

### SSR (Server-Side Rendering) ❌ NOT YOUR PROJECT

**Process**:
```
1. Browser requests URL
2. Server renders HTML directly
3. Server sends complete HTML
4. Browser displays HTML
```

**Template Engines** (not used):
- **EJS**: `<%= user.name %>`
- **HBS/Handlebars**: `{{user.name}}`
- **Pug**: `p #{user.name}`

### When to Use SSR

- SEO-critical content (Google indexing)
- Fast First Contentful Paint (FCP)
- Server-side logic requires confidentiality
- Reducing client-side JavaScript

**Your project doesn't need SSR because**:
1. Real-time multiplayer needs client state
2. React is fast enough for interactive UI
3. API + WebSocket handles all communication
4. SEO not critical for gaming platform

---

## 9. Why JWT and Sessions Together?

### ✅ YES, You're Using Both!

Your application uses **both JWT AND Express-Sessions**.

### JWT vs Sessions: Different Purposes

| Purpose | JWT | Session |
|---------|-----|---------|
| **Stateless API calls** | ✅ Primary | ❌ Not for APIs |
| **Browser sessions** | ❌ Not ideal | ✅ Better |
| **Mobile apps** | ✅ Preferred | ❌ Not suitable |
| **Persistent user state** | ❌ Needs refresh | ✅ Automatic |
| **Microservices** | ✅ No central DB needed | ❌ Shared DB needed |

### How Your Project Uses Both

**JWT** - For API calls:
```javascript
// Frontend sends JWT in Authorization header
fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});

// Backend verifies JWT
authenticate middleware → req.user populated
```

**Sessions** - For web browser persistence:
```javascript
// Session created during login
req.session.userId = user._id;

// Automatically sent as sessionId cookie
// Browser sends cookie with every request
// Server looks up session in MongoDB
// User state persists across page refreshes
```

### Decision Tree

```
Is this a...?

├─ Browser request with sessionId cookie?
│  └─ Use Sessions (automatic with Express-Session)
│
├─ Mobile app request with Authorization header?
│  └─ Use JWT (stateless, no session storage needed)
│
├─ Third-party API integration?
│  └─ Use JWT (standard for APIs)
│
└─ WebSocket connection?
   └─ Can use either (your project uses JWT for simplicity)
```

### Why Both is Smart

```javascript
// backend/middleware/authMiddleware.js
export function authenticate(req, res, next) {
  // Try Authorization header first (JWT)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Fallback to cookies (Session)
  if (!token && req.cookies?.authToken) {
    token = req.cookies.authToken;
  }

  // Support both authentication methods
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
}
```

**Advantages**:
- Browser users get session persistence
- API clients get stateless JWT
- Mobile apps work with JWT
- Microservices can verify JWT independently

---

## 10. Unused Code Cleanup

### What Was Removed

#### 1. ❌ Passport.js Configuration
**File**: `backend/config/passport.js`  
**Status**: DELETED  
**Reason**: Never used. Custom JWT middleware is simpler.

#### 2. ❌ Validation Middleware Functions
**File**: `backend/middleware/validationMiddleware.js`  
**Status**: DELETED  
**Reason**: Functions defined but never imported/used in any route.

#### 3. ❌ Unused NPM Packages (Frontend)
**Removed from** `package.json`:
- `react-markdown` - No markdown rendering used
- `motion` - Animation library not implemented

### Summary Table

| Code | Status | Reason |
|------|--------|--------|
| `passport.js` | ❌ Removed | Never called |
| `validationMiddleware.js` | ❌ Removed | Dead code |
| `react-markdown` | ❌ Removed | Unused dependency |
| `motion` | ❌ Removed | Unused dependency |
| `app.js` middleware | ✅ Kept | Active |
| `authMiddleware.js` | ✅ Kept | Core auth |
| `errorHandler.js` | ✅ Kept | Active |
| `session.js` | ✅ Kept | Active |
| All models (User, Quiz, GameSession) | ✅ Kept | Active |
| `socket/gameHandlers.js` | ✅ Kept | Active |

### Codebase Quality

After cleanup:
- ✅ No dead code
- ✅ No unused dependencies
- ✅ Clear middleware chain
- ✅ Professional structure
- ✅ Easier to maintain

---

## 🎓 Quick VIVA Reference

### Q: How does request travel in Express?

**A**: Request → CORS → Body Parsers → Cookies → Session → Logger → Auth → Routes → Error Handler

### Q: Are you using JWT and Sessions both? Why?

**A**: Yes, for different purposes:
- **Sessions**: Browser persistence, automatic user state
- **JWT**: Stateless API calls, mobile apps, microservices
- **Fallback**: Authentication middleware checks JWT first, then session

### Q: Why Bcrypt instead of simple hash()?

**A**: Bcrypt is slow by design (10 rounds). Each round exponentially increases brute-force attack time. Simple hash() is instant, making dictionary attacks feasible.

### Q: Why Socket.IO instead of HTTP?

**A**: Real-time multiplayer needs instant bi-directional updates. Socket.IO maintains persistent connection. HTTP would require constant polling.

### Q: What is ODM?

**A**: Mongoose is an Object Document Mapper. It adds schema validation, type casting, pre/post hooks, and virtual fields on top of MongoDB driver.

### Q: Middleware execution order importance?

**A**: Critical. Must put error handler last (4 parameters). Body parser before routes. Session before auth. Wrong order breaks functionality.

### Q: What's the difference between routing and routing middleware?

**A**: 
- **Routing**: `app.use('/api', router)` - mount routes
- **Route middleware**: `router.post('/path', middleware, handler)` - execute before handler

### Q: How does session persist?

**A**: With MongoDB store. Session data serialized to DB. SessionId sent as httpOnly cookie. On next request, server looks up session in DB using sessionId.

---

## 📚 Additional Resources

### Installation
```bash
# Backend
npm install express mongoose bcryptjs jsonwebtoken socket.io express-session connect-mongo cors cookie-parser

# Frontend
npm install react socket.io-client
```

### Environment Variables
```env
# Backend
MONGODB_URI=mongodb://127.0.0.1:27017/adaptiveiq
JWT_SECRET=your-super-secret-key
SESSION_SECRET=your-session-secret
NODE_ENV=development
PORT=5001

# Frontend
VITE_API_URL=http://localhost:5001
```

### Running the Project
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
npm install
npm run dev
```

---

**Last Updated**: April 2026  
**Version**: 2.0 (Production Ready)
