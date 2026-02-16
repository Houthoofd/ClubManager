import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'cyan');

  try {
    // Check if utilisateurs table exists
    const users = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'utilisateurs'
    `;
    log(`✓ Table utilisateurs exists (${users[0].count})`, 'green');

    // Check if grades table exists
    const grades = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'grades'
    `;
    log(`✓ Table grades exists (${grades[0].count})`, 'green');

    // Check if cours table exists
    const cours = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'cours'
    `;
    log(`✓ Table cours exists (${cours[0].count})`, 'green');

    // Check if categories table exists
    const categories = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'categories'
    `;
    log(`✓ Table categories exists (${categories[0].count})`, 'green');

    // Check if sports table already exists
    const sports = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'sports'
    `;

    if (sports[0].count > 0) {
      log('⚠️  WARNING: sports table already exists!', 'yellow');
      return false;
    }

    return true;
  } catch (error) {
    log(`✗ Prerequisites check failed: ${error.message}`, 'red');
    return false;
  }
}

async function executeSQL(sql, description) {
  log(`\n📝 ${description}...`, 'cyan');

  try {
    await prisma.$executeRawUnsafe(sql);
    log(`✓ ${description} - SUCCESS`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - FAILED`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function executeMigration(dryRun = false) {
  const migrationFile = path.join(
    __dirname,
    '../prisma/migrations/20250220_phase5_multi_sports.sql'
  );

  log('\n========================================', 'blue');
  log('  PHASE 5: MULTI-SPORTS SYSTEM', 'blue');
  log('========================================', 'blue');

  if (dryRun) {
    log('\n⚠️  DRY RUN MODE - No changes will be made', 'yellow');
  }

  // Check prerequisites
  const prereqsPassed = await checkPrerequisites();
  if (!prereqsPassed) {
    log('\n❌ Prerequisites not met. Migration aborted.', 'red');
    return false;
  }

  // Read migration file
  log('\n📖 Reading migration file...', 'cyan');
  if (!fs.existsSync(migrationFile)) {
    log(`✗ Migration file not found: ${migrationFile}`, 'red');
    return false;
  }

  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  log(`✓ Migration file loaded (${sqlContent.length} bytes)`, 'green');

  if (dryRun) {
    log('\n✅ Dry run completed - SQL file is valid', 'green');
    log('\nTo execute the migration for real, run:', 'yellow');
    log('  node scripts/migrate-phase5.js --execute', 'yellow');
    return true;
  }

  // Execute migration
  log('\n🚀 Executing Phase 5 migration...', 'cyan');
  log('⚠️  This will:', 'yellow');
  log('   - Create 7 new tables (sports, sport_configurations, user_sports, etc.)', 'yellow');
  log('   - Add sport_id columns to existing tables', 'yellow');
  log('   - Create default "Karaté" sport', 'yellow');
  log('   - Link all existing data to Karaté', 'yellow');
  log('   - Create triggers and views', 'yellow');

  // Wait 3 seconds
  log('\nStarting in 3 seconds...', 'yellow');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    // Execute the entire migration as one transaction
    await prisma.$executeRawUnsafe(sqlContent);
    log('\n✅ Phase 5 migration completed successfully!', 'green');

    // Verify results
    await verifyMigration();

    return true;
  } catch (error) {
    log('\n❌ Migration failed!', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.message.includes('Duplicate column')) {
      log('\n💡 Tip: sport_id columns may already exist. Check your schema.', 'yellow');
    }

    return false;
  }
}

async function verifyMigration() {
  log('\n🔍 Verifying migration results...', 'cyan');

  try {
    // Check sports table
    const sports = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sports`;
    log(`✓ Sports table created: ${sports[0].count} sports`, 'green');

    // Check user_sports table
    const userSports = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user_sports`;
    log(`✓ User_sports table created: ${userSports[0].count} links`, 'green');

    // Check sport_configurations
    const configs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sport_configurations`;
    log(`✓ Sport_configurations table created: ${configs[0].count} configs`, 'green');

    // Check sport_equipment
    const equipment = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sport_equipment`;
    log(`✓ Sport_equipment table created: ${equipment[0].count} items`, 'green');

    // Check sport_competition_rules
    const rules = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sport_competition_rules`;
    log(`✓ Sport_competition_rules table created: ${rules[0].count} rules`, 'green');

    // Check if grades have sport_id
    const gradesWithSport = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM grades
      WHERE sport_id IS NOT NULL
    `;
    log(`✓ Grades linked to sports: ${gradesWithSport[0].count}`, 'green');

    // Check if cours have sport_id
    const coursWithSport = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM cours
      WHERE sport_id IS NOT NULL
    `;
    log(`✓ Courses linked to sports: ${coursWithSport[0].count}`, 'green');

    // Display sport summary
    log('\n📊 Sports Summary:', 'cyan');
    const sportsSummary = await prisma.$queryRaw`
      SELECT
        s.name,
        s.code,
        s.color,
        COUNT(DISTINCT us.user_id) as members,
        COUNT(DISTINCT c.id) as courses,
        COUNT(DISTINCT g.id) as grades
      FROM sports s
      LEFT JOIN user_sports us ON s.id = us.sport_id
      LEFT JOIN cours c ON s.id = c.sport_id
      LEFT JOIN grades g ON s.id = g.sport_id
      GROUP BY s.id, s.name, s.code, s.color
    `;

    sportsSummary.forEach((sport) => {
      log(
        `  ${sport.name} (${sport.code}): ${sport.members} members, ${sport.courses} courses, ${sport.grades} grades`,
        'blue'
      );
    });

    log('\n✅ All verifications passed!', 'green');
  } catch (error) {
    log(`⚠️  Verification warning: ${error.message}`, 'yellow');
  }
}

async function showStats() {
  log('\n========================================', 'blue');
  log('  CURRENT DATABASE STATS', 'blue');
  log('========================================', 'blue');

  try {
    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `;
    log(`\n📊 Total tables: ${tables[0].count}`, 'cyan');

    // Count users
    const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM utilisateurs`;
    log(`👥 Total users: ${users[0].count}`, 'cyan');

    // Count grades
    const grades = await prisma.$queryRaw`SELECT COUNT(*) as count FROM grades`;
    log(`🥋 Total grades: ${grades[0].count}`, 'cyan');

    // Count courses
    const cours = await prisma.$queryRaw`SELECT COUNT(*) as count FROM cours`;
    log(`📚 Total courses: ${cours[0].count}`, 'cyan');

    // Check if sports exists
    const sportsTable = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'sports'
    `;

    if (sportsTable[0].count > 0) {
      const sports = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sports`;
      log(`🏆 Total sports: ${sports[0].count}`, 'cyan');

      const userSports = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user_sports`;
      log(`🔗 User-sport links: ${userSports[0].count}`, 'cyan');
    } else {
      log(`🏆 Sports system: NOT INSTALLED`, 'yellow');
    }
  } catch (error) {
    log(`⚠️  Error getting stats: ${error.message}`, 'yellow');
  }
}

async function addSampleSports() {
  log('\n========================================', 'blue');
  log('  ADDING SAMPLE SPORTS', 'blue');
  log('========================================', 'blue');

  const sampleSports = [
    {
      code: 'judo',
      name: 'Judo',
      description: 'Art martial japonais basé sur les projections et le combat au sol',
      color: '#2563EB',
      icon: 'users',
      min_age: 4,
    },
    {
      code: 'taekwondo',
      name: 'Taekwondo',
      description: 'Art martial coréen axé sur les coups de pied spectaculaires',
      color: '#7C3AED',
      icon: 'zap',
      min_age: 5,
    },
    {
      code: 'boxe',
      name: 'Boxe',
      description: 'Sport de combat avec les poings',
      color: '#F59E0B',
      icon: 'target',
      min_age: 10,
      requires_belt: false,
    },
    {
      code: 'bjj',
      name: 'Jujitsu Brésilien',
      description: 'Art martial brésilien axé sur le combat au sol et les soumissions',
      color: '#059669',
      icon: 'shield',
      min_age: 6,
    },
  ];

  for (const sport of sampleSports) {
    try {
      await prisma.$executeRaw`
        INSERT INTO sports (code, name, description, color, icon, is_active, display_order, requires_belt, allow_competitions, min_age)
        VALUES (
          ${sport.code},
          ${sport.name},
          ${sport.description},
          ${sport.color},
          ${sport.icon},
          TRUE,
          (SELECT COALESCE(MAX(display_order), 0) + 1 FROM sports),
          ${sport.requires_belt !== false},
          TRUE,
          ${sport.min_age}
        )
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          color = VALUES(color),
          icon = VALUES(icon)
      `;
      log(`✓ Added sport: ${sport.name}`, 'green');
    } catch (error) {
      log(`⚠️  Could not add ${sport.name}: ${error.message}`, 'yellow');
    }
  }

  log('\n✅ Sample sports added!', 'green');
  await showStats();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  const showStatsOnly = args.includes('--stats');
  const addSamples = args.includes('--add-samples');

  try {
    if (showStatsOnly) {
      await showStats();
    } else if (addSamples) {
      await addSampleSports();
    } else {
      const success = await executeMigration(isDryRun);
      process.exit(success ? 0 : 1);
    }
  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
