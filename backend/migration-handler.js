import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationRunner {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.migrationsDir = path.join(__dirname, 'migrations');
  }
  
  async ensureMigrationsDirectory() {
    try {
      await fs.access(this.migrationsDir);
    } catch {
      await fs.mkdir(this.migrationsDir, { recursive: true });
      console.log(`Created migrations directory at ${this.migrationsDir}`);
    }
  }
  
  generateMigrationFilename(name) {
    const timestamp = new Date().toISOString().replace(/[:\-T.]/g, '').substr(0, 14);
    const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `${timestamp}_${safeName}.sql`;
  }
  
  validateSQL(sql) {
    const dangerousPatterns = [
      /DROP\s+DATABASE/i,
      /DROP\s+SCHEMA\s+public/i,
      /TRUNCATE\s+SCHEMA/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        throw new Error(`Dangerous SQL operation detected: ${pattern}`);
      }
    }
  }
  
  async createMigrationFile(name, sql) {
    await this.ensureMigrationsDirectory();
    
    const filename = this.generateMigrationFilename(name);
    const filepath = path.join(this.migrationsDir, filename);
    
    const header = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}
-- Description: ${name}

`;
    
    await fs.writeFile(filepath, header + sql);
    console.log(`✓ Created migration file: ${filename}`);
    
    return { filename, filepath };
  }
  
  async executeMigration(sql, name = 'unnamed') {
    try {
      this.validateSQL(sql);
      
      // Create migration file first
      const { filename, filepath } = await this.createMigrationFile(name, sql);
      
      console.log(`⚡ Executing migration: ${filename}`);
      
      // Execute the SQL
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql_query: sql
      }).single();
      
      if (error) {
        // If exec_sql doesn't exist, try direct query
        const result = await this.executeDirectQuery(sql);
        if (result.error) {
          throw result.error;
        }
      }
      
      console.log(`✓ Migration executed successfully: ${filename}`);
      
      return {
        success: true,
        filename,
        filepath,
        message: `Migration ${filename} created and executed successfully`
      };
      
    } catch (error) {
      console.error(`✗ Migration failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async executeDirectQuery(sql) {
    try {
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        // Use Supabase's raw SQL execution through the REST API
        const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql_query: statement })
        });
        
        if (!response.ok) {
          // If exec_sql doesn't exist, we'll need to handle this differently
          console.warn('Note: Direct SQL execution may require setting up exec_sql function in Supabase');
          throw new Error(`SQL execution failed: ${response.statusText}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { error };
    }
  }
  
  async listMigrations() {
    await this.ensureMigrationsDirectory();
    
    const files = await fs.readdir(this.migrationsDir);
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`\nFound ${migrations.length} migration(s):`);
    migrations.forEach(m => console.log(`  - ${m}`));
    
    return migrations;
  }
  
  async readMigration(filename) {
    const filepath = path.join(this.migrationsDir, filename);
    return await fs.readFile(filepath, 'utf8');
  }
}

export { MigrationRunner };