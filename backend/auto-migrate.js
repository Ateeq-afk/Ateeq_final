#!/usr/bin/env node

import { MigrationRunner } from './migration-handler.js';
import helpers from './migration-helpers.js';
import readline from 'readline';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🚀 Supabase Auto-Migration Tool\n');
  
  try {
    const runner = new MigrationRunner();
    
    // Check if running from command line with arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Interactive mode
      console.log('Available commands:');
      console.log('  1. Execute SQL migration');
      console.log('  2. Create table');
      console.log('  3. Add column');
      console.log('  4. Create index');
      console.log('  5. List migrations');
      console.log('  6. Exit\n');
      
      const choice = await prompt('Select an option (1-6): ');
      
      switch (choice) {
        case '1':
          await executeSQLMigration();
          break;
        case '2':
          await createTableInteractive();
          break;
        case '3':
          await addColumnInteractive();
          break;
        case '4':
          await createIndexInteractive();
          break;
        case '5':
          await runner.listMigrations();
          break;
        case '6':
          console.log('Goodbye!');
          process.exit(0);
        default:
          console.log('Invalid option');
      }
    } else {
      // Command line mode
      const command = args[0];
      
      if (command === 'sql' && args[1]) {
        // Execute SQL from file or inline
        const sqlOrFile = args[1];
        const name = args[2] || 'manual_migration';
        
        let sql;
        if (sqlOrFile.endsWith('.sql')) {
          sql = await fs.readFile(sqlOrFile, 'utf8');
        } else {
          sql = sqlOrFile;
        }
        
        const result = await runner.executeMigration(sql, name);
        console.log(result.success ? '✓ Success' : `✗ Failed: ${result.error}`);
        
      } else if (command === 'list') {
        await runner.listMigrations();
        
      } else {
        console.log('Usage:');
        console.log('  node auto-migrate.js                    # Interactive mode');
        console.log('  node auto-migrate.js sql "<SQL>" [name] # Execute SQL');
        console.log('  node auto-migrate.js sql file.sql [name]# Execute SQL from file');
        console.log('  node auto-migrate.js list               # List migrations');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function executeSQLMigration() {
  const name = await prompt('Migration name: ');
  console.log('Enter SQL (type "END" on a new line when done):');
  
  let sql = '';
  let line;
  
  while ((line = await prompt('')) !== 'END') {
    sql += line + '\n';
  }
  
  const runner = new MigrationRunner();
  const result = await runner.executeMigration(sql.trim(), name);
  
  console.log(result.success ? '\n✓ Migration completed!' : `\n✗ Migration failed: ${result.error}`);
}

async function createTableInteractive() {
  const tableName = await prompt('Table name: ');
  const columns = [];
  
  console.log('Define columns (leave name empty to finish):');
  
  while (true) {
    const name = await prompt('Column name: ');
    if (!name) break;
    
    const type = await prompt('Column type (e.g., VARCHAR(255), INTEGER, UUID): ');
    const notNull = (await prompt('NOT NULL? (y/n): ')).toLowerCase() === 'y';
    const defaultValue = await prompt('Default value (leave empty for none): ');
    
    columns.push({
      name,
      type,
      notNull,
      default: defaultValue || undefined
    });
  }
  
  const includeTimestamps = (await prompt('Include timestamps? (y/n): ')).toLowerCase() === 'y';
  const includeBranchId = (await prompt('Include branch_id? (y/n): ')).toLowerCase() === 'y';
  
  const result = await helpers.createTable(tableName, columns, {
    includeTimestamps,
    includeBranchId
  });
  
  console.log(result.success ? '\n✓ Table created!' : `\n✗ Failed: ${result.error}`);
}

async function addColumnInteractive() {
  const tableName = await prompt('Table name: ');
  const columnName = await prompt('Column name: ');
  const columnType = await prompt('Column type: ');
  const notNull = (await prompt('NOT NULL? (y/n): ')).toLowerCase() === 'y';
  const defaultValue = await prompt('Default value (leave empty for none): ');
  const createIndex = (await prompt('Create index? (y/n): ')).toLowerCase() === 'y';
  
  const result = await helpers.addColumn(tableName, {
    name: columnName,
    type: columnType,
    notNull,
    default: defaultValue || undefined,
    index: createIndex
  });
  
  console.log(result.success ? '\n✓ Column added!' : `\n✗ Failed: ${result.error}`);
}

async function createIndexInteractive() {
  const tableName = await prompt('Table name: ');
  const columns = await prompt('Column(s) (comma-separated): ');
  const unique = (await prompt('Unique index? (y/n): ')).toLowerCase() === 'y';
  
  const result = await helpers.createIndex(tableName, columns, { unique });
  
  console.log(result.success ? '\n✓ Index created!' : `\n✗ Failed: ${result.error}`);
}

// Run if called directly
main();

export { MigrationRunner, helpers };