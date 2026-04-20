-- NexusDist Supabase Schema (PostgreSQL)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'vendedor', 'cajero')) NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency TEXT REFERENCES currencies(code),
    to_currency TEXT REFERENCES currencies(code),
    rate NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    location TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price NUMERIC NOT NULL,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'unidad'
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER REFERENCES products(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    stock INTEGER DEFAULT 0,
    PRIMARY KEY(product_id, warehouse_id)
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    document_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    doc_type TEXT NOT NULL, -- 'factura', 'boleta'
    doc_number TEXT UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    seller_id INTEGER REFERENCES users(id),
    currency_code TEXT REFERENCES currencies(code),
    exchange_rate NUMERIC DEFAULT 1.0,
    total NUMERIC NOT NULL,
    tax NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL
);

-- Cash Flow
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC NOT NULL,
    currency_code TEXT REFERENCES currencies(code),
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) is recommended for production, 
-- but for initial migration we leave it open or handle via service role.
