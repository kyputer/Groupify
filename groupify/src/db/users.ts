import { getDBConnection } from '@/lib/db'; // Adjust the import path as needed
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  username: string;
  password_hash: string;
  // Add other fields as needed
}

export async function findByUsername(username: string) {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [
      username,
    ]);
    return rows[0];
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}

export async function findById(userId: string): Promise<User | null> {
  let conn;
  try {
    conn = await getDBConnection();
    // Ensure proper type conversion: string session ID -> number for database
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      console.error('Invalid user ID format:', userId);
      return null;
    }

    const rows = await conn.query('SELECT * FROM users WHERE id = ?', [
      numericUserId,
    ]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Database error in findById:', err);
    return null;
  } finally {
    if (conn) await conn.release();
  }
}

export async function register(username: string, password: string) {
  const conn = await getDBConnection();
  try {
    const hash = bcrypt.hashSync(password, 8);
    const result = await conn.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );
    return { id: result.insertId, username };
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}
