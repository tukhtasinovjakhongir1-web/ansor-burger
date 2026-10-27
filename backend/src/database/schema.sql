-- Ansor Burger — PostgreSQL (Neon) sxemasi
-- Qayta ishga tushirish xavfsiz: hamma jadval IF NOT EXISTS bilan yaratiladi.

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT,
  image       TEXT,
  sort        INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INT NOT NULL DEFAULT 0,
  old_price     INT,
  image         TEXT,
  price_note    TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort          INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zones (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  fee         INT NOT NULL DEFAULT 0,
  min_order   INT NOT NULL DEFAULT 0,
  eta_min     INT NOT NULL DEFAULT 40,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort        INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  telegram_id   BIGINT UNIQUE,
  first_name    TEXT,
  last_name     TEXT,
  username      TEXT,
  phone         TEXT,
  is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  telegram_id  BIGINT PRIMARY KEY,
  name         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  user_id          INT REFERENCES users(id) ON DELETE SET NULL,
  telegram_id      BIGINT,
  customer_name    TEXT NOT NULL,
  phone            TEXT NOT NULL,
  order_type       TEXT NOT NULL DEFAULT 'delivery',   -- delivery | pickup | dinein
  zone_id          INT,
  zone_name        TEXT,
  address          TEXT,
  landmark         TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  scheduled_at     TIMESTAMPTZ,                        -- NULL = imkon qadar tez
  guests           INT,
  payment_method   TEXT NOT NULL DEFAULT 'cash',       -- cash | card
  payment_status   TEXT NOT NULL DEFAULT 'unpaid',     -- unpaid | paid
  change_from      INT,
  subtotal         INT NOT NULL DEFAULT 0,
  delivery_fee     INT NOT NULL DEFAULT 0,
  total            INT NOT NULL DEFAULT 0,
  comment          TEXT,
  status           TEXT NOT NULL DEFAULT 'new',        -- new | accepted | cooking | ready | delivering | done | cancelled
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_idx  ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx   ON orders (status);
CREATE INDEX IF NOT EXISTS orders_tg_idx       ON orders (telegram_id);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  price       INT NOT NULL,
  qty         INT NOT NULL,
  total       INT NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS settings (
  id    INT PRIMARY KEY DEFAULT 1,
  data  JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS images (
  id          SERIAL PRIMARY KEY,
  mime        TEXT NOT NULL,
  data        BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
