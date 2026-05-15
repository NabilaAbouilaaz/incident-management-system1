const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'gestinc.db');
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
    date_resolution TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES users(id),
    FOREIGN KEY (assigne_a) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    texte TEXT NOT NULL,
    date_creation TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (incident_id) REFERENCES incidents(id),
    FOREIGN KEY (utilisateur_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    statut TEXT DEFAULT 'EN_COURS',
    probleme_resume TEXT,
    date_creation TEXT DEFAULT (datetime('now'))
  );
`);

// Seed initial data
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@gestinc.ma');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (prenom, nom, email, password, role, departement, poste) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('Nabila', '', 'admin@gestinc.ma', hash, 'admin', 'Informatique', 'Administratrice');

  const userHash = bcrypt.hashSync('user123', 10);
  db.prepare(`INSERT INTO users (prenom, nom, email, password, role, departement, poste) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('Salma', '', 'user@gestinc.ma', userHash, 'user', 'Finance', 'Utilisatrice');

  const techHash = bcrypt.hashSync('tech123', 10);
  db.prepare(`INSERT INTO users (prenom, nom, email, password, role, departement, poste) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('Ahmed', 'Benali', 'ahmed@gestinc.ma', techHash, 'technicien', 'Support IT', 'Technicien');

  const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@gestinc.ma').id;
  const userId = db.prepare('SELECT id FROM users WHERE email = ?').get('user@gestinc.ma').id;
  const techId = db.prepare('SELECT id FROM users WHERE email = ?').get('ahmed@gestinc.ma').id;

  const incidentStmt = db.prepare(`
    INSERT INTO incidents (titre, description, statut, priorite, categorie, utilisateur_id, assigne_a, date_creation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  incidentStmt.run('Imprimante service RH bloquée', "L'imprimante du service RH n'imprime plus depuis ce matin.", 'resolu', 'moyenne', 'Matériel', userId, techId, '2026-05-10T09:00:00');
  incidentStmt.run('Problème de connexion VPN', 'Impossible de me connecter au VPN depuis 2 jours.', 'en_cours', 'haute', 'Réseau', userId, techId, '2026-05-13T14:30:00');
  incidentStmt.run('Application RH plantée', "L'application de gestion des congés affiche une erreur 500.", 'nouveau', 'critique', 'Logiciel', userId, null, '2026-05-15T08:15:00');
  incidentStmt.run('Serveur messagerie inaccessible', 'Le serveur de messagerie est inaccessible depuis 1 heure.', 'en_cours', 'critique', 'Réseau', adminId, techId, '2026-05-15T07:00:00');
  incidentStmt.run('Mise à jour Windows bloquée', 'La mise à jour Windows échoue avec une erreur 0x80070057.', 'resolu', 'faible', 'Logiciel', userId, techId, '2026-05-12T10:00:00');

  console.log('✅ Base de données initialisée avec les données de démonstration');
}

// Middleware auth
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
  if (req.user.role !== 'admin' && req.user.role !== 'technicien') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
}

// ─── AUTH ROUTES ────────────────────────────────────────────────
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

// ─── INCIDENTS ROUTES ───────────────────────────────────────────
app.get('/api/incidents/mine', auth, (req, res) => {
  const incidents = db.prepare(
    'SELECT * FROM incidents WHERE utilisateur_id = ? ORDER BY date_creation DESC'
  ).all(req.user.id);
  res.json(incidents);
});

app.get('/api/incidents', auth, (req, res) => {
  let query = "SELECT i.*, u.prenom || ' ' || u.nom as utilisateur FROM incidents i LEFT JOIN users u ON i.utilisateur_id = u.id";
  const conditions = [];
  if (req.user.role === 'user') {
    conditions.push(`i.utilisateur_id = ${req.user.id}`);
  }
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
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(incident);
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

// ─── COMMENTS ROUTES ────────────────────────────────────────────
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

// ─── USERS ROUTES ───────────────────────────────────────────────
app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, prenom, nom, email, role, departement, poste, date_creation FROM users ORDER BY date_creation DESC').all();
  res.json(users);
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const { role, departement, poste } = req.body;
  db.prepare('UPDATE users SET role = COALESCE(?, role), departement = COALESCE(?, departement), poste = COALESCE(?, poste) WHERE id = ?')
    .run(role || null, departement || null, poste || null, req.params.id);
  res.json({ message: 'Utilisateur mis à jour' });
});

// ─── STATS ROUTE ────────────────────────────────────────────────
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

// ─── CHAT ROUTE ─────────────────────────────────────────────────
app.post('/api/chat/message', auth, (req, res) => {
  const { message } = req.body;
  // Simple keyword-based response engine
  const lower = (message || '').toLowerCase();
  let response = "Je recherche des solutions dans notre base d'incidents…\n\nJe ne trouve pas de correspondance exacte. Souhaitez-vous créer un incident ? Répondez 'créer ticket'.";

  if (lower.includes('imprimante')) {
    response = "J'ai trouvé 2 incidents similaires résolus :\n\n📄 Incident #245 - Solution : Redémarrer le spooler d'impression\n📄 Incident #189 - Solution : Réinstaller les pilotes\n\nVoulez-vous essayer une de ces solutions ?";
  } else if (lower.includes('vpn') || lower.includes('réseau')) {
    response = "J'ai trouvé 1 incident similaire :\n\n📄 Incident #312 - Solution : Vider le cache DNS (ipconfig /flushdns)\n\nVoulez-vous essayer cette solution ?";
  } else if (lower.includes('créer ticket') || lower.includes('nouveau ticket')) {
    const result = db.prepare(
      "INSERT INTO incidents (titre, description, priorite, categorie, utilisateur_id) VALUES (?, ?, ?, ?, ?)"
    ).run('Incident via chatbot', message, 'moyenne', 'Support', req.user.id);
    response = `📋 Incident #${result.lastInsertRowid} créé avec succès !\nUn technicien vous contactera dans les 2 heures.\nRéférence : INC-2026-${result.lastInsertRowid}`;
  }

  res.json({ response });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur GestInc démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`\n📋 Comptes de démonstration :`);
  console.log(`   Nabila (Admin)  : admin@gestinc.ma / admin123`);
  console.log(`   Salma  (Client) : user@gestinc.ma  / user123`);
});
