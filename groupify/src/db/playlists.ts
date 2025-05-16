import { getDBConnection } from '@/lib/db';
import { Playlist } from '@/interfaces/Playlist';
import { createSpotifyPlaylist } from '@/lib/spotify';

const playlists = {
  createPlaylist,
  getAllPublicPlaylists,
  getUserPlaylists,
  getPlaylistID,
  joinPlaylist,
  leavePlaylist,
  joinPlaylistWithID
}

export async function createPlaylist(
  name: string,
  createdBy: string,
  isPublic: boolean,
  code: string,
  description: string
): Promise<Playlist> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [createdBy]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${createdBy} does not exist.`);
    }

    // Check if the code is already in use
    const codeCheck = await conn.query('SELECT PlaylistID FROM playlists WHERE code = ?', [code]);
    if (codeCheck.length > 0) {
      throw new Error(`Code ${code} is already in use.`);
    }
    
    // TODO: Spotify playlist creation and then link data
    createSpotifyPlaylist(name, createdBy, isPublic, description);
    //
    console.log(`Creating playlist with code: ${code} and name: ${name} and description: ${description}`);
    const result = await conn.query(
      `INSERT INTO playlists (name, code, created_at, created_by, is_public, description)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [name, code, createdBy, isPublic, description]
    );

    return {
      id: result.insertId.toString(), // Convert BigInt to string
      name,
      code,
      createdAt: new Date().toISOString(),
      createdBy: createdBy.toString(), // Convert BigInt to string
      isPublic,
      description
    };
  } catch (error) {
    console.error('Error creating playlist in database:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function getAllPublicPlaylists(): Promise<Playlist[]> {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query(`
      SELECT * FROM playlists 
      WHERE is_public = 1 
      ORDER BY created_at DESC`);
    
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

export async function getUserPlaylists(userID: string): Promise<Playlist[]> {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query(`
      SELECT playlists.* FROM playlists 
      LEFT JOIN playlist_users ON playlists.PlaylistID = playlist_users.PlaylistID
      WHERE playlist_users.UserID = ?
      AND playlist_users.Joined = 1
      AND playlists.is_public = 0
      ORDER BY playlists.created_at DESC`, [userID]);
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

export async function getPlaylistID(code: string): Promise<number | null> {
  const conn = await getDBConnection();
  try {
    const result = await conn.query('SELECT PlaylistID FROM playlists WHERE code = ?', [code]);
    if (result.length === 0) {
      console.log(`No playlist found with code: ${code}`);
      return null;
    }
    return result[0].PlaylistID;
  } catch (error) {
    console.error('Error getting playlist ID:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function joinPlaylist(code: string, userID: string): Promise<number>{
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

    // Check if the user is already in the playlist
    const joinCheck = await conn.query('SELECT PlaylistUserID FROM playlist_users WHERE UserID = ? AND PlaylistID = ?', [userID, codeCheck[0].PlaylistID]);
    if (joinCheck.length > 0) {
      return codeCheck[0].PlaylistID;
    }

    await conn.query(
      `INSERT INTO playlist_users (PlaylistID, UserID)
      VALUES (?, ?)`, [codeCheck[0].PlaylistID, userID])
    return codeCheck[0].PlaylistID;
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

export async function joinPlaylistWithID(playlistID: string, userID: string): Promise<string>{
  const conn = await getDBConnection();
  try {
    // Check if the user exists

    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [userID]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }
    console.log('User exists');
    // Check if the playlist exists
    const codeCheck = await conn.query('SELECT code FROM playlists WHERE PlaylistID = ?', [playlistID]);
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with code ${playlistID} does not exist.`);
    }
    console.log('Playlist exists');
    // Check if the user is already in the playlist
    const joinCheck = await conn.query('SELECT PlaylistUserID FROM playlist_users WHERE UserID = ? AND PlaylistID = ?', [userID, playlistID]);
    if (joinCheck.length > 0) {
      console.log('User is already in playlist');
      await conn.query('UPDATE playlist_users SET Joined = TRUE WHERE PlaylistUserID = ?', [joinCheck[0].PlaylistUserID])
      return codeCheck[0].code;
    }
    console.log('User is not in playlist');
    await conn.query(
      `INSERT INTO playlist_users (PlaylistID, UserID)
      VALUES (?, ?)`, [playlistID, userID])
    return codeCheck[0].code;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
}

export default playlists;