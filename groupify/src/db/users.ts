import { getDBConnection } from '@/lib/db'; // Adjust the import path as needed
import bcrypt from 'bcryptjs';

export async function findByUsername(username: string) {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

export async function findById(id: string) {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

export async function register(username: string, password: string) {
  const conn = await getDBConnection();
  try {
    const result = await conn.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, password]
    );
    return { id: result.insertId, username };
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}
