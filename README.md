# 🎓 ChoukrApp Academie

**Plateforme de cours en ligne pour étudiants** — Thème 2
Université Privée Hay (UPH) — Département Informatique — L1 S2 V2
Matière : **Programmation JavaScript** — Enseignant : **Mr RANDRIAMANANJARA Nico Olivier**

Application web complète (backend + frontend) permettant à des étudiants de suivre des cours en ligne : catalogue, lecteur vidéo, supports PDF, quiz corrigés automatiquement, suivi de progression, certificats PDF et notifications.

---

## 🧰 Technologies utilisées

| Côté | Technologies |
|------|--------------|
| Backend | Node.js, Express 5, sessions Express, bcrypt, multer, pdfkit, mysql2 |
| Base de données | MySQL (via WAMP / XAMPP / MySQL Server) |
| Frontend | HTML5, CSS3, JavaScript Vanilla (Fetch API) |
| Outils | npm, nodemon, VS Code, Git/GitHub |

---

## ✅ Prérequis

1. **Node.js** version 18 ou supérieure — [nodejs.org](https://nodejs.org)
2. **MySQL** démarré (WAMP, XAMPP ou serveur MySQL autonome)
   - WAMP : cliquer sur l'icône → *MySQL → Service → Start*
   - Identifiants par défaut de WAMP : utilisateur `root`, **mot de passe vide**

---

## 🚀 Installation et lancement (commandes exactes)

Ouvrir un terminal **dans le dossier du projet**, puis :

```bash
# 1. Installer les dépendances
npm install

# 2. Créer la base de données + les tables + les données de démonstration
npm run init-db

# 3. Démarrer le serveur
npm start
```

Puis ouvrir le navigateur à l'adresse : **http://localhost:3000**

> 💡 Un script unique fait tout (init + démarrage) : `npm run setup`
> Pour le développement avec rechargement automatique : `npm run dev`

### Configuration (optionnelle)
Copier `.env.example` vers `.env` et adapter si nécessaire :

```env
SERVER_PORT=3000
BASE_URL=http://localhost:3000
SESSION_SECRET=changez_cette_cle_secrete
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=choukrapp_db
```

---

## 👤 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Étudiant | `etudiant@choukrapp.mg` | `Etudiant123` |
| Enseignant | `enseignant@choukrapp.mg` | `Enseignant123` |
| Administrateur | `admin@choukrapp.mg` | `Admin123` |

---

## 🗂️ Structure du projet

```
.
├── server.js                 # Serveur Express (point d'entrée)
├── package.json
├── .env / .env.example       # Configuration (port, base de données…)
├── config/
│   ├── config.js             # Configuration centrale
│   └── db.js                 # Pool de connexions MySQL
├── middlewares/
│   ├── auth.middleware.js    # Authentification & rôles (sessions)
│   └── upload.middleware.js  # Téléversement PDF / vidéos (multer)
├── models/                   # Couche d'accès aux données (DAO SQL)
│   ├── user.model.js
│   ├── course.model.js
│   ├── chapter.model.js
│   ├── enrollment.model.js
│   ├── quiz.model.js
│   ├── certificate.model.js
│   └── notification.model.js
├── controllers/              # Logique métier de chaque ressource
├── routes/                   # Définition des endpoints de l'API REST
├── services/
│   ├── certificate.service.js   # Génération des certificats PDF
│   └── notification.service.js
├── database/
│   └── schema.sql            # Schéma de la base de données
├── scripts/
│   └── init-db.js            # Création + remplissage de la base
├── uploads/                  # Fichiers téléversés (PDF, vidéos, certificats)
├── public/                   # Interface frontend (servie en statique)
│   ├── index.html            # Accueil
│   ├── login.html / register.html
│   ├── catalog.html          # Catalogue (recherche + filtres dynamiques)
│   ├── course.html           # Espace de cours (vidéo, PDF, progression)
│   ├── quiz.html             # Quiz interactif + correction immédiate
│   ├── dashboard.html        # Tableau de bord étudiant
│   ├── enseignant.html       # Espace enseignant (CRUD cours/chapitres/quiz)
│   ├── verify.html           # Vérification publique d'un certificat
│   ├── css/style.css
│   └── js/app.js             # Noyau JS (Fetch, session, navigation)
├── RAPPORT_PROJET.md         # Rapport académique complet
└── README.md
```

---

## 🔌 Principaux endpoints de l'API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription (étudiant / enseignant) |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur connecté |
| GET | `/api/courses` | Catalogue (recherche & filtres) |
| GET | `/api/courses/:id` | Détail d'un cours (chapitres, quiz…) |
| POST | `/api/courses` | Créer un cours (enseignant) |
| PUT/DELETE | `/api/courses/:id` | Modifier / supprimer un cours |
| POST | `/api/courses/:id/chapters` | Ajouter un chapitre |
| POST | `/api/chapters/:id/upload` | Téléverser PDF / vidéo |
| POST | `/api/courses/:id/enroll` | S'inscrire à un cours |
| POST | `/api/chapters/:id/complete` | Marquer un chapitre terminé |
| GET | `/api/quizzes/:id` | Récupérer un quiz |
| POST | `/api/quizzes/:id/submit` | Soumettre & correction automatique |
| GET | `/api/me/dashboard` | Statistiques du tableau de bord |
| GET | `/api/me/certificates` | Mes certificats |
| GET | `/api/certificates/:id/download` | Télécharger le certificat PDF |
| GET | `/api/notifications` | Notifications |

---

## ☁️ Déploiement & dépôt GitHub

```bash
# Initialiser le dépôt et publier sur GitHub (remplacer l'URL)
git init
git add .
git commit -m "ChoukrApp Academie - Plateforme de cours en ligne (Thème 2)"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/choukrapp-academie.git
git push -u origin main
```

> Le fichier `.gitignore` exclut déjà `node_modules/` et les fichiers `.env`.

**Liens à compléter :**
- 🔗 Dépôt GitHub : `https://github.com/VOTRE-COMPTE/choukrapp-academie`
- 🌐 Application en ligne (déploiement) : `https://...`

---

## 🧪 Vérification rapide

- API santé : `http://localhost:3000/api/health`
- Interface : `http://localhost:3000`

---

© 2026 ChoukrApp Academie — Projet académique UPH (L1 S2 V2). Licence MIT.
