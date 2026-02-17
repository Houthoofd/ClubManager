# ClubManager Database

This directory contains all database-related files for the ClubManager application, including schema definitions, migrations, stored procedures, triggers, and documentation.

## 📁 Directory Structure

```
db/
├── README.md                    # This file
├── schema/                      # Current database schema
├── migrations/                  # Versioned database migrations
├── seeds/                       # Test/sample data
├── docs/                        # Documentation and analysis
├── objects/                     # Database objects (procedures, triggers, events)
├── queries/                     # Utility queries and examples
└── scripts/                     # Installation and maintenance scripts
```

## 📂 Directory Details

### `schema/`
Contains the current, production-ready database schema exports.

- **`clubmanager_full.sql`** - Complete database export (structure + data)
- **`README.md`** - Installation instructions and export information

**Usage:**
```bash
# Import full database
mysql -u root -p clubmanager < schema/clubmanager_full.sql
```

### `migrations/`
Version-controlled database migrations, organized chronologically.

Each migration is in its own numbered directory:
- `001_add_userid_field/` - Add user ID field to tables
- `002_birth_date_constraints/` - Birth date validation constraints
- `003_unique_person_constraint/` - Unique person identification
- `004_paiements_constraints/` - Payment table constraints
- `005_naming_standardization/` - French to English naming migration

**Best Practices:**
- Never modify existing migrations
- Always create new migrations for schema changes
- Test migrations on a copy of production data
- Include both upgrade and rollback scripts when possible

### `seeds/`
Sample and test data for development and testing.

- `fake-data-inscription.sql` - Fake enrollment data
- `inscriptions-mock-data.sql` - Mock enrollment records

### `docs/`
Documentation, analysis reports, and migration guides.

- `AMELIORATIONS_POSSIBLES.txt` - Possible improvements and optimizations
- `MIGRATION_MAPPING.txt` - Migration mapping documentation
- `FRENCH_TERMS_ANALYSIS.md` - Analysis of French to English translation

### `objects/`
Database objects organized by type.

#### `objects/procedures/`
Stored procedures organized by domain:
- `admin/` - Administrative procedures
- `analytics/` - Analytics and reporting procedures
- `attendance/` - Attendance tracking procedures
- `auth/` - Authentication procedures
- `courses/` - Course management procedures
- `events/` - Event management procedures
- `grades/` - Grade/belt management procedures
- `payments/` - Payment processing procedures
- `reporting/` - Report generation procedures
- `sports/` - Sports/discipline procedures
- `teachers/` - Teacher management procedures
- `_deprecated/` - Deprecated procedures (kept for reference)

#### `objects/triggers/`
Database triggers:
- `after_echeance_paiement_update.sql` - Payment due date update trigger
- `after_insert_user.sql` - Post-user creation trigger
- `after_utilisateur_update_abonnement.sql` - Subscription update trigger
- `update_professeur.sql` - Teacher update trigger

#### `objects/events/`
Scheduled events:
- `new-date.sql` - Date-related scheduled event

### `queries/`
Useful queries for analysis and reporting.

- `inscriptions-cours.sql` - Course enrollment queries
- `paiements-reccurents.sql` - Recurring payments queries
- `statistiques_frequentation.sql` - Attendance statistics queries

### `scripts/`
Installation and maintenance scripts.

- `install_complete.bat` - Complete installation script
- `install_all_improvements.bat` - Install all improvements

## 🚀 Quick Start

### Fresh Installation

1. **Create database:**
   ```bash
   mysql -u root -p -e "CREATE DATABASE clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **Import schema:**
   ```bash
   mysql -u root -p clubmanager < schema/clubmanager_full.sql
   ```

3. **Verify installation:**
   ```bash
   mysql -u root -p clubmanager -e "SHOW TABLES;"
   ```

### Development Setup

1. **Create test database:**
   ```bash
   mysql -u root -p -e "CREATE DATABASE clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **Import schema:**
   ```bash
   mysql -u root -p clubmanager_test < schema/clubmanager_full.sql
   ```

3. **Load sample data (optional):**
   ```bash
   mysql -u root -p clubmanager_test < seeds/fake-data-inscription.sql
   ```

## 🔄 Working with Migrations

### Applying Migrations

Migrations should be applied in order. Navigate to each migration directory and follow its README or installation script.

```bash
# Example: Apply migration 001
cd migrations/001_add_userid_field
mysql -u root -p clubmanager < add_userid_field_fixed.sql
```

### Creating New Migrations

1. Create a new numbered directory: `migrations/XXX_description/`
2. Add your migration SQL file(s)
3. Include a README.md with:
   - Purpose of the migration
   - Dependencies (if any)
   - Rollback instructions
   - Testing notes

## 📊 Database Information

- **Database Name:** `clubmanager`
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Engine:** InnoDB (default)
- **Total Tables:** ~100
- **Language:** English (fully migrated from French)

## 🔧 Maintenance

### Backup

Always backup before making changes:

```bash
# Schema only
mysqldump -u root -p --no-data clubmanager > backup_schema_$(date +%Y%m%d).sql

# Full backup
mysqldump -u root -p clubmanager > backup_full_$(date +%Y%m%d).sql
```

### Export Current Schema

From the API directory:

```bash
cd ../api
node scripts/export-db-schema.js
node scripts/export-db-schema.js --with-data
```

## 🔗 Related Files

- **Prisma Schema:** `../api/prisma/schema.prisma`
- **API Scripts:** `../api/scripts/`
- **Type Definitions:** `../packages/types/`

## 📝 Notes

- All table and column names are in English
- All ENUM values are in English
- Foreign key constraints are enforced
- Indexes are optimized for common queries
- Full-text search is available on specific columns

## 🆘 Troubleshooting

### Common Issues

**Foreign Key Errors:**
```sql
SET FOREIGN_KEY_CHECKS=0;
-- Your operation here
SET FOREIGN_KEY_CHECKS=1;
```

**Character Encoding Issues:**
Ensure your connection uses utf8mb4:
```bash
mysql -u root -p --default-character-set=utf8mb4 clubmanager
```

**Permission Issues:**
Grant necessary privileges:
```sql
GRANT ALL PRIVILEGES ON clubmanager.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📖 Further Reading

- See `docs/` for detailed analysis and improvement suggestions
- Check individual migration READMEs for specific change documentation
- Review stored procedure files for inline documentation

---

**Last Updated:** 2025-02-20  
**Database Version:** 1.0 (English)  
**Maintained by:** ClubManager Development Team