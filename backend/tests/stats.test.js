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

  // Insérer des incidents variés
  const ins = db.prepare('INSERT INTO incidents (titre, statut, priorite, utilisateur_id) VALUES (?, ?, ?, ?)');
  ins.run('Inc 1', 'nouveau',  'critique', userId);
  ins.run('Inc 2', 'nouveau',  'haute',    userId);
  ins.run('Inc 3', 'assigne',  'moyenne',  userId);
  ins.run('Inc 4', 'en_cours', 'faible',   adminId);
  ins.run('Inc 5', 'resolu',   'moyenne',  adminId);
  ins.run('Inc 6', 'ferme',    'faible',   userId);
});

afterEach(() => db.close());

describe('GET /api/stats', () => {

  test('✅ Retourne toutes les statistiques', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total:       6,
      nouveau:     2,
      en_cours:    2,   // assigne + en_cours
      resolu:      2,   // resolu + ferme
      critique:    1,
      utilisateurs: 2,
    });
  });

  test('✅ Taux de résolution calculé correctement (2/6 = 33%)', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.resolution_rate).toBe(33);
  });

  test('✅ Statistiques vides si aucun incident', async () => {
    db.prepare('DELETE FROM incidents').run();
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.resolution_rate).toBe(0);
  });

  test('❌ Utilisateur standard refusé — 403', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(403);
  });

  test('❌ Sans token — 401', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {

  test('✅ Admin obtient la liste des utilisateurs', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  test('❌ Utilisateur standard refusé — 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/chat/message', () => {

  test('✅ Message imprimante — solution trouvée', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ message: 'Mon imprimante ne fonctionne plus' });

    expect(res.status).toBe(200);
    expect(res.body.response).toContain('spooler');
  });

  test('✅ Message VPN — solution trouvée', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ message: 'Problème VPN connexion impossible' });

    expect(res.status).toBe(200);
    expect(res.body.response).toContain('DNS');
  });

  test('✅ Demande création ticket — incident créé en BDD', async () => {
    const before = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ message: 'creer ticket pour mon problème' });

    expect(res.status).toBe(200);
    expect(res.body.response).toContain('cree');
    const after = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
    expect(after).toBe(before + 1);
  });

  test('❌ Message vide — 400', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('GET /api/health retourne OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
