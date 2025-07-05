// src/utils/migration.util.ts
// Migration runner utility (placeholder)

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { databaseConfig } from '../config/database.config';

dotenv.config();

export const connectToDatabase = async () => {
  const client = new Client(databaseConfig);
  await client.connect();
  return client;
};

export const runMigrations = async () => {
  const client = await connectToDatabase();
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    if (sql.trim()) {
      console.log(`Running migration: ${file}`);
      await client.query(sql);
    }
  }
  await client.end();
  console.log('All migrations complete.');
}; 