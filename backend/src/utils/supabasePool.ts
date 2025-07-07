import { createClient } from '@supabase/supabase-js';
import DatabaseConnectionPool from '../config/database';
import { log } from './logger';

/**
 * Enhanced Supabase client with connection pooling integration
 */
class SupabasePoolManager {
  private static instance: SupabasePoolManager | null = null;
  private supabaseClient: any = null;
  private dbPool: DatabaseConnectionPool;

  private constructor() {
    this.dbPool = DatabaseConnectionPool.getInstance();
    this.initializeSupabaseClient();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SupabasePoolManager {
    if (!this.instance) {
      this.instance = new SupabasePoolManager();
    }
    return this.instance;
  }

  /**
   * Initialize Supabase client
   */
  private initializeSupabaseClient(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'desicargo-api'
        }
      }
    });

    log.info('Supabase client initialized with pooling support');
  }

  /**
   * Get Supabase client
   */
  getClient(): any {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabaseClient;
  }

  /**
   * Execute query using connection pool for better performance
   */
  async queryWithPool(query: string, params?: any[]): Promise<any> {
    try {
      // Use connection pool for raw SQL queries
      const result = await this.dbPool.query(query, params);
      return {
        data: result.rows,
        error: null,
        count: result.rowCount
      };
    } catch (error) {
      log.error('Pool query failed', {
        error: error instanceof Error ? error.message : String(error),
        queryLength: query.length
      });
      
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        count: 0
      };
    }
  }

  /**
   * Execute transaction using connection pool
   */
  async transactionWithPool<T>(callback: (client: any) => Promise<T>): Promise<T> {
    return await this.dbPool.transaction(callback);
  }

  /**
   * Enhanced query builder that can use either Supabase or direct pool
   */
  createQueryBuilder(table: string, usePool = false) {
    if (usePool) {
      return new PoolQueryBuilder(table, this.dbPool);
    } else {
      return this.supabaseClient.from(table);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return this.dbPool.getPoolStats();
  }

  /**
   * Health check for both Supabase and pool
   */
  async healthCheck(): Promise<{ supabase: string; pool: any }> {
    const poolHealth = await this.dbPool.healthCheck();
    
    // Test Supabase connection
    let supabaseStatus = 'unknown';
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('count(*)')
        .limit(1);
      
      supabaseStatus = error ? 'error' : 'healthy';
    } catch (err) {
      supabaseStatus = 'error';
    }

    return {
      supabase: supabaseStatus,
      pool: poolHealth
    };
  }
}

/**
 * Query builder that uses connection pool
 */
class PoolQueryBuilder {
  private tableName: string;
  private dbPool: DatabaseConnectionPool;
  private selectClause = '*';
  private whereClause = '';
  private orderClause = '';
  private limitClause = '';
  private params: any[] = [];
  private paramIndex = 1;

  constructor(table: string, pool: DatabaseConnectionPool) {
    this.tableName = table;
    this.dbPool = pool;
  }

  /**
   * Select columns
   */
  select(columns: string = '*'): this {
    this.selectClause = columns;
    return this;
  }

  /**
   * Add WHERE condition
   */
  eq(column: string, value: any): this {
    this.addWhereCondition(`${column} = $${this.paramIndex}`);
    this.params.push(value);
    this.paramIndex++;
    return this;
  }

  /**
   * Add WHERE IN condition
   */
  in(column: string, values: any[]): this {
    const placeholders = values.map(() => `$${this.paramIndex++}`).join(', ');
    this.addWhereCondition(`${column} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  /**
   * Add WHERE LIKE condition
   */
  ilike(column: string, pattern: string): this {
    this.addWhereCondition(`${column} ILIKE $${this.paramIndex}`);
    this.params.push(pattern);
    this.paramIndex++;
    return this;
  }

  /**
   * Add ORDER BY
   */
  order(column: string, ascending = true): this {
    this.orderClause = `ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  /**
   * Add LIMIT
   */
  limit(count: number): this {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * Execute SELECT query
   */
  async execute(): Promise<{ data: any[]; error: any; count: number }> {
    const query = `
      SELECT ${this.selectClause}
      FROM ${this.tableName}
      ${this.whereClause}
      ${this.orderClause}
      ${this.limitClause}
    `.trim();

    try {
      const result = await this.dbPool.query(query, this.params);
      return {
        data: result.rows,
        error: null,
        count: result.rowCount || 0
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
        count: 0
      };
    }
  }

  /**
   * Execute INSERT query
   */
  async insert(data: any): Promise<{ data: any; error: any }> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await this.dbPool.query(query, values);
      return {
        data: result.rows[0],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute UPDATE query
   */
  async update(data: any): Promise<{ data: any; error: any }> {
    const updates = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = Object.values(data);
    const whereParams = this.params;
    const allParams = [...values, ...whereParams];

    // Adjust parameter indices in WHERE clause
    let adjustedWhereClause = this.whereClause;
    for (let i = whereParams.length; i >= 1; i--) {
      adjustedWhereClause = adjustedWhereClause.replace(
        `$${i}`,
        `$${values.length + i}`
      );
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${updates}
      ${adjustedWhereClause}
      RETURNING *
    `;

    try {
      const result = await this.dbPool.query(query, allParams);
      return {
        data: result.rows[0],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute DELETE query
   */
  async delete(): Promise<{ data: any; error: any }> {
    const query = `
      DELETE FROM ${this.tableName}
      ${this.whereClause}
      RETURNING *
    `;

    try {
      const result = await this.dbPool.query(query, this.params);
      return {
        data: result.rows,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Helper to add WHERE conditions
   */
  private addWhereCondition(condition: string): void {
    if (this.whereClause === '') {
      this.whereClause = `WHERE ${condition}`;
    } else {
      this.whereClause += ` AND ${condition}`;
    }
  }
}

// Export singleton instance
export default SupabasePoolManager;