# 👨‍🏫 JWT & Session Flow - Viva Demo Guide

**How to Show Teacher: Files to Show + Live Demonstration**

---

## 📂 Flow Diagram - Files to Show in Order

```
User Login Request
        ↓
    (SHOW FILE #1)
    routes/auth.routes.js
    ├─ POST /api/auth/login
        ↓
    (SHOW FILE #2)
    controllers/authController.js
    ├─ signup(), login()
    ├─ Generate JWT Token
    ├─ Hash Password with Bcrypt
        ↓
    (SHOW FILE #3)
    models/User.js
    ├─ UserSchema (Database structure)
    ├─ Password hashing pre-hook
        ↓
    (SHOW FILE #4)
    config/database.js
    ├─ MongoDB Connection
        ↓
    (SHOW FILE #5)
    config/session.js
    ├─ Express-Session Config
    ├─ MongoDB Store
        ↓
    (SHOW FILE #6)
    middleware/authMiddleware.js
    ├─ JWT Verification
    ├─ Session Check
        ↓
    (SHOW FILE #7)
    app.js
    ├─ Middleware Order
        ↓
    Protected Route Request
        ↓
    Response with JWT Token + Session Cookie
```

---

## 📋 FILES TO SHOW TEACHER (In Sequence)

### **FILE #1: `backend/routes/auth.routes.js`**

**What to Show:**
```javascript
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authenticate, requireAuth, authController.logout);
router.get('/me', authenticate, requireAuth, authController.getCurrentUser);
```

**Teacher को बताओ:**
> "Sir/Maam, यह रूट्स फाइल है जहाँ सभी authentication endpoints हैं।
> Login route को `authenticate` middleware मिलता है जो JWT verify करता है।"

---

### **FILE #2: `backend/controllers/authController.js`**

**Key Parts to Show:**

#### Part A - Token Generation
```javascript
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'adaptiveiq-secret-key',
    { expiresIn: '30d' }
  );
}
```

#### Part B - Login Controller
```javascript
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    // Compare password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = generateToken(user._id);

    // Set Session
    req.session.userId = user._id;
    req.session.username = user.username;

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}
```

**Teacher को बताओ:**
> "Sir, यहाँ हम:
> 1. Password को Bcrypt से compare करते हैं (secure)
> 2. JWT Token generate करते हैं (30 दिन के लिए valid)
> 3. Session में user ID store करते हैं (database में save होता है)"

---

### **FILE #3: `backend/models/User.js`**

**Key Parts to Show:**

#### Part A - Schema with Validation
```javascript
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,  // ← Don't return password by default
  },
  // ... other fields
});
```

#### Part B - Password Hashing Pre-Hook
```javascript
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

#### Part C - Password Comparison Method
```javascript
UserSchema.methods.matchPassword = async function (plaintextPassword) {
  return bcrypt.compare(plaintextPassword, this.password);
};
```

**Teacher को बताओ:**
> "Sir, Mongoose pre-hook से पहले से ही password hash हो जाता है।
> Bcrypt से हम plain password को hashed password से compare करते हैं।
> Bcrypt slow है (10 rounds), इसलिए brute force attack से सुरक्षित है।"

---

### **FILE #4: `backend/config/database.js`**

**What to Show:**
```javascript
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
}
```

**Teacher को बताओ:**
> "Sir, यह MongoDB से connection करता है।
> जब user login करता है, तो यहीं से database connection use होता है।"

---

### **FILE #5: `backend/config/session.js`**

**What to Show:**
```javascript
export function createSessionMiddleware() {
  return session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || 'adaptiveiq-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      collection: 'sessions',
      ttl: 24 * 60 * 60,  // 24 hours
      autoRemove: 'interval',
      autoRemoveInterval: 10,
    }),
    cookie: {
      httpOnly: true,  // ← JavaScript नहीं access कर सकता
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
```

**Teacher को बताओ:**
> "Sir, यह Express-Session का configuration है।
> - sessionId cookie browser को मिलता है (httpOnly से secure)
> - सभी session data MongoDB में store होता है
> - 24 घंटे बाद automatically expire हो जाता है
> - तुम्हारे case में sessions 'sessions' collection में save होते हैं"

---

### **FILE #6: `backend/middleware/authMiddleware.js`**

**What to Show:**
```javascript
export function authenticate(req, res, next) {
  try {
    let token = null;

    // Priority 1: Authorization Header से JWT लो
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // Priority 2: Cookie से JWT लो
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    // No token found
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('⚠️ Token expired');
    }
    req.user = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
```

**Teacher को बताओ:**
> "Sir, यह middleware दोनों को support करता है:
> 1. Authorization header से JWT token लो (mobile apps के लिए)
> 2. Cookies से token लो (browsers के लिए)
> 
> Token को verify करते हैं - agar valid है तो req.user में data attach होता है।
> अगर invalid है तो error throw नहीं करते, बस next() call करते हैं।"

---

### **FILE #7: `backend/app.js`**

**What to Show:**
```javascript
export function createApp() {
  const app = express();

  // Middleware ORDER MATTERS!
  app.use(corsMiddleware);                    // 1
  app.use(express.json());                    // 2
  app.use(cookieParser());                    // 3
  app.use(createSessionMiddleware());         // 4 - Session setup
  app.use(requestLogger);                     // 5
  app.use(authenticate);                      // 6 - JWT verification
  
  app.use('/api', apiRouter);                 // 7 - Routes
  
  app.use(notFound);                          // 8
  app.use(errorHandler);                      // 9 - MUST be last

  return app;
}
```

**Teacher को बताओ:**
> "Sir, middleware का order बहुत important है।
> - पहले body parser करते हैं (ताकि req.body तैयार हो)
> - फिर session middleware (ताकि req.session available हो)
> - फिर authentication middleware (ताकि req.user set हो जाए)
> - Finally error handler को last में रखते हैं"

---

## 🎮 LIVE DEMONSTRATION - How to Show Working

### **Demo Setup:**

```bash
# Terminal 1 - Start MongoDB
mongod

# Terminal 2 - Start Backend
cd backend
npm run dev

# Terminal 3 - Browser or Postman
```

---

## 🔴 DEMO STEP 1: Signup (Create User)

**Use Postman or Browser Console:**

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viva_user",
    "email": "viva@test.com",
    "password": "Test123456",
    "fullName": "Viva Demo"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTFiMmMzZDRlNWY2YTdiOGM5ZDAiLCJpYXQiOjE3MDU0NDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": "65a1b2c3d4e5f6a7b8c9d0",
    "username": "viva_user",
    "email": "viva@test.com",
    "fullName": "Viva Demo"
  }
}
```

**Teacher को point करो:**
> "देखो! JWT token मिल गया। यह 30 दिन के लिए valid है।"

---

## 🟡 DEMO STEP 2: Login (Get Session + JWT)

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "viva@test.com",
    "password": "Test123456"
  }'
```

**Terminal Output को दिखाओ:**
```
✅ viva_user@test.com logged in (session created)
🔌 Session stored in MongoDB: sessions collection
```

**Browser DevTools में Check करो:**

1. **DevTools खोलो** (F12)
2. **Network Tab** → **Cookies** 
3. **देखो**: `sessionId=xyz123` cookie set हुआ!

```
Name: sessionId
Value: xyz123abc456...
Domain: localhost
Path: /
HttpOnly: ✓ (checked)
Secure: ✗ (development mode में)
SameSite: Lax
```

**Teacher को बताओ:**
> "देखो! Session cookie browser में store हो गया।
> HttpOnly flag से JavaScript access नहीं कर सकता (secure!)।
> यह cookie automatically हर request के साथ भेजा जाएगा।"

---

## 🟢 DEMO STEP 3: Protected Route (JWT Verification)

**Browser DevTools में Network Tab खोले रखो:**

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer eyJhbGc..." \
  -b cookies.txt
```

**या Browser Console में:**
```javascript
fetch('/api/auth/me')
  .then(r => r.json())
  .then(console.log)
```

**Response मिलेगा:**
```json
{
  "id": "65a1b2c3d4e5f6a7b8c9d0",
  "username": "viva_user",
  "email": "viva@test.com"
}
```

**Backend Terminal में Log दिखाओ:**
```
✅ GET    /api/auth/me                           200  45ms
(authenticate middleware executed)
(JWT verified)
(session loaded from MongoDB)
```

**Teacher को बताओ:**
> "देखो! दोनों काम कर रहे हैं:
> 1. JWT token verify हुआ (valid)
> 2. Session cookie से user data loaded (database से)
> दोनों methods काम करते हैं!"

---

## 🔵 DEMO STEP 4: Database को Check करो

**MongoDB में Check करो:**

```bash
# Start MongoDB shell
mongosh

# Switch to database
use adaptiveiq

# Check users collection
db.users.findOne({ email: "viva@test.com" })
```

**Output:**
```json
{
  "_id": ObjectId("65a1b2c3d4e5f6a7b8c9d0"),
  "username": "viva_user",
  "email": "viva@test.com",
  "password": "$2a$10$EIXfp2/Z1Hnk2JPQNr8OCe8RQv3g5WrzZwV67TUkr3jCR.mz5vhEe",
  // ↑ Password हashed है!
  "fullName": "Viva Demo",
  "createdAt": ISODate("2024-01-15T10:00:00Z")
}
```

**Check Sessions Collection:**
```javascript
db.sessions.find()
```

**Output:**
```json
{
  "_id": "xyz123abc456",
  "expires": ISODate("2024-01-16T10:30:00Z"),
  "data": {
    "userId": "65a1b2c3d4e5f6a7b8c9d0",
    "username": "viva_user"
  }
}
```

**Teacher को बताओ:**
> "देखो! दोनों collections में data है:
> 1. **users**: Password bcrypt से hashed है
> 2. **sessions**: Session data 24 घंटे के लिए store है"

---

## 📊 DEMO STEP 5: Socket.IO Real-time Demo

**open Game से connect करो:**

```javascript
// Browser Console में
const socket = io('http://localhost:5001');

socket.on('connection_success', (data) => {
  console.log('Connected:', data);
});

socket.emit('join_room', {
  roomCode: 'DEMO123',
  player: {
    id: '65a1b2c3d4e5f6a7b8c9d0',
    username: 'viva_user',
    avatar: 'avatar-1'
  }
});

socket.on('room_update', (room) => {
  console.log('Room Updated:', room);
});
```

**Backend Terminal Output:**
```
🔌 Connected: socket_id_123 | Total: 1
🏠 Room created: DEMO123
📥 viva_user joined room DEMO123 (1 players)
```

**Teacher को बताओ:**
> "देखो! Real-time bidirectional communication Socket.IO से हो रहा है।
> User authentication (JWT/Session) के साथ game room में join हुआ।"

---

## 🎓 FULL FLOW EXPLANATION (Teacher को दो)

```
User Browser
    ↓
"Login करता हूँ"
    ↓
POST /api/auth/login
    ↓
authController.login() 
    ├─ Password Bcrypt से compare
    ├─ JWT Token generate करो
    └─ Session database में save करो
    ↓
Response भेज: 
    ├─ JWT Token
    └─ Set-Cookie: sessionId=xyz
    ↓
Browser:
    ├─ Token localStorage में save करो
    └─ Cookie automatically save करो
    ↓
अगली Request /api/auth/me
    ├─ Cookie भेजो (automatically)
    └─ या Authorization header में JWT
    ↓
authenticate middleware
    ├─ JWT verify करो
    ├─ या session database में check करो
    └─ req.user populate करो
    ↓
requireAuth middleware
    ├─ req.user है?
    └─ हाँ → आगे बढ़ो
    ↓
Route handler execute हो
    └─ user data मिल जाता है
    ↓
✅ Request successful!
```

---

## ✅ Checklist - Teacher को दिखाने के लिए

- [ ] [FILE #1] routes/auth.routes.js → endpoints दिखाओ
- [ ] [FILE #2] authController.js → JWT generate + Bcrypt compare
- [ ] [FILE #3] User.js → Bcrypt pre-hook + password hashing
- [ ] [FILE #4] database.js → MongoDB connection
- [ ] [FILE #5] session.js → Session configuration
- [ ] [FILE #6] authMiddleware.js → JWT verification logic
- [ ] [FILE #7] app.js → Middleware order
- [ ] **LIVE DEMO:** Postman से signup/login करो
- [ ] **BROWSER DevTools:** Cookies में sessionId दिखाओ
- [ ] **BACKEND LOGS:** "Token verified" log दिखाओ
- [ ] **DATABASE:** MongoDB में user + session data दिखाओ
- [ ] **Socket.IO:** Real-time game connection दिखाओ

---

## 💬 Sample Viva Answers

**Q: JWT और Session दोनों को कहाँ आप use करते हो?**

A: "तीन जगहों पर:
1. **authController.js** में - token generate करते हैं
2. **session.js** में - session middleware configure करते हैं  
3. **authMiddleware.js** में - दोनों verify करते हैं"

**Q: Password सुरक्षित है?**

A: "जी sir! **User.js** में bcrypt pre-hook है जो password को hash करता है। 
10 rounds से हashing होती है, इसलिए brute force attack से safe है।"

**Q: क्या database को check कर सकते हो?**

A: "जी! **MongoDB** में users collection में password bcrypt से hashed है।
Sessions collection में 24 घंटे के लिए session data store है।"

**Q: Flow कैसे काम करता है?**

A: "Browser request → authMiddleware में JWT verify → req.user populate → 
Route handler को user data मिल जाता है।
MongoDB से हर बार check नहीं करते, JWT में ही data है।"

---

**Good Luck! 🚀 यह demo देने से teacher को सब कुछ clear हो जाएगा!**
