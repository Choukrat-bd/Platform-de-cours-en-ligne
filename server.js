/**
 * =====================================================================
 *  ChoukrApp Academie - Serveur principal (Node.js + Express)
 *  Plateforme de cours en ligne pour étudiants - Thème 2
 *  Université Privée Hay (UPH) - L1 S2 V2
 * =====================================================================
 */
const path = require('path');
const express = require('express');
const session = require('express-session');

const config = require('./config/config');
const routes = require('./routes');
const pool = require('./config/db');

const app = express();

// ---------------------------------------------------------------------
// Middlewares généraux
// ---------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);
app.use(
  session({
    name: 'choukrapp.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // passer à true derrière HTTPS
      maxAge: config.sessionMaxAge
    }
  })
);

// ---------------------------------------------------------------------
// Fichiers statiques
//  - /public : interface frontend (HTML/CSS/JS)
//  - /uploads : supports PDF, vidéos et certificats
// ---------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------
// API REST
// ---------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ChoukrApp Academie', time: new Date().toISOString() });
});

app.use('/api', routes);

// Route API inconnue -> 404 JSON
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint introuvable.' });
});

// Toute autre route -> retourne l'accueil (utile pour le routage client)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------
// Gestion centralisée des erreurs
// ---------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Erreur]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Erreur serveur inattendue.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// ---------------------------------------------------------------------
// Démarrage : on vérifie d'abord la connexion MySQL
// ---------------------------------------------------------------------
async function start() {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('[OK] Connexion à la base de données MySQL établie.');
  } catch (err) {
    console.error('\n[ERREUR] Impossible de se connecter à MySQL :', err.message);
    console.error('  1) Vérifiez que MySQL est démarré (WAMP / XAMPP / service).');
    console.error('  2) Vérifiez les identifiants dans le fichier .env.');
    console.error('  3) Lancez "npm run init-db" pour créer la base si nécessaire.\n');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log('=====================================================');
    console.log('  ChoukrApp Academie démarré !');
    console.log(`  Interface : ${config.baseUrl}`);
    console.log(`  API       : ${config.baseUrl}/api/health`);
    console.log('=====================================================');
  });
}

start();