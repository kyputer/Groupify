import { getDBConnection } from './db';

// Save tokens for a user
export async function saveSpotifyTokensForUser(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const conn = await getDBConnection();
  try {
    await conn.query(
      `UPDATE users SET 
        spotify_access_token = ?, 
        spotify_refresh_token = ?, 
        spotify_access_token_expires_at = ?
      WHERE id = ?`,
      [accessToken, refreshToken, Date.now() + expiresIn * 1000, userId]
    );
  } finally {
    await conn.release();
  }
}

// Retrieve tokens for a user
export async function getSpotifyTokensForUser(userId: number): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}> {
  const conn = await getDBConnection();
  try {
    const rows = await conn.query(
      `SELECT spotify_access_token, spotify_refresh_token, spotify_access_token_expires_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return { accessToken: null, refreshToken: null, expiresAt: null };
    }
    return {
      accessToken: rows[0].spotify_access_token,
      refreshToken: rows[0].spotify_refresh_token,
      expiresAt: rows[0].spotify_access_token_expires_at,
    };
  } finally {
    await conn.release();
  }
}
