import db from './server/db.ts';
import fs from 'fs';

const tables = [
  'users', 
  'currencies', 
  'exchange_rates', 
  'categories', 
  'warehouses', 
  'products', 
  'inventory', 
  'clients', 
  'sales', 
  'sale_items', 
  'cash_flow'
];

let sql = '-- NexusDist Data Migration Script (SQLite to Postgres)\n\n';

// Disable triggers/constraints temporarily for clean import
sql += 'SET session_replication_role = \'replica\';\n\n';

tables.forEach(table => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) return;

    sql += `-- Data for ${table}\n`;
    sql += `TRUNCATE TABLE ${table} CASCADE;\n`;
    
    rows.forEach(row => {
      const columns = Object.keys(row);
      const values = Object.values(row).map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val;
      });

      // Special case for SQLite booleans stored as 0/1
      if (table === 'currencies' && row.is_main !== undefined) {
          const mainIdx = columns.indexOf('is_main');
          values[mainIdx] = row.is_main ? 'TRUE' : 'FALSE';
      }

      sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    });
    
    // Reset sequences after manual ID inserts
    if (table !== 'currencies' && table !== 'inventory') {
        sql += `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}));\n`;
    }
    sql += '\n';
  } catch (e) {
    console.error(`Error processing ${table}:`, e.message);
  }
});

sql += 'SET session_replication_role = \'origin\';\n';

fs.writeFileSync('supabase_data.sql', sql);
console.log('Migration data file created: supabase_data.sql');
