# Database Migrations

This directory contains Prisma migrations for the ClubManager database.

## Recent Migration: Email Queue and Emails Models

### Overview

This migration adds two new tables to support email functionality:

1. **`email_queue`** - Queue for asynchronous email sending
2. **`emails`** - Archive of sent emails for tracking and audit

### What's New

#### Email Queue Table
- Manages asynchronous email sending with retry logic
- Supports priority-based processing
- Tracks send attempts and errors
- Automatic retry scheduling with exponential backoff

Fields:
- `id`, `to`, `subject`, `templateTitle`, `variables`, `htmlContent`
- `attempts`, `maxAttempts`, `status`, `priority`
- `nextRetryAt`, `lastError`, `errorDetails`
- `userId` (foreign key to users)
- Timestamps: `createdAt`, `updatedAt`, `processedAt`

Statuses: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

#### Emails Table
- Archives all sent emails
- Tracks delivery status and user interactions
- Links to users for audit trail

Fields:
- `id` (UUID), `to`, `subject`, `content`, `htmlContent`
- `utilisateurId` (foreign key to users)
- `status`, `provider`, `messageId`, `error`, `metadata`
- Tracking: `sentAt`, `deliveredAt`, `openedAt`, `clickedAt`, `bouncedAt`
- `createdAt`

Statuses: `SENT`, `FAILED`, `BOUNCED`, `DELIVERED`

### Bug Fixes

This migration also fixes two existing fulltext indexes that were causing Prisma validation errors:

1. **`events.ft_events_search`** - Added length constraint to `description` field
2. **`articles.ft_articles_search`** - Added length constraint to `description` field

MySQL requires a length specification for TEXT fields in indexes.

## How to Apply This Migration

### Prerequisites

1. Ensure MySQL database is running
2. Backup your database before applying migrations

```bash
mysqldump -u root -p clubmanager_test > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Option 1: Using Prisma CLI (Recommended)

```bash
cd api
npx prisma migrate dev
```

This will:
- Apply pending migrations
- Regenerate Prisma Client
- Update database schema

### Option 2: Manual SQL Execution

If you prefer to apply the migration manually:

```bash
cd api/prisma/migrations
mysql -u root -p clubmanager_test < add_email_queue_and_emails_models.sql
```

Then regenerate Prisma Client:

```bash
cd api
npx prisma generate
```

### Option 3: Using Prisma Studio

```bash
cd api
npx prisma studio
```

Then apply migrations through the UI.

## Verification

After applying the migration, verify the tables exist:

```sql
SHOW TABLES LIKE 'email%';
DESCRIBE email_queue;
DESCRIBE emails;
```

Check the enums were created:

```sql
SHOW COLUMNS FROM email_queue LIKE 'status';
SHOW COLUMNS FROM emails LIKE 'status';
```

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS email_queue;
DROP TABLE IF EXISTS emails;

-- Restore original indexes (if needed)
DROP INDEX ft_events_search ON events;
CREATE FULLTEXT INDEX ft_events_search ON events(title, description);

DROP INDEX ft_articles_search ON articles;
CREATE FULLTEXT INDEX ft_articles_search ON articles(name, description);
```

## Related Code Changes

This migration enables the following features:

### Backend Services
- **Email Queue Worker** (`api/src/infrastructure/external-services/email/email-queue-worker.ts`)
  - Processes queued emails asynchronously
  - Implements retry logic with exponential backoff
  - Alerts admins on permanent failures

- **SendGrid Sender** (`api/src/infrastructure/external-services/email/sendgrid-sender.ts`)
  - Archives sent emails to database
  - Tracks delivery status

### Usage Example

```typescript
import { PrismaClient, EmailQueueStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Queue an email
await prisma.email_queue.create({
  data: {
    to: 'user@example.com',
    subject: 'Welcome!',
    templateTitle: 'welcome_email',
    variables: { name: 'John' },
    status: EmailQueueStatus.PENDING,
    priority: 1,
    userId: 123
  }
});

// Archive a sent email
await prisma.emails.create({
  data: {
    to: 'user@example.com',
    subject: 'Welcome!',
    htmlContent: '<h1>Welcome!</h1>',
    utilisateurId: 123,
    status: 'SENT',
    provider: 'sendgrid',
    messageId: 'msg_123',
    metadata: {
      savedBy: 'SendGridSender',
      timestamp: new Date().toISOString()
    }
  }
});
```

## Troubleshooting

### Error: "Property 'email_queue' does not exist on type 'PrismaClient'"

**Solution:** Regenerate Prisma Client and restart TypeScript server

```bash
cd api
npx prisma generate
```

Then restart your IDE/editor's TypeScript server.

### Error: "Module '@prisma/client' has no exported member 'EmailQueueStatus'"

**Solution:** Same as above - regenerate client and restart TypeScript server.

### Error: "Can't reach database server"

**Solution:** Start your MySQL database

```bash
# Using Docker
docker-compose up -d mysql

# Or start MySQL service
sudo service mysql start  # Linux
brew services start mysql  # macOS
```

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2024 | `add_email_queue_and_emails_models` | Added email queue and emails tables + fixed fulltext indexes |

## Next Steps

After applying this migration:

1. ✅ Email queue worker can process emails asynchronously
2. ✅ Emails are archived to database for audit trail
3. ✅ Circuit breaker can alert admins on failures
4. ✅ SendGrid sender can track email delivery status

## Support

For questions or issues:
- Check Prisma documentation: https://www.prisma.io/docs
- Review migration file: `add_email_queue_and_emails_models.sql`
- Contact the development team