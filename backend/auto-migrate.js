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
  
  try {
    const runner = new MigrationRunner();
    
    // Check if running from command line with arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Interactive mode
      
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
          process.exit(0);
        default:
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
        
      } else if (command === 'list') {
        await runner.listMigrations();
        
      } else {
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
  
  let sql = '';
  let line;
  
  while ((line = await prompt('')) !== 'END') {
    sql += line + '\n';
  }
  
  const runner = new MigrationRunner();
  const result = await runner.executeMigration(sql.trim(), name);
  
}

async function createTableInteractive() {
  const tableName = await prompt('Table name: ');
  const columns = [];
  
  
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
  
}

async function createIndexInteractive() {
  const tableName = await prompt('Table name: ');
  const columns = await prompt('Column(s) (comma-separated): ');
  const unique = (await prompt('Unique index? (y/n): ')).toLowerCase() === 'y';
  
  const result = await helpers.createIndex(tableName, columns, { unique });
  
}

// Run if called directly
main();

export { MigrationRunner, helpers };