import { MigrationRunner } from './migration-handler.js';

class MigrationHelpers {
  constructor() {
    this.runner = new MigrationRunner();
  }
  
  // Helper to create a table with common defaults
  async createTable(tableName, columns, options = {}) {
    const {
      includeTimestamps = true,
      includeBranchId = true,
      includeOrgId = true,
      primaryKey = 'id',
      indexes = [],
      rlsPolicies = true
    } = options;
    
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    // Add primary key if not already defined
    if (primaryKey && !columns.find(c => c.name === primaryKey)) {
      sql += `  ${primaryKey} UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n`;
    }
    
    // Add columns
    columns.forEach((col, index) => {
      sql += `  ${col.name} ${col.type}`;
      if (col.notNull) sql += ' NOT NULL';
      if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
      if (col.unique) sql += ' UNIQUE';
      if (col.references) sql += ` REFERENCES ${col.references}`;
      if (index < columns.length - 1 || includeTimestamps || includeBranchId || includeOrgId) {
        sql += ',';
      }
      sql += '\n';
    });
    
    // Add multi-tenant columns
    if (includeOrgId) {
      sql += `  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,\n`;
    }
    
    if (includeBranchId) {
      sql += `  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,\n`;
    }
    
    // Add timestamps
    if (includeTimestamps) {
      sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`;
      sql += `  updated_at TIMESTAMPTZ DEFAULT NOW()\n`;
    }
    
    sql += ');\n\n';
    
    // Add indexes
    indexes.forEach(index => {
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_${index.replace(/,/g, '_')} ON ${tableName}(${index});\n`;
    });
    
    // Add RLS
    if (rlsPolicies) {
      sql += `\n-- Enable RLS\n`;
      sql += `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
      
      // Add basic RLS policies for multi-tenant access
      if (includeBranchId) {
        sql += `-- RLS Policies\n`;
        sql += `CREATE POLICY "${tableName}_branch_isolation" ON ${tableName}\n`;
        sql += `  FOR ALL USING (\n`;
        sql += `    branch_id IN (\n`;
        sql += `      SELECT branch_id FROM users WHERE id = auth.uid()\n`;
        sql += `    ) OR EXISTS (\n`;
        sql += `      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'\n`;
        sql += `    )\n`;
        sql += `  );\n`;
      }
    }
    
    return await this.runner.executeMigration(sql, `create_table_${tableName}`);
  }
  
  // Helper to add a column to existing table
  async addColumn(tableName, columnDef) {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS `;
    sql += `${columnDef.name} ${columnDef.type}`;
    
    if (columnDef.notNull && columnDef.default !== undefined) {
      sql += ` DEFAULT ${columnDef.default} NOT NULL`;
    } else if (columnDef.notNull) {
      sql += ' NOT NULL';
    } else if (columnDef.default !== undefined) {
      sql += ` DEFAULT ${columnDef.default}`;
    }
    
    if (columnDef.unique) sql += ' UNIQUE';
    if (columnDef.references) sql += ` REFERENCES ${columnDef.references}`;
    sql += ';';
    
    if (columnDef.index) {
      sql += `\nCREATE INDEX IF NOT EXISTS idx_${tableName}_${columnDef.name} ON ${tableName}(${columnDef.name});`;
    }
    
    return await this.runner.executeMigration(sql, `add_column_${tableName}_${columnDef.name}`);
  }
  
  // Helper to create a foreign key
  async addForeignKey(tableName, columnName, referencedTable, referencedColumn = 'id', onDelete = 'CASCADE') {
    const constraintName = `fk_${tableName}_${columnName}_${referencedTable}`;
    const sql = `ALTER TABLE ${tableName} 
      ADD CONSTRAINT ${constraintName} 
      FOREIGN KEY (${columnName}) 
      REFERENCES ${referencedTable}(${referencedColumn}) 
      ON DELETE ${onDelete};`;
    
    return await this.runner.executeMigration(sql, `add_fk_${tableName}_${columnName}`);
  }
  
  // Helper to create an index
  async createIndex(tableName, columns, options = {}) {
    const {
      unique = false,
      where = null,
      using = 'btree'
    } = options;
    
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const indexName = `idx_${tableName}_${columnList.replace(/[,\s]/g, '_')}`;
    
    let sql = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING ${using} (${columnList})`;
    
    if (where) {
      sql += ` WHERE ${where}`;
    }
    
    sql += ';';
    
    return await this.runner.executeMigration(sql, `create_index_${indexName}`);
  }
  
  // Helper to create a trigger for updated_at
  async addUpdatedAtTrigger(tableName) {
    const sql = `
-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ${tableName}
DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
CREATE TRIGGER update_${tableName}_updated_at 
  BEFORE UPDATE ON ${tableName} 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();`;
    
    return await this.runner.executeMigration(sql, `add_updated_at_trigger_${tableName}`);
  }
  
  // Helper to create RLS policy
  async createRLSPolicy(tableName, policyName, operation, using, withCheck = null) {
    let sql = `CREATE POLICY "${policyName}" ON ${tableName}\n`;
    sql += `  FOR ${operation}\n`;
    sql += `  USING (${using})`;
    
    if (withCheck) {
      sql += `\n  WITH CHECK (${withCheck})`;
    }
    
    sql += ';';
    
    return await this.runner.executeMigration(sql, `create_rls_policy_${tableName}_${policyName}`);
  }
  
  // Direct SQL execution wrapper
  async executeMigration(name, sql) {
    return await this.runner.executeMigration(sql, name);
  }
  
  // Helper to create enum type
  async createEnum(enumName, values) {
    const valuesList = values.map(v => `'${v}'`).join(', ');
    const sql = `CREATE TYPE ${enumName} AS ENUM (${valuesList});`;
    
    return await this.runner.executeMigration(sql, `create_enum_${enumName}`);
  }
  
  // Helper to add comment to table or column
  async addComment(objectType, objectName, comment) {
    const sql = `COMMENT ON ${objectType} ${objectName} IS '${comment.replace(/'/g, "''")}';`;
    
    return await this.runner.executeMigration(sql, `add_comment_${objectName.replace(/\./g, '_')}`);
  }
}

export default new MigrationHelpers();