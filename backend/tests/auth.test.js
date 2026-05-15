const request = require('supertest');
const { createApp } = require('../app');
const { createTestDb } = require('./helpers/db');

let app, db;

beforeEach(() => {
  db  = createTestDb();
  app = createApp(db);
});

afterEach(() => db.close());

// ════════════════════════════════════════════════════════
//  INSCRIPTION
// ════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {

  test('✅ Inscription valide — retourne user + token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ prenom: 'Zineb', nom: 'Amrani', email: 'zineb@test.ma', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('zineb@test.ma');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('✅ Inscription avec département et poste', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ prenom: 'Hind', nom: 'Berrada', email: 'hind@test.ma', password: 'pass123', departement: 'IT', poste: 'Dev' });

    expect(res.status).toBe(201);
    expect(res.body.user.departement).toBe('IT');
  });

  test('❌ Champs obligatoires manquants — 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.ma' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('❌ Email déjà utilisé — 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ prenom: 'Test', nom: 'User', email: 'user@gestinc.ma', password: 'pass123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('deja utilise');
  });
});

// ════════════════════════════════════════════════════════
//  CONNEXION
// ════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {

  test('✅ Connexion admin valide', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gestinc.ma', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.prenom).toBe('Nabila');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('✅ Connexion utilisateur valide', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@gestinc.ma', password: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body.user.prenom).toBe('Salma');
    expect(res.body.user.role).toBe('user');
  });

  test('❌ Mauvais mot de passe — 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gestinc.ma', password: 'mauvais' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('incorrect');
  });

  test('❌ Email inexistant — 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.ma', password: 'pass123' });

    expect(res.status).toBe(401);
  });

  test('❌ Champs manquants — 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════
//  PROTECTION DES ROUTES
// ════════════════════════════════════════════════════════
describe('Protection des routes (JWT)', () => {

  test('❌ Accès sans token — 401', async () => {
    const res = await request(app).get('/api/incidents/mine');
    expect(res.status).toBe(401);
  });

  test('❌ Token invalide — 401', async () => {
    const res = await request(app)
      .get('/api/incidents/mine')
      .set('Authorization', 'Bearer token_invalide_xyz');
    expect(res.status).toBe(401);
  });
});
