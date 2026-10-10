/**
 * =====================================================================
 *  ChoukrApp Academie - Script d'initialisation de la base de données
 *  Usage :  npm run init-db
 *  - Crée la base "choukrapp_db" si absente
 *  - Exécute database/schema.sql (tables)
 *  - Insère des données de démonstration (uniquement si la base est vide)
 *  - Génère des supports PDF d'exemple (pdfkit) dans uploads/pdfs
 * =====================================================================
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');
const config = require('../config/config');

// S'assure que les dossiers d'uploads existent
[config.paths.uploadsPdf, config.paths.uploadsVideo].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const SALT_ROUNDS = 10;
const SAMPLE_VIDEOS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4'
];

async function generateSamplePdf(filename, title, lines) {
  const file = path.join(config.paths.uploadsPdf, filename);
  if (fs.existsSync(file)) return;
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(file));
  doc.fontSize(22).fillColor('#1e3a8a').text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#333333');
  doc.text('ChoukrApp Academie - Support de cours', { align: 'center' });
  doc.moveDown(0.5);
  doc.strokeColor('#2563eb').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
  doc.fillColor('#111111');
  lines.forEach((line) => {
    doc.text(line, { align: 'left' });
    doc.moveDown(0.4);
  });
  doc.end();
  console.log(`  [OK] PDF généré : ${filename}`);
}

async function seed(db) {
  console.log('  Insertion des données de démonstration...');

  const hash = (v) => bcrypt.hashSync(v, SALT_ROUNDS);
  const [admin] = await db.query(
    "INSERT INTO users (nom, prenom, email, password_hash, role, bio) VALUES (?, ?, ?, ?, 'admin', ?)",
    ['Admin', 'ChoukrApp Academie', 'admin@choukrapp.mg', hash('Admin123'), 'Administrateur de la plateforme']
  );
  const [enseignant] = await db.query(
    "INSERT INTO users (nom, prenom, email, password_hash, role, bio) VALUES (?, ?, ?, ?, 'enseignant', ?)",
    ['Randriamanalina', 'Hery', 'enseignant@choukrapp.mg', hash('Enseignant123'),
      'Enseignant de Programmation JavaScript à l\'UPH']
  );
  const [etudiant] = await db.query(
    "INSERT INTO users (nom, prenom, email, password_hash, role, bio) VALUES (?, ?, ?, ?, 'etudiant', ?)",
    ['Etudiant', 'Choukrat', 'etudiant@choukrapp.mg', hash('Etudiant123'), 'Étudiant en L1 Info']
  );
  console.log('  3 comptes créés (admin / enseignant / etudiant).');

  const courses = [
    {
      title: 'Introduction au JavaScript',
      description: 'Découvrez les bases du JavaScript : variables, fonctions, conditions et boucles. Le langage qui anime vos pages web.',
      category: 'Informatique',
      level: 'Debutant',
      chapters: [
        { title: 'Variables et types de données', videoIdx: 0,
          lines: ['Le JavaScript est un langage de programmation interprété côté navigateur.',
            '- let : variable locale modifiable', '- const : constante non réassignable',
            '- string, number, boolean, null, undefined, object, array',
            'Exemple : let age = 20;  -> age // 20'] },
        { title: 'Fonctions et portées', videoIdx: 2,
          lines: ['Une fonction est un bloc de code réutilisable.', '- function maFonction() {}',
            '- Arrow functions : const f = () => {}', '- Les portées globale et locale'] },
        { title: 'Conditions, boucles et tableaux', videoIdx: 1,
          lines: ['structures de contrôle : if / else if / else, switch',
            'Boucles : for, while, for...of', 'Méthodes de tableaux : map, filter, reduce'] }
      ],
      quiz: {
        title: 'Quiz - Les bases de JavaScript',
        questions: [
          { text: 'Quel mot-clé permet de déclarer une constante ?',
            options: ['let', 'var', 'const', 'static'], correct: 2,
            explanation: 'const déclare une constante qui ne peut pas être réassignée.' },
          { text: 'Quelle est la sortie de console.log(typeof 42) ?',
            options: ['"number"', '"integer"', '"float"', '"string"'], correct: 0,
            explanation: 'typeof 42 retourne la chaîne "number".' },
          { text: 'Quelle méthode de tableau applique une fonction à chaque élément ?',
            options: ['push()', 'map()', 'concat()', 'join()'], correct: 1,
            explanation: 'map() crée un nouveau tableau en appliquant une fonction à chaque élément.' }
        ]
      }
    },
    {
      title: 'Développement Web avec Node.js & Express',
      description: 'Créez des API REST côté serveur avec Node.js et le framework Express. Middlewares, routes et fichiers statiques.',
      category: 'Informatique',
      level: 'Intermediaire',
      chapters: [
        { title: 'Découverte de Node.js et npm', videoIdx: 1,
          lines: ['Node.js exécute du JavaScript hors du navigateur.',
            'npm : gestionnaire de paquets. "npm install express"',
            'Modules commons : require() / module.exports'] },
        { title: 'Créer une API avec Express', videoIdx: 0,
          lines: ['const express = require("express");',
            'app.get("/api/courses", handler) ; app.listen(3000)',
            'express.json() pour lire le corps des requêtes POST',
            'Les routes paramétrées : /api/courses/:id'] },
        { title: 'Statique, uploads et sécurité', videoIdx: 2,
          lines: ['express.static() pour servir le dossier public/',
            'Upload de fichiers avec multer',
            'Protection contre l\'injection SQL : requêtes paramétrées',
            'Hachage des mots de passe avec bcrypt'] }
      ],
      quiz: {
        title: 'Quiz - Node.js & Express',
        questions: [
          { text: 'Quel framework sert à construire une API REST en Node.js ?',
            options: ['React', 'jQuery', 'Express', 'Angular'], correct: 2,
            explanation: 'Express est le framework HTTP le plus utilisé pour Node.js.' },
          { text: 'Quelle méthode HTTP est utilisée pour créer une ressource ?',
            options: ['GET', 'POST', 'DELETE', 'HEAD'], correct: 1,
            explanation: 'POST permet de créer une ressource sur le serveur.' }
        ]
      }
    },
    {
      title: 'Base de données MySQL',
      description: 'Concevez des bases relationnelles, écrivez des requêtes SQL et connectez-les à vos applications Node.js.',
      category: 'Informatique',
      level: 'Intermediaire',
      chapters: [
        { title: 'Modélisation et tables', videoIdx: 2,
          lines: ['- Une base relationnelle organise les données en tables.',
            '- Clé primaire (PRIMARY KEY) et clés étrangères (FOREIGN KEY)',
            '- Les jalons : 1 à N, N à N',
            'Exemple : CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(150))'] },
        { title: 'Requêtes SQL : SELECT, INSERT, UPDATE, DELETE', videoIdx: 0,
          lines: ['SELECT * FROM courses WHERE level = "Debutant";',
            'INSERT INTO users (email) VALUES (?);  -> prévention SQL',
            'UPDATE courses SET title = ? WHERE id = ?',
            'DELETE FROM notifications WHERE is_read = 1'] }
      ],
      quiz: {
        title: 'Quiz - MySQL',
        questions: [
          { text: 'Quelle clause permet de filtrer les lignes d\'un SELECT ?',
            options: ['ORDER BY', 'WHERE', 'GROUP BY', 'HAVING'], correct: 1,
            explanation: 'WHERE filtre les lignes avant leur retour.' },
          { text: 'Une clé étrangère référence...', options: ['une colonne de la même table', 'la clé primaire d\'une autre table', 'un index', 'une vue'],
            correct: 1, explanation: 'La clé étrangère fait référence à la clé primaire d\'une autre table.' }
        ]
      }
    },
    {
      title: 'HTML5 et CSS3 : Fondamentaux',
      description: 'Structurez vos pages web en HTML sémantique et mettez-les en forme avec des feuilles de style modernes (Flexbox, Grid).',
      category: 'Web',
      level: 'Debutant',
      chapters: [
        { title: 'Structure et balisage HTML5', videoIdx: 1,
          lines: ['- Balises sémantiques : header, nav, main, section, footer',
            '- Formulaires : input, select, textarea, bouton submit',
            '- Attributs : src, href, alt, class, id'] },
        { title: 'Mise en page avec CSS3', videoIdx: 0,
          lines: ['- Sélecteurs : balise, .classe, #id',
            '- Flexbox : display:flex; justify-content; align-items',
            '- Responsive : media queries (max-width)', '- Variables CSS : --couleur-principale'] }
      ],
      quiz: {
        title: 'Quiz - HTML & CSS',
        questions: [
          { text: 'Quelle balise crée un lien hypertexte ?',
            options: ['<a>', '<link>', '<href>', '<url>'], correct: 0,
            explanation: 'La balise <a href="...">...</a> crée un lien.' },
          { text: 'Quelle propriété CSS centre horizontalement en Flexbox ?',
            options: ['align-content', 'justify-content', 'text-center', 'margin:auto both'], correct: 1,
            explanation: 'justify-content: center centre les éléments sur l\'axe principal.' }
        ]
      }
    },
    {
      title: 'Python pour la Data Science',
      description: 'Apprenez Python et les bibliothèques essentielles (NumPy, Pandas, Matplotlib) pour analyser et visualiser des données.',
      category: 'Informatique',
      level: 'Intermediaire',
      chapters: [
        { title: 'Premiers pas avec Python', videoIdx: 0,
          lines: ['Python est un langage clair et puissant, très utilisé en science des données.',
            '- Variables et types : int, float, str, list, dict',
            '- Structures de contrôle : if, for, while',
            'Exemple : notes = [12, 15, 9]; sum(notes) / len(notes)'] },
        { title: 'NumPy et Pandas', videoIdx: 1,
          lines: ['- NumPy : tableaux multidimensionnels et calcul vectoriel',
            '- Pandas : DataFrame pour manipuler des tableaux de données',
            'import pandas as pd; df = pd.read_csv("data.csv")',
            'df.describe() pour un résumé statistique'] },
        { title: 'Visualiser avec Matplotlib', videoIdx: 2,
          lines: ['- Tracer des courbes, histogrammes et nuages de points',
            'import matplotlib.pyplot as plt',
            'plt.plot(x, y); plt.title("Évolution"); plt.show()'] }
      ],
      quiz: {
        title: 'Quiz - Python pour la Data Science',
        questions: [
          { text: 'Quelle bibliothèque Python manipule des tableaux de données (DataFrame) ?',
            options: ['NumPy', 'Pandas', 'Matplotlib', 'Django'], correct: 1,
            explanation: 'Pandas fournit la structure DataFrame pour la manipulation de données.' },
          { text: 'Quelle commande importe NumPy sous l\'alias np ?',
            options: ['import numpy as np', 'require(numpy)', 'include numpy', 'use numpy'], correct: 0,
            explanation: 'La convention est import numpy as np.' }
        ]
      }
    },
    {
      title: 'Design d\'interface avec Figma',
      description: 'Concevez des maquettes web et mobiles modernes : wireframes, composants et prototypes cliquables avec Figma.',
      category: 'Design',
      level: 'Debutant',
      chapters: [
        { title: 'Prise en main de Figma', videoIdx: 1,
          lines: ['- Interface : calques, canvas, panneau de propriétés',
            '- Frames, groupes et contraintes',
            '- Outils de dessin : rectangle, texte, plume'] },
        { title: 'Créer un design system', videoIdx: 0,
          lines: ['- Composants réutilisables et variantes',
            '- Couleurs, typographies et espacements cohérents',
            '- Grilles et auto-layout pour un rendu responsive'] }
      ],
      quiz: {
        title: 'Quiz - Design avec Figma',
        questions: [
          { text: 'À quoi sert un composant dans Figma ?',
            options: ['À exporter une image', 'À réutiliser un élément cohérent partout', 'À supprimer un calque', 'À publier un site'],
            correct: 1, explanation: 'Un composant est un élément maître réutilisable dans toutes les maquettes.' },
          { text: 'Quelle fonctionnalité crée une mise en page automatique ?',
            options: ['Auto Layout', 'Grid Lock', 'Frame Fix', 'Smart Move'], correct: 0,
            explanation: 'Auto Layout organise les éléments et gère les espacements automatiquement.' }
        ]
      }
    },
    {
      title: 'Marketing digital & réseaux sociaux',
      description: 'Stratégies de contenu, référencement (SEO) et publicités en ligne pour développer une audience en ligne.',
      category: 'Marketing',
      level: 'Debutant',
      chapters: [
        { title: 'Fondamentaux du marketing digital', videoIdx: 2,
          lines: ['- Les canaux : site web, réseaux sociaux, emailing',
            '- Définir une cible et une proposition de valeur',
            '- Le tunnel de conversion : attirer, convaincre, fidéliser'] },
        { title: 'SEO et réseaux sociaux', videoIdx: 0,
          lines: ['- Référencement naturel : mots-clés, contenu, liens',
            '- Calendrier éditorial et régularité',
            '- Analyser les statistiques et ajuster sa stratégie'] }
      ],
      quiz: {
        title: 'Quiz - Marketing digital',
        questions: [
          { text: 'Que signifie SEO ?',
            options: ['Search Engine Optimization', 'Social Engine Option', 'Secure Email Output', 'Sales Enable Online'],
            correct: 0, explanation: 'Le SEO optimise la visibilité dans les moteurs de recherche.' },
          { text: 'Quel indicateur mesure le taux de conversion ?',
            options: ['Le nombre d\'abonnés', 'Le pourcentage d\'actions réalisées', 'La vitesse du site', 'Le nombre de pages'],
            correct: 1, explanation: 'Le taux de conversion est le pourcentage de visiteurs qui réalisent l\'action visée.' }
        ]
      }
    },
    {
      title: 'Anglais professionnel',
      description: 'Renforcez votre anglais pour les études et le monde du travail : vocabulaire, grammaire et conversations courantes.',
      category: 'Langues',
      level: 'Debutant',
      chapters: [
        { title: 'Se présenter et communiquer', videoIdx: 1,
          lines: ['- Se présenter : name, job, hobbies',
            '- Présent simple et présent continu',
            '- Poser des questions : What, Where, When, Why, How'] },
        { title: 'Vocabulaire professionnel', videoIdx: 0,
          lines: ['- Rédiger un email professionnel',
            '- Mener une réunion : agenda, opinions, synthèse',
            '- Expressions courantes du monde du travail'] }
      ],
      quiz: {
        title: 'Quiz - Anglais professionnel',
        questions: [
          { text: 'Comment dit-on « Je travaille comme développeur » ?',
            options: ['I work like a developer', 'I work as a developer', 'I work like developer', 'I work for a developer'],
            correct: 1, explanation: 'On utilise « as » pour indiquer la fonction : I work as a developer.' },
          { text: 'Quelle formule commence un e-mail professionnel ?',
            options: ['Dear Sir or Madam', 'Hey you', 'Yo', 'See you'], correct: 0,
            explanation: 'Dear Sir or Madam est une formule d\'appel formelle courante.' }
        ]
      }
    },
    {
      title: 'Mathématiques appliquées',
      description: 'Révisez les mathématiques utiles à l\'informatique : logique, suites, matrices et bases des probabilités.',
      category: 'Sciences',
      level: 'Intermediaire',
      chapters: [
        { title: 'Logique et ensembles', videoIdx: 2,
          lines: ['- Propositions, connecteurs : et, ou, non, implication',
            '- Ensembles, appartenance, union et intersection',
            '- Tables de vérité'] },
        { title: 'Suites et matrices', videoIdx: 0,
          lines: ['- Suites arithmétiques et géométriques',
            '- Somme des termes d\'une suite',
            '- Matrices : addition, produit, déterminant'] }
      ],
      quiz: {
        title: 'Quiz - Mathématiques appliquées',
        questions: [
          { text: 'Quelle est la négation de « P et Q » ?',
            options: ['non P et non Q', 'non P ou non Q', 'P ou Q', 'non P ou Q'],
            correct: 1, explanation: 'D\'après De Morgan, non(P et Q) = non P ou non Q.' },
          { text: 'Une suite arithmétique de raison 3 et de premier terme 2 a pour 4e terme :',
            options: ['8', '11', '14', '9'], correct: 1,
            explanation: 'u4 = u1 + (4-1)×3 = 2 + 9 = 11.' }
        ]
      }
    }
  ];

  let chapterSeed = 0;
  for (const c of courses) {
    const [r] = await db.query(
      'INSERT INTO courses (enseignant_id, title, description, category, level) VALUES (?, ?, ?, ?, ?)',
      [enseignant.insertId, c.title, c.description, c.category, c.level]
    );
    const courseId = r.insertId;
    console.log(`  Cours n°${courseId} : ${c.title}`);

    let pos = 1;
    for (const ch of c.chapters) {
      const filename = `cours${courseId}-chapitre${pos}.pdf`;
      await generateSamplePdf(filename, `${ch.title}`, ch.lines);
      await db.query(
        'INSERT INTO chapters (course_id, title, content, position, video_url, pdf_url) VALUES (?, ?, ?, ?, ?, ?)',
        [courseId, ch.title, ch.lines.join('\n'), pos, SAMPLE_VIDEOS[ch.videoIdx], `/uploads/pdfs/${filename}`]
      );
      pos++;
    }

    const [qr] = await db.query('INSERT INTO quizzes (course_id, title) VALUES (?, ?)', [courseId, c.quiz.title]);
    const quizId = qr.insertId;
    for (const q of c.quiz.questions) {
      await db.query(
        'INSERT INTO questions (quiz_id, text, options, correct_index, explanation, points) VALUES (?, ?, ?, ?, ?, 1)',
        [quizId, q.text, JSON.stringify(q.options), q.correct, q.explanation]
      );
    }
    chapterSeed++;
  }

  // --- Données de démonstration pour l'étudiant ---
  // Inscription au cours n°1 avec progression à 100% et un certificat déjà obtenu
  const [firstCourse] = await db.query('SELECT id FROM courses LIMIT 1');
  const courseId = firstCourse[0].id;
  await db.query(
    'INSERT INTO enrollments (user_id, course_id, progress, completed_at) VALUES (?, ?, 100, NOW())',
    [etudiant.insertId, courseId]
  );
  // Inscriptions partielles pour illustrer les graphiques du tableau de bord
  const partials = [[courseId + 4, 35], [courseId + 5, 60]];
  for (const [cid, prog] of partials) {
    await db.query('INSERT INTO enrollments (user_id, course_id, progress) VALUES (?, ?, ?)', [etudiant.insertId, cid, prog]);
  }
  // Cours HTML/CSS terminé à 100% mais certificat non encore généré (démo "Prêt à être délivré")
  const preCid = courseId + 3;
  await db.query('INSERT INTO enrollments (user_id, course_id, progress, completed_at) VALUES (?, ?, 100, NOW())', [etudiant.insertId, preCid]);
  const chaps2 = await db.query('SELECT id, position FROM chapters WHERE course_id = ? ORDER BY position', [preCid]);
  for (const chap of chaps2[0]) {
    await db.query('INSERT INTO chapter_progress (user_id, chapter_id, completed, last_position) VALUES (?, ?, 1, 40)', [etudiant.insertId, chap.id]);
  }
  const [preQuiz] = await db.query('SELECT id FROM quizzes WHERE course_id = ? LIMIT 1', [preCid]);
  for (const sc of [65, 72]) {
    await db.query(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score, answers) VALUES (?, ?, ?, ?)',
      [etudiant.insertId, preQuiz[0].id, sc, JSON.stringify([0, 1])]
    );
  }
  const chaps = await db.query('SELECT id, position FROM chapters WHERE course_id = ? ORDER BY position', [courseId]);
  for (const chap of chaps[0]) {
    await db.query(
      'INSERT INTO chapter_progress (user_id, chapter_id, completed, last_position) VALUES (?, ?, 1, 60)',
      [etudiant.insertId, chap.id]
    );
  }
  const [anQuiz] = await db.query('SELECT id FROM quizzes WHERE course_id = ? LIMIT 1', [courseId]);
  const history = [55, 62, 68, 74, 80];
  let day = 28;
  for (const sc of history) {
    await db.query(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score, answers, submitted_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))',
      [etudiant.insertId, anQuiz[0].id, sc, JSON.stringify([2, 0, 1]), day]
    );
    day -= 7;
  }
  await db.query(
    "INSERT INTO certificates (user_id, course_id, code, grade) VALUES (?, ?, ?, 'Tres Bien')",
    [etudiant.insertId, courseId, `CHA-2026-${String(etudiant.insertId).padStart(4, '0')}-${String(courseId).padStart(2, '0')}`]
  );
  await db.query(
    "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'success')",
    [etudiant.insertId, 'Félicitations ! Votre certificat pour « Introduction au JavaScript » est disponible dans votre tableau de bord.']
  );
  console.log('  Démo étudiant : cours n°1 terminé (historique de notes 55→80), HTML/CSS prêt au certificat, 2 cours en cours, certificat généré.');

  console.log('\n[Terminé] La base de données est prête.');
  console.log('Comptes de démonstration :');
  console.log('  Étudiant   : etudiant@choukrapp.mg  / Etudiant123');
  console.log('  Enseignant : enseignant@choukrapp.mg / Enseignant123');
  console.log('  Admin      : admin@choukrapp.mg     / Admin123');
}

(async () => {
  try {
    console.log('=== Initialisation de la base ChoukrApp Academie ===\n');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');

    // 1) Connexion "administrative" (sans base) pour créer la base
    const adminConn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      ...(config.dbSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    // 2) Création de la base + tables
    await adminConn.query(schema);
    console.log('[OK] Base + tables créées/vérifiées.');

    // 3) Seed uniquement si la base est vide
    const [[{ count }]] = await adminConn.query('SELECT COUNT(*) AS count FROM users');
    if (count === 0) {
      await seed(adminConn);
    } else {
      const [[{ n }]] = await adminConn.query('SELECT COUNT(*) AS n FROM courses');
      console.log(`[SKIP] Base déjà initialisée (${count} utilisateur(s), ${n} cours). Relancez avec "DROP DATABASE choukrapp_db;" pour repartir de zéro.`);
    }

    await adminConn.end();
  } catch (err) {
    console.error('[ERREUR]', err.message);
    console.error('Vérifiez que MySQL est démarré (WAMP/XAMPP) et que les identifiants du fichier .env sont corrects.');
    process.exit(1);
  }
})();