import { initializeDatabase } from './db';

(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialization completed on server startup.');
  } catch (error) {
    console.error('Failed to initialize database on server startup:', error);
    process.exit(1); // Exit the process if initialization fails
  }
})();