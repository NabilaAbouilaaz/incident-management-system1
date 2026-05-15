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

// Dashboard UI — Spring Eureka style
app.get('/', (req, res) => {
  const startTime = process.uptime();
  const uptimeMin = Math.floor(startTime / 60);
  const uptimeSec = Math.floor(startTime % 60);
  const uptimeStr = `${String(uptimeMin).padStart(2,'0')}:${String(uptimeSec).padStart(2,'0')}`;
  const now = new Date();
  const timeStr = now.toISOString().replace('T',' ').substring(0,19) + ' +0000';

  const instanceRows = Object.entries(services).map(([name, instances]) =>
    instances.map(i => {
      const url = `http://${i.hostName}:${i.port}`;
      return `<tr>
        <td>${name}</td>
        <td>n/a</td>
        <td><a href="${url}">${i.instanceId}</a></td>
        <td><span style="color:#5cb85c;font-weight:bold">UP</span> (1)</td>
      </tr>`;
    }).join('')
  ).join('');

  const noInstances = Object.keys(services).length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">No instances currently registered with Eureka</td></tr>`
    : instanceRows;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Eureka</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; background: #f5f5f5; }

    /* Header */
    .navbar {
      background: #34302d;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 22px;
      font-weight: bold;
      color: white;
    }
    .spring-logo {
      width: 32px; height: 32px;
      background: #6db33f;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; font-weight: bold;
    }
    .navbar-brand span.spring { color: #6db33f; }
    .navbar-brand span.eureka { color: white; }
    .navbar-toggle { background: transparent; border: 1px solid #666; color: #ccc; padding: 6px 10px; cursor: pointer; border-radius: 4px; font-size: 18px; }

    /* Content */
    .container { max-width: 960px; margin: 0 auto; padding: 20px; }

    h2 { font-size: 22px; margin: 20px 0 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }

    /* System status table */
    .status-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; }
    .status-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .status-table tr:nth-child(odd) td { background: #f9f9f9; }

    /* Instances table */
    .instances-table { width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; }
    .instances-table th { background: #6db33f; color: white; padding: 10px 12px; text-align: left; font-weight: bold; }
    .instances-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .instances-table tr:hover td { background: #f0f8e8; }

    /* DS Replicas */
    .replicas { background: white; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; }
    .replicas a { color: #337ab7; text-decoration: none; }
    .replicas a:hover { text-decoration: underline; }

    /* Warning banner */
    .alert { background: #fcf8e3; border: 1px solid #faebcc; color: #8a6d3b; padding: 10px 15px; margin-bottom: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-brand">
      <div class="spring-logo">&#9675;</div>
      <span class="spring">spring</span>&nbsp;<span class="eureka">Eureka</span>
    </div>
    <button class="navbar-toggle">&#9776;</button>
  </nav>

  <div class="container">
    <h2>System Status</h2>
    <table class="status-table">
      <tr><td>Environment</td><td>test</td></tr>
      <tr><td>Data center</td><td>default</td></tr>
      <tr><td></td><td></td></tr>
      <tr><td>Current time</td><td>${timeStr}</td></tr>
      <tr><td>Uptime</td><td>${uptimeStr}</td></tr>
      <tr><td>Lease expiration enabled</td><td>false</td></tr>
      <tr><td>Renews threshold</td><td>${Math.max(1, Object.keys(services).length)}</td></tr>
      <tr><td>Renews (last min)</td><td>${Object.values(services).reduce((acc, arr) => acc + arr.length, 0)}</td></tr>
    </table>

    <h2>DS Replicas</h2>
    <div class="replicas"><a href="http://localhost:8761">localhost</a></div>

    <h2>Instances currently registered with Eureka</h2>
    ${Object.keys(services).length === 0 ? '<div class="alert">No instances currently registered with Eureka</div>' : ''}
    <table class="instances-table">
      <thead>
        <tr>
          <th>Application</th>
          <th>AMIs</th>
          <th>Availability Zones</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${noInstances}
      </tbody>
    </table>

    <h2>General Info</h2>
    <table class="status-table">
      <tr><td>total-avail-memory</td><td>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} mb</td></tr>
      <tr><td>num-of-cpus</td><td>4</td></tr>
      <tr><td>current-memory-usage</td><td>${Math.round(process.memoryUsage().rss / 1024 / 1024)} mb</td></tr>
      <tr><td>server-uptime</td><td>${uptimeStr}</td></tr>
      <tr><td>registered-replicas</td><td></td></tr>
      <tr><td>unavailable-replicas</td><td></td></tr>
      <tr><td>available-replicas</td><td></td></tr>
    </table>
  </div>

  <script>setTimeout(() => location.reload(), 10000);</script>
</body>
</html>`);
});

app.get('/health', (req, res) => res.json({ status: 'UP', services: Object.keys(services).length }));

app.listen(PORT, () => {
  console.log(`🔍 Service Registry (Eureka) démarré sur http://localhost:${PORT}`);
});
