// Logger utility for production-safe logging
const isDevelopment = process.env.NODE_ENV === 'development'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const base = `[${timestamp}] [${level}] ${message}`
    return data ? `${base} ${JSON.stringify(data, null, 2)}` : base
  }

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG && isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, data))
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, data))
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, data))
    }
  }

  error(message: string, error?: any) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), error)
      // In production, could send to error tracking service
      if (!isDevelopment && typeof window !== 'undefined') {
        // Future: Send to Sentry, LogRocket, etc.
      }
    }
  }

  setLevel(level: LogLevel) {
    this.level = level
  }
}

export const logger = new Logger()
export default logger