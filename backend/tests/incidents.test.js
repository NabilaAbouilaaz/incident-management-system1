const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp, JWT_SECRET } = require('../app');
const { createTestDb } = require('./helpers/db');

let app, db, tokenAdmin, tokenUser, adminId, userId;

beforeEach(() => {
  db  = createTestDb();
  app = createApp(db);

  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@gestinc.ma');
  const user  = db.prepare('SELECT id FROM users WHERE email = ?').get('user@gestinc.ma');
  adminId = admin.id;
  userId  = user.id;

  tokenAdmin = jwt.sign({ id: adminId, email: 'admin@gestinc.ma', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  tokenUser  = jwt.sign({ id: userId,  email: 'user@gestinc.ma',  role: 'user'  }, JWT_SECRET, { expiresIn: '1h' });
});

afterEach(() => db.close());

// ════════════════════════════════════════════════════════
//  CREATION
// ════════════════════════════════════════════════════════
describe('POST /api/incidents', () => {

  test('✅ Création incident valide', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ titre: 'Imprimante bloquée', description: 'Ne répond plus', priorite: 'haute', categorie: 'Matériel' });

    expect(res.status).toBe(201);
    expect(res.body.titre).toBe('Imprimante bloquée');
    expect(res.body.statut).toBe('nouveau');
    expect(res.body.priorite).toBe('haute');
    expect(res.body.utilisateur_id).toBe(userId);
  });

  test('✅ Priorité par défaut = moyenne', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ titre: 'Test priorité par défaut' });

    expect(res.status).toBe(201);
    expect(res.body.priorite).toBe('moyenne');
  });

  test('❌ Titre manquant — 400', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ description: 'Sans titre' });

    expect(res.status).toBe(400);
  });

  test('❌ Sans authentification — 401', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ titre: 'Test' });

    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════
//  LECTURE
// ════════════════════════════════════════════════════════
describe('GET /api/incidents', () => {

  beforeEach(() => {
    db.prepare('INSERT INTO incidents (titre, statut, priorite, utilisateur_id) VALUES (?, ?, ?, ?)')
      .run('Incident Salma 1', 'nouveau', 'haute', userId);
    db.prepare('INSERT INTO incidents (titre, statut, priorite, utilisateur_id) VALUES (?, ?, ?, ?)')
      .run('Incident Salma 2', 'resolu', 'faible', userId);
    db.prepare('INSERT INTO incidents (titre, statut, priorite, utilisateur_id) VALUES (?, ?, ?, ?)')
      .run('Incident Nabila', 'nouveau', 'critique', adminId);
  });

  test('✅ Admin voit tous les incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('✅ Utilisateur voit seulement ses incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    res.body.forEach(inc => expect(inc.utilisateur_id).toBe(userId));
  });

  test('✅ GET /api/incidents/mine retourne les incidents de Salma', async () => {
    const res = await request(app)
      .get('/api/incidents/mine')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('✅ Récupérer un incident par ID', async () => {
    const inc = db.prepare('SELECT id FROM incidents LIMIT 1').get();
    const res = await request(app)
      .get(`/api/incidents/${inc.id}`)
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(inc.id);
  });

  test('❌ Incident inexistant — 404', async () => {
    const res = await request(app)
      .get('/api/incidents/9999')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════
//  MODIFICATION
// ════════════════════════════════════════════════════════
describe('PUT /api/incidents/:id', () => {

  let incId;
  beforeEach(() => {
    const r = db.prepare('INSERT INTO incidents (titre, statut, priorite, utilisateur_id) VALUES (?, ?, ?, ?)')
      .run('Incident à modifier', 'nouveau', 'moyenne', userId);
    incId = r.lastInsertRowid;
  });

  test('✅ Modifier le statut d\'un incident', async () => {
    const res = await request(app)
      .put(`/api/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ statut: 'en_cours' });

    expect(res.status).toBe(200);
    expect(res.body.statut).toBe('en_cours');
  });

  test('✅ Modifier le titre et la priorité', async () => {
    const res = await request(app)
      .put(`/api/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titre: 'Nouveau titre', priorite: 'critique' });

    expect(res.status).toBe(200);
    expect(res.body.titre).toBe('Nouveau titre');
    expect(res.body.priorite).toBe('critique');
  });

  test('❌ Incident inexistant — 404', async () => {
    const res = await request(app)
      .put('/api/incidents/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ statut: 'resolu' });

    expect(res.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════
//  SUPPRESSION
// ════════════════════════════════════════════════════════
describe('DELETE /api/incidents/:id', () => {

  let incId;
  beforeEach(() => {
    const r = db.prepare('INSERT INTO incidents (titre, utilisateur_id) VALUES (?, ?)')
      .run('A supprimer', adminId);
    incId = r.lastInsertRowid;
  });

  test('✅ Admin peut supprimer un incident', async () => {
    const res = await request(app)
      .delete(`/api/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const check = db.prepare('SELECT id FROM incidents WHERE id = ?').get(incId);
    expect(check).toBeUndefined();
  });

  test('❌ Utilisateur ne peut pas supprimer — 403', async () => {
    const res = await request(app)
      .delete(`/api/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(403);
  });

  test('❌ Incident inexistant — 404', async () => {
    const res = await request(app)
      .delete('/api/incidents/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});
