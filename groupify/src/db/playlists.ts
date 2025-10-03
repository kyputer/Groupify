import { getDBConnection } from '@/lib/db';
import { Playlist } from '@/interfaces/Playlist';
import { createSpotifyPlaylist } from '@/lib/spotify';
import { getSpotifyTokensForUser } from '@/lib/spotifyTokens';
import { getTrackDetails } from '@/lib/spotify';
import { generateCode } from '@/lib/utils';

// Fix the type - PlaylistID should be number to match interface
type PlaylistRow = {
  PlaylistID: number; // Changed from string to number
  name: string;
  code: string;
  created_at: string;
  created_by: string;
  is_public: number;
  description: string;
};

// const playlists = {
//   createPlaylist,
//   getAllPublicPlaylists,
//   getUserPlaylists,
//   getPlaylistID,
//   joinPlaylist,
//   leavePlaylist,
//   joinPlaylistWithID,
//   findPlaylistByCodeOrId,
//   ensurePlaylistExists,
//   addTrackToPlaylist
// }

export async function createPlaylist(
  name: string,
  createdBy: string,
  isPublic: boolean,
  description: string
): Promise<Playlist> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [
      createdBy,
    ]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${createdBy} does not exist.`);
    }

    // Check for Spotify token and create Spotify playlist if available
    const { accessToken } = await getSpotifyTokensForUser(Number(createdBy));
    let splaylistres = null;
    if (accessToken) {
      splaylistres = await createSpotifyPlaylist(
        name,
        description,
        isPublic,
        createdBy
      );
      console.log('Spotify playlist creation response:', splaylistres);
    } else {
      console.log(
        'User does not have a Spotify token, skipping Spotify playlist creation'
      );
    }

    // Generate unique code
    let code = '';
    while (true) {
      code = generateCode();
      const codeCheck = await conn.query(
        'SELECT PlaylistID FROM playlists WHERE code = ?',
        [code]
      );
      if (codeCheck.length === 0) {
        break;
      }
    }

    console.log(
      `Creating playlist with code: ${code} and name: ${name} and description: ${description}`
    );

    // Create the playlist
    const result = await conn.query(
      `INSERT INTO playlists (name, code, created_at, created_by, is_public, description)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [name, code, createdBy, isPublic, description]
    );

    const playlistId = result.insertId;

    // AUTOMATICALLY ADD THE CREATOR TO THE PLAYLIST_USERS TABLE
    await conn.query(
      `INSERT INTO playlist_users (PlaylistID, UserID, Joined)
       VALUES (?, ?, TRUE)`,
      [playlistId, createdBy]
    );

    console.log(
      `Creator ${createdBy} automatically joined playlist ${playlistId}`
    );

    return {
      id: playlistId.toString(),
      name,
      code,
      createdAt: new Date().toISOString(),
      createdBy: createdBy.toString(),
      isPublic,
      description,
      isJoined: true,
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
      AND open = 1
      ORDER BY created_at DESC`);

    return rows.map((row: PlaylistRow) => ({
      id: Number(row.PlaylistID), // Ensure it's a number
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      createdBy: row.created_by,
      isPublic: row.is_public === 1,
      description: row.description,
      isJoined: false,
    }));
  } finally {
    conn.release();
  }
}

export async function getUserPlaylists(userID: string): Promise<Playlist[]> {
  const conn = await getDBConnection();
  try {
    console.log('Getting playlists for user:', userID);

    const rows = await conn.query(
      `
      SELECT playlists.*, playlist_users.Joined FROM playlists 
      LEFT JOIN playlist_users ON playlists.PlaylistID = playlist_users.PlaylistID
      WHERE playlist_users.UserID = ?
      AND playlist_users.Joined = 1
      AND playlists.open = 1
      ORDER BY playlists.created_at DESC`,
      [userID]
    );

    console.log('Found playlists:', rows.length);

    return rows.map((row: PlaylistRow) => ({
      id: Number(row.PlaylistID), // Ensure it's a number
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      createdBy: row.created_by,
      isPublic: row.is_public === 1,
      description: row.description,
      isJoined: true,
    }));
  } finally {
    conn.release();
  }
}

export async function getPlaylistID(code: string): Promise<number | null> {
  const conn = await getDBConnection();
  try {
    const result = await conn.query(
      'SELECT PlaylistID FROM playlists WHERE code = ?',
      [code]
    );
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

export async function joinPlaylist(
  code: string,
  userID: string
): Promise<number> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [
      userID,
    ]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }

    // Check if the playlist exists
    const codeCheck = await conn.query(
      'SELECT PlaylistID FROM playlists WHERE code = ?',
      [code]
    );
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with code ${code} does not exist.`);
    }

    // Check if the playlist is open
    const openCheck = await conn.query(
      'SELECT open FROM playlists WHERE PlaylistID = ?',
      [codeCheck[0].PlaylistID]
    );
    if (openCheck[0].open === 0) {
      throw new Error(`Playlist with code ${code} is not open.`);
    }

    // Check if the user is already in the playlist
    const joinCheck = await conn.query(
      'SELECT PlaylistUserID FROM playlist_users WHERE UserID = ? AND PlaylistID = ?',
      [userID, codeCheck[0].PlaylistID]
    );
    if (joinCheck.length > 0) {
      return codeCheck[0].PlaylistID;
    }

    await conn.query(
      `INSERT INTO playlist_users (PlaylistID, UserID)
      VALUES (?, ?)`,
      [codeCheck[0].PlaylistID, userID]
    );
    return codeCheck[0].PlaylistID;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
}

export async function leavePlaylist(
  code: string,
  userID: string
): Promise<void> {
  const conn = await getDBConnection();

  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [
      userID,
    ]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }

    // Check if the playlist exists
    const codeCheck = await conn.query(
      'SELECT PlaylistID FROM playlists WHERE code = ?',
      [code]
    );
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with code ${code} does not exist.`);
    }

    // Check if user is in relation table
    const joinCheck = await conn.query(
      'SELECT PlaylistUserID FROM playlist_users WHERE UserID = ? AND PlaylistID = ?',
      [userID, codeCheck[0].PlaylistID]
    );
    if (joinCheck.length === 0) {
      throw new Error(`User ${userID} is not in Playlist with code ${code}`);
    }

    await conn.query(
      `UPDATE playlist_users SET Joined = FALSE WHERE PlaylistUserID = ?`,
      [joinCheck[0].PlaylistUserID]
    );
    return;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
}

export async function joinPlaylistWithID(
  playlistID: string,
  userID: string
): Promise<string> {
  const conn = await getDBConnection();
  try {
    // Check if the user exists
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [
      userID,
    ]);
    if (userCheck.length === 0) {
      throw new Error(`User with ID ${userID} does not exist.`);
    }
    console.log('User exists');

    // Check if the playlist exists BY ID, not by code
    const codeCheck = await conn.query(
      'SELECT code FROM playlists WHERE PlaylistID = ?', // This was correct
      [playlistID]
    );
    if (codeCheck.length === 0) {
      throw new Error(`Playlist with ID ${playlistID} does not exist.`); // Fixed error message
    }

    // Check if the playlist is open
    const openCheck = await conn.query(
      'SELECT open FROM playlists WHERE PlaylistID = ?',
      [playlistID]
    );
    if (openCheck[0].open === 0) {
      throw new Error(`Playlist with ID ${playlistID} is closed.`);
    }
    console.log('Playlist exists');

    // Check if user is already in the playlist
    const userInPlaylist = await conn.query(
      'SELECT * FROM playlist_users WHERE PlaylistID = ? AND UserID = ?',
      [playlistID, userID]
    );
    if (userInPlaylist.length > 0) {
      console.log('User is already in playlist');
      return codeCheck[0].code; // Return the code
    }

    // Join the playlist
    await conn.query(
      'INSERT INTO playlist_users (PlaylistID, UserID, Joined) VALUES (?, ?, TRUE)',
      [playlistID, userID]
    );

    console.log(
      `User ${userID} successfully joined playlist ${playlistID} with code ${codeCheck[0].code}`
    );
    return codeCheck[0].code;
  } catch (error) {
    console.error('Error joining playlist:', error);
    throw error;
  } finally {
    conn.release();
  }
}

export async function findPlaylistByCodeOrId(
  codeOrId: string | number
): Promise<Playlist | null> {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query(
      'SELECT * FROM playlists WHERE code = ? OR PlaylistID = ? LIMIT 1',
      [codeOrId, codeOrId]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.PlaylistID.toString(),
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      createdBy: row.created_by,
      isPublic: row.is_public === 1,
      description: row.description,
      isJoined: false,
    };
  } finally {
    conn.release();
  }
}

export async function ensurePlaylistExists({
  name,
  createdBy,
  isPublic,
  code,
  description,
}: {
  name: string;
  createdBy: string;
  isPublic: boolean;
  code: string;
  description: string;
}): Promise<Playlist> {
  let playlist = await findPlaylistByCodeOrId(code);
  if (!playlist) {
    playlist = await createPlaylist(name, createdBy, isPublic, description);
  }
  return playlist;
}

export async function checkPlaylistOwner(
  userID: string,
  playlistID: string
): Promise<boolean> {
  const conn = await getDBConnection();
  try {
    const result = await conn.query(
      'SELECT created_by FROM playlists WHERE PlaylistID = ?',
      [playlistID]
    );
    if (result.length === 0) {
      return false;
    }
    return result[0].created_by.toString() === userID.toString();
  } catch (error) {
    console.error('Error checking playlist owner:', error);
    return false;
  } finally {
    conn.release();
  }
}

export async function addTrackToPlaylist({
  playlistCode,
  trackId,
  name,
  createdBy,
  isPublic,
  description,
}: {
  playlistCode: string;
  trackId: string;
  name: string;
  createdBy: string;
  isPublic: boolean;
  description: string;
}): Promise<{ success: boolean; playlist: Playlist }> {
  // Ensure playlist exists
  const playlist = await ensurePlaylistExists({
    name,
    createdBy,
    isPublic,
    code: playlistCode,
    description,
  });
  const conn = await getDBConnection();
  try {
    const track = await getTrackDetails(trackId);
    if (!track) throw new Error('Track not found on Spotify');

    // 1. Ensure track exists in tracks table
    const [existingTrack] = await conn.query(
      'SELECT t.id FROM tracks t ' +
        'JOIN playlist_tracks pt ON t.id = pt.TrackID ' +
        'WHERE t.SpotifyID = ? AND pt.PlaylistID = ?;',
      [trackId, playlist.id]
    );
    let GroupifyTrackID: number;
    if (!existingTrack) {
      // Fetch from Spotify

      const trackInsertResult = await conn.query(
        `INSERT INTO tracks (SpotifyID, title, artist, url, image, user_id, votes, duration_ms, explicit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          track.id,
          track.name,
          track.artists.map(a => a.name).join(', '),
          track.external_urls.spotify,
          track.album.images[0]?.url || '',
          createdBy,
          1,
          track.duration_ms,
          track.explicit,
        ]
      );
      GroupifyTrackID = trackInsertResult.insertId;
    } else {
      GroupifyTrackID = existingTrack.id;
      console.log('Existing track found:', GroupifyTrackID);
      // Update the track's votes to += 1
      await conn.query('UPDATE tracks SET votes = votes + 1 WHERE id = ?;', [
        GroupifyTrackID,
      ]);
    }

    // 2. Now insert into playlist_tracks
    await conn.query(
      'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
      [playlist.id, track.id]
    );

    // 3. Add initial upvote for the user who added the track
    await conn.query(
      'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
      [track.id, createdBy, 'upvote', playlist.id]
    );

    return { success: true, playlist };
  } finally {
    conn.release();
  }
}

export async function closePlaylist(
  playlistId: string,
  userId: string
): Promise<void> {
  const conn = await getDBConnection();
  try {
    // Verify user owns the playlist
    const ownerCheck = await conn.query(
      'SELECT created_by FROM playlists WHERE PlaylistID = ?',
      [playlistId]
    );

    if (ownerCheck.length === 0) {
      throw new Error('Playlist not found');
    }

    if (ownerCheck[0].created_by.toString() !== userId.toString()) {
      throw new Error('Only the playlist owner can close the playlist');
    }

    // Close the playlist
    await conn.query('UPDATE playlists SET open = FALSE WHERE PlaylistID = ?', [
      playlistId,
    ]);
  } catch (error) {
    console.error('Error closing playlist:', error);
    throw error;
  } finally {
    await conn.release();
  }
}

const playlists = {
  createPlaylist,
  getAllPublicPlaylists,
  getUserPlaylists,
  getPlaylistID,
  joinPlaylist,
  leavePlaylist,
  joinPlaylistWithID,
  findPlaylistByCodeOrId,
  ensurePlaylistExists,
  addTrackToPlaylist,
  checkPlaylistOwner,
  closePlaylist,
};

export default playlists;
