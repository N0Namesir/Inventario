-- ============================================================
--  Fastech Inventario — Schema de base de datos
--  Motor: MariaDB 10.6+ / MySQL 8+
--  Ejecutar: mariadb -u root -p fastech_db < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS fastech_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fastech_db;

-- ─── USUARIOS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           ENUM('superadmin','admin','cliente') NOT NULL DEFAULT 'cliente',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTOS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS productos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(200)   NOT NULL,
  marca       VARCHAR(100),
  precio      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  stock       INT            NOT NULL DEFAULT 0,
  descripcion TEXT,
  imagen_url  VARCHAR(255)
);

-- ─── TAGS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tags (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  tipo   ENUM('categoria','temporal') NOT NULL
);

-- ─── RELACIÓN PRODUCTOS ↔ TAGS ─────────────────────────────

CREATE TABLE IF NOT EXISTS producto_tags (
  producto_id INT NOT NULL,
  tag_id      INT NOT NULL,
  PRIMARY KEY (producto_id, tag_id),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)      REFERENCES tags(id)      ON DELETE CASCADE
);

-- ─── ÓRDENES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ordenes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT           NOT NULL,
  total      DECIMAL(10,2) NOT NULL,
  estado     ENUM('pendiente','completada','cancelada') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── ITEMS DE ÓRDENES ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS orden_items (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  orden_id         INT           NOT NULL,
  producto_id      INT           NOT NULL,
  nombre_producto  VARCHAR(200)  NOT NULL,
  cantidad         INT           NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orden_id)    REFERENCES ordenes(id)   ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
