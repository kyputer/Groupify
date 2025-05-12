import { getDBConnection } from '@/lib/db';
import { Playlist } from '@/interfaces/Playlist';

const playlists = {
  createPlaylist,
  getPlaylists,
  getPlaylistID,
  joinPlaylist,
  leavePlaylist
}

export async function createPlaylist(
  name: string,
  createdBy: string,
  isPublic: boolean,
  code: string
): Promise<Playlist> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [createdBy]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${createdBy} does not exist.`);
    }


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
      id: row.PlaylistID,
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

export async function getPlaylistID(code: string): Promise<number> {
  const conn = await getDBConnection();
  try {
    const result = await conn.query('SELECT PlaylistID FROM playlists WHERE code = ?', [code]);
    return result[0].id;
  } catch (error) {
    console.error('Error getting playlist ID:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function joinPlaylist(code: string, userID: string): Promise<void>{
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [userID]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }

    // Check if the playlist exists
    const codeCheck = await conn.query('SELECT PlaylistID FROM playlists WHERE code = ?', [code]);
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with code ${code} does not exist.`);
    }

    console.log(codeCheck);
    await conn.query(
      `INSERT INTO playlist_users (PlaylistID, UserID)
      VALUES (?, ?)`, [codeCheck[0].PlaylistID, userID])
    return;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
}

export async function leavePlaylist(code: string, userID: string): Promise<void>{
  const conn = await getDBConnection();

  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [userID]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }

    // Check if the playlist exists
    const codeCheck = await conn.query('SELECT PlaylistID FROM playlists WHERE code = ?', [code]);
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with code ${code} does not exist.`);
    }

    // Check if user is in relation table
    const joinCheck = await conn.query('SELECT PlaylistUserID FROM playlist_users WHERE UserID = ? AND PlaylistID = ?', [userID, codeCheck[0].PlaylistID]);
    if (joinCheck.length === 0) {
      throw new Error(`User ${userID} is not in Playlist with code ${code}`);
    }

    await conn.query(`UPDATE playlist_users SET Joined = FALSE WHERE PlaylistUserID = ?`, [joinCheck[0].PlaylistUserID])
    return;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }


}

export default playlists;