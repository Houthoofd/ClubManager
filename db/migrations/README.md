# Database Migrations

This directory contains versioned database migrations for the ClubManager application. Each migration is organized in its own numbered directory and represents a specific schema change or improvement.

## 📋 Migration History

### 001_add_userid_field
**Purpose:** Add user ID field to relevant tables  
**Files:**
- `add_userid_field.sql` - Initial version
- `add_userid_field_fixed.sql` - Fixed version (use this one)

**Status:** ✅ Applied

---

### 002_birth_date_constraints
**Purpose:** Add validation constraints for birth date fields  
**Files:**
- `add_birth_date_constraints.sql` - Add constraints
- `update_birth_date_constraints.sql` - Update existing constraints

**Status:** ✅ Applied

---

### 003_unique_person_constraint
**Purpose:** Ensure unique person identification in the system  
**Files:**
- `add_active_flag_to_users.sql` - Add active flag to users table
- `add_unique_person_constraint.sql` - Add unique constraint

**Status:** ✅ Applied

---

### 004_paiements_constraints
**Purpose:** Update payment table constraints and validations  
**Files:**
- `update_paiements_constraints.sql` - Initial constraints
- `update_paiements_constraints_complete.sql` - Complete constraints
- `update_paiements_table_fixed.sql` - Fixed version (use this one)

**Status:** ✅ Applied

---

### 005_naming_standardization
**Purpose:** Migrate all French table/column names to English  
**Files:**
- `01_rename_tables_fr_to_en.sql` - Rename tables from French to English
- `02_rollback_rename_tables.sql` - Rollback script
- `03_remove_compatibility_views.sql` - Remove temporary compatibility views
- `04_update_prisma_schema.cjs` - Update Prisma schema
- `backup_pre_migration.sql` - Pre-migration backup
- `INSTALL_MIGRATION.bat` - Installation script
- `README.txt` - Detailed migration notes

**Status:** ✅ Applied

---

## 🚀 Applying Migrations

### Prerequisites
- MySQL 8.0 or higher
- Database backup (always backup before migrations!)
- Appropriate database permissions

### Steps

1. **Backup your database:**
   ```bash
   mysqldump -u root -p clubmanager > backup_$(date +%Y%m%d).sql
   ```

2. **Navigate to the migration directory:**
   ```bash
   cd migrations/XXX_migration_name/
   ```

3. **Review the migration files:**
   - Read any README or documentation
   - Understand what changes will be applied
   - Check for dependencies on previous migrations

4. **Apply the migration:**
   ```bash
   mysql -u root -p clubmanager < migration_file.sql
   ```

5. **Verify the migration:**
   ```bash
   mysql -u root -p clubmanager
   ```
   Then run verification queries to ensure changes were applied correctly.

6. **Update Prisma schema (if needed):**
   ```bash
   cd ../../api
   npx prisma db pull
   npx prisma generate
   ```

## 📝 Creating New Migrations

### Naming Convention
Use the format: `XXX_description_of_change/`

Where:
- `XXX` = Next sequential number (001, 002, etc.)
- `description_of_change` = Brief, lowercase, underscore-separated description

**Examples:**
- `006_add_user_preferences/`
- `007_create_audit_log/`
- `008_update_index_strategy/`

### Migration Template

Create a new directory and include:

1. **Migration SQL file(s):**
   ```sql
   -- Migration: XXX - Description
   -- Created: YYYY-MM-DD
   -- Author: Your Name
   
   -- Check prerequisites
   -- Add your migration SQL here
   
   -- Verify changes
   ```

2. **README.md:**
   ```markdown
   # Migration XXX: Description
   
   ## Purpose
   Brief description of what this migration does.
   
   ## Changes
   - List of changes
   - Tables affected
   - Columns added/modified/removed
   
   ## Dependencies
   - Previous migrations required
   - External dependencies
   
   ## Rollback
   How to rollback this migration if needed.
   
   ## Verification
   How to verify the migration was successful.
   
   ## Notes
   Any important notes or warnings.
   ```

3. **Rollback script (optional but recommended):**
   ```sql
   -- Rollback for Migration XXX
   -- Undo changes in reverse order
   ```

## ⚠️ Best Practices

### Do's ✅
- **Always backup** before applying migrations
- **Test migrations** on a development database first
- **Use transactions** when possible
- **Make migrations idempotent** (can be run multiple times safely)
- **Document changes** thoroughly
- **Version control** all migration files
- **Review before applying** to production
- **Apply in sequence** - never skip migrations

### Don'ts ❌
- **Never modify** existing migration files after they've been applied
- **Don't skip** migration numbers
- **Don't make** destructive changes without backups
- **Avoid large data** migrations during peak hours
- **Don't assume** database state - always check prerequisites

## 🔄 Migration Workflow

```
1. Create migration directory
        ↓
2. Write migration SQL
        ↓
3. Test on local database
        ↓
4. Review and document
        ↓
5. Commit to version control
        ↓
6. Apply to development
        ↓
7. Test application
        ↓
8. Apply to staging
        ↓
9. Final testing
        ↓
10. Apply to production
        ↓
11. Monitor and verify
```

## 🛠️ Troubleshooting

### Migration fails midway
```bash
# Restore from backup
mysql -u root -p clubmanager < backup_YYYYMMDD.sql

# Fix the migration file
# Test again on a fresh copy
```

### Foreign key constraint errors
```sql
-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS=0;
-- Run your migration
SET FOREIGN_KEY_CHECKS=1;
```

### Syntax errors
- Check MySQL version compatibility
- Verify SQL syntax
- Look for special characters or encoding issues

### Rollback needed
1. Apply the rollback script if available
2. Or restore from backup
3. Document what went wrong
4. Fix and test before re-applying

## 📊 Migration Status Tracking

To check which migrations have been applied:

```sql
-- Check tables exist
SHOW TABLES LIKE 'pattern%';

-- Check columns exist
SHOW COLUMNS FROM table_name;

-- Check constraints
SELECT * FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'clubmanager';
```

Consider creating a `schema_migrations` table to track applied migrations:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    applied_by VARCHAR(100)
);
```

## 🔗 Related Documentation

- **Main DB README:** `../README.md`
- **Schema exports:** `../schema/`
- **Database docs:** `../docs/`
- **Prisma schema:** `../../api/prisma/schema.prisma`

## 📞 Support

If you encounter issues with migrations:
1. Check this README and migration-specific documentation
2. Review similar past migrations
3. Test on a local copy first
4. Consult the team before applying to production

---

**Last Updated:** 2025-02-20  
**Total Migrations:** 5  
**Latest Migration:** 005_naming_standardization