import { getDBConnection } from './db';
import bcrypt from 'bcryptjs';

export async function findUserByUsername(username: string) {
  const conn = await getDBConnection();
  try {
    const [user] = await conn.query('SELECT * FROM users WHERE username = ?;', [username]);
    return user || null;
  } catch (err) {
    console.error('Database error during findUserByUsername:', err);
    throw err;
  } finally {
    if (conn) {
      await conn.release();
    }
  }
}

export async function registerUser(username: string, password: string) {
  console.log(`Registering user: ${username}`);
  const hash = bcrypt.hashSync(password, 8);
  const conn = await getDBConnection();

  try {
    const result = await conn.query('INSERT INTO users (username, password_hash) VALUES (?, ?);', [username, hash]);
    const userId = result.insertId; // Get the ID of the newly inserted user
    const [user] = await conn.query('SELECT * FROM users WHERE id = ?;', [userId]); // Retrieve the full user object
    return user;
  } catch (err) {
    console.error('Database error during user registration:', err);
    throw err;
  } finally {
    if (conn) {
      await conn.release();
    }
  }
}

export async function findUserById(userId: number): Promise<any | null> {
  if (!userId || isNaN(userId)) {
    console.error('Invalid userId:', userId);
    return null;
  }

  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM users WHERE id = ?', [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Error finding user by ID:', err);
    return null;
  } finally {
    if (conn) await conn.release();
  }
}