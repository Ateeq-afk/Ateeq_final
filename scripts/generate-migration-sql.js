import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 DesiCargo Migration SQL Generator\n');

const migrations = [
  { file: '002_organization_auth.sql', desc: 'Organization Authentication Schema' },
  { file: '003_enhanced_rls_policies.sql', desc: 'Enhanced RLS Policies' },
  { file: '004_seed_k2k_organization.sql', desc: 'Seed K2K Logistics Data' },
  { file: '005_proof_of_delivery.sql', desc: 'Proof of Delivery System' },
  { file: '006_warehouse_management.sql', desc: 'Warehouse Management System' },
  { file: '007_booking_form_enhancements.sql', desc: 'Enhanced Booking Form Support' }
];

let allSql = `-- DesiCargo Database Migrations
-- Generated on ${new Date().toISOString()}
-- Run these migrations in order in your Supabase SQL Editor

`;

console.log('Generating combined migration SQL...\n');

for (const migration of migrations) {
  try {
    const sqlPath = join(__dirname, '..', 'backend', 'migrations', migration.file);
    const sql = readFileSync(sqlPath, 'utf8');
    
    allSql += `\n-- ================================================
-- ${migration.desc}
-- File: ${migration.file}
-- ================================================\n\n`;
    allSql += sql + '\n\n';
    
    console.log(`✅ Added: ${migration.desc}`);
  } catch (error) {
    console.log(`⚠️  Skipped: ${migration.desc} (file not found)`);
  }
}

// Write to file
const outputPath = join(process.cwd(), 'MIGRATIONS_TO_RUN.sql');
writeFileSync(outputPath, allSql);

console.log(`\n📄 Combined migration SQL saved to: MIGRATIONS_TO_RUN.sql`);
console.log('\n📋 Next Steps:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the contents of MIGRATIONS_TO_RUN.sql');
console.log('4. Run the SQL to apply all migrations');
console.log('\n🎯 After migrations, test with:');
console.log('- Organization Code: k2k');
console.log('- Username: admin');
console.log('- Password: Admin@123');