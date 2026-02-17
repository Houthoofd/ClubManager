# Database Stored Procedures

This directory contains all stored procedures for the ClubManager application, organized by functional domain.

## 📁 Directory Structure

```
procedures/
├── README.md              # This file
├── _deprecated/           # Deprecated procedures (kept for reference)
├── admin/                 # Administrative procedures
├── analytics/             # Analytics and reporting procedures
├── attendance/            # Attendance tracking procedures
├── auth/                  # Authentication and authorization
├── courses/               # Course management procedures
├── events/                # Event management procedures
├── grades/                # Grade/belt management procedures
├── payments/              # Payment processing procedures
├── reporting/             # Report generation procedures
├── sports/                # Sports/discipline management
└── teachers/              # Teacher management procedures
```

## 📂 Domain Descriptions

### `admin/`
Administrative procedures for system management:
- User management
- System configuration
- Data maintenance
- Bulk operations

### `analytics/`
Analytics and data analysis procedures:
- Statistical calculations
- Trend analysis
- Performance metrics
- Data aggregation

### `attendance/`
Attendance tracking and management:
- Mark attendance
- Attendance reports
- Absence tracking
- Attendance statistics

### `auth/`
Authentication and authorization procedures:
- User login/logout
- Password management
- Session management
- Permission checks

### `courses/`
Course management procedures:
- Create/update courses
- Course scheduling
- Enrollment management
- Course capacity tracking

### `events/`
Event management procedures:
- Event creation
- Event registration
- Event scheduling
- Event notifications

### `grades/`
Grade and belt management procedures:
- Grade assignments
- Promotion tracking
- Grade history
- Belt inventory

### `payments/`
Payment processing procedures:
- Process payments
- Payment validation
- Refund processing
- Payment history

### `reporting/`
Report generation procedures:
- Financial reports
- Attendance reports
- Membership reports
- Custom reports

### `sports/`
Sports and discipline management:
- Sport registration
- Discipline tracking
- Sport categories
- Equipment management

### `teachers/`
Teacher management procedures:
- Teacher assignments
- Schedule management
- Teacher availability
- Performance tracking

### `_deprecated/`
Contains procedures that are no longer in use but kept for:
- Historical reference
- Migration documentation
- Rollback scenarios

**⚠️ Do not use procedures from this directory in production code!**

## 🚀 Using Stored Procedures

### Calling a Stored Procedure

```sql
-- Basic call
CALL procedure_name();

-- With parameters
CALL procedure_name(param1, param2);

-- With output parameters
CALL procedure_name(param1, @output_var);
SELECT @output_var;
```

### From Application Code (Node.js/Prisma)

```typescript
// Using raw SQL with Prisma
const result = await prisma.$queryRaw`
  CALL procedure_name(${param1}, ${param2})
`;
```

## 📝 Stored Procedure Naming Conventions

### Naming Format
```
{action}_{entity}_{details}
```

**Examples:**
- `create_user_account`
- `get_course_enrollments`
- `update_payment_status`
- `delete_expired_sessions`

### Common Action Prefixes
- `create_` - Create new records
- `get_` - Retrieve data
- `update_` - Modify existing records
- `delete_` - Remove records
- `process_` - Execute business logic
- `calculate_` - Perform calculations
- `validate_` - Validation procedures
- `sync_` - Synchronization operations

## 🔧 Creating New Stored Procedures

### Template

```sql
-- ============================================================================
-- Procedure: procedure_name
-- Description: Brief description of what this procedure does
-- Created: YYYY-MM-DD
-- Author: Your Name
-- 
-- Parameters:
--   IN  param1  INT         - Description of param1
--   IN  param2  VARCHAR(50) - Description of param2
--   OUT result  INT         - Description of output
--
-- Returns:
--   Result set with columns: col1, col2, col3
--   OR
--   0 = Success, 1 = Error
--
-- Example:
--   CALL procedure_name(123, 'value', @result);
--   SELECT @result;
--
-- Dependencies:
--   - table_name
--   - other_procedure
--
-- Notes:
--   - Any important notes or warnings
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS procedure_name$$

CREATE PROCEDURE procedure_name(
    IN param1 INT,
    IN param2 VARCHAR(50),
    OUT result INT
)
BEGIN
    -- Declare variables
    DECLARE v_error_count INT DEFAULT 0;
    
    -- Declare error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Error handling code
        SET result = 1;
        ROLLBACK;
    END;
    
    -- Start transaction (if needed)
    START TRANSACTION;
    
    -- Main procedure logic here
    
    -- Success
    SET result = 0;
    COMMIT;
    
END$$

DELIMITER ;
```

### Best Practices

#### Do's ✅
- **Use meaningful names** that describe the procedure's purpose
- **Document thoroughly** with header comments
- **Handle errors** with proper error handlers
- **Use transactions** for data modifications
- **Validate inputs** before processing
- **Return consistent results** (success/error codes)
- **Keep procedures focused** on a single responsibility
- **Use parameters** instead of hardcoded values
- **Test thoroughly** before deployment

#### Don'ts ❌
- **Don't create** god procedures that do everything
- **Avoid dynamic SQL** unless absolutely necessary
- **Don't ignore** error conditions
- **Don't use** SELECT * in procedures
- **Avoid nested** procedures when possible
- **Don't modify** tables you don't own
- **Don't hardcode** sensitive information

## 🧪 Testing Stored Procedures

### Unit Testing Approach

```sql
-- Test script template
-- Test: procedure_name

-- Setup test data
START TRANSACTION;

-- Test case 1: Normal operation
CALL procedure_name(test_param1, test_param2, @result);
SELECT @result AS 'Test 1 - Normal operation';
-- Expected: 0

-- Test case 2: Invalid input
CALL procedure_name(NULL, test_param2, @result);
SELECT @result AS 'Test 2 - Invalid input';
-- Expected: 1

-- Test case 3: Edge case
-- ...

-- Cleanup
ROLLBACK;
```

## 📊 Performance Considerations

### Optimization Tips
- **Use indexes** on columns used in WHERE clauses
- **Limit result sets** with TOP/LIMIT when appropriate
- **Avoid cursors** when set-based operations work
- **Use EXPLAIN** to analyze query plans
- **Cache frequently** used calculations
- **Batch operations** when processing multiple records

### Monitoring
```sql
-- Check procedure execution time
SHOW PROCEDURE STATUS WHERE Name = 'procedure_name';

-- Profile a procedure call
SET profiling = 1;
CALL procedure_name(params);
SHOW PROFILES;
```

## 🔐 Security Considerations

### Input Validation
```sql
-- Always validate inputs
IF param1 IS NULL OR param1 < 1 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid parameter: param1 must be positive';
END IF;
```

### SQL Injection Prevention
- Use parameterized queries
- Avoid dynamic SQL construction
- Validate and sanitize all inputs
- Use prepared statements when dynamic SQL is required

### Access Control
- Grant execute permissions only to necessary users
- Use DEFINER vs INVOKER appropriately
- Audit sensitive procedure calls
- Log access to critical procedures

## 🔄 Deployment Process

1. **Development**
   - Write procedure
   - Test locally
   - Document thoroughly

2. **Code Review**
   - Peer review
   - Security review
   - Performance review

3. **Testing**
   - Unit tests
   - Integration tests
   - Load tests (if applicable)

4. **Staging**
   - Deploy to staging
   - Run full test suite
   - Verify functionality

5. **Production**
   - Schedule deployment window
   - Backup current procedures
   - Deploy new procedure
   - Verify and monitor

## 🛠️ Maintenance

### Updating Existing Procedures
1. Never modify a procedure in production directly
2. Test changes in development first
3. Document what changed and why
4. Consider versioning for major changes
5. Plan for backward compatibility

### Deprecation Process
1. Mark procedure as deprecated in comments
2. Create new replacement procedure
3. Update all calling code
4. Move to `_deprecated/` directory
5. Remove after grace period

### Cleanup
- Regularly review procedure usage
- Remove unused procedures
- Archive old versions
- Update documentation

## 📖 Additional Resources

- **MySQL Stored Procedure Documentation:** https://dev.mysql.com/doc/refman/8.0/en/stored-programs.html
- **Main DB README:** `../../README.md`
- **Migration Guide:** `../../migrations/README.md`
- **Database Schema:** `../../schema/`

## 🔍 Finding Procedures

### By Name
```sql
SHOW PROCEDURE STATUS WHERE Db = 'clubmanager' AND Name LIKE '%search_term%';
```

### By Content
```bash
# From command line
grep -r "search_term" procedures/
```

### List All Procedures
```sql
SELECT ROUTINE_NAME, ROUTINE_SCHEMA, CREATED, LAST_ALTERED
FROM information_schema.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_SCHEMA = 'clubmanager'
ORDER BY ROUTINE_NAME;
```

## 💡 Common Patterns

### CRUD Operations
- `create_entity` - Create new record
- `get_entity_by_id` - Retrieve single record
- `get_entities` - Retrieve multiple records
- `update_entity` - Update existing record
- `delete_entity` - Delete record

### Batch Operations
- `process_batch` - Process multiple records
- `import_data` - Bulk data import
- `export_data` - Bulk data export

### Calculations
- `calculate_total` - Sum/aggregate operations
- `compute_statistics` - Statistical calculations
- `generate_report` - Report generation

---

**Last Updated:** 2025-02-20  
**Total Procedures:** Organized across 11 domains  
**Maintained by:** ClubManager Development Team