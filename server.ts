import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Ensure tables exist in Supabase
export async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default admin if missing
  const adminCheck = await query('SELECT id FROM admin LIMIT 1');
  if (adminCheck.rows.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    const now = new Date().toISOString();
    await query(
      'INSERT INTO admin (username, password_hash, updated_at) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
      ['admin', hash, now]
    );
  }
}

initSchema().catch(console.error);
