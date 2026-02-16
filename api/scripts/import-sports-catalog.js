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
  log: ['info', 'warn', 'error'],
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loadCatalog() {
  const catalogPath = path.join(__dirname, '../data/sports-catalog.json');

  if (!fs.existsSync(catalogPath)) {
    log(`✗ Catalog file not found: ${catalogPath}`, 'red');
    return null;
  }

  const catalogContent = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(catalogContent);
}

async function importSport(sportData, displayOrder) {
  log(`\n📝 Importing ${sportData.name}...`, 'cyan');

  try {
    // Check if sport already exists
    const existing = await prisma.sport.findUnique({
      where: { code: sportData.code }
    });

    let sport;
    if (existing) {
      log(`  ⚠️  Sport ${sportData.name} already exists, updating...`, 'yellow');
      sport = await prisma.sport.update({
        where: { code: sportData.code },
        data: {
          name: sportData.name,
          description: sportData.description,
          color: sportData.color,
          icon: sportData.icon,
          min_age: sportData.min_age,
          max_age: sportData.max_age,
          requires_belt: sportData.requires_belt,
          allow_competitions: sportData.allow_competitions,
          display_order: displayOrder,
        }
      });
    } else {
      sport = await prisma.sport.create({
        data: {
          code: sportData.code,
          name: sportData.name,
          description: sportData.description,
          color: sportData.color,
          icon: sportData.icon,
          min_age: sportData.min_age,
          max_age: sportData.max_age,
          requires_belt: sportData.requires_belt,
          allow_competitions: sportData.allow_competitions,
          is_active: true,
          display_order: displayOrder,
        }
      });
      log(`  ✓ Sport ${sportData.name} created`, 'green');
    }

    // Import configurations
    if (sportData.configurations) {
      for (const [key, value] of Object.entries(sportData.configurations)) {
        const configValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const dataType = typeof value === 'number' ? 'number' :
                        typeof value === 'boolean' ? 'boolean' :
                        Array.isArray(value) ? 'json' : 'string';

        await prisma.$executeRaw`
          INSERT INTO sport_configurations (sport_id, config_key, config_value, data_type, is_public)
          VALUES (${sport.id}, ${key}, ${configValue}, ${dataType}, TRUE)
          ON DUPLICATE KEY UPDATE
            config_value = VALUES(config_value),
            data_type = VALUES(data_type)
        `;
      }
      log(`  ✓ Imported ${Object.keys(sportData.configurations).length} configurations`, 'green');
    }

    // Import equipment
    if (sportData.equipment && sportData.equipment.length > 0) {
      for (let i = 0; i < sportData.equipment.length; i++) {
        const eq = sportData.equipment[i];
        await prisma.$executeRaw`
          INSERT INTO sport_equipment (sport_id, name, description, is_mandatory, for_level, display_order)
          VALUES (
            ${sport.id},
            ${eq.name},
            ${eq.description || ''},
            ${eq.is_mandatory},
            ${eq.for_level},
            ${i + 1}
          )
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            is_mandatory = VALUES(is_mandatory),
            for_level = VALUES(for_level),
            display_order = VALUES(display_order)
        `;
      }
      log(`  ✓ Imported ${sportData.equipment.length} equipment items`, 'green');
    }

    // Import competition rules
    if (sportData.competition_rules && sportData.competition_rules.length > 0) {
      for (let i = 0; i < sportData.competition_rules.length; i++) {
        const rule = sportData.competition_rules[i];
        await prisma.$executeRaw`
          INSERT INTO sport_competition_rules (
            sport_id, rule_name, rule_type, description, applies_to, is_active, display_order
          )
          VALUES (
            ${sport.id},
            ${rule.rule_name},
            ${rule.rule_type},
            ${rule.description},
            ${rule.applies_to || 'all'},
            TRUE,
            ${i + 1}
          )
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            applies_to = VALUES(applies_to),
            display_order = VALUES(display_order)
        `;
      }
      log(`  ✓ Imported ${sportData.competition_rules.length} competition rules`, 'green');
    }

    log(`  ✅ ${sportData.name} imported successfully!`, 'green');
    return sport;

  } catch (error) {
    log(`  ✗ Error importing ${sportData.name}: ${error.message}`, 'red');
    throw error;
  }
}

async function importAllSports(selectedSports = null) {
  log('\n========================================', 'blue');
  log('  SPORTS CATALOG IMPORT', 'blue');
  log('========================================', 'blue');

  const catalog = await loadCatalog();
  if (!catalog) {
    return false;
  }

  log(`\n📚 Catalog loaded: ${catalog.sports.length} sports available`, 'cyan');

  // Filter sports if specific ones are requested
  let sportsToImport = catalog.sports;
  if (selectedSports && selectedSports.length > 0) {
    sportsToImport = catalog.sports.filter(s => selectedSports.includes(s.code));
    log(`🎯 Importing ${sportsToImport.length} selected sports: ${selectedSports.join(', ')}`, 'yellow');
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < sportsToImport.length; i++) {
    try {
      await importSport(sportsToImport[i], i + 1);
      successCount++;
    } catch (error) {
      failCount++;
      log(`Failed to import sport: ${error.message}`, 'red');
    }
  }

  log('\n========================================', 'blue');
  log(`✅ Import completed!`, 'green');
  log(`  Success: ${successCount}`, 'green');
  if (failCount > 0) {
    log(`  Failed: ${failCount}`, 'red');
  }
  log('========================================', 'blue');

  return successCount > 0;
}

async function listAvailableSports() {
  log('\n========================================', 'blue');
  log('  AVAILABLE SPORTS IN CATALOG', 'blue');
  log('========================================', 'blue');

  const catalog = await loadCatalog();
  if (!catalog) {
    return;
  }

  catalog.sports.forEach((sport, index) => {
    const beltIcon = sport.requires_belt ? '🥋' : '🥊';
    const compIcon = sport.allow_competitions ? '🏆' : '🎯';
    log(`\n${index + 1}. ${beltIcon} ${sport.name} (${sport.code})`, 'cyan');
    log(`   ${sport.description}`, 'reset');
    log(`   ${compIcon} Competitions: ${sport.allow_competitions ? 'Yes' : 'No'}`, 'yellow');
    log(`   📊 Equipment: ${sport.equipment?.length || 0} items`, 'yellow');
    log(`   📜 Rules: ${sport.competition_rules?.length || 0}`, 'yellow');
    log(`   👶 Min age: ${sport.min_age || 'N/A'}`, 'yellow');
  });

  log('\n========================================', 'blue');
}

async function showCurrentSports() {
  log('\n========================================', 'blue');
  log('  CURRENT SPORTS IN DATABASE', 'blue');
  log('========================================', 'blue');

  try {
    const sports = await prisma.sport.findMany({
      include: {
        _count: {
          select: {
            user_sports: { where: { is_active: true } },
            courses: true,
            grades: true,
            equipment: true,
            competition_rules: true,
          }
        }
      },
      orderBy: { display_order: 'asc' }
    });

    if (sports.length === 0) {
      log('\n⚠️  No sports found in database', 'yellow');
      return;
    }

    sports.forEach((sport, index) => {
      const statusIcon = sport.is_active ? '✅' : '❌';
      const beltIcon = sport.requires_belt ? '🥋' : '🥊';
      log(`\n${index + 1}. ${statusIcon} ${beltIcon} ${sport.name} (${sport.code})`, 'cyan');
      log(`   Color: ${sport.color} | Icon: ${sport.icon || 'none'}`, 'reset');
      log(`   👥 ${sport._count.user_sports} members | 📚 ${sport._count.courses} courses | 🎖️  ${sport._count.grades} grades`, 'yellow');
      log(`   📦 ${sport._count.equipment} equipment | 📜 ${sport._count.competition_rules} rules`, 'yellow');
    });

    log('\n========================================', 'blue');
  } catch (error) {
    log(`\n✗ Error fetching sports: ${error.message}`, 'red');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes('--list') || args.includes('-l')) {
      await listAvailableSports();
    } else if (args.includes('--current') || args.includes('-c')) {
      await showCurrentSports();
    } else if (args.includes('--help') || args.includes('-h')) {
      log('\n🏆 Sports Catalog Import Script', 'cyan');
      log('\nUsage:', 'yellow');
      log('  node scripts/import-sports-catalog.js [options] [sport-codes]', 'reset');
      log('\nOptions:', 'yellow');
      log('  --list, -l       List all available sports in catalog', 'reset');
      log('  --current, -c    Show sports currently in database', 'reset');
      log('  --help, -h       Show this help message', 'reset');
      log('\nExamples:', 'yellow');
      log('  node scripts/import-sports-catalog.js', 'reset');
      log('    → Import all sports from catalog', 'cyan');
      log('\n  node scripts/import-sports-catalog.js karate judo', 'reset');
      log('    → Import only karate and judo', 'cyan');
      log('\n  node scripts/import-sports-catalog.js --list', 'reset');
      log('    → List available sports', 'cyan');
      log('\n  node scripts/import-sports-catalog.js --current', 'reset');
      log('    → Show sports in database', 'cyan');
    } else {
      // Import sports
      const sportCodes = args.filter(arg => !arg.startsWith('--'));
      const selectedSports = sportCodes.length > 0 ? sportCodes : null;

      const success = await importAllSports(selectedSports);

      if (success) {
        log('\n💡 Tip: Run with --current to see imported sports', 'cyan');
      }

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
