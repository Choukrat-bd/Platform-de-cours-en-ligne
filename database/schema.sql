-- =====================================================================
--  ChoukrApp Academie - Plateforme de cours en ligne (Thème 2)
--  Schéma de la base de données MySQL
--  Université Privée Hay (UPH) - L1 S2 V2 - Programmation JavaScript
-- =====================================================================

CREATE DATABASE IF NOT EXISTS choukrapp_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE choukrapp_db;

-- ---------------------------------------------------------------------
-- TABLE users : comptes étudiants / enseignants / administrateurs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('etudiant','enseignant','admin') NOT NULL DEFAULT 'etudiant',
  bio           VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE courses : catalogue des cours
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  level         ENUM('Debutant','Intermediaire','Avance') DEFAULT 'Debutant',
  image         VARCHAR(255) DEFAULT NULL,
  is_published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_teacher FOREIGN KEY (enseignant_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE chapters : organisation des cours en chapitres
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapters (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  course_id  INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    TEXT,
  position   INT NOT NULL DEFAULT 0,
  video_url  VARCHAR(255) DEFAULT NULL,
  pdf_url    VARCHAR(255) DEFAULT NULL,
  CONSTRAINT fk_chapters_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE enrollments : inscriptions des étudiants aux cours
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  course_id    INT NOT NULL,
  progress     FLOAT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (user_id, course_id),
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE chapter_progress : suivi détaillé par chapitre (vidéo + terminé)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapter_progress (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  chapter_id   INT NOT NULL,
  completed    TINYINT(1) NOT NULL DEFAULT 0,
  last_position FLOAT NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chapter_progress (user_id, chapter_id),
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE quizzes : évaluations rattachées aux cours
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  course_id  INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE questions : questions des quiz (QCM)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id       INT NOT NULL,
  text          TEXT NOT NULL,
  options       JSON NOT NULL,
  correct_index INT NOT NULL,
  explanation   TEXT DEFAULT NULL,
  points        INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE quiz_attempts : tentatives + correction automatique (notes)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  quiz_id      INT NOT NULL,
  score        FLOAT NOT NULL,
  answers      JSON DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE certificates : certificats de réussite (PDF)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  course_id  INT NOT NULL,
  code       VARCHAR(50) NOT NULL UNIQUE,
  grade      VARCHAR(20) DEFAULT NULL,
  issued_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE notifications : système de notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) DEFAULT 'info',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;