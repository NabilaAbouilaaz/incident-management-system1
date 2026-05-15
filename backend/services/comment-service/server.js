const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';
const REGISTRY_URL = 'http://localhost:8761';

app.use(cors({ origin: '*' }));
app.use(express.json());

const dbPath = path.join(__dirname, '../../gestinc.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    texte TEXT NOT NULL,
    date_creation TEXT DEFAULT (datetime('now'))
  );
`);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
}

// GET /api/incidents/:id/comments
app.get('/api/incidents/:id/comments', auth, (req, res) => {
  const comments = db.prepare(
    "SELECT c.*, u.prenom || ' ' || u.nom as auteur FROM comments c JOIN users u ON c.utilisateur_id = u.id WHERE c.incident_id = ? ORDER BY c.date_creation ASC"
  ).all(req.params.id);
  res.json(comments);
});

// POST /api/incidents/:id/comments
app.post('/api/incidents/:id/comments', auth, (req, res) => {
  const { texte } = req.body;
  if (!texte) return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
  const result = db.prepare(
    'INSERT INTO comments (incident_id, utilisateur_id, texte) VALUES (?, ?, ?)'
  ).run(req.params.id, req.user.id, texte);
  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid));
});

app.get('/api/comments/health', (req, res) => res.json({ status: 'UP', service: 'comment-service', port: PORT }));

async function register() {
  try {
    await axios.post(`${REGISTRY_URL}/eureka/apps/COMMENT-SERVICE`, {
      instance: { instanceId: `comment-service:${PORT}`, app: 'COMMENT-SERVICE', hostName: 'localhost', port: PORT, status: 'UP' }
    });
    console.log('✅ [Comment] Enregistré dans le Registry');
  } catch { console.warn('[Comment] Registry non disponible'); }
}

async function heartbeat() {
  try { await axios.put(`${REGISTRY_URL}/eureka/apps/COMMENT-SERVICE/comment-service:${PORT}`); } catch {}
}

app.listen(PORT, async () => {
  console.log(`💬 Comment Service démarré sur http://localhost:${PORT}`);
  await register();
  setInterval(heartbeat, 30000);
});
