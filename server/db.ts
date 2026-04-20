import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('nexusdist.db');
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'vendedor', 'cajero')) NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_main INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_currency) REFERENCES currencies(code),
    FOREIGN KEY(to_currency) REFERENCES currencies(code)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER,
    price REAL NOT NULL,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'unidad',
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER,
    warehouse_id INTEGER,
    stock INTEGER DEFAULT 0,
    PRIMARY KEY(product_id, warehouse_id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_type TEXT NOT NULL, -- 'factura', 'boleta'
    doc_number TEXT UNIQUE NOT NULL,
    client_id INTEGER,
    seller_id INTEGER,
    currency_code TEXT NOT NULL,
    exchange_rate REAL DEFAULT 1.0,
    total REAL NOT NULL,
    tax REAL NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(currency_code) REFERENCES currencies(code)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS cash_flow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount REAL NOT NULL,
    currency_code TEXT NOT NULL,
    description TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(currency_code) REFERENCES currencies(code)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  // admin / admin
  db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name)
    VALUES (?, ?, ?, ?)
  `).run('admin', '$2b$10$MXOmHiesCujGq.Uj6LQDBusEET7UpIWlh4zx4y6.bOF/uXLdrmZ5a', 'admin', 'Administrador Sistema');

  db.prepare("INSERT INTO currencies (code, name, symbol, is_main) VALUES ('USD', 'Dólar Estadounidense', '$', 1)").run();
  db.prepare("INSERT INTO currencies (code, name, symbol, is_main) VALUES ('PEN', 'Sol Peruano', 'S/', 0)").run();
  db.prepare("INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES ('USD', 'PEN', 3.75)").run();
  
  db.prepare("INSERT INTO warehouses (name, location) VALUES ('Almacén Central', 'Sede Principal')").run();
  db.prepare("INSERT INTO categories (name) VALUES ('Bebidas'), ('Alimentos'), ('Limpieza')").run();
  db.prepare("INSERT INTO clients (document_id, name, email, phone, address) VALUES ('20123456789', 'Cliente General', 'ventas@nexus.com', '01-234-5678', 'Av. Principal 123')").run();
  
  // Seed some products too
  const cat1 = db.prepare("SELECT id FROM categories WHERE name = 'Bebidas'").get() as any;
  db.prepare("INSERT INTO products (code, name, category_id, price, min_stock) VALUES ('BEB-001', 'Gaseosa 1.5L', ?, 5.50, 10)").run(cat1.id);
  db.prepare("INSERT INTO products (code, name, category_id, price, min_stock) VALUES ('ALM-002', 'Arroz 5kg', 2, 18.20, 5)").run();
  
  const prod1 = db.prepare("SELECT id FROM products WHERE code = 'BEB-001'").get() as any;
  db.prepare("INSERT INTO inventory (product_id, warehouse_id, stock) VALUES (?, 1, 100)").run(prod1.id);
  db.prepare("INSERT INTO inventory (product_id, warehouse_id, stock) VALUES (2, 1, 50)").run();
}

export default db;
