const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3006;
const REGISTRY_URL = 'http://localhost:8761';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Store in-memory notifications
const notifications = [];

app.post('/api/notifications', (req, res) => {
  const { userId, type, message, incidentId } = req.body;
  const notification = {
    id: notifications.length + 1,
    userId,
    type: type || 'INFO',
    message,
    incidentId,
    read: false,
    date_creation: new Date().toISOString(),
  };
  notifications.push(notification);
  console.log(`📢 [Notification] ${type} pour user ${userId}: ${message}`);
  res.status(201).json(notification);
});

app.get('/api/notifications/:userId', (req, res) => {
  const userNotifs = notifications.filter(n => String(n.userId) === req.params.userId);
  res.json(userNotifs);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === parseInt(req.params.id));
  if (notif) notif.read = true;
  res.json({ message: 'Notification marquée comme lue' });
});

app.get('/api/notifications/health', (req, res) =>
  res.json({ status: 'UP', service: 'notification-service', port: PORT, count: notifications.length })
);

async function register() {
  try {
    await axios.post(`${REGISTRY_URL}/eureka/apps/NOTIFICATION-SERVICE`, {
      instance: { instanceId: `notification-service:${PORT}`, app: 'NOTIFICATION-SERVICE', hostName: 'localhost', port: PORT, status: 'UP' }
    });
    console.log('✅ [Notification] Enregistré dans le Registry');
  } catch { console.warn('[Notification] Registry non disponible'); }
}

async function heartbeat() {
  try { await axios.put(`${REGISTRY_URL}/eureka/apps/NOTIFICATION-SERVICE/notification-service:${PORT}`); } catch {}
}

app.listen(PORT, async () => {
  console.log(`📢 Notification Service démarré sur http://localhost:${PORT}`);
  await register();
  setInterval(heartbeat, 30000);
});
