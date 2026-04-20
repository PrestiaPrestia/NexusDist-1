import db from './server/db';
import { supabase } from './server/supabase';

async function migrate() {
  console.log('--- Iniciando Migración a Supabase ---');

  const tables = [
    'users',
    'currencies',
    'categories',
    'warehouses',
    'products',
    'inventory',
    'clients'
  ];

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`Tabla ${table} vacía, saltando...`);
        continue;
      }

      console.log(`Migrando ${rows.length} filas de la tabla ${table}...`);
      
      // Clean up for Postgres types
      const cleanedRows = rows.map((row: any) => {
        const newRow = { ...row };
        // SQLite 0/1 to Boolean
        if (table === 'currencies' && newRow.is_main !== undefined) {
           newRow.is_main = !!newRow.is_main;
        }
        return newRow;
      });

      const { error } = await supabase.from(table).upsert(cleanedRows);
      
      if (error) {
        console.error(`Error en tabla ${table}:`, error.message);
      } else {
        console.log(`Tabla ${table} migrada correctamente.`);
      }
    } catch (e: any) {
      console.error(`Fallo crítico en ${table}:`, e.message);
    }
  }

  console.log('--- Migración Finalizada ---');
}

migrate();
