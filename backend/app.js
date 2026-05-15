const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';

function createApp(db) {
  const app = express();
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
  app.use(express.json());

  // ── Middleware auth ────────────────────────────────────────────────────────
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
      return res.status(403).json({ message: 'Acces reserve aux administrateurs' });
    }
    next();
  }

  // ── AUTH ───────────────────────────────────────────────────────────────────
  app.post('/api/auth/register', (req, res) => {
    const { prenom, nom, email, password, departement, poste } = req.body;
    if (!prenom || !nom || !email || !password)
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent etre remplis.' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ message: 'Cet email est deja utilise.' });

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
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

    db.prepare("UPDATE users SET derniere_connexion = datetime('now') WHERE id = ?").run(user.id);
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: safeUser, token });
  });

  // ── INCIDENTS ──────────────────────────────────────────────────────────────
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
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.date_creation DESC';
    res.json(db.prepare(query).all());
  });

  app.get('/api/incidents/:id', auth, (req, res) => {
    const incident = db.prepare(
      "SELECT i.*, u.prenom || ' ' || u.nom as utilisateur FROM incidents i LEFT JOIN users u ON i.utilisateur_id = u.id WHERE i.id = ?"
    ).get(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident non trouve' });
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
    if (!incident) return res.status(404).json({ message: 'Incident non trouve' });
    db.prepare(`
      UPDATE incidents SET
        titre = COALESCE(?, titre), description = COALESCE(?, description),
        statut = COALESCE(?, statut), priorite = COALESCE(?, priorite),
        categorie = COALESCE(?, categorie), assigne_a = COALESCE(?, assigne_a),
        date_mise_a_jour = datetime('now')
      WHERE id = ?
    `).run(titre || null, description || null, statut || null, priorite || null, categorie || null, assigne_a || null, req.params.id);
    res.json(db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id));
  });

  app.delete('/api/incidents/:id', auth, adminOnly, (req, res) => {
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident non trouve' });
    db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
    res.json({ message: 'Incident supprime' });
  });

  // ── COMMENTS ───────────────────────────────────────────────────────────────
  app.get('/api/incidents/:id/comments', auth, (req, res) => {
    const comments = db.prepare(
      "SELECT c.*, u.prenom || ' ' || u.nom as auteur FROM comments c JOIN users u ON c.utilisateur_id = u.id WHERE c.incident_id = ? ORDER BY c.date_creation ASC"
    ).all(req.params.id);
    res.json(comments);
  });

  app.post('/api/incidents/:id/comments', auth, (req, res) => {
    const { texte } = req.body;
    if (!texte) return res.status(400).json({ message: 'Le commentaire ne peut pas etre vide.' });
    const result = db.prepare(
      'INSERT INTO comments (incident_id, utilisateur_id, texte) VALUES (?, ?, ?)'
    ).run(req.params.id, req.user.id, texte);
    res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid));
  });

  // ── USERS ──────────────────────────────────────────────────────────────────
  app.get('/api/users', auth, adminOnly, (req, res) => {
    const users = db.prepare('SELECT id, prenom, nom, email, role, departement, poste, date_creation FROM users ORDER BY date_creation DESC').all();
    res.json(users);
  });

  // ── STATS ──────────────────────────────────────────────────────────────────
  app.get('/api/stats', auth, adminOnly, (req, res) => {
    const total    = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    const nouveau  = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut = 'nouveau'").get().c;
    const en_cours = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut IN ('en_cours','assigne')").get().c;
    const resolu   = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE statut IN ('resolu','ferme')").get().c;
    const critique = db.prepare("SELECT COUNT(*) as c FROM incidents WHERE priorite = 'critique'").get().c;
    const utilisateurs = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const resolution_rate = total > 0 ? Math.round(resolu / total * 100) : 0;
    res.json({ total, nouveau, en_cours, resolu, critique, utilisateurs, resolution_rate });
  });

  // ── CHAT ───────────────────────────────────────────────────────────────────
  app.post('/api/chat/message', auth, (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message requis.' });
    const lower = message.toLowerCase();
    let response = "Je ne trouve pas de solution. Souhaitez-vous creer un ticket ?";
    if (lower.includes('imprimante')) response = "Solution trouvee : redemarrer le spooler d'impression.";
    else if (lower.includes('vpn') || lower.includes('reseau')) response = "Solution trouvee : vider le cache DNS.";
    else if (lower.includes('creer ticket')) {
      const result = db.prepare(
        "INSERT INTO incidents (titre, description, priorite, categorie, utilisateur_id) VALUES (?, ?, ?, ?, ?)"
      ).run('Incident via chatbot', message, 'moyenne', 'Support', req.user.id);
      response = `Incident #${result.lastInsertRowid} cree avec succes.`;
    }
    res.json({ response });
  });

  // ── HEALTH ────────────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

module.exports = { createApp, JWT_SECRET };
