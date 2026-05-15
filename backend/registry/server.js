const express = require('express');
const app = express();
app.use(express.json());

const PORT = 8761;
const services = {};

// Nettoyage des services inactifs (heartbeat > 90s)
setInterval(() => {
  const now = Date.now();
  for (const name in services) {
    services[name] = services[name].filter(i => now - i.lastHeartbeat < 90000);
    if (services[name].length === 0) delete services[name];
  }
}, 30000);

// Enregistrement d'un service
app.post('/eureka/apps/:appId', (req, res) => {
  const { appId } = req.params;
  const instance = req.body.instance || req.body;
  if (!services[appId]) services[appId] = [];
  const idx = services[appId].findIndex(s => s.instanceId === instance.instanceId);
  const entry = { ...instance, lastHeartbeat: Date.now(), status: 'UP' };
  if (idx >= 0) services[appId][idx] = entry;
  else services[appId].push(entry);
  console.log(`✅ [Registry] Service enregistré : ${appId} @ ${instance.hostName}:${instance.port}`);
  res.status(204).send();
});

// Heartbeat
app.put('/eureka/apps/:appId/:instanceId', (req, res) => {
  const { appId, instanceId } = req.params;
  if (services[appId]) {
    const svc = services[appId].find(s => s.instanceId === instanceId);
    if (svc) svc.lastHeartbeat = Date.now();
  }
  res.status(200).send('OK');
});

// Désenregistrement
app.delete('/eureka/apps/:appId/:instanceId', (req, res) => {
  const { appId, instanceId } = req.params;
  if (services[appId]) {
    services[appId] = services[appId].filter(s => s.instanceId !== instanceId);
  }
  res.status(200).send('OK');
});

// Liste de tous les services
app.get('/eureka/apps', (req, res) => {
  res.json({
    applications: {
      application: Object.entries(services).map(([name, instances]) => ({ name, instance: instances }))
    }
  });
});

// Un service spécifique
app.get('/eureka/apps/:appId', (req, res) => {
  const { appId } = req.params;
  res.json({ application: { name: appId, instance: services[appId] || [] } });
});

// Dashboard UI
app.get('/', (req, res) => {
  const rows = Object.entries(services).map(([name, instances]) =>
    instances.map(i => `<tr>
      <td><b>${name}</b></td>
      <td>${i.instanceId}</td>
      <td>${i.hostName}:${i.port}</td>
      <td style="color:green">UP</td>
      <td>${new Date(i.lastHeartbeat).toLocaleTimeString()}</td>
    </tr>`).join('')
  ).join('');
  res.send(`<!DOCTYPE html><html><head><title>GestInc Registry</title>
  <style>body{font-family:Arial;margin:40px;background:#f8fafc}
  h1{color:#003380}table{border-collapse:collapse;width:100%}
  th{background:#003380;color:white;padding:10px}td{padding:8px;border:1px solid #ddd}</style></head>
  <body><h1>🔍 GestInc — Service Registry (Eureka)</h1>
  <p>Services enregistrés : <b>${Object.keys(services).length}</b></p>
  <table><tr><th>Service</th><th>Instance ID</th><th>Adresse</th><th>Statut</th><th>Dernier heartbeat</th></tr>
  ${rows || '<tr><td colspan="5" style="text-align:center">Aucun service enregistré</td></tr>'}
  </table><script>setTimeout(()=>location.reload(),5000)</script></body></html>`);
});

app.get('/health', (req, res) => res.json({ status: 'UP', services: Object.keys(services).length }));

app.listen(PORT, () => {
  console.log(`🔍 Service Registry (Eureka) démarré sur http://localhost:${PORT}`);
});
