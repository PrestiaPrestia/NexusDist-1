-- NexusDist Data Migration Script (SQLite to Postgres)

SET session_replication_role = 'replica';

-- Data for users
TRUNCATE TABLE users CASCADE;
INSERT INTO users (id, username, password_hash, role, full_name, created_at) VALUES (1, 'admin', '$2b$10$MXOmHiesCujGq.Uj6LQDBusEET7UpIWlh4zx4y6.bOF/uXLdrmZ5a', 'admin', 'Administrador Sistema', '2026-04-20 01:19:46');
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));

-- Data for currencies
TRUNCATE TABLE currencies CASCADE;
INSERT INTO currencies (code, name, symbol, is_main) VALUES ('USD', 'Dólar Estadounidense', '$', TRUE);
INSERT INTO currencies (code, name, symbol, is_main) VALUES ('PEN', 'Sol Peruano', 'S/', FALSE);

-- Data for exchange_rates
TRUNCATE TABLE exchange_rates CASCADE;
INSERT INTO exchange_rates (id, from_currency, to_currency, rate, updated_at) VALUES (1, 'USD', 'PEN', 3.75, '2026-04-20 01:19:46');
SELECT setval(pg_get_serial_sequence('exchange_rates', 'id'), (SELECT MAX(id) FROM exchange_rates));

-- Data for categories
TRUNCATE TABLE categories CASCADE;
INSERT INTO categories (id, name) VALUES (1, 'Bebidas');
INSERT INTO categories (id, name) VALUES (2, 'Alimentos');
INSERT INTO categories (id, name) VALUES (3, 'Limpieza');
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories));

-- Data for warehouses
TRUNCATE TABLE warehouses CASCADE;
INSERT INTO warehouses (id, name, location) VALUES (1, 'Almacén Central', 'Sede Principal');
SELECT setval(pg_get_serial_sequence('warehouses', 'id'), (SELECT MAX(id) FROM warehouses));

-- Data for products
TRUNCATE TABLE products CASCADE;
INSERT INTO products (id, code, name, category_id, price, min_stock, unit) VALUES (1, 'BEB-001', 'Gaseosa 1.5L', 1, 5.5, 10, 'unidad');
INSERT INTO products (id, code, name, category_id, price, min_stock, unit) VALUES (2, 'ALM-002', 'Arroz 5kg', 2, 18.2, 5, 'unidad');
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products));

-- Data for inventory
TRUNCATE TABLE inventory CASCADE;
INSERT INTO inventory (product_id, warehouse_id, stock) VALUES (1, 1, 98);
INSERT INTO inventory (product_id, warehouse_id, stock) VALUES (2, 1, 46);

-- Data for clients
TRUNCATE TABLE clients CASCADE;
INSERT INTO clients (id, document_id, name, email, phone, address, created_at) VALUES (1, '20123456789', 'Cliente General', 'ventas@nexus.com', '01-234-5678', 'Av. Principal 123', '2026-04-20 01:19:46');
SELECT setval(pg_get_serial_sequence('clients', 'id'), (SELECT MAX(id) FROM clients));

-- Data for sales
TRUNCATE TABLE sales CASCADE;
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (1, 'boleta', 'DOC-1776650110620', 1, 1, 'USD', 1, 18.2, 3.276, 'completed', '2026-04-20 01:55:10');
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (2, 'boleta', 'DOC-1776650204323', 1, 1, 'USD', 1, 18.2, 3.276, 'completed', '2026-04-20 01:56:44');
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (3, 'boleta', 'DOC-1776650287418', 1, 1, 'USD', 1, 5.5, 0.99, 'completed', '2026-04-20 01:58:07');
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (4, 'boleta', 'DOC-1776650338783', 1, 1, 'USD', 1, 5.5, 0.99, 'completed', '2026-04-20 01:58:58');
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (5, 'boleta', 'DOC-1776650523848', 1, 1, 'USD', 1, 18.2, 3.276, 'completed', '2026-04-20 02:02:03');
INSERT INTO sales (id, doc_type, doc_number, client_id, seller_id, currency_code, exchange_rate, total, tax, status, created_at) VALUES (6, 'boleta', 'DOC-1776650564545', 1, 1, 'USD', 1, 18.2, 3.276, 'completed', '2026-04-20 02:02:44');
SELECT setval(pg_get_serial_sequence('sales', 'id'), (SELECT MAX(id) FROM sales));

-- Data for sale_items
TRUNCATE TABLE sale_items CASCADE;
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (1, 1, 2, 1, 18.2, 18.2);
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (2, 2, 2, 1, 18.2, 18.2);
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (3, 3, 1, 1, 5.5, 5.5);
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (4, 4, 1, 1, 5.5, 5.5);
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (5, 5, 2, 1, 18.2, 18.2);
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (6, 6, 2, 1, 18.2, 18.2);
SELECT setval(pg_get_serial_sequence('sale_items', 'id'), (SELECT MAX(id) FROM sale_items));

-- Data for cash_flow
TRUNCATE TABLE cash_flow CASCADE;
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (1, 'income', 18.2, 'USD', 'Venta DOC-1776650110620', 1, '2026-04-20 01:55:10');
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (2, 'income', 18.2, 'USD', 'Venta DOC-1776650204323', 1, '2026-04-20 01:56:44');
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (3, 'income', 5.5, 'USD', 'Venta DOC-1776650287418', 1, '2026-04-20 01:58:07');
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (4, 'income', 5.5, 'USD', 'Venta DOC-1776650338783', 1, '2026-04-20 01:58:58');
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (5, 'income', 18.2, 'USD', 'Venta DOC-1776650523848', 1, '2026-04-20 02:02:03');
INSERT INTO cash_flow (id, type, amount, currency_code, description, user_id, created_at) VALUES (6, 'income', 18.2, 'USD', 'Venta DOC-1776650564545', 1, '2026-04-20 02:02:44');
SELECT setval(pg_get_serial_sequence('cash_flow', 'id'), (SELECT MAX(id) FROM cash_flow));

SET session_replication_role = 'origin';
