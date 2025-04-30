import { getDBConnection } from '@/lib/db';

interface Playlist {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  createdBy: string;
  isPublic: boolean;
}

export async function createPlaylist(
  name: string,
  createdBy: number,
  isPublic: boolean
): Promise<Playlist> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [createdBy]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${createdBy} does not exist.`);
    }

    const code = generateCode();
    const result = await conn.query(
      `INSERT INTO playlists (name, code, created_at, created_by, is_public)
       VALUES (?, ?, NOW(), ?, ?)`,
      [name, code, createdBy, isPublic]
    );

    return {
      id: result.insertId.toString(), // Convert BigInt to string
      name,
      code,
      createdAt: new Date().toISOString(),
      createdBy: createdBy.toString(), // Convert BigInt to string
      isPublic,
    };
  } catch (error) {
    console.error('Error creating playlist in database:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function getPlaylists(): Promise<Playlist[]> {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query(`SELECT * FROM playlists ORDER BY created_at DESC`);
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      createdBy: row.created_by,
      isPublic: row.is_public === 1,
    }));
  } finally {
    conn.release();
  }
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}