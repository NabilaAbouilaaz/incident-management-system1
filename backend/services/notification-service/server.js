const express = require('express');
const cors = require('cors');
const { startEurekaClient } = require('../../eureka-client');

const app = express();
const PORT = 3006;

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

app.listen(PORT, () => {
  console.log(`📢 Notification Service démarré sur http://localhost:${PORT}`);
  startEurekaClient('NOTIFICATION-SERVICE', PORT, '/api/notifications/health');
});
