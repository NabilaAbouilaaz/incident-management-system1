const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { startEurekaClient } = require('../../eureka-client');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

const dbPath = path.join(__dirname, '../../gestinc.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    departement TEXT,
    poste TEXT,
    date_creation TEXT DEFAULT (datetime('now')),
    derniere_connexion TEXT
  );
`);

app.post('/api/auth/register', (req, res) => {
  const { prenom, nom, email, password, departement, poste } = req.body;
  if (!prenom || !nom || !email || !password)
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (prenom, nom, email, password, departement, poste) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(prenom, nom, email, hash, departement || null, poste || null);

  const user = { id: result.lastInsertRowid, prenom, nom, email, role: 'user', departement, poste };
  const token = jwt.sign({ id: user.id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

  db.prepare("UPDATE users SET derniere_connexion = datetime('now') WHERE id = ?").run(user.id);
  const { password: _, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: safeUser, token });
});

app.get('/api/auth/health', (req, res) => res.json({ status: 'UP', service: 'auth-service', port: PORT }));

app.listen(PORT, () => {
  console.log(`🔐 Auth Service démarré sur http://localhost:${PORT}`);
  startEurekaClient('AUTH-SERVICE', PORT, '/api/auth/health');
});
