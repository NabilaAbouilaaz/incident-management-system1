# GestInc — Système de Gestion des Incidents

> ENSA BM · Pr. BE ELBAGHAZAOUI · Architecture Microservices avec DevOps & Sécurité

## Démarrage rapide

### Méthode 1 : Développement local

**Backend (port 5000) :**
```bash
cd backend
npm install
node server.js
```

**Frontend (port 5173) :**
```bash
cd frontend
npm install
npm run dev
```

Ouvrez `http://localhost:5173`

### Méthode 2 : Docker Compose

```bash
docker-compose up --build
```

Ouvrez `http://localhost`

---

## Comptes de démonstration

| Rôle         | Email                  | Mot de passe |
|--------------|------------------------|--------------|
| Admin        | admin@gestinc.ma       | admin123     |
| Utilisateur  | user@gestinc.ma        | user123      |
| Technicien   | ahmed@gestinc.ma       | tech123      |

---

## Structure du projet

```
incident management system/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── pages/     # Home, Login, Register, ClientDashboard, AdminDashboard…
│   │   ├── components/# Navbar, Sidebar
│   │   ├── context/   # AuthContext (JWT)
│   │   └── services/  # api.js (Axios)
│   └── Dockerfile
├── backend/           # Node.js + Express + SQLite
│   ├── server.js      # API REST complète
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Fonctionnalités

- **Page d'accueil** : Hero avec `pic_acceuil.png`, sections fonctionnalités, statistiques, CTA
- **Authentification** : Inscription / Connexion avec JWT, rôles (admin, technicien, user)
- **Portail client** : Lister mes incidents, créer un incident, assistant IA (chatbot)
- **Tableau de bord admin** : Statistiques, gestion incidents (filtre, recherche, changement statut), gestion utilisateurs
- **Assistant IA** : Chatbot qui recherche des incidents similaires et propose des solutions
- **API REST** : `/api/auth`, `/api/incidents`, `/api/comments`, `/api/users`, `/api/stats`, `/api/chat`

---

## Technologies

| Couche    | Technologie                          |
|-----------|--------------------------------------|
| Frontend  | React 18, Vite, React Router, Axios  |
| Backend   | Node.js, Express, JWT, bcryptjs      |
| Base de données | SQLite (better-sqlite3)        |
| Styles    | CSS custom (blanc, bleu, bleu ciel)  |
| Conteneurs | Docker, Docker Compose             |
