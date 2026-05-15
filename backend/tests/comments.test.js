const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp, JWT_SECRET } = require('../app');
const { createTestDb } = require('./helpers/db');

let app, db, tokenUser, tokenAdmin, userId, adminId, incId;

beforeEach(() => {
  db  = createTestDb();
  app = createApp(db);

  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@gestinc.ma');
  const user  = db.prepare('SELECT id FROM users WHERE email = ?').get('user@gestinc.ma');
  adminId = admin.id;
  userId  = user.id;

  tokenAdmin = jwt.sign({ id: adminId, email: 'admin@gestinc.ma', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  tokenUser  = jwt.sign({ id: userId,  email: 'user@gestinc.ma',  role: 'user'  }, JWT_SECRET, { expiresIn: '1h' });

  const r = db.prepare('INSERT INTO incidents (titre, utilisateur_id) VALUES (?, ?)').run('Incident test', userId);
  incId = r.lastInsertRowid;
});

afterEach(() => db.close());

describe('GET /api/incidents/:id/comments', () => {

  test('✅ Liste vide au départ', async () => {
    const res = await request(app)
      .get(`/api/incidents/${incId}/comments`)
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('✅ Retourne les commentaires existants avec auteur', async () => {
    db.prepare('INSERT INTO comments (incident_id, utilisateur_id, texte) VALUES (?, ?, ?)').run(incId, userId, 'Premier commentaire');
    db.prepare('INSERT INTO comments (incident_id, utilisateur_id, texte) VALUES (?, ?, ?)').run(incId, adminId, 'Réponse admin');

    const res = await request(app)
      .get(`/api/incidents/${incId}/comments`)
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('auteur');
    expect(res.body[0].texte).toBe('Premier commentaire');
  });
});

describe('POST /api/incidents/:id/comments', () => {

  test('✅ Ajouter un commentaire valide', async () => {
    const res = await request(app)
      .post(`/api/incidents/${incId}/comments`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ texte: 'Problème toujours présent.' });

    expect(res.status).toBe(201);
    expect(res.body.texte).toBe('Problème toujours présent.');
    expect(res.body.utilisateur_id).toBe(userId);
  });

  test('✅ Admin peut commenter', async () => {
    const res = await request(app)
      .post(`/api/incidents/${incId}/comments`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ texte: 'Pris en charge par Nabila.' });

    expect(res.status).toBe(201);
    expect(res.body.utilisateur_id).toBe(adminId);
  });

  test('❌ Commentaire vide — 400', async () => {
    const res = await request(app)
      .post(`/api/incidents/${incId}/comments`)
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ texte: '' });

    expect(res.status).toBe(400);
  });

  test('❌ Sans authentification — 401', async () => {
    const res = await request(app)
      .post(`/api/incidents/${incId}/comments`)
      .send({ texte: 'Test' });

    expect(res.status).toBe(401);
  });
});
