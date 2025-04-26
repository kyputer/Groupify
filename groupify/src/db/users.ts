import { getDBConnection } from '@/lib/db'; // Adjust the import path as needed
import bcrypt from 'bcryptjs';

export async function findByUsername(username: string) {
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ?;', [username]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}

export async function register(username: string, password: string) {
  let conn;
  try {
    const hash = bcrypt.hashSync(password, 8);
    conn = await getDBConnection();
    const result = await conn.query('INSERT INTO users (username, password_hash) VALUES (?, ?);', [username, hash]);
    return { id: result.insertId, username };
  } catch (err) {
    console.error('Database error during registration:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}
