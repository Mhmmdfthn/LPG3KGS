CREATE TABLE users (
  id uuid PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE CHECK (username = lower(username)),
  email varchar(254) UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  name varchar(120) NOT NULL,
  business_name varchar(120),
  contact varchar(30) NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','karyawan','pengecer')),
  status text NOT NULL CHECK (status IN ('PENDING','ACTIVE','REJECTED','INACTIVE')),
  rejection_reason varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE TABLE auth_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts > 0),
  reset_at timestamptz NOT NULL
);
CREATE TABLE products (
  id uuid PRIMARY KEY,
  name varchar(120) NOT NULL,
  size_kg numeric(5,2) NOT NULL CHECK (size_kg > 0),
  price integer NOT NULL CHECK (price >= 0),
  minimum_stock integer NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE inventory (
  product_id uuid PRIMARY KEY REFERENCES products(id),
  full_qty integer NOT NULL DEFAULT 0 CHECK (full_qty >= 0),
  empty_qty integer NOT NULL DEFAULT 0 CHECK (empty_qty >= 0),
  reserved_qty integer NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0 AND reserved_qty <= full_qty)
);
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  retailer_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'MENUNGGU_KONFIRMASI' CHECK (status IN ('MENUNGGU_KONFIRMASI','DIKONFIRMASI','DITOLAK','DIBATALKAN','SELESAI')),
  total integer NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_retailer_date_idx ON orders(retailer_id,created_at);
CREATE INDEX orders_status_date_idx ON orders(status,created_at);
CREATE TABLE order_items (
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  subtotal integer NOT NULL CHECK (subtotal >= 0 AND subtotal = quantity::bigint * unit_price),
  PRIMARY KEY (order_id,product_id)
);
CREATE TABLE order_history (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  status text NOT NULL,
  reason varchar(500),
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sales (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  order_id uuid UNIQUE REFERENCES orders(id),
  retailer_id uuid REFERENCES users(id),
  source text NOT NULL CHECK (source IN ('ORDER','DIRECT')),
  payment_type text NOT NULL CHECK (payment_type IN ('TUNAI','BON')),
  total integer NOT NULL CHECK (total >= 0),
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source = 'ORDER' AND order_id IS NOT NULL AND retailer_id IS NOT NULL) OR
         (source = 'DIRECT' AND order_id IS NULL AND retailer_id IS NULL AND payment_type = 'TUNAI'))
);
CREATE INDEX sales_retailer_date_idx ON sales(retailer_id,created_at);
CREATE INDEX sales_date_idx ON sales(created_at);
CREATE TABLE sale_items (
  sale_id uuid NOT NULL REFERENCES sales(id),
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  empty_returned integer NOT NULL CHECK (empty_returned >= 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  subtotal integer NOT NULL CHECK (subtotal >= 0 AND subtotal = quantity::bigint * unit_price),
  PRIMARY KEY (sale_id,product_id)
);
CREATE TABLE payments (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  sale_id uuid NOT NULL REFERENCES sales(id),
  amount integer NOT NULL CHECK (amount > 0),
  method varchar(50) NOT NULL,
  note varchar(500),
  paid_at timestamptz NOT NULL,
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_sale_idx ON payments(sale_id);
CREATE INDEX payments_date_idx ON payments(paid_at);
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  type text NOT NULL CHECK (type IN ('RECEIPT','ADJUSTMENT','RESERVE','RELEASE','SALE')),
  full_delta integer NOT NULL,
  empty_delta integer NOT NULL,
  reserved_delta integer NOT NULL,
  before_full integer NOT NULL,
  before_empty integer NOT NULL,
  before_reserved integer NOT NULL,
  after_full integer NOT NULL CHECK (after_full >= 0),
  after_empty integer NOT NULL CHECK (after_empty >= 0),
  after_reserved integer NOT NULL CHECK (after_reserved >= 0 AND after_reserved <= after_full),
  reference_id uuid NOT NULL,
  reason varchar(500),
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_date_idx ON stock_movements(product_id,created_at);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_date_idx ON audit_logs(created_at);
CREATE TABLE idempotency_keys (
  actor_id uuid NOT NULL REFERENCES users(id),
  scope text NOT NULL,
  key varchar(128) NOT NULL,
  request_hash text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id,scope,key)
);
CREATE VIEW sale_balances AS
SELECT s.*, COALESCE(p.paid,0)::integer AS paid,
  (s.total - COALESCE(p.paid,0))::integer AS balance,
  CASE WHEN s.total = COALESCE(p.paid,0) THEN 'LUNAS'
       WHEN COALESCE(p.paid,0) = 0 THEN 'BELUM_DIBAYAR'
       ELSE 'DIBAYAR_SEBAGIAN' END AS payment_status
FROM sales s LEFT JOIN (SELECT sale_id,sum(amount) AS paid FROM payments GROUP BY sale_id) p ON p.sale_id=s.id;
