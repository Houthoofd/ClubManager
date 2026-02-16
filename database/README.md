# 🗄️ ClubManager - Database Installation Scripts

## 📋 Overview

This directory contains scripts to **create a fresh ClubManager database** from scratch, including:
- Complete database structure (88+ tables)
- Sample/demo data (users, sports, courses, etc.)
- Indexes and foreign key constraints
- Optional: Stored procedures

---

## 📁 Files in This Directory

| File | Description | Usage |
|------|-------------|-------|
| `generate_install_script.py` | Python script to generate SQL installation file | Run once to create SQL |
| `FULL_DATABASE_INSTALL.sql` | Complete SQL installation script (generated) | Import into MySQL |
| `README.md` | This documentation | Read me! 📖 |

---

## 🚀 Quick Start (3 Methods)

### Method 1: Use the Python Generator (Recommended)

**Prerequisites:**
- Python 3.7+
- MySQL Connector: `pip install mysql-connector-python`
- Existing `clubmanager_test` database (as source)

**Steps:**

```bash
# 1. Install Python dependency
pip install mysql-connector-python

# 2. Run the generator script
cd database
python generate_install_script.py

# 3. Import the generated SQL file
mysql -u root < FULL_DATABASE_INSTALL.sql

# 4. Verify installation
mysql -u root -e "USE clubmanager; SELECT COUNT(*) FROM utilisateurs;"
```

**Output:** Creates `FULL_DATABASE_INSTALL.sql` (~500KB+) with complete database structure and sample data.

---

### Method 2: Manual SQL Export (Using MySQL Workbench)

**Steps:**

1. Open MySQL Workbench
2. Connect to your `clubmanager_test` database
3. Go to **Server** → **Data Export**
4. Select `clubmanager_test` database
5. Select **Export to Self-Contained File**
6. Check **Include Create Schema**
7. Choose **Structure and Data** (or **Structure Only** if you want to add custom data)
8. Click **Start Export**
9. Save as `FULL_DATABASE_INSTALL.sql`

---

### Method 3: Using mysqldump (Command Line)

**For Windows (Laragon):**

```bash
# Full database (structure + data)
C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump -u root clubmanager_test > FULL_DATABASE_INSTALL.sql

# Structure only (if you want to add custom data later)
C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump -u root --no-data clubmanager_test > STRUCTURE_ONLY.sql
```

**For Linux/macOS:**

```bash
# Full database
mysqldump -u root -p clubmanager_test > FULL_DATABASE_INSTALL.sql

# Structure only
mysqldump -u root -p --no-data clubmanager_test > STRUCTURE_ONLY.sql
```

---

## 📊 Sample Data Included

The Python generator creates realistic sample data:

### Users (10 users)
- **1 Admin**: `admin@clubmanager.com` / `Admin123!`
- **3 Professors**: Hiroshi Tanaka (Karaté), Marie Dubois (Judo), Wei Chen (Kung Fu)
- **6 Students**: Lucas, Emma, Noah, Léa, Louis, Sophie

### Sports (5 sports)
- Karaté 🥋
- Judo 🥋
- Taekwondo 🦵
- Kung Fu 🐉
- Boxe 🥊

### Grades (16 grades)
- **Karaté**: 9 grades (white to black belt, 1st-3rd Dan)
- **Judo**: 7 grades (white to black belt)

### Courses
- **9 recurring courses**: Kids, teens, and adults classes
- **4 course instances**: Next 4 weeks scheduled
- **Locations**: 3 training locations (Brussels, Liège)

### Other Data
- Payment methods (Cash, Bank Transfer, Credit Card, Bancontact, PayPal)
- Course types (Kids, Teens, Adults, Competition, Grading)
- Enrollments (8 active enrollments)
- Attendance records (8 attendance entries)
- Payments (4 payment transactions)

---

## 🔧 Installation Instructions

### Step 1: Prepare MySQL

```bash
# Make sure MySQL is running
# Laragon: Start MySQL service
# Linux: sudo systemctl start mysql
```

### Step 2: Generate or Obtain SQL File

Choose one of the 3 methods above to get `FULL_DATABASE_INSTALL.sql`

### Step 3: Install Database

```bash
# Navigate to database directory
cd ClubManager/database

# Import the SQL file
mysql -u root < FULL_DATABASE_INSTALL.sql

# Or with password
mysql -u root -p < FULL_DATABASE_INSTALL.sql
```

### Step 4: Verify Installation

```sql
-- Connect to MySQL
mysql -u root

-- Use the new database
USE clubmanager;

-- Verify tables
SHOW TABLES;

-- Count records
SELECT COUNT(*) AS users FROM utilisateurs;
SELECT COUNT(*) AS sports FROM sports;
SELECT COUNT(*) AS courses FROM cours;

-- Test admin login
SELECT id, nom, prenom, email, role 
FROM utilisateurs 
WHERE email = 'admin@clubmanager.com';
```

**Expected output:**
- 88+ tables
- 10 users
- 5 sports
- 4 course instances

---

## 🎯 Default Admin Credentials

After installation, you can login with:

```
Email:    admin@clubmanager.com
Password: Admin123!
```

**⚠️ IMPORTANT:** Change this password immediately in production!

---

## 🔐 Password Hash Information

All sample users have the same password: `Admin123!`

The bcrypt hash used is:
```
$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx
```

**Note:** This is a **placeholder hash**. For a real installation, generate proper bcrypt hashes:

```javascript
// Node.js example
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Admin123!', 10);
console.log(hash);
```

```python
# Python example
import bcrypt
password = b"Admin123!"
hash = bcrypt.hashpw(password, bcrypt.gensalt())
print(hash.decode())
```

---

## 📦 What Gets Installed

### Database Structure
- ✅ **88+ tables** with complete structure
- ✅ **148 strategic indexes** for optimal performance
- ✅ **43 foreign key constraints** for data integrity
- ✅ **Proper character set**: utf8mb4 (supports emojis)
- ✅ **Soft delete** columns on all relevant tables
- ✅ **Timestamps** (created_at, updated_at) everywhere
- ✅ **RGPD compliance** fields

### Key Tables Include
- **Users & Auth**: `utilisateurs`, `user_security`, `user_profiles`, `sessions`, `validation_tokens`
- **Sports & Grades**: `sports`, `grades`, `user_sports`, `user_grade_history`
- **Courses**: `cours_recurrent`, `cours`, `cours_professeurs`, `inscriptions`, `presences`
- **Payments**: `paiements`, `payment_methods`, `user_subscriptions`
- **Events**: `evenements`, `event_registrations`
- **Communication**: `emails`, `email_queue`, `notifications`
- **Admin**: `audit_logs`, `webhook_logs`

---

## 🔄 Update Prisma After Installation

After installing the database, update your Prisma client:

```bash
# Pull schema from database
cd api
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Verify connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## 🧪 Testing the Installation

### Quick Smoke Test

```sql
-- Test 1: Database exists
SHOW DATABASES LIKE 'clubmanager';

-- Test 2: Tables created
SELECT COUNT(*) FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'clubmanager';

-- Test 3: Sample data exists
SELECT 
    (SELECT COUNT(*) FROM utilisateurs) AS users,
    (SELECT COUNT(*) FROM sports) AS sports,
    (SELECT COUNT(*) FROM cours) AS courses,
    (SELECT COUNT(*) FROM inscriptions) AS enrollments;

-- Test 4: Foreign keys work
SELECT 
    TABLE_NAME, 
    CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'clubmanager' 
AND CONSTRAINT_NAME LIKE 'fk_%'
LIMIT 10;

-- Test 5: Indexes exist
SELECT 
    COUNT(DISTINCT INDEX_NAME) AS total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'clubmanager'
AND INDEX_NAME LIKE 'idx_%';
```

---

## 🆘 Troubleshooting

### Error: "Database already exists"

**Solution:** Drop and recreate
```sql
DROP DATABASE IF EXISTS clubmanager;
-- Then re-run the installation script
```

### Error: "Access denied for user 'root'"

**Solution:** Check MySQL credentials
```bash
# Test connection
mysql -u root -p

# If no password set on Laragon
mysql -u root
```

### Error: "Unknown database 'clubmanager_test'"

**Problem:** The Python generator needs source database

**Solution:** 
1. Use Method 2 or 3 (manual export)
2. Or install Phase 1 Quick Wins first to create `clubmanager_test`

### Error: "Can't create table (errno: 150 Foreign key constraint)"

**Problem:** Foreign key constraint violation

**Solution:**
```sql
-- Check the SQL file has:
SET FOREIGN_KEY_CHECKS=0;
-- at the beginning

-- And:
SET FOREIGN_KEY_CHECKS=1;
-- at the end
```

### Warning: "Some procedures already exist"

**Solution:** This is normal if you ran Phase 1 installation. Stored procedures are optional and can be installed separately.

---

## 📚 Additional Resources

### Related Documentation
- **Phase 1 Quick Wins**: `../api/prisma/migrations/quick_wins_and_procedures/`
- **Phase 2 Optimizations**: `../api/prisma/migrations/phase_2_optimizations/`
- **Prisma Schema**: `../api/prisma/schema.prisma`
- **Database Analysis**: `../DATABASE_ANALYSIS_REPORT.txt`

### Stored Procedures Installation
To install stored procedures after creating the database:
```bash
cd api/prisma/migrations/quick_wins_and_procedures
mysql -u root clubmanager < INSTALL_COMPLETE_SYSTEM.sql
```

---

## 🎓 For Your TFE

This installation script demonstrates:
- ✅ **Professional database design** (3NF normalized)
- ✅ **Complete ERD implementation** (88+ tables)
- ✅ **Sample data for testing** (realistic use cases)
- ✅ **RGPD compliance** (consent, soft delete, audit logs)
- ✅ **Multi-sport architecture** (extensible design)
- ✅ **Production-ready structure** (indexes, FKs, constraints)

---

## 📝 Customization

### Adding Your Own Sample Data

Edit `generate_install_script.py` in the `write_sample_data()` function:

```python
def write_sample_data(f, cursor):
    # Add your custom INSERT statements here
    f.write("""
INSERT INTO sports (nom, description, actif) VALUES
('Your Sport', 'Your description', 1);
""")
```

Then regenerate:
```bash
python generate_install_script.py
```

### Changing Database Name

Edit line 85 in generated SQL or Python script:
```sql
-- Change this line:
CREATE DATABASE clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- To:
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## ✅ Checklist

- [ ] MySQL 8.0+ installed and running
- [ ] Python 3.7+ installed (for generator method)
- [ ] `mysql-connector-python` installed (for generator method)
- [ ] Generated or obtained `FULL_DATABASE_INSTALL.sql`
- [ ] Backed up existing database (if any)
- [ ] Ran installation script
- [ ] Verified tables created
- [ ] Verified sample data inserted
- [ ] Tested admin login credentials
- [ ] Updated Prisma schema (`npx prisma db pull`)
- [ ] Regenerated Prisma client (`npx prisma generate`)
- [ ] Application connects successfully

---

## 🎉 You're Done!

Your ClubManager database is now installed and ready to use!

**Next steps:**
1. Configure your `.env` file with database credentials
2. Start your API server
3. Test the application
4. Change default admin password
5. Add your own data

**Happy coding! 🚀**