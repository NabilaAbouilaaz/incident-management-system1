const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

function createTestDb() {
  const db = new Database(':memory:');

  db.exec(`
    CREATE TABLE users (
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
    CREATE TABLE incidents (
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
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      utilisateur_id INTEGER NOT NULL,
      texte TEXT NOT NULL,
      date_creation TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      statut TEXT DEFAULT 'EN_COURS',
      probleme_resume TEXT,
      date_creation TEXT DEFAULT (datetime('now'))
    );
  `);

  // Utilisateurs de test
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash  = bcrypt.hashSync('user123', 10);

  db.prepare('INSERT INTO users (prenom, nom, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Nabila', '', 'admin@gestinc.ma', adminHash, 'admin');
  db.prepare('INSERT INTO users (prenom, nom, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Salma', '', 'user@gestinc.ma', userHash, 'user');

  return db;
}

module.exports = { createTestDb };
