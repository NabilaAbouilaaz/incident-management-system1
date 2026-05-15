const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 8888;
const REGISTRY_URL = 'http://localhost:8761';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Configurations centralisées pour chaque microservice (Spring Cloud Config équivalent)
const configs = {
  common: {
    jwt: { secret: 'gestinc_secret_2026', expiration: '7d' },
    db: { path: '../../gestinc.db' },
    registry: { url: 'http://localhost:8761' },
  },
  'auth-service': {
    port: 3001,
    name: 'AUTH-SERVICE',
  },
  'incident-service': {
    port: 3002,
    name: 'INCIDENT-SERVICE',
  },
  'user-service': {
    port: 3003,
    name: 'USER-SERVICE',
  },
  'chat-service': {
    port: 3004,
    name: 'CHAT-SERVICE',
  },
  'comment-service': {
    port: 3005,
    name: 'COMMENT-SERVICE',
  },
  'notification-service': {
    port: 3006,
    name: 'NOTIFICATION-SERVICE',
  },
  gateway: {
    port: 5000,
    name: 'API-GATEWAY',
    routes: {
      '/api/auth': 'http://localhost:3001',
      '/api/incidents': 'http://localhost:3002',
      '/api/chat': 'http://localhost:3004',
      '/api/users': 'http://localhost:3003',
      '/api/stats': 'http://localhost:3003',
      '/api/health': 'http://localhost:3003',
      '/api/comments': 'http://localhost:3005',
      '/api/notifications': 'http://localhost:3006',
    },
  },
};

// GET /{service}/default — retourne la config du service (compatible Spring Cloud Config)
app.get('/:service/default', (req, res) => {
  const { service } = req.params;
  const serviceConfig = configs[service];
  if (!serviceConfig) return res.status(404).json({ message: `Configuration introuvable pour : ${service}` });
  res.json({
    name: service,
    profiles: ['default'],
    propertySources: [{
      name: `gestinc-config/${service}`,
      source: { ...configs.common, ...serviceConfig },
    }],
  });
});

// GET /config/{service} — format simplifié
app.get('/config/:service', (req, res) => {
  const { service } = req.params;
  const serviceConfig = configs[service];
  if (!serviceConfig) return res.status(404).json({ message: `Configuration introuvable pour : ${service}` });
  res.json({ ...configs.common, ...serviceConfig });
});

// GET /config — liste toutes les configurations
app.get('/config', (req, res) => {
  res.json({
    services: Object.keys(configs).filter(k => k !== 'common'),
    common: configs.common,
  });
});

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'config-service', port: PORT }));

// Dashboard HTML
app.get('/', (req, res) => {
  const services = Object.keys(configs).filter(k => k !== 'common');
  const rows = services.map(s =>
    `<tr><td><b>${s}</b></td><td>${configs[s].port || '-'}</td><td><a href="/config/${s}">/config/${s}</a></td></tr>`
  ).join('');
  res.send(`<!DOCTYPE html><html><head><title>GestInc Config Server</title>
  <style>body{font-family:Arial;margin:40px;background:#f8fafc}h1{color:#003380}
  table{border-collapse:collapse;width:100%}th{background:#003380;color:white;padding:10px}
  td{padding:8px;border:1px solid #ddd}a{color:#0066cc}</style></head>
  <body><h1>⚙️ GestInc — Config Server</h1>
  <p>Configurations centralisées — Port <b>${PORT}</b></p>
  <table><tr><th>Service</th><th>Port</th><th>Endpoint</th></tr>${rows}</table>
  </body></html>`);
});

async function register() {
  try {
    await axios.post(`${REGISTRY_URL}/eureka/apps/CONFIG-SERVICE`, {
      instance: { instanceId: `config-service:${PORT}`, app: 'CONFIG-SERVICE', hostName: 'localhost', port: PORT, status: 'UP' }
    });
    console.log('✅ [Config] Enregistré dans le Registry');
  } catch { console.warn('[Config] Registry non disponible'); }
}

async function heartbeat() {
  try { await axios.put(`${REGISTRY_URL}/eureka/apps/CONFIG-SERVICE/config-service:${PORT}`); } catch {}
}

app.listen(PORT, async () => {
  console.log(`⚙️  Config Service démarré sur http://localhost:${PORT}`);
  await register();
  setInterval(heartbeat, 30000);
});
