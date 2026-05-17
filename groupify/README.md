# Groupify - Collaborative Music Playlist App

A Next.js application for creating collaborative music playlists with Spotify integration.

## Quick Setup for New Developers

### Option 1: Easy Setup (Recommended)

1. Clone the repository
2. Install dependencies: `npm install`
3. Start Docker containers: `docker compose up --build`
4. Initialize database by visiting: **http://localhost:3000/api/dev-reset**
5. Visit the app: **http://localhost:3000**

### Option 2: Manual Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Start Docker containers: `docker compose up --build`
5. Hit the reset button in the app or visit `/api/dev-reset`

## Database Initialization

The database will be automatically created when you visit `/api/dev-reset`. This endpoint:

- Creates the `groupify` database if it doesn't exist
- Drops and recreates all tables with fresh schema
- Clears the application cache
- Only works in development mode

## Environment Variables

Required variables (copy from `.env.example`):

- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI` - OAuth redirect URI (usually `http://localhost:3000/api/callback`)
- `SESSION_SECRET` - Random string for session encryption
- `DB_HOST` - Database host (use `db` for Docker)
- `DB_USER` - Database username (default: `groupify`)
- `DB_PASSWORD` - Database password (default: `groupify`)
- `DB_NAME` - Database name (default: `groupify`)
- `DB_PORT` - Database port (default: `3306`)
- `DB_SSL` - Set to `true` for hosted MySQL providers that require TLS
- `DB_SSL_CA` - Optional base64-encoded CA certificate PEM
- `DB_SSL_REJECT_UNAUTHORIZED` - Keep `true` unless a provider explicitly requires otherwise

## Free Deployment Path

The current low-friction setup is:

- **App hosting**: Vercel Hobby, connected to this GitHub repo.
- **Database**: Aiven free MySQL, because the app already uses MariaDB/MySQL syntax and the `mariadb` driver.
- **Automation**: GitHub Actions runs Linux CI on pull requests and pushes. The optional Vercel workflow deploys previews for PRs and production from `nextjs`.

### GitHub Actions secrets

Add these repository secrets before enabling automated Vercel deploys:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Set the runtime app variables in Vercel project settings:

- `SESSION_SECRET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL`
- `DB_SSL_CA`
- `DB_SSL_REJECT_UNAUTHORIZED`

For an Aiven CA certificate:

```bash
base64 -w 0 ca.pem
```

Use the output as `DB_SSL_CA`. On PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ca.pem"))
```

## Development Commands

```bash
# Start development server
npm run dev

# Reset database (alternative to visiting /api/dev-reset)
curl -X POST http://localhost:3000/api/dev-reset

# View logs
docker compose logs -f web-1

# Stop containers
docker compose down

# Complete reset (removes volumes)
docker compose down -v
```

## API Endpoints

- `GET/POST /api/dev-reset` - Initialize/reset database (dev only)
- `POST /api/auth` - User authentication
- `GET /api/playlists` - Get user playlists
- `POST /api/generate-party-code` - Create new playlist/party
- `GET /api/dashboard/[code]` - Get playlist data

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Redux Toolkit
- **Backend**: Next.js API routes
- **Database**: MariaDB with connection pooling
- **Containerization**: Docker with docker-compose
- **Styling**: Tailwind CSS

## Troubleshooting

**Database connection issues?**

- Visit `http://localhost:3000/api/dev-reset` to initialize the database
- Check that Docker containers are running: `docker compose ps`

**Cache issues after changes?**

- Visit `/api/dev-reset` to clear cache and reset database
- Or restart containers: `docker compose restart`

**Spotify integration not working?**

- Ensure your Spotify app is configured with the correct redirect URI
- Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set correctly
