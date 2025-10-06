import { NextResponse } from 'next/server';
import { initializeDatabase, recreatePool } from '@/lib/db';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export async function POST() {
  // Only allow in development - NO AUTH REQUIRED
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    logger.log('Development database reset requested via POST');

    // Force database re-initialization (drops and recreates all tables)
    await initializeDatabase(true);

    // Recreate connection pool
    recreatePool();

    // Clear all cache
    cache.clear();
    logger.log('All cache cleared');

    logger.log('Database and connection pool reset completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database, connection pool, and cache reset successfully',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error resetting database:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to reset database',
        details: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}

// Add GET method for easy URL access - NO AUTH REQUIRED
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    logger.log('Development database reset requested via GET');

    // Force database re-initialization
    await initializeDatabase(true);

    // Recreate connection pool
    recreatePool();

    // Clear all cache
    cache.clear();

    logger.log('Database reset completed successfully via GET');

    // Return a nice HTML page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Database Reset - Groupify</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 15px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
              max-width: 600px;
              width: 100%;
            }
            .success { 
              color: #28a745; 
              border: 2px solid #28a745; 
              padding: 20px; 
              border-radius: 10px; 
              background: #d4edda; 
              margin: 20px 0;
            }
            .logo { 
              color: #FF6B6B; 
              text-align: center; 
              margin-bottom: 30px;
              font-size: 2.5em;
              font-weight: bold;
            }
            .emoji { font-size: 1.2em; }
            .actions { 
              margin-top: 30px; 
              text-align: center; 
            }
            .btn { 
              display: inline-block; 
              padding: 15px 30px; 
              margin: 0 10px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              font-size: 16px;
              transition: all 0.3s ease;
            }
            .btn-primary { 
              background: #FF6B6B; 
              color: white; 
            }
            .btn-primary:hover { 
              background: #ff5252; 
              transform: translateY(-2px);
            }
            .btn-secondary { 
              background: #6c757d; 
              color: white; 
            }
            .btn-secondary:hover { 
              background: #5a6268; 
              transform: translateY(-2px);
            }
            .details { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 15px 0;
              border-left: 4px solid #28a745;
            }
            .check-list {
              list-style: none;
              padding: 0;
            }
            .check-list li {
              padding: 8px 0;
              position: relative;
              padding-left: 30px;
            }
            .check-list li:before {
              content: "✅";
              position: absolute;
              left: 0;
              top: 8px;
            }
            .timestamp {
              font-size: 0.9em;
              color: #6c757d;
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="logo">🎵 Groupify</h1>
            
            <div class="success">
              <h2><span class="emoji">✅</span> Database Reset Successful!</h2>
              <p style="margin-top: 10px;">The database has been successfully initialized and is ready for use.</p>
            </div>

            <div class="details">
              <h3 style="margin-bottom: 15px; color: #495057;">What was done:</h3>
              <ul class="check-list">
                <li><strong>Database created</strong> - Created 'groupify' database if it didn't exist</li>
                <li><strong>Tables recreated</strong> - All tables dropped and recreated with fresh schema</li>
                <li><strong>Users table</strong> - Ready for user registration and authentication</li>
                <li><strong>Playlists table</strong> - Ready for collaborative playlists</li>
                <li><strong>Tracks table</strong> - Ready for Spotify track management</li>
                <li><strong>Votes table</strong> - Ready for track voting system</li>
                <li><strong>Cache cleared</strong> - All application cache invalidated</li>
                <li><strong>Connection pool refreshed</strong> - Database connections reset</li>
              </ul>
            </div>

            <div class="actions">
              <a href="/" class="btn btn-primary">🚀 Go to Groupify</a>
              <a href="/api/dev-reset" class="btn btn-secondary">🔄 Reset Again</a>
            </div>

            <div class="timestamp">
              Reset completed at: ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error resetting database via GET:', errorMessage);

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Database Reset Error - Groupify</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 15px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
              max-width: 600px;
              width: 100%;
            }
            .error { 
              color: #dc3545; 
              border: 2px solid #dc3545; 
              padding: 20px; 
              border-radius: 10px; 
              background: #f8d7da; 
              margin: 20px 0;
            }
            .logo { 
              color: #FF6B6B; 
              text-align: center; 
              margin-bottom: 30px;
              font-size: 2.5em;
              font-weight: bold;
            }
            pre { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              overflow-x: auto; 
              font-size: 14px;
              border-left: 4px solid #dc3545;
            }
            .actions {
              margin-top: 30px;
              text-align: center;
            }
            .btn {
              display: inline-block;
              padding: 15px 30px;
              margin: 0 10px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              background: #6c757d;
              color: white;
            }
            .troubleshooting {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="logo">🎵 Groupify</h1>
            
            <div class="error">
              <h2>❌ Database Reset Failed</h2>
              <p>There was an error initializing the database:</p>
              <pre>${errorMessage}</pre>
            </div>

            <div class="troubleshooting">
              <h3>🛠️ Troubleshooting Steps:</h3>
              <ol style="margin-left: 20px; margin-top: 15px;">
                <li>Check if your database server is running</li>
                <li>Verify your .env database configuration</li>
                <li>Ensure Docker containers are up: <code>docker compose ps</code></li>
                <li>Try restarting containers: <code>docker compose restart</code></li>
                <li>Check database logs: <code>docker compose logs db-1</code></li>
              </ol>
            </div>

            <div class="actions">
              <a href="/api/dev-reset" class="btn">🔄 Try Again</a>
            </div>
          </div>
        </body>
      </html>
    `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
