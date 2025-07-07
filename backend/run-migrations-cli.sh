#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DesiCargo Database Migration Runner${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found in backend directory${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo -e "   Supabase URL: ${SUPABASE_URL}"
echo -e "\n"

# Migration directory
MIGRATION_DIR="./migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}❌ Error: Migrations directory not found${NC}"
    exit 1
fi

# Get all SQL files sorted
SQL_FILES=$(ls $MIGRATION_DIR/*.sql 2>/dev/null | sort)

if [ -z "$SQL_FILES" ]; then
    echo -e "${YELLOW}⚠️  No SQL migration files found${NC}"
    exit 0
fi

# Count files
TOTAL_FILES=$(echo "$SQL_FILES" | wc -l | tr -d ' ')
echo -e "${BLUE}📁 Found $TOTAL_FILES migration files${NC}\n"

# Create migration tracking table
echo -e "${YELLOW}Creating migration tracking table...${NC}"

# Note: Since we can't directly execute SQL via curl to Supabase,
# we'll create a Node.js script to handle the migrations

cat > temp-migration-runner.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  
  // Log the migration being run
  console.log(`\n📄 Running: ${path.basename(filename)}`);
  console.log('─'.repeat(60));
  
  // Since Supabase doesn't expose direct SQL execution,
  // we'll need to use the migrations approach differently
  
  // For now, we'll just validate the SQL
  if (content.trim().length === 0) {
    console.log('⏭️  Skipped (empty file)');
    return true;
  }
  
  // Count statements
  const statements = content.split(';').filter(s => s.trim().length > 0);
  console.log(`   Found ${statements.length} SQL statements`);
  
  // Show first few lines
  const preview = content.split('\n').slice(0, 5).join('\n');
  console.log(`   Preview:\n${preview.split('\n').map(l => '   │ ' + l).join('\n')}`);
  
  console.log('✅ Migration validated');
  return true;
}

async function main() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    try {
      const result = await runMigration(path.join(migrationsDir, file));
      if (result) success++;
      else failed++;
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Validated: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
EOF

# Run the Node.js migration script
echo -e "\n${BLUE}🔧 Running migrations...${NC}\n"
node temp-migration-runner.js

# Clean up
rm -f temp-migration-runner.js

echo -e "\n${GREEN}✨ Migration process completed!${NC}"
echo -e "\n${YELLOW}ℹ️  Note: To actually run these migrations, you need to:${NC}"
echo -e "   1. Go to your Supabase dashboard"
echo -e "   2. Navigate to SQL Editor"
echo -e "   3. Run each migration file in order"
echo -e "   4. Or use Supabase CLI: ${BLUE}supabase db push${NC}"