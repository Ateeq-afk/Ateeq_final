import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { log } from '../utils/logger';

interface SentryConfig {
  environment: string;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enabled: boolean;
}

class SentryManager {
  private static isInitialized = false;
  private static config: SentryConfig;

  /**
   * Initialize Sentry with environment-specific configuration
   */
  static initialize(): void {
    if (this.isInitialized) {
      log.warn('Sentry already initialized');
      return;
    }

    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';
    
    // Don't initialize Sentry in development without explicit DSN
    if (!dsn) {
      log.info('Sentry DSN not provided, error tracking disabled', { environment });
      return;
    }

    this.config = this.getEnvironmentConfig(environment);

    try {
      Sentry.init({
        dsn,
        environment: this.config.environment,
        enabled: this.config.enabled,
        
        // Performance monitoring
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        
        // Error sampling
        sampleRate: this.config.sampleRate,
        
        // Integrations
        integrations: [
          nodeProfilingIntegration(),
          Sentry.httpIntegration({ breadcrumbs: true }),
          Sentry.expressIntegration({ 
            shouldCreateSpanForRequest: (url) => {
              // Skip health checks and monitoring
              return !url.includes('/health') && !url.includes('/monitoring');
            }
          }),
          Sentry.prismaIntegration(),
          Sentry.postgresIntegration()
        ],

        // Custom options
        beforeSend: (event, hint) => {
          return this.beforeSend(event, hint);
        },

        beforeSendTransaction: (event) => {
          return this.beforeSendTransaction(event);
        },

        // Release tracking
        release: process.env.SENTRY_RELEASE || `desicargo-backend@${process.env.npm_package_version || '1.0.0'}`,

        // User context
        initialScope: {
          tags: {
            component: 'backend',
            service: 'desicargo-api'
          }
        }
      });

      this.isInitialized = true;
      
      log.info('Sentry initialized successfully', {
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        enabled: this.config.enabled
      });

    } catch (error) {
      log.error('Failed to initialize Sentry', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get environment-specific configuration
   */
  private static getEnvironmentConfig(environment: string): SentryConfig {
    const configs: Record<string, SentryConfig> = {
      production: {
        environment: 'production',
        sampleRate: 1.0,
        tracesSampleRate: 0.1, // 10% of transactions
        profilesSampleRate: 0.1, // 10% for profiling
        enabled: true
      },
      staging: {
        environment: 'staging',
        sampleRate: 1.0,
        tracesSampleRate: 0.25, // 25% of transactions
        profilesSampleRate: 0.25, // 25% for profiling
        enabled: true
      },
      development: {
        environment: 'development',
        sampleRate: 1.0,
        tracesSampleRate: 1.0, // 100% for development
        profilesSampleRate: 1.0, // 100% for development
        enabled: false // Disabled by default in development
      }
    };

    return configs[environment] || configs.development;
  }

  /**
   * Filter and modify events before sending to Sentry
   */
  private static beforeSend(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Filter out sensitive information
    if (event.request) {
      // Remove sensitive headers
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      if (event.request.headers) {
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers && event.request.headers[header]) {
            event.request.headers[header] = '[Redacted]';
          }
        });
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const sensitiveParams = ['password', 'token', 'secret', 'key'];
        sensitiveParams.forEach(param => {
          if (event.request?.query_string?.includes(param)) {
            // Simple redaction - in production, use a more sophisticated approach
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[Redacted]`
            );
          }
        });
      }
    }

    // Filter out noisy errors
    const noisyErrors = [
      'ECONNRESET',
      'EPIPE',
      'ENOTFOUND',
      'socket hang up',
      'Connection terminated unexpectedly'
    ];

    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value && noisyErrors.some(noise => exception.value?.includes(noise))) {
          return null; // Don't send to Sentry
        }
      }
    }

    // Add custom context
    if (hint.originalException) {
      const error = hint.originalException as Error;
      event.tags = {
        ...event.tags,
        errorType: error.constructor.name
      };
    }

    return event;
  }

  /**
   * Filter transactions before sending
   */
  private static beforeSendTransaction(event: Sentry.Transaction): Sentry.Transaction | null {
    // Skip health check transactions
    if (event.transaction?.includes('/health')) {
      return null;
    }

    // Skip monitoring transactions
    if (event.transaction?.includes('/monitoring')) {
      return null;
    }

    return event;
  }

  /**
   * Capture exception with additional context
   */
  static captureException(error: Error, context?: Record<string, any>): string {
    if (!this.isInitialized) {
      log.error('Sentry not initialized, logging error locally', { error: error.message });
      return '';
    }

    return Sentry.withScope(scope => {
      if (context) {
        // Add custom context
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      return Sentry.captureException(error);
    });
  }

  /**
   * Capture message with level and context
   */
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): string {
    if (!this.isInitialized) {
      log.info('Sentry not initialized, logging message locally', { message, level });
      return '';
    }

    return Sentry.withScope(scope => {
      scope.setLevel(level);
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      return Sentry.captureMessage(message);
    });
  }

  /**
   * Set user context for error tracking
   */
  static setUser(user: { id?: string; email?: string; username?: string; role?: string; branch_id?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(breadcrumb: { message: string; category?: string; level?: Sentry.SeverityLevel; data?: any }): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Create transaction for performance monitoring
   */
  static startTransaction(name: string, op: string): Sentry.Transaction {
    if (!this.isInitialized) {
      // Return a mock transaction if Sentry is not initialized
      return {
        finish: () => {},
        setStatus: () => {},
        setTag: () => {},
        setData: () => {}
      } as any;
    }

    return Sentry.startTransaction({ name, op });
  }

  /**
   * Flush all pending events to Sentry
   */
  static async flush(timeout = 5000): Promise<boolean> {
    if (!this.isInitialized) return true;

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      log.error('Failed to flush Sentry events', { error });
      return false;
    }
  }

  /**
   * Close Sentry connection
   */
  static async close(timeout = 5000): Promise<boolean> {
    if (!this.isInitialized) return true;

    try {
      const result = await Sentry.close(timeout);
      this.isInitialized = false;
      log.info('Sentry connection closed');
      return result;
    } catch (error) {
      log.error('Failed to close Sentry connection', { error });
      return false;
    }
  }

  /**
   * Check if Sentry is initialized and enabled
   */
  static isReady(): boolean {
    return this.isInitialized && this.config?.enabled;
  }

  /**
   * Get current configuration
   */
  static getConfig(): SentryConfig | null {
    return this.config || null;
  }
}

export default SentryManager;