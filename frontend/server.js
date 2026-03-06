import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.APP_PASSWORD || 'changeme';

// Middleware to parse JSON
app.use(express.json());

// Session tracking using a simple in-memory store (for production, use Redis or similar)
const sessions = new Set();

// Check auth middleware
const checkAuth = (req, res, next) => {
  const sessionToken = req.headers['x-session-token'];
  if (sessions.has(sessionToken)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Serve static files WITHOUT auth (needed for login page to load)
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));

// Serve other static files (images, etc.) from dist root
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html without auth (it will handle the login UI)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Password protection is ${PASSWORD === 'changeme' ? 'using default password (CHANGE THIS!)' : 'enabled'}`);
});
