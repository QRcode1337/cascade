/**
 * Centralized logging utility for error tracking and debugging
 *
 * Provides consistent error logging with context and severity levels
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log database operation errors
   */
  dbError(operation: string, error: unknown, context?: LogContext): void {
    this.error(`Database operation failed: ${operation}`, error, {
      ...context,
      operation,
    });
  }

  /**
   * Log API request errors
   */
  apiError(endpoint: string, error: unknown, context?: LogContext): void {
    this.error(`API request failed: ${endpoint}`, error, {
      ...context,
      endpoint,
    });
  }
}

export const logger = new Logger();
