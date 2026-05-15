const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;
const REGISTRY_URL = 'http://localhost:8761';

// Routes vers chaque microservice
const ROUTES = {
  '/api/auth':     'http://localhost:3001',
  '/api/incidents':'http://localhost:3002',
  '/api/chat':     'http://localhost:3004',
  '/api/users':    'http://localhost:3003',
  '/api/stats':    'http://localhost:3003',
  '/api/health':   'http://localhost:3003',
};

app.use(cors({ origin: '*' }));

// Proxy pour chaque route
for (const [prefix, target] of Object.entries(ROUTES)) {
  app.use(prefix, createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[Gateway] Erreur proxy ${prefix}:`, err.message);
        res.status(503).json({ message: `Service indisponible : ${prefix}` });
      }
    }
  }));
}

// Health gateway
app.get('/gateway/health', (req, res) => {
  res.json({ status: 'UP', service: 'API Gateway', port: PORT, routes: Object.keys(ROUTES) });
});

// Dashboard
app.get('/gateway', (req, res) => {
  const rows = Object.entries(ROUTES).map(([prefix, target]) =>
    `<tr><td><code>${prefix}/*</code></td><td>${target}</td><td style="color:green">✓ Actif</td></tr>`
  ).join('');
  res.send(`<!DOCTYPE html><html><head><title>GestInc Gateway</title>
  <style>body{font-family:Arial;margin:40px;background:#f8fafc}h1{color:#003380}
  table{border-collapse:collapse;width:100%}th{background:#003380;color:white;padding:10px}
  td{padding:8px;border:1px solid #ddd}code{background:#eee;padding:2px 6px;border-radius:4px}</style></head>
  <body><h1>🌐 GestInc — API Gateway</h1>
  <p>Point d'entrée unique — Port <b>${PORT}</b></p>
  <table><tr><th>Route</th><th>Microservice cible</th><th>Statut</th></tr>${rows}</table>
  </body></html>`);
});

// Enregistrement dans le registry
const axios = require('axios');
async function register() {
  try {
    await axios.post(`${REGISTRY_URL}/eureka/apps/API-GATEWAY`, {
      instance: {
        instanceId: `api-gateway:${PORT}`,
        app: 'API-GATEWAY',
        hostName: 'localhost',
        port: PORT,
        status: 'UP'
      }
    });
    console.log('✅ [Gateway] Enregistré dans le Registry');
  } catch { console.warn('[Gateway] Registry non disponible'); }
}

// Heartbeat toutes les 30s
async function heartbeat() {
  try {
    await axios.put(`${REGISTRY_URL}/eureka/apps/API-GATEWAY/api-gateway:${PORT}`);
  } catch {}
}

app.listen(PORT, async () => {
  console.log(`🌐 API Gateway démarré sur http://localhost:${PORT}`);
  await register();
  setInterval(heartbeat, 30000);
});
