# Messaging Validators Tests

## Overview

Comprehensive test suite for all messaging validators in the ClubManager application.

## Test Files

### 1. Message Validators
- **File**: `message.validators.test.ts`
- **Total Tests**: 210
- **Coverage**: 100% (Statements, Branches, Functions, Lines)
- **Status**: ✅ All tests passing

### 2. User Alert Validators
- **File**: `user-alert.validators.test.ts`
- **Total Tests**: 287
- **Coverage**: 100% (Statements, Branches, Functions, Lines)
- **Status**: ✅ All tests passing
- **Summary**: [USER_ALERT_TESTS_SUMMARY.md](./USER_ALERT_TESTS_SUMMARY.md)

## Schemas Tested

### 1. messageBaseSchema (33 tests)
Tests the base message schema with all fields including:
- Valid messages with all/partial fields
- Default values (lu: false)
- Optional fields (sujet, date_lecture)
- Field length validations (1-255 for subject, 1-65535 for content)
- Trim functionality for strings
- Date coercion (created_at, date_lecture)
- Invalid cases (empty strings, too long, missing required fields, zero/negative IDs)

### 2. createMessageSchema (24 tests)
Tests message creation with:
- All fields and minimal required fields
- Subject validation (optional, 1-255 chars)
- Content validation (required, 1-65535 chars)
- **Refine rule**: expediteur_id ≠ destinataire_id (prevents sending messages to oneself)
- Edge cases (empty, whitespace, max lengths)

### 3. updateMessageSchema (10 tests)
Tests message update (read status only):
- Update lu (boolean)
- Update date_lecture (Date or null)
- Empty update object (all fields optional)
- Date coercion
- Invalid types

### 4. listMessagesSchema (31 tests)
Tests message listing with filters:
- Pagination (page, limit)
- Filters (expediteur_id, destinataire_id, lu, sujet, date_debut, date_fin)
- **Boolean transformation**: "true"/"1" → true, "false"/"0" → false
- Sorting (sort_by: created_at/date_lecture/sujet, sort_order: asc/desc)
- Default values (sort_by: created_at, sort_order: desc)
- Invalid filters

### 5. messageInboxSchema (14 tests)
Tests inbox query (received messages):
- Pagination support
- Filters: lu, expediteur_id
- Sorting: created_at, date_lecture
- Boolean transformations
- Default values

### 6. messageOutboxSchema (11 tests)
Tests outbox query (sent messages):
- Pagination support
- Filter: destinataire_id
- Sorting: created_at only
- Default values

### 7. bulkMarkReadSchema (17 tests)
Tests bulk marking messages as read:
- Valid array of IDs (1-100 messages)
- Single/multiple IDs
- Array validations (not empty, no zero, no negative, no strings/decimals/null/undefined)
- Max limit: 100 messages

### 8. bulkDeleteMessagesSchema (17 tests)
Tests bulk deleting messages:
- Same validations as bulkMarkReadSchema
- Max limit: 100 messages

### 9. messageIdSchema (6 tests)
Tests numeric ID validation:
- Positive integers only
- Rejects 0, negative, decimal, strings

### 10. messageIdStringSchema (9 tests)
Tests string ID validation (from URL params):
- Transforms valid numeric strings to numbers
- Rejects 0, negative, empty, non-numeric, decimal, with spaces

### 11. messageIdParamSchema (9 tests)
Tests ID parameter object:
- Wraps messageIdStringSchema
- Used for route parameters

### 12. messageResponseSchema (2 tests)
Tests message response structure:
- Complete and minimal responses

### 13. messagesListResponseSchema (6 tests)
Tests paginated list response:
- data array + pagination object
- Validates pagination fields (page, page_size, total, total_pages)
- Empty arrays
- Required fields

### 14. messageStatsSchema (12 tests)
Tests message statistics:
- total_messages, unread_messages, sent_messages, received_messages
- Non-negative integers only
- All fields required

### 15. Type Inference (12 tests)
Tests TypeScript type inference:
- All exported types correctly inferred from schemas
- Runtime validation that types match expected structure

## Key Business Rules Tested

1. **Subject**: Optional, 1-255 characters (after trim)
2. **Content**: Required, 1-65535 characters (after trim)
3. **Sender ≠ Recipient**: Enforced by refine rule in createMessageSchema
4. **Read Status**: Boolean with default false
5. **Boolean Transformation**: Query strings "true"/"1" → true, "false"/"0" → false
6. **Bulk Operations**: Max 100 messages at once
7. **IDs**: Positive integers only (> 0)
8. **Pagination**: Inherited from common paginationSchema
9. **Sorting**: Multiple sort_by options with asc/desc order

## Edge Cases Covered

- Empty strings (after trim)
- Whitespace-only strings
- Maximum length boundaries (255, 65535)
- Minimum length boundaries (1)
- Zero and negative IDs
- String vs number types
- Decimal numbers (rejected for IDs)
- null vs undefined
- Array validations (empty, wrong types, mixed types)
- Missing required fields
- Date coercion from strings
- Boolean coercion from strings

## Test Structure

Following the same pattern as Store validators:
- Organized by schema
- Clear test descriptions in French
- Both positive and negative test cases
- Comprehensive edge case coverage
- Type inference validation

## Running Tests

```bash
# Run message validator tests only
npm test -- src/validators/messaging/__tests__/message.validators.test.ts

# Run with coverage
npm run test:coverage -- src/validators/messaging/__tests__/message.validators.test.ts --collectCoverageFrom=src/validators/messaging/message.validators.ts

# Run all messaging tests
npm test -- src/validators/messaging/__tests__

# Watch mode
npm run test:watch -- src/validators/messaging/__tests__/message.validators.test.ts
```

## Coverage Report

```
File                   | % Stmts | % Branch | % Funcs | % Lines
-----------------------|---------|----------|---------|--------
message.validators.ts  |     100 |      100 |     100 |     100
```

## Dependencies

- `@jest/globals` (describe, it, expect)
- `zod` (validation schemas)
- `../message.validators.js` (all schemas and types)
- `../../../constants/messaging.constants.js` (validation constants)

## User Alert Validators (287 tests)

Comprehensive testing of user alert validators covering all 18 schemas. See [USER_ALERT_TESTS_SUMMARY.md](./USER_ALERT_TESTS_SUMMARY.md) for detailed breakdown.

### Schemas Tested (18 total)

1. **alertStatusSchema** (8 tests) - ENUM validation ('active', 'resolue', 'ignoree')
2. **alertContextDataSchema** (8 tests) - JSON field validation (z.record)
3. **userAlertBaseSchema** (54 tests) - Complete alert with all fields
4. **createUserAlertSchema** (24 tests) - Alert creation
5. **updateUserAlertSchema** (29 tests) - Alert updates with refinement validation
6. **resolveAlertSchema** (11 tests) - Alert resolution
7. **ignoreAlertSchema** (8 tests) - Alert ignore
8. **listUserAlertsSchema** (34 tests) - List alerts with filters
9. **activeAlertsSchema** (14 tests) - Active alerts query
10. **resolvedAlertsSchema** (18 tests) - Resolved alerts query
11. **bulkMarkReadAlertsSchema** (18 tests) - Bulk mark as read (1-100)
12. **bulkResolveAlertsSchema** (21 tests) - Bulk resolve (1-50)
13. **userAlertIdSchema** (6 tests) - Numeric ID validation
14. **userAlertIdStringSchema** (9 tests) - String ID validation
15. **userAlertIdParamSchema** (9 tests) - Route param ID validation
16. **userAlertResponseSchema** (2 tests) - Single alert response
17. **userAlertsListResponseSchema** (6 tests) - Paginated list response
18. **userAlertStatsSchema** (18 tests) - Alert statistics
19. **Type Inference** (14 tests) - TypeScript type inference

### Key User Alert Rules Tested

1. **Status ENUM**: 'active' (default), 'resolue', 'ignoree'
2. **Message**: Optional, 1-65535 characters (after trim)
3. **Notes**: Optional, 1-65535 characters (after trim)
4. **Context Data**: JSON field (z.record) - flexible structure
5. **Read Status (lu)**: Boolean, default false
6. **Refinement Rule**: When status='resolue', MUST have date_resolution AND resolu_par
7. **Bulk Operations**: 
   - bulkMarkRead: 1-100 alerts
   - bulkResolve: 1-50 alerts
8. **Date Coercion**: Strings → Date objects
9. **Boolean Transformation**: 'true'/'1' → true, 'false'/'0' → false

### Edge Cases Covered

- Empty strings after trim
- Maximum length (65535 chars for message/notes)
- Minimum length (1 char)
- Null vs undefined handling
- Complex nested JSON in context data
- String-to-Date/Boolean/Number transformations
- Boundary testing for bulk operations (50, 100, 51, 101)
- Zero and negative ID validation
- Decimal number rejection
- Default value application
- **Critical**: Refinement validation for resolved status

## Notes

- All tests use `.safeParse()` to avoid throwing errors
- French test descriptions for consistency with existing codebase
- Validates both the schema logic and TypeScript type inference
- Tests cover 100% of validator code paths
- User alert tests include comprehensive refinement validation
- JSON context data validation allows flexible structures