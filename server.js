const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (_, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /image|video/.test(file.mimetype);
    cb(allowed ? null : new Error('Only image or video files are allowed.'), allowed);
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

function readSettings() {
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeSettings(next) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
}

function requireAuth(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/public-settings', (_, res) => {
  return res.json(readSettings());
});

app.post('/api/login', (req, res) => {
  const submittedPassword = req.body.password;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validPassword) {
    return res.status(500).json({ error: 'Server password is not configured.' });
  }

  if (submittedPassword === validPassword) {
    req.session.isAuthenticated = true;
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/settings', requireAuth, (_, res) => {
  res.json(readSettings());
});

app.post('/api/settings', requireAuth, (req, res) => {
  const current = readSettings();
  const { profile, avatarUrl, verified, socialLinks, backgroundMedia, toggles, music } = req.body;

  const next = {
    ...current,
    profile: {
      ...current.profile,
      ...(profile || {})
    },
    avatarUrl: avatarUrl || current.avatarUrl,
    verified: typeof verified === 'boolean' ? verified : current.verified,
    socialLinks: Array.isArray(socialLinks) ? socialLinks : current.socialLinks,
    backgroundMedia: {
      ...current.backgroundMedia,
      ...(backgroundMedia || {})
    },
    toggles: {
      ...current.toggles,
      ...(toggles || {})
    },
    music: {
      ...current.music,
      ...(music || {})
    }
  };

  writeSettings(next);
  res.json({ ok: true, settings: next });
});

app.post('/api/upload-background', requireAuth, upload.single('backgroundFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  const mediaPath = `/uploads/${req.file.filename}`;

  const current = readSettings();
  const next = {
    ...current,
    backgroundMedia: {
      type: mediaType,
      url: mediaPath
    }
  };

  writeSettings(next);
  res.json({ ok: true, backgroundMedia: next.backgroundMedia });
});

app.get('/login', (_, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.get('/studio', (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/login');
  }
  return res.sendFile(path.join(__dirname, 'public', 'studio.html'));
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
