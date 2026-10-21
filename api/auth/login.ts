import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const client = await pool.connect();
    
    // Check if admin table exists, if not create it on the fly
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Check if default admin exists
    const adminCheck = await client.query('SELECT * FROM admin WHERE username = $1', [username]);

    if (adminCheck.rows.length === 0 && username === 'admin') {
      // Seed default admin if missing
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);
      const now = new Date().toISOString();
      await client.query(
        'INSERT INTO admin (username, password_hash, updated_at) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        ['admin', hash, now]
      );
    }

    const result = await client.query('SELECT * FROM admin WHERE username = $1', [username]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const admin = result.rows[0];
    const isValid = bcrypt.compareSync(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return res.status(200).json({ 
      token, 
      user: { username: admin.username } 
    });

  } catch (err: any) {
    console.error('Login Serverless Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message || String(err) 
    });
  }
}
