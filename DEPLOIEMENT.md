# Deploiement en ligne - ChoukrApp Academie

Ce projet se deploie sur **Render** (hebergement Node.js) avec une base de donnees **MySQL chez Aiven** (base gratuite/essai). Le code est deja sur GitHub :

- Depot : `https://github.com/Choukrat-bd/Platform-de-cours-en-ligne`
- Branche : `main`

L'application lit soit les variables classiques `DB_HOST/DB_USER/...`, soit une URL complete de connexion MySQL via `DATABASE_URL` (utilisee en ligne). Le SSL est active via `MYSQL_SSL=true` (obligatoire pour Aiven).

---

## Etape 1 - Creer la base MySQL dans Aiven

1. Creez un compte sur https://console.aiven.io (etape de verification par email requise).
2. Bouton **Add service** > **MySQL** (vous pouvez tester avec l'offre d'essai / une petite offre).
3. Region proche de vous, stabilisez le service.
4. Ouvrez le service MySQL : onglet **Overview**, section **Connection information**.
5. Ouvrez la **Service URI** : elle a la forme
   `mysql://avnadmin:MOT_DE_PASSE@nom-projet-aiven-xxxx.aivencloud.com:PORT/NOM_BASE`
   Gardez-la : elle servira de `DATABASE_URL`.
6. Creez la base (le nom par defaut de la base est souvent `defaultdb` ; le casse du nom est importante). Si besoin, renommez la base dans l'URI, ou creez-la avec l'utilisateur par defaut.

> Pour un projet d'examen, la base Aiven en formule d'essai suffit largement.

---

## Etape 2 - Initialiser les tables et les donnees de demo

Chaque requete sur la base distante doit passer par SSL (l'application le gere avec `MYSQL_SSL=true`).

Depuis ce dossier local, avec les variables d'environnement pointees sur Aiven :

```powershell
$env:DATABASE_URL="mysql://avnadmin:MOT_DE_PASSE@NOM-PROJET-aiven.aivencloud.com:PORT/NOM_BASE"
$env:MYSQL_SSL="true"
node scripts/init-db.js
```

La commande cree le schema (`database/schema.sql`) puis insere les 9 cours, les chapitres, les quiz et les comptes de demonstration :

| Role | Email | Mot de passe |
| ----- | ------- | ------------ |
| Etudiant | etudiant@choukrapp.mg | Etudiant123 |
| Enseignant | enseignant@choukrapp.mg | Enseignant123 |
| Admin | admin@choukrapp.mg | Admin123 |

> Variante : vous pouvez aussi importer `database/schema.sql` avec un client MySQL (mysql, DBeaver) puis relancer le seed.

---

## Etape 3 - Deployer l'application sur Render

1. Comptes sur https://render.com (connexion avec GitHub recommande).
2. **New** > **Web Service** > connectez le depot `Choukrat-bd/Platform-de-cours-en-ligne`.
3. Configuration :
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free
4. Onglet **Environment** (a cree apres la premiere generique, sinon avant creation), ajoutez :

   | Cle | Valeur |
   | --- | ------ |
   | `DATABASE_URL` | la Service URI Aiven (etape 1) |
   | `MYSQL_SSL` | `true` |
   | `SESSION_SECRET` | une longue cle aleatoire (ex. `choukrapp_secret_2026_super_longue`) |
   | `BASE_URL` | `https://NOM-DE-VOTRE-APP.onrender.com` |
   | `NODE_VERSION` | `20` |

5. **Deploy Web Service**. Le premier build installe les dependances (`bcrypt`, `mysql2`, `pdfkit`, `multer`...).
6. A la fin du deploiement, l'application est disponible sur `https://NOM-DE-VOTRE-APP.onrender.com`.

> Si le port change, Render injecte automatiquement `PORT` : le fichier `config/config.js` le respecte (`SERVER_PORT` ou `process.env.PORT`).

---

## Etape 4 - Verifier

1. Ouvrir `https://NOM-DE-VOTRE-APP.onrender.com` : la page d'accueil doit s'afficher.
2. Se connecter avec `etudiant@choukrapp.mg` / `Etudiant123` : catalogue, cours, quiz, tableau de bord.
3. Tester la page **Certificats** : un cours a 100 % + moyenne >= 60 est "pret", le certificat PDF se telecharge et se verifie avec son code.
4. Consulter les logs Render si besoin (onglet **Logs**) : erreurs de connexion base, seeds manquants, etc.

---

## Limitations connues en deploiement

- **Disque ephemere** : sur le plan gratuit de Render, les fichiers se perdent au redemarrage (uploads, certificats generes, images deposees par les enseignants). Les certificats sauvegardes dans la table `certificates` (et leurs codes) restent valides ; les PDF sont regenerables depuis la base.
- **Seed de nouveau** apres un redeploiement si la base est vide : relancez `node scripts/init-db.js` en local, pointe vers la base Aiven.
- En cas d'arrivée sur un plan payant Render, vous pouvez monter un **disque** ou basculer les fichiers sur un stockage objet (hors perimetre de la demonstration).

---

## Rappel de securite

Le fichier `.env` local n'est jamais envoye sur GitHub (il est dans `.gitignore`). Tous les secrets (base, session) sont passes via les variables d'environnement du dashboard Render.