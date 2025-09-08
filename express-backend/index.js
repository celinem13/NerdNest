import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

// env
const PORT = Number(process.env.PORT) || 5174;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI;

// middleware
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// simple health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Minimal Mongo models & routes (Profiles / Posts / Events) ---

// Profile
const ProfileSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  bio: String,
  interests: { type: [String], default: [] },
  neighborhood: String,
  contact: String
}, { timestamps: true });
const Profile = mongoose.model('Profile', ProfileSchema);

app.get('/api/profiles', async (_req, res) => {
  const list = await Profile.find().sort({ createdAt: -1 }).limit(100);
  res.json(list);
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

app.get('/api/posts', async (_req, res) => {
  const list = await Post.find().sort({ createdAt: -1 }).limit(100);
  res.json(list);
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

app.get('/api/events', async (_req, res) => {
  const list = await Event.find().sort({ when: 1 }).limit(100);
  res.json(list);
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
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// connect + start
(async () => {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  } catch (e) {
    console.error('Failed to start server:', e.message);
    process.exit(1);
  }
})();
