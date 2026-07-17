import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// env
const PORT = Number(process.env.PORT) || 5174;
const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
/* 
dotenv = reads the .env file → turns lines like PORT=5174 into process.env.PORT.

express = the kitchen. It handles HTTP requests (GET, POST).

cors = a doorman. Only lets requests in from approved origins (like your frontend URL).

mongoose = a translator between JavaScript objects and MongoDB documents.

app = your server instance.

PORT = the port where my app is open.

ORIGIN = who’s allowed to send requests (React app on port 5173).

MONGODB_URI = your pantry address (Atlas connection string).
*/

// middleware
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

/* 
cors(...) = checks if the request is allowed (based on ORIGIN).

express.json() = read req.body when JSON data is sent.
*/

// simple health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Minimal Mongo models & routes (Profiles / Posts / Events) ---

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", UserSchema);


function createToken(user) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in .env");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username
    },
    JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
}

function authenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;
  const [scheme, token] = authorizationHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Authentication token is required"
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}


app.post("/api/auth/register", async (req, res, next) => {
  try {
    const {
      username: rawUsername,
      email: rawEmail,
      password
    } = req.body ?? {};

    if (
      typeof rawUsername !== "string" ||
      typeof rawEmail !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Username, email, and password must be text"
      });
    }

    const username = rawUsername.trim().toLowerCase();
    const email = rawEmail.trim().toLowerCase();

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required"
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        error: "Username must be between 3 and 30 characters"
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        error: "Enter a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }
    
    if (bcrypt.truncates(password)) {
      return res.status(400).json({
        error: "Password is too long"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Username or email is already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      passwordHash
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const {
      identifier: rawIdentifier,
      password
    } = req.body ?? {};

    if (
      typeof rawIdentifier !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Username or email and password must be text"
      });
    }

    const identifier = rawIdentifier.trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Username or email and password are required"
      });
    }

    if (bcrypt.truncates(password)) {
      return res.status(400).json({
        error: "Password is too long"
      });
    }

    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid username, email, or password"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid username, email, or password"
      });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Profile
const ProfileSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  bio: String,
  interests: { type: [String], default: [] },
  neighborhood: String,
  contact: String
}, { timestamps: true });
const Profile = mongoose.model('Profile', ProfileSchema);

app.get("/api/profiles", async (_req, res, next) => {
  try {
    const list = await Profile.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

app.post('/api/profiles', async (req, res, next) => {
  try {
    const p = await Profile.create(req.body);
    res.status(201).json(p);
  } catch (e) { next(e); }
});

// Post
const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  title: { type: String, required: true },
  body: String,
  tags: { type: [String], default: [] }
}, { timestamps: true });
const Post = mongoose.model('Post', PostSchema);

app.get("/api/posts", async (_req, res, next) => {
  try {
    const list = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

app.post('/api/posts', async (req, res, next) => {
  try {
    const p = await Post.create(req.body);
    res.status(201).json(p);
  } catch (e) { next(e); }
});

// Event
const EventSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  when: { type: Date, required: true },
  venue: { type: String, required: true },
  description: String,
  attendees: { type: [mongoose.Schema.Types.ObjectId], ref: 'Profile', default: [] }
}, { timestamps: true });
const Event = mongoose.model('Event', EventSchema);

app.get("/api/events", async (_req, res, next) => {
  try {
    const list = await Event.find()
      .sort({ when: 1 })
      .limit(100);

    return res.json(list);
  } catch (error) {
    next(error);
  }
});

app.post('/api/events', async (req, res, next) => {
  try {
    const e = await Event.create(req.body);
    res.status(201).json(e);
  } catch (err) { next(err); }
});

app.post('/api/events/:id/rsvp', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { profileId } = req.body;
    const updated = await Event.findByIdAndUpdate(
      id,
      { $addToSet: { attendees: profileId } },
      { new: true }
    );
    res.json(updated);
  } catch (err) { next(err); }
});

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);

  if (err?.code === 11000) {
    return res.status(409).json({
      error: "Username or email is already registered"
    });
  }

  return res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

// connect + start
(async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();
