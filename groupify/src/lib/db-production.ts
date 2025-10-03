// Additional production-specific configurations

// Environment-based connection scaling
export const getOptimalConnectionCount = () => {
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '2');

  // Scale based on expected load
  if (process.env.NODE_ENV === 'production') {
    // Start with minimal connections, scale as needed
    return Math.min(maxConnections, 2);
  }

  return 5; // Development default
};

// Connection health check for production monitoring
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await executeQuery('SELECT 1 as healthy');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Production-ready connection warmup
export const warmupConnections = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    // Pre-warm one connection
    const conn = await getDBConnection();
    await conn.query('SELECT 1');
    await conn.release();
    logger.log('Database connections warmed up');
  } catch (error) {
    logger.error('Connection warmup failed:', error);
  }
};
