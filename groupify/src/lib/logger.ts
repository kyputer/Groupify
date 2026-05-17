/**
 * Conditional logger utility
 * Only logs in development environment to reduce production noise
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but with less noise in production
    if (isDev) {
      console.error(...args);
    } else {
      // In production, log errors but with less detail
      console.error('Error occurred:', args[0]);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};
