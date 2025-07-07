import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL;
  
  if (logLevel) return logLevel;
  
  switch (env) {
    case 'production': return 'info';
    case 'staging': return 'http';
    case 'development': return 'debug';
    default: return 'debug';
  }
};

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${service || 'API'}] ${level}: ${message}${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: getLogLevel(),
      format: consoleFormat,
    })
  );
}

// File transports (enabled in production and staging)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
    }),
    
    // HTTP request logs
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      format: logFormat,
      maxsize: 25 * 1024 * 1024, // 25MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: logFormat,
  defaultMeta: { 
    service: 'desicargo-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add exception handling
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    format: logFormat
  })
);

// Add unhandled rejection handling
logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    format: logFormat
  })
);

// Create a stream object for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Export logger methods with enhanced context
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  // Specialized logging methods
  security: (message: string, meta?: any) => {
    logger.warn(`🔒 SECURITY: ${message}`, { type: 'security', ...meta });
  },

  auth: (message: string, meta?: any) => {
    logger.info(`🔐 AUTH: ${message}`, { type: 'auth', ...meta });
  },

  api: (message: string, meta?: any) => {
    logger.http(`🌐 API: ${message}`, { type: 'api', ...meta });
  },

  database: (message: string, meta?: any) => {
    logger.debug(`🗄️ DB: ${message}`, { type: 'database', ...meta });
  },

  performance: (message: string, meta?: any) => {
    logger.info(`⚡ PERF: ${message}`, { type: 'performance', ...meta });
  }
};

// Performance timing helper
export const timer = (label: string) => {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      log.performance(`${label} completed in ${duration}ms`, { duration, label });
      return duration;
    }
  };
};

export default logger;