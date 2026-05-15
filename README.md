# GestInc — Système de Gestion des Incidents Informatiques

> Architecture Microservices avec DevOps & Sécurité
> ENSA Beni Mellal — 2025/2026
> Réalisé par : **Nabila Abouilaaz** & **Salma Assamri**
> Encadrant : **Pr. BE ELBAGHAZAOUI**

---

## Architecture

```
Frontend React (port 80/5173)
        |
  API Gateway (port 5000)
  /api/auth  /api/incidents  /api/users  /api/chat  /api/incidents/:id/comments
    |           |               |           |              |
  3001        3002            3003        3004           3005
  Auth      Incident          User        Chat         Comment
                                                         3006
                                                    Notification
        |
  Service Registry Eureka (port 8761)
  Config Service (port 8888)
  Keycloak IAM (port 8080)
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Service Registry (Eureka) | 8761 | Decouverte et enregistrement des services |
| Config Service | 8888 | Configuration centralisee (Spring Cloud Config equivalent) |
| API Gateway | 5000 | Point d'entree unique, routage vers les microservices |
| Auth Service | 3001 | Authentification JWT (inscription / connexion) |
| Incident Service | 3002 | CRUD incidents, workflow, assignation |
| User Service | 3003 | Gestion utilisateurs + statistiques |
| Chat Service | 3004 | Chatbot IA de diagnostic d'incidents |
| Comment Service | 3005 | Commentaires et echanges sur les incidents |
| Notification Service | 3006 | Notifications en temps reel |
| Keycloak | 8080 | Serveur IAM (authentification et autorisation) |
| Frontend React | 5173/80 | Interface Admin + Interface Client |

## Demarrage rapide

### Avec VS Code
`Ctrl+Shift+B` pour demarrer tous les services en parallele.

### Avec Docker Compose
```bash
docker-compose up --build
```

### Manuellement (ordre important)
```bash
node backend/registry/server.js          # 1. Registry (8761)
node backend/config-service/server.js    # 2. Config (8888)
node backend/services/auth-service/server.js
node backend/services/incident-service/server.js
node backend/services/user-service/server.js
node backend/services/chat-service/server.js
node backend/services/comment-service/server.js
node backend/services/notification-service/server.js
node backend/gateway/server.js           # Gateway (5000)
cd frontend && npm run dev               # Frontend (5173)
```

## Dashboards

| Dashboard | URL |
|-----------|-----|
| Eureka Registry | http://localhost:8761 |
| Config Service | http://localhost:8888 |
| API Gateway | http://localhost:5000/gateway |
| Keycloak Admin | http://localhost:8080 (admin/admin123) |
| Application | http://localhost:5173 |

## Comptes de demonstration

| Role | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@gestinc.ma | admin123 |
| Utilisateur | user@gestinc.ma | user123 |

## Tests

```bash
cd backend && npm test    # 44 tests backend (Jest + Supertest)
cd frontend && npm test   # 7 tests frontend (Vitest)
```

Resultat : **51 / 51 tests — 100%**

## Structure du projet

```
incident-management-system/
├── backend/
│   ├── registry/                  # Service Register Eureka (8761)
│   ├── config-service/            # Config Server (8888)
│   ├── gateway/                   # API Gateway (5000)
│   ├── services/
│   │   ├── auth-service/          # Auth (3001)
│   │   ├── incident-service/      # Incidents (3002)
│   │   ├── user-service/          # Users + Stats (3003)
│   │   ├── chat-service/          # Chatbot IA (3004)
│   │   ├── comment-service/       # Commentaires (3005)
│   │   └── notification-service/  # Notifications (3006)
│   └── tests/
├── frontend/                      # React 18 + Vite
└── docker-compose.yml
```
