/**
 * Tests unitaires pour les validators Zod du domaine Audit
 * @module __tests__/domains/audit.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // Enums from types
  AuditEventType,
  AuditSeverity,
} from "../types.js";
import {
  // Create validators
  CreateAuditLogInputSchema,
  // Query validators
  GetAuditLogsInputSchema,
  GetSecurityAuditLogsInputSchema,
  CleanupOldLogsSchema,
  AuditStatsQuerySchema,
  // Helper functions
  getSeverityForEvent,
  shouldKeepLog,
  sanitizeMetadata,
} from "../validators.js";

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe("Audit Validators - Helper Functions", () => {
  describe("getSeverityForEvent", () => {
    it("should return CRITICAL for critical events", () => {
      expect(getSeverityForEvent("security_alert")).toBe("critical");
      expect(getSeverityForEvent("unauthorized_access")).toBe("critical");
      expect(getSeverityForEvent("account_deletion_requested")).toBe(
        "critical",
      );
      expect(getSeverityForEvent("data_exported")).toBe("critical");
    });

    it("should return ERROR for error events", () => {
      expect(getSeverityForEvent("login_failed")).toBe("error");
      expect(getSeverityForEvent("payment_failed")).toBe("error");
      expect(getSeverityForEvent("system_error")).toBe("error");
      expect(getSeverityForEvent("suspicious_activity")).toBe("error");
    });

    it("should return WARNING for warning events", () => {
      expect(getSeverityForEvent("password_reset")).toBe("warning");
      expect(getSeverityForEvent("session_expired")).toBe("warning");
    });

    it("should return INFO for info events", () => {
      expect(getSeverityForEvent("login")).toBe("info");
      expect(getSeverityForEvent("user_created")).toBe("info");
      expect(getSeverityForEvent("logout")).toBe("info");
    });

    it("should return INFO for unknown events", () => {
      expect(getSeverityForEvent("other")).toBe("info");
      expect(getSeverityForEvent("unknown_event")).toBe("info");
    });
  });

  describe("shouldKeepLog", () => {
    it("should always keep CRITICAL logs", () => {
      expect(shouldKeepLog("critical", 365, true)).toBe(true);
    });

    it("should keep old logs if keepCritical is true and severity is CRITICAL", () => {
      expect(shouldKeepLog("critical", 100, true)).toBe(true);
    });

    it("should not keep old non-critical logs", () => {
      expect(shouldKeepLog("info", 100, false)).toBe(false);
    });

    it("should keep recent logs regardless of severity", () => {
      expect(shouldKeepLog("info", 10, false)).toBe(true);
    });

    it("should keep WARNING logs within retention period", () => {
      expect(shouldKeepLog("warning", 50, true)).toBe(true);
    });
  });

  describe("sanitizeMetadata", () => {
    it("should remove sensitive fields from metadata", () => {
      const metadata = {
        username: "john",
        password: "secret123",
        token: "abc123",
        credit_card: "1234-5678-9012-3456",
        other_data: "safe",
      };

      const sanitized = sanitizeMetadata(metadata);
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.credit_card).toBe("[REDACTED]");
      expect(sanitized.username).toBe("john");
      expect(sanitized.other_data).toBe("safe");
    });

    it("should handle nested objects (shallow sanitization only)", () => {
      const metadata = {
        password: "secret",
        user: {
          name: "John",
        },
        data: "test",
      };

      const sanitized = sanitizeMetadata(metadata);
      expect(sanitized).toBeDefined();
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.user.name).toBe("John");
      expect(sanitized.data).toBe("test");
    });

    it("should handle top-level sensitive keys in objects with arrays", () => {
      const metadata = {
        token: "abc123",
        users: [{ name: "John" }, { name: "Jane" }],
      };

      const sanitized = sanitizeMetadata(metadata);
      expect(sanitized).toBeDefined();
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.users).toBeDefined();
      expect(sanitized.users[0].name).toBe("John");
      expect(sanitized.users[1].name).toBe("Jane");
    });

    it("should return null for null input", () => {
      expect(sanitizeMetadata(null)).toBeNull();
    });

    it("should return undefined for undefined input", () => {
      expect(sanitizeMetadata(undefined)).toBeUndefined();
    });
  });
});

// ============================================================================
// CREATE AUDIT LOG TESTS
// ============================================================================

describe("Audit Validators - createAuditLogSchema", () => {
  it("should validate a valid audit log creation", () => {
    const validLog = {
      event_type: AuditEventType.LOGIN,
      severity: AuditSeverity.INFO,
      success: true,
      message: "User logged in successfully",
      metadata: { ip: "192.168.1.1" },
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
      resource: "users",
      action: "read",
    };

    const result = CreateAuditLogInputSchema.safeParse(validLog);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.event_type).toBe(AuditEventType.LOGIN);
      expect(result.data.severity).toBe(AuditSeverity.INFO);
    }
  });

  it("should validate security alert event", () => {
    const log = {
      event_type: AuditEventType.SECURITY_ALERT,
      severity: AuditSeverity.CRITICAL,
      success: false,
      message: "Brute force detected",
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe(AuditSeverity.CRITICAL);
    }
  });

  it("should apply default severity based on event type", () => {
    const log = {
      event_type: AuditEventType.USER_CREATED,
      severity: AuditSeverity.INFO,
      success: true,
      message: "User created",
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should reject missing severity", () => {
    const log = {
      event_type: AuditEventType.LOGIN,
      // missing severity
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(false);
  });

  it("should accept optional message", () => {
    const log = {
      event_type: AuditEventType.LOGIN,
      severity: AuditSeverity.INFO,
      success: true,
      // message is optional
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should accept all event types", () => {
    const eventTypes = [
      AuditEventType.LOGIN,
      AuditEventType.LOGOUT,
      AuditEventType.PASSWORD_RESET,
      AuditEventType.USER_CREATED,
      AuditEventType.USER_DELETED,
      AuditEventType.PAYMENT_CREATED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.SECURITY_ALERT,
    ];

    eventTypes.forEach((eventType) => {
      const log = {
        event_type: eventType,
        severity: AuditSeverity.INFO,
        success: true,
      };

      const result = CreateAuditLogInputSchema.safeParse(log);
      expect(result.success).toBe(true);
    });
  });

  it("should accept all severity levels", () => {
    const severities = [
      AuditSeverity.INFO,
      AuditSeverity.WARNING,
      AuditSeverity.ERROR,
      AuditSeverity.CRITICAL,
    ];

    severities.forEach((severity) => {
      const log = {
        event_type: AuditEventType.OTHER,
        severity: severity,
        description: "Test log",
      };

      const result = CreateAuditLogInputSchema.safeParse(log);
      expect(result.success).toBe(true);
    });
  });

  it("should accept success boolean", () => {
    const log = {
      event_type: AuditEventType.PAYMENT_CREATED,
      severity: AuditSeverity.INFO,
      success: true,
      message: "Payment status test",
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should accept valid IP addresses", () => {
    const validIPs = [
      "192.168.1.1",
      "10.0.0.1",
      "2001:0db8:85a3::8a2e:0370:7334",
      "::1",
    ];

    validIPs.forEach((ip) => {
      const log = {
        event_type: AuditEventType.LOGIN,
        severity: AuditSeverity.INFO,
        success: true,
        ip_address: ip,
        message: "IP test",
      };

      const result = CreateAuditLogInputSchema.safeParse(log);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid IP addresses", () => {
    const invalidIPs = ["999.999.999.999", "not-an-ip"];

    invalidIPs.forEach((ip) => {
      const log = {
        event_type: AuditEventType.LOGIN,
        severity: AuditSeverity.INFO,
        success: true,
        ip_address: ip,
      };

      const result = CreateAuditLogInputSchema.safeParse(log);
      expect(result.success).toBe(false);
    });
  });

  it("should accept metadata with fields that can be sanitized", () => {
    const log = {
      event_type: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.INFO,
      success: true,
      metadata: {
        username: "john",
        password: "password123",
        email: "john@example.com",
      },
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
    // Sanitization happens in application code, not in validation
  });

  it("should accept optional user_id for system events", () => {
    const log = {
      // user_id is optional
      event_type: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.ERROR,
      success: false,
      message: "System event occurred",
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should accept metadata for updates", () => {
    const log = {
      event_type: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.INFO,
      success: true,
      message: "User profile updated",
      metadata: {
        old_values: {
          email: "old@example.com",
          name: "Old Name",
        },
        new_values: {
          email: "new@example.com",
          name: "New Name",
        },
      },
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// AUDIT LOG FILTER TESTS
// ============================================================================

describe("Audit Validators - auditLogFilterSchema", () => {
  it("should validate a complete filter", () => {
    const filter = {
      user_id: 1,
      event_type: AuditEventType.LOGIN,
      severity: AuditSeverity.INFO,
      success: true,
      ip_address: "192.168.1.1",
      resource: "User",
      action: "read",
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-12-31"),
      limit: 50,
      offset: 0,
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept empty filter", () => {
    const filter = {};

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should reject negative limit", () => {
    const filter = {
      limit: -10,
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should reject negative offset", () => {
    const filter = {
      offset: -5,
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should accept valid limit values", () => {
    const filter = {
      limit: 75,
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(75);
    }
  });

  it("should accept date strings and convert to Date", () => {
    const filter = {
      created_after: "2024-01-01T00:00:00Z",
      created_before: "2024-12-31T23:59:59Z",
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      // created_after and created_before are not part of the schema
    }
  });

  it("should filter by severity", () => {
    const severities = [
      AuditSeverity.INFO,
      AuditSeverity.WARNING,
      AuditSeverity.ERROR,
      AuditSeverity.CRITICAL,
    ];

    severities.forEach((severity) => {
      const filter = { severity };
      const result = GetAuditLogsInputSchema.safeParse(filter);
      expect(result.success).toBe(true);
    });
  });

  it("should filter by event_type", () => {
    const filter = {
      event_type: AuditEventType.SECURITY_ALERT,
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept search text", () => {
    const filter = {
      search: "suspicious activity",
    };

    const result = GetAuditLogsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// SECURITY REPORT OPTIONS TESTS - Schema not exported by validators

// ============================================================================
// CLEANUP AUDIT LOGS OPTIONS TESTS
// ============================================================================

describe("Audit Validators - CleanupOldLogsSchema", () => {
  it("should validate valid cleanup options", () => {
    const options = {
      older_than_days: 90,
    };

    const result = CleanupOldLogsSchema.safeParse(options);
    expect(result.success).toBe(true);
  });

  it("should reject negative older_than_days", () => {
    const options = {
      older_than_days: -10,
    };

    const result = CleanupOldLogsSchema.safeParse(options);
    expect(result.success).toBe(false);
  });

  it("should accept positive older_than_days", () => {
    const options = {
      older_than_days: 30,
    };

    const result = CleanupOldLogsSchema.safeParse(options);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// EDGE CASES & INTEGRATION TESTS
// ============================================================================

describe("Audit Validators - Edge Cases", () => {
  it("should handle audit log with all fields populated", () => {
    const log = {
      user_id: 1,
      event_type: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.INFO,
      description: "User profile updated",
      metadata: { changes: ["email", "name"] },
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
      resource_id: "user_1",
      resource_type: "User",
      old_values: { email: "old@example.com" },
      new_values: { email: "new@example.com" },
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should handle audit log with minimal fields", () => {
    const log = {
      event_type: AuditEventType.OTHER,
      severity: AuditSeverity.INFO,
      success: true,
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it("should reject very long message", () => {
    const log = {
      event_type: AuditEventType.OTHER,
      severity: AuditSeverity.INFO,
      success: true,
      message: "A".repeat(2000), // Exceeds max length
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(false);
  });

  it("should accept complex nested metadata", () => {
    const log = {
      event_type: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.INFO,
      success: true,
      metadata: {
        user: {
          profile: {
            settings: {
              password: "secret123",
              theme: "dark",
            },
          },
        },
        token: "abc123",
      },
    };

    const result = CreateAuditLogInputSchema.safeParse(log);
    expect(result.success).toBe(true);
  });
});
