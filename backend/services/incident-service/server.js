const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';
const REGISTRY_URL = 'http://localhost:8761';

app.use(cors({ origin: '*' }));
app.use(express.json());

const dbPath = path.join(__dirname, '../../gestinc.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    description TEXT,
    statut TEXT DEFAULT 'nouveau',
    priorite TEXT DEFAULT 'moyenne',
    categorie TEXT,
    localisation TEXT,
    utilisateur_id INTEGER,
    assigne_a INTEGER,
    date_creation TEXT DEFAULT (datetime('now')),
    date_mise_a_jour TEXT DEFAULT (datetime('now')),
    date_resolution TEXT
  );
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

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'technicien')
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  next();
}

app.get('/api/incidents/mine', auth, (req, res) => {
  const incidents = db.prepare(
    'SELECT * FROM incidents WHERE utilisateur_id = ? ORDER BY date_creation DESC'
  ).all(req.user.id);
  res.json(incidents);
});

app.get('/api/incidents', auth, (req, res) => {
  let query = "SELECT i.*, u.prenom || ' ' || u.nom as utilisateur FROM incidents i LEFT JOIN users u ON i.utilisateur_id = u.id";
  const conditions = [];
  if (req.user.role === 'user') conditions.push(`i.utilisateur_id = ${req.user.id}`);
  if (req.query.statut) conditions.push(`i.statut = '${req.query.statut}'`);
  if (req.query.priorite) conditions.push(`i.priorite = '${req.query.priorite}'`);
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY i.date_creation DESC';
  res.json(db.prepare(query).all());
});

app.get('/api/incidents/:id', auth, (req, res) => {
  const incident = db.prepare(
    "SELECT i.*, u.prenom || ' ' || u.nom as utilisateur FROM incidents i LEFT JOIN users u ON i.utilisateur_id = u.id WHERE i.id = ?"
  ).get(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident non trouvé' });
  res.json(incident);
});

app.post('/api/incidents', auth, (req, res) => {
  const { titre, description, priorite, categorie, localisation } = req.body;
  if (!titre) return res.status(400).json({ message: 'Le titre est obligatoire.' });
  const result = db.prepare(
    'INSERT INTO incidents (titre, description, priorite, categorie, localisation, utilisateur_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(titre, description || null, priorite || 'moyenne', categorie || null, localisation || null, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/incidents/:id', auth, (req, res) => {
  const { titre, description, statut, priorite, categorie, assigne_a } = req.body;
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident non trouvé' });
  db.prepare(`
    UPDATE incidents SET
      titre = COALESCE(?, titre),
      description = COALESCE(?, description),
      statut = COALESCE(?, statut),
      priorite = COALESCE(?, priorite),
      categorie = COALESCE(?, categorie),
      assigne_a = COALESCE(?, assigne_a),
      date_mise_a_jour = datetime('now')
    WHERE id = ?
  `).run(titre || null, description || null, statut || null, priorite || null, categorie || null, assigne_a || null, req.params.id);
  res.json(db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id));
});

app.delete('/api/incidents/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
  res.json({ message: 'Incident supprimé' });
});

app.get('/api/incidents/:id/comments', auth, (req, res) => {
  const comments = db.prepare(
    "SELECT c.*, u.prenom || ' ' || u.nom as auteur FROM comments c JOIN users u ON c.utilisateur_id = u.id WHERE c.incident_id = ? ORDER BY c.date_creation ASC"
  ).all(req.params.id);
  res.json(comments);
});

app.post('/api/incidents/:id/comments', auth, (req, res) => {
  const { texte } = req.body;
  if (!texte) return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
  const result = db.prepare(
    'INSERT INTO comments (incident_id, utilisateur_id, texte) VALUES (?, ?, ?)'
  ).run(req.params.id, req.user.id, texte);
  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid));
});

app.get('/api/incidents/health', (req, res) => res.json({ status: 'UP', service: 'incident-service', port: PORT }));

async function register() {
  try {
    await axios.post(`${REGISTRY_URL}/eureka/apps/INCIDENT-SERVICE`, {
      instance: { instanceId: `incident-service:${PORT}`, app: 'INCIDENT-SERVICE', hostName: 'localhost', port: PORT, status: 'UP' }
    });
    console.log('✅ [Incident] Enregistré dans le Registry');
  } catch { console.warn('[Incident] Registry non disponible'); }
}

async function heartbeat() {
  try { await axios.put(`${REGISTRY_URL}/eureka/apps/INCIDENT-SERVICE/incident-service:${PORT}`); } catch {}
}

app.listen(PORT, async () => {
  console.log(`📋 Incident Service démarré sur http://localhost:${PORT}`);
  await register();
  setInterval(heartbeat, 30000);
});
