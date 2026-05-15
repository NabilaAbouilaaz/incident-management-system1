const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const path = require('path');
const { startEurekaClient } = require('../../eureka-client');

const app = express();
const PORT = 3004;
const JWT_SECRET = process.env.JWT_SECRET || 'gestinc_secret_2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

const dbPath = path.join(__dirname, '../../gestinc.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    statut TEXT DEFAULT 'EN_COURS',
    probleme_resume TEXT,
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

app.post('/api/chat/message', auth, (req, res) => {
  const { message } = req.body;
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

app.get('/api/chat/health', (req, res) => res.json({ status: 'UP', service: 'chat-service', port: PORT }));

app.listen(PORT, () => {
  console.log(`💬 Chat Service démarré sur http://localhost:${PORT}`);
  startEurekaClient('CHAT-SERVICE', PORT, '/api/chat/health');
});
