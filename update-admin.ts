import Database from 'better-sqlite3';

const db = new Database('nexusdist.db');

try {
  const info = db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE role = ? OR username = ?').run(
    'admin', 
    '$2b$10$MXOmHiesCujGq.Uj6LQDBusEET7UpIWlh4zx4y6.bOF/uXLdrmZ5a', 
    'admin',
    'admin.nexus'
  );
  console.log('Admin user updated rows:', info.changes);
} catch(e) {
  console.error(e);
}
