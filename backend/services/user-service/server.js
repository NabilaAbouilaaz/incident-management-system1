const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const path = require('path');
const { startEurekaClient } = require('../../eureka-client');

const app = express();
const PORT = 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

const dbPath = path.join(__dirname, '../../gestinc.db');
const db = new Database(dbPath);

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

app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = db.prepare(
    'SELECT id, prenom, nom, email, role, departement, poste, date_creation FROM users ORDER BY date_creation DESC'
  ).all();
  res.json(users);
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const { role, departement, poste } = req.body;
  db.prepare('UPDATE users SET role = COALESCE(?, role), departement = COALESCE(?, departement), poste = COALESCE(?, poste) WHERE id = ?')
    .run(role || null, departement || null, poste || null, req.params.id);
  res.json({ message: 'Utilisateur mis à jour' });
});

app.get('/api/stats', auth, adminOnly, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
  const nouveau = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut = 'nouveau'").get().c;
  const en_cours = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut IN ('en_cours', 'assigne')").get().c;
  const resolu = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut IN ('resolu', 'ferme')").get().c;
  const critique = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE priorite = 'critique'").get().c;
  const haute = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE priorite = 'haute'").get().c;
  const utilisateurs = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const resolution_rate = total > 0 ? Math.round(resolu / total * 100) : 0;
  res.json({ total, nouveau, en_cours, resolu, critique, haute, utilisateurs, resolution_rate });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`👥 User Service démarré sur http://localhost:${PORT}`);
  startEurekaClient('USER-SERVICE', PORT, '/api/health');
});
