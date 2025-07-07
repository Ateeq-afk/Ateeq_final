import { Pool, PoolConfig, PoolClient } from 'pg';
import { log } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
}

interface PoolSettings {
  // Connection pool settings
  min: number;                    // Minimum connections in pool
  max: number;                    // Maximum connections in pool
  idleTimeoutMillis: number;      // How long a client is allowed to remain idle
  connectionTimeoutMillis: number; // How long to wait when connecting
  acquireTimeoutMillis: number;   // How long to wait for a connection from pool
  
  // Health check settings
  allowExitOnIdle: boolean;       // Allow the pool to exit if idle
  maxUses: number;               // Maximum uses per connection before recycling
  
  // Query settings
  statement_timeout: number;      // Statement timeout in milliseconds
  query_timeout: number;          // Query timeout in milliseconds
  
  // Advanced settings
  keepAlive: boolean;            // TCP keep alive
  keepAliveInitialDelayMillis: number;
  
  // Application name for monitoring
  application_name: string;
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool | null = null;
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private poolSettings: PoolSettings;
  private isInitialized = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private retryDelayMs = 1000;
  
  private constructor() {
    this.config = this.parseSupabaseUrl();
    this.poolSettings = this.getPoolSettings();
  }

  /**
   * Get singleton instance of database connection pool
   */
  static getInstance(): DatabaseConnectionPool {
    if (!this.instance) {
      this.instance = new DatabaseConnectionPool();
    }
    return this.instance;
  }

  /**
   * Parse Supabase URL to extract connection parameters
   */
  private parseSupabaseUrl(): DatabaseConfig {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }

    // Extract database connection details from Supabase URL
    // Format: https://project-ref.supabase.co
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    
    return {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  /**
   * Get environment-specific pool settings
   */
  private getPoolSettings(): PoolSettings {
    const environment = process.env.NODE_ENV || 'development';
    
    const baseSettings: PoolSettings = {
      min: 2,                              // Minimum connections
      max: 20,                             // Maximum connections
      idleTimeoutMillis: 30000,            // 30 seconds
      connectionTimeoutMillis: 10000,      // 10 seconds
      acquireTimeoutMillis: 60000,         // 60 seconds
      allowExitOnIdle: false,              // Keep pool alive
      maxUses: 7500,                       // Max uses per connection
      statement_timeout: 30000,            // 30 seconds
      query_timeout: 30000,                // 30 seconds
      keepAlive: true,                     // Enable TCP keep alive
      keepAliveInitialDelayMillis: 10000,  // 10 seconds
      application_name: `desicargo-api-${environment}`
    };

    // Environment-specific overrides
    switch (environment) {
      case 'production':
        return {
          ...baseSettings,
          min: 5,                          // Higher minimum for production
          max: 50,                         // Higher maximum for production
          idleTimeoutMillis: 120000,       // 2 minutes
          connectionTimeoutMillis: 15000,  // 15 seconds
          acquireTimeoutMillis: 90000,     // 90 seconds
          statement_timeout: 60000,        // 60 seconds
          query_timeout: 60000,            // 60 seconds
          maxUses: 10000                   // Higher usage limit
        };
        
      case 'test':
        return {
          ...baseSettings,
          min: 1,                          // Minimal for testing
          max: 5,                          // Lower limit for tests
          idleTimeoutMillis: 10000,        // 10 seconds
          connectionTimeoutMillis: 5000,   // 5 seconds
          acquireTimeoutMillis: 15000,     // 15 seconds
          statement_timeout: 10000,        // 10 seconds
          query_timeout: 10000,            // 10 seconds
          maxUses: 1000                    // Lower usage for tests
        };
        
      default: // development
        return baseSettings;
    }
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.warn('Database pool already initialized');
      return;
    }

    try {
      await this.createPool();
      await this.testConnection();
      this.setupEventHandlers();
      this.isInitialized = true;
      
      log.info('Database connection pool initialized successfully', {
        environment: process.env.NODE_ENV || 'development',
        host: this.config.host,
        database: this.config.database,
        poolSettings: {
          min: this.poolSettings.min,
          max: this.poolSettings.max,
          idleTimeout: this.poolSettings.idleTimeoutMillis,
          connectionTimeout: this.poolSettings.connectionTimeoutMillis
        }
      });
      
    } catch (error) {
      log.error('Failed to initialize database connection pool', error);
      throw error;
    }
  }

  /**
   * Create the connection pool with retry logic
   */
  private async createPool(): Promise<void> {
    const poolConfig: PoolConfig = {
      ...this.config,
      ...this.poolSettings,
      // Additional connection parameters
      options: `-c search_path=public -c application_name='${this.poolSettings.application_name}'`
    };

    while (this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        this.pool = new Pool(poolConfig);
        return;
      } catch (error) {
        this.connectionAttempts++;
        log.warn(`Database connection attempt ${this.connectionAttempts} failed`, {
          error: error instanceof Error ? error.message : String(error),
          attempt: this.connectionAttempts,
          maxAttempts: this.maxConnectionAttempts
        });
        
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          await this.delay(this.retryDelayMs * this.connectionAttempts);
        } else {
          throw new Error(`Failed to create database pool after ${this.maxConnectionAttempts} attempts`);
        }
      }
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      log.info('Database connection test successful', {
        serverTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] // Just PostgreSQL version
      });
    } finally {
      client.release();
    }
  }

  /**
   * Setup event handlers for pool monitoring
   */
  private setupEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on('connect', (client) => {
      log.debug('New database client connected', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });

    this.pool.on('acquire', (client) => {
      log.debug('Database client acquired from pool', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });

    this.pool.on('release', (client) => {
      log.debug('Database client released back to pool', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });

    this.pool.on('remove', (client) => {
      log.debug('Database client removed from pool', {
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });

    this.pool.on('error', (err, client) => {
      log.error('Database pool error', {
        error: err.message,
        stack: err.stack,
        totalCount: this.pool?.totalCount,
        idleCount: this.pool?.idleCount,
        waitingCount: this.pool?.waitingCount
      });
    });
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }

    try {
      const client = await this.pool.connect();
      
      // Set query timeout for this client
      await client.query(`SET statement_timeout = ${this.poolSettings.statement_timeout}`);
      
      return client;
    } catch (error) {
      log.error('Failed to acquire database client', {
        error: error instanceof Error ? error.message : String(error),
        poolStats: this.getPoolStats()
      });
      throw error;
    }
  }

  /**
   * Execute a query with automatic client management
   */
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      log.debug('Database query executed', {
        duration,
        rowCount: result.rowCount,
        // Don't log the actual query text in production for security
        queryLength: text.length
      });
      
      return result;
    } catch (error) {
      log.error('Database query failed', {
        error: error instanceof Error ? error.message : String(error),
        queryLength: text.length,
        paramsCount: params?.length || 0
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      log.debug('Database transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      log.error('Database transaction rolled back', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): object {
    if (!this.pool) {
      return { status: 'not_initialized' };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      settings: {
        min: this.poolSettings.min,
        max: this.poolSettings.max,
        idleTimeout: this.poolSettings.idleTimeoutMillis,
        connectionTimeout: this.poolSettings.connectionTimeoutMillis
      }
    };
  }

  /**
   * Health check for the database pool
   */
  async healthCheck(): Promise<{ status: string; details: object }> {
    try {
      if (!this.pool) {
        return {
          status: 'error',
          details: { error: 'Pool not initialized' }
        };
      }

      // Test query with timeout
      const start = Date.now();
      await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;

      const stats = this.getPoolStats();
      
      return {
        status: 'healthy',
        details: {
          responseTime,
          ...stats,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : String(error),
          ...this.getPoolStats()
        }
      };
    }
  }

  /**
   * Gracefully close the pool
   */
  async close(): Promise<void> {
    if (!this.pool) {
      log.warn('Attempted to close non-existent database pool');
      return;
    }

    try {
      log.info('Closing database connection pool...');
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      log.info('Database connection pool closed successfully');
    } catch (error) {
      log.error('Error closing database pool', error);
      throw error;
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pool instance (for direct access if needed)
   */
  getPool(): Pool | null {
    return this.pool;
  }

  /**
   * Check if pool is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.pool !== null;
  }
}

// Export singleton instance
export default DatabaseConnectionPool;